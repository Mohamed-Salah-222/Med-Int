import { NextFunction, Request, Response } from "express";
import rateLimit, { ipKeyGenerator, AugmentedRequest, Options } from "express-rate-limit";

//*=====================================================
//* SHARED HELPERS
//*=====================================================

//*--- Human-readable "try again in ..." from the window that was exceeded
const describeRetryDelay = (retryAfterSeconds: number): string => {
  if (retryAfterSeconds <= 60) {
    return `${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};

//*--- 429 payload. The Retry-After header is already set by express-rate-limit
//*--- (standardHeaders is enabled), so this only shapes the JSON body.
const buildHandler =
  (action: string) =>
  (req: Request, res: Response, _next: NextFunction, options: Options): void => {
    const resetTime = (req as unknown as AugmentedRequest)[options.requestPropertyName]?.resetTime;
    const retryAfterSeconds = resetTime ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000)) : 60;

    res.status(429).json({
      message: `Too many ${action}. Please try again in ${describeRetryDelay(retryAfterSeconds)}.`,
      retryAfter: retryAfterSeconds,
    });
  };

//*--- Key on IP + submitted email so one attacker cannot lock out an entire
//*--- shared IP, and one email cannot be hammered from a single host.
//*--- req.ip must go through ipKeyGenerator so IPv6 clients are bucketed by
//*--- subnet instead of by individually rotatable addresses.
const ipAndEmailKey = (req: Request): string => {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();

  return `${ipKeyGenerator(req.ip ?? "")}:${email}`;
};

const baseOptions: Partial<Options> = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
};

//*=====================================================
//* PER-ROUTE LIMITERS
//*=====================================================

//*--- Login: 5 attempts / 15 minutes per IP + email
export const loginLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: ipAndEmailKey,
  handler: buildHandler("login attempts"),
});

//*--- Register: 5 attempts / hour per IP
export const registerLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  handler: buildHandler("registration attempts"),
});

//*--- Verify + resend verification: 5 attempts / 15 minutes per IP + email.
//*--- Separate instances so the two routes get independent counters.
export const verifyLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: ipAndEmailKey,
  handler: buildHandler("verification attempts"),
});

export const resendVerificationLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: ipAndEmailKey,
  handler: buildHandler("verification code requests"),
});

//*--- Forgot password: 3 attempts / hour per IP + email
export const forgotPasswordLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: ipAndEmailKey,
  handler: buildHandler("password reset requests"),
});

//*--- OAuth code exchange: 10 attempts / 15 minutes per IP.
//*--- Guessing a 32-byte code is infeasible, so this is abuse control rather
//*--- than brute-force defence; the ceiling is loose enough that a genuine
//*--- user retrying a failed sign-in is never blocked.
export const oauthExchangeLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  handler: buildHandler("sign-in attempts"),
});

//*--- Reset password: 5 attempts / 15 minutes per IP.
//*--- Keyed on IP alone because this route submits a token, not an email.
export const resetPasswordLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  handler: buildHandler("password reset attempts"),
});
