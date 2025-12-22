import { Request, Response, NextFunction } from "express";

export const isSuperVisor = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;

  if (userRole !== "SuperVisor") {
    res.status(403).json({ message: "Access denied. SuperVisors only." });
    return;
  }

  next();
};
