import crypto from "crypto";

export const generateCertificateNumber = (): string => {
  // Format: MIC-YYYY-XXXXXX (Medical Interpreter Course - Year - Random)
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MIC-${year}-${random}`;
};

export const generateVerificationCode = (): string => {
  // 8-character alphanumeric code for verification
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};
