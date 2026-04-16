/**
 * report.js
 * ---------
 * Deterministic, rule-based audit report generator.
 *
 * Given a client record, it classifies every tracked dimension (strength,
 * conditioning, body composition) against published reference standards and
 * the client's own trend data, then derives concrete recommendations based
 * on the stated goals and injury profile.
 *
 * No randomness, no LLMs — every line in the report is produced by an
 * explicit rule so the coach always understands why a finding was made.
 */

import { latestMetric, firstMetric } from './client.js';

// -----------------------------------------------------------------------
// Reference standards
// -----------------------------------------------------------------------

// Strength classification as a ratio of lift to bodyweight.
// Rough "beginner / intermediate / advanced" thresholds used widely in
// strength and conditioning literature (e.g. ExRx, Rippetoe).
const STRENGTH_RATIOS = {
  Male: {
    squat:    { novice: 1.00, int: 1.25, adv: 1.75 },
    bench:    { novice: 0.75, int: 1.00, adv: 1.50 },
    deadlift: { novice: 1.25, int: 1.50, adv: 2.25 },
  },
  Female: {
    squat:    { novice: 0.75, int: 1.00, adv: 1.50 },
    bench:    { novice: 0.50, int: 0.75, adv: 1.00 },
    deadlift: { novice: 1.00, int: 1.25, adv: 1.75 },
  },
  Other: {
    squat:    { novice: 0.85, int: 1.10, adv: 1.60 },
    bench:    { novice: 0.60, int: 0.85, adv: 1.25 },
    deadlift: { novice: 1.10, int: 1.35, adv: 2.00 },
  },
};

// Simplified VO2 max bands (mL/kg/min).
function vo2Level(vo2) {
  if (vo2 == null) return null;
  if (vo2 < 30) return 'Poor';
  if (vo2 < 40) return 'Fair';
  if (vo2 < 50) return 'Good';
  return 'Excellent';
}

function bmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

function bmiCategory(b) {
  if (b == null) return null;
  if (b < 18.5) return 'Underweight';
  if (b < 25)   return 'Normal';
  if (b < 30)   return 'Overweight';
  return 'Obese';
}

function strengthLevel(ratio, t) {
  if (ratio >= t.adv)    return 'Advanced';
  if (ratio >= t.int)    return 'Intermediate';
  if (ratio >= t.novice) return 'Novice';
  return 'Untrained';
}

// -----------------------------------------------------------------------
// Limiters engine
// -----------------------------------------------------------------------
// A limiter is anything actively constraining progress. Each flagged item
// gets a severity score in [0,1]; top entries become the Primary Limiters
// section and feed the Programming Priorities ranker.

function computeLimiters(client) {
  const last = latestMetric(client);
  const first = firstMetric(client);
  const currentWeight =
    (last && last.body.weightKg) || client.baseline.weightKg || null;
  const genderKey =
    client.gender in STRENGTH_RATIOS ? client.gender : 'Other';
  const ratios = STRENGTH_RATIOS[genderKey];

  const limiters = [];

  // Missing baseline data is itself a limiter (can't coach what you can't see).
  if (!last) {
    limiters.push({
      area: 'Data',
      title: 'No performance data logged',
      detail:
        'Strength, conditioning, and body-composition baselines are missing — cannot prescribe load or track progress.',
      severity: 0.5,
    });
  }

  // --- Strength limiters -------------------------------------------------
  if (last && currentWeight) {
    for (const lift of ['squat', 'bench', 'deadlift']) {
      const v = last.strength[lift];
      if (v == null) continue;
      const ratio = v / currentWeight;
      const t = ratios[lift];
      const label = lift[0].toUpperCase() + lift.slice(1);

      if (ratio < t.novice) {
        limiters.push({
          area: 'Strength',
          lift,
          title: `${label} strength deficit`,
          detail:
            `${v}kg at ${ratio.toFixed(2)}× BW — below the novice threshold of ${t.novice}× BW. ` +
            `This limits transferable force production across the entire program.`,
          severity: 0.85,
        });
      } else if (ratio < t.int) {
        limiters.push({
          area: 'Strength',
          lift,
          title: `${label} below intermediate standard`,
          detail:
            `${v}kg at ${ratio.toFixed(2)}× BW — intermediate benchmark is ${t.int}× BW. ` +
            `Closing this gap unlocks higher-intensity programming.`,
          severity: 0.60,
        });
      }
    }
  }

  // --- Strength regression (trend) --------------------------------------
  if (first && last && first !== last) {
    for (const lift of ['squat', 'bench', 'deadlift']) {
      const a = first.strength[lift];
      const b = last.strength[lift];
      if (a == null || b == null || b >= a) continue;
      const label = lift[0].toUpperCase() + lift.slice(1);
      limiters.push({
        area: 'Trend',
        lift,
        title: `${label} regression`,
        detail:
          `Down ${(a - b).toFixed(1)}kg since first log. ` +
          `Audit recovery, sleep, nutrition, and bar-path technique before adding volume.`,
        severity: 0.55,
      });
    }
  }

  // --- Conditioning -----------------------------------------------------
  const vo2 = last && last.conditioning.vo2max;
  if (vo2 != null) {
    if (vo2 < 30) {
      limiters.push({
        area: 'Conditioning',
        title: 'Aerobic capacity — poor band',
        detail:
          `VO₂ max ${vo2} mL/kg/min (<30) limits work capacity, recovery between sets, and training density.`,
        severity: 0.85,
      });
    } else if (vo2 < 40) {
      limiters.push({
        area: 'Conditioning',
        title: 'Aerobic capacity — fair band',
        detail:
          `VO₂ max ${vo2} mL/kg/min sits in the fair band (30–40). Lifting recovery and session density will suffer.`,
        severity: 0.55,
      });
    }
  }

  if (last && last.conditioning.mileTime != null && last.conditioning.mileTime > 10) {
    limiters.push({
      area: 'Conditioning',
      title: 'Endurance — slow mile time',
      detail: `Mile time ${last.conditioning.mileTime.toFixed(2)} min indicates a limited aerobic base.`,
      severity: 0.55,
    });
  }

  // --- Body composition -------------------------------------------------
  const bmiValue = bmi(client.baseline.heightCm, currentWeight);
  if (bmiValue != null) {
    if (bmiValue >= 30) {
      limiters.push({
        area: 'Body Composition',
        title: 'Body composition — obese range',
        detail: `BMI ${bmiValue.toFixed(1)} elevates joint load, limits conditioning work, and raises cardiometabolic risk.`,
        severity: 0.75,
      });
    } else if (bmiValue >= 25) {
      limiters.push({
        area: 'Body Composition',
        title: 'Body composition — overweight',
        detail: `BMI ${bmiValue.toFixed(1)} is above the normal band (18.5–24.9); excess mass dampens relative strength and conditioning.`,
        severity: 0.50,
      });
    } else if (bmiValue < 18.5) {
      limiters.push({
        area: 'Body Composition',
        title: 'Body composition — underweight',
        detail: `BMI ${bmiValue.toFixed(1)} is below the normal band; insufficient lean mass caps force production.`,
        severity: 0.55,
      });
    }
  }

  // --- Recovery proxy ---------------------------------------------------
  if (client.baseline.restingHR && client.baseline.restingHR > 80) {
    limiters.push({
      area: 'Recovery',
      title: 'Elevated resting heart rate',
      detail: `Resting HR ${client.baseline.restingHR} bpm suggests an under-developed aerobic system and elevated systemic stress.`,
      severity: 0.50,
    });
  }

  // --- Injury / contraindication ---------------------------------------
  if (client.injuries) {
    limiters.push({
      area: 'Injury',
      title: 'Active injury constraint',
      detail: `Programming must respect: ${client.injuries}. Screen movement and exclude contraindicated loading patterns before progressing intensity.`,
      severity: 0.70,
    });
  }

  limiters.sort((x, y) => y.severity - x.severity);
  return limiters;
}

// -----------------------------------------------------------------------
// Programming Priorities ranker
// -----------------------------------------------------------------------
// Top limiters become priorities, de-duplicated by area so we never spend
// two of three priority slots on the same dimension. Stated goals fold in
// as an additional priority (or primary, if no hard limiters exist).

function classifyGoal(goals) {
  if (!goals) return null;
  const g = goals.toLowerCase();
  if (/strength|stronger|1rm|powerlift/.test(g))              return 'strength';
  if (/muscle|hypertrophy|size|mass|gain/.test(g))            return 'hypertrophy';
  if (/lose|cut|fat loss|lean|slim|recomp/.test(g))           return 'fatloss';
  if (/run|endurance|marathon|5k|10k|conditioning|cardio/.test(g)) return 'endurance';
  if (/mobility|flex|yoga/.test(g))                           return 'mobility';
  return null;
}

function priorityFromLimiter(lim) {
  switch (lim.area) {
    case 'Strength': {
      const label = lim.lift ? lim.lift[0].toUpperCase() + lim.lift.slice(1) : 'primary lift';
      return {
        title: `Close the ${label.toLowerCase()} strength gap`,
        action: `Run a 4–6 week focused block on ${label.toLowerCase()}: 3×/week, 3×5 @ 80–85% 1RM, technique-first. Accessory work biased to the weak range of motion.`,
      };
    }
    case 'Conditioning':
      return {
        title: 'Raise aerobic capacity',
        action: '2–3×/week zone-2 cardio (30–45 min nasal-breathing pace) plus one weekly threshold piece (4×4 min at RPE 8).',
      };
    case 'Body Composition':
      return {
        title: 'Drive body-composition change',
        action: '300–500 kcal/day energy delta (direction dictated by BMI band), protein 1.8 g/kg, resistance training 3–4×/week to preserve lean mass.',
      };
    case 'Recovery':
      return {
        title: 'Restore recovery capacity',
        action: 'Aerobic base building (zone-2, 3×/week), sleep audit, and deload any session reaching RPE 9+ for two consecutive weeks.',
      };
    case 'Injury':
      return {
        title: 'Rehab & movement quality before load',
        action: 'Full movement screen; corrective isometrics and tempo work in pain-free ROM; re-introduce loaded compounds only after clearance.',
      };
    case 'Trend': {
      const label = lim.lift ? lim.lift[0].toUpperCase() + lim.lift.slice(1) : 'lift';
      return {
        title: `Reverse ${label.toLowerCase()} regression`,
        action: `Drop intensity to 70% 1RM, rebuild 4 weeks of volume with perfect bar path, then re-test 1RM.`,
      };
    }
    case 'Data':
      return {
        title: 'Establish a performance baseline',
        action: 'Test squat / bench / deadlift 1RM and a VO₂ proxy (Cooper or timed mile) within the next two sessions.',
      };
    default:
      return { title: lim.title, action: lim.detail };
  }
}

function priorityFromGoal(goal, goalText) {
  const map = {
    strength: {
      title: 'Progress maximal strength',
      action: '4×/week upper/lower split; 3–5 rep heavy compounds at 82.5–92.5% 1RM with full recovery between sets.',
    },
    hypertrophy: {
      title: 'Drive hypertrophy with mechanical tension',
      action: '4×/week split, 8–12 rep range, 14–18 hard sets per muscle group per week; add a rep or 2.5 kg each week.',
    },
    fatloss: {
      title: 'Preserve lean mass during a deficit',
      action: 'Full-body 3×/week at RPE 7–8, high protein, 7–10k steps/day; deficit capped at 500 kcal/day to protect strength.',
    },
    endurance: {
      title: 'Build sport-specific endurance',
      action: 'Aerobic base block (4 weeks zone-2 @ 3×/week) then threshold intervals (4×5 min at LT2) for 4 weeks.',
    },
    mobility: {
      title: 'Expand usable range of motion',
      action: 'Daily 10-min targeted flow (hips, T-spine, ankles) plus 2×/week dedicated mobility sessions with end-range isometrics.',
    },
  };
  const p = map[goal];
  return p
    ? { ...p, rationale: `Directly aligned with stated goal: "${goalText}".` }
    : null;
}

function buildPriorities(limiters, client) {
  const out = [];
  const seenAreas = new Set();

  for (const lim of limiters) {
    if (out.length >= 3) break;
    if (seenAreas.has(lim.area)) continue;
    seenAreas.add(lim.area);
    const p = priorityFromLimiter(lim);
    out.push({
      rank: out.length + 1,
      title: p.title,
      action: p.action,
      rationale: lim.detail,
    });
  }

  // Layer the client's stated goal as an additional priority if slots remain.
  if (out.length < 3) {
    const goal = classifyGoal(client.goals);
    if (goal) {
      const gp = priorityFromGoal(goal, client.goals);
      if (gp && !out.some((p) => p.title === gp.title)) {
        out.push({
          rank: out.length + 1,
          title: gp.title,
          action: gp.action,
          rationale: gp.rationale,
        });
      }
    }
  }

  if (out.length === 0) {
    out.push({
      rank: 1,
      title: 'Maintain current programming',
      action: 'Hold the current plan, log metrics weekly, and re-audit in 4 weeks.',
      rationale: 'No significant limiters detected on the current dataset.',
    });
  }

  return out;
}

// -----------------------------------------------------------------------
// Main entry point
// -----------------------------------------------------------------------

/**
 * Builds a structured audit report.
 * Returns: { generatedAt, client, strengths[], weaknesses[], recommendations[] }
 */
export function generateAudit(client) {
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  const last = latestMetric(client);
  const first = firstMetric(client);

  const currentWeight =
    (last && last.body.weightKg) || client.baseline.weightKg || null;

  const genderKey =
    client.gender in STRENGTH_RATIOS ? client.gender : 'Other';
  const ratios = STRENGTH_RATIOS[genderKey];

  // -------------------------------------------------------------------
  // 1. Strength classification (absolute + relative to bodyweight)
  // -------------------------------------------------------------------
  if (last && currentWeight) {
    for (const lift of ['squat', 'bench', 'deadlift']) {
      const v = last.strength[lift];
      if (v == null) continue;

      const ratio = v / currentWeight;
      const level = strengthLevel(ratio, ratios[lift]);
      const label = lift[0].toUpperCase() + lift.slice(1);
      const line = `${label}: ${v}kg (${ratio.toFixed(2)}× BW) — ${level}`;

      if (level === 'Advanced' || level === 'Intermediate') {
        strengths.push(line);
      } else {
        weaknesses.push(line);
        recommendations.push(
          `Prioritise ${label.toLowerCase()} development: 4–6 week linear progression, 3 sessions/week, 3×5 at 80% 1RM.`
        );
      }
    }
  } else {
    weaknesses.push('Strength baseline is incomplete — unable to classify.');
    recommendations.push(
      'Log squat, bench and deadlift 1RM within the next two sessions to establish a baseline.'
    );
  }

  // -------------------------------------------------------------------
  // 2. Strength trend (first vs latest entry)
  // -------------------------------------------------------------------
  if (first && last && first !== last) {
    for (const lift of ['squat', 'bench', 'deadlift']) {
      const a = first.strength[lift];
      const b = last.strength[lift];
      if (a == null || b == null) continue;

      const delta = b - a;
      const label = lift[0].toUpperCase() + lift.slice(1);
      if (delta > 0) {
        strengths.push(`${label} up ${delta.toFixed(1)}kg since first log.`);
      } else if (delta < 0) {
        weaknesses.push(
          `${label} down ${Math.abs(delta).toFixed(1)}kg since first log.`
        );
        recommendations.push(
          `Investigate ${label.toLowerCase()} regression — check recovery, sleep, nutrition, technique.`
        );
      }
    }
  }

  // -------------------------------------------------------------------
  // 3. Conditioning
  // -------------------------------------------------------------------
  if (last && last.conditioning.vo2max != null) {
    const level = vo2Level(last.conditioning.vo2max);
    const line = `VO₂ max: ${last.conditioning.vo2max} mL/kg/min (${level})`;
    if (level === 'Good' || level === 'Excellent') {
      strengths.push(line);
    } else {
      weaknesses.push(line);
      recommendations.push(
        'Add two aerobic sessions per week at 70–80% max HR (30–45 min steady state).'
      );
    }
  } else {
    recommendations.push(
      'Establish a VO₂ max benchmark via Cooper test or a timed mile.'
    );
  }

  if (last && last.conditioning.mileTime != null) {
    const mt = last.conditioning.mileTime;
    if (mt < 7) strengths.push(`Mile time: ${mt.toFixed(2)} min — well-conditioned.`);
    else if (mt > 10) {
      weaknesses.push(`Mile time: ${mt.toFixed(2)} min — below average.`);
      recommendations.push(
        'Programme interval work: 6×400m at goal pace, 90s rest, once per week.'
      );
    }
  }

  // -------------------------------------------------------------------
  // 4. Body composition
  // -------------------------------------------------------------------
  const heightCm = client.baseline.heightCm;
  const bmiValue = bmi(heightCm, currentWeight);
  if (bmiValue != null) {
    const cat = bmiCategory(bmiValue);
    const line = `BMI: ${bmiValue.toFixed(1)} (${cat})`;
    if (cat === 'Normal') {
      strengths.push(line);
    } else {
      weaknesses.push(line);
      if (cat === 'Overweight' || cat === 'Obese') {
        recommendations.push(
          'Target a 300–500 kcal/day deficit with protein at 1.8 g/kg bodyweight.'
        );
      } else if (cat === 'Underweight') {
        recommendations.push(
          'Target a 300–500 kcal/day surplus combined with progressive overload training.'
        );
      }
    }
  }

  // Body fat trend
  const bfNow   = (last && last.body.bodyFatPct) ?? client.baseline.bodyFatPct ?? null;
  const bfStart = (first && first.body.bodyFatPct) ?? client.baseline.bodyFatPct ?? null;
  if (bfNow != null && bfStart != null && bfNow !== bfStart) {
    const delta = bfNow - bfStart;
    if (delta < 0) {
      strengths.push(`Body fat down ${Math.abs(delta).toFixed(1)}% since start.`);
    } else {
      weaknesses.push(`Body fat up ${delta.toFixed(1)}% since start.`);
    }
  }

  // Resting HR
  if (client.baseline.restingHR && client.baseline.restingHR > 80) {
    weaknesses.push(`Elevated resting HR: ${client.baseline.restingHR} bpm.`);
    recommendations.push(
      'Build an aerobic base (zone-2 cardio 3×/week) and audit sleep and stress load.'
    );
  } else if (client.baseline.restingHR && client.baseline.restingHR < 60) {
    strengths.push(`Resting HR: ${client.baseline.restingHR} bpm — strong aerobic base.`);
  }

  // -------------------------------------------------------------------
  // 5. Injury-aware guidance
  // -------------------------------------------------------------------
  if (client.injuries) {
    recommendations.push(
      `Programming must respect: ${client.injuries}. Begin with movement screening and avoid contraindicated loading patterns.`
    );
  }

  // -------------------------------------------------------------------
  // 6. Goal-aligned recommendations (keyword rule engine)
  // -------------------------------------------------------------------
  if (client.goals) {
    const g = client.goals.toLowerCase();

    if (/strength|stronger|1rm|powerlift|lift/.test(g)) {
      recommendations.push(
        'Goal: strength — run a 4×/week upper/lower split emphasising 3–5 rep heavy compounds.'
      );
    }
    if (/lose|cut|fat loss|lean|slim/.test(g)) {
      recommendations.push(
        'Goal: fat loss — sustain caloric deficit while preserving strength via full-body training 3×/week.'
      );
    }
    if (/muscle|hypertrophy|size|mass|gain/.test(g)) {
      recommendations.push(
        'Goal: hypertrophy — 4×/week split, 8–12 rep range, 14–18 weekly sets per major muscle group.'
      );
    }
    if (/run|endurance|marathon|5k|10k|conditioning|cardio/.test(g)) {
      recommendations.push(
        'Goal: endurance — periodise aerobic base (zone 2) with weekly threshold intervals (4×5 min).'
      );
    }
    if (/mobility|flex|yoga/.test(g)) {
      recommendations.push(
        'Goal: mobility — daily 10-minute targeted flow, plus 2 dedicated sessions per week.'
      );
    }
  }

  // -------------------------------------------------------------------
  // Default fallback
  // -------------------------------------------------------------------
  if (recommendations.length === 0) {
    recommendations.push('Maintain current programming; re-assess in 4 weeks.');
  }

  // Derive the new structured sections from the same underlying signals.
  // Primary Limiters are de-duplicated by area so the coach sees diverse
  // limiting factors (strength, conditioning, body comp, ...), not three
  // variations of the same lift.
  const limiters = computeLimiters(client);
  const seenAreas = new Set();
  const primaryLimiters = [];
  for (const l of limiters) {
    if (primaryLimiters.length >= 3) break;
    if (seenAreas.has(l.area)) continue;
    seenAreas.add(l.area);
    primaryLimiters.push(l);
  }
  // If fewer than 3 distinct areas, backfill with next-highest-severity items.
  for (const l of limiters) {
    if (primaryLimiters.length >= 3) break;
    if (primaryLimiters.includes(l)) continue;
    primaryLimiters.push(l);
  }
  const programmingPriorities = buildPriorities(limiters, client);

  return {
    generatedAt: new Date().toISOString(),
    client,
    strengths,
    weaknesses,
    recommendations,
    primaryLimiters,
    programmingPriorities,
  };
}

/**
 * Renders an audit object to HTML (used by both the UI and the PDF export).
 */
export function renderAuditHTML(audit) {
  const {
    client,
    strengths,
    weaknesses,
    recommendations,
    primaryLimiters,
    programmingPriorities,
    generatedAt,
  } = audit;
  const dt = new Date(generatedAt).toLocaleString();

  const list = (items, empty) =>
    items.length
      ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
      : `<p class="muted">${empty}</p>`;

  // --- Primary Limiters block --------------------------------------------
  const limitersHtml = primaryLimiters && primaryLimiters.length
    ? `<ol class="limiters">${primaryLimiters
        .map(
          (l) => `
          <li>
            <div class="limiter-head">
              <span class="pill warn">${escapeHtml(l.area)}</span>
              <strong>${escapeHtml(l.title)}</strong>
              <span class="severity" title="Severity ${l.severity.toFixed(2)} / 1.00">${renderSeverity(l.severity)}</span>
            </div>
            <p class="limiter-detail">${escapeHtml(l.detail)}</p>
          </li>`
        )
        .join('')}</ol>`
    : `<p class="muted">No primary limiters identified — dataset may be incomplete or client is clear across all dimensions.</p>`;

  // --- Programming Priorities block --------------------------------------
  const prioritiesHtml = programmingPriorities && programmingPriorities.length
    ? `<ol class="priorities">${programmingPriorities
        .map(
          (p) => `
          <li>
            <div class="priority-head">
              <span class="rank-badge">#${p.rank}</span>
              <strong>${escapeHtml(p.title)}</strong>
            </div>
            <p class="priority-action"><em>Action:</em> ${escapeHtml(p.action)}</p>
            <p class="priority-rationale"><em>Why:</em> ${escapeHtml(p.rationale)}</p>
          </li>`
        )
        .join('')}</ol>`
    : '';

  return `
    <div class="report">
      <div class="report-meta">
        <strong>${escapeHtml(client.name)}</strong> · Age ${client.age} · ${escapeHtml(client.gender)}<br/>
        Generated ${dt}
      </div>

      <h3><span class="pill warn">Primary Limiters</span></h3>
      ${limitersHtml}

      <h3><span class="pill info">Programming Priorities</span></h3>
      ${prioritiesHtml}

      <h3><span class="pill good">Strengths</span></h3>
      ${list(strengths, 'No clear strengths identified yet. Collect more data.')}

      <h3><span class="pill warn">Weaknesses</span></h3>
      ${list(weaknesses, 'No significant weaknesses flagged.')}

      <h3><span class="pill info">Recommendations</span></h3>
      ${list(recommendations, '')}

      ${client.goals ? `<h3>Stated Goals</h3><p>${escapeHtml(client.goals)}</p>` : ''}
      ${client.injuries ? `<h3>Injuries / Limitations</h3><p>${escapeHtml(client.injuries)}</p>` : ''}
    </div>
  `;
}

// Compact severity visual — five dots, filled proportional to severity.
function renderSeverity(sev) {
  const filled = Math.max(1, Math.min(5, Math.round(sev * 5)));
  const dots = [];
  for (let i = 0; i < 5; i++) {
    dots.push(`<span class="sev-dot${i < filled ? ' on' : ''}"></span>`);
  }
  return `<span class="sev-meter">${dots.join('')}</span>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
