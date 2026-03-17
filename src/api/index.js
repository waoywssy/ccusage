import { createAuthApi } from "./auth/index.js";
import { requireJwtSecret } from "./jwt-config.js";
import { createTodoApi } from "./todos/index.js";

export function createApiRouter(options = {}) {
  const jwtSecret = requireJwtSecret(options.jwtSecret);
  const authApi = createAuthApi({
    userRepository: options.userRepository,
    jwtSecret,
    jwtExpiresIn: options.jwtExpiresIn,
    saltRounds: options.saltRounds
  });
  const todoApi = createTodoApi({
    store: options.todoStore,
    jwtSecret
  });

  return async function handleApiRequest(request) {
    const pathname = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth") || pathname.startsWith("/src/api/auth")) {
      return authApi(request);
    }

    if (pathname.startsWith("/todos") || pathname.startsWith("/api/todos") || pathname.startsWith("/src/api/todos")) {
      return todoApi(request);
    }

    return Response.json({ error: "Not found." }, { status: 404 });
  };
}
