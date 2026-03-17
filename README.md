# richmond-todo-app

Simple todo app with React on the client and a lightweight in-memory API mounted through Vite middleware during `dev` and `preview`.

## Setup

1. Copy `.env.example` to `.env`
2. Set `JWT_SECRET` to a long random string
3. Run `npm install`
4. Start the app with `npm run dev`

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

The client uses `VITE_API_BASE_URL=/api` by default, and the Vite middleware serves both auth and todo endpoints from the same origin while developing locally.

## Verify The App

### Browser smoke check

1. Open `http://127.0.0.1:5173/`
2. Create an account with any valid email and a password of at least 8 characters
3. Confirm you land on `/todos`
4. Add a todo, mark it complete, then refresh the page and confirm the session still loads

### API smoke check

Start the app with a JWT secret:

```bash
JWT_SECRET=test-secret npm run dev -- --host 127.0.0.1
```

Then run:

```bash
register=$(curl -sS -X POST http://127.0.0.1:5173/api/auth/register \
  -H 'content-type: application/json' \
  --data '{"email":"demo@example.com","password":"password123"}')

token=$(printf '%s' "$register" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(JSON.parse(s).token))")

curl -sS http://127.0.0.1:5173/api/auth/me \
  -H "authorization: Bearer $token"

curl -sS -X POST http://127.0.0.1:5173/api/todos \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $token" \
  --data '{"title":"verify live api"}'

curl -sS http://127.0.0.1:5173/api/todos \
  -H "authorization: Bearer $token"
```

## Notes

- The dev/preview API uses in-memory storage, so data resets when the Vite server restarts
- The API refuses to start without `JWT_SECRET`
- `npm test`, `npm run typecheck`, and `npm run build` all pass against the current branch
