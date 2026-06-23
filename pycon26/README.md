# Job and Skills Track

Monorepo for a career pathway and skills intelligence product.

Architecture diagrams live in [`docs/architecture-c4.md`](docs/architecture-c4.md).
UML diagrams live in [`docs/uml-diagrams.md`](docs/uml-diagrams.md).
Bring-up instructions live in [`docs/bring-up.md`](docs/bring-up.md).
Swagger/OpenAPI spec lives in [`docs/openapi.json`](docs/openapi.json).
Data provenance and retrieval notes live in [`docs/data-provenance.md`](docs/data-provenance.md).

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
