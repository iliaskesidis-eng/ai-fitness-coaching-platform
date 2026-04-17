const Planning = {

  generate(client, classification) {
    const isAthlete = ['Return to Participation','Return to Sport','Return to Performance']
      .includes(classification.pathway);
    const isRehab   = classification.phase === 'Initial / Clinical Rehab';
    const isOccup   = classification.pathway === 'Return to Work / Occupation';

    return {
      phase1:              this._buildPhase1(client, classification, isAthlete, isRehab, isOccup),
      phase2:              this._buildPhase2(client, classification, isAthlete, isRehab, isOccup),
      keyConstraints:      this._keyConstraints(client, classification.limiters),
      progressionCriteria: this._progressionCriteria(client, classification)
    };
  },

  // -----------------------------------------------------------------------
  // Phase 1
  // -----------------------------------------------------------------------

  _buildPhase1(client, cls, isAthlete, isRehab, isOccup) {
    const { pathway, phase, strengthLevel } = cls;

    if (isRehab) {
      return {
        name:              'Phase 1 — Clinical Stabilisation & Tissue Tolerance',
        duration:          '3–4 weeks',
        objective:         'Establish pain-free movement, restore tissue tolerance across affected structures, and build a baseline of neuromuscular control. No aggressive loading until functional benchmarks are confirmed.',
        weeklyStructure:   '3 sessions per week on alternating days. Session length 45–60 minutes.',
        intensityGuidance: 'RPE 3–5 throughout. Sub-maximal, pain-free range only. Maximum 40–50% 1RM on affected patterns. No loaded end-range work.',
        exerciseEmphasis: [
          'Isolated activation: glute medius, VMO, deep spinal stabilisers, rotator cuff',
          'Bodyweight pattern re-education: hip hinge, split stance, wall push — within pain-free range',
          'Proprioceptive and balance work: single-leg stance progressions, perturbation training',
          'Positional breathing and core sequencing (dead bug, 90/90 breathing, bear crawl)'
        ],
        conditioningEmphasis: 'Low-intensity aerobic only: walking, stationary cycling, pool walking. Heart rate 50–65% max. 20–30 minutes steady state. Primary goal is tissue perfusion and nervous system down-regulation.',
        constraints:       'No high-impact activity. No loaded end-range positions. No bilateral maximum effort. All exercise within clinical guidelines. Pain ≤2/10 NRS is the upper boundary for all movements.'
      };
    }

    if (phase === 'Functional Reconditioning') {
      return {
        name:              'Phase 1 — Functional Reconditioning',
        duration:          '4–6 weeks',
        objective:         'Restore movement quality across primary patterns, correct compensation strategies, and develop base-level structural capacity before progressive loading is applied.',
        weeklyStructure:   '3–4 sessions per week: 2 full-body strength sessions, 1–2 conditioning and movement quality sessions.',
        intensityGuidance: 'RPE 5–7. Emphasis on movement quality over load. 55–70% 1RM where applicable. No grinding reps.',
        exerciseEmphasis: [
          'Movement pattern re-education: goblet squat, Romanian deadlift, dumbbell row, push-up / dumbbell press',
          'Unilateral emphasis: split squat, single-leg RDL, single-arm pressing and pulling',
          'Mobility and tissue preparation integrated into warm-up: hip 90/90, thoracic rotation, ankle dorsiflexion work',
          'Loaded carries and positional stability: farmer carry, single-arm carry, Pallof press, Copenhagen holds'
        ],
        conditioningEmphasis: 'Zone 2 aerobic base: 25–40 minutes, cycling or rowing preferred to minimise joint load where relevant. 2–3 sessions per week. Build continuous duration before intensity.',
        constraints:       'Do not progress load ahead of movement quality. Identify and correct major compensation patterns — valgus collapse, lumbar flexion under load, forward head posture — before increasing volume or intensity.'
      };
    }

    if (phase === 'Performance Reintegration') {
      return {
        name:              'Phase 1 — Performance Reintegration Entry',
        duration:          '3–5 weeks',
        objective:         'Re-establish near-competition strength outputs, restore power expression, and begin sport or activity-specific integration.',
        weeklyStructure:   isAthlete
          ? '4–5 sessions per week: 2 maximal strength, 1–2 power and speed, 1 conditioning and skill.'
          : '4 sessions per week alternating strength and conditioning.',
        intensityGuidance: 'RPE 7–9. Near-maximal intent on primary lifts. Explosive work at 85–95% of maximum effort. Velocity-monitored sets preferred.',
        exerciseEmphasis: [
          'Intensity phase primary lifts: back squat, conventional deadlift, bench press — 3–5 rep working sets',
          'Power development: hang power clean, trap bar jump, medicine ball rotational throw',
          'Speed-strength: loaded jump squats, drop jumps at appropriate box height, reactive bounding',
          'Structural accessories at moderate volume (3×8–12)'
        ],
        conditioningEmphasis: isAthlete
          ? 'Sport-specific conditioning: repeated sprint protocols, agility pattern work, position-specific demands. High-intensity intervals 2 sessions per week.'
          : 'High-intensity intervals 1–2 sessions per week. HIIT or Fartlek structure. Maintain 1 Zone 2 session for aerobic base.',
        constraints:       'Monitor bar velocity. Do not progress loading if mean velocity drops more than 20% from session baseline. Manage total weekly stress — sport sessions count as high-intensity training days.'
      };
    }

    // Default: Strength / Capacity Development
    return {
      name:              'Phase 1 — Strength & Capacity Foundation',
      duration:          '4–8 weeks',
      objective:         'Develop foundational absolute strength, increase structural capacity across primary movement patterns, and establish the work capacity base required for progression.',
      weeklyStructure:   parseInt(client.profile.trainingAge) > 2
        ? '3–4 strength sessions per week: upper/lower or push/pull/legs split depending on time available.'
        : '3 full-body sessions per week on alternating days.',
      intensityGuidance: 'RPE 6–8. Progressive loading across the block. 65–85% 1RM on primary lifts. Accumulation focus — volume precedes intensity in the early weeks.',
      exerciseEmphasis: [
        'Squat pattern: back squat, front squat, or goblet squat depending on mobility and experience',
        'Hip hinge: conventional deadlift, trap bar deadlift, or Romanian deadlift',
        'Horizontal push: barbell or dumbbell bench press progression',
        'Horizontal pull: barbell row, dumbbell row, cable row',
        'Accessory: hip thrust, Bulgarian split squat, Nordic hamstring curl progression'
      ],
      conditioningEmphasis: isAthlete
        ? 'Tempo runs and low-intensity bike intervals to maintain aerobic base: 2–3 sessions per week, Zone 2–3.'
        : 'Steady-state aerobic work 2–3 sessions per week, 30–40 minutes, Zone 2. Avoid excessive concurrent load in the first 4 weeks.',
      constraints:       'No maximal effort testing until 4 weeks of consistent loading has been completed. Monitor fatigue accumulation. Programme a formal deload at weeks 4–5.'
    };
  },

  // -----------------------------------------------------------------------
  // Phase 2
  // -----------------------------------------------------------------------

  _buildPhase2(client, cls, isAthlete, isRehab, isOccup) {
    const { pathway, phase, strengthLevel } = cls;

    if (isRehab) {
      return {
        name:              'Phase 2 — Functional Reconditioning',
        duration:          '4–6 weeks',
        objective:         'Transition from clinical management to functional loading. Progressive return to compound movement patterns and task-specific tolerance.',
        weeklyStructure:   '3–4 sessions per week: 2 progressive strength sessions, 1 dedicated conditioning, 1 optional movement quality session.',
        intensityGuidance: 'RPE 5–7. Moderate loads across full pain-free range. 60–75% 1RM progressively introduced. Bilateral loading re-introduced where clinically cleared.',
        exerciseEmphasis: [
          'Compound pattern reloading: goblet to front squat, RDL to conventional deadlift, dumbbell to barbell press',
          'Loaded carries and positional stability: farmer carry, single-arm carry, suitcase carry',
          'Unilateral strength maintenance: split squat, single-leg press, single-arm row',
          'Return to bilateral loading where clinically cleared and pain-free for 2+ consecutive sessions'
        ],
        conditioningEmphasis: 'Increase aerobic duration: 30–45 minutes Zone 2. Introduce short moderate-intensity intervals (Zone 3, 3×5 minutes) if pain-free for 2 consecutive sessions.',
        constraints:       'Maintain clinical oversight throughout Phase 2. Progress load only when pain-free status is confirmed across 2 or more consecutive sessions at each loading step.'
      };
    }

    if (phase === 'Functional Reconditioning' || strengthLevel === 'very_low' || strengthLevel === 'low') {
      return {
        name:              'Phase 2 — Strength Foundation & Progressive Loading',
        duration:          '6–8 weeks',
        objective:         'Build structured strength across all major movement patterns, increase tissue and structural capacity, and prepare for higher-intensity programming.',
        weeklyStructure:   '3–4 sessions per week: upper/lower or push/pull/legs split depending on goal and schedule.',
        intensityGuidance: 'RPE 7–8 on primary lifts. Systematic week-to-week load progression. 70–85% 1RM. Volume peaks at week 3–4, intensity phase follows.',
        exerciseEmphasis: [
          'Progressive overload on main lifts with structured increment protocol',
          'Posterior chain emphasis: Romanian deadlift, Nordic hamstring curl, hip thrust, back extension',
          'Unilateral strength maintenance and correction: Bulgarian split squat, single-arm press and row',
          'Core progression: dead bug, stir the pot, anti-rotation, loaded carries'
        ],
        conditioningEmphasis: 'Zone 2 base 3 sessions per week (30–40 minutes). Introduce 1 weekly moderate-intensity circuit for metabolic conditioning in weeks 4–8.',
        constraints:       'Avoid maximum effort testing before week 4. Movement quality screening at each session entry — do not sacrifice quality for load increases.'
      };
    }

    if (pathway === 'Return to Performance' || pathway === 'Return to Sport') {
      return {
        name:              'Phase 2 — Sport-Specific Performance Integration',
        duration:          '4–6 weeks',
        objective:         'Transfer physical capacities fully to sport-specific demands. Complete integration of strength, power, speed, and reactive qualities at competition intensity.',
        weeklyStructure:   '4–5 sessions per week: 2 heavy strength, 2–3 sport-specific conditioning and skill sessions.',
        intensityGuidance: 'RPE 8–9+ on primary efforts. Maximum velocity and power outputs. Maintain absolute load while increasing specificity of movement demands.',
        exerciseEmphasis: [
          'Maximum strength expression: heavy singles and doubles on primary lifts, prilepin-guided intensity',
          'Reactive plyometrics: depth jumps, lateral bounds, reactive cutting, drop-and-go patterns',
          'Sport-specific power: position-relevant explosive patterns, acceleration mechanics, overspeed work',
          'Structural maintenance volume reduced to allow full recovery for sport sessions'
        ],
        conditioningEmphasis: 'Sport-specific conditioning at full intensity. Game-demand simulations, repeated sprint ability protocols, and competition-pace preparation. Sport sessions count as high-intensity training days.',
        constraints:       'Total weekly load management is critical. Use subjective readiness and velocity monitoring to modulate gym intensity on sport-heavy weeks.'
      };
    }

    if (pathway === 'Return to Work / Occupation') {
      return {
        name:              'Phase 2 — Occupational Capacity & Progressive Loading',
        duration:          '6–8 weeks',
        objective:         'Build the physical capacity required to meet full occupational demands. Simulate task-specific loads progressively in a controlled environment.',
        weeklyStructure:   '3–4 sessions per week: 2 strength sessions, 1 work-simulation circuit, 1 conditioning.',
        intensityGuidance: 'RPE 6–8. Progressive loading towards occupational task demands. Strength testing at week 4–5 to confirm readiness for return.',
        exerciseEmphasis: [
          'Task-relevant loading: grip, carry, push, pull patterns specific to occupational demands',
          'Structural compound strength: deadlift, squat, overhead press progressions',
          'Endurance under load: circuit-style work with task-relevant implements',
          'Postural endurance: isometric holds, anti-fatigue work for extended occupational postures'
        ],
        conditioningEmphasis: 'Work capacity conditioning: circuit training or GPP block. Progressively increase duration and load density to match shift demands.',
        constraints:       'Confirm occupational task tolerances with treating clinician or occupational health team before Phase 2 completion and return planning.'
      };
    }

    return {
      name:              'Phase 2 — Progressive Load & Quality of Life Conditioning',
      duration:          '6–8 weeks',
      objective:         'Systematically increase training load and develop concurrent fitness qualities aligned with the client\'s stated goals and lifestyle demands.',
      weeklyStructure:   '3–4 sessions per week: 2–3 strength sessions, 1–2 conditioning sessions.',
      intensityGuidance: 'RPE 7–8. Progressive overload with planned deload at week 4–5. Intensity increases as volume stabilises.',
      exerciseEmphasis: [
        'Progressive overload on primary compound lifts across the block',
        'Hypertrophy-emphasis accessories (8–12 rep range) for structural development',
        'Goal-specific functional accessories aligned with lifestyle and activity demands',
        'Weekly movement quality check — maintain technique standards under progressive load'
      ],
      conditioningEmphasis: 'Mix of Zone 2 steady state (2 sessions per week) and higher-intensity intervals (1 session per week). Progress intensity progressively from week 3 onwards.',
      constraints:       'Do not sacrifice recovery quality. Monitor subjective readiness. Plan a formal deload week at weeks 4–5. Adjust volume downward if readiness drops below 6/10 for 3 or more consecutive sessions.'
    };
  },

  // -----------------------------------------------------------------------
  // Key constraints and progression criteria
  // -----------------------------------------------------------------------

  _keyConstraints(client, limiters) {
    const c = [];
    const age = parseInt(client.profile.age);

    if (Classification._hasPain(client)) {
      c.push('All exercises must remain within a pain-free range. Clinician clearance is required before any progressive loading is introduced.');
    }
    if (age && age > 55) {
      c.push('Recovery demand increases with age. Conservative volume increments, prioritise sleep quality and nutritional adequacy.');
    }
    if (age && age < 18) {
      c.push('Youth client: motor skill development precedes loading. Avoid excessive spinal compression before skeletal maturity. Emphasise movement literacy.');
    }

    limiters
      .filter(l => l.priority <= 1)
      .forEach(l => c.push(l.recommendation));

    return [...new Set(c)];
  },

  _progressionCriteria(client, cls) {
    const { pathway, phase } = cls;
    const criteria = [];

    if (phase === 'Initial / Clinical Rehab') {
      criteria.push('Pain-free movement confirmed across 2 consecutive sessions before Phase 2 entry.');
      criteria.push('Full functional range of motion restored at affected joints.');
      criteria.push('Clinical clearance from treating physiotherapist or sports medicine clinician.');
    } else if (phase === 'Functional Reconditioning') {
      criteria.push('Movement quality rating ≥8/10 across squat, hinge, push, and pull patterns.');
      criteria.push('No pain or visible compensation patterns under moderate load (≤60% 1RM).');
      criteria.push('Completion of 4 or more weeks with consistent attendance (≥3 sessions per week).');
    } else if (phase === 'Strength / Capacity Development') {
      criteria.push('Squat ≥0.85× bodyweight before advancing to performance phase.');
      criteria.push('Deadlift ≥1.0× bodyweight before advancing to performance phase.');
      criteria.push('VO2 max ≥38 ml/kg/min or mile time below 10 minutes.');
    }

    if (pathway === 'Return to Sport' || pathway === 'Return to Performance') {
      criteria.push('Limb symmetry index ≥90% across ForceDecks, NordBord, and ForceFrame profiles.');
      criteria.push('10 m sprint time within 5% of pre-injury or position-normative benchmark.');
      criteria.push('Full unrestricted team training participation for 2 or more consecutive weeks.');
    }
    if (pathway === 'Return to Participation') {
      criteria.push('Sport-specific fitness test completed at ≥75% of age and position norms.');
      criteria.push('No pain during sport-specific movement patterns for 2 consecutive weeks.');
    }

    return criteria;
  }
};
