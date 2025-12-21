import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string;
      role: string;
    };

    req.user = decodedPayload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

export default authMiddleware;
