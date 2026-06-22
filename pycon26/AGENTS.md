# Repository Guidelines

## Project Structure & Module Organization

Job and Skills Track helps learners answer: where can I go next, what skills matter most, and what should I do today? Use Next.js for the frontend and Python managed with `uv` for data processing, recommendation logic, APIs, or analysis scripts.

Example layout:

```text
apps/frontend/app/   # Next.js routes and layouts
apps/frontend/       # Frontend components, utilities, and static assets
apps/backend/app/    # FastAPI application code
apps/backend/tests/  # Python tests
docs/                # Data sources, architecture notes, product decisions
```

## Build, Test, and Development Commands

Common commands:

```sh
cd apps/frontend && pnpm install # Install frontend dependencies
cd apps/frontend && pnpm dev     # Start the Next.js development server
cd apps/frontend && pnpm build   # Build the production frontend
cd apps/frontend && pnpm lint    # Run frontend linting
cd apps/backend && uv sync       # Install Python dependencies
cd apps/backend && uv run uvicorn app.main:app --reload # Start the FastAPI backend
uv run --project apps/backend uvicorn app.main:app --app-dir apps/backend --reload # Start backend from repo root
cd apps/backend/app && uv run uvicorn main:app --host 0.0.0.0 --port 8000 # Start backend from app dir
cd apps/backend && uv run pytest # Run Python tests
```

## Coding Style & Naming Conventions

Use TypeScript for Next.js code and Tailwind CSS for frontend styling. Name components in `PascalCase`, hooks as `useThing`, route folders in lowercase, and Python modules in `snake_case`. Use Prettier and ESLint for frontend code, and Ruff for Python. Prefer typed interfaces for pathways, roles, skills, sources, and recommendations.

## Testing Guidelines

Test recommendation, scoring, and skills-gap logic early. Use `uv run pytest` for Python tests named `test_*.py`. Use the frontend test runner configured in `package.json` for Next.js tests named `*.test.ts` or `*.test.tsx`. Include fixtures for roles, skills, learner profiles, and source metadata.

## Data & Product Guidance

Build grounded features: career pathway explorers, role-to-skill maps, skills-gap analysers, reskilling recommenders, learning roadmaps, and explainable dashboards. Every dataset, taxonomy, or model output should include provenance in `docs/` or metadata.

## Commit & Pull Request Guidelines

This directory has no Git history, so no local commit convention can be inferred. Use short, imperative commit messages such as `Add skills gap scorer` or `Build role pathway dashboard`. Pull requests should include a summary, test results, linked issues, UI screenshots when relevant, and notes for data sources used.

## Security & Configuration Tips

Do not commit secrets, generated caches, or machine-specific configuration. Store required variables in `.env.example` and keep real values in an ignored `.env`. Treat learner profile data as sensitive; avoid committing real personal data or raw uploads.
