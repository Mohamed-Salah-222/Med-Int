import crypto from "crypto";

export const generateVerificationCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

//* Verification codes and reset tokens are stored as SHA-256 hashes so a leaked
//* database dump cannot be replayed to verify accounts or reset passwords.
//* The plaintext value only ever exists in the email we send.
//* Plain SHA-256 (not bcrypt) is deliberate: these values are high-entropy and
//* short-lived, and lookups must stay fast enough to query by hash.
export const hashToken = (value: string): string => {
  return crypto.createHash("sha256").update(value).digest("hex");
};
