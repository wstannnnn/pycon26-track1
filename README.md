# PyCon 2026 Track 1 Project Summary

This workspace contains the `pycon26` Job and Skills Track application. It is a career pathway and skills intelligence demo that combines a Next.js frontend, a FastAPI backend, local SkillsFuture data, ChromaDB vector retrieval, and a local llama.cpp LLM server.

## What Has Been Done

- Built a monorepo-style application under `pycon26/`.
- Added a FastAPI backend with endpoints for authentication, users, roles, career pathways, learner analysis, resume upload, vector indexing, and vector search.
- Added a Next.js frontend with landing, login, registration, dashboard, learner intake, pathway generation, dark mode, and evidence display.
- Added ChromaDB vector indexing for SkillsFuture job roles, role-skill records, key tasks, and unique skills.
- Added learner analysis that retrieves SkillsFuture evidence first, then generates recommendations through a local LLM.
- Added stricter target interest validation and clearer `404` behavior when a target role is not indexed.
- Added documentation for data provenance, bring-up steps, C4 architecture diagrams, UML diagrams, and Swagger/OpenAPI.
- Generated a Swagger/OpenAPI spec for the backend endpoints.

## Folder Structure

```text
pycon26-track1/
├── README.md
└── pycon26/
    ├── README.md
    ├── AGENTS.md
    ├── apps/
    │   ├── backend/
    │   │   ├── app/
    │   │   │   ├── clients/
    │   │   │   ├── repositories/
    │   │   │   ├── routers/
    │   │   │   ├── schemas/
    │   │   │   ├── services/
    │   │   │   ├── config.py
    │   │   │   ├── db.py
    │   │   │   └── main.py
    │   │   ├── scripts/
    │   │   │   └── join_skills_framework_workbook.py
    │   │   ├── tests/
    │   │   ├── README.md
    │   │   └── pyproject.toml
    │   └── frontend/
    │       ├── app/
    │       ├── components/
    │       ├── lib/
    │       ├── public/
    │       └── package.json
    └── docs/
        ├── architecture-c4.md
        ├── bring-up.md
        ├── data-provenance.md
        ├── openapi.json
        └── uml-diagrams.md
```

## Important Documents

- `pycon26/README.md`: main application README.
- `pycon26/docs/bring-up.md`: how to download data, index ChromaDB, run llama.cpp, start the backend, open Swagger, and start the frontend.
- `pycon26/docs/data-provenance.md`: SkillsFuture source data and retrieval flow.
- `pycon26/docs/architecture-c4.md`: C1 and C2 architecture diagrams.
- `pycon26/docs/uml-diagrams.md`: learner analysis class and sequence diagrams.
- `pycon26/docs/openapi.json`: generated Swagger/OpenAPI spec.

## Quick Start

Backend:

```sh
cd pycon26/apps/backend
uv sync
uv run uvicorn app.main:app --reload
```

Frontend:

```sh
cd pycon26/apps/frontend
pnpm install
pnpm dev
```

Swagger UI:

```text
http://localhost:8000/docs
```
