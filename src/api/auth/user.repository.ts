import type { User } from "./types.js";

export type CreateUserInput = {
  email: string;
  password: string;
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
}
