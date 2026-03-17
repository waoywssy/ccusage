export function createInMemoryUserRepository() {
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
        createdAt: new Date().toISOString()
      };

      users.push(user);
      return user;
    }
  };
}
