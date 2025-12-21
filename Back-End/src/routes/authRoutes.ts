import { registerValidator, loginValidator, verifyValidator, forgotPasswordValidator, resetPasswordValidator, resendVerificationValidator } from "../validators/authValidator";
import { register, login, verify, forgotPassword, resetPassword, getCurrentUser, logout, resendVerification } from "../controllers/authController";
import express from "express";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.post("/verify", verifyValidator, verify);
router.post("/forgot-password", forgotPasswordValidator, forgotPassword);
router.post("/reset-password", resetPasswordValidator, resetPassword);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", authMiddleware, logout);
router.post("/resend-verification", resendVerificationValidator, resendVerification);

export default router;
