SHELL := /bin/bash

BACKEND_DIR := pycon26/apps/backend
FRONTEND_DIR := pycon26/apps/frontend
BACKEND_URL ?= http://localhost:8000
FRONTEND_URL ?= http://localhost:3000
OLLAMA_EMBEDDING_MODEL ?= nomic-embed-text
LLM_MODEL_PATH ?= /Users/tanweisiang/project/huggingface/models/NVIDIA-Nemotron-3-Nano-4B-Q8_0.gguf
LLM_PORT ?= 8080

.PHONY: help join-data embedding-model backend frontend llm index index-roles index-unique-skills collections health openapi snapshots test-backend lint-backend

help:
	@printf "Job and Skills Track bring-up targets:\n"
	@printf "  make join-data            Generate joined SkillsFuture role JSONL\n"
	@printf "  make embedding-model      Pull the Ollama embedding model\n"
	@printf "  make backend              Run FastAPI at $(BACKEND_URL)\n"
	@printf "  make frontend             Run Next.js at $(FRONTEND_URL)\n"
	@printf "  make llm                  Run llama.cpp server on port $(LLM_PORT)\n"
	@printf "  make index                Index job skills and unique skills\n"
	@printf "  make collections          List ChromaDB collections\n"
	@printf "  make health               Check backend health\n"
	@printf "  make snapshots            Capture UI flow screenshots\n"
	@printf "  make test-backend         Run backend tests\n"

join-data:
	cd $(BACKEND_DIR) && uv run python scripts/join_skills_framework_workbook.py

embedding-model:
	ollama pull $(OLLAMA_EMBEDDING_MODEL)

backend:
	cd $(BACKEND_DIR) && uv run uvicorn app.main:app --reload

frontend:
	cd $(FRONTEND_DIR) && pnpm dev

llm:
	llama-server \
		--model "$(LLM_MODEL_PATH)" \
		--host 0.0.0.0 \
		--embeddings \
		--pooling cls \
		--ctx-size 32768 \
		--temp 1.0 \
		--top-p 0.95 \
		--port $(LLM_PORT) \
		--fit on \
		--prio 3 \
		-ngl -1 \
		--flash-attn auto \
		--batch-size 1024 \
		--ubatch-size 256

index: index-roles index-unique-skills collections

index-roles:
	curl -X POST $(BACKEND_URL)/vectors/index

index-unique-skills:
	curl -X POST $(BACKEND_URL)/vectors/index/unique-skills

collections:
	curl $(BACKEND_URL)/vectors/collections

health:
	curl $(BACKEND_URL)/health

snapshots:
	node pycon26/docs/snapshots/capture-flow.mjs

test-backend:
	cd $(BACKEND_DIR) && uv run pytest

lint-backend:
	cd $(BACKEND_DIR) && uv run ruff check .
