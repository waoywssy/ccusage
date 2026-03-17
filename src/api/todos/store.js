import { randomBytes } from "node:crypto";

function createCuidLikeId() {
  return `c${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
}

export function createTodoStore() {
  const todos = [];

  function listByUser(userId) {
    return todos
      .filter((todo) => todo.userId === userId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  function create(input) {
    const todo = {
      id: createCuidLikeId(),
      title: input.title,
      done: Boolean(input.done),
      userId: input.userId,
      createdAt: new Date().toISOString()
    };

    todos.push(todo);
    return todo;
  }

  function update(id, userId, updates) {
    const todo = todos.find((item) => item.id === id && item.userId === userId);

    if (!todo) {
      return null;
    }

    if (updates.title !== undefined) {
      todo.title = updates.title;
    }

    if (updates.done !== undefined) {
      todo.done = Boolean(updates.done);
    }

    return todo;
  }

  function remove(id, userId) {
    const index = todos.findIndex((item) => item.id === id && item.userId === userId);

    if (index === -1) {
      return null;
    }

    const [deleted] = todos.splice(index, 1);
    return deleted;
  }

  return {
    create,
    listByUser,
    remove,
    update
  };
}
