import {
  rollup,
  sum,
  mean,
  max,
  min,
  descending,
  ascending,
  greatest,
  least,
  group
} from 'd3-array';
import { timeDay } from 'd3-time';

export const minutes = (f) => f.runtime ?? 0;
// 1920 stands for "before 1930"
export const decadeOf = (f) =>
  f.filmYear ? Math.max(1920, Math.floor(f.filmYear / 10) * 10) : null;

/**
 * One entry per distinct film: its latest viewing, preferring one that has a rating. Film-level stats (genres,
 * directors, ratings, decades…) use this, so a rewatched film counts once; viewing-level stats (calendar, venues,
 * time spent…) keep using every viewing.
 */
export function unique(films) {
  const best = new Map();
  for (const f of films) {
    const cur = best.get(f.film);
    if (!cur || f.rating != null || cur.rating == null) best.set(f.film, f);
  }
  return [...best.values()];
}

/** Totals: `viewings` and time count every viewing, `films` and the average rating count each film once. */
export function summarise(films) {
  const by = (type) => films.filter((f) => f.mediumType === type);
  const part = (fs) => ({ count: fs.length, minutes: sum(fs, minutes) });
  const once = unique(films);
  const rated = once.filter((f) => f.rating != null);
  return {
    total: part(films),
    films: once.length,
    cinema: part(by('cinema')),
    physical: part(by('physical')),
    streaming: part(by('streaming')),
    rewatches: films.filter((f) => f.rewatch).length,
    avgRating: rated.length ? mean(rated, (f) => f.rating) : null,
    rated: rated.length
  };
}

/**
 * Count items by a multi-valued key: keyFn(film) -> array of keys.
 * Returns [{key, count, minutes, avg, films}] sorted by count (then time) desc.
 */
export function tally(films, keyFn) {
  const m = new Map();
  for (const f of films) {
    for (const k of new Set(keyFn(f) ?? [])) {
      if (k == null || k === '') continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(f);
    }
  }
  return [...m]
    .map(([key, fs]) => {
      const rated = fs.filter((f) => f.rating != null);
      return {
        key,
        count: fs.length,
        minutes: sum(fs, minutes),
        avg: rated.length ? mean(rated, (f) => f.rating) : null,
        films: fs
      };
    })
    .sort(
      (a, b) =>
        descending(a.count, b.count) ||
        descending(a.minutes, b.minutes) ||
        ascending(String(a.key), String(b.key))
    );
}

/** Longest run of consecutive viewing days, and busiest day. */
export function streaks(films, parseDay) {
  const days = [...new Set(films.map((f) => f.date))].sort();
  let best = { n: 0, from: null, to: null };
  let cur = { n: 0, from: null };
  let prev = null;
  for (const d of days) {
    const dt = parseDay(d);
    if (prev && timeDay.count(prev, dt) === 1) cur.n++;
    else cur = { n: 1, from: d };
    if (cur.n > best.n) best = { n: cur.n, from: cur.from, to: d };
    prev = dt;
  }
  const perDay = rollup(
    films,
    (v) => v,
    (f) => f.date
  );
  const busiest = greatest([...perDay], ([, v]) => v.length);
  return { streak: best, busiest: busiest ? { date: busiest[0], films: busiest[1] } : null };
}

/** Distinct films (latest viewing wins) that have both my rating and a community average. */
export function opinions(films) {
  const latest = new Map();
  for (const f of films) if (f.rating != null && f.avg != null) latest.set(f.film, f);
  const rows = [...latest.values()].map((f) => ({ film: f, delta: f.rating - f.avg }));
  return {
    higher: rows
      .filter((r) => r.delta > 0)
      .sort((a, b) => descending(a.delta, b.delta))
      .slice(0, 6),
    lower: rows
      .filter((r) => r.delta < 0)
      .sort((a, b) => ascending(a.delta, b.delta))
      .slice(0, 6),
    count: rows.length
  };
}

export { max, min, sum, mean, group, rollup, descending, ascending, greatest, least };
