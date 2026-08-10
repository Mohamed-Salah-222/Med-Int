import { registerValidator, loginValidator, verifyValidator, forgotPasswordValidator, resetPasswordValidator, resendVerificationValidator, oauthExchangeValidator } from "../validators/authValidator";
import { register, login, verify, forgotPassword, resetPassword, getCurrentUser, logout, resendVerification, exchangeOAuthCode } from "../controllers/authController";
import express from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  loginLimiter,
  registerLimiter,
  verifyLimiter,
  resendVerificationLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  oauthExchangeLimiter,
} from "../middleware/rateLimiters";

const router = express.Router();

//* Limiters run before validation so malformed payloads still count against
//* the quota — otherwise a brute-forcer gets unlimited free attempts.
router.post("/register", registerLimiter, registerValidator, register);
router.post("/login", loginLimiter, loginValidator, login);
router.post("/verify", verifyLimiter, verifyValidator, verify);
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordValidator, forgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPasswordValidator, resetPassword);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", authMiddleware, logout);
router.post("/resend-verification", resendVerificationLimiter, resendVerificationValidator, resendVerification);

//* Unauthenticated by design: the one-time code is the credential being
//* presented, and the caller has no JWT yet — obtaining one is the point.
router.post("/oauth/exchange", oauthExchangeLimiter, oauthExchangeValidator, exchangeOAuthCode);

export default router;
