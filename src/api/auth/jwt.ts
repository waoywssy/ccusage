import jwt, { type SignOptions } from "jsonwebtoken";

import type { PublicUser } from "./types.js";

export type JwtPayload = {
  sub: string;
  email: string;
};

export type JwtConfig = {
  secret: string;
  expiresIn?: SignOptions["expiresIn"];
};

const DEFAULT_EXPIRATION = "7d";

export function signAccessToken(
  user: PublicUser,
  config: JwtConfig,
): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
  };

  return jwt.sign(payload, config.secret, {
    expiresIn: config.expiresIn ?? DEFAULT_EXPIRATION,
  });
}
