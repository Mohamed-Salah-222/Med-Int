import express, { Express } from "express";
import request from "supertest";
import mongoose from "mongoose";
import crypto from "crypto";
import { MongoMemoryServer } from "mongodb-memory-server";

//*=====================================================
//* INTEGRATION TESTS — OAUTH STATE, CODE EXCHANGE, LOGOUT
//*=====================================================
//* These run against a real in-memory MongoDB rather than mocks, because the
//* properties under test are database behaviours: atomic single-use deletion,
//* expiry filtering, and the tokenVersion comparison in authMiddleware.

process.env.JWT_SECRET = "test-jwt-secret";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_CALLBACK_URL = "http://localhost:5000/api/auth/google/callback";

//* Every supertest request originates from the same IP, so the real per-IP
//* limiters would start returning 429 partway through this suite and mask the
//* behaviour under test. They are replaced with pass-throughs here; the real
//* oauthExchangeLimiter is exercised directly in its own test below.
jest.mock("../middleware/rateLimiters", () => {
  const passthrough = (_req: unknown, _res: unknown, next: () => void) => next();
  return {
    loginLimiter: passthrough,
    registerLimiter: passthrough,
    verifyLimiter: passthrough,
    resendVerificationLimiter: passthrough,
    forgotPasswordLimiter: passthrough,
    resetPasswordLimiter: passthrough,
    oauthExchangeLimiter: passthrough,
  };
});

import User from "../models/User";
import OAuthExchangeCode from "../models/OAuthExchangeCode";
import authMiddleware from "../middleware/authMiddleware";
import authRoutes from "../routes/authRoutes";
import { signAuthToken } from "../utils/authToken";
import { hashToken } from "../utils/generateCode";
import { CookieStateStore } from "../config/oauthStateStore";

let mongo: MongoMemoryServer;
let app: Express;

const buildApp = (): Express => {
  const instance = express();
  instance.use(express.json());
  instance.use("/api/auth", authRoutes);
  //* A protected probe so "is this token still accepted?" can be asked directly.
  instance.get("/api/protected", authMiddleware, (req, res) => {
    res.json({ ok: true, role: req.user?.role });
  });
  return instance;
};

const createUser = async (overrides: Record<string, unknown> = {}) =>
  User.create({
    name: "Jane Doe",
    email: `jane-${crypto.randomUUID()}@example.com`,
    password: "Password1",
    isVerified: true,
    ...overrides,
  });

const issueCode = async (userId: any, ttlMs = 60 * 1000) => {
  const code = crypto.randomBytes(32).toString("hex");
  await OAuthExchangeCode.create({
    codeHash: hashToken(code),
    userId,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return code;
};

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = buildApp();
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await OAuthExchangeCode.deleteMany({});
});

//*=====================================================
//* 1. OAUTH STATE (CSRF)
//*=====================================================

describe("OAuth state store", () => {
  const store = new CookieStateStore();

  //* Minimal req/res doubles exposing only what the store touches.
  const makeReq = (cookieHeader?: string) => {
    const cookies: Record<string, { value: string; options: unknown }> = {};
    const cleared: string[] = [];

    const req: any = {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      res: {
        cookie: (name: string, value: string, options: unknown) => {
          cookies[name] = { value, options };
        },
        clearCookie: (name: string) => {
          cleared.push(name);
        },
      },
    };

    return { req, cookies, cleared };
  };

  const storeState = (): { state: string; cookieHeader: string; options: any } => {
    const { req, cookies } = makeReq();
    let issued = "";
    store.store(req, {}, (err, state) => {
      if (err) throw err;
      issued = state as string;
    });
    const cookie = cookies["oauth_state"];
    return { state: issued, cookieHeader: `oauth_state=${cookie.value}`, options: cookie.options };
  };

  test("issues a state handle and a matching signed cookie", () => {
    const { state, cookieHeader } = storeState();

    expect(state).toMatch(/^[a-f0-9]{64}$/);
    //* Cookie carries handle.signature, so it is longer than the handle alone.
    expect(cookieHeader).toContain(state);
    expect(cookieHeader.length).toBeGreaterThan(`oauth_state=${state}`.length);
  });

  test("sets the state cookie HttpOnly, SameSite=Lax and scoped to /api/auth", () => {
    const { options } = storeState();

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/api/auth");
    expect(options.maxAge).toBe(10 * 60 * 1000);
  });

  test("accepts a state parameter matching its cookie", (done) => {
    const { state, cookieHeader } = storeState();
    const { req } = makeReq(cookieHeader);

    store.verify(req, state, (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(true);
      done();
    });
  });

  //*--- The actual CSRF defence ---

  test("rejects a MISSING state parameter", (done) => {
    const { cookieHeader } = storeState();
    const { req } = makeReq(cookieHeader);

    store.verify(req, undefined as any, (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(false);
      done();
    });
  });

  test("rejects when the state cookie is absent", (done) => {
    const { state } = storeState();
    const { req } = makeReq(); // no cookie at all

    store.verify(req, state, (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(false);
      done();
    });
  });

  test("rejects a MISMATCHED state parameter", (done) => {
    const { cookieHeader } = storeState();
    const { req } = makeReq(cookieHeader);
    const attackerState = crypto.randomBytes(32).toString("hex");

    store.verify(req, attackerState, (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(false);
      done();
    });
  });

  test("rejects a forged cookie whose signature was not issued by this server", (done) => {
    //* The attacker controls both halves of the double-submit but not the secret.
    const forgedHandle = crypto.randomBytes(32).toString("hex");
    const forgedSignature = crypto.createHmac("sha256", "wrong-secret").update(forgedHandle).digest("hex");
    const { req } = makeReq(`oauth_state=${forgedHandle}.${forgedSignature}`);

    store.verify(req, forgedHandle, (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(false);
      done();
    });
  });

  test("rejects an unsigned cookie value", (done) => {
    const handle = crypto.randomBytes(32).toString("hex");
    const { req } = makeReq(`oauth_state=${handle}`);

    store.verify(req, handle, (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(false);
      done();
    });
  });

  test("clears the state cookie even when verification fails, so it cannot be retried", (done) => {
    const { cookieHeader } = storeState();
    const { req, cleared } = makeReq(cookieHeader);

    store.verify(req, "not-the-state", () => {
      expect(cleared).toContain("oauth_state");
      done();
    });
  });

  test("exposes the arity passport-oauth2 dispatches on", () => {
    //* passport-oauth2 branches on Function.length; if these change, it silently
    //* calls the wrong signature and state protection breaks.
    expect(typeof store.store).toBe("function");
    expect(typeof store.verify).toBe("function");
  });

  test("works when passport calls the two-argument store form", (done) => {
    const { req, cookies } = makeReq();

    //* store(req, callback) — the arity-2 dispatch branch.
    (store.store as any)(req, (err: Error | null, state: string) => {
      expect(err).toBeNull();
      expect(state).toMatch(/^[a-f0-9]{64}$/);
      expect(cookies["oauth_state"]).toBeDefined();
      done();
    });
  });
});

//*=====================================================
//* 1b. STATE WIRED THROUGH THE REAL PASSPORT STRATEGY
//*=====================================================
//* The store above is correct in isolation; these prove passport actually uses
//* it. A custom `store` silently doing nothing would leave the flow unprotected
//* while every unit test above still passed.

describe("Google OAuth routes (real strategy)", () => {
  let oauthApp: Express;

  beforeAll(() => {
    //* Imported lazily so the env vars set at the top of this file are in place
    //* before the GoogleStrategy is constructed.
    const oauthRoutes = require("../routes/oauth.routes").default;
    oauthApp = express();
    oauthApp.use(express.json());
    oauthApp.use("/api/auth", oauthRoutes);
  });

  test("initiating the flow issues a state cookie and a state parameter", async () => {
    const response = await request(oauthApp).get("/api/auth/google");

    expect(response.status).toBe(302);

    const location = response.headers.location as string;
    expect(location).toContain("accounts.google.com");

    //* The state parameter Google will echo back.
    const stateParam = new URL(location).searchParams.get("state");
    expect(stateParam).toMatch(/^[a-f0-9]{64}$/);

    //* And the signed cookie that will be checked against it.
    const setCookie = String(response.headers["set-cookie"] ?? "");
    expect(setCookie).toContain("oauth_state=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Path=/api/auth");
    //* Cookie holds handle.signature, so it is not merely the state value.
    expect(setCookie).toContain(`oauth_state=${stateParam}.`);
  });

  test("callback with a MISSING state is rejected", async () => {
    const response = await request(oauthApp).get("/api/auth/google/callback").query({ code: "google-auth-code" });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  });

  test("callback with a MISMATCHED state is rejected", async () => {
    //* Obtain a genuine cookie, then present a different state — the shape of a
    //* login-CSRF attempt, where the attacker supplies their own state value.
    const initiate = await request(oauthApp).get("/api/auth/google");
    const cookie = String(initiate.headers["set-cookie"][0]).split(";")[0];

    const response = await request(oauthApp)
      .get("/api/auth/google/callback")
      .set("Cookie", cookie)
      .query({ code: "google-auth-code", state: crypto.randomBytes(32).toString("hex") });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  });

  test("callback with a valid state but NO cookie is rejected", async () => {
    const initiate = await request(oauthApp).get("/api/auth/google");
    const state = new URL(initiate.headers.location as string).searchParams.get("state")!;

    //* Cookie deliberately not sent: an attacker who observed the state value
    //* still cannot complete the flow in the victim's browser.
    const response = await request(oauthApp).get("/api/auth/google/callback").query({ code: "google-auth-code", state });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  });

  test("state verification happens before any token exchange with Google", async () => {
    //* No network stubbing is in place; if the rejection were happening after
    //* the code-for-token call, this test would hang or error rather than
    //* redirect promptly.
    const started = Date.now();
    const response = await request(oauthApp).get("/api/auth/google/callback").query({ code: "x", state: "y" });

    expect(response.headers.location).toContain("error=oauth_failed");
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

//*=====================================================
//* 2. ONE-TIME EXCHANGE CODE
//*=====================================================

describe("POST /api/auth/oauth/exchange", () => {
  test("exchanges a valid code for a JWT and the user", async () => {
    const user = await createUser();
    const code = await issueCode(user._id);

    const response = await request(app).post("/api/auth/oauth/exchange").send({ code });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe("string");
    expect(response.body.user.email).toBe(user.email);
  });

  test("returns a token that actually authenticates", async () => {
    const user = await createUser({ role: "Student" });
    const code = await issueCode(user._id);

    const exchange = await request(app).post("/api/auth/oauth/exchange").send({ code });
    const probe = await request(app).get("/api/protected").set("Authorization", `Bearer ${exchange.body.token}`);

    expect(probe.status).toBe(200);
    expect(probe.body.role).toBe("Student");
  });

  //*--- Single use ---

  test("rejects a SECOND exchange of the same code", async () => {
    const user = await createUser();
    const code = await issueCode(user._id);

    const first = await request(app).post("/api/auth/oauth/exchange").send({ code });
    const second = await request(app).post("/api/auth/oauth/exchange").send({ code });

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
    expect(second.body.message).toBe("Invalid or expired code");
    expect(second.body.token).toBeUndefined();
  });

  test("deletes the code from the database once used", async () => {
    const user = await createUser();
    const code = await issueCode(user._id);

    await request(app).post("/api/auth/oauth/exchange").send({ code });

    expect(await OAuthExchangeCode.countDocuments({ codeHash: hashToken(code) })).toBe(0);
  });

  test("only one of two concurrent exchanges can succeed", async () => {
    const user = await createUser();
    const code = await issueCode(user._id);

    //* findOneAndDelete is atomic; a find-then-delete would let both through.
    const results = await Promise.all([
      request(app).post("/api/auth/oauth/exchange").send({ code }),
      request(app).post("/api/auth/oauth/exchange").send({ code }),
    ]);

    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 400]);
  });

  //*--- Expiry ---

  test("rejects a code that has expired", async () => {
    const user = await createUser();
    //* Already expired when written; the TTL reaper has not necessarily run,
    //* which is exactly why the query filters on expiresAt.
    const code = await issueCode(user._id, -1000);

    const response = await request(app).post("/api/auth/oauth/exchange").send({ code });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid or expired code");
  });

  test("rejects an expired code even though the document is still present", async () => {
    const user = await createUser();
    const code = await issueCode(user._id, -1000);

    expect(await OAuthExchangeCode.countDocuments({ codeHash: hashToken(code) })).toBe(1);

    const response = await request(app).post("/api/auth/oauth/exchange").send({ code });
    expect(response.status).toBe(400);
  });

  test("accepts a code right up to its expiry boundary", async () => {
    const user = await createUser();
    const code = await issueCode(user._id, 5000);

    const response = await request(app).post("/api/auth/oauth/exchange").send({ code });
    expect(response.status).toBe(200);
  });

  //*--- Storage and validation ---

  test("never stores the raw code", async () => {
    const user = await createUser();
    const code = await issueCode(user._id);

    const stored = await OAuthExchangeCode.findOne({ codeHash: hashToken(code) });

    expect(stored).not.toBeNull();
    expect(JSON.stringify(stored!.toObject())).not.toContain(code);
  });

  test("never stores a JWT alongside the code", async () => {
    const user = await createUser();
    const code = await issueCode(user._id);

    const stored = await OAuthExchangeCode.findOne({ codeHash: hashToken(code) });

    //* A JWT would show up as three dot-separated base64 segments.
    expect(JSON.stringify(stored!.toObject())).not.toMatch(/eyJ[\w-]+\.[\w-]+\./);
  });

  test("rejects an unknown but well-formed code", async () => {
    const response = await request(app)
      .post("/api/auth/oauth/exchange")
      .send({ code: crypto.randomBytes(32).toString("hex") });

    expect(response.status).toBe(400);
  });

  test.each([["short"], [""], ["zz" + "a".repeat(62)]])("rejects malformed code %j at validation", async (code) => {
    const response = await request(app).post("/api/auth/oauth/exchange").send({ code });
    expect(response.status).toBe(400);
  });

  test("rejects a code whose user no longer exists", async () => {
    const user = await createUser();
    const code = await issueCode(user._id);
    await User.deleteMany({});

    const response = await request(app).post("/api/auth/oauth/exchange").send({ code });

    expect(response.status).toBe(400);
  });

  test("the real limiter caps repeated exchange attempts", async () => {
    //* Uses the genuine limiter (the suite-wide mock is bypassed here) to prove
    //* the endpoint is not an unbounded oracle.
    const { oauthExchangeLimiter } = jest.requireActual("../middleware/rateLimiters");

    const limited = express();
    limited.use(express.json());
    limited.post("/exchange", oauthExchangeLimiter, (_req: express.Request, res: express.Response) => {
      res.status(400).json({ message: "Invalid or expired code" });
    });

    const statuses: number[] = [];
    for (let attempt = 0; attempt < 11; attempt++) {
      statuses.push((await request(limited).post("/exchange").send({ code: "x" })).status);
    }

    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(400));
    expect(statuses[10]).toBe(429);
  });
});

//*=====================================================
//* 3. SERVER-SIDE LOGOUT
//*=====================================================

describe("POST /api/auth/logout", () => {
  test("invalidates the token used to log out", async () => {
    const user = await createUser();
    const token = signAuthToken(user);

    //* Works before...
    expect((await request(app).get("/api/protected").set("Authorization", `Bearer ${token}`)).status).toBe(200);

    const logout = await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(logout.status).toBe(200);

    //* ...and is refused afterwards.
    const after = await request(app).get("/api/protected").set("Authorization", `Bearer ${token}`);
    expect(after.status).toBe(401);
    expect(after.body.message).toBe("Session expired. Please log in again.");
  });

  test("increments tokenVersion exactly once", async () => {
    const user = await createUser();
    const token = signAuthToken(user);

    expect(user.tokenVersion).toBe(0);

    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);

    const reloaded = await User.findById(user._id);
    expect(reloaded!.tokenVersion).toBe(1);
  });

  test("requires authentication", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(401);
  });

  test("a token issued after logout still works", async () => {
    const user = await createUser();
    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${signAuthToken(user)}`);

    //* Re-reading the user picks up the bumped version, as a fresh login would.
    const reloaded = await User.findById(user._id);
    const freshToken = signAuthToken(reloaded!);

    const response = await request(app).get("/api/protected").set("Authorization", `Bearer ${freshToken}`);
    expect(response.status).toBe(200);
  });

  //*--- The multi-device consequence, asserted rather than assumed ---

  test("logging out on one device invalidates OTHER devices too", async () => {
    const user = await createUser();

    //* Two independent sign-ins for the same user — same tokenVersion.
    const phoneToken = signAuthToken(user);
    const laptopToken = signAuthToken(user);

    expect((await request(app).get("/api/protected").set("Authorization", `Bearer ${laptopToken}`)).status).toBe(200);

    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${phoneToken}`);

    const laptopAfter = await request(app).get("/api/protected").set("Authorization", `Bearer ${laptopToken}`);

    //* Documented tradeoff of a per-user counter: this is 401, not 200.
    expect(laptopAfter.status).toBe(401);
  });

  test("does not affect a different user's sessions", async () => {
    const alice = await createUser();
    const bob = await createUser();

    const bobToken = signAuthToken(bob);

    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${signAuthToken(alice)}`);

    const response = await request(app).get("/api/protected").set("Authorization", `Bearer ${bobToken}`);
    expect(response.status).toBe(200);
  });

  test("a second logout is harmless", async () => {
    const user = await createUser();
    const token = signAuthToken(user);

    await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
    const second = await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);

    //* The token is already dead, so the second attempt is rejected by authMiddleware.
    expect(second.status).toBe(401);
    expect((await User.findById(user._id))!.tokenVersion).toBe(1);
  });
});
