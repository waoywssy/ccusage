import { createApiRouter } from "./index.js";
import { createInMemoryUserRepository } from "./dev-user-repository.js";
import { requireJwtSecret } from "./jwt-config.js";

function createNodeRequestUrl(req) {
  const protocol = req.headers["x-forwarded-proto"] ?? "http";
  const host = req.headers.host ?? "localhost:5173";

  return new URL(req.url ?? "/", `${protocol}://${host}`);
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks);
}

async function toFetchRequest(req) {
  const body = req.method === "GET" || req.method === "HEAD"
    ? undefined
    : await readRequestBody(req);

  return new Request(createNodeRequestUrl(req), {
    method: req.method,
    headers: req.headers,
    body,
    duplex: body ? "half" : undefined
  });
}

async function sendFetchResponse(fetchResponse, res) {
  res.statusCode = fetchResponse.status;

  fetchResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = fetchResponse.body ? Buffer.from(await fetchResponse.arrayBuffer()) : Buffer.alloc(0);
  res.end(body);
}

export function createApiPlugin(options = {}) {
  let apiRouter;

  function getRouter() {
    if (!apiRouter) {
      apiRouter = createApiRouter({
        userRepository: options.userRepository ?? createInMemoryUserRepository(),
        todoStore: options.todoStore,
        jwtSecret: requireJwtSecret(options.jwtSecret ?? process.env.JWT_SECRET),
        jwtExpiresIn: options.jwtExpiresIn,
        saltRounds: options.saltRounds
      });
    }

    return apiRouter;
  }

  async function handle(req, res, next) {
    if (!req.url?.startsWith("/api/")) {
      next();
      return;
    }

    const request = await toFetchRequest(req);
    const response = await getRouter()(request);
    await sendFetchResponse(response, res);
  }

  return {
    name: "todo-api-plugin",
    configureServer(server) {
      getRouter();
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      getRouter();
      server.middlewares.use(handle);
    }
  };
}
