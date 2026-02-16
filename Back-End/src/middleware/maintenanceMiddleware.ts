import { Request, Response, NextFunction } from "express";
import Settings from "../models/Settings";

export const checkMaintenance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Skip maintenance check for admin users
    if (req.user?.role === "Admin" || req.user?.role === "SuperVisor") {
      next();
      return;
    }

    // Get settings
    const settings = await Settings.findOne();

    // If maintenance mode is enabled, block access
    if (settings && settings.maintenanceMode) {
      res.status(503).json({
        maintenanceMode: true,
        message: "The platform is currently under maintenance. Please try again later.",
      });
      return;
    }

    next();
  } catch (error) {
    // If there's an error checking maintenance, allow access
    next();
  }
};
