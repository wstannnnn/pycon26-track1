# Interaction Logs

This document summarizes collaboration evidence for the Job and Skills Track / SkillCompass AI project.

## AI-Human Collaboration

The user directed the project requirements and provided the key operating context, including:

- The project goal: a career pathway and learner profile analysis application for the Job and Skills Track.
- The data source requirement: SkillsFuture Interactive Skills Frameworks.
- The local LLM runtime command using `llama-server`.
- The need for ChromaDB indexing, unique skills indexing, architecture diagrams, UML diagrams, Swagger/OpenAPI documentation, bring-up instructions, screenshots, and demo videos.
- The sample PDF input file: `functionalsample.pdf`.
- The target-interest workflow requirement: `accountant`.

Codex assisted by:

- Reviewing the repository structure and backend/frontend implementation.
- Writing documentation:
  - `docs/bring-up.md`
  - `docs/data-provenance.md`
  - `docs/architecture-c4.md`
  - `docs/uml-diagrams.md`
  - `docs/openapi.json`
  - `docs/snapshots/README.md`
- Creating a top-level project summary in `README.md`.
- Generating C4 and UML Mermaid diagrams.
- Generating the Swagger/OpenAPI spec from the FastAPI app.
- Capturing UI screenshots for the end-to-end user flow.
- Creating Playwright-based demo video recordings and converting the final output to a YouTube-ready MP4.
- Cleaning up temporary Playwright installs, browser caches, intermediate files, and local server processes after recording.

## Prompt And Requirement Trail

The table below records the main session workflow, the prompt-driven requirement behind each stage, and where the resulting evidence lives in the repository.

| Session workflow stage | Prompt-driven requirement | Resulting evidence |
| --- | --- | --- |
| Scope and repository review | Understand the Job and Skills Track app, existing backend/frontend structure, and submission expectations before adding artifacts. | `README.md`, `apps/backend/`, `apps/frontend/` |
| Product and data grounding | Keep recommendations grounded in SkillsFuture Interactive Skills Framework data rather than generic LLM output. | `docs/data-provenance.md`, `apps/backend/scripts/join_skills_framework_workbook.py` |
| ChromaDB indexing workflow | Explain how role records, role-skill records, key tasks, and the separate `unique_skills` collection are created and indexed. | `docs/data-provenance.md`, `docs/bring-up.md`, `apps/backend/app/clients/vector_db.py` |
| Local LLM workflow | Document the local llama.cpp runtime, OpenAI-compatible backend settings, and model configuration used by learner analysis. | `docs/bring-up.md`, `apps/backend/app/clients/local_llm.py`, `apps/backend/.env.example` |
| Backend API evidence | Preserve the API contract and explain how reviewers can open Swagger locally. | `docs/openapi.json`, `docs/bring-up.md`, `apps/backend/app/main.py` |
| Architecture documentation | Create C1/C2 architecture diagrams and UML diagrams so reviewers can understand system boundaries and request flow. | `docs/architecture-c4.md`, `docs/uml-diagrams.md` |
| Local bring-up workflow | Provide reproducible commands for backend, frontend, ChromaDB indexing, local LLM startup, health checks, and Swagger access. | `docs/bring-up.md`, `README.md` |
| Main user journey | Capture the implemented UI flow from landing and login through dashboard pathway exploration and learner profile analysis. | `docs/snapshots/`, `docs/snapshots/README.md` |
| Repeatable capture workflow | Keep the Playwright script used to regenerate screenshots from the local app. | `docs/snapshots/capture-flow.mjs` |
| Demo recording workflow | Produce YouTube-ready walkthrough videos covering Explore Pathways, manual profile analysis, PDF upload with `functionalsample.pdf`, target interest `accountant`, and slow scrolling through results. | `docs/videos/skillcompass-full-demo-flow.mp4`, `docs/videos/skillcompass-flow.webm` |
| Root submission summary | Add a reviewer-facing parent-folder summary with folder structure, important documents, snapshots, and quick-start commands. | `../README.md`, `README.md` |
| Cleanup and handoff | Remove temporary local recording/install artifacts and preserve only useful submission assets. | Working tree cleanup after recording, `docs/videos/`, `docs/snapshots/` |
| Commit-message support | Summarize recent changes in a concise form suitable for version-control history. | Git history and this documentation trail. |

## Human-Human Collaboration

Human-human collaboration focused on shaping the product experience, dashboard outcome, and system design for the Job and Skills Track demo.

- UI/UX design discussions defined the learner journey from landing page to login, authenticated dashboard, pathway exploration, and profile analysis.
- The user journey was shaped around a practical learner workflow: sign in, open the Pathway Hub, explore a current-to-target career path, analyze a learner profile, upload or provide resume/profile evidence, and review recommended roles, priority skills, learning actions, and similarity evidence.
- Dashboard outcome discussions emphasized a clear career-planning result: role recommendations grounded in SkillsFuture evidence, visible match context, skill gaps, suggested next actions, and source-backed retrieval evidence.
- System design discussions covered the separation between the Next.js frontend, FastAPI backend, SQLite persistence, ChromaDB vector store, SkillsFuture data files, and local LLM runtime.
- Architecture conversations also covered how retrieval should happen before LLM generation, so the dashboard recommendations remain grounded in indexed SkillsFuture job roles, key tasks, role-skill records, and unique skills.

The resulting artifacts connect those discussions to implementation evidence:

- UI journey evidence: `docs/snapshots/`, `docs/videos/skillcompass-full-demo-flow.mp4`
- Dashboard implementation: `apps/frontend/app/dashboard/`
- System design evidence: `docs/architecture-c4.md`, `docs/uml-diagrams.md`
- Data and retrieval design: `docs/data-provenance.md`, `docs/bring-up.md`

## Related Evidence

- [Root README](../../README.md)
- [Bring-up guide](bring-up.md)
- [Data provenance](data-provenance.md)
- [C4 architecture diagrams](architecture-c4.md)
- [UML diagrams](uml-diagrams.md)
- [UI snapshots](snapshots/)
- [Demo video](videos/skillcompass-full-demo-flow.mp4)
