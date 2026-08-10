import { body } from "express-validator";

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters")
    .isLength({ max: 100 })
    .withMessage("Name must be at most 100 characters"),

  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    //* Upper bound so an unbounded string never reaches the bcrypt hash.
    .isLength({ max: 128 })
    .withMessage("Password must be at most 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

export const loginValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(), body("password").notEmpty().withMessage("Password is required")];

export const verifyValidator = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  //* generateVerificationCode() emits a 6-digit number, so anything else is
  //* rejected before it reaches the database lookup.
  body("verificationCode")
    .trim()
    .notEmpty()
    .withMessage("VerificationCode is Required")
    .matches(/^[0-9]{6}$/)
    .withMessage("Verification code must be exactly 6 digits"),
];

export const forgotPasswordValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail()];

export const resetPasswordValidator = [
  //* generateResetToken() is randomBytes(32).toString("hex") — always 64 hex
  //* characters. Both cases are accepted so a link normalised to uppercase by
  //* a mail client still validates; a wrong-case token simply fails the hash
  //* comparison later rather than being rejected as malformed here.
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required")
    .matches(/^[a-fA-F0-9]{64}$/)
    .withMessage("Reset token is not valid"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    //* Upper bound so an unbounded string never reaches the bcrypt hash.
    .isLength({ max: 128 })
    .withMessage("Password must be at most 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

export const resendVerificationValidator = [body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Please provide a valid email").normalizeEmail()];

//* Codes are crypto.randomBytes(32).toString("hex") — always 64 hex characters.
//* Rejecting anything else keeps malformed input away from the database lookup.
export const oauthExchangeValidator = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .matches(/^[a-fA-F0-9]{64}$/)
    .withMessage("Code is not valid"),
];
