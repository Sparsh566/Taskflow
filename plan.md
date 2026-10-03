# TaskFlow — Phase 3 Engineering Architecture & Roadmap Plan

## 📌 Executive Overview & Strategic Mission

TaskFlow has successfully completed **Phase 1** (Core Heuristic Verification Engine & Workbench) and **Phase 2** (UI Real-Estate, Modern Session Auth, Stealth Admin Isolation & Vault, Cloud Supabase Integration, Multi-Signal Verification & Human-in-the-Loop Overrides).

### Historical Milestones Completed
- [x] **Phase 1: Verification Engine Foundation** — Whitespace detection, comment churn filtering, autoformatter penalties, baseline scoring, and sandbox simulator.
- [x] **Phase 2.1: Retractable Side Navigation** — Expandable/collapsible matte black sidebar with persistent preference storage and floating tooltips.
- [x] **Phase 2.2: Dedicated Modern Authentication** — Polished login experience, Google / Gmail Single Sign-On, token persistence, and route protection.
- [x] **Phase 2.3: Ultra-Secure Stealth Admin & Master Vault** — Unpredictable route (`/nexus-90210-k7v`), designated master admin (`106.jedi.master@gmail.com`), hardware access keys, public form lockout, and identity camouflage.
- [x] **Phase 2.4: Supabase PostgreSQL & Storage Architecture** — Cloud database connection pooling, SQLAlchemy schema synchronization, and document storage service.
- [x] **Phase 2.5: Multi-Signal Verification & Dispute Mechanics** — CI test telemetry, PR review approvals, merge status, AI advisory suggestions, manager overrides, and employee dispute workflows.

---

### The Phase 3 Vision
**Phase 3** transforms TaskFlow from a verified task manager into a **Realtime Enterprise Workflow & Live Verification Intelligence Platform**. It connects actual production developer infrastructure (GitHub App webhooks, live CI/CD pipelines, semantic LLM analysis) with instantaneous multi-user collaboration (WebSockets, live Kanban synchronization, interactive timeline planning, and compliance audit exports).

---

## 🏗️ Phase 3 Architecture Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  TASKFLOW PHASE 3                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌──────────────────────┐      ┌────────────────────────┐      ┌──────────────────┐   │
│   │   Phase 3.1          │      │   Phase 3.2            │      │   Phase 3.3      │   │
│   │   Realtime Engine    │      │   GitHub Production    │      │   Semantic AI    │   │
│   │   & Live Sync        │      │   Webhooks             │      │   Inspector      │   │
│   │  - WebSockets / PubSub│     │  - HMAC SHA-256 Ingest │      │  - LLM Diff vs AC│   │
│   │  - Instant Kanban    │      │  - Push & PR Events    │      │  - Stub / Mock   │   │
│   │  - Live Team Chat    │      │  - Auto Branch Linking │      │    Detection     │   │
│   │  - Push Toasts       │      │  - CI Workflow Sync    │      │  - Secret Scan   │   │
│   └──────────┬───────────┘      └───────────┬────────────┘      └─────────┬────────┘   │
│              │                              │                             │            │
│              └──────────────────────┬───────┴─────────────────────────────┘            │
│                                     ▼                                                  │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │   Phase 3.4 & 3.5: Enterprise Workflow Intelligence & Compliance               │   │
│   │  - DAG Task Dependencies & Cycle Detection  - Interactive Gantt Timeline       │   │
│   │  - Contributor Workload & Velocity Heatmap  - PDF/CSV Compliance Audit Exports │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ 1. Phase 3.1: Realtime Event Engine & Multi-User Collaboration

### Motivation
In modern engineering teams, tasks, PR statuses, and reviews move fast. Requiring users to refresh their browser to observe a colleague's task submission or a manager's verification verdict causes stale data conflicts and friction.

### Technical Architecture
1. **FastAPI WebSocket Connection Manager**:
   - Implement `ConnectionManager` in `backend/app/services/websocket_manager.py` maintaining active user sockets keyed by `workspace_id` and `user_id`.
   - Heartbeat ping/pong telemetry every 30 seconds with automatic client reconnection backoff.
   - Dual-mode broadcasting: Workspace-wide channels (e.g. `workspace:{id}`) and private user channels (e.g. `user:{id}`).
2. **Instant Board Synchronization**:
   - When a task is moved, verified, or updated, broadcast a lightweight event payload:
     ```json
     {
       "type": "TASK_UPDATED",
       "task_id": "task-uuid",
       "new_status": "in_review",
       "updated_by": "Alex Rivera",
       "timestamp": "2026-10-03T14:30:00Z"
     }
     ```
   - Frontend React query cache or state handler updates the card position without re-fetching entire task arrays.
3. **Live Team Chat Enhancements**:
   - Replace poll-based chat fetching with instant WebSocket push.
   - Add real-time typing indicators (`user_typing` event with 3-second debounce).
   - Dynamic unread count badges with audio/visual pulse triggers.
4. **Interactive In-App Notification Toasts**:
   - Push toast alerts for critical lifecycle events:
     - *"Sarah Chen approved your submission for 'Auth Gate' (Score: 98/100)"*
     - *"Alex Rivera raised a blocker on 'Database Migration'"*
     - *"New task assigned to you by Sarah Chen"*

---

## 🔗 2. Phase 3.2: Production GitHub App & Live CI/CD Webhook Ingest

### Motivation
While the sandbox simulator is ideal for reviewers and recruiters, real engineering teams need TaskFlow to ingest real GitHub events as commits are pushed and PRs are merged.

### Technical Architecture
1. **Cryptographically Verified Webhook Endpoint**:
   - Endpoint: `POST /api/v1/integrations/github/webhook`.
   - Validate incoming payloads using HMAC SHA-256 with the secret stored in `GITHUB_WEBHOOK_SECRET` via `X-Hub-Signature-256` header.
2. **Automated Event Handlers**:
   - **`push` Event**:
     - Extracts commit message, author email/username, added/modified/removed files, and unified git diffs.
     - Matches branch name or commit message keywords (`fixes #TASK-102`, `ref/task-102`) to active tasks.
     - Feeds the unified diff into `VerificationEngine.analyze_commit_diff()` in background worker.
   - **`pull_request` Event**:
     - Tracks PR states: `opened`, `synchronize` (new commits pushed), `closed` (with `merged == true`), and `review_requested`.
     - Automatically updates `GitHubTaskLink` and `GitHubPullRequest` records in database.
   - **`pull_request_review` Event**:
     - Ingests reviewer approvals, changes requested, and review comments.
     - Feeds into the `multi_signals` calculation matrix.
   - **`workflow_run` / `check_run` Event**:
     - Ingests GitHub Actions CI build/test results (`conclusion: "success" | "failure"`).
3. **Hybrid Sandbox / Live Repo Mode**:
   - Each workspace can toggle between **Sandbox Simulation Mode** (for demonstrations and manual commit testing) and **Production GitHub Webhook Mode** with linked repository coordinates (`owner/repo`).

---

## 🧠 3. Phase 3.3: Advanced Semantic AI Verification Engine

### Motivation
Heuristics detect code volume, whitespace, and commit message length, but cannot distinguish between authentic business logic and hollow code stubs (e.g. 50 lines of `if True: pass` or mock return objects that pass linters but do zero work).

### Technical Architecture
1. **Multi-Model LLM Adapter**:
   - Service: `backend/app/services/ai_verification_service.py`.
   - Pluggable provider support: Google Gemini API (`gemini-1.5-pro` / `gemini-1.5-flash`), OpenAI (`gpt-4o`), or Anthropic Claude.
   - Graceful fallback: If no API key is configured or the external API is unreachable, automatically fall back to the existing deterministic heuristic engine.
2. **Semantic Verification Criteria**:
   - **Acceptance Criteria Cross-Referencing**:
     - Feed the task's stated requirements and the actual git patch diff into the prompt.
     - Evaluate: Did the PR actually implement what was requested, or only a cosmetic portion?
   - **Stub & Mock Detection**:
     - Analyze diffs for suspicious evasion patterns: empty function bodies, commented-out logic, hardcoded test passes, or placeholder comments (`TODO: implement later`).
   - **Secret & Vulnerability Exposure**:
     - Scans diffs for accidentally committed credentials (`AKIA...`, `Bearer ...`, private keys, plain passwords).
3. **Interactive AI Task Assistant**:
   - Add an AI Assistance drawer in the Task Verification modal.
   - Contributor view: *"How can I improve my verification score before submitting?"*
   - Manager view: *"Summarize the technical risks and key architectural changes in this PR."*

---

## 📊 4. Phase 3.4: Task Dependency Engine, Gantt Timeline & Capacity Heatmap

### Motivation
Engineering projects are networks of interdependent tasks. Without dependency modeling and timeline visualization, teams risk working on blocked items or over-allocating work to specific contributors.

### Technical Architecture
1. **Directed Acyclic Graph (DAG) Task Dependency Engine**:
   - New database model `TaskDependency(blocking_task_id, dependent_task_id, dependency_type)`.
   - Prevent cyclic dependency loops using Tarjan's or topological sort validation on task linking.
   - Auto-flagging: If Task A is blocked by Task B, Task A cannot be moved to `in_progress` until Task B reaches `verified` or `approved`.
2. **Interactive Gantt & Milestone Timeline View**:
   - Add new tab in frontend: **"Timeline & Gantt"**.
   - Draggable sprint timeline with milestone flags, dependency linking arrows, and critical path highlighting.
   - Visual filters: By assignee, department, milestone, or priority.
3. **Contributor Workload & Velocity Heatmap**:
   - Calculate live allocation points: $\sum (\text{Active Story Points} \times \text{Complexity Rating})$.
   - Display capacity indicators on Team Directory and Task Assignment modals:
     - 🟢 *Available (< 3 active tasks)*
     - 🟡 *Optimal Load (3–5 active tasks)*
     - 🔴 *Over-Capacity (> 5 active tasks or high blocker ratio)*

---

## 📑 5. Phase 3.5: Enterprise Audit Reports & Compliance Exporter

### Motivation
Enterprise organizations and clients require objective documentation of completed work for sprint retrospectives, client billing, SOC2 compliance, and performance reviews.

### Technical Architecture
1. **Audit Export Engine (`/api/v1/workspaces/{id}/export`)**:
   - **CSV Export**: Contributor breakdown, verified lines of code, acceptance criteria compliance %, managerial overrides, and final scores.
   - **Executive PDF Verification Dossier**: Clean, branded summary for client sign-off containing:
     - Project metadata and sprint goals.
     - Completed tasks with commit hashes, verified PR links, and manager approval timestamps.
     - Itemized explanation of why deliverables met objective standards.
2. **Granular Role-Based Access Control (RBAC)**:
   - Expand roles beyond binary Manager/Employee:
     - **Organization Owner / Master Admin**: System-wide control via Master Vault.
     - **Workspace Admin**: Can configure GitHub webhooks, heuristic thresholds, and invite members.
     - **Tech Lead / Manager**: Can approve/reject tasks, execute overrides, and assign work.
     - **Contributor / Engineer**: Can submit evidence, simulate commits, raise blockers, and dispute scores.
     - **Observer / Client Viewer**: Read-only access to Kanban, timeline, and audit reports without modification permissions.

---

## 📅 Detailed Phase 3 Execution Roadmap

| Milestone | Key Deliverables | Target Files & Components | Verification Gate |
|---|---|---|---|
| **Phase 3.1** | **Realtime Engine & Live Sync** | `backend/app/services/websocket_manager.py`<br>`frontend/src/services/websocket.js`<br>`frontend/src/components/TaskBoard.jsx` | Instant cross-browser card updates and live chat without reload |
| **Phase 3.2** | **Production GitHub App Webhook Ingest** | `backend/app/api/v1/integrations.py`<br>`backend/app/services/github_service.py`<br>`frontend/src/components/SettingsView.jsx` | HMAC SHA-256 signature verification and automated commit diff ingestion |
| **Phase 3.3** | **Advanced Semantic AI Verification** | `backend/app/services/ai_verification_service.py`<br>`frontend/src/components/VerificationModal.jsx` | LLM semantic comparison against acceptance criteria with stub detection |
| **Phase 3.4** | **Dependencies, Gantt & Capacity** | `backend/app/models/entities.py`<br>`frontend/src/components/TimelineGanttView.jsx`<br>`frontend/src/components/TeamDirectory.jsx` | DAG cycle prevention test suite and interactive sprint timeline |
| **Phase 3.5** | **Audit Exporter & Granular RBAC** | `backend/app/services/export_service.py`<br>`backend/app/api/v1/workspaces.py`<br>`frontend/src/components/SettingsView.jsx` | One-click PDF/CSV sprint verification dossier generation |

---

## 🎯 Verification & Quality Assurance Strategy

1. **Automated Unit & Integration Testing**:
   - WebSocket connection lifecycle, room subscriptions, and reconnection resilience.
   - Webhook signature validation, replay attack prevention, and malformed payload handling.
   - DAG dependency validation: unit tests asserting error on circular dependency creation.
   - LLM fallback tests: verifying deterministic engine operates when external APIs fail.
2. **Security & Camouflage Preservation**:
   - Ensure the Master Vault (`nexus-90210-k7v`) and `106.jedi.master@gmail.com` remain isolated across all new WebSocket channels and workspace exports.
   - No sensitive admin telemetry broadcasted over public workspace sockets.
3. **Performance Targets**:
   - WebSocket event latency: $< 50\text{ms}$ broadcast time within the same workspace.
   - Webhook processing: Complete commit diff ingestion and score computation in $< 1.5\text{s}$.
   - Bundle impact: Maintain frontend production build $< 500\text{KB}$ gzipped.
