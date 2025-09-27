// PriorAuthPdfFiller.tsx
// Reusable React component to fill a non-interactive PDF using exact (x,y) coordinates
// Dependencies: pdf-lib (npm i pdf-lib)

import React, { useCallback, useMemo, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ------------------------
// Types
// ------------------------
export type TableColumn = {
  key: string;       // row[key]
  width: number;     // max width for clamped text
  gap?: number;      // column gap in points
};

export type FieldSpec = {
  page: number;      // zero-based page index
  x: number;
  y: number;         // origin is bottom-left
  size?: number;     // font size (default 10)
  maxWidth?: number; // clamp text width and add ellipsis
  type?: "checkbox" | "table"; // special renderers
  // table-only fields:
  rowHeight?: number;
  maxRows?: number;
  columns?: TableColumn[];
};

export type FieldMap = Record<string, FieldSpec>;

export type PriorAuthPdfFillerProps = {
  /** The base PDF to draw onto. Accepts a URL string or raw bytes (ArrayBuffer/Uint8Array). */
  src: string | ArrayBuffer | Uint8Array;
  /** Values to write, keyed by field names defined in fieldMap. */
  data: Record<string, any>;
  /** Field definitions: where and how to draw for each key in `data`. */
  fieldMap: FieldMap;
  /** Output file name for the download (default: "filled.pdf"). */
  fileName?: string;
  /** Optional button label (default: "Download Filled PDF"). */
  buttonLabel?: string;
  /** Optional className for the button. */
  className?: string;
  /** Disable the button and prevent action. */
  disabled?: boolean;
  /** Called with the generated Blob before download is triggered. Return false to cancel download. */
  onBeforeDownload?: (blob: Blob) => boolean | void;

  /** === Calibration helpers === */
  /** Draws a light grid & axis labels onto each page for coordinate calibration. */
  debugGrid?: boolean;
  /** Draws a crosshair at each field's (x,y). */
  showCrosshairs?: boolean;
  /** Global offsets applied to ALL fields on ALL pages. */
  xOffset?: number;
  yOffset?: number;
  /** Per-page additional offsets. Example: { 0:{y:-40}, 1:{y:-56} } */
  pageOffsets?: Record<number, { x?: number; y?: number }>;
};

// ------------------------
// Helpers
// ------------------------
async function getBytes(src: string | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  if (typeof src === "string") {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  }
  return src instanceof Uint8Array ? src : new Uint8Array(src);
}

function drawTextClamped(page: any, text: string, x: number, y: number, opts: { font: any; size?: number; maxWidth?: number }) {
  const size = opts.size ?? 10;
  const font = opts.font;
  const maxWidth = opts.maxWidth;
  const safe = String(text ?? "");
  if (!maxWidth) {
    page.drawText(safe, { x, y, size, font });
    return;
  }
  const ell = "…";
  let out = safe;
  while (out.length && font.widthOfTextAtSize(out, size) > maxWidth) {
    out = out.slice(0, -1);
  }
  if (out !== safe) {
    if (font.widthOfTextAtSize(out + ell, size) <= maxWidth) out += ell;
  }
  page.drawText(out, { x, y, size, font });
}

function drawCheckbox(page: any, value: any, x: number, y: number, opts: { font: any; size?: number }) {
  const size = opts.size ?? 10;
  if (value) page.drawText("X", { x, y, size, font: opts.font });
}

function drawTable(page: any, rows: any[], spec: FieldSpec, font: any) {
  const { x, y, rowHeight = 14, maxRows = 5, columns = [], size = 10 } = spec;
  if (!Array.isArray(rows) || rows.length === 0) return;
  let yy = y;
  rows.slice(0, maxRows).forEach((row) => {
    let xx = x;
    columns.forEach((col) => {
      const txt = String(row?.[col.key] ?? "");
      drawTextClamped(page, txt, xx, yy, { font, size, maxWidth: col.width });
      xx += (col.width || 120) + (col.gap || 10);
    });
    yy -= rowHeight;
  });
}

function drawCrosshair(page: any, x: number, y: number) {
  const s = 4;
  page.drawLine({ start: { x: x - s, y }, end: { x: x + s, y }, color: rgb(0.2,0.2,0.2), thickness: 0.5 });
  page.drawLine({ start: { x, y: y - s }, end: { x, y: y + s }, color: rgb(0.2,0.2,0.2), thickness: 0.5 });
  page.drawText('+', { x: x + 2, y: y + 2, size: 6, color: rgb(0.2,0.2,0.2) });
}

function drawGrid(page: any) {
  const { width, height } = page.getSize();
  const step = 36; // ~0.5 inch
  for (let x = 0; x <= width; x += step) {
    page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, color: rgb(0.85,0.85,0.85), thickness: (x/step)%2?0.25:0.5 });
    page.drawText(String(x), { x: x + 2, y: 2, size: 6, color: rgb(0.35,0.35,0.35) });
  }
  for (let y = 0; y <= height; y += step) {
    page.drawLine({ start: { x: 0, y }, end: { x: width, y }, color: rgb(0.85,0.85,0.85), thickness: (y/step)%2?0.25:0.5 });
    page.drawText(String(y), { x: 2, y: y + 2, size: 6, color: rgb(0.35,0.35,0.35) });
  }
  // origin marker
  page.drawCircle({ x: 0, y: 0, size: 1.5, color: rgb(0,0,0) });
  page.drawText(`Page size: ${Math.round(width)} x ${Math.round(height)} (0,0 at bottom-left)`, { x: 15, y: height - 16, size: 7, color: rgb(0.25,0.25,0.25) });
}

function withOffsets(spec: FieldSpec, xOff: number, yOff: number, pageOff?: {x?: number; y?: number}) {
  const x = spec.x + xOff + (pageOff?.x ?? 0);
  const y = spec.y + yOff + (pageOff?.y ?? 0);
  return { ...spec, x, y };
}

async function fillBytes(
  srcBytes: Uint8Array,
  data: Record<string, any>,
  fieldMap: FieldMap,
  opts?: { debugGrid?: boolean; showCrosshairs?: boolean; xOffset?: number; yOffset?: number; pageOffsets?: Record<number, {x?: number; y?: number}> }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(srcBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const xOffset = opts?.xOffset ?? 0;
  const yOffset = opts?.yOffset ?? 0;
  const pageOffsets = opts?.pageOffsets ?? {};

  // Optional: grid per page for calibration
  if (opts?.debugGrid) {
    const count = pdfDoc.getPageCount();
    for (let i = 0; i < count; i++) {
      const page = pdfDoc.getPage(i);
      drawGrid(page);
    }
  }

  for (const [key, spec0] of Object.entries(fieldMap)) {
    const val = (data as any)[key];
    if (val === undefined || val === null || val === "") continue;

    const page = pdfDoc.getPage(spec0.page);
    const spec = withOffsets(spec0, xOffset, yOffset, pageOffsets[spec0.page]);

    if (opts?.showCrosshairs) drawCrosshair(page, spec.x, spec.y);

    if (spec.type === "checkbox") {
      drawCheckbox(page, !!val, spec.x, spec.y, { font: helvBold, size: spec.size });
      continue;
    }

    if (spec.type === "table") {
      drawTable(page, Array.isArray(val) ? val : [], spec, helv);
      continue;
    }

    drawTextClamped(page, String(val), spec.x, spec.y, {
      font: helv,
      size: spec.size,
      maxWidth: spec.maxWidth,
    });
  }

  return await pdfDoc.save();
}

function downloadBytes(bytes: Uint8Array, name: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------------------
// Component
// ------------------------
const PriorAuthPdfFiller: React.FC<PriorAuthPdfFillerProps> = ({
  src,
  data,
  fieldMap,
  fileName = "HiLab-Prior-Authorization-Request-Form_FILLED.pdf",
  buttonLabel = "Download Filled PDF",
  className,
  disabled,
  onBeforeDownload,
  debugGrid,
  showCrosshairs,
  xOffset,
  yOffset,
  pageOffsets,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (disabled || busy) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await getBytes(src);
      const filled = await fillBytes(bytes, data, fieldMap, {
        debugGrid,
        showCrosshairs,
        xOffset,
        yOffset,
        pageOffsets,
      });
      const blob = new Blob([filled], { type: "application/pdf" });
      const allow = onBeforeDownload?.(blob);
      if (allow === false) {
        setBusy(false);
        return;
      }
      downloadBytes(filled, fileName);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to generate PDF");
    } finally {
      setBusy(false);
    }
  }, [src, data, fieldMap, fileName, onBeforeDownload, disabled, busy, debugGrid, showCrosshairs, xOffset, yOffset, pageOffsets]);

  const label = useMemo(() => (busy ? "Generating…" : buttonLabel), [busy, buttonLabel]);

  return (
    <div className="w-full max-w-md">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || busy}
        className={
          className ||
          "px-4 py-2 rounded-2xl shadow text-sm font-medium border hover:shadow-md disabled:opacity-50"
        }
      >
        {label}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default PriorAuthPdfFiller;

// ------------------------
// Example field map (adjust x,y with your grid PDF)
// You can move this to its own file and import where needed.
export const exampleFieldMap: FieldMap = {
  'patient.first_name': { page: 0, x: 95,  y: 540, size: 10, maxWidth: 120 },
  'patient.last_name':  { page: 0, x: 260, y: 540, size: 10, maxWidth: 140 },
  'patient.phone':      { page: 0, x: 504, y: 540, size: 10, maxWidth: 110 },
  'patient.address':    { page: 0, x: 95,  y: 518, size: 10, maxWidth: 300 },
  'patient.city':       { page: 0, x: 300,  y: 520, size: 10, maxWidth: 150 },
  'patient.state':      { page: 0, x: 455, y: 520, size: 10, maxWidth: 40 },
  'patient.zip':        { page: 0, x: 535, y: 520, size: 10, maxWidth: 70 },
  'patient.dob':        { page: 0, x: 40,  y: 500, size: 10, maxWidth: 100 },
  'patient.sex_male':   { page: 0, x: 150, y: 506, type: 'checkbox' },
  'patient.sex_female': { page: 0, x: 150, y: 502, type: 'checkbox' },

  'insurance.primary':      { page: 0, x: 144,  y: 420, size: 10, maxWidth: 200 },
  'insurance.primary_id':   { page: 0, x: 396, y: 420, size: 10, maxWidth: 200 },
  'insurance.secondary':    { page: 0, x: 95,  y: 514, size: 10, maxWidth: 200 },
  'insurance.secondary_id': { page: 0, x: 360, y: 514, size: 10, maxWidth: 200 },

  'prescriber.first_name': { page: 0, x: 95,  y: 482, size: 10, maxWidth: 120 },
  'prescriber.last_name':  { page: 0, x: 260, y: 482, size: 10, maxWidth: 140 },
  'prescriber.specialty':  { page: 0, x: 455, y: 482, size: 10, maxWidth: 110 },
  'prescriber.address':    { page: 0, x: 95,  y: 464, size: 10, maxWidth: 300 },
  'prescriber.city':       { page: 0, x: 95,  y: 446, size: 10, maxWidth: 150 },
  'prescriber.state':      { page: 0, x: 275, y: 446, size: 10, maxWidth: 40 },
  'prescriber.zip':        { page: 0, x: 335, y: 446, size: 10, maxWidth: 70 },
  'prescriber.npi':        { page: 0, x: 95,  y: 428, size: 10, maxWidth: 140 },
  'prescriber.phone':      { page: 0, x: 260, y: 428, size: 10, maxWidth: 140 },
  'prescriber.dea':        { page: 0, x: 420, y: 428, size: 10, maxWidth: 80 },
  'prescriber.fax':        { page: 0, x: 510, y: 428, size: 10, maxWidth: 80 },
  'prescriber.email':      { page: 0, x: 95,  y: 410, size: 10, maxWidth: 250 },

  'med.name':           { page: 0, x: 110, y: 250, size: 10, maxWidth: 360 },
  'med.da_w':           { page: 0, x: 95,  y: 362, type: 'checkbox' },
  'med.generic_ok':     { page: 0, x: 240, y: 362, type: 'checkbox' },
  'med.new_therapy':    { page: 0, x: 95,  y: 336, type: 'checkbox' },
  'med.renewal':        { page: 0, x: 160, y: 336, type: 'checkbox' },
  'pharmacy.name':      { page: 0, x: 95,  y: 306, size: 10, maxWidth: 420 },
  'pharmacy.phone':     { page: 0, x: 95,  y: 288, size: 10, maxWidth: 160 },
  'pharmacy.fax':       { page: 0, x: 300, y: 288, size: 10, maxWidth: 160 },
  'med.dose_strength':  { page: 0, x: 95,  y: 258, size: 10, maxWidth: 120 },
  'med.frequency':      { page: 0, x: 220, y: 258, size: 10, maxWidth: 160 },
  'med.length_refills': { page: 0, x: 385, y: 258, size: 10, maxWidth: 200 },
  'med.quantity_30d':   { page: 0, x: 520, y: 240, size: 10, maxWidth: 60 },

  'p2.patient_name': { page: 1, x: 95,  y: 640, size: 10, maxWidth: 220 },
  'p2.id':           { page: 1, x: 360, y: 640, size: 10, maxWidth: 180 },
  'p2.trials': {
    page: 1, x: 70, y: 600, type: 'table', rowHeight: 14, maxRows: 6,
    columns: [
      { key: 'drug',     width: 220, gap: 10 },
      { key: 'duration', width: 140, gap: 10 },
      { key: 'response', width: 180, gap: 10 },
    ],
  },
  'p2.icd10':         { page: 1, x: 95, y: 504, size: 10, maxWidth: 450 },
  'p2.clinical_info': { page: 1, x: 95, y: 468, size: 10, maxWidth: 460 },
  'p2.current_meds':  { page: 1, x: 95, y: 370, size: 10, maxWidth: 460 },
  'p2.attest.signature': { page: 1, x: 95,  y: 140, size: 10, maxWidth: 220 },
  'p2.attest.date':      { page: 1, x: 360, y: 140, size: 10, maxWidth: 120 },
};

// ------------------------
// Example usage (JSX)
//
// <PriorAuthPdfFiller
//   src={"/HiLab-Prior-Authorization-Request-Form_1-28-22.pdf"}
//   data={{
//     'patient.first_name': 'Jane',
//     'patient.last_name': 'Doe',
//     'patient.phone': '(555) 123-4567',
//     'patient.address': '123 Main St',
//     'patient.city': 'Charlotte',
//     'patient.state': 'NC',
//     'patient.zip': '28223',
//     'patient.dob': '1990-01-01',
//     'patient.sex_female': true,
//     'insurance.primary': 'Blue Cross',
//     'insurance.primary_id': 'ABC12345',
//     'med.name': 'MedExample 40 mg',
//     'p2.patient_name': 'Jane Doe',
//     'p2.id': 'ABC12345',
//     'p2.trials': [
//       { drug: 'DrugA 20mg', duration: '01/2024–03/2024', response: 'Ineffective' },
//       { drug: 'DrugB 10mg', duration: '03/2024–05/2024', response: 'Allergy (rash)' },
//     ],
//     'p2.icd10': 'E11.9; I10',
//   }}
//   fieldMap={exampleFieldMap}
//   fileName="HiLab-Prior-Authorization-Request-Form_FILLED.pdf"
//   // Calibration helpers
//   debugGrid
//   showCrosshairs
//   yOffset={-48}
//   pageOffsets={{ 1: { y: -56 } }}
// />
