/**
 * app.js
 * App controller — tabs, save/load, report orchestration.
 * No framework. All modules are loaded as plain <script> tags.
 */

const App = {
  currentClient: null,

  init() {
    this._bindTabs();
    this._bindActions();
    this._showPlaceholder();
  },

  // --- Navigation ---

  _bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
  },

  switchTab(id) {
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === id)
    );
    document.querySelectorAll('.tab-panel').forEach(p =>
      p.classList.toggle('active', p.id === 'tab-' + id)
    );
  },

  // --- Header action bindings ---

  _bindActions() {
    document.getElementById('btn-new').addEventListener('click',      () => this.newClient());
    document.getElementById('btn-load').addEventListener('click',     () => this.openLoadModal());
    document.getElementById('btn-save').addEventListener('click',     () => this.saveClient());
    document.getElementById('btn-generate').addEventListener('click', () => this.generateReport());
    document.getElementById('btn-export-pdf').addEventListener('click', () => Report.exportPDF());
    document.getElementById('modal-close').addEventListener('click',  () => this.closeModal());
    document.getElementById('load-modal').addEventListener('click', e => {
      if (e.target === e.currentTarget) this.closeModal();
    });
  },

  // --- Client CRUD ---

  newClient() {
    // TODO: confirm, reset form, clear report
    this.currentClient = null;
    this._showPlaceholder();
    this._setClientName('New Client');
    this.switchTab('profile');
  },

  saveClient() {
    // TODO: Client.fromForm() → validate → Storage.saveClient()
    this._toast('Save not yet implemented', 'info');
  },

  generateReport() {
    // TODO: fromForm → validate → classify → diagnose → plan → render
    // Orchestration sequence:
    //   const client         = Client.fromForm();
    //   const classification = Classification.classify(client);
    //   const diagnostics    = Diagnostics.process(client);
    //   const plan           = Planning.generate(client, classification);
    //   const reportData     = Report.generate(client, classification, diagnostics, plan);
    //   Report.render(reportData, 'report-output');
    this._toast('Report generation not yet implemented', 'info');
    this.switchTab('report');
  },

  // --- Load modal ---

  openLoadModal() {
    // TODO: list saved clients from Storage.listClients()
    document.getElementById('load-modal').classList.add('open');
  },

  closeModal() {
    document.getElementById('load-modal').classList.remove('open');
  },

  // --- UI helpers ---

  _showPlaceholder() {
    document.getElementById('report-output').innerHTML = `
      <div class="report-placeholder">
        <div class="rp-icon">&#9679;</div>
        <h3>No Report Generated</h3>
        <p>Complete the client profile and click <strong>Generate Report</strong>.</p>
      </div>`;
  },

  _setClientName(name) {
    const el = document.getElementById('current-client-name');
    if (el) el.textContent = name || 'New Client';
  },

  _toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2800);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
