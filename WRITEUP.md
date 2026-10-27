# Approach & System Evolution Write-Up
**Position**: Full-Stack Developer  
**Assignment**: BookLeaf Author Support & Communication Portal

---

### 1. Approach & Strategic Prioritisation

When designing this system for BookLeaf Publishing, our primary focus was addressing the core operational challenge: **enabling a lean operations team to handle thousands of author queries faster, more consistently, and without sacrificing empathy.**

To achieve this, we prioritised:
1. **Contextual Grounding over Generic AI**: Generic AI support responses often alienate authors with vague, corporate reassurances. We engineered our AI pipeline to inject the author's live book data (copies sold, unpaid royalties, production stages) and BookLeaf's actual business rules (80/20 royalty split, 45-day quarterly cycles, free reprint policies). This ensures every draft response sounds like an experienced BookLeaf support specialist who already did the research before replying.
2. **Operational Ergonomics for Triage**: An ops team processing 1,200+ titles monthly needs high signal-to-noise ratio. We implemented automated priority scoring (`Critical`, `High`, `Medium`, `Low`), automated category tagging, and visual indicators for stale tickets (>48h unresolved). Admins can insert the AI draft into their response editor with a single click, tweak any wording, and send it immediately.
3. **Graceful Degradation & Resilience**: Production systems cannot afford 500 errors during peak volume periods or third-party AI outages. The ticket ingestion pipeline is strictly decoupled from LLM availability—if an API key is missing or rate-limited, an intelligent rule-based semantic engine assigns category and priority without blocking the author.

---

### 2. Key Trade-offs Made

* **Server-Sent Events (SSE) vs. Full WebSockets**:  
  * *Trade-off*: We selected SSE rather than duplex WebSockets or third-party paid services (like Pusher).  
  * *Rationale*: Support tickets operate predominantly on server-to-client push events (admin replies to author, or author opens a new ticket). SSE runs natively over HTTP, respects proxy firewalls, eliminates connection handshake overhead, and is significantly simpler to maintain and deploy.
* **SQLite with Prisma vs. Distributed PostgreSQL Cluster**:  
  * *Trade-off*: We configured Prisma with SQLite for the local demonstration environment, while structuring the schema for instant PostgreSQL compatibility.  
  * *Rationale*: This guarantees zero-dependency evaluation for the reviewing team—no Docker containers or database connection setups required. Swapping to hosted PostgreSQL in production requires changing a single environment variable (`DATABASE_URL`).
* **Modular Knowledge Base Slices vs. Vector RAG**:  
  * *Trade-off*: Rather than setting up an embedding pipeline (vector embeddings + vector store), we partitioned BookLeaf's knowledge base into semantic category slices injected conditionally.  
  * *Rationale*: For a defined set of 6 core operational categories, semantic slicing delivers near-zero latency, zero embedding cost, and deterministic policy accuracy without embedding drift.

---

### 3. Evolving into an Enterprise Production System (22,000+ Titles)

If deployed to serve BookLeaf's full catalog of 22,000+ titles and thousands of active authors, we would evolve the architecture as follows:

1. **Background Job Queues (BullMQ / Redis)**:  
   Offload AI classification, draft generation, and distribution sync webhooks to an asynchronous background worker queue. This guarantees ticket submission response times under 50ms regardless of LLM generation latency.
2. **Hybrid RAG Pipeline with pgvector**:  
   As operational documentation, printer vendor contracts (Repro India, Epitome), and international tax policies grow, transition from category slices to a hybrid BM25 + Vector search system with semantic chunking.
3. **Multi-Channel Author Communication**:  
   Authors frequently prefer mobile channels. We would integrate WhatsApp Business API (via Twilio/Gupshup) and transactional email hooks (SendGrid), allowing authors to view and reply to tickets directly from their phones, with replies synchronizing back to the admin dashboard in real time.
4. **Automated Defect Image Inspection**:  
   Utilize computer vision models (e.g., Gemini Vision) on author-uploaded photos of print defects to automatically pre-screen misprints, binding issues, and color misalignment before escalating to the production manager.
