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

function buildSPLPrompt(pdfText) {
  return `
    <PDF SPL Start>
    ${pdfText}
    <PDF SPL End>
    You are given the FDA Structured Product Label (SPL) for a prescription drug.  
    Extract the key prescribing information into a concise JSON with the following fields.  
    Keep values short, using text snippets directly from the label. Do not generate extra commentary.

    Fields to extract:
    - drug_name
    - active_ingredients
    - indications
    - contraindications
    - warnings_precautions
    - adverse_reactions
    - drug_interactions
    - dosage_administration
    - use_in_specific_populations
    - mechanism_of_action

    Return only valid JSON, no explanation.

    Example Output
    {
      "drug_name": "Leucovorin Calcium",
      "active_ingredients": ["Leucovorin calcium"],
      "indications": "Rescue after high-dose methotrexate therapy; treatment of megaloblastic anemia due to folate deficiency",
      "contraindications": "Known hypersensitivity to leucovorin products or folic acid",
      "warnings_precautions": "Do not use with pernicious anemia; may enhance toxic effects of fluorouracil",
      "adverse_reactions": "Allergic reactions, urticaria, anaphylactoid reactions",
      "drug_interactions": "Interacts with fluorouracil and trimethoprim-sulfamethoxazole",
      "dosage_administration": "Typically 10–20 mg IV every 6 hours for rescue after methotrexate",
      "use_in_specific_populations": "Use with caution in pregnant women; safety in pediatric patients established",
      "mechanism_of_action": "Leucovorin is a reduced folate that bypasses dihydrofolate reductase"
    }
  `
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
1) Match against the patient snapshot to produce:
   - flags.high (contraindication or severe allergy)
   - flags.medium (interaction risks, serious warnings based on conditions)
   - flags.info (summary of the flags)
   For each flag include: {type, reason, evidence, matchedPatientData}
3) Create a short HCP summary (<=120 words) telling patients allergy , reccomended dosage , gender , and such important information and compare it with the drug information do not mention age and any other personal details of the patient.
  "cost_coverage": {.
4) Output STRICT JSON with the following schema (no prose, no markdown):

{
  "flags": {
    "high": Array<{type:string, reason:string, evidence:string, matchedPatientData:string}>,
    "medium": Array<{type:string, reason:string, evidence:string, matchedPatientData:string}>,
    "info": Array<{type:string, reason:string, evidence:string, matchedPatientData:string}>
  },
  "hcp_summary": string
    "covered": boolean,
    "tier": string,
    "pa_required": "Y"|"N",
    "step_therapy": "Y"|"N",
    "qty_limit": "Y"|"N",
    "estimated_30_day_cost_pref": number,
    "notes": string|null
  }
}
ONLY return valid JSON conforming to this schema.`;
}

function buildReportPrompt(results, inputRxcui){
  const ok = results
    .filter(r => r && !r.error && r.llm && typeof r.llm === "object");

  const drugs = ok.map(({ rxcui, llm }) => ({
    rxcui,
    drug_name: llm.drug_name ?? null,
    active_ingredients: llm.active_ingredients ?? null,
    indications: llm.indications ?? null,
    contraindications: llm.contraindications ?? null,
    warnings_precautions: llm.warnings_precautions ?? null,
    adverse_reactions: llm.adverse_reactions ?? null,
    drug_interactions: llm.drug_interactions ?? null,
    dosage_administration: llm.dosage_administration ?? null,
    use_in_specific_populations: llm.use_in_specific_populations ?? null,
    mechanism_of_action: llm.mechanism_of_action ?? null,
  }));

  const payload = { input_rxcui: inputRxcui, drugs };

  return `
    You are given structured JSON data for multiple drugs that treat the same disease.
    Each drug entry includes fields like drug_name, active_ingredients, indications, contraindications, warnings_precautions, adverse_reactions, drug_interactions, dosage_administration, use_in_specific_populations, and mechanism_of_action.

    <Comparative Study Input>
    ${JSON.stringify(payload)}
    <Comparative Study End>

    Your task: perform a comparative study across all drugs.

    Instructions:

    Compare each drug against the others field by field.

    For each property, compute a % match (0 to 100%) with the input drug.

    Be concise: use semantic similarity (not just string match).

    Highlight key differences for clinicians.

    Provide a one-line recommendation comment per drug, helping doctors make a quick decision.

    Focus on clinical fit, safety, and substitution feasibility.

    Example style: “Similar efficacy but higher GI side effects” or “Nearly identical indications, safer for renal patients”.

    Keep the output in JSON format for easy consumption.

    Output JSON Format:
    {
      "comparisons": [
        {
          "rxcui": "<drug_rxcui>",
          "drug_name": "<name>",
          "similarity": {
            "active_ingredients": "95%",
            "indications": "90%",
            "contraindications": "100%",
            "warnings_precautions": "85%",
            "adverse_reactions": "80%",
            "drug_interactions": "100%",
            "dosage_administration": "95%",
            "use_in_specific_populations": "85%",
            "mechanism_of_action": "100%"
          },
          "doctor_note": "✅ Good alternative; nearly identical profile, minor difference in dosing schedule."
        }
      ]
    }
    Constraints:
    Use short % values (rounded to nearest 5).
    Keep doctor_note under 20 words, focused on actionable clinical insight.
    Do not output explanations, only the JSON.
  `
}

async function callLLM(prompt, AIModel) {
  const base = process.env.OPENAI_BASE || 'https://api.openai.com/v1';
  const model = AIModel // process.env.OPENAI_MODEL || 'gpt-4o-mini';
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
  pool,
  parsePdfToText,
  getPatientSnapshotAndCostSignals,
  buildSPLPrompt,
  buildPrompt,
  buildReportPrompt,
  callLLM,
};