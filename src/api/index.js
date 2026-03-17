import { createAuthApi } from "./auth/index.js";
import { createTodoApi } from "./todos/index.js";

export function createApiRouter(options = {}) {
  const authApi = createAuthApi({
    userRepository: options.userRepository,
    jwtSecret: options.jwtSecret,
    jwtExpiresIn: options.jwtExpiresIn,
    saltRounds: options.saltRounds
  });
  const todoApi = createTodoApi({
    store: options.todoStore,
    jwtSecret: options.jwtSecret
  });

  return async function handleApiRequest(request) {
    const pathname = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

    if (pathname.startsWith("/auth") || pathname.startsWith("/src/api/auth")) {
      return authApi(request);
    }

    if (pathname.startsWith("/todos") || pathname.startsWith("/api/todos") || pathname.startsWith("/src/api/todos")) {
      return todoApi(request);
    }

    return Response.json({ error: "Not found." }, { status: 404 });
  };
}
