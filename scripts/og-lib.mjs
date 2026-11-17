// Picks what the social preview card shows. Pure functions (no I/O), so they can be unit tested.
import { assignFilmKeys } from '../src/lib/film-keys.js';

/**
 * @param films  every viewing, in date order (src/lib/data/films.json)
 * @param year   the year to show; defaults to the latest year in the data
 * @param n      how many posters
 *
 * stats:  films    = distinct films seen that year      (same as the dashboard's "Films" tile)
 *         minutes  = time spent, every viewing counts   (same as "Time spent")
 *         cinema   = viewings at the cinema             (same as "At the cinema")
 * best:   the best-rated films whose FIRST EVER viewing is in that year (rewatches and films first seen in an earlier
 *         year are left out), best rating first and, for equal ratings, the most recently watched first.
 *         Films without a poster are skipped when enough others have one.
 */
export function analyse(films, { year, n = 5 } = {}) {
  assignFilmKeys(films);
  year ??= Math.max(...films.map((f) => f.watchYear));
  const inYear = films.filter((f) => f.watchYear === year);

  const firstView = new Map(); // film key -> its earliest viewing
  for (const f of films) if (!firstView.has(f.film)) firstView.set(f.film, f);

  const stats = {
    year,
    films: new Set(inYear.map((f) => f.film)).size,
    minutes: inYear.reduce((sum, f) => sum + (f.runtime ?? 0), 0),
    cinema: inYear.filter((f) => f.mediumType === 'cinema').length,
    physical: inYear.filter((f) => f.mediumType === 'physical').length,
    streaming: inYear.filter((f) => f.mediumType === 'streaming').length
  };

  const candidates = [...firstView.values()]
    .filter((f) => f.watchYear === year && f.rating != null)
    .sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date));
  const withPoster = candidates.filter((f) => f.poster);
  const best = (withPoster.length >= n ? withPoster : candidates).slice(0, n);
  return { stats, best };
}

export const titleOf = (f, lang = 'en') => f.titles?.[lang] ?? f.title;

/** "A, B and C" / "A, B et C" */
export const list = (items, and = 'and') =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items.at(-1)}`;

/** What is written on the card and in the page's <meta> tags, per language. */
export const TEXT = {
  en: {
    heading: 'MY YEAR IN FILM',
    films: 'films',
    hours: 'hours',
    alt: 'My year in film',
    summary: (y, films, hours, cinema) =>
      `${y}: ${films} films, ${hours} hours, ${cinema} at the cinema.`,
    picks: (titles) => ` Best new discoveries so far: ${list(titles, 'and')}.`
  },
  fr: {
    heading: 'MON ANNÉE EN FILMS',
    films: 'films',
    hours: 'heures',
    alt: 'Mon année en films',
    summary: (y, films, hours, cinema) =>
      `${y}\u00a0: ${films} films, ${hours} heures, ${cinema} au cinéma.`,
    picks: (titles) => ` Mes meilleures découvertes à ce jour\u00a0: ${list(titles, 'et')}.`
  }
};

/** Text for og:description and the image's alt text (only the cinema count is mentioned, not Blu-ray / streaming). */
export function describe({ stats, best }, lang = 'en') {
  const T = TEXT[lang];
  const hours = Math.round(stats.minutes / 60);
  const n = (x) => x.toLocaleString(lang);
  const summary = T.summary(stats.year, n(stats.films), n(hours), n(stats.cinema));
  const picks = best.length ? T.picks(best.map((f) => titleOf(f, lang))) : '';
  return { summary, description: summary + picks, hours };
}
