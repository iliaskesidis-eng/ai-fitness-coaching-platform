// Performance Intelligence System — App Controller
// No framework, no build step. All modules are global objects loaded via script tags.

const App = {
  currentClient: null,
  currentTab: 'profile',

  init() {
    this._bindTabs();
    this._bindActions();
    this._bindLiveHints();
    this._showPlaceholder();
  },

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

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
    this.currentTab = id;
  },

  // -----------------------------------------------------------------------
  // Action bindings
  // -----------------------------------------------------------------------

  _bindActions() {
    document.getElementById('btn-new').addEventListener('click', () => this.newClient());
    document.getElementById('btn-load').addEventListener('click', () => this.openLoadModal());
    document.getElementById('btn-save').addEventListener('click', () => this.saveClient());
    document.getElementById('btn-generate').addEventListener('click', () => this.generateReport());
    document.getElementById('btn-export-pdf').addEventListener('click', () => Report.exportPDF());
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('load-modal').addEventListener('click', e => {
      if (e.target === e.currentTarget) this.closeModal();
    });
  },

  // -----------------------------------------------------------------------
  // Live strength ratio hints on metrics tab
  // -----------------------------------------------------------------------

  _bindLiveHints() {
    const update = () => {
      const wt  = parseFloat(document.getElementById('weight').value);
      const sq  = parseFloat(document.getElementById('squat1RM').value);
      const bp  = parseFloat(document.getElementById('bench1RM').value);
      const dl  = parseFloat(document.getElementById('deadlift1RM').value);
      const vo2 = parseFloat(document.getElementById('vo2max').value);

      const hint = (id, lift, ratio) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!wt || !lift) { el.textContent = ''; return; }
        const r = (lift / wt).toFixed(2);
        const label = ratio < 0.75 ? 'Below average' : ratio < 1.25 ? 'Intermediate' : ratio < 1.75 ? 'Advanced' : 'Elite';
        el.textContent = `${r}× BW — ${label}`;
      };

      hint('squat-ratio',  sq, sq / wt);
      hint('bench-ratio',  bp, bp / wt);
      hint('dl-ratio',     dl, dl / wt);

      const vo2El = document.getElementById('vo2-level');
      if (vo2El) {
        if (!vo2) { vo2El.textContent = ''; return; }
        const lbl = vo2 < 30 ? 'Poor' : vo2 < 38 ? 'Below average' : vo2 < 45 ? 'Average' : vo2 < 54 ? 'Good' : 'Excellent';
        vo2El.textContent = lbl;
      }
    };

    ['weight','squat1RM','bench1RM','deadlift1RM','vo2max'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', update);
    });
  },

  // -----------------------------------------------------------------------
  // Client CRUD
  // -----------------------------------------------------------------------

  newClient() {
    if (!confirm('Start a new client? Any unsaved changes will be lost.')) return;
    this.currentClient = null;
    Client.toForm(Client.createEmpty());
    this._showPlaceholder();
    this._setCurrentName('New Client');
    this.switchTab('profile');
  },

  saveClient() {
    const client = Client.fromForm();
    const errors = Client.validate(client);
    if (errors.length) { this._toast(errors.join('. '), 'error'); return; }

    if (this.currentClient) {
      client.id        = this.currentClient.id;
      client.createdAt = this.currentClient.createdAt;
    }

    const id = Storage.saveClient(client);
    this.currentClient = { ...client, id };
    this._toast('Client saved', 'success');
    this._setCurrentName(client.profile.fullName);
  },

  generateReport() {
    const client = Client.fromForm();
    const errors = Client.validate(client);
    if (errors.length) { this._toast(errors.join('. '), 'error'); return; }

    const classification = Classification.classify(client);
    const diagnostics    = Diagnostics.process(client);
    const plan           = Planning.generate(client, classification);
    const reportData     = Report.generate(client, classification, diagnostics, plan);
    Report.render(reportData, 'report-output');

    this.switchTab('report');
    this._toast('Report generated', 'success');
  },

  // -----------------------------------------------------------------------
  // Load modal
  // -----------------------------------------------------------------------

  openLoadModal() {
    const clients = Storage.listClients()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const list = document.getElementById('client-list-modal');

    if (!clients.length) {
      list.innerHTML = '<p class="modal-empty">No saved clients found.</p>';
    } else {
      list.innerHTML = clients.map(c => `
        <div class="modal-client-row" data-id="${c.id}">
          <span class="mc-name">${this._esc(c.name || 'Unnamed')}</span>
          <span class="mc-date">${new Date(c.updatedAt).toLocaleDateString()}</span>
          <button class="btn-sm btn-load-c" data-id="${c.id}">Load</button>
          <button class="btn-sm btn-del-c" data-id="${c.id}">Delete</button>
        </div>
      `).join('');

      list.querySelectorAll('.btn-load-c').forEach(btn =>
        btn.addEventListener('click', () => { this._loadClient(btn.dataset.id); this.closeModal(); })
      );
      list.querySelectorAll('.btn-del-c').forEach(btn =>
        btn.addEventListener('click', () => {
          if (confirm('Delete this client?')) {
            Storage.deleteClient(btn.dataset.id);
            btn.closest('.modal-client-row').remove();
          }
        })
      );
    }

    document.getElementById('load-modal').classList.add('open');
  },

  closeModal() {
    document.getElementById('load-modal').classList.remove('open');
  },

  _loadClient(id) {
    const client = Storage.loadClient(id);
    if (!client) { this._toast('Could not load client', 'error'); return; }
    this.currentClient = client;
    Client.toForm(client);
    this._setCurrentName(client.profile.fullName);
    this._showPlaceholder();
    this.switchTab('profile');
    this._toast('Client loaded', 'success');
  },

  // -----------------------------------------------------------------------
  // UI helpers
  // -----------------------------------------------------------------------

  _showPlaceholder() {
    document.getElementById('report-output').innerHTML = `
      <div class="report-placeholder">
        <div class="rp-icon">&#9679;</div>
        <h3>No Report Generated</h3>
        <p>Complete the client profile, metrics, and movement data,<br>
           then click <strong>Generate Report</strong> to produce a classified coaching assessment.</p>
      </div>
    `;
  },

  _setCurrentName(name) {
    const el = document.getElementById('current-client-name');
    if (el) el.textContent = name || 'New Client';
  },

  _toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'toast show ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2800);
  },

  _esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
