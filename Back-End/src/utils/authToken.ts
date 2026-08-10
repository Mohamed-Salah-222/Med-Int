import jwt from "jsonwebtoken";

//* Single definition of the session token. Password login, the OAuth exchange
//* and anything added later must produce byte-identical claims, because
//* authMiddleware validates all of them the same way — a payload that drifts
//* here (a missing tokenVersion, say) silently disables revocation for that path.
export interface AuthTokenSubject {
  _id: unknown;
  role: string;
  tokenVersion: number;
}

export const AUTH_TOKEN_EXPIRY = "1d";

export const signAuthToken = (user: AuthTokenSubject): string =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: AUTH_TOKEN_EXPIRY }
  );
