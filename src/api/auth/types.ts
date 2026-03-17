export type User = {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
};

export type PublicUser = Omit<User, "password">;

export type RegisterInput = {
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: PublicUser;
};

export type ApiResponse<T> = {
  status: number;
  body: T;
};

export type ApiErrorBody = {
  error: string;
};

export type ApiRequest<TBody> = {
  body: TBody;
};

export type ApiHandler<TBody, TSuccess> = (
  request: ApiRequest<TBody>,
) => Promise<ApiResponse<TSuccess | ApiErrorBody>>;
