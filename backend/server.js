const express = require('express');
const cors = require('cors');
const multer = require('multer');

const {
  parsePdfToText,
  getPatientSnapshotAndCostSignals,
  buildPrompt,
  buildSPLPrompt,
  buildReportPrompt,
  callLLM,
} = require('./utils');

require('dotenv').config();

const { testConnection, initializeDatabase, executeQuery } = require('./config/database');

const { Readable } = require("stream");
const { setTimeout: delay } = require("timers/promises");

const app = express();
const PORT = process.env.PORT || 5001;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function fetchWithRetry(url, opts = {}, retries = 2, timeoutMs = 15000) {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok && attempt < retries) {
        await delay(300 * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt < retries) {
        await delay(300 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
}

async function getDailyMedSetIdFromRxcui(rxcui) {
  const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?rxcui=${encodeURIComponent(
    rxcui
  )}&pagesize=1`;

  const resp = await fetchWithRetry(url);
  if (!resp.ok) throw new Error(`DailyMed SPLs request failed (${resp.status})`);
  const json = await resp.json();

  const first = json?.data?.[0];
  const setId = first?.setid || first?.setId || first?.set_id || first?.id || null;
  return setId || null;
}

async function getDailyMedPdfResponseBySetId(setId) {
  const pdfUrl = `https://dailymed.nlm.nih.gov/dailymed/downloadpdffile.cfm?setId=${encodeURIComponent(
    setId
  )}`;
  const resp = await fetchWithRetry(pdfUrl);
  if (!resp.ok) throw new Error(`DailyMed PDF download failed (${resp.status})`);
  return resp; // has .body (web ReadableStream)
}

async function getDailyMedPdfBufferByRxcui(rxcui) {
  const setId = await getDailyMedSetIdFromRxcui(rxcui);
  if (!setId) throw new Error(`No SPL setId found for RXCUI ${rxcui}`);
  const pdfResp = await getDailyMedPdfResponseBySetId(setId);
  const ab = await pdfResp.arrayBuffer();
  return { buffer: Buffer.from(ab), setId, contentType: pdfResp.headers.get("content-type") || "application/pdf" };
}

app.get("/api/drug-label.pdf", async (req, res) => {
  const rxcui = String(req.query.rxcui || "").trim();
  if (!rxcui) return res.status(400).json({ error: "Missing query param: rxcui" });

  try {
    const setId = await getDailyMedSetIdFromRxcui(rxcui);
    if (!setId) return res.status(404).json({ error: `No SPL setId found for RXCUI ${rxcui}` });

    const pdfResp = await getDailyMedPdfResponseBySetId(setId);
    const ct = pdfResp.headers.get("content-type") || "application/pdf";
    const cl = pdfResp.headers.get("content-length") || undefined;

    res.setHeader("Content-Type", ct);
    if (cl) res.setHeader("Content-Length", cl);
    res.setHeader("Content-Disposition", `attachment; filename="${setId}.pdf"`);

    // Pipe the web ReadableStream to Node response
    Readable.fromWeb(pdfResp.body).pipe(res);
  } catch (err) {
    console.error("DailyMed PDF proxy error:", err);
    res.status(500).json({ error: "Unexpected error fetching DailyMed PDF", detail: err.message });
  }
});

app.post("/api/evidence/digest-rxcui", async (req, res) => {
  try {
    const rxcui = String(req.body?.rxcui || "").trim();
    const patientId = String(req.body?.patientId || "").trim();
    if (!rxcui) return res.status(400).json({ error: "rxcui is required" });
    if (!patientId) return res.status(400).json({ error: "patientId is required" });

    // 1) Fetch DailyMed PDF internally
    const { buffer: pdfBuffer } = await getDailyMedPdfBufferByRxcui(rxcui);

    // 2) PDF → text (reusing your existing util)
    const pdfText = await parsePdfToText(pdfBuffer);

    // 3) EMR + coverage
    const snapshot = await getPatientSnapshotAndCostSignals(patientId, rxcui);
    if (!snapshot) return res.status(404).json({ error: "Patient not found" });

    // 4) Prompt the LLM
    const prompt = buildPrompt({
      pdfText,
      rxcui,
      patient: {
        core: snapshot.core,
        conditions: snapshot.conditions,
        allergies: snapshot.allergies,
        meds: snapshot.meds,
        labs: snapshot.labs,
      },
      coverage: snapshot.coverage,
    });

    const llmJson = await callLLM(prompt, process.env.OPENAI_FETCH_MODEL);

    // 5) Respond
    res.json({
      rxcui,
      patientId,
      coverage: snapshot.coverage,
      result: llmJson,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process evidence digest from RXCUI", detail: err.message });
  }
});

app.post("/api/alternative", async (req, res) => {

  const start = Date.now();
  console.log(`[alternative] START ${new Date(start).toISOString()}`);
  try {
    const rxcui = String(req.body?.rxcui || "").trim();
    if (!rxcui) return res.status(400).json({ error: "rxcui is required" });

    const disease = await executeQuery(`
      select distinct DISEASE from cms_indication_coverage where RXCUI = ? limit 1;
      `, [rxcui])

    const cleanDisease = disease[0].DISEASE;

    console.log(cleanDisease);

    const sql = `select distinct RXCUI
      from cms_indication_coverage
      where DISEASE like '%${cleanDisease}%'
      limit 3;`

    const altRows = await executeQuery(sql);

    console.log('alt rows: ', altRows);

    if (!altRows?.length) {
      const endNoAlts = Date.now();
      console.log(`[alternative] END (no alternatives) ${new Date(endNoAlts).toISOString()} | total=${endNoAlts - start}ms`);
      return res.json({ rxcui, disease: cleanDisease, alternatives: [], took_ms: endNoAlts - start });
    }

    const jobs = altRows.map(({ RXCUI: altRxcui }) => (async () => {
      const t0 = Date.now();
      console.log(`[alternative:${altRxcui}] job start ${new Date(t0).toISOString()}`);

      // Fetch DailyMed PDF, parse, prompt, call LLM
      const { buffer: pdfBuffer } = await getDailyMedPdfBufferByRxcui(altRxcui);
      const pdfText = await parsePdfToText(pdfBuffer);
      const prompt = buildSPLPrompt(pdfText);
      const llmJson = await callLLM(prompt, process.env.OPENAI_FETCH_MODEL); // expects JSON from your extractor prompt

      const t1 = Date.now();
      console.log(`[alternative:${altRxcui}] job end ${new Date(t1).toISOString()} | took=${t1 - t0}ms`);

      return { rxcui: altRxcui, llm: llmJson, took_ms: t1 - t0 };
    })());

    const settled = await Promise.allSettled(jobs);

    const results = settled.map((s, idx) => {
      const altRxcui = altRows[idx].RXCUI;
      if (s.status === "fulfilled") {
        return s.value; // { rxcui, llm, took_ms }
      }
      return {
        rxcui: altRxcui,
        error: s.reason?.message || String(s.reason || "Unknown error"),
      };
    });

    const report_prompt = buildReportPrompt(results, rxcui);

    const report_json = await callLLM(report_prompt, process.env.OPENAI_REASONING_MODEL);

    const end = Date.now();
    console.log(`[alternative] END ${new Date(end).toISOString()} | total=${end - start}ms`);

    return res.json({
      input_rxcui: rxcui,
      disease: cleanDisease,
      alternatives_checked: altRows.map(r => r.RXCUI),
      report_json,
      took_ms: end - start,
    });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error in finding alternative drug for given RXCUI", detail: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Database test route
app.get('/api/db-test', async (req, res) => {
  try {
    const { executeQuery } = require('./config/database');
    
    // Test database connection with a simple query
    const result = await executeQuery('SELECT 1 as test');
    
    res.json({
      message: 'Database connection successful!',
      test: result[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// Coverage endpoint
app.get('/api/coverage', async (req, res) => {
  try {
    const { patientId, rxcui } = req.query;
    if (!patientId || !rxcui) {
      return res.status(400).json({ error: 'patientId and rxcui are required' });
    }

    const { executeQuery } = require('./config/database');
    
    const sql = `
      SELECT dpc.PATIENT_ID, dpc.RXCUI, dpc.TIER,
             dpc.REQUIRES_PA, dpc.REQUIRES_ST, dpc.REQUIRES_QL,
             dpc.QUANTITY_LIMIT_AMOUNT, dpc.QUANTITY_LIMIT_DAYS
      FROM v_drug_plan_coverage dpc
      WHERE dpc.PATIENT_ID = ? AND dpc.RXCUI = ?
      LIMIT 1
    `;
    console.log(patientId, rxcui);
    const rows = await executeQuery(sql, [patientId, rxcui]);
    console.log(rows);
    if (rows.length === 0) {
      return res.json({ covered: false });
    }
    
    const r = rows[0];
    res.json({
      covered: true,
      tier: r.TIER,
      priorAuthorization: r.REQUIRES_PA === 'Y',
      stepTherapy: r.REQUIRES_ST === 'Y',
      quantityLimit: r.REQUIRES_QL === 'Y',
      quantityLimitAmount: r.QUANTITY_LIMIT_AMOUNT,
      quantityLimitDays: r.QUANTITY_LIMIT_DAYS,
    });
  } catch (error) {
    console.error('Coverage endpoint error:', error);
    res.status(500).json({ error: 'internal' });
  }
});

// Cost endpoint
app.get('/api/cost', async (req, res) => {
  try {
    const { patientId, rxcui, daysSupply, coverageLevel, channel = 'RETAIL', preferred = '1' } = req.query;
    if (!patientId || !rxcui || !daysSupply || !coverageLevel) {
      return res.status(400).json({ error: 'patientId, rxcui, daysSupply, coverageLevel required' });
    }
    console.log(patientId, rxcui, daysSupply, coverageLevel, channel, preferred);
    const { executeQuery } = require('./config/database');
    
    const sql = `
      SELECT dcm.PATIENT_ID, dcm.RXCUI, dcm.TIER,
             dcm.COVERAGE_LEVEL, dcm.DAYS_SUPPLY,
             CASE
               WHEN ? = 'MAIL'   AND ? = 1 THEN dcm.COST_AMT_MAIL_PREF
               WHEN ? = 'MAIL'   AND ? = 0 THEN dcm.COST_AMT_MAIL_NONPREF
               WHEN ? = 'RETAIL' AND ? = 1 THEN dcm.COST_AMT_PREF
               WHEN ? = 'RETAIL' AND ? = 0 THEN dcm.COST_AMT_NONPREF
             END AS ESTIMATED_OOP,
             dcm.TIER_SPECIALTY_YN, dcm.DED_APPLIES_YN
      FROM v_drug_cost_matrix dcm
      WHERE dcm.PATIENT_ID = ?
        AND dcm.RXCUI = ?
        AND dcm.COVERAGE_LEVEL = ?
        AND dcm.DAYS_SUPPLY = ?
      LIMIT 1
    `;
    
    const params = [channel, Number(preferred), channel, Number(preferred), channel, Number(preferred), channel, Number(preferred),
                    patientId, rxcui, coverageLevel, Number(daysSupply)];
    
    console.log('Cost endpoint params:', params);
    const rows = await executeQuery(sql, params);
    console.log('Cost endpoint rows:', rows);
    
    if (rows.length === 0) return res.json({ found: false });
    
    const r = rows[0];
    res.json({
      found: true,
      tier: r.TIER,
      estimatedOutOfPocket: r.ESTIMATED_OOP,
      specialtyTier: r.TIER_SPECIALTY_YN === 'Y',
      deductibleApplies: r.DED_APPLIES_YN === 'Y'
    });
  } catch (error) {
    console.error('Cost endpoint error:', error);
    res.status(500).json({ error: 'internal' });
  }
});

// Prescription analysis endpoint


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'HACKGT Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      test: '/api/test',
      dbTest: '/api/db-test',
      coverage: '/api/coverage?patientId=...&rxcui=...',
      cost: '/api/cost?patientId=...&rxcui=...&daysSupply=30&coverageLevel=Initial%20Coverage&channel=RETAIL&preferred=1',
      prescriptionAnalysis: '/api/evidence/digest-rxcui'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry found';
    error.status = 400;
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Referenced record not found';
    error.status = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  } else if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Validation errors
  if (err.isJoi) {
    error.message = err.details[0].message;
    error.status = 400;
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('⚠️  Database connection failed, but server will start anyway');
    }

    // Initialize database tables
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;
