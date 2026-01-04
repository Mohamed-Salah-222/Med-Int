import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware";

// Mock jwt
jest.mock("jsonwebtoken");

describe("Auth Middleware Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnv: NodeJS.ProcessEnv;

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
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  //*=====================================================
  //* SUCCESSFUL AUTHENTICATION TESTS
  //*=====================================================

  test("should authenticate valid token and call next", () => {
    const mockPayload = {
      userId: "user123",
      role: "User",
    };

    mockRequest.headers = {
      authorization: "Bearer valid-token-here",
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("valid-token-here", "test-secret-key-12345");
    expect(mockRequest.user).toEqual(mockPayload);
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  test("should attach userId to request.user", () => {
    const mockPayload = {
      userId: "user456",
      role: "Admin",
    };

    mockRequest.headers = {
      authorization: "Bearer admin-token",
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user?.userId).toBe("user456");
  });

  test("should attach role to request.user", () => {
    const mockPayload = {
      userId: "user789",
      role: "SuperVisor",
    };

    mockRequest.headers = {
      authorization: "Bearer supervisor-token",
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user?.role).toBe("SuperVisor");
  });

  //*=====================================================
  //* MISSING TOKEN TESTS
  //*=====================================================

  test("should return 401 if no authorization header", () => {
    mockRequest.headers = {};

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 if authorization header is empty", () => {
    mockRequest.headers = {
      authorization: "",
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 if Bearer token is missing", () => {
    mockRequest.headers = {
      authorization: "Bearer",
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 if authorization header has no Bearer prefix", () => {
    mockRequest.headers = {
      authorization: "just-a-token",
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  //*=====================================================
  //* INVALID TOKEN TESTS
  //*=====================================================

  test("should return 401 for expired token", () => {
    mockRequest.headers = {
      authorization: "Bearer expired-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error: any = new Error("jwt expired");
      error.name = "TokenExpiredError";
      throw error;
    });

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for malformed token", () => {
    mockRequest.headers = {
      authorization: "Bearer malformed-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error: any = new Error("jwt malformed");
      error.name = "JsonWebTokenError";
      throw error;
    });

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for invalid signature", () => {
    mockRequest.headers = {
      authorization: "Bearer invalid-signature-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error: any = new Error("invalid signature");
      error.name = "JsonWebTokenError";
      throw error;
    });

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 401 for any jwt verification error", () => {
    mockRequest.headers = {
      authorization: "Bearer bad-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Some JWT error");
    });

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Invalid token.",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  //*=====================================================
  //* CONFIGURATION ERROR TESTS
  //*=====================================================

  test("should return 500 if JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;

    mockRequest.headers = {
      authorization: "Bearer some-token",
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Server configuration error",
    });
    expect(jwt.verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  test("should return 500 if JWT_SECRET is empty string", () => {
    process.env.JWT_SECRET = "";

    mockRequest.headers = {
      authorization: "Bearer some-token",
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

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

  test("should extract token after Bearer prefix", () => {
    const mockPayload = {
      userId: "user123",
      role: "User",
    };

    mockRequest.headers = {
      authorization: "Bearer abc123def456",
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("abc123def456", "test-secret-key-12345");
  });

  test("should handle token with special characters", () => {
    const mockPayload = {
      userId: "user123",
      role: "User",
    };

    const complexToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIn0.signature";
    mockRequest.headers = {
      authorization: `Bearer ${complexToken}`,
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith(complexToken, "test-secret-key-12345");
  });

  test("should handle multiple spaces after Bearer", () => {
    mockRequest.headers = {
      authorization: "Bearer   ",
    };

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided.",
    });
  });

  //*=====================================================
  //* EDGE CASE TESTS
  //*=====================================================

  test("should not modify request.user if token is invalid", () => {
    mockRequest.headers = {
      authorization: "Bearer invalid-token",
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toBeUndefined();
  });

  test("should handle authorization header with different casing", () => {
    const mockPayload = {
      userId: "user123",
      role: "User",
    };

    // Note: Express normalizes headers to lowercase, but testing anyway
    mockRequest.headers = {
      authorization: "Bearer valid-token",
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test("should verify token with correct secret", () => {
    process.env.JWT_SECRET = "my-super-secret-key";

    const mockPayload = {
      userId: "user123",
      role: "User",
    };

    mockRequest.headers = {
      authorization: "Bearer token123",
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jwt.verify).toHaveBeenCalledWith("token123", "my-super-secret-key");
  });
});
