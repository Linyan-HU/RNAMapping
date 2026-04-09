#!/usr/bin/env node
import fs from 'node:fs';

function parseCsv(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch !== '\r') field += ch;
    }
    i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function wilson(successes, n, z = 1.96) {
  if (!n) return { p: NaN, lo: NaN, hi: NaN };
  const p = successes / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return { p, lo: (c - m) / d, hi: (c + m) / d };
}

function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return quantile(s, 0.5);
}

function bootstrapMedianCI(values, B = 2000) {
  if (!values.length) return { med: NaN, lo: NaN, hi: NaN };
  const meds = [];
  for (let b = 0; b < B; b++) {
    const sample = [];
    for (let i = 0; i < values.length; i++) sample.push(values[Math.floor(Math.random() * values.length)]);
    meds.push(median(sample));
  }
  meds.sort((a, b) => a - b);
  return { med: median(values), lo: quantile(meds, 0.025), hi: quantile(meds, 0.975) };
}

function toNum(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/t-stat-001-kpi.mjs <participant_task.csv>');
  process.exit(1);
}

const text = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsv(text);
const headers = rows.shift() || [];
const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
const required = ['success', 'time_seconds', 'critical_errors', 'seq_score', 'role_segment'];
const missingCols = required.filter(c => !(c in idx));
if (missingCols.length) {
  console.error(`Missing required columns: ${missingCols.join(', ')}`);
  process.exit(2);
}

const data = rows.map(r => ({
  success: toNum(r[idx.success]),
  time: toNum(r[idx.time_seconds]),
  err: toNum(r[idx.critical_errors]),
  seq: toNum(r[idx.seq_score]),
  role: r[idx.role_segment] || 'unknown'
}));

const n = data.length;
const successVals = data.filter(d => d.success !== null);
const timeVals = data.filter(d => d.time !== null).map(d => d.time);
const errVals = data.filter(d => d.err !== null).map(d => d.err);
const seqVals = data.filter(d => d.seq !== null).map(d => d.seq);

const tsrSucc = successVals.reduce((a, d) => a + (d.success ? 1 : 0), 0);
const tsr = wilson(tsrSucc, successVals.length);
const cerEvents = errVals.reduce((a, x) => a + (x > 0 ? 1 : 0), 0);
const cer = wilson(cerEvents, errVals.length);
const tot = bootstrapMedianCI(timeVals);
const seqMean = seqVals.reduce((a, x) => a + x, 0) / (seqVals.length || 1);

const miss = {
  success: 1 - successVals.length / n,
  time_seconds: 1 - timeVals.length / n,
  critical_errors: 1 - errVals.length / n,
  seq_score: 1 - seqVals.length / n,
};

const roles = [...new Set(data.map(d => d.role))];
const perRole = roles.map(role => {
  const r = data.filter(d => d.role === role && d.success !== null);
  const succ = r.reduce((a, d) => a + (d.success ? 1 : 0), 0);
  return { role, n: r.length, tsr: r.length ? succ / r.length : NaN };
});

console.log('# T-STAT-001 KPI Quick Summary');
console.log(`Rows: ${n}`);
console.log(`TSR: ${(tsr.p * 100).toFixed(1)}% (95% CI ${(tsr.lo * 100).toFixed(1)}–${(tsr.hi * 100).toFixed(1)}%)`);
console.log(`ToT median: ${tot.med.toFixed(1)}s (95% CI ${tot.lo.toFixed(1)}–${tot.hi.toFixed(1)})`);
console.log(`CER (>=1 critical error): ${(cer.p * 100).toFixed(1)}% (95% CI ${(cer.lo * 100).toFixed(1)}–${(cer.hi * 100).toFixed(1)}%)`);
console.log(`SEQ mean: ${seqMean.toFixed(2)} / 7`);
console.log('\nMissingness');
for (const [k, v] of Object.entries(miss)) console.log(`- ${k}: ${(v * 100).toFixed(1)}%`);
console.log('\nRole TSR');
for (const r of perRole) console.log(`- ${r.role}: n=${r.n}, TSR=${(r.tsr * 100).toFixed(1)}%`);
