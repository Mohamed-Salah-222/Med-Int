import { Request, Response, NextFunction } from "express";
import { register, verify, resendVerification, login, logout, getCurrentUser, forgotPassword, resetPassword } from "../controllers/authController";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import crypto from "crypto";
import { generateVerificationCode, generateResetToken } from "../utils/generateCode";
import { sendVerificationEmail, sendPasswordResetEmail, sendAccountExistsEmail } from "../utils/emailService";

// Mock dependencies
jest.mock("../models/User");
jest.mock("jsonwebtoken");
jest.mock("express-validator");
//* Only the random generators are stubbed — hashToken keeps its real
//* implementation so these tests assert against genuine SHA-256 digests.
jest.mock("../utils/generateCode", () => ({
  ...jest.requireActual("../utils/generateCode"),
  generateVerificationCode: jest.fn(),
  generateResetToken: jest.fn(),
}));
jest.mock("../utils/emailService");

//* Independent SHA-256 so the tests don't just mirror the implementation.
const sha256 = (value: string): string => crypto.createHash("sha256").update(value).digest("hex");

//* The single reply register and resendVerification give for every account
//* state. Written out literally rather than imported, so that changing the
//* controller's copy fails these tests instead of silently moving with them.
const GENERIC_VERIFICATION_MESSAGE = "If this email address requires verification, a code has been sent. Please check your inbox.";

//*=====================================================
//* TYPE DEFINITIONS FOR MOCKS
//*=====================================================

interface MockUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  isVerified: boolean;
  tokenVersion?: number;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  save: jest.Mock;
  comparePassword?: jest.Mock;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      role: string;
    };
  }
}

describe("Auth Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Default mock for validation
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  //*=====================================================
  //* REGISTRATION TESTS
  //*=====================================================

  describe("register", () => {
    const mockUserData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    beforeEach(() => {
      mockRequest.body = mockUserData;
      (generateVerificationCode as jest.Mock).mockReturnValue("123456");
    });

    test("should create new user and send verification email", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        _id: "user123",
        name: mockUserData.name,
        email: mockUserData.email,
        role: "User",
        isVerified: false,
        save: jest.fn(),
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockUserData.email });
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockUserData.name,
          email: mockUserData.email,
          password: mockUserData.password,
          verificationCode: sha256("123456"),
        })
      );
      //* Hash persisted, plaintext emailed.
      expect(User.create).not.toHaveBeenCalledWith(expect.objectContaining({ verificationCode: "123456" }));
      expect(sendVerificationEmail).toHaveBeenCalledWith(mockUserData.email, "123456", mockUserData.name);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: GENERIC_VERIFICATION_MESSAGE });
    });

    test("should return 400 for validation errors", async () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: "Invalid email" }]),
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        errors: [{ msg: "Invalid email" }],
      });
    });

    test("should not reveal that an email is already registered and verified", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: mockUserData.email,
        name: "John Doe",
        role: "User",
        isVerified: true,
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      //* Identical reply to the new-signup case.
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: GENERIC_VERIFICATION_MESSAGE });
      //* No account is touched and no verification code is issued...
      expect(mockUser.save).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
      //* ...but the real owner is told out-of-band.
      expect(sendAccountExistsEmail).toHaveBeenCalledWith(mockUserData.email, "John Doe");
    });

    test("should resend code without overwriting an unverified user's name or password", async () => {
      const existingUser: Partial<MockUser> = {
        _id: "user123",
        email: mockUserData.email,
        isVerified: false,
        name: "Old Name",
        password: "oldpass",
        role: "User",
        verificationCode: "oldcode",
        verificationCodeExpires: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(existingUser);

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(existingUser.name).toBe("Old Name");
      expect(existingUser.password).toBe("oldpass");
      expect(existingUser.verificationCode).toBe(sha256("123456"));
      expect(existingUser.save).toHaveBeenCalled();
      expect(sendVerificationEmail).toHaveBeenCalledWith(mockUserData.email, "123456", "Old Name");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: GENERIC_VERIFICATION_MESSAGE });
    });

    test("should set verification code expiry to 10 minutes", async () => {
      const now = Date.now();
      jest.spyOn(Date, "now").mockReturnValue(now);

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({
        _id: "user123",
        name: mockUserData.name,
        email: mockUserData.email,
        role: "User",
        isVerified: false,
      });

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      const expectedExpiry = new Date(now + 10 * 60 * 1000);
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationCodeExpires: expectedExpiry,
        })
      );
    });

    test("should call next on error", async () => {
      const error = new Error("Database error");
      (User.findOne as jest.Mock).mockRejectedValue(error);

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  //*=====================================================
  //* EMAIL VERIFICATION TESTS
  //*=====================================================

  describe("verify", () => {
    const mockVerifyData = {
      email: "john@example.com",
      verificationCode: "123456",
    };

    beforeEach(() => {
      mockRequest.body = mockVerifyData;
    });

    test("should verify email with correct code", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: mockVerifyData.email,
        name: "John Doe",
        role: "User",
        isVerified: false,
        verificationCode: sha256("123456"),
        verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await verify(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.verificationCode).toBeUndefined();
      expect(mockUser.verificationCodeExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Email verified successfully. You can now log in.",
      });
    });

    test("should return 400 for invalid verification code", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: mockVerifyData.email,
        name: "John Doe",
        role: "User",
        isVerified: false,
        verificationCode: sha256("wrongcode"),
        verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await verify(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid verification code",
      });
    });

    test("should return 400 for expired verification code", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: mockVerifyData.email,
        name: "John Doe",
        role: "User",
        isVerified: false,
        verificationCode: sha256("123456"),
        verificationCodeExpires: new Date(Date.now() - 1000),
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await verify(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Verification code has expired",
      });
    });

    test("should return 400 if email already verified", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: mockVerifyData.email,
        name: "John Doe",
        role: "User",
        isVerified: true,
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await verify(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Email is already verified",
      });
    });

    test("should return 400 if user not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await verify(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid verification code or email",
      });
    });
  });

  //*=====================================================
  //* RESEND VERIFICATION TESTS
  //*=====================================================

  describe("resendVerification", () => {
    beforeEach(() => {
      mockRequest.body = { email: "john@example.com" };
      (generateVerificationCode as jest.Mock).mockReturnValue("654321");
    });

    test("should generate new code and send email", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: "john@example.com",
        name: "John Doe",
        role: "User",
        isVerified: false,
        verificationCode: "oldcode",
        verificationCodeExpires: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await resendVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUser.verificationCode).toBe(sha256("654321"));
      expect(mockUser.verificationCode).not.toBe("654321");
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendVerificationEmail).toHaveBeenCalledWith(mockUser.email, "654321", mockUser.name);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: GENERIC_VERIFICATION_MESSAGE });
    });

    test("should not reveal that an email is already verified", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: "john@example.com",
        name: "John Doe",
        role: "User",
        isVerified: true,
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await resendVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: GENERIC_VERIFICATION_MESSAGE });
      expect(mockUser.save).not.toHaveBeenCalled();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
      expect(sendAccountExistsEmail).toHaveBeenCalledWith("john@example.com", "John Doe");
    });

    test("should return generic message if user not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await resendVerification(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: GENERIC_VERIFICATION_MESSAGE });
      expect(sendVerificationEmail).not.toHaveBeenCalled();
      expect(sendAccountExistsEmail).not.toHaveBeenCalled();
    });
  });

  //*=====================================================
  //* ACCOUNT ENUMERATION
  //*=====================================================

  describe("account enumeration resistance", () => {
    //* Drives a handler with a fresh response double and reports exactly what
    //* the caller would observe, so the three account states can be compared.
    const observe = async (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>, body: object, found: Partial<MockUser> | null) => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      (User.findOne as jest.Mock).mockResolvedValue(found);
      (User.create as jest.Mock).mockResolvedValue({ _id: "new", ...body });

      await handler({ ...mockRequest, body } as Request, res as unknown as Response, mockNext);

      return {
        status: (res.status as jest.Mock).mock.calls[0]?.[0],
        body: (res.json as jest.Mock).mock.calls[0]?.[0],
      };
    };

    const unverified = (): Partial<MockUser> => ({
      _id: "user123",
      email: "john@example.com",
      name: "Pending Person",
      role: "User",
      isVerified: false,
      save: jest.fn().mockResolvedValue(true),
    });

    const verified = (): Partial<MockUser> => ({
      _id: "user123",
      email: "john@example.com",
      name: "Verified Person",
      role: "User",
      isVerified: true,
      save: jest.fn().mockResolvedValue(true),
    });

    test("register replies identically for new, pending and verified emails", async () => {
      const body = { name: "John Doe", email: "john@example.com", password: "password123" };

      const brandNew = await observe(register, body, null);
      const pending = await observe(register, body, unverified());
      const alreadyVerified = await observe(register, body, verified());

      expect(brandNew).toEqual(pending);
      expect(pending).toEqual(alreadyVerified);
      expect(brandNew).toEqual({ status: 200, body: { message: GENERIC_VERIFICATION_MESSAGE } });
    });

    test("resendVerification replies identically for unknown, pending and verified emails", async () => {
      const body = { email: "john@example.com" };

      const unknown = await observe(resendVerification, body, null);
      const pending = await observe(resendVerification, body, unverified());
      const alreadyVerified = await observe(resendVerification, body, verified());

      expect(unknown).toEqual(pending);
      expect(pending).toEqual(alreadyVerified);
      expect(unknown).toEqual({ status: 200, body: { message: GENERIC_VERIFICATION_MESSAGE } });
    });

    test("register and resendVerification cannot be cross-referenced", async () => {
      //* Both endpoints must answer with the same string, otherwise an attacker
      //* compares one against the other to recover the account's state.
      const fromRegister = await observe(register, { name: "John Doe", email: "john@example.com", password: "password123" }, verified());
      const fromResend = await observe(resendVerification, { email: "john@example.com" }, verified());

      expect(fromRegister).toEqual(fromResend);
    });
  });

  //*=====================================================
  //* LOGIN TESTS
  //*=====================================================

  describe("login", () => {
    const mockLoginData = {
      email: "john@example.com",
      password: "password123",
    };

    beforeEach(() => {
      mockRequest.body = mockLoginData;
      process.env.JWT_SECRET = "test-secret";
    });

    test("should return JWT token on successful login", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        name: "John Doe",
        email: mockLoginData.email,
        role: "User",
        isVerified: true,
        //* Signed into the token so authMiddleware can compare it per request.
        tokenVersion: 3,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      (jwt.sign as jest.Mock).mockReturnValue("mock-jwt-token");

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.sign).toHaveBeenCalledWith({ userId: "user123", role: "User", tokenVersion: 3 }, "test-secret", { expiresIn: "1d" });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Login successful",
          token: "mock-jwt-token",
        })
      );
    });

    test("should return 401 for invalid email", async () => {
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid email or password",
      });
    });

    test("should return 401 for invalid password", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: mockLoginData.email,
        name: "John Doe",
        role: "User",
        isVerified: true,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    test("should return 403 if email not verified", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: mockLoginData.email,
        name: "John Doe",
        role: "User",
        isVerified: false,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Please verify your email before logging in. Check your inbox for the verification code.",
      });
    });

    test("should include user data in response", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        name: "John Doe",
        email: mockLoginData.email,
        role: "Student",
        isVerified: true,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      (jwt.sign as jest.Mock).mockReturnValue("token");

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: {
            id: "user123",
            name: "John Doe",
            email: mockLoginData.email,
            role: "Student",
          },
        })
      );
    });
  });

  //*=====================================================
  //* LOGOUT TESTS
  //*=====================================================

  describe("logout", () => {
    test("should revoke the caller's tokens and return success", async () => {
      mockRequest.user = { userId: "user123", role: "Student" };
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: "user123", tokenVersion: 1 });

      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      //* $inc rather than a read-modify-write, so concurrent logouts cannot
      //* collapse into a single increment.
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user123", { $inc: { tokenVersion: 1 } });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Logged out successfully",
      });
    });

    test("should return 401 when unauthenticated", async () => {
      mockRequest.user = undefined;

      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test("should forward database failures to the error handler", async () => {
      const dbError = new Error("connection lost");
      mockRequest.user = { userId: "user123", role: "Student" };
      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(dbError);

      await logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  //*=====================================================
  //* GET CURRENT USER TESTS
  //*=====================================================

  describe("getCurrentUser", () => {
    test("should return current user data", async () => {
      mockRequest.user = { userId: "user123", role: "Student" };

      const mockUser: Partial<MockUser> = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
        role: "Student",
        isVerified: true,
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: "user123",
          name: "John Doe",
          email: "john@example.com",
        }),
      });
    });

    test("should return 401 if not authenticated", async () => {
      mockRequest.user = undefined;

      await getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });
    });

    test("should return 404 if user not found", async () => {
      mockRequest.user = { userId: "user123", role: "Student" };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });
  });

  //*=====================================================
  //* FORGOT PASSWORD TESTS
  //*=====================================================

  describe("forgotPassword", () => {
    beforeEach(() => {
      mockRequest.body = { email: "john@example.com" };
      (generateResetToken as jest.Mock).mockReturnValue("reset-token-123");
    });

    test("should generate reset token and send email", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: "john@example.com",
        name: "John Doe",
        role: "User",
        isVerified: true,
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      //* DB holds only the hash; the plaintext token goes out by email.
      expect(mockUser.passwordResetToken).toBe(sha256("reset-token-123"));
      expect(mockUser.passwordResetToken).not.toBe("reset-token-123");
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalledWith("john@example.com", "reset-token-123", "John Doe");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    test("should return generic message for non-existent email", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "If that email exists, a password reset link has been sent.",
      });
    });

    test("should set reset token expiry to 1 hour", async () => {
      const now = Date.now();
      jest.spyOn(Date, "now").mockReturnValue(now);

      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: "john@example.com",
        name: "John Doe",
        role: "User",
        isVerified: true,
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

      const expectedExpiry = new Date(now + 60 * 60 * 1000);
      expect(mockUser.passwordResetExpires).toEqual(expectedExpiry);
    });
  });

  //*=====================================================
  //* RESET PASSWORD TESTS
  //*=====================================================

  describe("resetPassword", () => {
    const mockResetData = {
      token: "reset-token-123",
      newPassword: "newPassword456",
    };

    beforeEach(() => {
      mockRequest.body = mockResetData;
    });

    test("should update password with valid token", async () => {
      const mockUser: Partial<MockUser> = {
        _id: "user123",
        email: "john@example.com",
        name: "John Doe",
        role: "User",
        isVerified: true,
        password: "oldPassword",
        passwordResetToken: "reset-token-123",
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      //* Lookup is by hash of the submitted token, with expiry still in the query.
      expect(User.findOne).toHaveBeenCalledWith({
        passwordResetToken: sha256("reset-token-123"),
        passwordResetExpires: { $gt: expect.any(Date) },
      });
      expect(mockUser.password).toBe("newPassword456");
      //* Single-use: the stored hash and expiry are cleared on success.
      expect(mockUser.passwordResetToken).toBeUndefined();
      expect(mockUser.passwordResetExpires).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Password reset successful. You can now log in with your new password.",
      });
    });

    test("should not find a user when the raw token is stored-value-matched", async () => {
      //* Guards the regression where the plaintext token is queried directly:
      //* the query must never contain the un-hashed value.
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(User.findOne).not.toHaveBeenCalledWith(expect.objectContaining({ passwordResetToken: "reset-token-123" }));
    });

    test("should return 400 for invalid token", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid or expired reset token",
      });
    });

    test("should return 400 for expired token", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  //*=====================================================
  //* EXTENDED EDGE CASE TESTS
  //*=====================================================

  describe("Extended Edge Cases", () => {
    //*--- REGISTRATION EDGE CASES ---
    describe("register - Edge Cases", () => {
      beforeEach(() => {
        (generateVerificationCode as jest.Mock).mockReturnValue("123456");
      });

      test("should handle database save failure on new user creation", async () => {
        mockRequest.body = {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        };

        (User.findOne as jest.Mock).mockResolvedValue(null);
        const dbError = new Error("Database connection failed");
        (User.create as jest.Mock).mockRejectedValue(dbError);

        await register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      test("should handle email sending failure gracefully", async () => {
        mockRequest.body = {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        };

        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({
          _id: "user123",
          name: "John Doe",
          email: "john@example.com",
          role: "User",
          isVerified: false,
        });

        const emailError = new Error("SMTP connection failed");
        (sendVerificationEmail as jest.Mock).mockRejectedValue(emailError);

        await register(mockRequest as Request, mockResponse as Response, mockNext);

        // Should still fail and call next with error
        expect(mockNext).toHaveBeenCalledWith(emailError);
      });

      test("should handle missing required fields", async () => {
        mockRequest.body = {
          name: "John Doe",
          email: "", // Missing email
          password: "password123",
        };

        (validationResult as unknown as jest.Mock).mockReturnValue({
          isEmpty: jest.fn().mockReturnValue(false),
          array: jest.fn().mockReturnValue([{ msg: "Email is required", param: "email" }]),
        });

        await register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          errors: [{ msg: "Email is required", param: "email" }],
        });
      });

      test("should handle malformed email addresses", async () => {
        mockRequest.body = {
          name: "John Doe",
          email: "not-an-email",
          password: "password123",
        };

        (validationResult as unknown as jest.Mock).mockReturnValue({
          isEmpty: jest.fn().mockReturnValue(false),
          array: jest.fn().mockReturnValue([{ msg: "Invalid email format", param: "email" }]),
        });

        await register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });

      test("should handle weak password validation", async () => {
        mockRequest.body = {
          name: "John Doe",
          email: "john@example.com",
          password: "123", // Too short
        };

        (validationResult as unknown as jest.Mock).mockReturnValue({
          isEmpty: jest.fn().mockReturnValue(false),
          array: jest.fn().mockReturnValue([{ msg: "Password must be at least 6 characters", param: "password" }]),
        });

        await register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });

      test("should handle concurrent registration attempts", async () => {
        mockRequest.body = {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        };

        // First call returns null, second call (race condition) returns existing user
        let callCount = 0;
        (User.findOne as jest.Mock).mockImplementation(() => {
          callCount++;
          return callCount === 1
            ? Promise.resolve(null)
            : Promise.resolve({
                _id: "user123",
                email: "john@example.com",
                isVerified: false,
                role: "User",
                save: jest.fn(),
              });
        });

        (User.create as jest.Mock).mockResolvedValue({
          _id: "user123",
          name: "John Doe",
          email: "john@example.com",
          role: "User",
          isVerified: false,
        });

        await register(mockRequest as Request, mockResponse as Response, mockNext);

        expect(User.create).toHaveBeenCalled();
        expect(sendVerificationEmail).toHaveBeenCalled();
      });
    });

    //*--- VERIFICATION EDGE CASES ---
    describe("verify - Edge Cases", () => {
      test("should handle null verification code", async () => {
        mockRequest.body = {
          email: "john@example.com",
          verificationCode: "123456",
        };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: false,
          verificationCode: undefined, // Code is null/undefined
          verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
          save: jest.fn(),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await verify(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Invalid verification code",
        });
      });

      test("should handle null expiry date", async () => {
        mockRequest.body = {
          email: "john@example.com",
          verificationCode: "123456",
        };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: false,
          verificationCode: sha256("123456"),
          verificationCodeExpires: undefined, // Expiry is null
          save: jest.fn(),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await verify(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Verification code has expired",
        });
      });

      test("should handle database save failure during verification", async () => {
        mockRequest.body = {
          email: "john@example.com",
          verificationCode: "123456",
        };

        const saveError = new Error("Database write failed");
        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: false,
          verificationCode: sha256("123456"),
          verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
          save: jest.fn().mockRejectedValue(saveError),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await verify(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(saveError);
      });

      test("should handle case-sensitive verification code", async () => {
        mockRequest.body = {
          email: "john@example.com",
          verificationCode: "ABC123", // Uppercase
        };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: false,
          verificationCode: sha256("abc123"), // Lowercase in DB
          verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
          save: jest.fn(),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await verify(mockRequest as Request, mockResponse as Response, mockNext);

        // Should fail due to case mismatch
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Invalid verification code",
        });
      });

      test("should handle verification code with whitespace", async () => {
        mockRequest.body = {
          email: "john@example.com",
          verificationCode: " 123456 ", // With spaces
        };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: false,
          verificationCode: sha256("123456"),
          verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
          save: jest.fn(),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await verify(mockRequest as Request, mockResponse as Response, mockNext);

        // Should fail due to whitespace
        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });
    });

    //*--- LOGIN EDGE CASES ---
    describe("login - Edge Cases", () => {
      beforeEach(() => {
        process.env.JWT_SECRET = "test-secret";
      });

      test("should handle missing JWT_SECRET environment variable", async () => {
        delete process.env.JWT_SECRET;

        mockRequest.body = {
          email: "john@example.com",
          password: "password123",
        };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          name: "John Doe",
          email: "john@example.com",
          role: "User",
          isVerified: true,
          comparePassword: jest.fn().mockResolvedValue(true),
        };

        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser),
        });

        const jwtError = new Error("secretOrPrivateKey must have a value");
        (jwt.sign as jest.Mock).mockImplementation(() => {
          throw jwtError;
        });

        await login(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(jwtError);

        // Restore for other tests
        process.env.JWT_SECRET = "test-secret";
      });

      test("should handle database query failure", async () => {
        mockRequest.body = {
          email: "john@example.com",
          password: "password123",
        };

        const dbError = new Error("Database connection lost");
        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockRejectedValue(dbError),
        });

        await login(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });

      test("should handle password comparison failure", async () => {
        mockRequest.body = {
          email: "john@example.com",
          password: "password123",
        };

        const compareError = new Error("bcrypt comparison failed");
        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: true,
          comparePassword: jest.fn().mockRejectedValue(compareError),
        };

        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser),
        });

        await login(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(compareError);
      });

      test("should handle SQL injection attempts in email", async () => {
        mockRequest.body = {
          email: "admin' OR '1'='1",
          password: "password123",
        };

        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        });

        await login(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Invalid email or password",
        });
      });

      test("should handle extremely long password attempts", async () => {
        mockRequest.body = {
          email: "john@example.com",
          password: "a".repeat(10000), // 10k character password
        };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: true,
          comparePassword: jest.fn().mockResolvedValue(false),
        };

        (User.findOne as jest.Mock).mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser),
        });

        await login(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
      });
    });

    //*--- PASSWORD RESET EDGE CASES ---
    describe("forgotPassword - Edge Cases", () => {
      beforeEach(() => {
        (generateResetToken as jest.Mock).mockReturnValue("reset-token-123");
      });

      test("should handle token generation failure", async () => {
        mockRequest.body = { email: "john@example.com" };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: true,
          save: jest.fn().mockResolvedValue(true),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const tokenError = new Error("Random generation failed");
        (generateResetToken as jest.Mock).mockImplementation(() => {
          throw tokenError;
        });

        await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(tokenError);
      });

      test("should handle email service being down", async () => {
        mockRequest.body = { email: "john@example.com" };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: true,
          passwordResetToken: undefined,
          passwordResetExpires: undefined,
          save: jest.fn().mockResolvedValue(true),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        const emailError = new Error("Email service unavailable");
        (sendPasswordResetEmail as jest.Mock).mockRejectedValue(emailError);

        await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(emailError);
      });

      test("should handle multiple rapid reset requests", async () => {
        mockRequest.body = { email: "john@example.com" };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: true,
          passwordResetToken: "old-token",
          passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000), // Still valid
          save: jest.fn().mockResolvedValue(true),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await forgotPassword(mockRequest as Request, mockResponse as Response, mockNext);

        // Should overwrite old token with the hash of the new one
        expect(mockUser.passwordResetToken).toBe(sha256("reset-token-123"));
        expect(mockUser.save).toHaveBeenCalled();
      });
    });

    //*--- RESET PASSWORD EDGE CASES ---
    describe("resetPassword - Edge Cases", () => {
      test("should handle exactly expired token (boundary)", async () => {
        const now = Date.now();
        jest.spyOn(Date, "now").mockReturnValue(now);

        mockRequest.body = {
          token: "reset-token-123",
          newPassword: "newPassword456",
        };

        // Token expires at exactly this moment
        const mockUser: Partial<MockUser> = {
          _id: "user123",
          passwordResetToken: "reset-token-123",
          passwordResetExpires: new Date(now), // Exactly now
        };

        // findOne with { $gt: new Date() } should return null
        (User.findOne as jest.Mock).mockResolvedValue(null);

        await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          message: "Invalid or expired reset token",
        });
      });

      test("should handle password hashing failure on save", async () => {
        mockRequest.body = {
          token: "reset-token-123",
          newPassword: "newPassword456",
        };

        const hashError = new Error("bcrypt hashing failed");
        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: true,
          password: "oldPassword",
          passwordResetToken: "reset-token-123",
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
          save: jest.fn().mockRejectedValue(hashError),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(hashError);
      });

      test("should handle empty new password", async () => {
        mockRequest.body = {
          token: "reset-token-123",
          newPassword: "",
        };

        (validationResult as unknown as jest.Mock).mockReturnValue({
          isEmpty: jest.fn().mockReturnValue(false),
          array: jest.fn().mockReturnValue([{ msg: "New password is required", param: "newPassword" }]),
        });

        await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
      });

      test("should handle same password as old password", async () => {
        // Note: This should be validated at the model/controller level
        // For now, we're just testing it doesn't break
        mockRequest.body = {
          token: "reset-token-123",
          newPassword: "oldPassword123",
        };

        const mockUser: Partial<MockUser> = {
          _id: "user123",
          email: "john@example.com",
          name: "John Doe",
          role: "User",
          isVerified: true,
          password: "oldPassword123",
          passwordResetToken: "reset-token-123",
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
          save: jest.fn().mockResolvedValue(true),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUser);

        await resetPassword(mockRequest as Request, mockResponse as Response, mockNext);

        // Should still work (no validation preventing same password)
        expect(mockUser.password).toBe("oldPassword123");
        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });
    });

    //*--- GET CURRENT USER EDGE CASES ---
    describe("getCurrentUser - Edge Cases", () => {
      test("should handle malformed userId in token", async () => {
        mockRequest.user = { userId: "invalid-id-format", role: "User" };

        const dbError = new Error("Cast to ObjectId failed");
        (User.findById as jest.Mock).mockReturnValue({
          select: jest.fn().mockRejectedValue(dbError),
        });

        await getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });

      test("should handle database read failure", async () => {
        mockRequest.user = { userId: "user123", role: "User" };

        const dbError = new Error("Database read timeout");
        (User.findById as jest.Mock).mockReturnValue({
          select: jest.fn().mockRejectedValue(dbError),
        });

        await getCurrentUser(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(dbError);
      });
    });
  });
});
