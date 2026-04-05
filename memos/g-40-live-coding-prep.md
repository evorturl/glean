# G-40 Live Coding Prep

## Goal

Prepare for the interview section where the interviewer asks for a small but meaningful code change to the prototype.

Assume the interviewer is the Director of Solutions Architecture for a Staff Solutions Architect role.

The goal here is not to guess the exact prompt. The goal is to show:

- calm requirement clarification,
- good scoping judgment,
- confidence modifying an existing codebase,
- and clear explanation of impact and tradeoffs while coding.

## Default Approach

Use this structure every time:

1. Restate the requirement in your own words.
2. Narrow the scope before writing code.
3. Identify the smallest coherent implementation slice.
4. Call out the files you expect to touch.
5. Make the change.
6. Run focused validation.
7. Summarize the behavior change and tradeoffs.

Use this line early:

“I’m going to keep the change narrow and coherent, so I’ll first identify the smallest place in the current workflow where this belongs, make that change, and then validate the affected path.”

## Best Candidate Changes In This Repo

These are the most likely changes to go smoothly in the existing codebase.

### 1. Tighten or change retrieved-content filtering

Why this is a strong live change:

- it is meaningful
- it touches the core RAG behavior
- it stays scoped to a few files

Likely files:

- `src/workflow.ts`
- `src/mcp.ts`
- `src/cli.ts` if you expose a new parameter there
- `test/workflow.test.ts`

How to narrate it:

“Right now the prototype uses datasource-level filtering only. I’m going to add one more retrieval constraint so the search set is more intentional without changing the overall architecture.”

Good examples:

- filter by tag or document type
- restrict to a smaller subset of sources
- add an option to exclude low-signal results

### 2. Improve citation formatting

Why this is a strong live change:

- it is visible immediately in output
- it is low risk
- it demonstrates product judgment

Likely files:

- `src/workflow.ts`
- `test/workflow.test.ts`

How to narrate it:

“I’m keeping the retrieval behavior unchanged and improving the answer presentation layer so the source references are clearer and easier to inspect.”

Good examples:

- include datasource labels
- include snippet previews in the citation appendix
- improve handling of missing IDs or URLs

### 3. Handle no-results or weak-results more gracefully

Why this is a strong live change:

- it improves a real edge case
- it demonstrates defensive design
- it keeps the change local

Likely files:

- `src/workflow.ts`
- `test/workflow.test.ts`

How to narrate it:

“The current behavior is already safe, but I can make the edge case more user-friendly by handling weak or empty retrieval results more explicitly.”

### 4. Add support for a new metadata field

Why this is a medium-difficulty option:

- it is still small, but it touches more layers
- it shows schema reasoning clearly

Likely files:

- `src/types.ts`
- `src/fixtures.ts`
- `src/workflow.ts`
- tests if the new field affects output

How to narrate it:

“I’m going to add the field in the local data model first, propagate it through indexing, and then decide whether it should also affect retrieval or presentation.”

## Recommended First Choice In A Live Session

If you have latitude, choose:

`retrieval filtering` or `citation formatting`

Why:

- both are easy to explain
- both touch meaningful product behavior
- both avoid sprawling changes across too many files
- both can be validated quickly

## File-Level Mental Model

Keep this map in your head:

- `src/types.ts`: local TypeScript data model
- `src/fixtures.ts`: fixture metadata and loading
- `src/workflow.ts`: where most meaningful behavior changes belong
- `src/cli.ts`: CLI parameter surface
- `src/mcp.ts`: MCP tool schema and handoff into the workflow
- `test/workflow.test.ts`: focused helper-level regression checks
- `test/config.test.ts`: config-related regressions only

## Talk Track While Coding

### When clarifying the prompt

Use:

“Let me restate the change to make sure I’m solving the right problem. It sounds like you want me to keep the current end-to-end flow but adjust the behavior in this one area.”

### When identifying files

Use:

“The cleanest place for this change is the shared workflow layer, because both the CLI and MCP entry points depend on it. If the new behavior needs to be user-configurable, I’ll also update the CLI or MCP schema.”

### When choosing scope

Use:

“I’m going to avoid a broad refactor here and make the smallest change that keeps the implementation coherent.”

### When validating

Use:

“I want to validate the narrowest affected path first, then I’ll rerun the standard repo checks if the change touches shared behavior.”

### When summarizing

Use:

“The behavior change is now isolated to this part of the workflow. I kept the architecture intact, updated the relevant surface area, and validated the affected path.”

## Example Implementation Notes For The Most Likely Prompt Types

### If they ask for a new metadata field

Implementation sequence:

1. Add the field to `FixtureDocument` in `src/types.ts`.
2. Populate it in `src/fixtures.ts`.
3. Propagate it through `toDocumentDefinition()` in `src/workflow.ts`.
4. Decide whether it affects output, retrieval, or only indexing metadata.
5. Add or update focused tests if formatting or helpers changed.

### If they ask for stronger filtering

Implementation sequence:

1. Decide whether the filter is static or user-configurable.
2. Update the workflow retrieval function first.
3. If needed, thread the parameter through `src/cli.ts` and `src/mcp.ts`.
4. Add a focused test for the shaping logic or prompt behavior.
5. Validate with `npm run check`.

### If they ask for better citations

Implementation sequence:

1. Update `buildCitationAppendix()` in `src/workflow.ts`.
2. Adjust any related source shaping if necessary.
3. Update the citation formatting test in `test/workflow.test.ts`.
4. Validate output shape quickly.

### If they ask for better no-result handling

Implementation sequence:

1. Update the relevant error or fallback branch in `askQuestion()`.
2. Keep the failure mode honest and actionable.
3. Add or update a focused test if a helper or return shape changes.
4. Validate the affected behavior.

## Ten Other Questions They Might Ask

### 1. Add an optional MCP parameter to narrow results by category or tag.

Likely touchpoints:

- `src/mcp.ts`
- `src/workflow.ts`

### 2. Return a shorter answer when `includeCitations` is false.

Likely touchpoints:

- `src/workflow.ts`
- `test/workflow.test.ts`

### 3. Surface the datasource more clearly in the final answer or citations.

Likely touchpoints:

- `src/workflow.ts`
- `test/workflow.test.ts`

### 4. Add support for a new fixture metadata field such as `documentType`.

Likely touchpoints:

- `src/types.ts`
- `src/fixtures.ts`
- `src/workflow.ts`

### 5. Reject or normalize an invalid `topK` value more clearly.

Likely touchpoints:

- `src/cli.ts`
- `src/config.ts`
- `test/config.test.ts`

### 6. Change the prompt so the assistant is more explicit about uncertainty.

Likely touchpoints:

- `src/workflow.ts`
- `test/workflow.test.ts`

### 7. Return citations inline in a slightly different format.

Likely touchpoints:

- `src/workflow.ts`
- `test/workflow.test.ts`

### 8. Add a small retrieval-summary field to the MCP output.

Likely touchpoints:

- `src/workflow.ts`
- `src/types.ts`
- `src/mcp.ts`

### 9. Skip obviously empty snippets or prefer stronger ones.

Likely touchpoints:

- `src/workflow.ts`
- `test/workflow.test.ts`

### 10. Make the no-results behavior more guided for the end user.

Likely touchpoints:

- `src/workflow.ts`
- possibly `src/mcp.ts` if the structured response should change

## What To Avoid In The Live Change

- Don’t refactor unrelated code just because you notice a cleanup opportunity.
- Don’t introduce a big abstraction layer to solve a small prompt.
- Don’t skip validation.
- Don’t over-promise production correctness from a live-coding patch.

## Strong Closing Line

End the live change with:

“I kept the change intentionally narrow, put it in the shared workflow where it belongs, updated the relevant interface surface only where needed, and validated the behavior that changed.”
