/**
 * app.js
 * ------
 * UI controller. Handles tab switching, form wiring, dashboard rendering,
 * and triggering the report/PDF flows. All persistence goes through
 * storage.js and all domain logic lives in client.js / report.js.
 */

import { storage } from './modules/storage.js';
import {
  newClient,
  updateClient,
  addMetric,
  removeMetric,
  latestMetric,
  firstMetric,
} from './modules/client.js';
import { generateAudit, renderAuditHTML } from './modules/report.js';

// -----------------------------------------------------------------------
// State + helpers
// -----------------------------------------------------------------------

const state = {
  currentClientId: null,
  currentReport: null,
};

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const fmtDate = (iso) => (iso ? iso : '—');

// -----------------------------------------------------------------------
// Tab switching
// -----------------------------------------------------------------------

function initTabs() {
  $$('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });
}

function showTab(tab) {
  $$('.tab-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  $$('.tab-panel').forEach((p) =>
    p.classList.toggle('active', p.id === `tab-${tab}`)
  );
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'reports') refreshReportTab();
}

// -----------------------------------------------------------------------
// Client list + profile form
// -----------------------------------------------------------------------

function renderClientList() {
  const list = $('#client-list');
  const clients = storage.all();
  list.innerHTML = '';

  if (!clients.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No clients yet. Click + New to add one.';
    list.appendChild(li);
    return;
  }

  clients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((c) => {
      const li = document.createElement('li');
      li.textContent = `${c.name} · ${c.age}`;
      if (c.id === state.currentClientId) li.classList.add('active');
      li.addEventListener('click', () => selectClient(c.id));
      list.appendChild(li);
    });
}

function clearClientForm() {
  const form = $('#client-form');
  form.reset();
  form.elements.id.value = '';
}

function selectClient(id) {
  const client = storage.get(id);
  if (!client) return;

  state.currentClientId = id;
  const form = $('#client-form');
  form.hidden = false;
  $('#client-empty').hidden = true;
  $('#metrics-section').hidden = false;

  form.elements.id.value = client.id;
  form.elements.name.value = client.name;
  form.elements.age.value = client.age;
  form.elements.gender.value = client.gender;
  form.elements.heightCm.value = client.baseline.heightCm ?? '';
  form.elements.weightKg.value = client.baseline.weightKg ?? '';
  form.elements.bodyFatPct.value = client.baseline.bodyFatPct ?? '';
  form.elements.restingHR.value = client.baseline.restingHR ?? '';
  form.elements.goals.value = client.goals;
  form.elements.injuries.value = client.injuries;

  // Default metric-entry date = today
  $('#metric-form').elements.date.value = new Date()
    .toISOString()
    .slice(0, 10);

  renderMetricHistory(client);
  renderClientList();
}

function startNewClient() {
  state.currentClientId = null;
  const form = $('#client-form');
  clearClientForm();
  form.hidden = false;
  $('#client-empty').hidden = true;
  $('#metrics-section').hidden = true;
  form.elements.name.focus();
  renderClientList();
}

function handleClientFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());

  let client;
  if (data.id) {
    const existing = storage.get(data.id);
    if (!existing) return;
    client = updateClient(existing, data);
  } else {
    client = newClient(data);
  }

  storage.upsert(client);
  state.currentClientId = client.id;
  selectClient(client.id);
  toast(`Saved ${client.name}`);
}

function handleDeleteClient() {
  if (!state.currentClientId) return;
  const c = storage.get(state.currentClientId);
  if (!c) return;
  if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;

  storage.remove(c.id);
  state.currentClientId = null;
  clearClientForm();
  $('#client-form').hidden = true;
  $('#client-empty').hidden = false;
  $('#metrics-section').hidden = true;
  renderClientList();
  toast(`Deleted ${c.name}`);
}

function handleCancelClient() {
  if (state.currentClientId) {
    selectClient(state.currentClientId);
  } else {
    clearClientForm();
    $('#client-form').hidden = true;
    $('#client-empty').hidden = false;
  }
}

// -----------------------------------------------------------------------
// Metric entry + history
// -----------------------------------------------------------------------

function handleMetricFormSubmit(e) {
  e.preventDefault();
  if (!state.currentClientId) return;
  const data = Object.fromEntries(new FormData(e.target).entries());
  if (!data.date) return;

  const client = storage.get(state.currentClientId);
  const updated = addMetric(client, data);
  storage.upsert(updated);

  e.target.reset();
  $('#metric-form').elements.date.value = new Date().toISOString().slice(0, 10);
  renderMetricHistory(updated);
  toast('Entry logged');
}

function renderMetricHistory(client) {
  const host = $('#metric-history');
  if (!client.metrics.length) {
    host.innerHTML = '<p class="muted">No entries yet.</p>';
    return;
  }

  const rows = client.metrics
    .slice()
    .reverse()
    .map(
      (m) => `
      <tr>
        <td>${fmtDate(m.date)}</td>
        <td>${m.strength.squat ?? '—'}</td>
        <td>${m.strength.bench ?? '—'}</td>
        <td>${m.strength.deadlift ?? '—'}</td>
        <td>${m.conditioning.vo2max ?? '—'}</td>
        <td>${m.conditioning.mileTime ?? '—'}</td>
        <td>${m.body.weightKg ?? '—'}</td>
        <td>${m.body.bodyFatPct ?? '—'}</td>
        <td><button class="btn ghost small" data-del="${m.date}">×</button></td>
      </tr>
    `
    )
    .join('');

  host.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Squat</th><th>Bench</th><th>Dead</th>
          <th>VO₂</th><th>Mile</th><th>Wt</th><th>BF%</th><th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  host.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.del;
      if (!confirm(`Delete entry from ${date}?`)) return;
      const current = storage.get(state.currentClientId);
      const updated = removeMetric(current, date);
      storage.upsert(updated);
      renderMetricHistory(updated);
    });
  });
}

// -----------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------

function populateClientSelect(selectEl) {
  const current = selectEl.value;
  const clients = storage.all();
  selectEl.innerHTML = '';
  if (!clients.length) {
    const opt = document.createElement('option');
    opt.textContent = 'No clients';
    opt.disabled = true;
    selectEl.appendChild(opt);
    return;
  }
  clients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      selectEl.appendChild(opt);
    });
  if (current && clients.find((c) => c.id === current)) {
    selectEl.value = current;
  } else if (state.currentClientId) {
    selectEl.value = state.currentClientId;
  }
}

function renderDashboard() {
  const select = $('#dash-client');
  populateClientSelect(select);
  const id = select.value;
  const content = $('#dash-content');

  if (!id || !storage.get(id)) {
    content.innerHTML = '<p class="muted">No client selected.</p>';
    return;
  }

  const client = storage.get(id);
  if (!client.metrics.length) {
    content.innerHTML = `<p class="muted">No performance data for ${escapeHtml(
      client.name
    )} yet. Log an entry on the Clients tab.</p>`;
    return;
  }

  const last = latestMetric(client);
  const first = firstMetric(client);

  const kpis = [
    {
      label: 'Squat 1RM',
      value: last.strength.squat,
      unit: 'kg',
      delta: diff(first.strength.squat, last.strength.squat),
    },
    {
      label: 'Bench 1RM',
      value: last.strength.bench,
      unit: 'kg',
      delta: diff(first.strength.bench, last.strength.bench),
    },
    {
      label: 'Deadlift 1RM',
      value: last.strength.deadlift,
      unit: 'kg',
      delta: diff(first.strength.deadlift, last.strength.deadlift),
    },
    {
      label: 'VO₂ max',
      value: last.conditioning.vo2max,
      unit: '',
      delta: diff(first.conditioning.vo2max, last.conditioning.vo2max),
    },
    {
      label: 'Body Weight',
      value: last.body.weightKg,
      unit: 'kg',
      delta: diff(first.body.weightKg, last.body.weightKg),
    },
    {
      label: 'Body Fat',
      value: last.body.bodyFatPct,
      unit: '%',
      delta: diff(first.body.bodyFatPct, last.body.bodyFatPct),
    },
  ];

  const kpiHtml = kpis
    .filter((k) => k.value != null)
    .map((k) => {
      const cls = k.delta == null ? 'flat' : k.delta > 0 ? 'up' : k.delta < 0 ? 'down' : 'flat';
      const sign = k.delta > 0 ? '+' : '';
      const dText =
        k.delta == null ? 'no trend' : `${sign}${k.delta.toFixed(1)}${k.unit} since start`;
      return `
        <div class="metric-card">
          <h4>${k.label}</h4>
          <div class="value">${k.value}${k.unit}</div>
          <div class="delta ${cls}">${dText}</div>
        </div>`;
    })
    .join('');

  const charts = [
    { title: 'Squat (kg)',    get: (m) => m.strength.squat },
    { title: 'Bench (kg)',    get: (m) => m.strength.bench },
    { title: 'Deadlift (kg)', get: (m) => m.strength.deadlift },
    { title: 'VO₂ max',       get: (m) => m.conditioning.vo2max },
    { title: 'Body weight (kg)', get: (m) => m.body.weightKg },
    { title: 'Body fat (%)',  get: (m) => m.body.bodyFatPct },
  ]
    .map((cfg) => {
      const series = client.metrics
        .map((m) => ({ date: m.date, value: cfg.get(m) }))
        .filter((p) => p.value != null);
      if (series.length < 2) return '';
      return `
        <div class="chart-wrap">
          <div class="chart-title">${cfg.title}</div>
          ${lineChart(series)}
        </div>`;
    })
    .filter(Boolean)
    .join('');

  content.innerHTML = `
    <div class="metric-grid">${kpiHtml}</div>
    ${charts || '<p class="muted">Log at least two entries to see trends.</p>'}
  `;
}

function diff(a, b) {
  if (a == null || b == null) return null;
  return b - a;
}

/**
 * Builds a minimal inline-SVG line chart. No dependencies.
 */
function lineChart(series) {
  const W = 600;
  const H = 160;
  const pad = 28;
  const values = series.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i) => pad + (i * (W - pad * 2)) / (series.length - 1 || 1);
  const y = (v) => H - pad - ((v - min) / range) * (H - pad * 2);

  const pts = series.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const dots = series
    .map(
      (p, i) =>
        `<circle cx="${x(i)}" cy="${y(p.value)}" r="3" fill="#0f766e" />`
    )
    .join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff" />
      <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#e5e7eb" />
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" stroke="#e5e7eb" />
      <polyline points="${pts}" fill="none" stroke="#0f766e" stroke-width="2" />
      ${dots}
      <text x="${pad}" y="${pad - 6}" font-size="10" fill="#6b7280">${min.toFixed(1)}–${max.toFixed(1)}</text>
    </svg>
  `;
}

// -----------------------------------------------------------------------
// Reports
// -----------------------------------------------------------------------

function refreshReportTab() {
  const sel = $('#report-client');
  populateClientSelect(sel);
}

function handleGenerateReport() {
  const id = $('#report-client').value;
  const client = storage.get(id);
  if (!client) {
    $('#report-output').innerHTML =
      '<p class="muted">Select a client first.</p>';
    return;
  }
  const audit = generateAudit(client);
  state.currentReport = audit;
  $('#report-output').innerHTML = renderAuditHTML(audit);
}

function handleExportPdf() {
  if (!state.currentReport) {
    alert('Generate a report first.');
    return;
  }
  // Use the browser's native print → "Save as PDF" flow.
  // The print stylesheet in styles.css hides every non-report element,
  // producing a clean, paginated document.
  window.print();
}

// -----------------------------------------------------------------------
// Utility: lightweight toast + HTML escape
// -----------------------------------------------------------------------

function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#111827',
      color: '#fff',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      fontSize: '0.85rem',
      opacity: '0',
      transition: 'opacity 0.2s',
      zIndex: 9999,
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.style.opacity = '0'), 1600);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// -----------------------------------------------------------------------
// Sample data (for quick demo)
// -----------------------------------------------------------------------

function loadSampleClient() {
  const sample = newClient({
    name: 'Alex Rivera',
    age: 32,
    gender: 'Male',
    heightCm: 178,
    weightKg: 82,
    bodyFatPct: 18,
    restingHR: 68,
    goals: 'Gain lean muscle and improve squat 1RM to 150kg',
    injuries: 'Prior right knee meniscus trim (2022)',
  });

  const dates = ['2026-01-05', '2026-02-02', '2026-03-01', '2026-04-05'];
  const progression = [
    { squat: 105, bench: 85, deadlift: 130, vo2max: 38, mileTime: 8.9, mWeight: 82, mBf: 18 },
    { squat: 112, bench: 88, deadlift: 137, vo2max: 39, mileTime: 8.5, mWeight: 82.5, mBf: 17.5 },
    { squat: 120, bench: 92, deadlift: 145, vo2max: 41, mileTime: 8.2, mWeight: 83, mBf: 17 },
    { squat: 125, bench: 95, deadlift: 152, vo2max: 42, mileTime: 7.9, mWeight: 83, mBf: 16.5 },
  ];

  let c = sample;
  dates.forEach((d, i) => {
    c = addMetric(c, { date: d, ...progression[i] });
  });

  storage.upsert(c);
  state.currentClientId = c.id;
  renderClientList();
  selectClient(c.id);
  toast('Sample client loaded');
}

function wipeAll() {
  if (!confirm('Delete ALL clients and performance data? This cannot be undone.')) return;
  storage.clear();
  state.currentClientId = null;
  state.currentReport = null;
  clearClientForm();
  $('#client-form').hidden = true;
  $('#client-empty').hidden = false;
  $('#metrics-section').hidden = true;
  $('#report-output').innerHTML =
    '<p class="muted">Generate an audit to view strengths, weaknesses, and programming recommendations.</p>';
  $('#dash-content').innerHTML = '<p class="muted">Select a client to view trends.</p>';
  renderClientList();
  toast('All data cleared');
}

// -----------------------------------------------------------------------
// Bootstrap
// -----------------------------------------------------------------------

function init() {
  initTabs();
  renderClientList();

  $('#btn-new-client').addEventListener('click', startNewClient);
  $('#btn-cancel-client').addEventListener('click', handleCancelClient);
  $('#btn-delete-client').addEventListener('click', handleDeleteClient);
  $('#client-form').addEventListener('submit', handleClientFormSubmit);
  $('#metric-form').addEventListener('submit', handleMetricFormSubmit);

  $('#dash-client').addEventListener('change', renderDashboard);

  $('#report-client').addEventListener('change', () => (state.currentReport = null));
  $('#btn-generate').addEventListener('click', handleGenerateReport);
  $('#btn-pdf').addEventListener('click', handleExportPdf);

  $('#btn-seed').addEventListener('click', loadSampleClient);
  $('#btn-wipe').addEventListener('click', wipeAll);
}

document.addEventListener('DOMContentLoaded', init);
