# G-53 Remote MCP Enterprise Deployment

## Purpose

This note documents a production-oriented path for making the repository's MCP tool available remotely. It focuses on an enterprise deployment of option 1: hosting the MCP server directly over HTTP rather than only exposing it as a local `stdio` process.

## Current State

Today the repository ships a local MCP server in `src/mcp.ts` that:

- exposes one tool, `ask_company_docs`
- runs over `StdioServerTransport`
- reads configuration and credentials from local `env/variables.env` and `env/secrets.env`
- reuses the existing Glean workflow in `src/workflow.ts`

That shape is appropriate for the take-home because it keeps setup small and reviewable, but it does not yet provide:

- shared remote access
- centralized authentication and authorization
- operational controls for a multi-user service
- production secret handling

## Recommended Target

Use a stateless MCP service over Streamable HTTP, fronted by the company's normal ingress and identity controls.

Recommended deployment properties:

- internal HTTPS endpoint such as `https://mcp.company.internal/glean`
- stateless request handling so instances can scale horizontally
- containerized service on Kubernetes, Cloud Run, ECS, or a similar managed runtime
- gateway or service-mesh enforcement for auth, rate limiting, and network policy
- server-side secret retrieval from a managed secret store

Why stateless first:

- the current tool is already request-response shaped
- the server does not keep conversational MCP state today
- horizontal scaling and blue-green deployment are simpler
- rollback and incident response are easier than with sticky sessions

If later requirements include long-running tasks, resumability, or server-initiated notifications, the deployment can evolve into stateful MCP sessions without discarding the HTTP endpoint pattern.

## Target Architecture

The production request path should look like this:

1. An MCP client connects to the remote MCP endpoint over HTTPS.
2. An API gateway or ingress layer terminates TLS and authenticates the caller.
3. The hosted MCP service validates tool input and resolves per-request policy.
4. The service calls the existing retrieval and grounded-answer workflow.
5. The workflow queries Glean Search, then Glean Chat, and returns the answer plus citations.
6. Logs, traces, metrics, and audit events are emitted to the enterprise observability stack.

Core service boundaries:

- transport layer: MCP over Streamable HTTP
- application layer: `ask_company_docs` and policy enforcement
- workflow layer: existing `askQuestion()` logic in `src/workflow.ts`
- platform layer: auth, secrets, ingress, logging, tracing, and deployment automation

## Auth And Identity Model

Identity is the most important design decision for a remote deployment.

The local prototype can rely on shared env-backed credentials and an optional fixed `GLEAN_CLIENT_ACT_AS`. A shared remote service should not assume one static identity for every caller unless the product is intentionally service-account only.

There are three practical models:

### Service Identity Only

The gateway authenticates the calling application, and the MCP service always uses one backend identity for Glean.

Pros:

- simplest rollout
- easy to cache and reason about
- best for internal platform-to-platform usage

Cons:

- weaker user-level auditability
- answer visibility can drift away from end-user entitlements
- not ideal when Glean access should follow the requesting employee

### User-Delegated Identity

The MCP client authenticates the end user through the company identity provider and the service maps that identity into Glean request headers or an equivalent per-user policy.

Pros:

- strongest alignment with per-user authorization
- better audit trails
- cleaner story for enterprise governance

Cons:

- more platform work
- requires careful token handling and identity mapping
- more failure modes around session expiry and impersonation

### Hybrid App Plus User Identity

The client authenticates as an application but also forwards signed end-user identity claims. The gateway and MCP service validate both.

Pros:

- common fit for agent platforms
- preserves app trust boundaries and user attribution
- supports policy decisions based on both caller and user

Cons:

- more moving pieces than either single-identity model

For this repository, the hybrid model is the best long-term enterprise target if the service will be called by agents on behalf of employees.

## Policy And Authorization

Before invoking the workflow, the remote service should enforce policy such as:

- which callers may invoke `ask_company_docs`
- which users may query which datasource
- maximum allowed `topK`
- whether citations must always remain enabled
- whether specific query classes should be blocked, redacted, or escalated
- whether the caller may pass an explicit datasource override

This policy should live outside the prompt and outside `src/workflow.ts`. The MCP layer or a thin service wrapper should make those decisions before the Glean API calls are sent.

## Secret And Config Management

A hosted service should stop relying on checked-out local env files as its primary runtime source.

Production replacements:

- secret manager or vault for `GLEAN_SEARCH_API_TOKEN` and `GLEAN_CLIENT_API_TOKEN`
- runtime environment variables or platform config for non-secret values such as datasource defaults
- per-environment configuration bundles for dev, staging, and prod

Recommended operational shape:

- inject secrets at runtime, not at image build time
- rotate tokens centrally
- keep secret access scoped to the service account running the MCP service
- separate staging and production Glean credentials

## Network And Security Controls

Enterprise remote MCP should be treated as an internal API surface, not just a developer convenience endpoint.

Minimum controls:

- TLS termination at the edge
- private ingress or zero-trust access
- OAuth2, OIDC JWT validation, mTLS, or equivalent client authentication
- request size limits
- rate limiting and burst protection
- outbound egress restricted to Glean and approved dependencies
- audit logging for tool invocations
- structured application logs with secret redaction
- tracing and correlation IDs
- WAF or gateway protections when exposed beyond a private network

Additional safeguards worth planning for:

- deny-by-default datasource allowlist
- prompt and response retention policy
- query logging with privacy review
- abuse detection for repeated high-cost or suspicious queries

## Runtime And Scaling

The current workflow is network-bound and synchronous, which makes it a strong candidate for a stateless autoscaled deployment.

Operational recommendations:

- expose health and readiness probes
- autoscale on request rate, latency, and error rate
- use short instance startup paths so scale-out is fast
- budget for Glean latency in end-to-end timeouts
- add concurrency limits so one caller cannot exhaust outbound capacity

Suggested environments:

- local: existing `stdio` MCP flow
- staging: hosted remote MCP against sandbox data
- production: hosted remote MCP against approved enterprise datasource and credentials

## Code Organization For This Repo

If this repository were extended for a remote deployment, the cleanest layout would be:

1. Keep `src/workflow.ts` as the core Glean integration layer.
2. Keep `src/mcp.ts` or split it into a transport-specific local entrypoint for `stdio`.
3. Add a new HTTP server entrypoint that hosts the same tool definitions over Streamable HTTP.
4. Add auth and policy middleware before invoking `askQuestion()`.
5. Replace local env-file assumptions with runtime secret and config providers.

This keeps the current business logic reusable while separating local review ergonomics from hosted-service concerns.

## Observability And Auditability

A remote enterprise service needs a stronger operating model than the prototype.

Recommended telemetry:

- request count, latency, and error metrics by tool
- downstream latency for Glean Search and Chat calls
- structured logs with request IDs and caller identity
- distributed traces from gateway to MCP service to outbound Glean calls
- audit events recording caller, user identity, datasource, and decision outcome

Important logging caution:

- never log raw secrets
- treat questions and retrieved snippets as potentially sensitive internal content
- redact or sample logs according to company policy

## Rollout Path

A low-risk rollout can happen in phases:

### Phase 1: Internal Pilot

- host the service on a private endpoint
- restrict access to a small set of approved clients
- use a single service identity if user-level enforcement is not yet ready
- validate reliability, latency, and observability

### Phase 2: User-Aware Access

- add per-user identity propagation
- enforce datasource and tool policy based on caller and user
- strengthen audit reporting

### Phase 3: Broader Platform Adoption

- publish the endpoint as a supported internal MCP service
- add SLOs, incident runbooks, and on-call ownership
- expand compatibility testing across MCP clients

## Main Risks

The main risks in a hosted deployment are not transport-related; they are governance-related.

Key risks:

- using one shared backend identity for every caller
- exposing internal-doc search too broadly
- weak audit trails for who asked what
- poor separation between staging and production credentials
- assuming all MCP clients support the same remote transport behavior

## Recommendation Summary

For this codebase, the best enterprise version of option 1 is:

- Streamable HTTP
- stateless service instances
- internal-only HTTPS ingress first
- gateway-enforced auth
- managed secrets
- explicit policy enforcement before `askQuestion()`
- centralized logging, tracing, and audit events

That approach preserves the current prototype's small core while replacing the local-only assumptions that would not hold in production.
