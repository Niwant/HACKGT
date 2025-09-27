// utils.js (CommonJS)

const axios = require('axios');
const mysql = require('mysql2/promise');
const pdfParse = require('pdf-parse');

require('dotenv').config();

// Promise pool (independent of config/database's callback pool)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hackgt_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function parsePdfToText(buffer) {
  const { text } = await pdfParse(buffer);
  return (text || '').replace(/\u0000/g, '').trim();
}

// Promise-based snapshot + coverage using mysql2/promise
async function getPatientSnapshotAndCostSignals(patientId, rxcui) {
  // core
  const [coreRows] = await pool.query(
    `SELECT PATIENT_ID, NAME, BIRTHDATE, GENDER
       FROM patients WHERE PATIENT_ID=? LIMIT 1`,
    [patientId]
  );
  const core = coreRows[0];
  if (!core) return null;

    // context
    //   const [conditions] = await pool.query(
    //     `SELECT CODE, DESCRIPTION, START, STOP
    //        FROM conditions WHERE PATIENT=?
    //      ORDER BY START DESC LIMIT 100`,
    //     [patientId]
    //   );

  const [allergies] = await pool.query(
    `SELECT CODE, DESCRIPTION, TYPE, SEVERITY1
       FROM allergies WHERE PATIENT=?`,
    [patientId]
  );
  const [meds] = await pool.query(
    `SELECT CODE, DESCRIPTION, START_DATE as START, END_DATE as STOP
       FROM medications WHERE PATIENT_ID=?
     ORDER BY START DESC LIMIT 100`,
    [patientId]
  );

    //   const [labs] = await pool.query(
    //     `SELECT CODE, DESCRIPTION, VALUE, UNITS, DATE
    //        FROM observations WHERE PATIENT=?
    //      ORDER BY DATE DESC LIMIT 100`,
    //     [patientId]
    //   );

  // active plan
  const [planRows] = await pool.query(
    `SELECT pt.PATIENT_ID, p.CONTRACT_ID, p.PLAN_ID, p.SEGMENT_ID
       FROM payer_transitions pt
       JOIN payers p ON p.PAYER_ID = pt.PAYER_ID
      WHERE pt.PATIENT_ID = ?
   ORDER BY COALESCE(pt.END_DATE,'9999-12-31') DESC
      LIMIT 1`,
    [patientId]
  );
  const plan = planRows[0] || null;

  let formulary = null;
  let estimatedCost = null;

  if (plan) {
    const [formularyRows] = await pool.query(
      `SELECT PA_YN AS PRIOR_AUTHORIZATION_YN, ST_YN AS STEP_THERAPY_YN,
              QL_YN AS QUANTITY_LIMIT_YN, TIER AS TIER_LEVEL_VALUE
         FROM v_patient_formulary
        WHERE RXCUI = ? AND PATIENT_ID = ?
        LIMIT 10`,
      [rxcui, patientId]
    );
    formulary = formularyRows[0] || null;

    const [costRows] = await pool.query(
      `SELECT COVERAGE_LEVEL, TIER, DAYS_SUPPLY,
              COST_TYPE_PREF, COST_AMT_PREF, COST_MIN_AMT_PREF, COST_MAX_AMT_PREF,
              COST_TYPE_NONPREF, COST_AMT_NONPREF
         FROM cms_beneficiary_cost
        WHERE CONTRACT_ID=? AND PLAN_ID=? AND COALESCE(SEGMENT_ID,'000') = COALESCE(?, '000')
          AND DAYS_SUPPLY IN (30,90)
        ORDER BY CASE WHEN DAYS_SUPPLY=30 THEN 0 ELSE 1 END
        LIMIT 1`,
      [plan.CONTRACT_ID, plan.PLAN_ID, plan.SEGMENT_ID || '000']
    );
    estimatedCost = costRows[0] || null;
  }

  return {
    core,
    allergies,
    meds,
    coverage: { plan: plan || null, formulary, estimatedCost },
  };
}

function buildPrompt({ pdfText, rxcui, patient, coverage }) {
  return `
You are a clinical decision support assistant.

INPUTS
- Drug Label (raw text from FDA SPL PDF): <<BEGIN_LABEL>>
${pdfText}
<<END_LABEL>>
- RxCUI: ${rxcui}

- Patient Snapshot:
${JSON.stringify(
  {
    core: patient.core,
    conditions: patient.conditions,
    allergies: patient.allergies,
    meds: patient.meds,
    labs: patient.labs,
  },
  null,
  2
)}

- Coverage Signals:
${JSON.stringify(coverage, null, 2)}

TASK
1) From the label text, extract concise sections:
   - indications[]
   - contraindications[]
   - warnings[]
   - interactions[]
   - active_ingredients[]
   - renal_considerations[]
   - hepatic_considerations[]
2) Match against the patient snapshot to produce:
   - flags.high (contraindication or severe allergy)
   - flags.medium (interaction risks, serious warnings based on conditions)
   - flags.info (renal/hepatic dose considerations, geriatrics/pediatrics if relevant)
   For each flag include: {type, reason, evidence, matchedPatientData}
3) Create a short HCP summary (<=120 words) telling what matters now.
4) Build a cost_coverage summary using plan/formulary/cost tables if available:
   - {covered: true/false/unknown, tier: string|null, pa_required: Y/N/null, step_therapy: Y/N/null,
      qty_limit: Y/N/null, estimated_30_day_cost_pref: number|null, notes: string}
5) Output STRICT JSON with the following schema (no prose, no markdown):

{
  "drug": {
    "brand": string|null,
    "generic": string|null,
    "active_ingredients": string[]
  },
  "sections": {
    "indications": string[],
    "contraindications": string[],
    "warnings": string[],
    "interactions": string[],
    "renal_considerations": string[],
    "hepatic_considerations": string[]
  },
  "flags": {
    "high": Array<{type:string, reason:string, evidence:string, matchedPatientData:string}>,
    "medium": Array<{type:string, reason:string, evidence:string, matchedPatientData:string}>,
    "info": Array<{type:string, reason:string, evidence:string, matchedPatientData:string}>
  },
  "hcp_summary": string,
  "cost_coverage": {
    "covered": boolean|null,
    "tier": string|null,
    "pa_required": "Y"|"N"|null,
    "step_therapy": "Y"|"N"|null,
    "qty_limit": "Y"|"N"|null,
    "estimated_30_day_cost_pref": number|null,
    "notes": string|null
  }
}
ONLY return valid JSON conforming to this schema.`;
}

async function callLLM(prompt) {
  const base = process.env.OPENAI_BASE || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const headers = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const { data } = await axios.post(
    `${base}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: 'You output strict JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    },
    { headers, timeout: 45000 }
  );

  const text = data?.choices?.[0]?.message?.content?.trim() || '{}';
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  const jsonStr = first >= 0 && last >= 0 ? text.slice(first, last + 1) : '{}';
  return JSON.parse(jsonStr);
}

module.exports = {
  pool, // export in case elsewhere needs it
  parsePdfToText,
  getPatientSnapshotAndCostSignals,
  buildPrompt,
  callLLM,
};