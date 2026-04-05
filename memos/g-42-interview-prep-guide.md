# G-42 Interview Prep Guide

## Purpose

This note makes the Sprint 6 interview-prep materials easy to discover and use in sequence.

Use it as the starting point for the live session preparation instead of opening the individual memos ad hoc.

## Recommended Order

### 1. Re-orient on the implementation

Open:

- `README.md`
- `memos/g-10-design-note.md`
- `memos/diagrams/solution-overview.excalidraw`
- `memos/diagrams/runtime-architecture.excalidraw`
- `memos/diagrams/request-data-flow.excalidraw`

Goal:

- refresh the repo layout
- refresh the end-to-end flow
- get back to the exact terminology used in the implementation

### 2. Rehearse the walkthrough and demo

Open:

- `memos/g-38-walkthrough-and-demo.md`

Goal:

- practice the live demo arc
- rehearse the explanation of Indexing, Search, Chat, and MCP usage
- keep the talk track crisp for a Director of Solutions Architecture audience

### 3. Rehearse the productionization discussion

Open:

- `memos/g-39-collaborative-design-discussion.md`

Goal:

- practice the architecture-evolution answer
- rehearse permissions, observability, scaling, and rollout discussions
- prepare for deeper staff-level follow-up questions

### 4. Rehearse the live-coding segment

Open:

- `memos/g-40-live-coding-prep.md`

Goal:

- practice narrowing ambiguous requests
- identify the smallest coherent implementation slice
- rehearse how to narrate code changes and validation steps in real time

## Suggested Working Session

If you have 45 to 60 minutes to prepare:

1. Spend 10 minutes re-reading the README, design note, and diagrams.
2. Spend 15 minutes rehearsing the `G-38` walkthrough out loud.
3. Spend 15 minutes answering the `G-39` productionization prompt out loud.
4. Spend 10 to 15 minutes stepping through two or three likely `G-40` live-change prompts.

## Terminal Commands To Keep Ready

```bash
npm run check
npm run build
npm run demo
npm run mcp
```

## Best Short Version Of The Story

If you need a one-minute recap before the interview:

“I built a small employee-support chatbot prototype using Glean’s Indexing, Search, and Chat APIs plus a local MCP tool. I intentionally kept the implementation narrow and reviewable: a constrained document corpus, a shared workflow layer, a CLI and MCP surface, focused tests, CI, and clear reviewer documentation. For the interview, I’m prepared to walk through the current design, demo the full flow, explain how I would productionize it for a multi-team customer scenario, and make a small coherent code change live.”
