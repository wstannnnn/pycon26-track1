# Backend

FastAPI service for Job and Skills Track.

The backend uses Tortoise ORM models for persistence and Pydantic schemas for request
validation and API responses. Database access should live in `app/repositories/` and be injected
into routers with FastAPI dependencies from `app/dependencies.py`.

## Commands

```sh
uv sync
uv run uvicorn app.main:app --reload
uv run pytest
uv run ruff check .
```

If your terminal is at the repository root, use:

```sh
uv run --project apps/backend uvicorn app.main:app --app-dir apps/backend --reload
```

If your terminal is in `apps/backend/app`, use:

```sh
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

The default database is SQLite via `DATABASE_URL=sqlite://db.sqlite3`.

## User Endpoints

```text
POST /auth/login
POST /users
GET /users/{user_id}
PATCH /users/{user_id}/password
```

User responses exclude password fields. Password updates require the current password.

## Vector DB Endpoints

The vector client uses local persistent ChromaDB configured with:

```text
VECTOR_DB_PATH=./chroma
VECTOR_DB_COLLECTION=job_skills
VECTOR_DB_AUTO_INDEX=true
SKILLS_DATA_DIR=../../data
```

```text
POST /vectors/upsert
POST /vectors/search
POST /vectors/index
```

`/vectors/index` seeds ChromaDB from the local SkillsFuture files in `data/`:

- `jobsandskills-skillsfuture-unique-skills-list.xlsx`
- `jobsandskills-skillsfuture-skills-framework-dataset.xlsx`
- `jobsandskills-skillsfuture-tsc-to-unique-skills-mapping.xlsx`

## Learner Analysis Endpoint

```text
POST /learner/analyze
```

Accepts current role, target interest, skillset text, and resume text. The service performs a
ChromaDB similarity search first, then uses the configured local LLM to generate the
recommendation. If the local LLM is disabled, unavailable, or returns invalid JSON, the endpoint
returns `502` instead of a mock recommendation.

```text
LOCAL_LLM_URL=http://localhost:8080
LOCAL_LLM_MODEL=GLM-4.7-Flash-Q2_K.gguf
LOCAL_LLM_PROVIDER=openai-compatible
LOCAL_LLM_ENABLED=true
```

Use `LOCAL_LLM_PROVIDER=ollama` for Ollama's `/api/generate` API. The default
`openai-compatible` provider calls `/v1/chat/completions`, which is common for local LLM
servers on port `8080`.
