# Flow Weaver: Enterprise AI Workflow Architect

> A state-of-the-art, multi-tenant SaaS platform for orchestrating complex business processes using AI-powered generation, real-time rule evaluation, and human-in-the-loop approvals.

![Project Status](https://img.shields.io/badge/Status-Live-success)
![Tech Stack](https://img.shields.io/badge/Stack-Vite%20%7C%20Supabase%20%7C%20Redis%20%7C%20Groq-blue)

---

## 🌟 Core Innovation: AI-Powered Orchestration

Flow Weaver isn't just a builder; it's an **Architect**.
- **AI Workflow Architect**: Integration with **Groq API** (`llama-3.3-70b-versatile`) allows users to describe a process in natural language and generate a fully-mapped execution graph (nodes and edges) in seconds.
- **Visual Builder**: Powered by **Xyflow (React Flow)**, offering a professional-grade canvas for drag-and-drop workflow management with custom node types for Tasks, Approvals, and Notifications.
- **Dynamic Typewriter UI**: A premium landing experience with real-time "writing" animations and high-impact typography using **Outfit** and **Caveat** fonts.

---

## 🛠️ Technical Deep Dive & Integrations

### 1. High-Performance Caching (Redis)
- **Engine**: **Upstash Redis** (Serverless)
- **Purpose**: Implements a robust caching layer to store session data, execution states, and frequently accessed company configurations. This ensures minimal latency and drastically reduces the load on the primary PostgreSQL database.

### 2. AI Intelligence (Groq Cloud)
- **Inference Engine**: **Llama 3.3 70B Versatile**
- **Orchestration**: A specialized backend service (Python/Flask) that parses natural language requirements into structured JSON schemas. It handles complex logic derivation, edge routing, and automated step naming.

### 3. Multi-Tenant SaaS Architecture
- **Data Isolation**: Uses **PostgreSQL Row-Level Security (RLS)** in Supabase to ensure that every company's data is cryptographically and logically isolated.
- **RBAC (Role-Based Access Control)**: 
    - `platform_admin`: Global system health and company management.
    - `company_admin`: Organization-wide settings, billing, and rosters.
    - `manager`: Workflow approvals and team performance monitoring.
    - `employee`: Execution of assigned tasks and personal history tracking.
- **State Stability**: Centralized Context API architecture (`AuthProvider`, `RoleProvider`, `CompanyProvider`) eliminates UI flickering and ensures a single source of truth for all critical session data.

### 4. Enterprise-Grade Workflow Engine
- **Rule Engine**: A custom-built, priority-based evaluation engine running as a PostgreSQL RPC. Supports complex logical operators (`&&`, `||`), string functions, and `DEFAULT` fallbacks.
- **Execution Guard**: Built-in protection against infinite loops (max 50 iterations) and real-time execution logging for every step, including input/output snapshots.

### 5. Premium Subscription Logic
- **Tier Management**: Real-time tracking of `free` vs `pro` subscription statuses.
- **Upsell Engine**: An intelligent diagnostic system that triggers a premium promotion modal for non-pro users on every login/reload, effectively driving conversion for high-value features.

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Core Application Framework |
| **Styling** | Tailwind CSS, Framer Motion | Luxury UI & Micro-animations |
| **Canvas** | @xyflow/react | Visual Workflow Engine |
| **Database** | Supabase (Postgres) | Persistence & RLS Security |
| **Caching** | Upstash Redis | Global Performance Optimization |
| **AI** | Groq (Llama 3.3) | NLP to Graph Generation |
| **Notifications** | Node.js + Nodemailer | Enterprise Email delivery (SMTP) |
| **Execution** | FastAPI Bridge | Sandbox for custom Python logic |

---

## ⚙️ Environment Configuration

To run the full stack, configure your `.env` file with these keys:

```env
# Database & Auth
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Performance & AI
VITE_UPSTASH_REDIS_REST_URL=your_redis_url
VITE_UPSTASH_REDIS_REST_TOKEN=your_token
VITE_GROQ_API_KEY=your_groq_key

# Notifications (Gmail App Password)
GMAIL_USER=your_email
GMAIL_PASSWORD=your_app_password
```

---

## 📁 Project Structure

```bash
flow-weaver-ui/
├── src/
│   ├── providers/          # Global Context (Auth, Role, Company)
│   ├── components/
│   │   ├── workflow/       # Node.js types & SVG Logic
│   │   └── UpsellPopup.tsx # Premium Conversion Logic
│   ├── pages/
│   │   ├── Landing.tsx     # Typography & Typewriter Hero
│   │   └── WorkflowEditor.tsx # Graph Engine & AI Integration
├── server.js               # Notification Microservice
├── executor.py             # Sandbox Execution Engine
└── supabase_schema.sql     # Database, RLS, & Workflows
```

---

## ✅ Core Features Summary
- [x] **AI Architect**: 1-click workflow generation from text.
- [x] **Zero-Flicker**: Ultra-stable UI with global state management.
- [x] **Human-in-the-Loop**: Interactive approvals for business logic.
- [x] **Email Notifications**: Real SMTP alerts on step completion.
- [x] **Pro Subscription**: Tiered access and upsell mechanics.
- [x] **Audit Logs**: Full transparency for every automated step.
