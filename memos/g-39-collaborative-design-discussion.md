# G-39 Collaborative Design Discussion

## Goal

Prepare for the interview segment where the prototype must be extended conceptually into a production-ready customer solution for multiple teams, stronger permissions, observability, and controlled rollout.

Assume the interviewer is the Director of Solutions Architecture for a Staff Solutions Architect role.

The goal in this section is to show:

- architectural judgment,
- ability to sequence a real customer delivery,
- comfort with tradeoffs and risk management,
- and the ability to stay practical instead of drifting into vague platform talk.

## Recommended Framing

Use this answer structure every time:

1. Start by acknowledging what the current prototype optimizes for.
2. Name the new production requirements explicitly.
3. Evolve the architecture in layers: ingestion, retrieval, orchestration, permissions, observability, rollout.
4. Call out the biggest risks and assumptions.
5. End with an execution plan from design through rollout.

This keeps the answer structured and executive-friendly.

## Anchor Statement

Use this as the first 30 to 45 seconds:

“The current prototype is intentionally narrow. It proves the end-to-end Glean flow with a constrained corpus, one local MCP tool, and a small review surface. If a customer wanted to productionize this for multiple teams and connect it to a real internal support chatbot, I would keep the core retrieval-plus-grounding pattern, but I would evolve the system around it with stronger identity, permissions, observability, and release controls rather than trying to stretch the current local-only shape directly into production.”

## Architecture Evolution

### 1. Channel and application layer

Current state:

- local CLI and local MCP tool

Production direction:

- introduce an application service between end-user channels and Glean
- support channels such as an internal support chatbot, web app, Slack, or ticketing assistant
- keep the user-facing channels thin and centralize orchestration in a backend service

Why:

- gives one place for policy enforcement, observability, prompt management, and rollout controls

### 2. Ingestion and content management

Current state:

- a small hand-authored fixture corpus loaded from the repo

Production direction:

- move to managed content onboarding pipelines
- support multiple datasources or source systems by team, business unit, or content domain
- normalize metadata such as team, document type, classification, owner, effective date, and retention window
- make content ingestion incremental and auditable

Why:

- production retrieval quality depends heavily on content hygiene and metadata strategy

### 3. Retrieval and grounding

Current state:

- Search API with datasource filtering and bounded `topK`
- explicit grounded prompt built from retrieved snippets

Production direction:

- preserve the search-then-ground pattern
- add stronger metadata filters and policy-driven retrieval rules
- tune retrieval differently by use case, team, or channel
- introduce evaluation around source quality, answer quality, and fallback behavior

Why:

- a shared sandbox pattern is acceptable for a prototype, but not for a production assistant that needs tighter controls and more predictable citations

### 4. Permissions and identity

Current state:

- simple `allowedUsers` on indexed documents
- optional `X-Glean-ActAs` for chat auth

Production direction:

- align the assistant with the customer’s identity provider and user context
- preserve end-user identity through the application layer wherever possible
- enforce permissions at both retrieval time and application-policy time
- separate admin/operator privileges from end-user privileges
- define what the assistant can and cannot summarize across team boundaries

Why:

- in production, permissions are not just a data access question; they are also a trust, compliance, and supportability question

### 5. Observability

Current state:

- local command output and GitHub Actions checks

Production direction:

- instrument request tracing end to end
- log retrieval inputs, result counts, selected sources, latency, and failure categories
- track answer quality signals and human feedback
- create dashboards for latency, zero-result rates, citation quality, auth failures, and content freshness

Why:

- without observability, you cannot tell whether failures come from content, auth, retrieval, prompting, or downstream dependencies

### 6. Rollout and change management

Current state:

- local review flow and CI checks

Production direction:

- roll out by team or use case, not all at once
- use pilot groups with explicit success criteria
- version prompts and retrieval rules
- gate broader rollout on measurable quality, support burden, and trust signals

Why:

- staged rollout reduces risk and gives time to refine retrieval and permissions before wide adoption

## Suggested Production Architecture

Use this as your concise target-state answer:

1. User interacts through a support channel.
2. The channel calls an application service.
3. The application service resolves identity, tenant or team context, and policy.
4. The service retrieves relevant content from Glean with tighter metadata and permission constraints.
5. The service calls Glean Chat or an equivalent grounding layer using only approved context.
6. The service returns the answer with citations, logs the interaction, and emits telemetry.
7. Admin operators monitor quality, latency, policy violations, and rollout metrics.

## Assumptions To State Explicitly

- the customer wants a production internal assistant, not a public-facing product
- content sources and permissions vary across teams
- latency matters, but trust and correctness matter more
- some use cases will require escalation rather than a direct answer
- the first production scope should be a narrow support domain, not the entire enterprise at once

## Risks To Surface

- poor metadata quality will undermine retrieval quality
- permissions can become inconsistent across source systems
- teams may want different answer behavior, which creates configuration sprawl
- observability can become expensive or incomplete if it is added late
- chatbot trust will fall quickly if citations are noisy or permissions are violated

## Rough Plan: Design To Rollout

### Design

- choose the initial support domain and pilot audience
- define identity, permissions, and escalation requirements
- agree on metadata model and content onboarding rules
- define success metrics for quality, latency, and support deflection

### Build

- stand up the application service
- add policy-aware retrieval and identity propagation
- onboard the first content sources
- implement telemetry and operational dashboards

### Test

- run offline retrieval and answer evaluations
- test permission boundary cases
- validate latency and failure handling
- perform pilot-user acceptance testing

### Rollout

- launch to a narrow pilot group
- review quality and support feedback weekly
- expand by domain or team only after metrics and trust are acceptable

## Talk Track For The Example Prompt

Use this as the core answer:

“I would preserve the core pattern from the prototype, which is retrieve first and ground the answer from explicit context, but I would move it into a service-oriented architecture. Today the prototype is optimized for clarity: one constrained corpus, one datasource, one MCP tool, and a local workflow. For a real customer deployment across multiple teams, I would introduce an application layer in front of Glean so that identity, policy, observability, and rollout controls live in one place.

On the content side, I would move from hand-managed fixtures to governed onboarding pipelines with stronger metadata. On the retrieval side, I would keep the Search-plus-Chat split, but I would add policy-aware filtering and evaluation so that citations and answer quality remain predictable. On the security side, I would preserve end-user identity wherever possible and treat permissions as both a retrieval concern and an application-governance concern.

Operationally, I would add tracing, answer-quality telemetry, zero-result monitoring, and dashboards for auth and latency issues, because otherwise support teams will not know if the problem is content freshness, permissions, retrieval quality, or the grounding step. Finally, I would not launch this broadly on day one. I would start with a narrow support domain and pilot group, define clear success criteria, and expand only after quality and trust signals were strong.” 

## Strong Follow-Up Angles

### If asked “what would you build first?”

“I would build the application service, identity propagation, and a stronger metadata strategy before I tried to broaden the user interface surface.”

### If asked “what would you defer?”

“I would defer broad multi-channel support and generalized agentic workflows until the retrieval, permissions, and observability model were stable in one narrow domain.”

### If asked “what would success look like?”

“High trust, low permission leakage risk, understandable citations, acceptable latency, and measurable reduction in support friction for the pilot domain.”

## Ten Other Questions They Might Ask

### 1. How would you isolate different teams or business units?

Talk track:

Use a combination of datasource strategy, metadata segmentation, and identity-aware retrieval policy. I would avoid relying on just one layer of separation.

### 2. How would you handle documents with conflicting policies?

Talk track:

Add metadata for policy ownership and effective date, prefer authoritative sources in retrieval ranking, and instruct the assistant to acknowledge conflicts instead of flattening them.

### 3. How would you prevent the chatbot from over-answering when context is weak?

Talk track:

Keep the explicit grounding pattern, add minimum evidence thresholds, and support escalation or “I don’t have enough information” outcomes as a first-class behavior.

### 4. How would you observe and debug bad answers in production?

Talk track:

Capture the request, retrieval set, selected sources, final prompt version, response metadata, latency, and user feedback so failures can be localized quickly.

### 5. What would you do if one content source has poor metadata hygiene?

Talk track:

Treat metadata quality as a product dependency, not a cleanup afterthought. I would gate rollout quality on content readiness and, if needed, exclude low-quality sources until they are normalized.

### 6. How would you think about latency versus answer quality?

Talk track:

For internal support, trust usually matters more than raw speed. I would choose bounded retrieval and careful grounding first, then optimize latency once I had stable answer quality.

### 7. How would you secure admin or support tooling around this system?

Talk track:

Separate end-user access from operator access, apply least privilege, log sensitive actions, and make prompt/configuration changes auditable.

### 8. How would you support continuous improvement after launch?

Talk track:

Add feedback capture, review low-confidence or escalated interactions, track repeated failure themes, and iterate on metadata, retrieval rules, and prompts in a controlled way.

### 9. How would you integrate this with a human support workflow?

Talk track:

Support escalation paths where the assistant can hand off a cited context package to a human queue rather than forcing full automation for every case.

### 10. If the customer wanted agentic actions later, how would your design change?

Talk track:

I would add actions only after the read-only assistant was trustworthy. Then I would introduce scoped tools, approval boundaries, audit logging, and stricter policy enforcement before allowing state-changing workflows.

## Ideal Closing Line

End this section with:

“My goal would be to keep the clarity of the current retrieval-and-grounding pattern, but surround it with the identity, policy, telemetry, and rollout discipline that a real multi-team customer deployment needs.”
