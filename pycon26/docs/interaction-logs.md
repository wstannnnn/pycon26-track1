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

Key user prompts included:

- Write commit messages for recent changes.
- Create C1 and C2 architecture diagrams.
- Create UML diagrams.
- Document how to bring up the system.
- Explain how to create and index the `unique_skills` collection.
- Create a Swagger/OpenAPI file.
- Document how to open Swagger.
- Add a parent-folder summary and folder structure.
- Capture snapshots from login through pathway exploration and profile analysis.
- Keep the Playwright capture script.
- Clean temporary Playwright installs and caches.
- Embed snapshots in the root README.
- Create YouTube-ready demo recordings, including:
  - Explore Pathways.
  - Manual profile analysis.
  - PDF upload using `functionalsample.pdf`.
  - Target interest `accountant`.
  - Slow scrolling to the bottom of results.

## Human-Human Collaboration

Human-human stakeholder discussions are not currently captured in this repository.

Known human contribution in this repo:

- The project owner/user supplied product direction, local environment details, data-source requirements, LLM runtime configuration, and the sample PDF used in the recorded workflow.

If additional team or stakeholder discussions occurred outside this repository, add meeting notes, chat exports, design-review notes, or decision logs here or in a linked folder.

## Related Evidence

- [Root README](../../README.md)
- [Bring-up guide](bring-up.md)
- [Data provenance](data-provenance.md)
- [C4 architecture diagrams](architecture-c4.md)
- [UML diagrams](uml-diagrams.md)
- [UI snapshots](snapshots/)
- [Demo video](videos/skillcompass-full-demo-flow.mp4)
