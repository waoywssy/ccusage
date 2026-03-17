import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireJwtSecret } from "../jwt-config.js";

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} password
 * @property {Date | string} createdAt
 */

/**
 * @typedef {Object} UserRepository
 * @property {(email: string) => Promise<User | null>} findByEmail
 * @property {(input: { email: string, password: string }) => Promise<User>} create
 * @property {(id: string) => Promise<User | null>} [findById]
 */

/**
 * @typedef {Object} AuthApiOptions
 * @property {UserRepository} userRepository
 * @property {string} [jwtSecret]
 * @property {string | number} [jwtExpiresIn]
 * @property {number} [saltRounds]
 */

const DEFAULT_JWT_EXPIRES_IN = "7d";
const DEFAULT_SALT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(status, body) {
  return Response.json(body, { status });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
}

function createToken(user, options) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    requireJwtSecret(options.jwtSecret),
    {
      expiresIn: options.jwtExpiresIn ?? DEFAULT_JWT_EXPIRES_IN
    }
  );
}

function validateRegisterPayload(payload) {
  if (!payload || typeof payload.email !== "string" || typeof payload.password !== "string") {
    return "Fields 'email' and 'password' are required.";
  }

  const email = normalizeEmail(payload.email);

  if (!EMAIL_PATTERN.test(email)) {
    return "Field 'email' must be a valid email address.";
  }

  if (payload.password.trim().length < 8) {
    return "Field 'password' must be at least 8 characters long.";
  }

  return null;
}

function validateLoginPayload(payload) {
  if (!payload || typeof payload.email !== "string" || typeof payload.password !== "string") {
    return "Fields 'email' and 'password' are required.";
  }

  const email = normalizeEmail(payload.email);

  if (!EMAIL_PATTERN.test(email)) {
    return "Field 'email' must be a valid email address.";
  }

  if (payload.password.length === 0) {
    return "Field 'password' is required.";
  }

  return null;
}

function readBearerToken(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { error: jsonResponse(401, { error: "Missing bearer token." }) };
  }

  return { token: authHeader.slice("Bearer ".length).trim() };
}

function verifyToken(token, options) {
  try {
    return jwt.verify(token, requireJwtSecret(options.jwtSecret));
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { error: jsonResponse(401, { error: "Token expired." }) };
    }

    return { error: jsonResponse(401, { error: "Invalid token." }) };
  }
}

function matchPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const supportedPaths = new Set([
    "/src/api/auth/register",
    "/src/api/auth/login",
    "/src/api/auth/me",
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/me",
    "/auth/register",
    "/auth/login",
    "/auth/me"
  ]);

  if (!supportedPaths.has(normalizedPath)) {
    return null;
  }

  return normalizedPath.split("/").pop();
}

export function createAuthApi(options = {}) {
  const { userRepository } = options;

  if (!userRepository) {
    throw new Error("createAuthApi requires a userRepository.");
  }

  return async function handleAuthRequest(request) {
    const route = matchPath(new URL(request.url).pathname);

    if (!route) {
      return jsonResponse(405, { error: "Method not allowed." });
    }

    if (route === "register" && request.method === "POST") {
      const payload = await readJson(request);
      const error = validateRegisterPayload(payload);

      if (error) {
        return jsonResponse(400, { error });
      }

      const email = normalizeEmail(payload.email);
      const existingUser = await userRepository.findByEmail(email);

      if (existingUser) {
        return jsonResponse(409, { error: "User already exists." });
      }

      const password = await bcrypt.hash(
        payload.password,
        options.saltRounds ?? DEFAULT_SALT_ROUNDS
      );
      const user = await userRepository.create({ email, password });

      return jsonResponse(201, {
        token: createToken(user, options),
        user: toPublicUser(user)
      });
    }

    if (route === "login" && request.method === "POST") {
      const payload = await readJson(request);
      const error = validateLoginPayload(payload);

      if (error) {
        return jsonResponse(400, { error });
      }

      const email = normalizeEmail(payload.email);
      const user = await userRepository.findByEmail(email);

      if (!user) {
        return jsonResponse(401, { error: "Invalid email or password." });
      }

      const isValid = await bcrypt.compare(payload.password, user.password);

      if (!isValid) {
        return jsonResponse(401, { error: "Invalid email or password." });
      }

      return jsonResponse(200, {
        token: createToken(user, options),
        user: toPublicUser(user)
      });
    }

    if (route === "me" && request.method === "GET") {
      const auth = readBearerToken(request);

      if (auth.error) {
        return auth.error;
      }

      const payload = verifyToken(auth.token, options);

      if (payload?.error) {
        return payload.error;
      }

      const subject = payload?.sub ? String(payload.sub) : "";

      if (!subject) {
        return jsonResponse(401, { error: "Token subject is required." });
      }

      if (typeof userRepository.findById === "function") {
        const user = await userRepository.findById(subject);

        if (!user) {
          return jsonResponse(404, { error: "User not found." });
        }

        return jsonResponse(200, { user: toPublicUser(user) });
      }

      return jsonResponse(200, {
        user: {
          id: subject,
          email: typeof payload.email === "string" ? payload.email : "",
          createdAt: null
        }
      });
    }

    return jsonResponse(405, { error: "Method not allowed." });
  };
}
