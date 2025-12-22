import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

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
