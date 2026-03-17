import { createInMemoryUserRepository } from "./dev-user-repository.js";
import { createApiRouter } from "./index.js";
import { requireJwtSecret } from "./jwt-config.js";

const API_PREFIX = "/api/";
const BODYLESS_METHODS = new Set(["GET", "HEAD"]);

function createNodeRequestUrl(req) {
  const protocol = req.headers["x-forwarded-proto"] ?? "http";
  const host = req.headers.host ?? "localhost:5173";

  return new URL(req.url ?? "/", `${protocol}://${host}`);
}

function isBodylessMethod(method) {
  return BODYLESS_METHODS.has(method ?? "GET");
}

function isApiRequest(url) {
  return typeof url === "string" && url.startsWith(API_PREFIX);
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

async function toFetchRequest(req) {
  const body = isBodylessMethod(req.method)
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

  if (!fetchResponse.body) {
    res.end();
    return;
  }

  res.end(Buffer.from(await fetchResponse.arrayBuffer()));
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
    if (!isApiRequest(req.url)) {
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
