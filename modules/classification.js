const Classification = {

  classify(client) {
    const pathway   = this.getPathway(client);
    const phase     = this.getPhase(client, pathway);
    const limiters  = this.identifyLimiters(client);
    const strengthLevel     = this.getStrengthLevel(client);
    const conditioningLevel = this.getConditioningLevel(client);

    return {
      pathway,
      phase,
      limiters,
      strengthLevel,
      conditioningLevel,
      rationale: this.buildRationale(client, pathway, phase, limiters)
    };
  },

  // -----------------------------------------------------------------------
  // Pathway
  // -----------------------------------------------------------------------

  getPathway(client) {
    const ct     = client.profile.clientType || '';
    const goals  = (client.profile.goals || '').toLowerCase();
    const injury = (client.profile.injuryHistory || '').toLowerCase();

    const hasPain = this._hasPain(client);
    const isAthlete = ct.startsWith('athlete');

    const strengthLevel     = this.getStrengthLevel(client);
    const conditioningLevel = this.getConditioningLevel(client);

    // Athlete pathways
    if (isAthlete) {
      if (ct === 'athlete_performance' &&
          !['very_low', 'low'].includes(strengthLevel) && !hasPain) {
        return 'Return to Performance';
      }
      if (ct === 'athlete_sport' ||
          (ct === 'athlete_performance' && strengthLevel === 'moderate')) {
        return 'Return to Sport';
      }
      return 'Return to Participation';
    }

    // Occupational / work
    if (ct === 'occupational' ||
        /\b(work|job|occupation|manual|return to work)\b/.test(goals)) {
      return 'Return to Work / Occupation';
    }

    // Rehab → ADLs
    if (ct === 'rehabilitation' ||
        /\b(adl|daily living|independence|functional)\b/.test(goals)) {
      return 'Return to ADLs';
    }

    // Light recreational
    if (/\b(recreational|leisure|light activity|hobby)\b/.test(goals)) {
      return 'Return to Light Recreational Activity';
    }

    // Default general population
    return 'Return to Fitness';
  },

  // -----------------------------------------------------------------------
  // Rehab / training phase
  // -----------------------------------------------------------------------

  getPhase(client, pathway) {
    const hasPain    = this._hasPain(client);
    const hasMobIssue  = (client.movement.mobilityRestrictions || '').length > 8;
    const hasStabIssue = (client.movement.stabilityDeficits || '').length > 8;
    const strengthLevel     = this.getStrengthLevel(client);
    const conditioningLevel = this.getConditioningLevel(client);

    if (hasPain) return 'Initial / Clinical Rehab';

    if ((hasMobIssue || hasStabIssue) &&
        ['very_low', 'low'].includes(strengthLevel)) {
      return 'Functional Reconditioning';
    }

    if (['very_low', 'low'].includes(strengthLevel) ||
        conditioningLevel === 'poor') {
      return 'Strength / Capacity Development';
    }

    if (pathway === 'Return to Performance' || pathway === 'Return to Sport') {
      return 'Performance Reintegration';
    }

    return 'Strength / Capacity Development';
  },

  // -----------------------------------------------------------------------
  // Strength classification (relative to BW)
  // -----------------------------------------------------------------------

  getStrengthLevel(client) {
    const wt = parseFloat(client.profile.weight);
    const sq = parseFloat(client.metrics.squat1RM);
    const dl = parseFloat(client.metrics.deadlift1RM);
    const bp = parseFloat(client.metrics.bench1RM);

    if (!wt || (!sq && !dl && !bp)) return 'unknown';

    let score = 0, count = 0;

    if (sq && wt) {
      const r = sq / wt;
      score += r < 0.5 ? 1 : r < 0.85 ? 2 : r < 1.25 ? 3 : r < 1.75 ? 4 : 5;
      count++;
    }
    if (dl && wt) {
      const r = dl / wt;
      score += r < 0.75 ? 1 : r < 1.1 ? 2 : r < 1.6 ? 3 : r < 2.25 ? 4 : 5;
      count++;
    }
    if (bp && wt) {
      const r = bp / wt;
      score += r < 0.4 ? 1 : r < 0.65 ? 2 : r < 1.0 ? 3 : r < 1.35 ? 4 : 5;
      count++;
    }

    if (!count) return 'unknown';
    const avg = score / count;
    if (avg < 1.5) return 'very_low';
    if (avg < 2.5) return 'low';
    if (avg < 3.5) return 'moderate';
    if (avg < 4.5) return 'advanced';
    return 'elite';
  },

  // -----------------------------------------------------------------------
  // Conditioning classification
  // -----------------------------------------------------------------------

  getConditioningLevel(client) {
    const vo2 = parseFloat(client.metrics.vo2max);
    const mt  = client.metrics.mileTime;

    if (vo2) {
      if (vo2 < 30) return 'poor';
      if (vo2 < 38) return 'below_average';
      if (vo2 < 45) return 'average';
      if (vo2 < 54) return 'good';
      return 'excellent';
    }

    if (mt) {
      const parts = mt.split(':');
      if (parts.length === 2) {
        const secs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        if (secs > 720) return 'poor';
        if (secs > 600) return 'below_average';
        if (secs > 480) return 'average';
        if (secs > 360) return 'good';
        return 'excellent';
      }
    }

    return 'unknown';
  },

  // -----------------------------------------------------------------------
  // Primary limiter identification
  // -----------------------------------------------------------------------

  identifyLimiters(client) {
    const limiters = [];
    const strengthLevel     = this.getStrengthLevel(client);
    const conditioningLevel = this.getConditioningLevel(client);
    const mv = client.movement;
    const d  = client.diagnostics;

    // Pain — top priority
    if (mv.painWithMovement &&
        !/^(none|no|n\/a)$/i.test(mv.painWithMovement.trim()) &&
        mv.painWithMovement.trim().length > 2) {
      limiters.push({
        category: 'Pain / Tissue Tolerance',
        priority: 0,
        finding: `Active pain reported with movement: ${mv.painWithMovement}`,
        recommendation: 'Clinical clearance and pain-free range must be confirmed before any progressive loading is introduced.'
      });
    }

    // Mobility
    if (mv.mobilityRestrictions && mv.mobilityRestrictions.trim().length > 5) {
      limiters.push({
        category: 'Mobility Restrictions',
        priority: 1,
        finding: `Mobility limitations identified: ${mv.mobilityRestrictions}`,
        recommendation: 'Address joint ROM deficits through targeted mobility work before loading end ranges under progressive load.'
      });
    }

    // Stability
    if (mv.stabilityDeficits && mv.stabilityDeficits.trim().length > 5) {
      limiters.push({
        category: 'Stability / Motor Control',
        priority: 1,
        finding: `Stability and motor control deficits noted: ${mv.stabilityDeficits}`,
        recommendation: 'Neuromuscular stabilisation work must precede dynamic and loaded progressions.'
      });
    }

    // Strength
    if (strengthLevel === 'very_low') {
      limiters.push({
        category: 'Foundational Strength Deficit',
        priority: 1,
        finding: 'Relative strength is significantly below age-matched norms across primary movement patterns.',
        recommendation: 'Progressive compound loading is the primary training stimulus. Foundational strength development precedes all other modalities.'
      });
    } else if (strengthLevel === 'low') {
      limiters.push({
        category: 'Below-Average Strength Levels',
        priority: 2,
        finding: 'Relative strength is below expected levels for training age and population norms.',
        recommendation: 'Structured progressive overload across squat, hinge, push, and pull patterns should be the core of Phase 1 programming.'
      });
    }

    // Conditioning
    if (conditioningLevel === 'poor') {
      limiters.push({
        category: 'Aerobic Capacity — Significantly Low',
        priority: 2,
        finding: 'Aerobic base is significantly below general population norms.',
        recommendation: 'Concurrent aerobic development is required alongside resistance training. Zone 2 work must be integrated from Phase 1.'
      });
    } else if (conditioningLevel === 'below_average') {
      limiters.push({
        category: 'Below-Average Aerobic Capacity',
        priority: 3,
        finding: 'Aerobic capacity is below average for age and activity level.',
        recommendation: 'Include 2–3 Zone 2 conditioning sessions weekly. Prioritise aerobic base before increasing intensity.'
      });
    }

    // Body composition
    const bf  = parseFloat(client.profile.bodyFat);
    const rhr = parseFloat(client.profile.restingHR);
    if (bf && bf > 30) {
      limiters.push({
        category: 'Body Composition',
        priority: 3,
        finding: `Body fat of ${bf}% places additional joint load and cardiovascular demand on daily function and training response.`,
        recommendation: 'Concurrent training approach with structured caloric management. Avoid extreme restriction — prioritise protein retention.'
      });
    }

    if (rhr && rhr > 80) {
      limiters.push({
        category: 'Cardiovascular Baseline',
        priority: 3,
        finding: `Resting HR of ${rhr} bpm suggests autonomic stress or baseline deconditioning.`,
        recommendation: 'Progressive low-intensity aerobic work and recovery optimisation (sleep, stress management) are primary interventions.'
      });
    }

    // Training age / experience
    const ta = parseFloat(client.profile.trainingAge);
    if ((!isNaN(ta) && ta === 0) || client.profile.clientType === 'youth') {
      limiters.push({
        category: 'Movement Literacy / Training Experience',
        priority: 2,
        finding: 'Limited or no prior structured training history. Movement skill acquisition is a primary need.',
        recommendation: 'Pattern coaching precedes progressive loading. Bodyweight competence in squat, hinge, push, and pull before adding external load.'
      });
    }

    // Diagnostic-derived limiters
    const nbImbalance = parseFloat(d.nordBord && d.nordBord.imbalance);
    if (nbImbalance && nbImbalance > 15) {
      limiters.push({
        category: 'Hamstring Strength Asymmetry (NordBord)',
        priority: 1,
        finding: `NordBord hamstring imbalance of ${nbImbalance}% exceeds the 15% clinical threshold for injury risk.`,
        recommendation: 'Unilateral hamstring loading required. Nordic curl progression with volume bias toward the weaker limb. Do not progress sprint intensity until imbalance reduces below 10%.'
      });
    }

    const fdAsym = parseFloat(d.forceDecks && d.forceDecks.asymmetry);
    if (fdAsym && fdAsym > 15) {
      limiters.push({
        category: 'Ground Reaction Force Asymmetry (ForceDecks)',
        priority: 1,
        finding: `CMJ bilateral asymmetry of ${fdAsym}% indicates a compensatory loading strategy under reactive demand.`,
        recommendation: 'Unilateral strength and plyometric work to correct GRF asymmetry. Split squats, single-leg RDL, and reactive asymmetry drills are priority.'
      });
    }

    const ffAsym = parseFloat(d.forceFrame && d.forceFrame.asymmetry);
    if (ffAsym && ffAsym > 15) {
      limiters.push({
        category: 'Isometric Strength Asymmetry (ForceFrame)',
        priority: 2,
        finding: `ForceFrame isometric profile shows ${ffAsym}% asymmetry across hip/shoulder strength.`,
        recommendation: 'Targeted unilateral strengthening required before advancing bilateral loading progressions.'
      });
    }

    limiters.sort((a, b) => a.priority - b.priority);
    return limiters;
  },

  // -----------------------------------------------------------------------
  // Rationale narrative
  // -----------------------------------------------------------------------

  buildRationale(client, pathway, phase, limiters) {
    const name     = client.profile.fullName || 'This client';
    const typeLabel = this.clientTypeLabel(client.profile.clientType);
    const top3     = limiters.slice(0, 3).map(l => l.category).join(', ');

    let r = `${name} has been classified as ${typeLabel} and assigned to the `;
    r += `<strong>${pathway}</strong> pathway, currently entering the `;
    r += `<strong>${phase}</strong> phase. `;

    if (top3) {
      r += `The primary limiting factors identified are: ${top3}. `;
    }

    r += `This classification reflects the intersection of current physical capacity, `;
    r += `movement quality, stated goals, and clinical status.`;
    return r;
  },

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  _hasPain(client) {
    const p = (client.movement.painWithMovement || '').toLowerCase().trim();
    return p.length > 2 && !/^(none|no|n\/a|0)$/.test(p);
  },

  clientTypeLabel(ct) {
    return {
      general_population:   'a general population adult',
      youth:                'a youth / first-time gym user',
      rehabilitation:       'a rehabilitation client',
      occupational:         'an occupational / return-to-work case',
      athlete_participation:'an athlete targeting return to participation',
      athlete_sport:        'an athlete targeting return to sport',
      athlete_performance:  'an athlete targeting return to full performance'
    }[ct] || 'a client';
  },

  strengthLabel(level) {
    return {
      very_low: 'Very Low',
      low:      'Low',
      moderate: 'Moderate',
      advanced: 'Advanced',
      elite:    'Elite',
      unknown:  'Not Assessed'
    }[level] || level;
  },

  conditioningLabel(level) {
    return {
      poor:          'Poor',
      below_average: 'Below Average',
      average:       'Average',
      good:          'Good',
      excellent:     'Excellent',
      unknown:       'Not Assessed'
    }[level] || level;
  }
};
