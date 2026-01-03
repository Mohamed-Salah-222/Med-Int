import express from "express";
import passport from "../config/passport";
import jwt from "jsonwebtoken";

const router = express.Router();

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get("/google/callback", passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }), (req, res) => {
  const user = req.user as any;

  // Generate JWT token with SAME payload structure as regular login
  const token = jwt.sign(
    {
      userId: user._id, // Changed from 'id' to 'userId'
      role: user.role, // Added role
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1d", // Match your regular login expiry
    }
  );

  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

export default router;
