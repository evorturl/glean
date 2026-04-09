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
- `memos/diagrams/request-data-flow.excalidraw`
- `memos/diagrams/runtime-flow-annotated.excalidraw`
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

- Open `memos/diagrams/request-data-flow.excalidraw`.
- Explain that the prototype is intentionally narrow: one constrained corpus, one datasource family, one local MCP tool, and one clean review path.

Suggested script:

“I optimized this exercise for clarity and demonstrable end-to-end API usage rather than breadth. The solution indexes a small employee-support corpus into a Glean sandbox datasource, retrieves relevant content with Search, generates a grounded answer with Chat, and exposes the same workflow through a single local MCP tool.”

### 2. Explain the architecture

Speaker notes:

- Open `memos/diagrams/runtime-flow-annotated.excalidraw`.
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
- `ingestFixtureCorpus()` for indexing and the async-processing handoff
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
  - secrets come from local `env/secrets.env`, while non-secret runtime values live in local `env/variables.env` created from the tracked examples
  - Glean processes uploaded content asynchronously, so fresh docs can take a few minutes to appear
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
