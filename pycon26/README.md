# Job and Skills Track

Monorepo for a career pathway and skills intelligence product.

Architecture diagrams live in [`docs/architecture-c4.md`](docs/architecture-c4.md).
UML diagrams live in [`docs/uml-diagrams.md`](docs/uml-diagrams.md).
Bring-up instructions live in [`docs/bring-up.md`](docs/bring-up.md).
Swagger/OpenAPI spec lives in [`docs/openapi.json`](docs/openapi.json).
Data provenance and retrieval notes live in [`docs/data-provenance.md`](docs/data-provenance.md).
Collaboration and requirement traceability live in [`docs/interaction-logs.md`](docs/interaction-logs.md).

## User Journey And Dashboard Outcome

The primary user journey is:

1. Open the landing page.
2. Register or log in.
3. Enter the authenticated Pathway Hub dashboard.
4. Generate a current-to-target career pathway.
5. Analyze a learner profile with skills, resume/profile evidence, or uploaded PDF content.
6. Review recommended roles, priority skills, learning actions, and source-backed similarity evidence.

The dashboard is designed around evidence-first career planning. SkillsFuture records are retrieved through ChromaDB before the local LLM generates recommendations, so users can see both the suggested next steps and the source evidence behind them.

## Apps

- `apps/backend`: FastAPI backend using Tortoise ORM and `uv`.
- `apps/frontend`: Next.js frontend.

## Local Development

From the repository root, common bring-up commands are available through `make`:

```sh
make embedding-model
make join-data
make backend
make frontend
make index
```

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
