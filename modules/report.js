/**
 * report.js
 * Assembles and renders the coaching report.
 *
 * Section order (fixed):
 *  1. Pathway Classification
 *  2. Primary Limiters
 *  3. Diagnostic Summary
 *  4. Movement & Tissue Considerations
 *  5. Programming Priorities
 *  6. Structured 2-Phase Plan
 *  7. Targets & KPIs
 *  8. Stated Goals
 *  9. Injury & Limitation Summary
 */

const Report = {

  // Build the full report data object from processed inputs
  generate(client, classification, diagnostics, plan) {
    const date = new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    return {
      meta: {
        name: client.profile.fullName || 'Client',
        date,
        clientType: client.profile.clientType
      },
      sections: {
        pathway:               this._pathwaySection(client, classification),
        limiters:              this._limitersSection(classification.limiters),
        diagnosticSummary:     this._diagnosticsSection(diagnostics),
        movementConsid:        this._movementSection(client),
        programmingPriorities: this._prioritiesSection(client, classification, diagnostics),
        structuredPlan:        this._planSection(plan),
        targetsKPIs:           this._targetsSection(client, classification),
        statedGoals:           this._goalsSection(client),
        injurySummary:         this._injurySection(client)
      }
    };
  },

  // Render a report data object into a DOM container
  render(reportData, containerId) {
    // TODO: build full HTML string from section data and inject into container
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<p style="padding:2rem;color:#64748b;">
      Report rendering not yet implemented. Data: ${JSON.stringify(reportData.meta)}
    </p>`;
  },

  exportPDF() {
    window.print();
  },

  // --- Section builders (placeholders) ---

  _pathwaySection(client, cls) {
    return { title: 'Pathway Classification', content: '' };
    // TODO: pathway badge, phase badge, rationale text, classification grid
  },

  _limitersSection(limiters) {
    return { title: 'Primary Limiters', content: '' };
    // TODO: ranked limiter cards with priority, finding, action
  },

  _diagnosticsSection(diagnostics) {
    return { title: 'Diagnostic Summary', content: '' };
    // TODO: flags block + findings + diagnostic-driven recommendations
  },

  _movementSection(client) {
    return { title: 'Movement & Tissue Considerations', content: '' };
    // TODO: rows for each populated movement field; highlight pain
  },

  _prioritiesSection(client, cls, diagnostics) {
    return { title: 'Programming Priorities', content: '' };
    // TODO: ranked priority items derived from limiters, pathway, diagnostics
  },

  _planSection(plan) {
    return { title: 'Structured 2-Phase Plan', content: '' };
    // TODO: render phase1 and phase2 objects; progression criteria; constraints
  },

  _targetsSection(client, cls) {
    return { title: 'Targets & KPIs', content: '' };
    // TODO: strength targets (BW ratios), conditioning targets, KPI list
  },

  _goalsSection(client) {
    return { title: 'Stated Goals', content: '' };
    // TODO: goals text + occupation/sport context
  },

  _injurySection(client) {
    return { title: 'Injury & Limitation Summary', content: '' };
    // TODO: injury history + pain status + clinician note
  },

  // HTML-escape helper
  _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};
