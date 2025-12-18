# System Design: AnswerConnect (Research + Drafting + Workflow Automation)

This repository describes a **single application** with two primary surfaces:

- **Integrated Research & Drafting Workspace**
- **Cognitive Workflow Orchestrator**

### Prototype code layout
- UI entry: [src/App.jsx](src/App.jsx)
- Drafting workspace: [src/drafting/DraftingWorkspace.jsx](src/drafting/DraftingWorkspace.jsx)
- Workflow orchestrator: [src/workflows/WorkflowOrchestrator.jsx](src/workflows/WorkflowOrchestrator.jsx)
- Design/UI spec: [README.design.md](README.design.md)

Prototype screenshot reference:

- [image.png](image.png)

> The current code in this repo is frontend-only prototype UI (in-memory state + hardcoded data). This README describes a scalable backend/system design that can power the same product in production.

---

## System Diagram (high-level)

```mermaid
flowchart LR
  U[User] --> UI[Web App (single product UI)]
  UI -->|HTTPS| BFF[API Gateway / BFF]
  UI <--> |SSE/WebSocket| EVT[Realtime Events]

  BFF --> AUTH[AuthN/AuthZ]
  BFF --> DOC[Document Service]
  BFF --> CIT[Authority & Citation Service]
  BFF --> MEM[Research Memory Service]
  BFF --> ALT[Alerting Service]
  BFF --> WF[Workflow Service (control plane)]
  BFF --> RUN[Workflow Runner (data plane)]
  BFF --> SRCH[Search/Indexing Service]
  BFF --> EXP[Export Service]

  RUN --> Q[Queue/Event Bus]
  DOC --> DB[(Operational DB)]
  WF --> DB
  MEM --> DB
  ALT --> DB
  CIT --> DB
  SRCH --> IDX[(Search Index)]
  DOC --> OBJ[(Object Storage)]
  EXP --> OBJ
  Q --> WRK[Step Workers]
  WRK --> AI[LLM/OCR Providers]
```

Diagram notes:

- The UI is one product; “Drafting” and “Workflows” are modules behind the same identity and data plane.
- Workflow steps and document/authority processing run asynchronously via queues for reliability and scale.

---

## 1) Product Goals (derived from the prototypes)

### A. Drafting workspace

Core UX capabilities implied by the UI:

- **Draft document** with structured sections (Executive Summary, sections I–III, Conclusion).
- **Smart Suggestions**: while user types, propose relevant authorities (statute/case/reg) with quotes and “why relevant,” then insert citation into text.
- **Auto-citations**: maintain a **Table of Authorities (TOA)** grouped by Cases/Statutes/Regulations.
- **Flags & Alerts**:
  - Highlight unsupported claim inline, with a tooltip suggesting a supporting authority.
  - “Update alert” that an authority was distinguished/updated; offer a review flow and optionally insert a new authority.
- **Research Memory**: store claim → authority → quote relations with timestamp; show coverage stats.
- **Exports/Actions**: “Export to Word,” “Export TOA,” “Search AnswerConnect,” “View Research History.”

### B. Workflow orchestrator

Core UX capabilities implied by the UI:

- **Workflow catalog** (active workflows) with trigger, step count, avg time, accuracy, last run.
- **Run workflow** and visualize step progress (pending → in progress → completed), with step agent + detail.
- **Workflow Builder**: drag modules onto canvas (Trigger, Extract, AI Analysis, Validate, Route/Assign, Output), move modules, remove modules, clear canvas.
- **Templates**: template library with categories and search; “Use Template” populates canvas.
- **Analytics**: metrics dashboard + trends + recent executions.
- **Export**: generate a metrics report (HTML download).

---

## 2) Design Principles (why these choices)

1. **Async-first for long work**: extraction, LLM analysis, validation, and report generation are variable latency. Run them as background jobs with status updates.
2. **Event-driven orchestration**: workflows are best modeled as state machines with idempotent steps.
3. **Multi-tenant by default**: professional tax/compliance tools are tenant-scoped; partitioning and authorization should enforce tenant isolation.
4. **Search is a first-class subsystem**: smart suggestions and “Search AnswerConnect” require fast hybrid retrieval (keyword + vector).
5. **Auditability**: citations, suggestions, and workflow actions must be explainable and traceable (who/what/when/why).
6. **Composable services**: keep “Drafting” and “Workflows” separate but interoperable through shared identity, document store, and event bus.

---

## Workflow Diagram (example end-to-end automation)

This matches the module chain shown in the workflow builder and the run visualization.

```mermaid
sequenceDiagram
  participant UI as Web App
  participant BFF as API Gateway/BFF
  participant WF as Workflow Service
  participant RUN as Workflow Runner
  participant Q as Queue/Event Bus
  participant W as Step Worker
  participant DOC as Document Service
  participant CIT as Citation Service
  participant ALT as Alerting
  participant OBJ as Object Storage

  UI->>BFF: POST /v1/workflows/{id}/runs
  BFF->>WF: Create WorkflowRun
  WF-->>BFF: runId
  BFF-->>UI: 202 Accepted (runId)

  WF->>RUN: Start run
  RUN->>Q: Enqueue Step 1 (Extract)
  Q->>W: Deliver job
  W->>DOC: Store extracted text/fields
  W->>Q: Enqueue Step 2 (AI Analysis)
  Q->>W: Deliver job
  W->>CIT: Suggest/verify authorities
  W->>ALT: Create alerts (unsupported/update)
  W->>OBJ: Write outputs (reports/exports)
  RUN-->>UI: Status updates via SSE/WebSocket
```

---

## 3) High-Level Architecture

### Components

- **Web App (React/Next.js)**
  - Hosts drafting workspace and workflow orchestrator UI.
  - Uses WebSockets/SSE for real-time job/workflow status.

- **API Gateway / BFF (Backend-for-Frontend)**
  - Single public API for the UI; handles auth, request shaping, pagination, and fan-out.

- **AuthN/AuthZ**
  - SSO + tenant isolation + RBAC roles (Staff, Manager, Partner, Admin).

- **Document Service**
  - CRUD for documents, versions, sections, exports.

- **Authority & Citation Service**
  - Authority catalog ingestion (internal licensed content and/or public sources).
  - Citation parsing, normalization, formatting (TOA output).
  - “Suggest citations” and “Verify citations” endpoints.

- **Research Memory Service**
  - Stores claim→authority→quote links; enables coverage and explainability.

- **Alerting Service**
  - Generates unsupported-claim flags and “authority updates” alerts.
  - Pushes notifications to UI and email/Teams/Slack.

- **Workflow Service (control plane)**
  - Stores workflow definitions/templates and builder outputs (DAG).

- **Workflow Runner (data plane)**
  - Executes workflow runs with step retries, timeouts, and compensation.
  - Produces run telemetry and status events.

- **Search/Indexing Service**
  - Hybrid retrieval for internal research corpus and user documents.

- **Observability**
  - Central logs, metrics, traces, and audit events.

### Suggested Azure-first deployment (scalable defaults)

You can implement this on any cloud, but Azure managed services map well to the prototype’s AI + document nature:

- Compute: **AKS** (Kubernetes) or **Azure Container Apps**
- API: **Azure API Management**
- Auth: **Microsoft Entra ID** / **Entra External ID (B2C)**
- Object storage: **Azure Blob Storage** (original docs, exports)
- Queue/eventing: **Azure Service Bus** (jobs) + **Event Grid** (events)
- NoSQL operational store: **Azure Cosmos DB** (multi-tenant documents, workflows, runs, memory)
- Search: **Azure AI Search** (keyword + vector)
- AI: **Azure OpenAI** (LLM), **Azure AI Document Intelligence** (OCR/layout)
- Monitoring: **Azure Monitor / Application Insights + OpenTelemetry**

---

## 4) Core Data Model (entities)

These entities are directly implied by the prototypes.

### Tenant & Identity

- **Tenant**: `tenantId`, `name`, `settings`, `dataResidencyRegion`
- **User**: `userId`, `tenantId`, `email`, `role`, `displayName`
- **Matter/Client** (optional but strongly implied): `matterId`, `tenantId`, `name`, `jurisdiction`, `tags`

### Documents (Drafting workspace)

- **Document**: `documentId`, `tenantId`, `matterId`, `title`, `type` (memo/opinion/audit memo), `status`, `createdBy`, `updatedAt`
- **DocumentVersion**: `documentId`, `versionId`, `createdAt`, `createdBy`, `content` (or references to blocks)
- **DocumentBlock/Section** (recommended for collaboration): `blockId`, `documentId`, `type`, `text`, `order`

### Authorities & Citations

- **Authority**: `authorityId`, `type` (statute/case/reg), `jurisdiction`, `citationText`, `canonicalId`, `source`, `effectiveDate`, `metadata`
- **AuthorityTextChunk**: `authorityId`, `chunkId`, `text`, `embeddingVector`, `hash`, `sourceUrl`
- **CitationInstance**: `citationInstanceId`, `documentId`, `authorityId`, `snippetRange`, `quote`, `createdAt`
- **TableOfAuthorities** (materialized or computed): grouped list per document/version

### Research Memory

- **ClaimLink**: `claimLinkId`, `documentId`, `claimText`, `authorityId`, `quote`, `createdAt`, `confidence`, `provenance`

### Alerts

- **Alert**: `alertId`, `tenantId`, `documentId?`, `type` (unsupported-claim | authority-update | new-authority), `severity`, `message`, `status`, `createdAt`
- **AuthorityUpdate**: `authorityId`, `updateType` (distinguished/overruled/new guidance), `summary`, `effectiveDate`, `sources[]`

### Workflows

- **WorkflowDefinition**: `workflowId`, `tenantId`, `name`, `description`, `triggerType`, `modules[]`, `connections[]`, `version`
- **WorkflowTemplate**: curated baseline defs (like the prototype templates)

### Workflow runs

- **WorkflowRun**: `runId`, `workflowId`, `tenantId`, `status`, `triggeredBy`, `startedAt`, `endedAt`, `inputs`, `outputsRef`, `metrics`
- **WorkflowStepRun**: `runId`, `stepId`, `status`, `attempt`, `startedAt`, `endedAt`, `agent`, `logsRef`, `errorRef`

### Audit/Telemetry

- **AuditEvent**: `eventId`, `tenantId`, `actorId`, `action`, `resourceType`, `resourceId`, `timestamp`, `diff`, `ip`

---

## 5) API Surface (what the frontend would call)

A pragmatic REST shape (GraphQL also works; keep the UI-facing surface stable).

### Documents

- `POST /v1/documents` create memo (type: research memo/opinion/audit memo)
- `GET /v1/documents?matterId=&page=` list
- `GET /v1/documents/{id}` fetch
- `PUT /v1/documents/{id}` update
- `POST /v1/documents/{id}/export?format=docx|pdf` export

### Smart suggestions & citations

- `POST /v1/citations/suggest`
  - input: `documentId`, `cursorContext`, `jurisdiction`, `matterId`, `topK`
  - output: authorities with `quote`, `reason`, `relevance`
- `POST /v1/citations/insert`
  - creates `CitationInstance` + updates TOA
- `GET /v1/documents/{id}/table-of-authorities`
- `POST /v1/citations/verify` (optional): validate citation text and/or pinpoint quote provenance

### Research memory

- `GET /v1/documents/{id}/memory`
- `POST /v1/documents/{id}/memory` (create link)

### Alerts

- `GET /v1/alerts?documentId=&status=`
- `POST /v1/alerts/{id}/ack`
- `POST /v1/alerts/{id}/resolve`

### Workflows

- `GET /v1/workflows` list
- `POST /v1/workflows` create (builder save)
- `GET /v1/workflows/templates` list/search
- `POST /v1/workflows/{id}/runs` start a run
- `GET /v1/workflows/runs/{runId}` status
- `GET /v1/workflows/runs/{runId}/steps` step detail

### Realtime

- `GET /v1/events/stream` (SSE) or `WS /v1/events`
  - emits: alert created, suggestion ready, workflow run update

---

## 6) Key End-to-End Flows (step-by-step with reasoning)

### Flow A — “Smart Suggestions” while drafting

1. **User types** in document editor.
   - Reason: capture local context around cursor for retrieval.
2. Frontend sends `POST /citations/suggest` with the surrounding paragraph/section.
   - Reason: retrieval needs context, jurisdiction, and matter metadata.
3. Backend performs **hybrid retrieval**:
   - Keyword query (fast exact matches) + vector similarity (semantic matches).
   - Reason: statutes/cases often require exact IDs, but paraphrases need semantic recall.
4. Backend ranks candidates and returns:
   - `authorityId`, canonical citation text, a short `quote`, `reason`, and a confidence/relevance score.
   - Reason: the UI shows quote + “why relevant,” so return explainable snippets.
5. User clicks “Insert Citation.”
6. Backend writes `CitationInstance`, updates TOA, and appends `ClaimLink` (research memory).
   - Reason: the prototype simultaneously updates doc, TOA, and memory.

Scalability notes:
- Cache frequent authority lookups.
- Embed/index authorities asynchronously; suggestion endpoint must stay low-latency.

### Flow B — Unsupported claim detection (Flags)

1. On save (or periodically), backend runs a **claim coverage check** over the document:
   - identifies sentences/claims without linked citations.
   - Reason: UI highlights “unsupported claim” inline.
2. Backend generates `Alert(type=unsupported-claim)` with suggested authority (or “needs research”).
   - Reason: produce a durable alert record and a UI experience.
3. UI renders highlight and tooltip with suggested cite.
4. User “Add Citation,” backend creates `CitationInstance` + `ClaimLink` and resolves alert.

Why async:
- Claim extraction and matching can be expensive; run in background and stream results.

### Flow C — Authority update alert + review

1. A scheduled job monitors authority updates (new decisions, distinguishing cases, new IRS guidance).
2. For impacted authorities cited in user documents, create `Alert(type=authority-update)`.
3. UI shows “Review update,” and backend provides:
   - update summary, impacted text locations, and recommended action.
4. If user accepts, backend inserts new authority (e.g., “Garcia (2024)”) and records provenance.

Why this matters:
- This is a differentiator: keeping memos current and defensible.

### Flow D — Run a workflow

1. User clicks “Run Workflow.”
2. Backend creates `WorkflowRun` and enqueues step 1.
   - Reason: don’t block the UI; support retries/timeouts.
3. Runner executes each step:
   - Extract → Analyze → Validate → Route/Assign → Output.
   - Each step writes a `WorkflowStepRun` record.
4. Runner emits status events; UI updates via SSE/WebSocket.
5. On completion, outputs are stored in object storage and referenced from the run.

Why event-driven:
- Each workflow step can scale independently and can be owned by different teams/services.

### Flow E — Workflow builder save

1. User drags modules onto canvas.
2. UI sends `POST /workflows` with modules + connections (DAG).
3. Backend validates:
   - at least one Trigger, at least one Output, DAG has no cycles (or supports them explicitly).
   - Reason: prevent “impossible runs.”

### Flow F — Analytics + Export report

1. Metrics are computed from `WorkflowRun` + `WorkflowStepRun`.
2. Export request triggers a job that generates HTML/PDF and stores it.
3. UI downloads via a signed URL.

Why:
- Exports can be large; signed URLs reduce API load.

---

## 7) Storage & Indexing (scalability)

### Operational store (multi-tenant)

Use a tenant-partitioned design:

- Partition key: `tenantId`
- Optional hierarchical keys: `tenantId/matterId` for large tenants

Why:
- Minimizes cross-tenant queries and improves predictable scaling.

### Object storage

- Original uploads (notices, IDs, PDFs)
- Generated exports (docx, pdf, html report)

Why:
- Cheap and scalable for large binaries; keep DB for metadata.

### Search index

- Index authority chunks + metadata for retrieval
- Index user documents (optional) for internal search

Why:
- Smart Suggestions need low-latency retrieval; database queries alone won’t match relevance needs.

---

## 8) Workflow Execution Model (how to make it robust)

- Model workflows as **DAGs**; store definition separately from runs.
- Enforce **idempotent step handlers** using a `runId + stepId + attempt` key.
- Retries with exponential backoff; classify errors (retryable vs terminal).
- Persist checkpoints after each step.
- Support human-in-the-loop steps (Route/Assign) by pausing a run until approval.

Reason:
- The prototype shows routing/approval and long-running tasks; production needs resiliency.

---

## 9) Security, Compliance, and Governance

- **Tenant isolation**: every record includes `tenantId`; enforce in code and queries.
- **RBAC**: Partner vs Staff permissions for approval, exports, and publication.
- **Encryption**: at rest + in transit.
- **PII/ID documents** (FinCEN BOI): use restricted access policies and redaction workflows.
- **Audit logs**: every citation insertion, export, workflow run, approval.
- **Model governance**: store prompts, model version, retrieval sources, and confidence.

---

## 10) External APIs / Managed Services to Consider

Pick based on licensing and the content you’re allowed to use.

### Document extraction (OCR/layout)

- Azure AI Document Intelligence (Form Recognizer)
- Google Document AI
- AWS Textract

Why:
- CP2000 notices, IDs, filings, and PDFs require high-quality OCR + layout extraction.

### LLM / reasoning

- Azure OpenAI / OpenAI API / Anthropic (depending on policy constraints)

Why:
- Summarization, drafting response letters, explanation generation, and consistency checks.

### Authority sources (content)

- **Internal licensed corpus** (preferred for commercial tools)
- Public sources where appropriate:
  - CourtListener (opinions)
  - govinfo / Federal Register
  - IRS published guidance feeds

Why:
- Smart suggestions and update alerts depend on authoritative, up-to-date sources.

### Citation normalization / validation

- Consider building in-house (jurisdiction-specific rules) plus optional external citation parsing libraries/services.

### Financial/payment processor connectors (implied by 1099-K workflow)

- Stripe API, PayPal APIs, Square APIs

Why:
- Prototype steps reference scanning these transaction sources.

### Notifications

- SendGrid (email), Twilio (SMS), Microsoft Teams/Slack webhooks

Why:
- Routing, approvals, deadlines, and alerts.

### Auth

- Microsoft Entra External ID (B2C) / Auth0 / Okta

Why:
- Multi-tenant enterprise login and RBAC.

---

## 11) What’s intentionally “mocked” in the prototype (and production equivalents)

- In-memory arrays for suggestions/alerts/templates → **database + search index + jobs**
- Typing animation → **editor events + suggestion API**
- “Accuracy” metrics → **computed from run outcomes + evaluation harness**
- “Agents” in steps (Document Parser, Risk Analyzer, etc.) → **separate step workers/services**

---

## 12) Open Questions (to finalize design)

1. Do you have a licensed authority corpus (e.g., internal AnswerConnect) or must we rely on public sources?
2. Is real-time collaborative editing required (multiple users in a memo simultaneously)?
3. Required compliance posture: SOC2/ISO, data residency, retention, legal hold?
4. Preferred cloud and existing platform constraints?

---

## Appendix: Mapping UI features → backend services

- Smart Suggestions → Search/Indexing + Authority & Citation Service
- Insert Citation / TOA → Citation Service + Document Service
- Unsupported claim highlight → Alerting + Claim coverage job
- Authority update review → Authority update monitor + Alerting + Citation insertion
- Workflow runner visualization → Workflow Runner + realtime events
- Workflow builder → Workflow Service (control plane)
- Analytics/export → Analytics pipeline + export job
