# TaskFlow — Phase 2 & Architecture Evolution Plan

## 📌 Executive Summary & Optimal Sequencing

This plan outlines the next phase of TaskFlow's evolution, incorporating:
1. **Retractable Side Menu (UI Real-Estate)**
2. **Dedicated Modern Login Page with Demo Sandbox Launcher**
3. **Private & High-Security Admin Portal (Private credentials for owner only)**
4. **Supabase Cloud PostgreSQL Migration & Storage**
5. **Next-Gen Verification Engine (Multi-signal AI verification with human override)**

---

## 🏗️ 1. Retractable Side Menu (UI Polish)
*Placement: Phase 2.1 (Immediate)*

### Motivation
Task verification requires inspecting dense information: diffs, heuristic score gauges, acceptance checklists, and commit logs. A fixed 256px sidebar occupies substantial screen space on laptops and tablets.

### Implementation Architecture
1. **Collapsible Sidebar Rail**:
   - Support two states: `expanded` (w-64) and `collapsed` (w-20 icon-only rail).
   - Collapse toggle button with smooth CSS transform (`transition-all duration-300 ease-in-out`).
   - Store collapsed state in `localStorage` so user preference persists across page reloads.
2. **Tooltip Hover in Collapsed Mode**:
   - Display floating tooltips on icon hover when collapsed so navigation remains intuitive.
3. **Responsive Mobile Drawer**:
   - Slide-over backdrop overlay on screens $< 1024\text{px}$.

---

## 🔐 2. Dedicated Login Page & Secure Auth Flow
*Placement: Phase 2.2*

### Motivation
Currently, the application defaults to logging in as Sarah Chen on reload. A professional application requires an explicit, stunning authentication gate that separates genuine user credentials from demo sandbox visitors.

### Architecture & Components
1. **Modern Dual-Mode Authentication Screen**:
   - **Form 1: Secure Direct Login**: Email and password input for registered members and the Admin.
   - **Form 2: 1-Click Sandbox Fast-Track**: "Explore Demo Sandbox as Manager (Sarah) or Employee (Alex)" button for recruiters/reviewers to instantly preview without needing to register or copy credentials.
2. **Session & Token Management**:
   - Save JWT access token to `localStorage` with automated token refresh / expiry check.
   - Add explicit **Logout** action in the sidebar that clears session state and redirects to `/login`.
   - Protected route wrapper: unauthenticated users are directed to the Login page.

---

## 🛡️ 3. Private, Hardened Admin Portal (Owner Only)
*Placement: Phase 2.3*

### Security Architecture & Isolation
- **Credentials Kept Private**: The Admin credentials will **NEVER** be displayed in the README, public demo buttons, or client-side bundles. Only you possess the master login.
- **Removed from Public Persona Switcher**: The public 1-click persona bar will only switch between sandbox Manager and Employee. Admin access requires direct login with master credentials.
- **Backend Guard Rails**:
  - Protected API routes under `/api/v1/admin/*` guarded by `require_admin` dependency verifying `user.role == UserRole.ADMIN` and a cryptographically signed JWT.
  - Rate limiting on admin login attempts to prevent brute-force attacks.
  - Master Admin account seeded via secure environment variables (`INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`).

### Admin Console Capabilities
1. **User & Access Management**:
   - View, create, activate, and deactivate team member accounts.
   - Promote/demote user roles (Manager, Employee).
   - Password reset triggers for members.
2. **Workspace & Integration Controls**:
   - Manage company-wide project workspaces and link GitHub repositories.
   - Configure global verification heuristic thresholds.
3. **Security & Audit Logs**:
   - Full chronological audit log of all managerial score overrides, task rejections, and login events.
4. **Sandbox & System Controls**:
   - Master button to reset or re-seed sandbox data without restarting the server.
   - Supabase database connection health, latency, and pool monitoring.

---

## 🗄️ 4. Supabase Cloud Migration (PostgreSQL & Storage)
*Placement: Phase 2.4*

### Comparative Tradeoff Matrix

| Feature | Firebase (Firestore) | Supabase (PostgreSQL) | Recommendation |
|---|---|---|---|
| **Data Model Compatibility** | ❌ NoSQL Document Store. Would require completely replacing SQLAlchemy models, foreign keys, and relational queries. | ✅ Native PostgreSQL. 100% drop-in compatible with TaskFlow's existing SQLAlchemy 2.0 schema and migrations. | **Supabase is drastically superior.** |
| **Connection & Deployment** | ⚠️ Requires Firebase Admin SDK and client-side SDK rewrite. | ✅ Direct standard `DATABASE_URL` (`postgresql://postgres:[password]@db...supabase.co:5432/postgres`). | **Supabase** |
| **Evidence File Storage** | Firebase Cloud Storage (GCP bucket). | Supabase Storage (S3-compatible, built-in bucket policies). | **Supabase** |
| **Realtime Updates (Phase 3)** | Realtime Database / Firestore listeners. | Postgres Realtime (listen to task status and verification changes). | **Supabase** |
| **Cost & Free Tier** | Pay-as-you-go with document read limits. | Generous free tier with 500MB database, pooling, and automated backups. | **Supabase** |

### Implementation Steps
1. Add `psycopg2-binary>=2.9.9` to `backend/requirements.txt`.
2. Connect backend to Supabase project via `DATABASE_URL` with connection pooling enabled (port 6543 / 5432).
3. Verify automatic table migration on startup in `lifespan`.
4. Configure Supabase Storage bucket for deliverable documents (PDFs, checklists).

---

## 🧠 5. Core Verification Enhancements

### 5.1 Multi-Signal Verification (Beyond Diff Size)
- **CI Build & Test Status**: Pass/Fail telemetry from GitHub Actions / CI webhooks.
- **Pull Request Review Approvals**: Checks whether required peer reviews were approved prior to submission.
- **PR Merge Verification**: Validates whether changes were squashed/merged into target branch.

### 5.2 AI-Assisted PR Summary vs. Task Description
- Integrate LLM analysis to compare the PR diff summary against the task's stated acceptance criteria.
- Present this as an **advisory suggestion** for the manager rather than a final verdict.

### 5.3 Manager Override with Feedback Comments
- Managers can override automated heuristic scores with stored feedback notes.
- Logs overrides in `VerificationReview` audit table to provide transparency and accountability.

### 5.4 Employee Dispute Mechanism
- Provide a *"Dispute Score"* button on task view for employees.
- Submits structured rebuttal with attached clarification, flagging the task for managerial review.

---

## 📅 Execution Roadmap

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [x] Phase 2.1: UI Real-Estate & Retractable Sidebar                     │
│  - Collapsible/expandable sidebar with icon-only rail (w-64 vs w-20)    │
│  - Tooltips for collapsed state & localStorage preference persistence   │
├─────────────────────────────────────────────────────────────────────────┤
│ [x] Phase 2.2: Dedicated Login Page & Session Gate                      │
│  - Modern login view with credentials form & 1-click sandbox access     │
│  - Token storage, route protection, and explicit logout mechanics       │
├─────────────────────────────────────────────────────────────────────────┤
│ [x] Phase 2.3: Private & Secured Admin Portal                           │
│  - Removed Admin from public persona switcher (private credentials)     │
│  - Backend /api/v1/admin router with strict require_admin role check    │
│  - Admin Console: user directory, role/status updates, audit logs       │
├─────────────────────────────────────────────────────────────────────────┤
│ [x] Phase 2.4: Supabase Cloud PostgreSQL & Storage Integration          │
│  - Added psycopg2-binary driver and cloud connection pooling configs    │
│  - StorageService for Supabase Storage bucket with local fallback       │
├─────────────────────────────────────────────────────────────────────────┤
│ [x] Phase 2.5: Multi-Signal Verification & Human-in-the-Loop Overrides  │
│  - CI test suite telemetry, PR reviews & merge verification signals     │
│  - Manager score override with required reason notes                    │
│  - Employee dispute mechanism with structured rebuttal workflow         │
│  - AI-assisted deliverable advisory comparison                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*Status: Phase 2 fully implemented, verified, and tested across backend (24 unit tests passing) and frontend production bundle (Vite build successful).*
