import { Request, Response, NextFunction } from "express";

export const isSuperVisor = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;

  if (userRole !== "SuperVisor") {
    res.status(403).json({ message: "Access denied. SuperVisors only." });
    return;
  }

  next();
};

export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;

  if (!userRole) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  // Allow Student, Admin, and SuperVisor
  if (userRole === "Student" || userRole === "Admin" || userRole === "SuperVisor") {
    next();
    return;
  }

  res.status(403).json({
    message: "Access denied. Student subscription required.",
    userRole: userRole,
    requiredRole: "Student",
  });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;

  if (!userRole) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  // Only Admin and SuperVisor
  if (userRole === "Admin" || userRole === "SuperVisor") {
    next();
    return;
  }

  res.status(403).json({
    message: "Access denied. Admin privileges required.",
    userRole: userRole,
  });
};
