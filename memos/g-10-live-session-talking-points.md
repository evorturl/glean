# G-10 Live Session Talking Points

## Goal

Use these notes to move the follow-up session past basic orientation and into design reasoning, tradeoffs, and extension ideas.

## Suggested Walkthrough Order

1. Start with `README.md` and the end-to-end review path.
2. Show `src/workflow.ts` as the core orchestration layer.
3. Show `src/mcp.ts` to explain how the same workflow is exposed as a single tool.
4. Discuss the main caveats from the shared sandbox and auth model.

## Design Choices Worth Explaining

- Why the prototype uses TypeScript end to end instead of mixing languages.
- Why the implementation keeps the core logic in `src/workflow.ts` and leaves the CLI and MCP layers thin.
- Why search results are turned into an explicit grounded prompt before calling Chat.
- Why the fixture corpus is intentionally small and policy-oriented.

## Tradeoffs To Surface

- The sandbox datasource is shared, so source quality is not perfectly controlled.
- `GLEAN_CLIENT_ACT_AS` support is necessary because the provided chat auth mode required impersonation headers.
- The solution optimizes for reviewer clarity rather than production packaging or UI polish.
- The current retrieval path uses simple datasource filtering instead of heavier metadata constraints.

## Good Extension Topics

- Restricting answers to only documents indexed by this repo.
- Supporting multiple datasources or document types.
- Improving citation quality and source ranking.
- Adding a richer MCP tool surface without breaking the simple review flow.
- Discussing what would need to change for a hosted or multi-user version.

## Likely Live Change Candidates

- Add a new optional filter parameter to the MCP tool.
- Change answer formatting or citation behavior.
- Tighten the retrieval logic for cleaner sources.
- Extend the fixture corpus and validate the impact on search results.

## Risks To Call Out Honestly

- Shared sandbox state can make retrieval outputs noisier than a fully isolated environment.
- Repeated ingest validation can hit `processAll` rate limits.
- The current prompt-based grounding is readable and easy to review, but it is not the same as a production retrieval pipeline with stricter controls.
