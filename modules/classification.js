/**
 * classification.js
 * Pathway classification engine.
 *
 * Assigns a client to one of seven pathways and one of four rehab/training
 * phases based on client type, goals, strength levels, conditioning,
 * movement quality, and diagnostic data.
 *
 * Pathways
 * --------
 * General:  Return to ADLs | Return to Work/Occupation |
 *           Return to Light Recreational Activity | Return to Fitness
 * Athlete:  Return to Participation | Return to Sport | Return to Performance
 *
 * Phases
 * ------
 * Initial / Clinical Rehab → Functional Reconditioning →
 * Strength / Capacity Development → Performance Reintegration
 */

const Classification = {

  // Entry point — returns a full classification result object
  classify(client) {
    return {
      pathway:            this.getPathway(client),
      phase:              null,       // TODO: call getPhase()
      limiters:           [],         // TODO: call identifyLimiters()
      strengthLevel:      'unknown',  // TODO: call getStrengthLevel()
      conditioningLevel:  'unknown',  // TODO: call getConditioningLevel()
      rationale:          ''          // TODO: build narrative string
    };
  },

  // Determine which of the seven pathways applies
  getPathway(client) {
    // TODO: derive from clientType, goals, pain status, strength/conditioning
    return 'Return to Fitness';
  },

  // Determine which rehab/training phase applies given the pathway
  getPhase(client, pathway) {
    // TODO: use pain, mobility/stability issues, and capacity levels
    return 'Strength / Capacity Development';
  },

  // Classify relative strength from 1RM / BW ratios
  getStrengthLevel(client) {
    // Returns: 'very_low' | 'low' | 'moderate' | 'advanced' | 'elite' | 'unknown'
    // TODO: score squat, bench, deadlift ratios and average
    return 'unknown';
  },

  // Classify aerobic capacity from VO2 max or mile time
  getConditioningLevel(client) {
    // Returns: 'poor' | 'below_average' | 'average' | 'good' | 'excellent' | 'unknown'
    // TODO: parse vo2max; fall back to mileTime parsing
    return 'unknown';
  },

  // Build a ranked list of primary limiters
  identifyLimiters(client) {
    // TODO: check pain, mobility, stability, strength, conditioning,
    //       body comp, resting HR, training age, diagnostic asymmetries
    return [];
  },

  // True if client reports active pain with movement
  _hasPain(client) {
    const p = (client.movement.painWithMovement || '').toLowerCase().trim();
    return p.length > 2 && !/^(none|no|n\/a|0)$/.test(p);
  },

  // Human-readable labels
  clientTypeLabel(ct) {
    const map = {
      general_population:    'a general population adult',
      youth:                 'a youth / first-time gym user',
      rehabilitation:        'a rehabilitation client',
      occupational:          'an occupational / return-to-work case',
      athlete_participation: 'an athlete targeting return to participation',
      athlete_sport:         'an athlete targeting return to sport',
      athlete_performance:   'an athlete targeting return to full performance'
    };
    return map[ct] || 'a client';
  },

  strengthLabel(level) {
    return {
      very_low: 'Very Low', low: 'Low', moderate: 'Moderate',
      advanced: 'Advanced', elite: 'Elite', unknown: 'Not Assessed'
    }[level] || level;
  },

  conditioningLabel(level) {
    return {
      poor: 'Poor', below_average: 'Below Average', average: 'Average',
      good: 'Good', excellent: 'Excellent', unknown: 'Not Assessed'
    }[level] || level;
  }
};
