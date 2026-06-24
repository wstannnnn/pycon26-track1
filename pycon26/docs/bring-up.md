# Bring-Up Guide

This guide starts the Job and Skills Track stack from local SkillsFuture data, ChromaDB indexing, a local llama.cpp LLM server, the FastAPI backend, and the Next.js frontend.

## Makefile Quick Path

From the repository root, the main bring-up commands are available as Make targets:

```sh
make embedding-model
make join-data
make backend
make frontend
make index
make health
```

Run `make help` to list all available targets. Use separate terminal windows for long-running services such as `make backend`, `make frontend`, and `make llm`.

## 1. Download SkillsFuture Data

Download the SkillsFuture Skills Framework source files from:

https://jobsandskills.skillsfuture.gov.sg/frameworks/interactive-skills-frameworks#interactive-skills-frameworks

Place the downloaded files in `pycon26/data/` using these filenames:

```text
pycon26/data/jobsandskills-skillsfuture-skills-framework-dataset.xlsx
pycon26/data/jobsandskills-skillsfuture-unique-skills-list.xlsx
pycon26/data/jobsandskills-skillsfuture-tsc-to-unique-skills-mapping.xlsx
```

The backend expects these paths through `SKILLS_DATA_DIR=../../data` when run from `apps/backend`.

## 2. Concatenate Role Data

Generate joined role-level records from the Skills Framework workbook:

```sh
cd pycon26/apps/backend
uv sync
uv run python scripts/join_skills_framework_workbook.py
```

This creates:

```text
pycon26/data/processed/skills_framework_joined_roles.jsonl
```

The join script combines role descriptions, critical work functions, key tasks, role-to-skill mappings, skill definitions, proficiency descriptions, knowledge items, and ability items into one searchable record per job role.

## 3. Prepare the Unique Skills Source

The `unique_skills` ChromaDB collection is created from the SkillsFuture unique skills list.

The backend looks for the source in this order:

```text
pycon26/data/processed/jobsandskills-skillsfuture-unique-skills-list.json
pycon26/data/jobsandskills-skillsfuture-unique-skills-list.xlsx
```

If the processed JSON file exists, the backend indexes that file. If it does not exist, the backend falls back to the downloaded Excel workbook.

The JSON shape, when used, should look like this:

```json
{
  "sheets": {
    "Unique Skills List": [
      {
        "skill_title": "Data Analytics",
        "skill_description": "Analyse data to identify patterns.",
        "skill_type": "tsc",
        "Emerging Skills": false,
        "CASL Skills": true
      }
    ]
  }
}
```

During indexing, each row becomes a vector point with:

```text
record_type=unique_skill
skill=<skill_title>
description=<skill_description>
skill_type=<skill_type>
emerging_skill=<Emerging Skills>
casl_skill=<CASL Skills>
```

No manual ChromaDB setup is required. The backend creates or resets the configured `VECTOR_DB_UNIQUE_SKILLS_COLLECTION`, which defaults to `unique_skills`.

## 4. Run ChromaDB Indexing APIs

Start the backend first:

```sh
cd pycon26/apps/backend
uv run uvicorn app.main:app --reload
```

In another terminal, index the joined role, role-skill, and key-task records into the main ChromaDB collection:

```sh
curl -X POST http://localhost:8000/vectors/index
```

Then index the SkillsFuture unique skills list into the separate `unique_skills` collection:

```sh
curl -X POST http://localhost:8000/vectors/index/unique-skills
```

That endpoint:

1. Finds the processed unique skills JSON, or falls back to the downloaded workbook.
2. Deletes the existing `unique_skills` collection if it exists.
3. Creates the `unique_skills` collection with cosine HNSW search.
4. Upserts one vector record per unique skill.

Check the available ChromaDB collections:

```sh
curl http://localhost:8000/vectors/collections
```

Expected collections include:

```text
job_skills
unique_skills
```

By default, vectors are stored under:

```text
pycon26/apps/backend/chroma
```

The relevant backend settings are:

```text
VECTOR_DB_PATH=./chroma
VECTOR_DB_COLLECTION=job_skills
VECTOR_DB_UNIQUE_SKILLS_COLLECTION=unique_skills
VECTOR_DB_HNSW_SPACE=cosine
VECTOR_DB_AUTO_INDEX=true
VECTOR_DB_EMBEDDING_PROVIDER=ollama
VECTOR_DB_EMBEDDING_MODEL=nomic-embed-text
VECTOR_DB_EMBEDDING_URL=http://localhost:11434
VECTOR_DB_EMBEDDING_TIMEOUT=60
SKILLS_DATA_DIR=../../data
```

If `VECTOR_DB_EMBEDDING_PROVIDER=ollama`, pull the embedding model before indexing:

```sh
ollama pull nomic-embed-text
```

Changing the embedding provider or model changes vector dimensions, so rebuild both ChromaDB collections after changing those settings.

## 5. Run Local LLM With llama.cpp

Start a llama.cpp server on port `8080`:

```sh
llama-server \
  --model "/Users/tanweisiang/project/huggingface/models/NVIDIA-Nemotron-3-Nano-4B-Q8_0.gguf" \
  --host 0.0.0.0 \
  --embeddings \
  --pooling cls \
  --ctx-size 32768 \
  --temp 1.0 \
  --top-p 0.95 \
  --port 8080 \
  --fit on \
  --prio 3 \
  -ngl -1 \
  --flash-attn auto \
  --batch-size 1024 \
  --ubatch-size 256
```

The backend defaults to an OpenAI-compatible local LLM endpoint:

```text
LOCAL_LLM_URL=http://localhost:8080
LOCAL_LLM_MODEL=GLM-4.7-Flash-Q2_K.gguf
LOCAL_LLM_PROVIDER=openai-compatible
LOCAL_LLM_ENABLED=true
```

If the llama.cpp model name differs from `LOCAL_LLM_MODEL`, update `apps/backend/.env` or export the value before starting the backend:

```sh
export LOCAL_LLM_MODEL=NVIDIA-Nemotron-3-Nano-4B-Q8_0.gguf
```

## 6. Run the Backend

From the backend directory:

```sh
cd pycon26/apps/backend
uv sync
uv run uvicorn app.main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

Useful health check:

```sh
curl http://localhost:8000/health
```

## 7. Open Swagger API Docs

After the backend is running, open FastAPI's live Swagger UI:

```text
http://localhost:8000/docs
```

The raw OpenAPI JSON is also available from the running backend:

```text
http://localhost:8000/openapi.json
```

This repository also keeps a generated Swagger/OpenAPI file at:

```text
pycon26/docs/openapi.json
```

To refresh that checked-in file after endpoint changes:

```sh
cd pycon26/apps/backend
uv run python -c 'import json; from pathlib import Path; from app.main import app; Path("../../docs/openapi.json").write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")'
```

You can import `pycon26/docs/openapi.json` into Swagger Editor, Postman, Insomnia, or any OpenAPI-compatible client.

## 8. Run the Next.js Frontend

From the frontend directory:

```sh
cd pycon26/apps/frontend
pnpm install
pnpm dev
```

The frontend runs at:

```text
http://localhost:3000
```

The frontend defaults to:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

If needed, create `apps/frontend/.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 9. End-to-End Check

1. Open `http://localhost:3000`.
2. Register or log in.
3. Go to the dashboard.
4. Generate a career pathway with a target role that exists in the indexed SkillsFuture job roles.
5. Analyze a learner profile with current skills and a target interest.
6. Confirm that the response includes matched evidence, priority skills, actions today, and the LLM provider.

If the target interest is not found in indexed job roles, the backend returns `404` so the frontend can show a clear error.

## 10. Expected Dashboard Outcome

The intended UI/UX journey is login to dashboard to analysis. A successful run should let the learner:

1. Sign in and reach the Pathway Hub.
2. Explore a pathway from a current role to a target role.
3. Submit learner profile details or resume/PDF-derived evidence.
4. Review recommended next roles, priority skills, suggested actions, and the explanation.
5. Inspect similarity evidence showing the SkillsFuture records used to ground the recommendation.

This reflects the system-design decision to retrieve SkillsFuture evidence first, then use the local LLM to turn that evidence into a readable dashboard result.
