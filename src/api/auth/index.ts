import { createLoginHandler, type LoginDependencies } from "./login.js";
import { createRegisterHandler, type RegisterDependencies } from "./register.js";

export type AuthApiDependencies = RegisterDependencies & LoginDependencies;

export function createAuthApi(dependencies: AuthApiDependencies) {
  return {
    register: createRegisterHandler(dependencies),
    login: createLoginHandler(dependencies),
  };
}

export * from "./jwt.js";
export * from "./login.js";
export * from "./password.js";
export * from "./register.js";
export * from "./types.js";
export * from "./user.repository.js";
