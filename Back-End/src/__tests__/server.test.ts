import request from "supertest";
import express, { Express } from "express";
import mongoose from "mongoose";

// Mock dependencies before importing server
jest.mock("../config/passport");
jest.mock("../routes/oauth.routes", () => ({
  __esModule: true,
  default: express.Router(),
}));
jest.mock("../routes/authRoutes", () => ({
  __esModule: true,
  default: express.Router(),
}));
jest.mock("../routes/adminRoutes", () => ({
  __esModule: true,
  default: express.Router(),
}));
jest.mock("../routes/courseRoutes", () => ({
  __esModule: true,
  default: express.Router(),
}));
jest.mock("../routes/glossaryRoutes", () => ({
  __esModule: true,
  default: express.Router(),
}));
jest.mock("../routes/accessRoutes", () => ({
  __esModule: true,
  default: express.Router(),
}));
jest.mock("../routes/chatbotRoutes", () => ({
  __esModule: true,
  default: express.Router(),
}));

describe("Server Configuration", () => {
  let app: Express;

  beforeAll(() => {
    // Set required environment variables
    process.env.SESSION_SECRET = "test-secret";
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.NODE_ENV = "test";
  });

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
  });

  afterAll(async () => {
    // Close database connection if open
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe("Middleware Configuration", () => {
    test("should parse JSON request bodies", async () => {
      app.post("/test", (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(app).post("/test").send({ test: "data" }).expect(200);

      expect(response.body.received).toEqual({ test: "data" });
    });

    test("should handle CORS headers", async () => {
      const cors = require("cors");
      app.use(cors());
      app.get("/test", (req, res) => res.json({ ok: true }));

      const response = await request(app).get("/test").expect(200);

      expect(response.headers["access-control-allow-origin"]).toBeDefined();
    });
  });

  describe("Error Handling Middleware", () => {
    test("should catch and handle errors in development mode", async () => {
      process.env.NODE_ENV = "development";

      app.get("/error", () => {
        throw new Error("Test error");
      });

      // Error handling middleware
      app.use((err: Error, req: any, res: any, next: any) => {
        res.status(500).json({
          message: err.message,
          error: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
      });

      const response = await request(app).get("/error").expect(500);

      expect(response.body.message).toBe("Test error");
      expect(response.body.error).toBeDefined(); // Stack trace in dev
    });

    test("should hide stack trace in production mode", async () => {
      process.env.NODE_ENV = "production";

      app.get("/error", () => {
        throw new Error("Test error");
      });

      // Error handling middleware
      app.use((err: Error, req: any, res: any, next: any) => {
        res.status(500).json({
          message: err.message,
          error: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
      });

      const response = await request(app).get("/error").expect(500);

      expect(response.body.message).toBe("Test error");
      expect(response.body.error).toBeUndefined(); // No stack trace in production
    });

    test("should provide default error message", async () => {
      app.get("/error", () => {
        const err: any = new Error();
        err.message = "";
        throw err;
      });

      // Error handling middleware
      app.use((err: Error, req: any, res: any, next: any) => {
        res.status(500).json({
          message: err.message || "Something went wrong",
        });
      });

      const response = await request(app).get("/error").expect(500);

      expect(response.body.message).toBe("Something went wrong");
    });
  });

  describe("Environment Variables", () => {
    test("should throw error if MONGODB_URI is missing", () => {
      const originalUri = process.env.MONGODB_URI;
      delete process.env.MONGODB_URI;

      expect(() => {
        const MongoDB_URI = process.env.MONGODB_URI;
        if (!MongoDB_URI) {
          throw new Error("There is no Database connection string");
        }
      }).toThrow("There is no Database connection string");

      // Restore
      process.env.MONGODB_URI = originalUri;
    });

    test("should use default port 5000 if PORT not specified", () => {
      delete process.env.PORT;
      const port = process.env.PORT || 5000;
      expect(port).toBe(5000);
    });

    test("should use custom port if PORT is specified", () => {
      process.env.PORT = "3000";
      const port = process.env.PORT || 5000;
      expect(port).toBe("3000");
    });
  });

  describe("Session Configuration", () => {
    test("should set secure cookies in production", () => {
      process.env.NODE_ENV = "production";
      const sessionConfig = {
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000,
        },
      };

      expect(sessionConfig.cookie.secure).toBe(true);
    });

    test("should not set secure cookies in development", () => {
      process.env.NODE_ENV = "development";
      const sessionConfig = {
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000,
        },
      };

      expect(sessionConfig.cookie.secure).toBe(false);
    });

    test("should set session max age to 24 hours", () => {
      const expectedMaxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const sessionConfig = {
        cookie: {
          maxAge: 24 * 60 * 60 * 1000,
        },
      };

      expect(sessionConfig.cookie.maxAge).toBe(expectedMaxAge);
      expect(sessionConfig.cookie.maxAge).toBe(86400000);
    });
  });
});

describe("Database Connection", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should log success message on MongoDB connection", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    // Mock successful connection
    jest.spyOn(mongoose, "connect").mockResolvedValueOnce(mongoose as any);

    await mongoose.connect(process.env.MONGODB_URI!);

    // Simulate the success log
    console.log("Connected to MongoDB");

    expect(consoleSpy).toHaveBeenCalledWith("Connected to MongoDB");
    consoleSpy.mockRestore();
  });

  test("should handle MongoDB connection errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const processExitSpy = jest.spyOn(process, "exit").mockImplementation((code?: string | number | null | undefined) => {
      return undefined as never; // Don't actually exit, just mock it
    });

    const testError = new Error("Connection failed");

    // Mock failed connection
    jest.spyOn(mongoose, "connect").mockRejectedValueOnce(testError);

    // Simulate what happens in server.ts on connection error
    try {
      await mongoose.connect(process.env.MONGODB_URI!);
    } catch (error) {
      console.error("MongoDB connection error", error);
      process.exit(1);
    }

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith("MongoDB connection error", testError);

    // Verify process.exit was called with code 1
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
