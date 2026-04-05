# G-10 Design Note

## Purpose

This note packages the final reviewer-facing documentation for the coding exercise. It explains how the prototype works, why it is shaped this way, what tradeoffs were made, and how a reviewer can evaluate it quickly.

## Problem Framing

The exercise asked for a small enterprise chatbot that:

1. indexes a constrained document set into a Glean sandbox datasource,
2. retrieves relevant content with the Search API,
3. generates a grounded answer with the Chat API,
4. returns citations,
5. and exposes the workflow as a single local MCP tool.

The implementation deliberately optimizes for clarity and reviewability over breadth.

## Architecture Overview

The shipped prototype has four main layers:

1. Config loading in `src/config.ts`
2. Fixture loading in `src/fixtures.ts`
3. Glean workflow orchestration in `src/workflow.ts`
4. Local interfaces in `src/cli.ts` and `src/mcp.ts`

Related diagrams:

- `memos/diagrams/solution-overview.excalidraw`
- `memos/diagrams/runtime-architecture.excalidraw`
- `memos/diagrams/request-data-flow.excalidraw`
- `memos/diagrams/runtime-flow-annotated.excalidraw`

### Runtime flow

1. Load environment variables from `env/local.env`.
2. Validate tokens, datasource, and identity settings.
3. Convert the local fixture corpus into Glean document definitions.
4. Ingest those documents into the selected sandbox datasource.
5. Search the datasource for the user's question.
6. Build a grounded prompt from the retrieved snippets.
7. Call Glean Chat to produce the final answer.
8. Append a source list for reviewer inspection.

## API Usage

### Indexing API

Used to upload the fixture corpus and trigger datasource processing.

Implementation detail:

- each fixture document is mapped to a datasource-compatible `viewURL` of the form `https://internal.company.com/<datasource>/<document-id>`
- permissions are restricted to the configured sandbox user via `allowedUsers`

### Search API

Used to retrieve the top matching documents before answer generation.

Implementation detail:

- the current flow retrieves a bounded set of results with a datasource filter
- snippets are compacted and clipped before being passed into the final prompt

### Chat API

Used to turn the retrieved context into a grounded answer.

Implementation detail:

- the prompt explicitly instructs the model to answer only from retrieved context and to admit missing information
- `GLEAN_CLIENT_ACT_AS` is supported because the provided chat auth mode required `X-Glean-ActAs`

### MCP

The local MCP server exposes one tool, `ask_company_docs`, over stdio.

Why one tool:

- it keeps the review surface small
- it maps directly to the exercise brief
- it leaves room for live-session extension work without over-abstracting the take-home

## Main Design Decisions

### TypeScript end to end

Chosen because:

- the official client is available
- the MCP server and workflow code can live in one language
- it is straightforward to explain during a live pairing session

### Small fixture corpus

Chosen because:

- it makes ingest behavior easy to inspect
- it keeps the demo reproducible
- it is large enough to require real retrieval instead of a single hardcoded answer path

### Search plus chat rather than chat-only

Chosen because:

- the exercise explicitly called for Search and Chat API usage
- grounding through retrieved snippets makes the reasoning path easier to review
- returning citations is simpler when source shaping is handled explicitly

### CLI plus MCP entrypoints

Chosen because:

- the CLI is the fastest way to validate ingest and ask flows directly
- the MCP server is the deliverable that matches the local tool requirement
- separating the interfaces from `src/workflow.ts` keeps the core logic reusable

## Reviewer Walkthrough

Use this path for a fast evaluation:

1. Read `README.md`.
2. Run `npm run setup`.
3. Populate `env/local.env`.
4. Run `npm run check`.
5. Run `npm run build`.
6. Run `npm run demo`.
7. Optionally run `npm run mcp` and call `ask_company_docs`.

Representative question:

`Can I work remotely while attending a conference abroad?`

Why this question:

- it touches more than one policy area
- it exercises the search step meaningfully
- it shows both grounded answering and source attribution

## Tradeoffs

### Shared sandbox datasource

Tradeoff:

- using the provided sandbox keeps the exercise realistic, but it means search results can include pre-existing content not authored in this repo

Why accepted:

- it preserves real API behavior
- it is sufficient for a prototype
- the limitation is easy to explain during review

### Minimal filtering and ranking control

Tradeoff:

- the current implementation uses datasource-level filtering but does not add more aggressive metadata or document-level constraints

Why accepted:

- it keeps the solution small
- it demonstrates the required APIs without introducing a large retrieval subsystem
- stronger filtering is a good follow-up topic for the live session

### Local-only packaging

Tradeoff:

- there is no deployed service or web UI

Why accepted:

- the brief required local MCP invocation, not hosted delivery
- a local review flow is enough to validate the concept
- the repo stays small enough to understand quickly

## Current Limitations

- The fixture corpus is intentionally small and hand-authored.
- Search results can include shared sandbox content outside the fixture set.
- Repeated ingest runs can hit `processAll` rate limiting.
- There is no persistent app layer, auth broker, or multi-user runtime beyond the local tooling.
- The answer quality depends heavily on sandbox retrieval quality and the current prompt shape.

## If I Had More Time

- add stronger filtering or metadata constraints so citations come back more cleanly from the fixture corpus
- capture structured chat grounding metadata if the sandbox shape supports it cleanly
- add a higher-confidence integration check around expected source titles
- support richer document types or multiple datasources
- package the MCP server with a lightweight launcher config for easier tool registration

## Mapping To G-10 Child Issues

### `G-31` README setup and usage instructions

Covered by:

- `README.md`

### `G-32` Document architecture, tradeoffs, and limitations

Covered by:

- `Architecture Overview`
- `Main Design Decisions`
- `Tradeoffs`
- `Current Limitations`

### `G-33` Add examples or a reviewer-oriented walkthrough

Covered by:

- `Reviewer Walkthrough`
- the runnable examples in `README.md`

### `G-34` Prepare talking points for the live collaborative session

Covered in more concise form by:

- `memos/g-10-live-session-talking-points.md`

### `G-35` Final reviewer handoff summary to Linear

Will be satisfied by:

- the final Linear summary comment posted when the documentation PR is ready for review or merged
