# Job and Skills Track

Monorepo for a career pathway and skills intelligence product.

## Apps

- `apps/backend`: FastAPI backend using Tortoise ORM and `uv`.
- `apps/frontend`: Next.js frontend.

## Local Development

Backend:

```sh
cd apps/backend
uv sync
uv run uvicorn app.main:app --reload
```

From the repository root:

```sh
uv run --project apps/backend uvicorn app.main:app --app-dir apps/backend --reload
```

From `apps/backend/app`:

```sh
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

Frontend:

```sh
cd apps/frontend
pnpm install
pnpm dev
```

Backend checks:

```sh
cd apps/backend
uv run pytest
```

The frontend expects `NEXT_PUBLIC_API_BASE_URL` to point at the backend, defaulting to `http://localhost:8000`.
