# G-9 Deploy Readiness

## Purpose

This memo packages the coding exercise for asynchronous review. It defines the config shape, the minimal command surface, the demo path, and the clean-checkout verification target for `G-9`.

## Reviewer Setup

1. Run `npm run setup` to install dependencies and create local `env/variables.env` and `env/secrets.env` from the tracked examples when missing.
2. Fill in the required sandbox identity values in `env/variables.env`.
3. Fill in the required Glean tokens in `env/secrets.env`.

## Environment Variables

### Required in `env/secrets.env`

- `GLEAN_INDEXING_API_TOKEN`: token used by `npm run ingest`.
- `GLEAN_SEARCH_API_TOKEN`: token used to retrieve relevant sources before grounding.
- `GLEAN_CLIENT_API_TOKEN`: token used for the final chat answer generation.

### Required identity input

- `GLEAN_ALLOWED_USER_EMAIL`: sandbox user that should be able to see the indexed fixture docs.
- `GLEAN_CLIENT_ACT_AS`: can double as the ingest visibility identity when the same sandbox user should also be used for chat impersonation.

### Required in `env/variables.env`

- `GLEAN_INSTANCE`: set to `support-lab` in `env/variables.env.example`.
- `GLEAN_DEFAULT_DATASOURCE`: set to `interviewds` in `env/variables.env.example`.
- `GLEAN_DEFAULT_TOP_K`: set to `4` in `env/variables.env.example`.
- `GLEAN_ALLOWED_USER_EMAIL` or `GLEAN_CLIENT_ACT_AS`: set this sandbox identity locally in `env/variables.env`.

### Optional

- `GLEAN_SERVER_URL`: optional override in `env/variables.env` if the backend URL does not follow the instance-derived pattern.
- `GH_TOKEN`: only needed for GitHub automation from this repo.
- `LINEAR_API_KEY`: only needed for Linear automation from this repo.

## Command Surface

- `npm run setup`: installs dependencies and creates local `env/variables.env` and `env/secrets.env` from the tracked examples when missing.
- `npm run ingest`: uploads the fixture documents into the configured sandbox datasource and prints the immediate search/discoverability follow-up path.
- `npm run ask -- --question "..."`: asks a grounded question against the configured datasource.
- `npm run demo`: runs the default ingest plus a representative question end to end.
- `npm run mcp`: starts the local MCP server that exposes `ask_company_docs`.
- `npm run check`: runs lint, typecheck, and unit tests.
- `npm run build`: compiles the TypeScript project into `dist/`.
- `npm run clean`: removes local build output only.

## Demo Flow

Use this order during review:

1. `npm run setup`
2. Populate `env/variables.env`
3. Populate `env/secrets.env`
4. `npm run check`
5. `npm run build`
6. `npm run demo`
7. Optional: `npm run mcp`

The default demo question is:

`Can I work remotely while attending a conference abroad?`

This exercises the full intended path: ingest fixtures, search the sandbox datasource, generate a grounded answer, and return supporting sources.

If a reviewer runs `npm run ingest` separately, the CLI now also prints:

- the indexed titles,
- a reminder that Glean processes uploaded content asynchronously and fresh docs can take a few minutes to appear,
- and an explicit next step describing what to search for in Glean or which `npm run ask` command to run next.

## Clean-Checkout Verification Target

`G-9` is considered operationally ready when a fresh clone can:

- install with `npm run setup`,
- pass `npm run check`,
- build with `npm run build`,
- and run `npm run demo` after real `env/variables.env` and `env/secrets.env` files are provided.

## Known Caveats

- The live demo still depends on valid sandbox credentials; the example file only documents the shape.
- Freshly uploaded documents are processed asynchronously by Glean, so they can take a few minutes to appear in search.
- `npm run clean` is intentionally local-only because fixture ingestion uses stable document IDs and updates them in place.
- Final narrative documentation and broader architecture write-up remain part of `G-10`.
