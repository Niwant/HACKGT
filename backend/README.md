# MediCare Pro – Backend README

This README documents the backend for **MediCare Pro**: AWS RDS MySQL setup, schema & data loading commands (CMS + **Synthea** + FDA/RxNorm datasets), data hygiene/dedup routines, and a minimal Node.js API (Express + `mysql2/promise`) that integrates with the Next.js frontend.

> **Note:** This backend uses **tables only (no SQL views)** and the database name is **`pharmacy`**.

---

## 1) High‑Level Architecture

```
[Frontend: Next.js 15 App Router]
    │
    ▼
[Backend: Node.js API (Express + mysql2/promise)]
    ├─ Authentication (Clerk – shared with frontend)
    ├─ REST endpoints for patients, allergies, formulary, drugs/costs, prescriptions
    ├─ Integrates external APIs (RxNorm, DailyMed)
    │
    ▼
[AWS RDS MySQL 8.x]
    ├─ Database: pharmacy
    └─ Tables: patients, allergies, medications, observations,
               cms_basic_formulary, cms_plan_info, cms_beneficiary_cost,
               cms_indication_coverage, cms_plan_map,
               payers, payer_plan_catalog, payer_transitions
```

---

## 2) Data Sources

* **CMS (Centers for Medicare & Medicaid Services)**
  Source: data.cms.gov
  Files: `basic_formulary.txt`, `plan_info.txt`, `cms_beneficiary_cost.txt`, `cms_indication_coverage.txt`, `cms_plan_map.txt`
  Provides: formulary/plan metadata, tiers, costs, PA/ST/QL restrictions, indication coverage, plan mappings.

* **Synthea Synthetic Patient Data**
  Source: synthetichealth.github.io/synthea
  Files used: `patients.csv`, `allergies.csv`, `medications.csv`, `observations.csv` (and others as needed)
  Provides: synthetic EHR for development/testing.

* **RxNorm (RxNav APIs)**
  Source: rxnav.nlm.nih.gov
  Provides: RXCUI, drug properties, generic/brand relationships.

* **DailyMed**
  Source: dailymed.nlm.nih.gov
  Provides: FDA labeling & consumer‑friendly descriptions.

* **Orange Book (FDA)**
  Source: FDA Orange Book data files
  Provides: FDA‑approved drug products and therapeutic equivalence.

---

## 3) AWS RDS MySQL Setup

### 3.1 Created resources in AWS (what you did)

* **RDS MySQL 8.x instance** created in your AWS account
* **Database `pharmacy`** created on that instance
* **IAM setup**

  * Created IAM role/user for backend with least‑privilege policies
  * (Optional) If using IAM DB Auth: attached permissions `rds-db:connect` to the IAM principal mapped to MySQL user
* **Security Group updates**

  * Inbound rule added for **TCP 3306** from your laptop/office IP(s) (and/or from API server/EC2)
  * Outbound left open (default) so the DB can reach AWS services as needed
* **Parameter Group** attached with:

  * `local_infile = 1` (enables `LOAD DATA LOCAL INFILE`)
  * `max_allowed_packet = 64M`
  * `character_set_server = utf8mb4`
  * `collation_server = utf8mb4_0900_ai_ci`
* (Optional) **Option Group / Backups**

  * Enabled automated backups; configured backup window/retention for dev


### 3.2 Client connection (enable local infile)

```bash
mysql --host=<rds-endpoint> --port=3306 \
      --user=rxuser -p \
      --local-infile=1
```

> **Firewall tip:** If your IP changes, update the **Security Group** inbound rule to restore access.

---

## 4) Tables in `pharmacy`

From `SHOW TABLES;` you currently have:

* `patients` – Synthea patients (demographics)
* `allergies` – Synthea allergies
* `medications` – Synthea medications/active meds
* `observations` – Synthea observations/vitals/labs
* `patients_backup` – snapshot/backup of patients
* `feature_scope_patients` – subset of patient IDs used for feature demos
* `payers` – payer reference/master
* `payer_plan_catalog` – plan catalog per payer
* `payer_transitions` – patient→plan transitions over time
* `cms_basic_formulary` – CMS formulary entries (tiers, PA/ST/QL, RXCUI/NDC)
* `cms_plan_info` – CMS plan metadata
* `cms_beneficiary_cost` – CMS beneficiary drug cost entries (tier, days supply, cost types)
* `cms_indication_coverage` – indication‑level coverage specifics
* `cms_plan_map` – mappings/normalization across CMS plan identifiers
---

## 5) Schema & Data Loading

### 5.1 Character set & common errors

* If you hit `ERROR 3948 (42000): Loading local data is disabled`, ensure `local_infile=1` on server (parameter group) **and** client (`--local-infile=1`).
* If you hit `ERROR 1300 (HY000): Invalid utf8mb4 character string`, either declare `CHARACTER SET latin1` in your `LOAD DATA` or convert the file on disk:
  `iconv -f WINDOWS-1252 -t UTF-8 plan_info.txt > plan_info.utf8.txt`

### 5.2 Sample DDLs (align to your headers)

**Allergies (Synthea)**

```sql
CREATE TABLE IF NOT EXISTS allergies (
  ALLERGY_ID   VARCHAR(64),
  START        DATE,
  STOP         DATE,
  PATIENT      VARCHAR(64),
  ENCOUNTER    VARCHAR(64),
  CODE         VARCHAR(64),
  SYSTEM       VARCHAR(255),
  DESCRIPTION  VARCHAR(255),
  TYPE         VARCHAR(64),
  CATEGORY     VARCHAR(64),
  REACTION1    VARCHAR(255),
  DESCRIPTION1 VARCHAR(255),
  SEVERITY1    VARCHAR(64),
  REACTION2    VARCHAR(255),
  DESCRIPTION2 VARCHAR(255),
  SEVERITY2    VARCHAR(64)
) DEFAULT CHARSET = utf8mb4;
```

**CMS Basic Formulary** (pipe‑separated)

```sql
CREATE TABLE IF NOT EXISTS cms_basic_formulary (
  FORMULARY_ID          VARCHAR(50),
  FORMULARY_VERSION     INT,
  CONTRACT_YEAR         INT,
  RXCUI                 VARCHAR(20),
  NDC                   VARCHAR(20),
  TIER_LEVEL_VALUE      VARCHAR(10),
  QUANTITY_LIMIT_YN     CHAR(1),
  QUANTITY_LIMIT_AMOUNT DECIMAL(10,2),
  QUANTITY_LIMIT_DAYS   INT,
  STEP_THERAPY_YN       CHAR(1),
  PRIOR_AUTH_YN         CHAR(1),
  DRUG_NAME             VARCHAR(255),
  BRAND_GENERIC_IND     VARCHAR(20),
  UPDATED_AT            TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET = utf8mb4;
```

### 5.3 Load commands

**Allergies (CSV)**

```sql
LOAD DATA LOCAL INFILE '/path/allergies.csv'
INTO TABLE allergies
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(ALLERGY_ID, START, STOP, PATIENT, ENCOUNTER, CODE, SYSTEM, DESCRIPTION,
 TYPE, CATEGORY, REACTION1, DESCRIPTION1, SEVERITY1, REACTION2, DESCRIPTION2, SEVERITY2);
```

**CMS Basic Formulary (pipe)**

```sql
SET NAMES utf8mb4;
LOAD DATA LOCAL INFILE '/Users/pallavi/basic_formulary.txt'
INTO TABLE cms_basic_formulary
CHARACTER SET utf8mb4
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
```

**CMS Plan Info (pipe; encoding guard)**

```sql
LOAD DATA LOCAL INFILE '/Users/pallavi/plan_info.txt'
INTO TABLE cms_plan_info
CHARACTER SET latin1
FIELDS TERMINATED BY '|'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
```

> Repeat similar `LOAD DATA` for `cms_beneficiary_cost`, `cms_indication_coverage`, and `cms_plan_map` using their headers.

### 5.4 Normalization & dedup helpers

**Find duplicate key combos (example on cost table):**

```sql
SELECT
  CONTRACT_ID, PLAN_ID, SEGMENT_ID, COVERAGE_LEVEL, TIER, DAYS_SUPPLY,
  COUNT(*) AS cnt
FROM cms_beneficiary_cost
GROUP BY 1,2,3,4,5,6
HAVING COUNT(*) > 1;
```

**Window tag for dupes (MySQL 8):**

```sql
WITH cte AS (
  SELECT *,
         ROW_NUMBER() OVER (
           PARTITION BY CONTRACT_ID, PLAN_ID, SEGMENT_ID, COVERAGE_LEVEL, TIER, DAYS_SUPPLY
           ORDER BY (SELECT NULL)
         ) AS rn
  FROM cms_beneficiary_cost
)
SELECT * FROM cte WHERE rn > 1;
```

**FK discovery before deletes:**

```sql
SELECT k.TABLE_NAME, k.CONSTRAINT_NAME, k.COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
  ON tc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
 AND tc.TABLE_NAME = k.TABLE_NAME
 AND tc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
WHERE k.REFERENCED_TABLE_SCHEMA = 'pharmacy'
  AND k.REFERENCED_TABLE_NAME  = 'patients'
  AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION;
```

---

## 6) API Endpoints (Express)

* **Patients**

  * `GET /api/patients` → List patients (from `patients`)
  * `GET /api/patients/:id` → Patient details

* **Allergies**

  * `GET /api/allergies/:patientId` → Allergies for a patient (from `allergies`)

* **Formulary**

  * `GET /api/formulary/search?q=drugname` → Search formulary (from `cms_basic_formulary`)

* **Drug Costs**

  * `GET /api/drugs/:patientId/:rxcui/costs` → Join `payer_transitions`/`payer_plan_catalog` with CMS cost tables to compute patient‑specific costs (tier, days supply, copay/coinsurance).

* **Prescriptions**

  * `POST /api/prescriptions` → Insert into `medications` (or a dedicated `prescriptions` table if you add one)
  * `GET /api/prescriptions/:patientId` → List medications/prescriptions for a patient

> All endpoints operate on **tables only** and do not rely on SQL views.

---

## 7) Integration with Frontend

* Frontend (Next.js) uses **Clerk** for auth.
* After sign‑in, requests include JWT/session validated in the backend.
* Role‑based access: **Physicians** manage patients/prescriptions; **Patients** view meds, costs, allergies, and timelines.
* Drug metadata enrichment via **RxNorm/DailyMed/Orange Book** as needed.

---

## 8) Development

### Setup

```bash
cd backend
npm install
```

### Environment Variables (`.env`)

```
PORT=8080
DB_HOST=pharmacy-db.c1026kwog93h.us-east-2.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=hackgt12
DB_NAME=pharmacy
DB_SSL=true
```

### Run API server

```bash
npm run dev
```

---

## 9) Deployment

* Deploy backend (AWS EC2/Render/Vercel Functions).
* Configure RDS creds via env vars in prod.
* Enforce Clerk auth for protected routes.

---

## 10) Glossary

* **RXCUI** – RxNorm concept ID
* **NDC** – National Drug Code (package‑level)
* **Tier** – Formulary tier (affects out‑of‑pocket)
* **PA** – Prior Authorization, **ST** – Step Therapy, **QL** – Quantity Limit

---

## 11) Support & License

* License: MIT (same as frontend)
* For support/questions, contact the development team.
