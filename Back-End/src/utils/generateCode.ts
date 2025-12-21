import crypto from "crypto";

export const generateVerificationCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};
