import test from "node:test";
import assert from "node:assert/strict";

import { createApiRouter } from "../src/api/index.js";

function createUserRepository() {
  const users = [];
  let counter = 1;

  return {
    async findByEmail(email) {
      return users.find((user) => user.email === email) ?? null;
    },
    async findById(id) {
      return users.find((user) => user.id === id) ?? null;
    },
    async create(input) {
      const user = {
        id: `user-${counter++}`,
        email: input.email,
        password: input.password,
        createdAt: new Date("2026-03-17T00:00:00.000Z").toISOString()
      };

      users.push(user);
      return user;
    }
  };
}

async function readJson(response) {
  return response.json();
}

test("registered auth token can access the todo API", async () => {
  const api = createApiRouter({
    userRepository: createUserRepository(),
    jwtSecret: "test-secret",
    saltRounds: 4
  });

  const registerResponse = await api(
    new Request("http://local/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "mila@example.com",
        password: "password123"
      })
    })
  );
  const registerPayload = await readJson(registerResponse);

  assert.equal(registerResponse.status, 201);
  assert.equal(typeof registerPayload.token, "string");

  const createTodoResponse = await api(
    new Request("http://local/todos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${registerPayload.token}`
      },
      body: JSON.stringify({
        title: "Ship auth flow"
      })
    })
  );

  assert.equal(createTodoResponse.status, 201);
  const createdTodo = await readJson(createTodoResponse);

  assert.equal(typeof createdTodo.data.id, "string");
  assert.deepEqual(createdTodo, {
    data: {
      id: createdTodo.data.id,
      title: "Ship auth flow",
      done: false,
      userId: registerPayload.user.id
    }
  });
});

test("supports /api auth routes used by the browser client", async () => {
  const api = createApiRouter({
    userRepository: createUserRepository(),
    jwtSecret: "test-secret",
    saltRounds: 4
  });

  const registerResponse = await api(
    new Request("http://local/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "nora@example.com",
        password: "password123"
      })
    })
  );

  assert.equal(registerResponse.status, 201);

  const loginResponse = await api(
    new Request("http://local/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "nora@example.com",
        password: "password123"
      })
    })
  );
  const loginPayload = await readJson(loginResponse);

  assert.equal(loginResponse.status, 200);
  assert.equal(typeof loginPayload.token, "string");

  const meResponse = await api(
    new Request("http://local/api/auth/me", {
      method: "GET",
      headers: {
        authorization: `Bearer ${loginPayload.token}`
      }
    })
  );

  assert.equal(meResponse.status, 200);
  assert.deepEqual(await readJson(meResponse), {
    user: {
      id: loginPayload.user.id,
      email: "nora@example.com",
      createdAt: loginPayload.user.createdAt
    }
  });
});

test("requires an explicit JWT secret", async () => {
  assert.throws(() => createApiRouter({ userRepository: createUserRepository() }), {
    message: "A non-empty JWT secret is required."
  });
});
