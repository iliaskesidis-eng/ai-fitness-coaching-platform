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

  return {
    generatedAt: new Date().toISOString(),
    client,
    strengths,
    weaknesses,
    recommendations,
  };
}

/**
 * Renders an audit object to HTML (used by both the UI and the PDF export).
 */
export function renderAuditHTML(audit) {
  const { client, strengths, weaknesses, recommendations, generatedAt } = audit;
  const dt = new Date(generatedAt).toLocaleString();

  const list = (items, empty) =>
    items.length
      ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
      : `<p class="muted">${empty}</p>`;

  return `
    <div class="report">
      <div class="report-meta">
        <strong>${escapeHtml(client.name)}</strong> · Age ${client.age} · ${escapeHtml(client.gender)}<br/>
        Generated ${dt}
      </div>

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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
