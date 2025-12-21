import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { generateVerificationCode, generateResetToken } from "../utils/generateCode";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailService";

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

//*---Register Controller

const register = async (req: Request<{}, {}, RegisterBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      res.status(400).json({ message: "This email is already registered and verified." });
      return;
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.verificationCode = verificationCode;
      existingUser.verificationCodeExpires = verificationCodeExpires;
      await existingUser.save();

      await sendVerificationEmail(email, verificationCode, name);

      res.status(200).json({
        message: "Verification code resent. Please check your email.",
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
        },
      });
    } else {
      const user = await User.create({
        name,
        email,
        password,
        verificationCode,
        verificationCodeExpires,
      });

      await sendVerificationEmail(email, verificationCode, name);

      res.status(201).json({
        message: "User created successfully. Please check your email for verification code.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
//*---Verify Controller

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

    if (!user.verificationCode || user.verificationCode !== verificationCode) {
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
//*---Login Controller

const login = async (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Add this check
    if (!user.isVerified) {
      res.status(403).json({
        message: "Please verify your email before logging in. Check your inbox for the verification code.",
      });
      return;
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

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
//*--- forgot password
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
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    await sendPasswordResetEmail(email, resetToken, user.name);

    res.status(200).json({
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

//*---Reset Password
const resetPassword = async (req: Request<{}, {}, ResetPasswordBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { token, newPassword } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
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
    await user.save();

    res.status(200).json({
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};
//*---Get-Current-User
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
//*--Logout
const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //* Client should delete the token
  res.status(200).json({ message: "Logged out successfully" });
};
//*--Resend Verification

const resendVerification = async (req: Request<{}, {}, ResendVerificationBody>, res: Response, next: NextFunction): Promise<void> => {
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
        message: "If that email exists and is not verified, a new verification code has been sent.",
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        message: "This email is already verified. You can log in.",
      });
      return;
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    await sendVerificationEmail(email, verificationCode, user.name);

    res.status(200).json({
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

export { register, login, verify, forgotPassword, resetPassword, getCurrentUser, logout, resendVerification };
