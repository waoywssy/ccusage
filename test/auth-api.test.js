import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

import { createAuthApi } from "../src/api/auth/index.js";

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

test("register hashes the password and returns a JWT", async () => {
  const repository = createUserRepository();
  const api = createAuthApi({
    userRepository: repository,
    jwtSecret: "test-secret",
    jwtExpiresIn: "1h",
    saltRounds: 4
  });

  const response = await api(
    new Request("http://local/src/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "MILA@EXAMPLE.COM",
        password: "password123"
      })
    })
  );

  assert.equal(response.status, 201);
  const payload = await readJson(response);
  assert.equal(typeof payload.token, "string");
  assert.equal(payload.user.email, "mila@example.com");
  assert.equal(payload.user.password, undefined);

  const storedUser = await repository.findByEmail("mila@example.com");
  assert.ok(storedUser);
  assert.notEqual(storedUser.password, "password123");
  assert.equal(await bcrypt.compare("password123", storedUser.password), true);
});

test("register rejects duplicate email addresses", async () => {
  const repository = createUserRepository();
  const api = createAuthApi({
    userRepository: repository,
    jwtSecret: "test-secret",
    saltRounds: 4
  });

  await api(
    new Request("http://local/src/api/auth/register", {
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

  const duplicateResponse = await api(
    new Request("http://local/src/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "mila@example.com",
        password: "another-password"
      })
    })
  );

  assert.equal(duplicateResponse.status, 409);
  assert.deepEqual(await readJson(duplicateResponse), {
    error: "User already exists."
  });
});

test("login validates credentials and returns the user", async () => {
  const repository = createUserRepository();
  const password = await bcrypt.hash("password123", 4);
  await repository.create({
    email: "mila@example.com",
    password
  });

  const api = createAuthApi({
    userRepository: repository,
    jwtSecret: "test-secret"
  });

  const response = await api(
    new Request("http://local/src/api/auth/login", {
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

  assert.equal(response.status, 200);
  const payload = await readJson(response);
  assert.equal(typeof payload.token, "string");
  assert.equal(payload.user.email, "mila@example.com");
});

test("login rejects invalid credentials", async () => {
  const repository = createUserRepository();
  const password = await bcrypt.hash("password123", 4);
  await repository.create({
    email: "mila@example.com",
    password
  });

  const api = createAuthApi({
    userRepository: repository,
    jwtSecret: "test-secret"
  });

  const response = await api(
    new Request("http://local/src/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "mila@example.com",
        password: "wrong-password"
      })
    })
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await readJson(response), {
    error: "Invalid email or password."
  });
});

test("me returns the authenticated user when the JWT is valid", async () => {
  const repository = createUserRepository();
  const password = await bcrypt.hash("password123", 4);
  const user = await repository.create({
    email: "mila@example.com",
    password
  });

  const api = createAuthApi({
    userRepository: repository,
    jwtSecret: "test-secret"
  });

  const loginResponse = await api(
    new Request("http://local/src/api/auth/login", {
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
  const loginPayload = await readJson(loginResponse);

  const meResponse = await api(
    new Request("http://local/src/api/auth/me", {
      method: "GET",
      headers: {
        authorization: `Bearer ${loginPayload.token}`
      }
    })
  );

  assert.equal(meResponse.status, 200);
  assert.deepEqual(await readJson(meResponse), {
    user: {
      id: user.id,
      email: "mila@example.com",
      createdAt: user.createdAt
    }
  });
});

test("me rejects requests without a bearer token", async () => {
  const api = createAuthApi({
    userRepository: createUserRepository(),
    jwtSecret: "test-secret"
  });

  const response = await api(
    new Request("http://local/src/api/auth/me", {
      method: "GET"
    })
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await readJson(response), {
    error: "Missing bearer token."
  });
});
