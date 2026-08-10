import express from "express";
import crypto from "crypto";
import passport from "../config/passport";
import OAuthExchangeCode from "../models/OAuthExchangeCode";
import { hashToken } from "../utils/generateCode";

const router = express.Router();

//* Lifetime of the handoff code. Long enough to survive the redirect and the
//* frontend's first render, short enough that a code leaked from a proxy log is
//* almost certainly already dead.
const EXCHANGE_CODE_TTL_MS = 60 * 1000;

// Google OAuth
//* session: false — this app is stateless; passport populates req.user for the
//* duration of the callback request, which is all the handler below needs.
//* state protection comes from the signed-cookie store configured on the
//* strategy in config/passport.ts, not from a session.
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    //* A missing or mismatched state fails authentication before this handler
    //* runs, landing here instead.
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  async (req, res, next) => {
    try {
      const user = req.user as any;

      //* The browser only ever sees this opaque, single-use value. Putting the
      //* JWT in the query string would persist a live credential into browser
      //* history, the Referer header of the next request, and any access log
      //* along the way.
      const code = crypto.randomBytes(32).toString("hex");

      await OAuthExchangeCode.create({
        codeHash: hashToken(code),
        userId: user._id,
        expiresAt: new Date(Date.now() + EXCHANGE_CODE_TTL_MS),
      });

      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?code=${code}`);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
