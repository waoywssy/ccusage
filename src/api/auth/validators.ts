import type { LoginInput, RegisterInput } from "./types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateRegisterInput(input: RegisterInput): RegisterInput {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Invalid email address");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error("Password must be at least 8 characters long");
  }

  return { email, password };
}

export function validateLoginInput(input: LoginInput): LoginInput {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Invalid email address");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  return { email, password };
}
