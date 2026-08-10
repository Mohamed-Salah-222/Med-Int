import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import OAuthExchangeCode from "../models/OAuthExchangeCode";
import { signAuthToken } from "../utils/authToken";
import bcrypt from "bcryptjs";

import { generateVerificationCode, generateResetToken, hashToken } from "../utils/generateCode";
import { sendVerificationEmail, sendPasswordResetEmail, sendAccountExistsEmail } from "../utils/emailService";

//*=====================================================
//* TYPE DEFINITIONS
//*=====================================================

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface VerifyBody {
  email: string;
  verificationCode: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

interface ResendVerificationBody {
  email: string;
}

interface OAuthExchangeBody {
  code: string;
}

//*=====================================================
//* REGISTRATION & VERIFICATION
//*=====================================================

//* Shared by register and resendVerification. Using one string across both
//* endpoints means an attacker cannot compare their replies to learn whether
//* an address exists, or whether it is pending verification or already verified.
const VERIFICATION_DISPATCHED_MESSAGE = "If this email address requires verification, a code has been sent. Please check your inbox.";

//*--- Register New User
const register = async (req: Request<{}, {}, RegisterBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    //* All three branches below answer with exactly the same status and body.
    //* Anything that varies — wording, status code, an echoed user object —
    //* turns this endpoint into an account-existence oracle. What differs is
    //* the email, which only the address owner can read.
    if (existingUser && existingUser.isVerified) {
      //* No verification code for an already-verified account; tell the owner
      //* instead that someone tried to sign up as them.
      await sendAccountExistsEmail(email, existingUser.name);
    } else {
      //* Plaintext goes to the user's inbox; only the hash is persisted.
      const verificationCode = generateVerificationCode();
      const hashedVerificationCode = hashToken(verificationCode);
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      if (existingUser) {
        //* Never overwrite the pending account's name/password from this request —
        //* that would let anyone take over an unverified email. Only resend the code.
        existingUser.verificationCode = hashedVerificationCode;
        existingUser.verificationCodeExpires = verificationCodeExpires;
        await existingUser.save();

        await sendVerificationEmail(email, verificationCode, existingUser.name);
      } else {
        await User.create({
          name,
          email,
          password,
          verificationCode: hashedVerificationCode,
          verificationCodeExpires,
        });

        await sendVerificationEmail(email, verificationCode, name);
      }
    }

    res.status(200).json({ message: VERIFICATION_DISPATCHED_MESSAGE });
  } catch (error) {
    next(error);
  }
};

//*--- Verify Email
const verify = async (req: Request<{}, {}, VerifyBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, verificationCode } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: "Invalid verification code or email" });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: "Email is already verified" });
      return;
    }

    //* Compare hash-to-hash. Exact-match semantics are preserved, so a code with
    //* different casing or stray whitespace still fails, as before.
    if (!user.verificationCode || user.verificationCode !== hashToken(verificationCode)) {
      res.status(400).json({ message: "Invalid verification code" });
      return;
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      res.status(400).json({ message: "Verification code has expired" });
      return;
    }

    user.isVerified = true;
    user.verificationCode = undefined as any;
    user.verificationCodeExpires = undefined as any;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

//*--- Resend Verification Code
const resendVerification = async (req: Request<{}, {}, ResendVerificationBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email } = req.body;

    const user = await User.findOne({ email });

    //* Same uniform reply as register: unknown address, pending account and
    //* verified account are indistinguishable from the outside.
    if (user && !user.isVerified) {
      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

      user.verificationCode = hashToken(verificationCode);
      user.verificationCodeExpires = verificationCodeExpires;
      await user.save();

      //* Plaintext to the inbox, hash to the database.
      await sendVerificationEmail(email, verificationCode, user.name);
    } else if (user) {
      //* Verified already — the owner gets told where to sign in instead.
      await sendAccountExistsEmail(email, user.name);
    }

    res.status(200).json({ message: VERIFICATION_DISPATCHED_MESSAGE });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* AUTHENTICATION
//*=====================================================

//*--- Login User
const login = async (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    //* Single bcrypt comparison. The result is decided here; the verification
    //* check below runs only for a password that has already matched.
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    //* This 403 does reveal that the address exists and is unverified, unlike
    //* register and resendVerification above. It is kept deliberately: the only
    //* route to /verify-email is Register.tsx after a successful signup, so a
    //* generic "invalid email or password" here would strand an unverified user
    //* with no discoverable way to finish verifying. Collapsing this into the
    //* 401 requires the frontend to first offer a "resend verification" path
    //* from the login screen.
    if (!user.isVerified) {
      res.status(403).json({
        message: "Please verify your email before logging in. Check your inbox for the verification code.",
      });
      return;
    }

    //* Carries tokenVersion, which authMiddleware checks against the database on
    //* every request — so a password change, role change or logout revokes it.
    const token = signAuthToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Logout User
const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    //* Bumping tokenVersion is what makes logout real: authMiddleware compares
    //* the token's version against this on every request, so the bearer token
    //* the client just discarded stops working immediately instead of staying
    //* valid until it expires.
    //*
    //* $inc rather than load-modify-save so two concurrent logouts cannot read
    //* the same value and collapse into a single increment.
    //*
    //* NOTE: tokenVersion is per user, not per session, so this signs the user
    //* out of every device at once. See the logout notes in the accompanying
    //* documentation — per-session revocation needs a different mechanism.
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

//*--- Exchange a one-time OAuth code for the real JWT
const exchangeOAuthCode = async (req: Request<{}, {}, OAuthExchangeBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { code } = req.body;

    //* findOneAndDelete is atomic: two requests racing with the same code can
    //* never both receive a token, which is what makes the code single-use.
    //* The expiry is part of the filter because Mongo's TTL reaper is periodic
    //* and an expired document may still be present.
    const record = await OAuthExchangeCode.findOneAndDelete({
      codeHash: hashToken(code),
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      res.status(400).json({ message: "Invalid or expired code" });
      return;
    }

    const user = await User.findById(record.userId);

    if (!user) {
      res.status(400).json({ message: "Invalid or expired code" });
      return;
    }

    //* Minted here rather than stored alongside the code, so the database never
    //* holds a usable credential — and the token picks up the user's current
    //* tokenVersion, not whatever it was when the redirect happened.
    const token = signAuthToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*--- Get Current User
const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findById(userId).select("-password -verificationCode -passwordResetToken");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* PASSWORD RESET
//*=====================================================

//*--- Forgot Password (Request Reset)
const forgotPassword = async (req: Request<{}, {}, ForgotPasswordBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(200).json({
        message: "If that email exists, a password reset link has been sent.",
      });
      return;
    }

    const resetToken = generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    //* Plaintext to the inbox, hash to the database.
    await sendPasswordResetEmail(email, resetToken, user.name);

    res.status(200).json({
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

//*--- Reset Password (Complete Reset)
const resetPassword = async (req: Request<{}, {}, ResetPasswordBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { token, newPassword } = req.body;

    //* Look the user up by the hash of the submitted token. The expiry condition
    //* stays part of the same query, so expired tokens still never match.
    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        message: "Invalid or expired reset token",
      });
      return;
    }

    user.password = newPassword;
    user.passwordResetToken = undefined as any;
    user.passwordResetExpires = undefined as any;
    //* The User pre-save hook bumps tokenVersion on a password change, so any
    //* session an attacker still holds is revoked by the reset itself.
    await user.save();

    res.status(200).json({
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

//*=====================================================
//* EXPORTS
//*=====================================================

export { register, verify, resendVerification, login, logout, getCurrentUser, forgotPassword, resetPassword, exchangeOAuthCode };
