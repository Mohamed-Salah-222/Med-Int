import crypto from "crypto";
import { Request } from "express";

//*=====================================================
//* STATELESS OAUTH STATE STORE
//*=====================================================
//* passport-oauth2's built-in `state: true` store keeps the state handle in
//* req.session, which this app no longer has. Rather than reintroduce
//* express-session, this implements the strategy's documented custom-store
//* interface (options.store) and keeps the handle in a signed, HttpOnly cookie
//* scoped to the OAuth routes.
//*
//* The cookie is HMAC-signed even though its value is server-generated and
//* compared against the state parameter. Without a signature this is a plain
//* double-submit: anyone able to write a cookie on this domain (a compromised
//* sibling subdomain, for example) could set both halves themselves and defeat
//* the CSRF check. The HMAC means only this server can mint an acceptable
//* cookie, so forging one requires the secret.

const STATE_COOKIE = "oauth_state";

//* Generous enough to cover a slow consent screen, short enough to bound replay.
const STATE_TTL_MS = 10 * 60 * 1000;

//* Scoped to the router's mount point in server.ts (app.use("/api/auth", ...)),
//* so the cookie is never sent to unrelated endpoints. If the OAuth routes are
//* ever remounted elsewhere, this path must move with them.
const STATE_COOKIE_PATH = "/api/auth";

const getSecret = (): string => {
  //* Falls back to JWT_SECRET so no new required env var is introduced, but a
  //* dedicated secret is preferred — it keeps a leak of one from affecting the other.
  const secret = process.env.OAUTH_STATE_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("OAUTH_STATE_SECRET or JWT_SECRET must be set to protect the OAuth state parameter");
  }

  return secret;
};

const sign = (handle: string): string => crypto.createHmac("sha256", getSecret()).update(handle).digest("hex");

const equals = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  //* timingSafeEqual throws on length mismatch, so that is checked first. The
  //* length itself is not a secret here (both sides are fixed-width hex).
  if (left.length !== right.length) return false;

  return crypto.timingSafeEqual(left, right);
};

//* Read without cookie-parser: this is the only cookie the backend consumes,
//* and adding a dependency for one header is not worth it.
const readCookie = (req: Request, name: string): string | undefined => {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;

    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }

  return undefined;
};

const rejection = { message: "Unable to verify authorization request state." };

type StoreCallback = (err: Error | null, state?: unknown) => void;
type VerifyCallback = (err: Error | null, ok: boolean, state?: unknown) => void;

//* passport-oauth2 dispatches on Function.length and calls either
//* store(req, callback) or store(req, meta, callback). Both shapes are accepted
//* here rather than depending on which branch the arity check lands in.
const resolve = <T extends Function>(a: unknown, b: unknown): T => (typeof a === "function" ? a : b) as T;

export class CookieStateStore {
  store(req: Request, callback: StoreCallback): void;
  store(req: Request, meta: unknown, callback: StoreCallback): void;
  store(req: Request, metaOrCallback: unknown, maybeCallback?: StoreCallback): void {
    const callback = resolve<StoreCallback>(metaOrCallback, maybeCallback);

    try {
      const handle = crypto.randomBytes(32).toString("hex");

      req.res?.cookie(STATE_COOKIE, `${handle}.${sign(handle)}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        //* Lax, not Strict: the callback arrives as a top-level cross-site GET
        //* redirect from Google, which Strict would strip the cookie from.
        sameSite: "lax",
        maxAge: STATE_TTL_MS,
        path: STATE_COOKIE_PATH,
      });

      callback(null, handle);
    } catch (error) {
      callback(error as Error);
    }
  }

  verify(req: Request, providedState: string, callback: VerifyCallback): void;
  verify(req: Request, providedState: string, meta: unknown, callback: VerifyCallback): void;
  verify(req: Request, providedState: string, metaOrCallback: unknown, maybeCallback?: VerifyCallback): void {
    const callback = resolve<VerifyCallback>(metaOrCallback, maybeCallback);

    try {
      const cookie = readCookie(req, STATE_COOKIE);

      //* Cleared unconditionally: a state handle is single-use whether or not
      //* this attempt succeeds, so a failed callback cannot be retried.
      req.res?.clearCookie(STATE_COOKIE, { path: STATE_COOKIE_PATH });

      if (!providedState || !cookie) {
        return callback(null, false, rejection);
      }

      const separator = cookie.lastIndexOf(".");
      if (separator === -1) {
        return callback(null, false, rejection);
      }

      const handle = cookie.slice(0, separator);
      const signature = cookie.slice(separator + 1);

      //* Signature first: proves we issued this cookie.
      if (!equals(signature, sign(handle))) {
        return callback(null, false, rejection);
      }

      //* Then that the query parameter matches the cookie.
      if (!equals(handle, providedState)) {
        return callback(null, false, rejection);
      }

      return callback(null, true, undefined);
    } catch (error) {
      return callback(error as Error, false, undefined);
    }
  }
}

export const oauthStateStore = new CookieStateStore();
