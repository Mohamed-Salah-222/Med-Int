import "express";
import { IUser } from "./models/User"; // Adjust path to your User model

declare module "express" {
  export interface Request {
    user?: {
      userId: string;
      //* Populated by authMiddleware from the database, NOT from the JWT.
      //* Downstream role guards may rely on this being current.
      role: string;
      tokenVersion?: number;
    };
  }
}

// Add Passport user type
declare module "express-serve-static-core" {
  interface Request {
    user?: IUser | { userId: string; role: string };
  }
}
