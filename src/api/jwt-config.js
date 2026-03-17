export function requireJwtSecret(secret) {
  if (typeof secret !== "string" || secret.trim() === "") {
    throw new Error("A non-empty JWT secret is required.");
  }

  return secret;
}
