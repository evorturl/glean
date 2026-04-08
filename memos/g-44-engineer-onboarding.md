# G-44 Engineer Onboarding

## Purpose

This memo is the onboarding guide for a new engineer joining the project after the coding exercise.

Use it to understand:

- what the prototype does,
- where the key code lives,
- how the Glean sandbox details map to the implementation,
- how to run and validate the project,
- and how to connect local MCP-aware clients to the repo.

## What This Project Is

This repository contains a small employee-support chatbot prototype built on:

- the Glean Indexing API,
- the Glean Search API,
- the Glean Chat API,
- and a local MCP server exposing one tool, `ask_company_docs`.

The core runtime is intentionally small:

- `src/config.ts` loads and validates environment configuration
- `src/fixtures.ts` loads the constrained markdown corpus
- `src/workflow.ts` contains the shared ingest, retrieval, grounding, and answer formatting logic
- `src/cli.ts` exposes the local CLI commands
- `src/mcp.ts` exposes the same behavior through a local MCP server

## First-Day Read Order

1. `README.md`
2. `memos/g-10-design-note.md`
3. `memos/diagrams/request-data-flow.excalidraw`
4. `memos/diagrams/runtime-flow-annotated.excalidraw`
5. `src/workflow.ts`
6. `memos/g-7-blocker-and-api-status.md`

## How To Run The Project

From the repo root:

```bash
npm run setup
npm run check
npm run build
npm run demo
```

For the local MCP server:

```bash
npm run mcp
```

## Where The Important Runtime Decisions Live

### Config and environment

- `src/config.ts`
- `env/variables.env`
- `env/secrets.env.example`

What to notice:

- `GLEAN_INSTANCE`, `GLEAN_DEFAULT_DATASOURCE`, and `GLEAN_DEFAULT_TOP_K` now come from `env/variables.env`
- ingest requires an allowed user identity
- ask supports `GLEAN_CLIENT_ACT_AS` for the chat token mode used in the sandbox
- runtime config no longer applies defaults internally; missing required values fail fast

### Ingest path

- `src/fixtures.ts`
- `src/workflow.ts`

Key functions:

- `loadFixtureDocuments()`
- `toDocumentDefinition()`
- `ingestFixtureCorpus()`

### Ask path

- `src/workflow.ts`

Key functions:

- `retrieveSources()`
- `buildGroundedPrompt()`
- `askQuestion()`
- `buildCitationAppendix()`

### MCP surface

- `src/mcp.ts`

Key point:

- the MCP layer is intentionally thin and delegates straight into the shared workflow

## FAQ

### I see the following in the exercise description. How were they used in the implementation? How do I view them in the UI?

#### Instance name: `support-lab`

How it was used:

- the implementation uses `support-lab` as the default Glean instance in `src/config.ts`
- that value drives the backend API base URL derivation used by the SDK
- by default, the code talks to `https://support-lab-be.glean.com`

How to view it in the UI:

- the corresponding tenant UI is typically the standard instance URL, `https://support-lab.glean.com`, if your account has access
- the prototype itself does not automate browser login or admin navigation

#### Data sources: `interviewds`, `interviewds2`, `interviewds3`, `interviewds4`, `interviewds5`, `interviewds6`

How they were used:

- the exercise brief pointed to the `interviewds*` datasource family
- the repo carries `interviewds` in `env/variables.env` and `.github/workflows/main-integration.yml`
- during the exercise, the implementation was corrected from the wrong `interviews*` names to the correct `interviewds*` family
- the code is still parameterized, so you can override the datasource with CLI flags or env if you need a different member of that family

How to view them in the UI:

- in the Glean admin experience, look for the configured datasources for the sandbox tenant
- in the end-user search UI, search results can be filtered or inspected by datasource if your user has access
- note that the sandbox is shared, so the datasource may contain content that was not added by this repo

### Did we add documents to Glean during the exercise? If yes, how do I view them in the UI?

Yes.

What was added:

- the markdown fixtures under `fixtures/employee-support/`
- they are indexed through `npm run ingest` or `npm run demo`
- they use stable document IDs such as `remote-work-policy` and `travel-and-conference-policy`

How to view them:

- in Glean search, search by the fixture titles, such as `Remote Work Policy` or `Travel and Conference Policy`
- if the indexed document is visible to your user, you should also see it when searching the corresponding datasource
- the repo now indexes fixture docs with their real GitHub blob URLs under `fixtures/employee-support/`

Important caveat:

- the sandbox datasource is shared, so you may also see pre-existing documents that were not added by this project

### How do we configure clients like Cursor and Claude Code to use this MCP?

#### Cursor

For a project-local Cursor setup, use a `.cursor/mcp.json` configuration in the repo root.

Example:

```json
{
  "mcpServers": {
    "glean": {
      "command": "npm",
      "args": ["run", "mcp"]
    }
  }
}
```

Notes:

- this assumes Cursor launches the server from the project root
- after editing the MCP config, restart Cursor so it reloads the server definitions
- the server expects non-sensitive values in `env/variables.env` and secrets in `env/secrets.env`

#### Claude Code

For Claude Code, the easiest local setup is the CLI form:

```bash
claude mcp add --scope local glean -- npm run mcp
```

If you prefer manual configuration, use the Claude MCP config format with a local stdio server and point it at the same command:

```json
{
  "mcpServers": {
    "glean": {
      "type": "stdio",
      "command": "npm",
      "args": ["run", "mcp"],
      "env": {}
    }
  }
}
```

Notes:

- keep the config local to this repo unless you intentionally want it available globally
- after configuration, restart Claude Code and verify the server is registered with the MCP listing command for your local setup

### Which documents should I read if I need more context quickly?

Start with:

- `README.md`
- `memos/g-10-design-note.md`
- `memos/g-7-blocker-and-api-status.md`
- `memos/g-8-test-plan-and-outcomes.md`
- `memos/diagrams/runtime-flow-annotated.excalidraw`

### Which files are the best entry point for a code change?

Usually:

- `src/workflow.ts` for most meaningful behavior changes
- `src/mcp.ts` if the MCP schema must change
- `src/cli.ts` if a new CLI parameter is needed
- `test/workflow.test.ts` or `test/config.test.ts` for focused regression coverage

## Practical Tips

- Treat the repo as a prototype, not a production service.
- Keep changes narrow and coherent.
- Prefer extending the shared workflow instead of duplicating logic in the CLI or MCP layer.
- Expect some sandbox noise in retrieval results because the datasource is shared.
- If you are debugging ingest behavior, re-read `memos/g-7-blocker-and-api-status.md` before changing the datasource or URL assumptions.
