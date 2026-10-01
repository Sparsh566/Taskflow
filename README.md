# TaskFlow — Employee Task Management & Work Verification Platform

An enterprise platform that bridges daily employee task management with objective, heuristic-based work verification for technical teams (GitHub commits, diffs, pull requests) and non-technical teams (deliverables, documents, acceptance checklists).

---

## 🚀 Quick Start Guide

### 1. Backend (Python FastAPI)

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows Command Prompt**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
3. Run the FastAPI dev server:
   ```bash
   python run.py
   ```
4. Access the interactive Swagger API documentation at:
   - **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 2. Frontend (React + Tailwind CSS)

1. Open a terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 🔐 Pre-Seeded Demonstration Accounts

You can switch between these personas with **1-click** using the persona switcher in the top-right corner of the web header:

| Email | Role | Department | Default Password | Persona Focus |
|---|---|---|---|---|
| `sarah.chen@taskflow.dev` | **Manager** | Engineering (ENG) | `manager123` | Inspects code changes, diff metrics, runs commit simulations, approves work |
| `marcus.vance@taskflow.dev` | **Manager** | Operations (OPS) | `manager123` | Reviews non-technical documents, PDFs, checklists |
| `alex.dev@taskflow.dev` | **Employee** | Engineering (ENG) | `emp123` | Technical developer with linked GitHub activity & PRs |
| `priya.ai@taskflow.dev` | **Employee** | AI & ML (AIML) | `emp123` | AI engineer with active GPU cluster blocker |
| `elena.growth@taskflow.dev` | **Employee** | Marketing (MKT) | `emp123` | Marketing specialist with uploaded launch deliverables |
| `admin@taskflow.dev` | **Admin** | Central HQ | `admin123` | System-wide configuration and department management |

---

## 🧠 Work Verification Engine Architecture

TaskFlow does not rely on superficial metrics. The verification engine analyzes:
1. **Whitespace & Comment Filtering**: Separates true functional code changes from whitespace manipulation or comment churn.
2. **Commit Squashing & Repetition Heuristics**: Detects repetitive commit messages and trivial reformat commits.
3. **Acceptance Criteria Verification**: Ensures all criteria criteria checklist items are satisfied before enabling manager approval.
4. **Interactive Simulator**: Allows managers and developers to test commit pushes in real-time and observe the live heuristic significance score recalculation.

---

## 📁 Repository Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # REST API routers (auth, tasks, verification, github, analytics, etc.)
│   │   ├── core/           # Config, database engine, security & JWT utilities
│   │   ├── models/         # SQLAlchemy 2.0 relational models & enums
│   │   ├── schemas/        # Pydantic validation & response schemas
│   │   ├── services/       # Verification heuristics engine & notification dispatcher
│   │   ├── main.py         # FastAPI application entrypoint with CORS & lifespan
│   │   └── seed.py         # Realistic seed data loader
│   ├── requirements.txt    # Python dependencies
│   └── run.py              # Backend launcher script
├── frontend/
│   ├── src/
│   │   ├── components/     # Header, Dashboard, TaskBoard, VerificationModal, etc.
│   │   ├── services/       # Frontend API client
│   │   ├── App.jsx         # Root view and state manager
│   │   └── index.css       # Tailwind CSS v4 styling & dark theme tokens
│   ├── package.json
│   └── vite.config.js      # Vite config with proxy to backend
├── docs/
│   └── taskflow_architecture_and_schema.md # Full architecture blueprint and ERD
└── README.md
```
