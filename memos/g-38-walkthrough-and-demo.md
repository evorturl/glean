# G-38 Walkthrough And Demo Talk Track

## Audience And Goal

Assume the interviewer is the Director of Solutions Architecture for a Staff Solutions Architect role.

The goal of this section is not just to narrate the repo. It is to show:

- clear understanding of the Glean APIs used,
- a crisp end-to-end demo of the RAG flow,
- confidence explaining design choices and tradeoffs,
- and good executive communication while staying technically grounded.

## Recommended Flow

Use this sequence during the live session:

1. Start with the high-level overview diagram.
2. Anchor the repo entry points in `README.md`.
3. Walk through the shared workflow in `src/workflow.ts`.
4. Run the demo flow from the terminal.
5. Show the MCP tool definition in `src/mcp.ts`.
6. Close by calling out the main constraints and why they were acceptable for the exercise.

Target length: 12 to 15 minutes.

## Pre-Interview Setup

Have these tabs ready:

- `README.md`
- `memos/diagrams/solution-overview.excalidraw`
- `memos/diagrams/runtime-architecture.excalidraw`
- `memos/diagrams/request-data-flow.excalidraw`
- `src/workflow.ts`
- `src/mcp.ts`
- a terminal in the repo root

Have these commands ready to paste:

```bash
npm run check
npm run build
npm run demo
npm run mcp
```

Sample question to reuse consistently:

`Can I work remotely while attending a conference abroad?`

## Talk Track

### 1. Set context

Speaker notes:

- Open `memos/diagrams/solution-overview.excalidraw`.
- Explain that the prototype is intentionally narrow: one constrained corpus, one datasource family, one local MCP tool, and one clean review path.

Suggested script:

“I optimized this exercise for clarity and demonstrable end-to-end API usage rather than breadth. The solution indexes a small employee-support corpus into a Glean sandbox datasource, retrieves relevant content with Search, generates a grounded answer with Chat, and exposes the same workflow through a single local MCP tool.”

### 2. Explain the architecture

Speaker notes:

- Open `memos/diagrams/runtime-architecture.excalidraw`.
- Then show `README.md` and the repository map.
- Point out `src/config.ts`, `src/fixtures.ts`, `src/workflow.ts`, `src/cli.ts`, and `src/mcp.ts`.

Suggested script:

“Architecturally, I kept the repo split into a small set of responsibilities. Config loading validates the environment and auth assumptions. Fixture loading provides the constrained corpus. `src/workflow.ts` contains the reusable ingest, search, and answer-generation logic. Then the CLI and MCP server are intentionally thin entry points over that shared workflow.”

### 3. Present your understanding of the Glean APIs used

Speaker notes:

- Open `src/workflow.ts`.
- Use the ingest path first, then the ask path.

Suggested script:

“On the indexing side, I transform local fixture files into `DocumentDefinition` objects, set datasource-compatible URLs, and restrict visibility with `allowedUsers`. On the retrieval side, I call Glean Search with a datasource filter and bounded page size. Then I use the retrieved snippets to build an explicit grounded prompt before calling Glean Chat. Finally, I return the answer with a normalized source list and citation appendix.”

Specific code areas to point at:

- `toDocumentDefinition()` for ingest shaping and permissions
- `ingestFixtureCorpus()` for indexing plus `processAll`
- `retrieveSources()` for Search API usage
- `buildGroundedPrompt()` for explicit grounding
- `askQuestion()` for Chat API usage and final answer formatting

### 4. Demo the end-to-end flow

Speaker notes:

- Open `memos/diagrams/request-data-flow.excalidraw`.
- In terminal, run:

```bash
npm run demo
```

- If you want to show confidence in validation discipline first, briefly mention `npm run check` and `npm run build` before the demo.

Suggested script:

“Here I’m running the same reviewer path I documented in the repo. The demo first ingests the fixture corpus into the sandbox datasource, then asks a representative employee question. What I want you to notice is that the output is not just an answer. It also returns explicit supporting sources, which is important for trust and reviewability.”

What to call out as the command runs:

- ingest assumptions:
  - the flow targets the sandbox datasource family, defaulting to `interviewds`
  - secrets come from `env/secrets.env`, while non-sensitive runtime defaults live in tracked `env/variables.env`
  - the sandbox can rate-limit `processAll`, but previously uploaded documents can still remain searchable
- retrieval behavior:
  - search is scoped to the configured datasource
  - the workflow uses a bounded `topK`
  - snippets are normalized before being passed into Chat
- answer behavior:
  - the answer is grounded in retrieved context
  - the source list is appended for reviewer inspection
  - the prototype is honest about missing information rather than fabricating policy

### 5. Show the MCP tool invocation

Speaker notes:

- Open `src/mcp.ts`.
- Point to the `ask_company_docs` tool schema.
- In terminal, run:

```bash
npm run mcp
```

- Explain that a client such as Cursor can call the tool with `question`, optional `datasource`, optional `topK`, and optional `includeCitations`.

Suggested script:

“The exercise also asked for the same workflow to be exposed as a local MCP tool. I kept that surface deliberately small: one tool, one natural-language question, and just a few optional controls. That makes it easy to explain and easy to evolve live.”

What to call out in the file:

- tool name: `ask_company_docs`
- input schema is small and reviewable
- the handler delegates straight into the shared `askQuestion()` workflow
- the return includes both text content and structured content

### 6. Close with tradeoffs and architectural judgment

Speaker notes:

- Return briefly to `README.md` or `memos/g-10-design-note.md`.
- Close with two or three crisp tradeoffs, not a long list.

Suggested script:

“The biggest tradeoff here is that I kept the solution intentionally narrow. It is not a production app. It is a clean prototype that demonstrates correct API usage, a grounded retrieval-plus-chat path, and a local MCP tool with a small review surface. The shared sandbox can add some noise to retrieval, and a production version would need stronger filtering, observability, and operational controls, but for this exercise I prioritized a small, explainable system.”

## Strong Answers To Likely Follow-Ups

### Why did you use both Search and Chat instead of only Chat?

“Because the exercise explicitly asked for the APIs to be used together, and I wanted the answer path to remain inspectable. Search gives me a concrete retrieval set. Chat then turns that into a grounded response. That split makes the reasoning path easier to explain and debug.”

### Why did you expose only one MCP tool?

“Because one tool matched the exercise scope and kept the interface easy to understand in a live session. I would rather have one coherent tool with clear inputs and outputs than over-model the interface for a prototype.”

### Why did you choose a constrained fixture corpus?

“It keeps the ingest path easy to reason about, makes the demo reproducible, and still gives retrieval enough ambiguity to be meaningful.”

## Things To Avoid Saying

- Don’t describe the prototype as production-ready.
- Don’t over-index on framework choices or tooling trivia.
- Don’t apologize for tradeoffs that were clearly deliberate.
- Don’t hide the shared-sandbox limitations; explain why they were acceptable.

## Ideal Finish

End this section with:

“That gives you the implemented prototype, the end-to-end Glean flow, and the MCP interface. If useful, I can next walk through how I would evolve this into a production-ready multi-team customer solution.”
# G-38 Walkthrough And Demo

## Goal

Use this talk track to walk a Director of Solutions Architecture through the current prototype clearly, confidently, and with visible command of the tradeoffs.

## Audience Framing

Assume the interviewer cares about:

- whether you understand the Glean APIs you chose
- whether the implementation is coherent end to end
- whether you can explain decisions at the right altitude
- whether you can demo the MCP tool and the grounded answer flow without getting lost in details

## Recommended Demo Sequence

1. Start with `README.md`.
2. Open `memos/diagrams/solution-overview.excalidraw`.
3. Open `memos/diagrams/runtime-architecture.excalidraw`.
4. Show `src/config.ts`.
5. Show `src/workflow.ts`.
6. Show `src/mcp.ts`.
7. Run `npm run demo`.
8. Optionally run `npm run mcp` and describe the tool input and output shape.

## Talk Track

### 1. Open with the problem statement

Suggested script:

> I approached this as a small, reviewable RAG prototype for an employee-support use case. The requirements I optimized for were: ingest a constrained corpus into Glean, retrieve relevant content with Search, generate a grounded answer with Chat, return sources, and expose the same workflow as a single local MCP tool.

Show:

- `README.md`
- `memos/g-10-design-note.md`

Speaker note:

- Keep this to under one minute. The goal is to frame the exercise, not narrate every sprint.

### 2. Explain the API choices

Suggested script:

> I used all three required Glean surfaces in a thin orchestration layer. The Indexing API uploads the constrained fixture corpus. The Search API retrieves the top matches for the current question. The Chat API then turns those retrieved snippets into a grounded answer. I kept the wrappers thin so the review surface stays close to the actual Glean calls.

Show:

- `src/workflow.ts`
- `memos/g-7-blocker-and-api-status.md`

Speaker note:

- Call out that the chat token required `X-Glean-ActAs`, because that shows practical API troubleshooting rather than toy usage.

### 3. Walk through configuration and setup assumptions

Suggested script:

> I wanted setup to be explicit and reproducible, so runtime config is validated up front. The repo ships with a tracked sample env file, but the real tokens stay local. I also made the allowed-user identity explicit because the ingest permissions and chat impersonation mode matter in this sandbox.

Show:

- `env/variables.env`
- `env/secrets.env.example`
- `src/config.ts`
- `memos/g-9-deploy-readiness.md`

Speaker note:

- If asked why both `GLEAN_ALLOWED_USER_EMAIL` and `GLEAN_CLIENT_ACT_AS` exist, explain that they reflect two different needs: document visibility and chat auth mode, even though they can reuse the same sandbox identity.

### 4. Explain the ingest side

Suggested script:

> The ingest path reads a small policy-oriented corpus from `fixtures/employee-support`, maps it into Glean document definitions, applies datasource-compatible URLs, and restricts visibility to the configured sandbox user. I kept the corpus intentionally small so the review can focus on workflow behavior instead of dataset complexity.

Show:

- `src/fixtures.ts`
- `fixtures/employee-support/`
- `src/workflow.ts`
- `memos/diagrams/request-data-flow.excalidraw`

Speaker note:

- Mention the datasource URL regex issue only if useful; it is a strong example of realistic integration debugging, but do not let it derail the walkthrough.

### 5. Explain retrieval and grounded answer generation

Suggested script:

> On the ask path, the system queries Glean Search with a datasource filter, shapes the returned snippets into a compact source list, and builds an explicit grounded prompt. Chat then answers only from that retrieved context, and the final response appends a source list for inspection.

Show:

- `src/workflow.ts`
- `memos/diagrams/request-data-flow.excalidraw`

Speaker note:

- This is where you should emphasize that you chose an explainable prompt-assembly step instead of hiding the grounding logic in a larger abstraction.

### 6. Explain the MCP interface

Suggested script:

> The MCP layer is intentionally thin. The local server registers one tool, `ask_company_docs`, and delegates directly to the same shared workflow. That keeps the implementation small and makes it easy to extend during a live coding discussion without duplicating logic.

Show:

- `src/mcp.ts`

Speaker note:

- Mention that the tool returns both text content and structured content so a client has both a human-readable answer and machine-usable fields.

### 7. Run the end-to-end demo

Command:

```bash
npm run demo
```

Suggested script while running:

> This demo executes the reviewer path: ingest the fixture corpus, ask a representative question, and return a grounded answer with sources. I chose a remote-work-plus-travel question because it crosses multiple policy areas and exercises the retrieval path more realistically than a single-document lookup.

Speaker note:

- If `processAll` reports `429`, explain that repeated sandbox processing is rate-limited and that this was already observed and documented during validation.

### 8. Optional MCP demo

Command:

```bash
npm run mcp
```

Suggested script:

> From an MCP client, the same workflow is exposed as `ask_company_docs`. The interesting point is not the transport itself, but that the same retrieval and grounding path is reusable from both CLI and MCP without code drift.

Show:

- `README.md`
- `src/mcp.ts`

## Likely Questions And Strong Short Answers

### Why did you keep the corpus so small?

Answer:

> Because the exercise was about proving the API workflow and architectural reasoning, not building a large ingestion system. A small corpus makes retrieval behavior inspectable and keeps the demo reliable.

### Why not call Chat directly without Search?

Answer:

> The brief explicitly called for Search plus Chat, and using Search first gave me a much more reviewable grounding path and clearer source attribution.

### Why a CLI and an MCP server?

Answer:

> The CLI is the fastest validation surface for the underlying workflow. The MCP server is the required integration surface. Keeping both thin avoids duplicating core logic.

### What would you highlight as the most realistic integration issue you hit?

Answer:

> The datasource naming, URL regex expectations, and `X-Glean-ActAs` requirement. Those are the kinds of practical details that matter when moving from docs to a working customer environment.

## Things To Avoid During The Demo

- Do not start with a code dump.
- Do not spend too long on sprint history.
- Do not over-explain sandbox quirks before showing the happy path.
- Do not present the prototype as production-ready; present it as intentionally scoped and extensible.
