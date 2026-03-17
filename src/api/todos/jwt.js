import jwt from "jsonwebtoken";
import { requireJwtSecret } from "../jwt-config.js";

function jsonResponse(status, body) {
  return Response.json(body, { status });
}

export function createJwtMiddleware(options = {}) {
  const secret = requireJwtSecret(options.secret);

  return async function requireAuth(request) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return {
        error: jsonResponse(401, { error: "Missing bearer token." })
      };
    }

    const token = authHeader.slice("Bearer ".length).trim();
    try {
      const payload = jwt.verify(token, secret);

      if (!payload?.sub) {
        return {
          error: jsonResponse(401, { error: "Token subject is required." })
        };
      }

      return {
        user: {
          id: String(payload.sub)
        }
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          error: jsonResponse(401, { error: "Token expired." })
        };
      }

      return {
        error: jsonResponse(401, { error: "Invalid token." })
      };
    }
  };
}

export function createTestJwt(payload, secret = "dev-secret") {
  return jwt.sign(payload, secret);
}
