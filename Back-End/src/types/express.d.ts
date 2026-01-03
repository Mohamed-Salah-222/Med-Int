import "express";
import { IUser } from "./models/User"; // Adjust path to your User model

declare module "express" {
  export interface Request {
    user?: {
      userId: string;
      role: string;
    };
  }
}

// Add Passport user type
declare module "express-serve-static-core" {
  interface Request {
    user?: IUser | { userId: string; role: string };
  }
}
