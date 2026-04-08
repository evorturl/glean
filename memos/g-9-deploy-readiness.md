# G-9 Deploy Readiness

## Purpose

This memo packages the coding exercise for asynchronous review. It defines the config shape, the minimal command surface, the demo path, and the clean-checkout verification target for `G-9`.

## Reviewer Setup

1. Run `npm run setup` to install dependencies and create `env/secrets.env` from the tracked example when missing.
2. Fill in the required Glean tokens and sandbox identity values in `env/secrets.env`.
3. Review `env/variables.env` if you need to change the tracked non-sensitive runtime values.

## Environment Variables

### Required in `env/secrets.env`

- `GLEAN_INDEXING_API_TOKEN`: token used by `npm run ingest`.
- `GLEAN_SEARCH_API_TOKEN`: token used to retrieve relevant sources before grounding.
- `GLEAN_CLIENT_API_TOKEN`: token used for the final chat answer generation.

### Required identity input

- `GLEAN_ALLOWED_USER_EMAIL`: sandbox user that should be able to see the indexed fixture docs.
- `GLEAN_CLIENT_ACT_AS`: can double as the ingest visibility identity when the same sandbox user should also be used for chat impersonation.

### Required in `env/variables.env`

- `GLEAN_INSTANCE`: set to `support-lab` in the tracked file.
- `GLEAN_DEFAULT_DATASOURCE`: set to `interviewds` in the tracked file.
- `GLEAN_DEFAULT_TOP_K`: set to `4` in the tracked file.

### Optional

- `GLEAN_SERVER_URL`: optional override in `env/variables.env` if the backend URL does not follow the instance-derived pattern.
- `GLEAN_CLIENT_ACT_AS`: needed when the chat token is a global token that requires `X-Glean-ActAs`.
- `GH_TOKEN`: only needed for GitHub automation from this repo.
- `LINEAR_API_KEY`: only needed for Linear automation from this repo.

## Command Surface

- `npm run setup`: installs dependencies and creates `env/secrets.env` from the tracked example when missing.
- `npm run ingest`: uploads the fixture documents into the configured sandbox datasource.
- `npm run ask -- --question "..."`: asks a grounded question against the configured datasource.
- `npm run demo`: runs the default ingest plus a representative question end to end.
- `npm run mcp`: starts the local MCP server that exposes `ask_company_docs`.
- `npm run check`: runs lint, typecheck, and unit tests.
- `npm run build`: compiles the TypeScript project into `dist/`.
- `npm run clean`: removes local build output only.

## Demo Flow

Use this order during review:

1. `npm run setup`
2. Populate `env/secrets.env`
3. `npm run check`
4. `npm run build`
5. `npm run demo`
6. Optional: `npm run mcp`

The default demo question is:

`Can I work remotely while attending a conference abroad?`

This exercises the full intended path: ingest fixtures, search the sandbox datasource, generate a grounded answer, and return supporting sources.

## Clean-Checkout Verification Target

`G-9` is considered operationally ready when a fresh clone can:

- install with `npm run setup`,
- pass `npm run check`,
- build with `npm run build`,
- and run `npm run demo` after a real `env/secrets.env` is provided.

## Known Caveats

- The live demo still depends on valid sandbox credentials; the example file only documents the shape.
- Re-running ingest too quickly can return `429` from `processAll`; this is expected sandbox rate limiting and does not invalidate already-uploaded fixture documents.
- `npm run clean` is intentionally local-only because fixture ingestion uses stable document IDs and updates them in place.
- Final narrative documentation and broader architecture write-up remain part of `G-10`.
