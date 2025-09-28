# CuraRx - Care made clear!

A full-stack healthcare management platform with role-based access for physicians and patients.
Built with **Next.js frontend** and a **Node.js + MySQL backend** that integrates public health datasets (CMS, Synthea, RxNorm, DailyMed, Orange Book).

---

## ✨ Features

### For Physicians

* **Patient Management** – sortable/filterable patient lists
* **EMR Integration** – timeline view of patient history with quick entry forms
* **Prescription Workflow** – multi-step prescription builder with safety checks
* **Drug Research Feed** – real-time FDA approvals and trial updates
* **Notifications** – labs, follow-up reminders, and alerts
* **AI Summaries** – auto-generate concise patient summaries in ~30s

### For Patients

* **Medication Management** – track prescriptions with details & warnings
* **Recovery Timeline** – monitor milestones and progress
* **Daily Checklist** – health-related tasks & compliance tracking
* **Cost Transparency** – formulary tiers, coverage, and estimated out-of-pocket costs
* **Appointment Tracking** – manage upcoming visits and follow-ups

---

## 🛠 Tech Stack

**Frontend**

* Framework: Next.js 15 (App Router) + TypeScript
* Styling: Tailwind CSS + shadcn/ui
* Authentication: Clerk (role-based)
* State Management: React Context API
* Icons & Dates: Lucide React, date-fns

**Backend**

* Node.js (Express + `mysql2/promise`)
* MySQL 8.x on AWS RDS (`pharmacy` DB)
* Axios for external API calls (RxNav, DailyMed, FDA)
* pdf-parse for drug label ingestion
* OpenAI API (structured JSON outputs for summaries & safety flags)

**Datasets Integrated**

* **CMS**: Formulary, plan, and cost files ([data.cms.gov](https://data.cms.gov/))
* **Synthea**: Synthetic EMR data ([synthetichealth.github.io/synthea](https://synthetichealth.github.io/synthea/))
* **RxNorm**: Canonical drug IDs & properties ([rxnav.nlm.nih.gov](https://rxnav.nlm.nih.gov/))
* **DailyMed**: FDA structured product labels ([dailymed.nlm.nih.gov](https://dailymed.nlm.nih.gov/))
* **Orange Book**: FDA therapeutic equivalence data

---

## 📂 Project Structure

```
frontend/                 # Next.js app
  src/
  ├── app/                # App router pages
  ├── components/         # UI & dashboard components
  ├── contexts/           # React Context API
  ├── types/              # TypeScript definitions
  └── lib/                # Utilities

backend/                  # Node.js API
  src/
  ├── routes/             # Express routes (patients, drugs, formulary, prescriptions)
  ├── db.js               # MySQL pool (mysql2/promise)
  ├── utils.js            # Shared functions (pdf parsing, prompts, LLM calls)
  └── server.js           # Express server entry
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* npm or yarn
* Clerk account (for authentication)
* AWS RDS MySQL instance (with `pharmacy` DB and tables created)

---

### Frontend Setup

```bash
git clone <repo-url>
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

Run:

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=8080
DB_HOST=<your-rds-endpoint>
DB_PORT=3306
DB_USER=rxuser
DB_PASSWORD=your_password
DB_NAME=pharmacy
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

Run:

```bash
npm run dev
```

APIs available at `http://localhost:8080/api/...`

---

## 🔑 Key Backend Utilities

### `utils.js`

* **`parsePdfToText(buffer)`** – extracts clean text from FDA SPL PDFs
* **`getPatientSnapshotAndCostSignals(patientId, rxcui)`** – pulls snapshot (core info, allergies, meds, coverage)
* **`buildPrompt(...)`** – builds strict JSON prompt for LLM
* **`callLLM(prompt)`** – calls OpenAI to return structured JSON (flags, HCP summary, coverage signals)

---

## 🗄 Database Schema (AWS RDS: `pharmacy`)

Core tables currently include:

* `patients`, `patients_backup`
* `allergies`, `medications`, `observations`
* `cms_basic_formulary`, `cms_beneficiary_cost`, `cms_indication_coverage`, `cms_plan_info`, `cms_plan_map`
* `payer_plan_catalog`, `payer_transitions`, `payers`
* `feature_scope_patients`

Data loaded via `LOAD DATA LOCAL INFILE` (with `local_infile=1` enabled in RDS parameter group).

---

## 📦 Deployment

* **Frontend**: Vercel (recommended) or any Next.js-compatible host
* **Backend**: AWS EC2, Render, or serverless (ensure DB credentials + SSL)
* **Database**: AWS RDS (backups, IAM roles, security group with port 3306 inbound)

---

## 🤝 Contributing

1. Fork this repo
2. Create a feature branch
3. Make changes & test thoroughly
4. Open a pull request

---

## 📜 License

Licensed under the MIT License.

---

## 📧 Support

For support/questions, open an issue or reach out to the development team.
