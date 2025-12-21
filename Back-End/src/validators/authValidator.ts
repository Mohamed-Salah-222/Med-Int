import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),

  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

export const loginValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(), body("password").notEmpty().withMessage("Password is required")];

export const verifyValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(), body("verificationCode").trim().notEmpty().withMessage("VerificationCode is Required").isLength({ min: 6, max: 6 }).withMessage("Verification Code must be exactly 6 characters")];

export const forgotPasswordValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail()];

export const resetPasswordValidator = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

export const resendVerificationValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail()];
