import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import passport from "./config/passport";
import oauthRoutes from "./routes/oauth.routes";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import courseRoutes from "./routes/courseRoutes";
import glossaryRoutes from "./routes/glossaryRoutes";
import accessRoutes from "./routes/accessRoutes";
import chatbotRoutes from "./routes/chatbotRoutes";

import { checkMaintenance } from "./middleware/maintenanceMiddleware";

const app = express();

//* Fail fast rather than fall back to a permissive default: cors() with an
//* undefined origin reflects any requester, silently reopening the hole this
//* configuration exists to close.
const frontendUrl = process.env.FRONTEND_URL;

if (!frontendUrl) {
  throw new Error("FRONTEND_URL must be set to the allowed browser origin");
}

app.use(express.json());
app.use(
  cors({
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    //* No cookies are used (auth is a bearer token), but this stays enabled so
    //* the browser is not blocked if a credentialed request is ever added.
    credentials: true,
  }),
);

//* No express-session: authentication is entirely JWT-based (authMiddleware),
//* and the OAuth routes run with session: false. passport.initialize() alone
//* is enough to attach req.user for the duration of the callback request.
app.use(passport.initialize());

// Public routes
app.use("/api/auth", oauthRoutes);
app.use("/api/auth", authRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// Protected student routes
app.use("/api/courses", checkMaintenance, courseRoutes);
app.use("/api/glossary", checkMaintenance, glossaryRoutes);
app.use("/api/access", checkMaintenance, accessRoutes);
app.use("/api/chatbot", checkMaintenance, chatbotRoutes);

//*Error handling middleWare
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || "Something went wrong",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const port = process.env.PORT || 5000;

const MongoDB_URI = process.env.MONGODB_URI;

if (!MongoDB_URI) {
  throw new Error("There is no Database connection string");
}

mongoose
  .connect(MongoDB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error", error);
    process.exit(1);
  });
