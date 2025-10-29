# Lightweight React Todo (Retro Theme) + Minimal API

This project now includes:
- Retro-themed React UI to add, list, and delete tasks
- Minimal Express API with SQLite persistence (auto-initialized)

## Run locally

In one terminal (API):
- `npm run server:dev` (starts API at http://localhost:3001)

In another terminal (React):
- `npm start` (opens http://localhost:3000, proxied to API)

The API stores data in `./data/todo.db`.

## Endpoints
- GET `/api/health`
- GET `/api/tasks`
- POST `/api/tasks` `{ "title": "Task" }`
- DELETE `/api/tasks/:id`

## Styling
Retro theme using:
- primary `#3b82f6`, secondary `#64748b`, success `#06b6d4`, error `#EF4444`
- background `#f9fafb`, surface `#ffffff`, text `#111827`

## Notes
- No authentication required.
- Database schema is created automatically on first run.
- Keep preview/startup as-is; the API is a lightweight addition for persistence.
