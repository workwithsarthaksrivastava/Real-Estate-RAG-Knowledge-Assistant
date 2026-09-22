# Real Estate Grounded RAG Knowledge Assistant

A production-grade, traceable **Retrieval-Augmented Generation (RAG)** assistant designed specifically for real estate portfolios, property brochures, pricing sheets, floor plan specifications, and construction schedule updates.

It guarantees zero ungrounded hallucinations through strict boundary constraints, dense semantic embeddings + sparse BM25 hybrid search, structure-aware chunking, cross-document conflict detection, and traceable citations down to the exact source document, section, and page number.

---

## 🏗️ Architecture & Pipeline Overview

```
[ User Query ]
      │
      ▼
[ Context & Scope Resolver ] ─── Active property filter & follow-up memory
      │
      ▼
[ Hybrid Retrieval Engine ]
   ├── Dense Vector Similarity (768-dim embeddings / Cosine Distance)
   └── Sparse BM25 Keyword Search (Term Frequency / Inverse Document Frequency)
      │
      ▼
[ Real Estate Reranker & Heuristics ]
   ├── Exact Configuration Boost ("3 BHK", "2 BHK")
   ├── Phase & Tower Specificity Boost ("Phase 2", "Tower D")
   ├── Intent Classification (Pricing, Possession, Legal RERA)
   └── Document Recency / Versioning Prioritization
      │
      ▼
[ Conflict & Discrepancy Detector ]
   └── Scans retrieved chunks for conflicting possession dates or pricing across versions
      │
      ▼
[ Anti-Hallucination Guardrails ]
   ├── Out-of-scope General Knowledge Detector -> Refuses without making up facts
   ├── Low-Confidence Threshold Filter (< 0.28 score) -> Refuses with helpful message
   └── System Prompt Grounding Enforcement (Zero-temperature / Deterministic fallback)
      │
      ▼
[ Structured Grounded Response + Source Provenance ]
   ├── Grounded Answer
   ├── Traceable Source Citations (Document, Page, Section, Excerpt)
   ├── Conflict Warnings (if applicable)
   └── Observability Metrics (Retrieval Latency, Token Estimates)
```

---

## 🔑 Key Features

### 1. Structure-Aware Document Chunking
Standard sliding windows often split apartment unit configurations or pricing tables in half, causing context corruption. The **Structure-Aware Chunker**:
- Preserves markdown headers (`#`, `##`, `###`), page boundaries (`[Page X]`), and bullet lists.
- Keeps Markdown/CSV pricing and specification tables intact within a single chunk.
- Attaches rich metadata (`document_id`, `document_name`, `property_name`, `page_number`, `section`, `token_estimate`) to each vector.

### 2. Hybrid Search (Dense + Sparse BM25)
- **Dense Vector Search**: Captures semantic synonyms (e.g., matching *"swimming pool"* to *"Olympic-length 50-meter lap pool"* or *"gym"* to *"TechnoGym fitness suite"*).
- **Sparse BM25 Search**: Matches exact technical identifiers (e.g., RERA numbers like `PRM/KA/RERA/1251/310/PR/210420/004128`, unit names like `2 BHK Classic`).

### 3. Real Estate Domain Reranker
Re-scores candidate chunks with real estate heuristics:
- **Exact Configuration Matching**: Queries mentioning "3 BHK" boost chunks containing "3 BHK" specifications.
- **Phase/Tower Matching**: Queries regarding "Phase 2" prioritize Phase 2 updates over Phase 1 brochures.
- **Pricing & Payment Intent**: Prioritizes official cost sheets when pricing terms (₹, crore, lakh, installment) are queried.

### 4. Cross-Document Conflict Detection
When developers release updated construction schedules or revised cost sheets:
- The engine identifies differing values for the same property attribute (e.g. *January 2026 Brochure: Possession December 2026* vs. *June 2026 Update: Possession March 2027*).
- Formats explicit warnings for potential buyers and agents rather than silently outputting an arbitrary version.

### 5. Hallucination Safeguards & Refusal Logic
- If a user asks for unmentioned amenities (e.g., *"Does Green Valley have a helicopter pad?"*), the assistant explicitly states the amenity is not listed in verified documentation.
- If a user asks out-of-scope general trivia (e.g., *"Who is the richest real estate developer in India?"*), the assistant refuses to hallucinate facts outside the knowledge base.

---

## 📊 Pre-Loaded Seed Documents

1. **Green Valley Residency — Master Brochure (Jan 2026)**: 14.5-acre parcel, 6 towers, Olympic pool, Club Verdant, Phase 1 & 2 timelines, RERA number.
2. **Green Valley Phase 2 — Project Progress & Schedule Update (June 2026)**: Revised possession timeline from Dec 2026 to March 2027 due to metro corridor utility re-routing.
3. **Green Valley Residency — Official Cost Sheet & Payment Plan (Q1 2026)**: 2 BHK Classic (₹95 lakh, 920 sq ft carpet), 3 BHK Premium (₹1.45 crore, 1,420 sq ft carpet), CLP milestone schedule.
4. **Green Valley Residency — Resident & Buyer FAQs**: Bank approvals (SBI, HDFC, ICICI), pet policies, power backup wattage.
5. **Skyline Heights — Master Brochure & Specifications (March 2026)**: Hyderabad Financial District, G+32 floors, 2 BHK (₹1.10 crore), Sky Observatory, Sept 2027 delivery.
6. **Azure Bay Luxury Residences — Coastal Living Brochure**: ECR Chennai, 3 BHK beachfront duplex (₹3.20 crore), 4 BHK villa (₹5.50 crore), private marina.

---

## 🧪 Automated RAG Evaluation Benchmark

The system includes a built-in automated test suite covering 10 benchmark test cases:
1. **Exact Factual Carpet Area**: "What is the carpet area of the 3 BHK in Green Valley Residency?" (Expects `1,420 sq ft`).
2. **Starting Price Verification**: "What is the starting price of the 2 BHK in Green Valley Residency?" (Expects `₹95 lakh`).
3. **Paraphrased Query**: "How far away is the airport from Green Valley?" (Expects `28 km`).
4. **Amenity Verification**: "Does Green Valley Residency have a swimming pool?" (Expects `50-meter Olympic`).
5. **Conflicting Version Detection**: "When is Phase 2 possession for Green Valley Residency?" (Detects both `Dec 2026` and `March 2027` with update notice).
6. **Multi-Property Comparison**: "Compare 2 BHK configurations between Green Valley and Skyline Heights" (Synthesizes facts across 2 projects).
7. **Typo Handling**: "Wht is the RERA registrtion numbr for Skyline Heights?" (Retrieves exact RERA code).
8. **Missing Info Refusal**: "Does Green Valley Residency have a private helicopter landing pad?" (Safeguard refusal).
9. **Out-of-Scope General Knowledge Refusal**: "Who is the richest real estate developer in India?" (Strict boundary refusal).
10. **Payment Plan Milestones**: "What is the payment plan for Phase 2 in Green Valley?" (Verifies 10% booking and CLP milestones).

---

## 🛠️ API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | `POST` | Processes user query via Hybrid RAG, returns answer, confidence, citations, and metrics |
| `/api/documents` | `GET` | Lists all indexed documents in the knowledge base |
| `/api/documents/upload` | `POST` | Ingests and indexes PDF, TXT, MD, CSV, or JSON documents |
| `/api/documents/:id` | `GET` | Fetches document metadata |
| `/api/documents/:id/chunks` | `GET` | Retrieves all structured chunks for a document |
| `/api/documents/:id/reindex` | `POST` | Re-chunks and re-embeds an existing document |
| `/api/documents/:id` | `DELETE` | Removes document and all its chunks from the vector index |
| `/api/evaluation/run` | `POST` | Runs the automated 10-case grounding benchmark suite |
| `/api/feedback` | `POST` | Records user satisfaction feedback on grounded answers |
| `/api/stats` | `GET` | Returns total documents, chunks, properties, and embedding status |
