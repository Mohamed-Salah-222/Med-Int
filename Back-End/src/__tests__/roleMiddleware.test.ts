import { Request, Response, NextFunction } from "express";
import { isSuperVisor, requireStudent, requireAdmin } from "../middleware/roleMiddleware";

describe("Role Middleware Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock; // ✅ Changed from NextFunction to jest.Mock

  beforeEach(() => {
    mockRequest = {
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn(); // ✅ This is already correct

    jest.clearAllMocks();
  });

  //*=====================================================
  //* isSuperVisor MIDDLEWARE TESTS
  //*=====================================================

  describe("isSuperVisor", () => {
    test("should allow SuperVisor role and call next", () => {
      mockRequest.user = {
        userId: "user123",
        role: "SuperVisor",
      };

      isSuperVisor(mockRequest as Request, mockResponse as Response, mockNext as NextFunction); // ✅ Cast here

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should deny Admin role", () => {
      mockRequest.user = {
        userId: "admin123",
        role: "Admin",
      };

      isSuperVisor(mockRequest as Request, mockResponse as Response, mockNext as NextFunction); // ✅ Cast here

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied. SuperVisors only.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should deny Student role", () => {
      mockRequest.user = {
        userId: "student123",
        role: "Student",
      };

      isSuperVisor(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied. SuperVisors only.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should deny User role", () => {
      mockRequest.user = {
        userId: "user456",
        role: "User",
      };

      isSuperVisor(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied. SuperVisors only.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should deny if no user attached", () => {
      mockRequest.user = undefined;

      isSuperVisor(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied. SuperVisors only.",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should deny if role is undefined", () => {
      mockRequest.user = {
        userId: "user789",
        role: undefined as any,
      };

      isSuperVisor(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should be case-sensitive for role check", () => {
      mockRequest.user = {
        userId: "user123",
        role: "supervisor", // lowercase
      };

      isSuperVisor(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  //*=====================================================
  //* requireStudent MIDDLEWARE TESTS
  //*=====================================================

  describe("requireStudent", () => {
    test("should allow Student role and call next", () => {
      mockRequest.user = {
        userId: "student123",
        role: "Student",
      };

      requireStudent(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should allow Admin role and call next", () => {
      mockRequest.user = {
        userId: "admin123",
        role: "Admin",
      };

      requireStudent(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should allow SuperVisor role and call next", () => {
      mockRequest.user = {
        userId: "supervisor123",
        role: "SuperVisor",
      };

      requireStudent(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should deny User role", () => {
      mockRequest.user = {
        userId: "user123",
        role: "User",
      };

      requireStudent(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied. Student subscription required.",
        userRole: "User",
        requiredRole: "Student",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 401 if no user attached", () => {
      mockRequest.user = undefined;

      requireStudent(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Authentication required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 401 if role is undefined", () => {
      mockRequest.user = {
        userId: "user123",
        role: undefined as any,
      };

      requireStudent(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Authentication required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should include userRole in 403 response", () => {
      mockRequest.user = {
        userId: "user456",
        role: "Guest",
      };

      requireStudent(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.userRole).toBe("Guest");
      expect(jsonCall.requiredRole).toBe("Student");
    });

    test("should be case-sensitive for role check", () => {
      mockRequest.user = {
        userId: "student123",
        role: "student", // lowercase
      };

      requireStudent(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  //*=====================================================
  //* requireAdmin MIDDLEWARE TESTS
  //*=====================================================

  describe("requireAdmin", () => {
    test("should allow Admin role and call next", () => {
      mockRequest.user = {
        userId: "admin123",
        role: "Admin",
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should allow SuperVisor role and call next", () => {
      mockRequest.user = {
        userId: "supervisor123",
        role: "SuperVisor",
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should deny Student role", () => {
      mockRequest.user = {
        userId: "student123",
        role: "Student",
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied. Admin privileges required.",
        userRole: "Student",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should deny User role", () => {
      mockRequest.user = {
        userId: "user123",
        role: "User",
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Access denied. Admin privileges required.",
        userRole: "User",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 401 if no user attached", () => {
      mockRequest.user = undefined;

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Authentication required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should return 401 if role is undefined", () => {
      mockRequest.user = {
        userId: "user123",
        role: undefined as any,
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Authentication required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should include userRole in 403 response", () => {
      mockRequest.user = {
        userId: "guest123",
        role: "Guest",
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.userRole).toBe("Guest");
      expect(jsonCall.message).toBe("Access denied. Admin privileges required.");
    });

    test("should be case-sensitive for role check", () => {
      mockRequest.user = {
        userId: "admin123",
        role: "admin", // lowercase
      };

      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  //*=====================================================
  //* ROLE HIERARCHY TESTS
  //*=====================================================

  describe("Role Hierarchy", () => {
    test("isSuperVisor - only SuperVisor can access", () => {
      const roles = ["User", "Student", "Admin", "SuperVisor"];
      const allowedRoles = ["SuperVisor"];

      roles.forEach((role) => {
        mockRequest.user = { userId: "test", role };
        mockNext.mockClear();
        (mockResponse.status as jest.Mock).mockClear();

        isSuperVisor(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        if (allowedRoles.includes(role)) {
          expect(mockNext).toHaveBeenCalled();
        } else {
          expect(mockResponse.status).toHaveBeenCalledWith(403);
        }
      });
    });

    test("requireStudent - Student, Admin, SuperVisor can access", () => {
      const roles = ["User", "Student", "Admin", "SuperVisor"];
      const allowedRoles = ["Student", "Admin", "SuperVisor"];

      roles.forEach((role) => {
        mockRequest.user = { userId: "test", role };
        mockNext.mockClear();
        (mockResponse.status as jest.Mock).mockClear();

        requireStudent(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        if (allowedRoles.includes(role)) {
          expect(mockNext).toHaveBeenCalled();
        } else {
          expect(mockResponse.status).toHaveBeenCalledWith(403);
        }
      });
    });

    test("requireAdmin - Admin, SuperVisor can access", () => {
      const roles = ["User", "Student", "Admin", "SuperVisor"];
      const allowedRoles = ["Admin", "SuperVisor"];

      roles.forEach((role) => {
        mockRequest.user = { userId: "test", role };
        mockNext.mockClear();
        (mockResponse.status as jest.Mock).mockClear();

        requireAdmin(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        if (allowedRoles.includes(role)) {
          expect(mockNext).toHaveBeenCalled();
        } else {
          expect(mockResponse.status).toHaveBeenCalledWith(403);
        }
      });
    });
  });
});
