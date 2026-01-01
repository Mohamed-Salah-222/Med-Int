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
  // Generate JWT token
  const user = req.user as any;
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

export default router;
