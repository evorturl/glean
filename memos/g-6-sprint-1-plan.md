# G-6 Sprint 1 Plan

## Purpose

This memo executes `G-6` by turning the coding exercise brief into a concrete sprint-1 planning artifact. It is intended to satisfy the planning scope represented by `G-11` through `G-15`:

- summarize the exercise requirements and constraints,
- capture assumptions, open questions, and non-goals,
- define the proposed solution shape and data flow,
- break follow-on work into later sprint slices, and
- identify external dependencies and setup risks.

## Source Material

- `G-5` Coding exercise issue
- `memos/task-description.png`
- `memos/g-5-sprint-plan.md`
- Glean public repos and developer docs referenced from `G-5`

## Problem Summary

The take-home exercise is to build a small enterprise chatbot for employees. The chatbot should answer questions against a constrained internal document set that is not yet available in Glean. The solution must:

1. ingest documents into a sandbox Glean datasource,
2. make those documents discoverable,
3. accept a natural-language question,
4. retrieve relevant content with the Glean Search API,
5. generate a grounded response with the Glean Chat API, and
6. expose the workflow as a single local MCP tool.

The output must include clear source references or citations back to the indexed content.

## Requirements And Constraints

### Functional requirements

- Build a prototype chatbot using Glean's Indexing, Search, and Chat APIs.
- Index a small document set into one sandbox datasource.
- Confirm the indexed content is searchable.
- Accept a natural-language user question.
- Retrieve relevant snippets or documents from Glean Search.
- Generate a grounded answer from Glean Chat.
- Return the final answer with sources.
- Expose the chatbot as a single MCP tool that can be invoked locally from an MCP-compatible client such as Cursor.

### MCP tool requirements

The tool should:

- accept a required natural-language question,
- optionally accept useful parameters such as `datasource`, `top_k`, or `include_citations`,
- internally run the same search and chat workflow as the underlying application, and
- return both the final grounded answer and the sources used to produce it.

### Delivery requirements

The submission must include:

- code for the implementation and MCP tool,
- a README with setup, usage, environment expectations, architecture, and assumptions,
- a short design note covering API usage, data flow, and tradeoffs,
- optionally, lightweight tests or validation scripts.

### Evaluation criteria

The reviewers want to see:

- correct use of Glean ingestion and retrieval,
- an end-to-end workflow across indexing, search, and chat,
- grounded answers with clear citations,
- clear articulation of assumptions, tradeoffs, and failure modes,
- a solution small enough to explain and modify live.

### Collaboration constraints

- Agentic coding tools must be used.
- The implementation still needs to be fully understood by the candidate.
- The live session will include a walkthrough, an architecture extension discussion, and a small live code change.
- The project does not need to be production-ready, but it should show sound reasoning and clear boundaries.

## Assumptions

- The repo is intentionally minimal, so all implementation structure can be introduced during `G-7`.
- The provided sandbox credentials and API keys are available locally and should not be duplicated into committed files.
- A self-authored document set is acceptable because the exercise allows a provided or self-chosen constrained corpus.
- The simplest successful prototype is better than a broad or highly abstract implementation.
- The MCP entrypoint can be local-only and does not need deployment beyond local review and demo.

## Open Questions

- Whether the preferred implementation language is completely unconstrained in practice, or whether TypeScript would be looked on more favorably because of the official client.
- Whether the evaluator expects the index step to happen automatically on startup or via a separate setup command.
- Whether citations should come directly from Search results, Chat grounding metadata, or both.
- Whether the live change is more likely to target filtering, citations, metadata, or support for an additional document shape.

## Non-Goals

- Building a production-grade multi-user application.
- Designing a complex UI beyond what is needed to exercise the MCP tool locally.
- Supporting many datasources or arbitrary ingestion pipelines.
- Solving permissions, rollout, or observability in implementation depth during the take-home.
- Optimizing for scale over clarity.

## Proposed Solution Shape

### Recommended language

Use TypeScript for the prototype.

Rationale:

- an official TypeScript client exists,
- TypeScript is a good fit for local MCP tooling,
- it keeps the MCP server and API integration in one language, and
- it should be straightforward to explain during the live session.

### High-level architecture

Use a small two-part structure:

1. an ingestion/setup path that indexes a constrained document set into a sandbox datasource,
2. a local MCP server that exposes one tool and orchestrates search plus grounded answer generation.

Suggested modules:

- `docs/` or `fixtures/`: the small internal corpus used for the demo
- `src/config/`: environment and runtime configuration loading
- `src/ingest/`: document normalization and indexing workflow
- `src/search/`: Search API wrapper and result shaping
- `src/chat/`: Chat API wrapper and grounded answer generation
- `src/mcp/`: MCP server and tool registration
- `src/types/`: request and response types

### Proposed MCP tool interface

Tool name:

- `ask_company_docs`

Input:

- `question` (required)
- `datasource` (optional)
- `topK` (optional, defaulted)
- `includeCitations` (optional, defaulted to true)

Output:

- `answer`: final grounded answer
- `sources`: source list with document IDs, titles, and URLs when available
- `retrievalSummary`: optional debug-friendly retrieval metadata for local validation

### Proposed data flow

1. Load environment variables and validate required tokens and instance configuration.
2. Run a setup command that indexes a small document corpus into the sandbox datasource.
3. Expose the local MCP tool through a simple MCP server.
4. When the tool is called, validate the input question and selected datasource parameters.
5. Use Glean Search to retrieve the most relevant indexed documents or snippets.
6. Use Glean Chat to generate a grounded answer using the retrieved content.
7. Return the answer with source references suitable for reviewer inspection.

## Document Set Proposal

Use a small, self-authored employee-support corpus to align with the prompt. Keep it to five to eight documents with realistic overlap so retrieval quality matters.

Suggested topics:

- remote work policy
- PTO and holidays
- IT support onboarding
- expense reimbursement
- security and password guidance
- travel policy

This set is small enough to ingest and inspect manually, but large enough to demonstrate search relevance, grounding, and citations.

## Dependencies And Environment

### Required external dependencies

- Glean sandbox instance
- Glean Indexing API token
- Glean Search API token
- Glean Chat-capable client token
- one sandbox datasource from the provided allowed set
- local runtime for the chosen language and package manager

### Local secret handling

- Keep tokens in `env/secrets.env`.
- Do not commit tokens, passwords, or copied credentials into repository files.
- Use committed examples only for variable names and setup instructions.

### Known setup facts from the brief

- The sandbox instance name is `support-lab`.
- The datasource must be chosen from the provided sandbox datasource options.
- The exercise explicitly expects local MCP invocation.

## Risks And Mitigations

### Risk: unclear API response shapes or auth wiring

Mitigation:

- use the official client when possible,
- keep API wrappers thin,
- validate config early with helpful errors.

### Risk: ingestion succeeds but retrieval quality is weak

Mitigation:

- use a tightly scoped and well-written document corpus,
- keep document titles and content distinctive,
- test with a few representative employee questions.

### Risk: citations are incomplete or awkward

Mitigation:

- preserve source metadata from retrieval,
- standardize the returned source shape,
- test citation formatting before final handoff.

### Risk: the live session asks for an extension not directly implemented

Mitigation:

- keep module boundaries clear,
- document tradeoffs and future changes in the design note,
- leave obvious seams for filters, metadata, and response formatting.

### Risk: take-home scope grows too large

Mitigation:

- prefer one clean workflow over multiple modes,
- keep the document set intentionally small,
- defer advanced observability and rollout mechanics to the live discussion.

## Mapping To Sprint 1 Sub-Issues

### `G-11` Summarize exercise requirements and constraints

Covered by:

- `Problem Summary`
- `Requirements And Constraints`

### `G-12` Capture assumptions, open questions, and non-goals

Covered by:

- `Assumptions`
- `Open Questions`
- `Non-Goals`

### `G-13` Define the proposed solution shape and data flow

Covered by:

- `Proposed Solution Shape`
- `Document Set Proposal`

### `G-14` Break work into implementation, test, deploy, and docs slices

Covered by:

- `Execution Breakdown`

### `G-15` Identify external dependencies, auth, and demo data needs

Covered by:

- `Dependencies And Environment`
- `Risks And Mitigations`

## Execution Breakdown

### `G-7` Build

- scaffold the TypeScript project and MCP server
- add config loading and secret validation
- create the small internal document corpus
- implement datasource ingestion/setup flow
- implement the end-to-end search plus chat orchestration
- return answer plus structured sources from a single MCP tool

### `G-8` Test

- add focused tests around config validation and result shaping
- manually validate ingestion and discovery in the sandbox
- run representative employee questions through the MCP tool
- verify citations are present and understandable
- exercise failure modes such as missing config or empty retrieval

### `G-9` Deploy

- document setup and run commands
- verify the project works from a clean checkout
- publish the feature branch and PR
- prepare a short demo flow for local MCP invocation

### `G-10` Document

- write the README
- add a short design note
- document assumptions, tradeoffs, and known limitations
- prepare live-session talking points around permissions, scaling, observability, and rollout

## Definition Of Done For `G-6`

`G-6` is complete when:

- the task brief has been translated into explicit requirements,
- assumptions and open questions are documented,
- the implementation direction and MCP tool shape are clear,
- external dependencies and setup risks are listed, and
- later sprint work can proceed without reopening planning.
