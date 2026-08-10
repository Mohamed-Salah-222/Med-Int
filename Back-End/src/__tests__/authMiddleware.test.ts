import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware";
import User from "../models/User";

// Mock jwt
jest.mock("jsonwebtoken");
jest.mock("../models/User");

describe("Auth Middleware Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnv: NodeJS.ProcessEnv;

  //* authMiddleware calls User.findById(id).select(...), so the mock has to
  //* return an object exposing a thenable select().
  const mockDbUser = (user: { role: string; tokenVersion: number } | null) => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
  };

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env;

    // Set up test environment
    process.env = {
      ...originalEnv,
      JWT_SECRET: "test-secret-key-12345",
    };

    // Reset mocks
    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();

    //* Default: the account exists and the token is current.
    mockDbUser({ role: "User", tokenVersion: 0 });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  //*=====================================================
  //* SUCCESSFUL AUTHENTICATION TESTS
  //*=====================================================

  test("should authenticate valid token and call next", async () => {
    const mockPayload = {
      userId: "user123",
      role: "User",
      tokenVersion: 0,
    };

    mockRequest.headers = {
      authorization: "Bearer valid-token-here",
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token-here", "test-secret-key-12345");
    expect(mockRequest.user).toEqual({ userId: "user123", role: "User", tokenVersion: 0 });
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  test("should attach userId to request.user", async () => {
    mockRequest.headers = { authorization: "Bearer admin-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user456", role: "Admin", tokenVersion: 0 });
    mockDbUser({ role: "Admin", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user?.userId).toBe("user456");
  });

  test("should attach role to request.user", async () => {
    mockRequest.headers = { authorization: "Bearer supervisor-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user789", role: "SuperVisor", tokenVersion: 0 });
    mockDbUser({ role: "SuperVisor", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user?.role).toBe("SuperVisor");
  });

  //*=====================================================
  //* TOKEN VERSION / ROLE FRESHNESS TESTS
  //*=====================================================

  test("should reject a token whose version is behind the database", async () => {
    mockRequest.headers = { authorization: "Bearer stale-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123", role: "User", tokenVersion: 0 });
    //* Password reset or role change since this token was signed.
    mockDbUser({ role: "User", tokenVersion: 1 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Session expired. Please log in again." });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRequest.user).toBeUndefined();
  });

  test("should reject a token issued before tokenVersion existed", async () => {
    mockRequest.headers = { authorization: "Bearer legacy-token" };
    //* No tokenVersion claim at all.
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123", role: "User" });
    mockDbUser({ role: "User", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should reject a token for a deleted account", async () => {
    mockRequest.headers = { authorization: "Bearer orphan-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "gone", role: "User", tokenVersion: 0 });
    mockDbUser(null);

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: "Invalid token." });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should use the database role, not the role claimed in the token", async () => {
    mockRequest.headers = { authorization: "Bearer privilege-claim-token" };
    //* A token claiming Admin for a user who is only a Student.
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123", role: "Admin", tokenVersion: 0 });
    mockDbUser({ role: "Student", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.user?.role).toBe("Student");
  });

  test("should query only the fields it needs", async () => {
    const select = jest.fn().mockResolvedValue({ role: "User", tokenVersion: 0 });
    (User.findById as jest.Mock).mockReturnValue({ select });
    mockRequest.headers = { authorization: "Bearer valid-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123", role: "User", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(User.findById).toHaveBeenCalledWith("user123");
    expect(select).toHaveBeenCalledWith("role tokenVersion");
  });

  test("should forward database failures to the error handler, not authorise", async () => {
    const dbError = new Error("connection lost");
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockRejectedValue(dbError),
    });
    mockRequest.headers = { authorization: "Bearer valid-token" };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123", role: "User", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(dbError);
    expect(mockRequest.user).toBeUndefined();
  });

  //*=====================================================
  //* MISSING TOKEN TESTS
  //*=====================================================

  test("should return 401 if no authorization header", async () => {
    mockRequest.headers = {};

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 if authorization header is empty", async () => {
    mockRequest.headers = {
      authorization: "",
    };

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 if Bearer token is missing", async () => {
    mockRequest.headers = {
      authorization: "Bearer",
    };

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 if authorization header has no Bearer prefix", async () => {
    mockRequest.headers = {
      authorization: "just-a-token",
    };

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  //*=====================================================
  //* INVALID TOKEN TESTS
  //*=====================================================

  test("should return 401 for expired token", async () => {
    mockRequest.headers = {
      authorization: "Bearer expired-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error: any = new Error("jwt expired");
      error.name = "TokenExpiredError";
      throw error;
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for malformed token", async () => {
    mockRequest.headers = {
      authorization: "Bearer malformed-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error: any = new Error("jwt malformed");
      error.name = "JsonWebTokenError";
      throw error;
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for invalid signature", async () => {
    mockRequest.headers = {
      authorization: "Bearer invalid-signature-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error: any = new Error("invalid signature");
      error.name = "JsonWebTokenError";
      throw error;
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should not hit the database when the signature is invalid", async () => {
    mockRequest.headers = { authorization: "Bearer forged-token" };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid signature");
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(User.findById).not.toHaveBeenCalled();
  });

  test("should return 401 for any jwt verification error", async () => {
    mockRequest.headers = {
      authorization: "Bearer bad-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Some JWT error");
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  //*=====================================================
  //* CONFIGURATION ERROR TESTS
  //*=====================================================

  test("should return 500 if JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;

    mockRequest.headers = {
      authorization: "Bearer some-token",
    };

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Server configuration error",
    });
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 500 if JWT_SECRET is empty string", async () => {
    process.env.JWT_SECRET = "";

    mockRequest.headers = {
      authorization: "Bearer some-token",
    };

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Server configuration error",
    });
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  //*=====================================================
  //* TOKEN EXTRACTION TESTS
  //*=====================================================

  test("should extract token after Bearer prefix", async () => {
    mockRequest.headers = {
      authorization: "Bearer abc123def456",
    };

    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123", role: "User", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("abc123def456", "test-secret-key-12345");
  });

  test("should handle token with special characters", async () => {
    const complexToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIn0.signature";
    mockRequest.headers = {
      authorization: `Bearer ${complexToken}`,
    };

    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123", role: "User", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(complexToken, "test-secret-key-12345");
  });

  test("should handle multiple spaces after Bearer", async () => {
    mockRequest.headers = {
      authorization: "Bearer   ",
    };

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
  });

  //*=====================================================
  //* EDGE CASE TESTS
  //*=====================================================

  test("should not modify request.user if token is invalid", async () => {
    mockRequest.headers = {
      authorization: "Bearer invalid-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
  });

  test("should handle authorization header with different casing", async () => {
    // Note: Express normalizes headers to lowercase, but testing anyway
    mockRequest.headers = {
      authorization: "Bearer valid-token",
    };

    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123", role: "User", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test("should verify token with correct secret", async () => {
    process.env.JWT_SECRET = "my-super-secret-key";

    mockRequest.headers = {
      authorization: "Bearer token123",
    };

    (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123", role: "User", tokenVersion: 0 });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("token123", "my-super-secret-key");
  });
});
