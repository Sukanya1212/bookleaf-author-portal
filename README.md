# BookLeaf Publishing — Author Support & Communication Portal

An intelligent, AI-assisted support portal designed for BookLeaf Publishing to streamline author communication at scale. Features dual interfaces (an **Author-Facing Dashboard** and an **Operations Admin Portal**) powered by automated ticket classification, priority scoring, grounded draft response generation, and real-time updates.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Architecture & Design Decisions](#-architecture--design-decisions)
3. [Technology Stack](#-technology-stack)
4. [AI Integration Deep-Dive](#-ai-integration-deep-dive)
5. [Local Setup & Running](#-local-setup--running)
6. [Pre-Seeded Test Credentials](#-pre-seeded-test-credentials)
7. [REST API Documentation](#-rest-api-documentation)
8. [Edge Case Handling](#-edge-case-handling)
9. [Limitations & Production Evolution](#-limitations--production-evolution)

---

## 🌟 Key Features

### A. Author Portal (Author-Facing)
* **Authentication**: Simple email/password login. Authors can only access their own published books and tickets.
* **My Books Dashboard**: Complete catalog view with title, ISBN, genre, status, MRP, copies sold, total royalty earned, royalty paid, and royalty pending.
* **Smart Royalty Indicators**: Automatic threshold warnings when accumulated royalties meet or exceed the ₹1,000 disbursement threshold.
* **Submit Support Query**: Form with book selector dropdown (or "General / Account Level"), subject, detailed description, and file attachment preview UI.
* **My Tickets & Real-Time Sync**: Threaded conversation history with BookLeaf staff. Integrates **Server-Sent Events (SSE)** so admin responses appear live without refreshing the page.

### B. Admin Portal (Operations-Facing)
* **Ticket Queue Dashboard**: Real-time queue of incoming queries across all authors, filterable by status, category, priority, and date.
* **Urgency & Stale Flagging**: Highlights critical tickets and queries unresolved for more than 48 hours.
* **AI-Powered Auto-Classification**: Automatically categorizes tickets into one of 6 official BookLeaf categories. Admin can override classification with one click.
* **AI-Generated Priority Scoring**: Assigns `Critical`, `High`, `Medium`, or `Low` based on author sentiment, overdue days, and monetary amounts. Admin can override priority.
* **Context-Grounded AI Draft Responses**: Injects specific BookLeaf Knowledge Base policies (80/20 profit split, 45-day cycle, reprint policy) and author's actual book metrics directly into an AI draft. Admins can review, customize in the editor, and send with one click.
* **Ticket Management & Internal Notes**: Admin assignment, status transitions, and internal ops team notes hidden from the author.

---

## 🏗 Architecture & Design Decisions

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│               React 18 + Vite + TailwindCSS                 │
│   (Author Dashboard, Ticket Thread, Ops Triage Queue)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JWT & Server-Sent Events
┌──────────────────────────────▼──────────────────────────────┐
│                    Express REST API Layer                   │
│   ┌────────────────────┬────────────────────────────────┐   │
│   │  Auth & RBAC       │  Author & Admin Controllers    │   │
│   │  Middleware (JWT)  │  (Books, Tickets, Notes)       │   │
│   └────────────────────┴────────────────────────────────┘   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     AI Engine Services      ││      Data Persistence        │
│ • Classifier (JSON schema)  ││ • Prisma ORM                 │
│ • Grounded Draft Responder  ││ • SQLite (Local Zero-Config) │
│ • BookLeaf Knowledge Base   ││   / PostgreSQL (Prod Ready)  │
│ • Heuristic Fallback Engine ││ • 10 Authors, 18 Books Seed  │
└─────────────────────────────┘└──────────────────────────────┘
```

### Why React (Vite) + Node.js (Express)?
* **Separation of Concerns**: Clear boundary between backend API services and frontend presentation components.
* **Interview Explainability**: Clean, standard MVC pattern (`routes/`, `controllers/`, `middleware/`, `services/`) with no hidden framework abstractions, making technical defense straightforward.
* **Lightweight Real-Time with SSE**: Rather than introducing heavy WebSocket servers or third-party paid socket services, we utilize standard HTTP Server-Sent Events (`text/event-stream`), providing zero-refresh updates with minimal complexity.

---

## 🤖 AI Integration Deep-Dive

### 1. Grounded Prompt Strategy
Rather than using generic LLM prompts that produce robotic corporate fluff, our AI draft responder is grounded in the **BookLeaf Knowledge Base**:
* **Royalty Queries**: Dynamically fetches the author's actual `copies_sold`, `royalty_pending`, and `last_royalty_payout_date`. Explains the net profit calculation and the 80/20 split transparently.
* **Print Defects**: Empathetically acknowledges the issue, requests 2–3 photos, and commits to BookLeaf's free reprint turnaround (5–7 business days).
* **Retail Availability**: Explains distributor synchronization latency on Amazon/Flipkart and confirms triggering a manual re-sync within 24–48 hours.
* **ISBN Discrepancies**: Flags as High/Critical and provides an immediate 48-hour resolution timeline.

### 2. Error Handling & Graceful Degradation
* **API Key Absence / Rate Limits / Outages**: The ticket creation pipeline **never crashes or blocks the author**.
* If the LLM call times out or throws an error, the system automatically falls back to an internal **Rule-Based Semantic Classifier** and **Policy-Accurate Deterministic Draft Generator**.
* Admins are informed via UI badges if an AI draft was heuristically generated.

### 3. Cost & Token Consciousness
* Prompts are split into targeted knowledge slices rather than dumping the entire operations manual on every request.
* Classification uses a constrained JSON schema response with a strict `max_tokens: 150` limit.
* Responses are calibrated at `temperature: 0.2-0.3` to prevent token drift and hallucination.

---

## 🚀 Local Setup & Running

### Prerequisites
* Node.js v18+ (tested on Node v20)
* npm v10+

### Step 1: Install Dependencies
Open terminal in root:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Database Setup & Seeding
From the `server` directory:
```bash
cd server
# Synchronize Prisma schema with local SQLite database
npx prisma db push

# Seed 10 authors, 18 books, sample tickets, and Admin account
npm run seed
```

### Step 3: Run the Application
In terminal 1 (Backend API):
```bash
cd server
npm run dev
# Backend runs at http://localhost:5000
```

In terminal 2 (Frontend Client):
```bash
cd client
npm run dev
# Frontend runs at http://localhost:5173
```

Navigate to **`http://localhost:5173`** in your browser.

---

## 🔑 Pre-Seeded Test Credentials

For quick evaluation, the login screen includes a **"1-Click Evaluator Sign-In"** panel. You can also sign in manually using any of the following accounts:

| Role | Email | Password | Persona / Edge Case Tested |
| :--- | :--- | :--- | :--- |
| **Ops Admin** | `admin@bookleafpub.com` | `Admin@123` | BookLeaf Operations team triage queue |
| **Author** | `rohit.kapoor@email.com` | `Author@123` | High pending royalties (₹7,744) & active ticket |
| **Author** | `sneha.kulkarni@email.com` | `Author@123` | Book in production (*Midnight in Mysore*) |
| **Author** | `priya.sharma@email.com` | `Author@123` | Multiple published titles & resolved query |
| **Author** | `ananya.reddy@email.com` | `Author@123` | Newly published author with ₹0 paid |

---

## 📡 REST API Documentation

### Authentication Endpoints
* `POST /api/auth/login` — Authenticate author or admin. Returns JWT token.
* `GET /api/auth/me` — Retrieve current authenticated session profile.
* `GET /api/auth/demo-users` — Retrieve demo account list for quick evaluator login.

### Author Endpoints (`Role: AUTHOR`)
* `GET /api/author/books` — Fetch author's published & in-production books with calculated sales/royalty summaries.
* `GET /api/author/tickets` — List all support queries submitted by author.
* `POST /api/author/tickets` — Submit support ticket (triggers async AI classification & draft generation).
* `GET /api/author/tickets/:id` — Retrieve ticket thread with messages.
* `POST /api/author/tickets/:id/messages` — Author posts follow-up message to thread.

### Admin Endpoints (`Role: ADMIN`)
* `GET /api/admin/tickets` — Query triage list with multi-filters (`status`, `category`, `priority`, `search`, `sortBy`).
* `GET /api/admin/tickets/:id` — Retrieve full triage context: author info, book metrics, AI draft, messages, and internal notes.
* `PATCH /api/admin/tickets/:id` — Update ticket status, override AI category/priority, or reassign admin.
* `POST /api/admin/tickets/:id/messages` — Send official admin response to author (triggers SSE broadcast).
* `POST /api/admin/tickets/:id/notes` — Add internal operations note (hidden from author).
* `POST /api/admin/tickets/:id/regenerate-draft` — Re-trigger AI draft response generation.

### Real-Time Endpoints (Server-Sent Events)
* `GET /api/sse/tickets/:id` — Stream real-time message and status updates for a specific ticket.
* `GET /api/sse/admin` — Stream real-time notifications for incoming tickets to the admin queue.

---

## 🛡 Edge Case Handling

1. **Books in Production**: Titles like Sneha Kulkarni's *Midnight in Mysore* (`In Production - Cover Design`) gracefully display production milestone badges rather than invalid royalty numbers.
2. **Royalties Below Threshold**: If pending royalties are under ₹1,000, dashboard informs the author that funds roll over to the subsequent quarter.
3. **Royalties Above Threshold**: If pending royalties exceed ₹1,000, dashboard highlights that the threshold has been satisfied and disbursement is queued.
4. **AI Service Disruption**: The ticket flow never fails if an LLM API key is omitted or quota is exhausted; the system falls back to heuristic classification seamlessly.

---

## 🔮 Limitations & Production Evolution

* **Attachment Storage**: In this implementation, file attachments are simulated via metadata UI preview. For enterprise production, integrate AWS S3 or Cloudinary with presigned URLs.
* **Vector Search / RAG**: The current knowledge base is injected using modular semantic slices. As BookLeaf's policy documentation grows to hundreds of pages, integrate a vector database (e.g., pgvector / Pinecone) with chunk embeddings.
* **Notification Channels**: Extend real-time SSE to include email alerts (via SendGrid/Postmark) and WhatsApp notifications for authors.
