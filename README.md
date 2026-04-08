# Glean Coding Exercise Prototype

This repository contains a small employee-support chatbot prototype built around the Glean Indexing, Search, and Chat APIs plus a local MCP tool.

The project indexes a constrained fixture corpus into a sandbox datasource, retrieves relevant content for a natural-language question, and asks Glean Chat to produce a grounded answer with citations.

## What Is Included

- a TypeScript CLI for ingest and ask flows
- a local MCP server exposing one tool: `ask_company_docs`
- a small employee-support fixture corpus under `fixtures/employee-support/`
- unit tests, an end-to-end smoke script, and GitHub Actions validation
- sprint memos under `memos/` covering planning, blocker resolution, testing, deploy readiness, and final documentation

## Repository Map

- `src/config.ts`: environment loading and runtime config validation
- `src/fixtures.ts`: fixture corpus metadata and file loading
- `src/workflow.ts`: Glean ingest, search, and grounded chat orchestration
- `src/cli.ts`: local ingest and ask command surface
- `src/mcp.ts`: MCP server registration for `ask_company_docs`
- `test/`: focused unit coverage for config and workflow helpers
- `scripts/`: reviewer-facing setup, demo, and cleanup wrappers
- `memos/`: planning, validation, deploy, and design documentation

## Diagrams

Open these in Excalidraw for a quick visual pass:

- `memos/diagrams/solution-overview.excalidraw`
- `memos/diagrams/runtime-architecture.excalidraw`
- `memos/diagrams/request-data-flow.excalidraw`
- `memos/diagrams/runtime-flow-annotated.excalidraw`

## Requirements

- Node.js 22 or later
- npm
- access to the Glean sandbox instance and datasource family used for the exercise
- valid values in `env/variables.env` and `env/secrets.env`

## Quick Start

1. Install dependencies and create `env/secrets.env` from the tracked example if it is missing:

```bash
npm run setup
```

2. Fill in `env/secrets.env` using `env/secrets.env.example`. Review `env/variables.env` if you need to change the tracked non-sensitive defaults.

3. Run the local quality suite:

```bash
npm run check
```

4. Build the project:

```bash
npm run build
```

5. Run the default end-to-end demo:

```bash
npm run demo
```

## Environment Variables

Tracked non-sensitive config in `env/variables.env`:

- `GLEAN_INSTANCE`
- `GLEAN_DEFAULT_DATASOURCE`
- `GLEAN_DEFAULT_TOP_K`
- optional `GLEAN_SERVER_URL`

Populate secrets and user-specific values in `env/secrets.env`:

- `GLEAN_INDEXING_API_TOKEN`
- `GLEAN_SEARCH_API_TOKEN`
- `GLEAN_CLIENT_API_TOKEN`
- `GLEAN_ALLOWED_USER_EMAIL` or `GLEAN_CLIENT_ACT_AS`

Required identity input:

- `GLEAN_ALLOWED_USER_EMAIL` for document visibility during ingest, or
- `GLEAN_CLIENT_ACT_AS` when the same sandbox user should also be reused as the ingest visibility identity

Tracked defaults already supplied in `env/variables.env`:

- `GLEAN_INSTANCE=support-lab`
- `GLEAN_DEFAULT_DATASOURCE=interviewds`
- `GLEAN_DEFAULT_TOP_K=4`

Optional overrides:

- `GLEAN_SERVER_URL`
- `GH_TOKEN`
- `LINEAR_API_KEY`

## Commands

- `npm run setup`: install dependencies and create `env/secrets.env` from the tracked example when missing
- `npm run ingest`: index the fixture corpus into the configured datasource
- `npm run ask -- --question "..."`: run retrieval plus grounded answer generation from the CLI
- `npm run demo`: run the default ingest and question flow
- `npm run mcp`: start the local MCP server over stdio
- `npm run check`: run lint, typecheck, and unit tests
- `npm run build`: compile TypeScript to `dist/`
- `npm run test:e2e -- --allowed-user-email user@example.com`: run the sandbox smoke test
- `npm run clean`: remove local build output

## CLI Examples

Ingest the fixture corpus:

```bash
npm run ingest
```

Ask a question:

```bash
npm run ask -- --question "Can I work remotely while attending a conference abroad?"
```

Override the datasource or retrieval depth:

```bash
npm run ask -- --datasource interviewds --top-k 5 --question "How long do I have to submit travel receipts?"
```

## MCP Usage

Start the server:

```bash
npm run mcp
```

Registered tool:

- `ask_company_docs`

Example tool input:

```json
{
  "question": "Can I work remotely while attending a conference abroad?",
  "datasource": "interviewds",
  "topK": 4,
  "includeCitations": true
}
```

The tool returns both plain text content and structured output containing the answer, selected datasource, sources, and search request ID.

## Review Flow

Recommended reviewer path:

1. Read this README.
2. Open the Excalidraw files under `memos/diagrams/`.
3. Skim `memos/g-10-design-note.md` for architecture, tradeoffs, and limitations.
4. Run `npm run check` and `npm run build`.
5. Run `npm run demo`.
6. Optionally start `npm run mcp` and exercise `ask_company_docs`.
7. Review `memos/g-10-live-session-talking-points.md` for discussion topics.

## Onboarding

For a new engineer joining the project, start with:

- `memos/g-44-engineer-onboarding.md`

For the interview-prep materials created during Sprint 6, use:

- `memos/g-38-walkthrough-and-demo.md`
- `memos/g-39-collaborative-design-discussion.md`
- `memos/g-40-live-coding-prep.md`

## Validation And CI

Local validation:

- `npm run check`
- `npm run build`
- `npm run test:e2e`

GitHub Actions:

- `Branch CI`: lint, typecheck, unit tests, build, and secret scanning on non-`main` branches and pull requests
- `CodeQL`: static analysis for the TypeScript codebase
- `Main Integration`: sandbox smoke validation on `main` when the required secrets are configured

## Known Caveats

- The sandbox datasource is shared, so search results can include content beyond the fixture corpus.
- Repeated ingest runs can hit `processAll` rate limiting (`429`) without preventing already-uploaded documents from being searchable.
- The current implementation favors a small, reviewable prototype over production concerns such as multi-user isolation, robust filtering, or deployment packaging beyond local review.

## Related Notes

- `memos/g-6-sprint-1-plan.md`
- `memos/g-7-blocker-and-api-status.md`
- `memos/g-8-test-plan-and-outcomes.md`
- `memos/g-9-deploy-readiness.md`
- `memos/g-10-design-note.md`
- `memos/g-10-live-session-talking-points.md`
- `memos/g-38-walkthrough-and-demo.md`
- `memos/g-39-collaborative-design-discussion.md`
- `memos/g-40-live-coding-prep.md`
- `memos/g-44-engineer-onboarding.md`
- `memos/diagrams/solution-overview.excalidraw`
- `memos/diagrams/runtime-architecture.excalidraw`
- `memos/diagrams/request-data-flow.excalidraw`
- `memos/diagrams/runtime-flow-annotated.excalidraw`
