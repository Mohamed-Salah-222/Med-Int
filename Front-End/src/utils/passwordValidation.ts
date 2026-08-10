//* Shared password rules. Previously duplicated verbatim in Register.tsx and
//* ResetPassword.tsx, where the two copies could drift apart — and drift from
//* the backend, which enforces the same rule in validators/authValidator.ts.

export interface PasswordStrength {
  score: number;
  color: string;
}

//* Index i is the colour for a score of i, so index 0 is intentionally empty
//* (nothing to show for an empty password).
const STRENGTH_COLORS = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-600"];

//* Mirrors the backend rule in validators/authValidator.ts. Keep the two in
//* step: a mismatch means the form accepts input the API then rejects.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE = "Password must be at least 8 characters with uppercase, lowercase, and number";

//* Advisory meter only — a weak-but-valid password still passes isPasswordValid.
export const checkPasswordStrength = (pwd: string): PasswordStrength => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z\d]/.test(pwd)) score++;

  return { score, color: STRENGTH_COLORS[score] };
};

//* The actual gate on submission.
export const isPasswordValid = (pwd: string): boolean => PASSWORD_PATTERN.test(pwd);
