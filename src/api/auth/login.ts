import { signAccessToken, type JwtConfig } from "./jwt.js";
import { verifyPassword } from "./password.js";
import { toPublicUser } from "./serializers.js";
import type { UserRepository } from "./user.repository.js";
import type { ApiHandler, AuthResponse, LoginInput } from "./types.js";
import { validateLoginInput } from "./validators.js";

export type LoginDependencies = {
  userRepository: UserRepository;
  jwt: JwtConfig;
};

export function createLoginHandler(
  dependencies: LoginDependencies,
): ApiHandler<LoginInput, AuthResponse> {
  return async (request) => {
    try {
      const input = validateLoginInput(request.body);
      const user = await dependencies.userRepository.findByEmail(input.email);

      if (!user) {
        return {
          status: 401,
          body: { error: "Invalid email or password" },
        };
      }

      const isPasswordValid = await verifyPassword(input.password, user.password);

      if (!isPasswordValid) {
        return {
          status: 401,
          body: { error: "Invalid email or password" },
        };
      }

      const publicUser = toPublicUser(user);

      return {
        status: 200,
        body: {
          token: signAccessToken(publicUser, dependencies.jwt),
          user: publicUser,
        },
      };
    } catch (error) {
      return {
        status: 400,
        body: {
          error: error instanceof Error ? error.message : "Login failed",
        },
      };
    }
  };
}
