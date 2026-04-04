# G-7 Blocker And API Status

## Summary

`G-7` is partially complete: the local TypeScript prototype, fixture corpus, CLI commands, and MCP server are implemented, but the sprint is blocked from full end-to-end validation because the provided Indexing API token does not have permission to write to any of the allowed sandbox datasources.

This memo documents:

- the blocker,
- how to fix it,
- the current status of the other required APIs,
- and what remains to validate once the blocker is removed.

## Blocking Issue

### What is blocked

The exercise requires indexing a small document set into one of the provided sandbox datasources before search and grounded chat can be demonstrated against that data.

The current `GLEAN_INDEXING_API_TOKEN` fails when used with the provided datasource options such as `interviews`, `interviews2`, `interviews3`, `interviews4`, `interviews5`, and `interviews6`.

### Reproduction

Observed failures:

- `npm run ingest -- --datasource interviews --allowed-user-email alex@glean-sandbox.com`
- direct request to `/api/index/v1/getdatasourceconfig` for each provided datasource

Representative response:

```text
Indexing API error: code: 401, msg: Token does not have necessary scopes.
Requires either global scope, or the following scopes: [INTERVIEWS]
```

### Impact

- fixture documents cannot be indexed into the required sandbox datasource
- the MCP tool cannot be validated against exercise-specific content
- the Search and Chat workflow cannot yet be demonstrated on the indexed corpus required by the prompt

## How To Fix The Blocker

Provide an Indexing API token that has one of the following:

- global indexing scope, or
- datasource scope for at least one allowed sandbox datasource such as `INTERVIEWS`, `INTERVIEWS2`, `INTERVIEWS3`, `INTERVIEWS4`, `INTERVIEWS5`, or `INTERVIEWS6`

Then update `env/local.env` with the replacement token and rerun:

```bash
npm run ingest -- --datasource interviews --allowed-user-email alex@glean-sandbox.com
```

After indexing succeeds, validate the exercise flow by running:

```bash
npm run ask -- --datasource interviews --question "Can I work remotely while attending a conference abroad?"
```

## Required API Status

### 1. Indexing API

Status: blocked by permissions

Tested:

- yes

What was tested:

- datasource config lookup for the provided sandbox datasources
- document ingest through the prototype CLI

Current permission status:

- insufficient

What is missing:

- datasource-specific indexing scope or global indexing scope

Conclusion:

- the Indexing API is the active blocker for end-to-end completion of `G-7`

### 2. Search API

Status: working

Tested:

- yes

What was tested:

- direct request to `POST /rest/api/v1/search` against the sandbox instance
- successful 200 response for a general query

Observed result:

- the search token returned results successfully, which indicates the token is valid and has the needed search permission

Limitations of current validation:

- search has not yet been validated against the exercise datasource because the indexing blocker prevents the fixture corpus from being uploaded

Conclusion:

- the Search API appears usable for the exercise once documents can be indexed

### 3. Client / Chat API

Status: working with additional auth header

Tested:

- yes

What was tested:

- direct request to `POST /rest/api/v1/chat` without `X-Glean-ActAs`
- direct request to the same endpoint with `X-Glean-ActAs: alex@glean-sandbox.com`

Observed result:

- without `X-Glean-ActAs`, the request failed with:

```text
Required header missing: X-Glean-ActAs
Not allowed
```

- with `X-Glean-ActAs`, the request succeeded and returned a valid chat response

Current permission status:

- sufficient when used as a global token with `X-Glean-ActAs`

Implementation note:

- the prototype has been updated to support an optional `GLEAN_CLIENT_ACT_AS` setting so the chat flow can use this token correctly

Conclusion:

- the Chat API is not blocked, but it requires the correct auth mode

## Current Build Status

Implemented:

- TypeScript project scaffolding
- fixture employee-support corpus
- config loading for Glean tokens and runtime settings
- indexing, search, and chat workflow modules
- CLI commands for `ingest` and `ask`
- local MCP server exposing a single `ask_company_docs` tool
- improved error handling around indexing scope failures and empty retrieval
- optional support for `GLEAN_CLIENT_ACT_AS`

Validated:

- `npm run typecheck`
- `npm run build`
- search token health check
- chat token health check with `X-Glean-ActAs`

Not yet validated:

- successful ingestion into a sandbox datasource
- successful end-to-end grounded answer over the fixture corpus
- MCP invocation against indexed sandbox content

## Recommended Next Step

Resolve the indexing-token scope issue first. Once a token with the needed datasource permission is available, re-run ingest and then complete end-to-end validation for search, chat, and the MCP tool.
