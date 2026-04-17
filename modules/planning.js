/**
 * planning.js
 * Generates a structured 2-phase training / rehab plan.
 *
 * Each phase object contains:
 *   name, duration, objective, weeklyStructure,
 *   intensityGuidance, exerciseEmphasis[], conditioningEmphasis, constraints
 */

const Planning = {

  // Entry point — returns { phase1, phase2, keyConstraints[], progressionCriteria[] }
  generate(client, classification) {
    return {
      phase1:              this._buildPhase(1, client, classification),
      phase2:              this._buildPhase(2, client, classification),
      keyConstraints:      this._keyConstraints(client, classification),
      progressionCriteria: this._progressionCriteria(client, classification)
    };
  },

  // Build a single phase object
  _buildPhase(phaseNum, client, cls) {
    // TODO: branch on cls.pathway, cls.phase, cls.strengthLevel
    //       to select the appropriate phase template
    return {
      name:              `Phase ${phaseNum} — Placeholder`,
      duration:          'TBD',
      objective:         'Placeholder objective.',
      weeklyStructure:   'TBD',
      intensityGuidance: 'TBD',
      exerciseEmphasis:  ['Placeholder exercise'],
      conditioningEmphasis: 'Placeholder conditioning.',
      constraints:       ''
    };
  },

  // Derive hard constraints from client limiters and demographics
  _keyConstraints(client, cls) {
    // TODO: pull from limiters (priority 0–1), age, pain status
    return [];
  },

  // Define measurable criteria that gate progression from Phase 1 → 2
  _progressionCriteria(client, cls) {
    // TODO: derive from pathway and phase
    return [];
  }
};
