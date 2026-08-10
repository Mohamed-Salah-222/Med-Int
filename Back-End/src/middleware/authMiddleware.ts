import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";

//* A verified signature only proves the token was issued by us at some point —
//* not that it is still valid. Anything that must revoke a live session
//* (password reset, role change) bumps the user's tokenVersion, so every
//* authenticated request re-reads it and rejects tokens minted before the bump.
//*
//* The same read supplies the role. The role inside the JWT is deliberately
//* ignored: it was accurate when the token was signed and may not be now.
//* Role guards downstream read req.user.role, so they inherit the fresh value
//* without needing their own query.
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  let decodedPayload: { userId: string; role: string; tokenVersion?: number };

  try {
    decodedPayload = jwt.verify(token, process.env.JWT_SECRET) as typeof decodedPayload;
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }

  try {
    const user = await User.findById(decodedPayload.userId).select("role tokenVersion");

    //* Deleted accounts still hold signed, unexpired tokens.
    if (!user) {
      return res.status(401).json({ message: "Invalid token." });
    }

    //* Strict compare. A token without tokenVersion predates this check and is
    //* treated as stale rather than being given the benefit of the doubt.
    if (decodedPayload.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    req.user = {
      userId: decodedPayload.userId,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (error) {
    //* A database failure must not fall through to the route as if authorised.
    return next(error);
  }
};

export default authMiddleware;
