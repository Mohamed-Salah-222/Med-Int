import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import session from "express-session";
import passport from "./config/passport";
import oauthRoutes from "./routes/oauth.routes";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import courseRoutes from "./routes/courseRoutes";
import glossaryRoutes from "./routes/glossaryRoutes";
import accessRoutes from "./routes/accessRoutes";
import chatbotRoutes from "./routes/chatbotRoutes";

const app = express();

app.use(express.json());
app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", oauthRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/glossary", glossaryRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/chatbot", chatbotRoutes);

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
