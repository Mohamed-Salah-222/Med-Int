import { Request, Response, NextFunction } from "express";

//* These guards read req.user.role, which authMiddleware populates from the
//* database on every request — never from the JWT payload. That is what makes
//* them safe against a stale token carrying a role the user no longer holds.
//* They must therefore only ever be mounted *after* authMiddleware.

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
