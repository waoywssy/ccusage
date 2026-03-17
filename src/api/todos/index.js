import { createJwtMiddleware } from "./jwt.js";
import { createTodoStore } from "./store.js";

function jsonResponse(status, body) {
  return Response.json(body, { status });
}

function serializeTodo(todo) {
  return {
    id: todo.id,
    title: todo.title,
    done: todo.done,
    userId: todo.userId
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function validateCreatePayload(payload) {
  if (!payload || typeof payload.title !== "string" || payload.title.trim() === "") {
    return "Field 'title' is required.";
  }

  if (payload.done !== undefined && typeof payload.done !== "boolean") {
    return "Field 'done' must be a boolean.";
  }

  return null;
}

function validateUpdatePayload(payload) {
  if (!payload || (payload.title === undefined && payload.done === undefined)) {
    return "At least one of 'title' or 'done' is required.";
  }

  if (payload.title !== undefined && (typeof payload.title !== "string" || payload.title.trim() === "")) {
    return "Field 'title' must be a non-empty string.";
  }

  if (payload.done !== undefined && typeof payload.done !== "boolean") {
    return "Field 'done' must be a boolean.";
  }

  return null;
}

export function createTodoApi(options = {}) {
  const store = options.store ?? createTodoStore();
  const requireAuth = createJwtMiddleware({
    secret: options.jwtSecret
  });

  return async function handleTodoRequest(request) {
    const auth = await requireAuth(request);

    if (auth.error) {
      return auth.error;
    }

    const userId = auth.user.id;
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const isCollectionRoute = path === "/src/api/todos" || path === "/todos" || path === "/api/todos";
    const todoIdMatch = path.match(/^\/(?:src\/api|api)?\/todos\/([^/]+)$/) ?? path.match(/^\/todos\/([^/]+)$/);

    if (isCollectionRoute && request.method === "GET") {
      return jsonResponse(200, {
        data: store.listByUser(userId).map(serializeTodo)
      });
    }

    if (isCollectionRoute && request.method === "POST") {
      const payload = await readJson(request);
      const error = validateCreatePayload(payload);

      if (error) {
        return jsonResponse(400, { error });
      }

      const todo = store.create({
        title: payload.title.trim(),
        done: payload.done ?? false,
        userId
      });

      return jsonResponse(201, { data: serializeTodo(todo) });
    }

    if (todoIdMatch && (request.method === "PUT" || request.method === "PATCH")) {
      const payload = await readJson(request);
      const normalizedPayload = {
        ...payload,
        done: payload?.done ?? payload?.completed
      };
      const error = validateUpdatePayload(normalizedPayload);

      if (error) {
        return jsonResponse(400, { error });
      }

      const todo = store.update(todoIdMatch[1], userId, {
        title: normalizedPayload.title?.trim(),
        done: normalizedPayload.done
      });

      if (!todo) {
        return jsonResponse(404, { error: "Todo not found." });
      }

      return jsonResponse(200, { data: serializeTodo(todo) });
    }

    if (todoIdMatch && request.method === "DELETE") {
      const todo = store.remove(todoIdMatch[1], userId);

      if (!todo) {
        return jsonResponse(404, { error: "Todo not found." });
      }

      return jsonResponse(200, { data: serializeTodo(todo) });
    }

    return jsonResponse(405, { error: "Method not allowed." });
  };
}
