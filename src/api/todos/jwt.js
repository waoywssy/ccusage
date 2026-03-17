import { createHmac, timingSafeEqual } from "node:crypto";

function encodeBase64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(unsignedToken, secret) {
  return createHmac("sha256", secret).update(unsignedToken).digest("base64url");
}

function jsonResponse(status, body) {
  return Response.json(body, { status });
}

export function createJwtMiddleware(options = {}) {
  const secret = options.secret ?? "dev-secret";

  return async function requireAuth(request) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return {
        error: jsonResponse(401, { error: "Missing bearer token." })
      };
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const parts = token.split(".");

    if (parts.length !== 3) {
      return {
        error: jsonResponse(401, { error: "Invalid token format." })
      };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = sign(unsignedToken, secret);

    if (
      encodedSignature.length !== expectedSignature.length ||
      !timingSafeEqual(Buffer.from(encodedSignature), Buffer.from(expectedSignature))
    ) {
      return {
        error: jsonResponse(401, { error: "Invalid token signature." })
      };
    }

    let payload;

    try {
      payload = JSON.parse(decodeBase64Url(encodedPayload));
    } catch {
      return {
        error: jsonResponse(401, { error: "Invalid token payload." })
      };
    }

    if (!payload?.sub) {
      return {
        error: jsonResponse(401, { error: "Token subject is required." })
      };
    }

    if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
      return {
        error: jsonResponse(401, { error: "Token expired." })
      };
    }

    return {
      user: {
        id: String(payload.sub)
      }
    };
  };
}

export function createTestJwt(payload, secret = "dev-secret") {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const encodedSignature = sign(unsignedToken, secret);

  return `${unsignedToken}.${encodedSignature}`;
}
