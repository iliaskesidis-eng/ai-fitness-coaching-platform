/**
 * client.js
 * ---------
 * Pure functions for creating and mutating client records.
 * No DOM and no storage calls here — this module is easy to unit test
 * and easy to reuse on a future backend.
 *
 * Client shape:
 * {
 *   id, name, age, gender,
 *   baseline: { heightCm, weightKg, bodyFatPct, restingHR },
 *   goals, injuries,
 *   metrics: [
 *     {
 *       date: 'YYYY-MM-DD',
 *       strength: { squat, bench, deadlift },
 *       conditioning: { vo2max, mileTime },
 *       body: { weightKg, bodyFatPct }
 *     }
 *   ],
 *   createdAt, updatedAt
 * }
 */

/** Converts a form value to a number or null (empty -> null). */
const num = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Simple unique id suitable for local-only persistence. */
const uid = () =>
  'c_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Builds a brand-new client from raw form data. */
export function newClient(data) {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: (data.name || '').trim(),
    age: num(data.age) || 0,
    gender: data.gender || 'Other',
    baseline: {
      heightCm: num(data.heightCm),
      weightKg: num(data.weightKg),
      bodyFatPct: num(data.bodyFatPct),
      restingHR: num(data.restingHR),
    },
    goals: (data.goals || '').trim(),
    injuries: (data.injuries || '').trim(),
    metrics: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Returns a new client object with profile fields updated. */
export function updateClient(client, data) {
  return {
    ...client,
    name: (data.name ?? client.name).trim(),
    age: num(data.age) ?? client.age,
    gender: data.gender ?? client.gender,
    baseline: {
      heightCm: num(data.heightCm) ?? client.baseline.heightCm,
      weightKg: num(data.weightKg) ?? client.baseline.weightKg,
      bodyFatPct: num(data.bodyFatPct) ?? client.baseline.bodyFatPct,
      restingHR: num(data.restingHR) ?? client.baseline.restingHR,
    },
    goals: (data.goals ?? client.goals).trim(),
    injuries: (data.injuries ?? client.injuries).trim(),
    updatedAt: new Date().toISOString(),
  };
}

/** Returns a new client object with a metric entry appended, sorted by date. */
export function addMetric(client, entry) {
  const metric = {
    date: entry.date,
    strength: {
      squat: num(entry.squat),
      bench: num(entry.bench),
      deadlift: num(entry.deadlift),
    },
    conditioning: {
      vo2max: num(entry.vo2max),
      mileTime: num(entry.mileTime),
    },
    body: {
      weightKg: num(entry.mWeight),
      bodyFatPct: num(entry.mBf),
    },
  };
  const metrics = [...client.metrics, metric].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  return { ...client, metrics, updatedAt: new Date().toISOString() };
}

/** Returns a new client object with a metric entry removed by date. */
export function removeMetric(client, date) {
  return {
    ...client,
    metrics: client.metrics.filter((m) => m.date !== date),
    updatedAt: new Date().toISOString(),
  };
}

/** Convenience getters used by dashboard / report modules. */
export const latestMetric = (c) =>
  c.metrics.length ? c.metrics[c.metrics.length - 1] : null;
export const firstMetric = (c) => (c.metrics.length ? c.metrics[0] : null);
