import { signAccessToken, type JwtConfig } from "./jwt.js";
import { hashPassword } from "./password.js";
import { toPublicUser } from "./serializers.js";
import type { UserRepository } from "./user.repository.js";
import type { ApiHandler, AuthResponse, RegisterInput } from "./types.js";
import { validateRegisterInput } from "./validators.js";

export type RegisterDependencies = {
  userRepository: UserRepository;
  jwt: JwtConfig;
};

export function createRegisterHandler(
  dependencies: RegisterDependencies,
): ApiHandler<RegisterInput, AuthResponse> {
  return async (request) => {
    try {
      const input = validateRegisterInput(request.body);
      const existingUser = await dependencies.userRepository.findByEmail(
        input.email,
      );

      if (existingUser) {
        return {
          status: 409,
          body: { error: "User already exists" },
        };
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await dependencies.userRepository.create({
        email: input.email,
        password: hashedPassword,
      });
      const publicUser = toPublicUser(user);

      return {
        status: 201,
        body: {
          token: signAccessToken(publicUser, dependencies.jwt),
          user: publicUser,
        },
      };
    } catch (error) {
      return {
        status: 400,
        body: {
          error: error instanceof Error ? error.message : "Registration failed",
        },
      };
    }
  };
}
