import { createAuthApi } from "./auth/index.js";
import { requireJwtSecret } from "./jwt-config.js";
import { createTodoApi } from "./todos/index.js";

const AUTH_ROUTE_PREFIXES = ["/auth", "/api/auth", "/src/api/auth"];
const TODO_ROUTE_PREFIXES = ["/todos", "/api/todos", "/src/api/todos"];

function matchesRoutePrefix(pathname, prefixes) {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

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

    if (matchesRoutePrefix(pathname, AUTH_ROUTE_PREFIXES)) {
      return authApi(request);
    }

    if (matchesRoutePrefix(pathname, TODO_ROUTE_PREFIXES)) {
      return todoApi(request);
    }

    return Response.json({ error: "Not found." }, { status: 404 });
  };
}
