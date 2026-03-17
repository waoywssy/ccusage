import test from "node:test";
import assert from "node:assert/strict";

import { createTodoApi } from "../src/api/todos/index.js";
import { createTestJwt } from "../src/api/todos/jwt.js";

const secret = "test-secret";

function createAuthHeader(userId, overrides = {}) {
  const token = createTestJwt(
    {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 60,
      ...overrides
    },
    secret
  );

  return {
    authorization: `Bearer ${token}`
  };
}

async function readJson(response) {
  return response.json();
}

test("rejects requests without a JWT", async () => {
  const api = createTodoApi({ jwtSecret: secret });
  const response = await api(new Request("http://local/src/api/todos", { method: "GET" }));

  assert.equal(response.status, 401);
  assert.deepEqual(await readJson(response), {
    error: "Missing bearer token."
  });
});

test("supports creating and listing todos per user", async () => {
  const api = createTodoApi({ jwtSecret: secret });

  const createResponse = await api(
    new Request("http://local/src/api/todos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...createAuthHeader("user-1")
      },
      body: JSON.stringify({
        title: "Buy milk"
      })
    })
  );

  assert.equal(createResponse.status, 201);
  const createdTodo = await readJson(createResponse);
  assert.equal(typeof createdTodo.data.id, "string");
  assert.equal(createdTodo.data.title, "Buy milk");
  assert.equal(createdTodo.data.done, false);
  assert.equal(createdTodo.data.userId, "user-1");

  await api(
    new Request("http://local/src/api/todos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...createAuthHeader("user-2")
      },
      body: JSON.stringify({
        title: "Other user task",
        done: true
      })
    })
  );

  const listResponse = await api(
    new Request("http://local/src/api/todos", {
      method: "GET",
      headers: createAuthHeader("user-1")
    })
  );

  assert.equal(listResponse.status, 200);
  assert.deepEqual(await readJson(listResponse), {
    data: [
      {
        id: createdTodo.data.id,
        title: "Buy milk",
        done: false,
        userId: "user-1"
      }
    ]
  });
});

test("supports updating and deleting a todo for the authenticated user", async () => {
  const api = createTodoApi({ jwtSecret: secret });

  const createResponse = await api(
    new Request("http://local/src/api/todos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...createAuthHeader("user-1")
      },
      body: JSON.stringify({
        title: "Initial title"
      })
    })
  );
  const createdTodo = await readJson(createResponse);

  const updateResponse = await api(
    new Request(`http://local/src/api/todos/${createdTodo.data.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...createAuthHeader("user-1")
      },
      body: JSON.stringify({
        title: "Updated title",
        done: true
      })
    })
  );

  assert.equal(updateResponse.status, 200);
  assert.deepEqual(await readJson(updateResponse), {
    data: {
      id: createdTodo.data.id,
      title: "Updated title",
      done: true,
      userId: "user-1"
    }
  });

  const deleteResponse = await api(
    new Request(`http://local/src/api/todos/${createdTodo.data.id}`, {
      method: "DELETE",
      headers: createAuthHeader("user-1")
    })
  );

  assert.equal(deleteResponse.status, 200);
  assert.deepEqual(await readJson(deleteResponse), {
    data: {
      id: createdTodo.data.id,
      title: "Updated title",
      done: true,
      userId: "user-1"
    }
  });
});

test("returns 404 when modifying another user's todo", async () => {
  const api = createTodoApi({ jwtSecret: secret });

  const createResponse = await api(
    new Request("http://local/src/api/todos", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...createAuthHeader("user-1")
      },
      body: JSON.stringify({
        title: "Private task"
      })
    })
  );
  const createdTodo = await readJson(createResponse);

  const response = await api(
    new Request(`http://local/src/api/todos/${createdTodo.data.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...createAuthHeader("user-2")
      },
      body: JSON.stringify({
        done: true
      })
    })
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await readJson(response), {
    error: "Todo not found."
  });
});
