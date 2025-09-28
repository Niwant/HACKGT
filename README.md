# CuraRX - Care made clear!

A full-stack healthcare management platform with role-based access for physicians and patients. Built with Next.js frontend and a Node.js + MySQL backend that integrates public health datasets (CMS, Synthea, RxNorm, DailyMed, Orange Book). Physicians get context‑aware insights (coverage, costs, research), while patients get plain‑language guidance, adherence tools, and price transparency.

---

## ✨ Highlights

* **Right info, right provider, right time**: surfacing formulary tiering, PA/ST/QL, and cost signals alongside the patient’s EMR.
* **Evidence & safety**: auto‑ingest FDA DailyMed PDFs → extract SPL → clinical flags + HCP summary via LLM (strict JSON).
* **Cost transparency**: estimate out‑of‑pocket by plan/coverage level, retail vs mail, preferred/non‑preferred.
* **Datasets integrated**: CMS (formulary, costs), Synthea (EMR), RxNorm (drug IDs), DailyMed (labels), Orange Book (TE codes).

---

## 🧱 Monorepo Structure

```
frontend/                  # Next.js 15 (App Router, TS, Tailwind, shadcn/ui, Clerk)
backend/                   # Express API (mysql2/promise, axios, pdf-parse, OpenAI)
```

---

## Frontend – Next.js 15

### Features

* **Physicians**: patient lists, EMR timeline, prescription flow with safety checks, FDA/clinical feed, notifications, AI summaries.
* **Patients**: medication manager, recovery timeline, daily checklist, cost & coverage view, appointment tracking.

### Tech

* Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · Clerk · React Context · lucide-react · date-fns

### Getting Started

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

Open [http://localhost:3000](http://localhost:3000)

Project layout mirrors the standard **app/** router, **components/**, **contexts/**, **types/**, **lib/**.

---

## Backend – Node.js (Express)

### Overview

* Language/Libs: Node 18+, Express, `mysql2/promise`, `axios`, `pdf-parse`.
* External APIs: **DailyMed** (SPL PDFs), **RxNav** (RxNorm), **OpenAI** (LLM JSON generation).
* Database: **AWS RDS MySQL 8.x**. DB name: **`pharmacy`**.

### Key Files

* `backend/src/server.js` – Express app, endpoints, health, graceful shutdown.
* `backend/src/utils.js` – PDF parsing, DB snapshot builder, LLM prompts and callers.
* `backend/src/config/database.js` – (not shown) pooled connection helpers: `testConnection`, `initializeDatabase`, `executeQuery`.

### Env Vars (`backend/.env`)

```env
PORT=5001
DB_HOST=<rds-endpoint>
DB_PORT=3306
DB_USER=rxuser
DB_PASSWORD=********
DB_NAME=pharmacy
DB_SSL=true

# OpenAI
OPENAI_API_KEY=sk-****************
OPENAI_BASE=https://api.openai.com/v1
OPENAI_FETCH_MODEL=gpt-4o-mini          # for extraction
OPENAI_REASONING_MODEL=gpt-4o-mini      # for comparative report (can be a reasoning model)
```

### Run

```bash
cd backend
npm install
npm run dev
# API root
# -> http://localhost:5001/
```

---

## Data Sources

* **CMS (Centers for Medicare & Medicaid Services)** — formulary, plan, beneficiary cost files (tiers, PA/ST/QL, coverage levels).  Source: data.cms.gov.
* **Synthea** — synthetic EMR: patients, allergies, medications, observations.  Source: synthetichealth.github.io/synthea.
* **RxNorm (RxNav)** — canonical drug identifiers (RXCUI), properties, brand/generic links.  Source: rxnav.nlm.nih.gov.
* **DailyMed** — FDA drug labels (SPL PDFs).  Source: dailymed.nlm.nih.gov.
* **Orange Book (FDA)** — approved products & therapeutic equivalence.

> These power: plan coverage + costs, safe EMR prototyping, consistent drug IDs, label‑based safety parsing, and substitution guidance.

---

## Database – AWS RDS MySQL (DB: `pharmacy`)

### AWS Setup (what’s configured)

* RDS MySQL 8.x instance, parameter group with `local_infile=1`, `max_allowed_packet=64M`, UTF‑8 defaults.
* Security Group: TCP 3306 inbound from dev IP(s) / API host; automated backups enabled.
* Users: `rxuser` (password auth). Optional IAM DB Auth user if enabled.

### Tables in `pharmacy`

```
allergies
cms_basic_formulary
cms_beneficiary_cost
cms_indication_coverage
cms_plan_info
cms_plan_map
feature_scope_patients
medications
observations
patients
patients_backup
payer_plan_catalog
payer_transitions
payers
```

### Loading Data (examples)

```sql
-- Enable local infile on client
-- mysql ... --local-infile=1

LOAD DATA LOCAL INFILE '/path/basic_formulary.txt'
INTO TABLE cms_basic_formulary
CHARACTER SET utf8mb4
FIELDS TERMINATED BY '|' LINES TERMINATED BY '\n'
IGNORE 1 LINES;

LOAD DATA LOCAL INFILE '/path/allergies.csv'
INTO TABLE allergies
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
```

> If you encounter `ERROR 1300` (encoding), convert input to UTF‑8 during load.

---

## Backend Endpoints

### Health & Diagnostics

* `GET /health` – uptime & env
* `GET /` – API index & example routes
* `GET /api/test` – simple heartbeat
* `GET /api/db-test` – validates DB connectivity

### Evidence & Safety

* `GET /api/drug-label.pdf?rxcui=RXCUI`
  Proxy DailyMed SPL PDF by RxCUI.
* `POST /api/evidence/digest-rxcui`
  **Body**: `{ rxcui, patientId }`
  **Flow**: RxCUI → DailyMed PDF → text → EMR snapshot + coverage → LLM JSON (flags + HCP summary + coverage fields).

### Coverage & Cost

* `GET /api/coverage?patientId=...&rxcui=...`
  Returns `{ covered, tier, priorAuthorization, stepTherapy, quantityLimit, quantityLimitAmount, quantityLimitDays }`.
* `GET /api/cost?patientId=...&rxcui=...&daysSupply=30&coverageLevel=Initial%20Coverage&channel=RETAIL&preferred=1`
  Returns estimated out‑of‑pocket based on plan/channel/preference.

### Therapeutic Alternatives

* `POST /api/alternative`
  **Body**: `{ rxcui }`
  Finds disease from `cms_indication_coverage`, enumerates alternative RxCUIs, extracts SPL JSON for each, and returns a **comparative study** (similarity % + doctor_note) via LLM.

> **Note on Views**: Some sample queries reference `v_patient_formulary`, `v_drug_plan_coverage`, and `v_drug_cost_matrix`. If you are not using SQL views, replace these with equivalent JOINs across `cms_*`, `payers`, and `payer_transitions`. (You can also add lightweight views later for readability/perf.)

---

## `backend/src/utils.js` (Key Functions)

* **`pool`** – `mysql2/promise` pool using env‑driven config.
* **`parsePdfToText(buffer)`** – PDF → raw text (nulls stripped, trimmed).
* **`getPatientSnapshotAndCostSignals(patientId, rxcui)`** – returns `{ core, allergies, meds, coverage:{ plan, formulary, estimatedCost } }`.
* **`buildSPLPrompt(pdfText)`** – extractor prompt: outputs concise SPL JSON (drug_name, indications, MoA, etc.).
* **`buildPrompt({...})`** – clinical decision prompt: flags (high/medium/info) + HCP summary + coverage fields; strict JSON.
* **`buildReportPrompt(results, inputRxcui)`** – comparative study across alternatives (similarity % buckets + short doctor_note).
* **`callLLM(prompt, model)`** – OpenAI Chat Completions; extracts only the JSON object from response text.

---

## License

MIT

---

## Credits

Built by the MediCare Pro / RxAssist team using CMS, Synthea, RxNorm, DailyMed, and FDA Orange Book data.
