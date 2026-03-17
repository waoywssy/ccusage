# richmond-todo-app

Simple todo app with React on the client and a lightweight in-memory API mounted through Vite middleware during `dev` and `preview`.

## Setup

1. Copy `.env.example` to `.env`
2. Set `JWT_SECRET` to a long random string
3. Run `npm install`
4. Start the app with `npm run dev`

## Notes

- Client requests default to `VITE_API_BASE_URL=/api`
- The dev/preview API uses an in-memory store, so data resets on server restart
- The API refuses to start without `JWT_SECRET`
