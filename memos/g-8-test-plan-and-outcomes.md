# G-8 Test Plan And Outcomes

## Purpose

This memo records the testing work completed for `G-8`, including targeted automated coverage, failure-case validation, manual end-to-end checks, and the GitHub Actions workflows added to support ongoing validation.

## Scope Covered

This sprint addresses the testing-oriented child issues under `G-8`:

- `G-21` Add focused coverage for highest-risk behaviors
- `G-22` Validate failure cases and configuration errors
- `G-23` Run manual checks for the primary user journey
- `G-24` Fix defects uncovered during validation
- `G-25` Record a lightweight test plan and outcomes

## Automated Coverage Added

### Unit tests

Added focused unit tests for the most failure-prone pure logic in the current prototype:

- config defaults and required token handling
- optional `GLEAN_CLIENT_ACT_AS` propagation
- fixture `viewURL` generation
- whitespace normalization and truncation helpers
- grounded prompt construction
- assistant response extraction
- citation appendix formatting

These tests live under `test/` and run with the built-in Node test runner via:

```bash
npm run test:unit
```

### Quality checks

Added a quality gate script:

```bash
npm run check
```

This runs:

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`

### Integration / e2e smoke test

Added:

- `src/e2e.ts`
- `npm run test:e2e`

This script runs the actual ingest and ask flow against the sandbox and fails if the chatbot does not return an answer with sources.

## GitHub Actions Deliverables

### `.github/workflows/ci.yml`

Purpose:

- run quality gates on feature branches and pull requests

Included checks:

- install dependencies
- lint
- typecheck
- unit tests
- build
- secret scanning with Gitleaks

### `.github/workflows/codeql.yml`

Purpose:

- run static analysis for JavaScript/TypeScript on pull requests and `main`

### `.github/workflows/main-integration.yml`

Purpose:

- run integration/e2e validation on `main` and on manual dispatch

Behavior:

- runs only when the required Glean secrets are configured
- otherwise emits a clear skipped message instead of failing opaquely

Required GitHub secrets:

- `GLEAN_INDEXING_API_TOKEN`
- `GLEAN_SEARCH_API_TOKEN`
- `GLEAN_CLIENT_API_TOKEN`
- `GLEAN_ALLOWED_USER_EMAILS` or `GLEAN_ALLOWED_USER_EMAIL`
- `GLEAN_CLIENT_ACT_AS`

## Validation Runs

### 1. Quality suite

Command:

```bash
npm run check
```

Outcome:

- passed

### 2. Build

Command:

```bash
npm run build
```

Outcome:

- passed

### 3. End-to-end smoke test

Command:

```bash
GLEAN_CLIENT_ACT_AS=alex@glean-sandbox.com npm run test:e2e -- --datasource interviewds --allowed-user-emails alex@glean-sandbox.com --question "Can I work remotely while attending a conference abroad?"
```

Outcome:

- passed

Observed behavior:

- fixture documents were uploaded successfully
- the ask flow returned a grounded answer with sources
- uploaded documents are processed asynchronously by default, so fresh content can take a few minutes to appear after ingest

### 4. Failure case: missing allowed user email

Command:

```bash
npm run ingest -- --datasource interviewds
```

Outcome:

- failed as expected with a clear validation error

### 5. Failure case: missing chat `ActAs` header

Command:

```bash
npm run ask -- --datasource interviewds --question "Can I work remotely while attending a conference abroad?"
```

Outcome:

- failed as expected with `Required header missing: X-Glean-ActAs`

## Defects Found And Addressed

### Incorrect datasource family

Found:

- the implementation originally used `interviews*` instead of the sandbox's `interviewds*` datasources

Fix:

- corrected runtime defaults and CLI guidance to use `interviewds`

### Invalid document URLs for datasource regex

Found:

- fixture documents originally used generic intranet URLs that did not match the sandbox datasource regex

Fix:

- generate valid fixture `viewURL` values automatically during indexing

### Chat auth mode not represented in runtime config

Found:

- the chat token required `X-Glean-ActAs`, but the runtime config did not support that explicitly

Fix:

- added optional `GLEAN_CLIENT_ACT_AS` support to the prototype

## Remaining Caveats

- The selected sandbox datasource is not empty, so some search results may include pre-existing content beyond the fixture corpus.
- Freshly uploaded documents are processed asynchronously, so a validation run may need a short wait before new content becomes discoverable.

## Recommended Next Step

`G-8` can be reviewed based on a working validation layer plus CI workflows. The next logical step is to merge the sprint deliverable, then assess which of the `G-8` child issues should be marked `Done`.
