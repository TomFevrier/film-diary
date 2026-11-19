import { replaceState } from '$app/navigation';
import raw from './data/films.json';
import { descending } from 'd3-array';
import { makeFormats } from './format.js';
import { translate, places, venues } from './i18n.js';
import { isFestival } from './festivals.js';
import { assignFilmKeys } from './film-keys.js';
import { decadeOf } from './stats.js';

export const generatedAt = raw.generatedAt;
export const enriched = raw.enriched;
export const allFilms = raw.films;
assignFilmKeys(allFilms); // `film`: shared by every viewing of the same film
// festivals are inferred from the comment tags (see config.json → festivalKeywords)
for (const f of allFilms) {
  f.tags ??= f.comment ? [f.comment] : [];
  f.festivals = f.tags.filter(isFestival);
}
/** name -> { id, p (TMDb profile path), g ('f'|'m'|'x') } for directors and actors TMDb knows */
export const people = raw.people ?? {};
// plain (non-reactive) set: only used once, at module load
// eslint-disable-next-line svelte/prefer-svelte-reactivity
export const years = [...new Set(allFilms.map((f) => f.watchYear))].sort(descending);

// One predicate per filter key. Values within a key are OR-ed, keys are AND-ed.
const preds = {
  type: (f, v) => f.mediumType === v,
  venue: (f, v) => f.venue === v,
  place: (f, v) => f.place === v,
  event: (f, v) => f.tags.includes(v),
  director: (f, v) => f.directors.includes(v),
  actor: (f, v) => f.actors.includes(v),
  country: (f, v) => f.countries.includes(v),
  genre: (f, v) => f.genres.includes(v),
  with: (f, v) => f.with.includes(v),
  decade: (f, v) => decadeOf(f) === v,
  rating: (f, v) => (v === 0 ? f.rating == null : f.rating === v),
  day: (f, v) => f.date === v,
  weekday: (f, v) => new Date(f.date + 'T12:00:00').getDay() === v,
  // boolean filters (each its own key so they combine with AND)
  female: (f) => f.femaleDirector,
  debut: (f) => f.debut === true,
  rewatch: (f) => f.rewatch,
  dubbed: (f) => f.dubbed,
  new: (f) => f.filmYear === f.watchYear,
  festival: (f) => f.festivals.length > 0
};

/** The browser's language: the first of navigator.languages that is English or French, otherwise English. */
function browserLang() {
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const base = String(l).toLowerCase().split('-')[0];
    if (base === 'fr' || base === 'en') return base;
  }
  return 'en';
}

/** Mirror a choice in the URL (?lang=…, ?year=…) without adding a history entry. */
function syncParam(name, value) {
  try {
    const url = new URL(location.href);
    url.searchParams.set(name, value);
    // the URL comes from location.href, so it already contains the base path: resolve() would add it twice
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    replaceState(url, {});
  } catch {
    // the router isn't ready (or this isn't a browser): the URL just isn't updated
  }
}

class App {
  lang = $state('en');
  year = $state(years[0] ?? null); // null = all years
  filters = $state({});
  tip = $state(null);
  detail = $state(null);

  t = (key, params) => translate(this.lang, key, params);
  get fmt() {
    return makeFormats(this.lang);
  }
  title = (f) => f.titles?.[this.lang] ?? f.title;
  placeName = (p) => places[this.lang]?.[p] ?? p;
  venueName = (v) => venues[this.lang]?.[v] ?? v;
  countryName = (code) => {
    try {
      return new Intl.DisplayNames([this.lang], { type: 'region' }).of(code) ?? code;
    } catch {
      return code;
    }
  };
  genreName = (g) => {
    const fr = {
      Action: 'Action',
      Adventure: 'Aventure',
      Animation: 'Animation',
      Comedy: 'Comédie',
      Crime: 'Crime',
      Documentary: 'Documentaire',
      Drama: 'Drame',
      Family: 'Familial',
      Fantasy: 'Fantastique',
      History: 'Histoire',
      Horror: 'Horreur',
      Music: 'Musique',
      Mystery: 'Mystère',
      Romance: 'Romance',
      'Science Fiction': 'Science-Fiction',
      'TV Movie': 'Téléfilm',
      Thriller: 'Thriller',
      War: 'Guerre',
      Western: 'Western'
    };
    return this.lang === 'fr' ? (fr[g] ?? g) : g;
  };

  /** Films of the selected year with no filter applied: charts scale against this so they keep their size while filtering. */
  base() {
    return this.year == null ? allFilms : allFilms.filter((f) => f.watchYear === this.year);
  }

  /** Films of the selected year, filtered by everything except `except` (so a chart keeps showing its own options). */
  films(except) {
    const base = this.year == null ? allFilms : allFilms.filter((f) => f.watchYear === this.year);
    const active = Object.entries(this.filters).filter(([k, v]) => k !== except && v.length);
    if (!active.length) return base;
    return base.filter((f) => active.every(([k, vs]) => vs.some((v) => preds[k](f, v))));
  }
  get active() {
    return Object.entries(this.filters).filter(([, v]) => v.length);
  }
  has = (key, value) => !!this.filters[key]?.includes(value);
  hasAny = (key) => !!this.filters[key]?.length;

  toggle(key, value) {
    const cur = this.filters[key] ?? [];
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    const all = { ...this.filters, [key]: next };
    if (!next.length) delete all[key];
    this.filters = all;
  }
  clear() {
    this.filters = {};
  }
  /** Open the film dialog (and drop any tooltip a tap just raised). */
  openDetail(f) {
    this.tip = null;
    this.detail = f;
  }
  setYear(y) {
    this.year = y;
    this.filters = {};
    syncParam('year', y == null ? 'all' : y);
  }

  applyLang(l) {
    this.lang = l;
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  }
  setLang(l) {
    this.applyLang(l);
    syncParam('lang', l);
  }

  /**
   * Initial state, in this order: URL parameters (?lang=fr|en, ?year=2024|all), then the language the page is for
   * (the /fr/ page), then the browser's language, and the latest year. Called once on the client.
   */
  init(pageLang = null) {
    const params = new URLSearchParams(location.search);
    const lang = params.get('lang')?.toLowerCase();
    this.applyLang(lang === 'fr' || lang === 'en' ? lang : (pageLang ?? browserLang()));
    const year = params.get('year')?.toLowerCase();
    if (year === 'all') this.year = null;
    else if (year && years.includes(+year)) this.year = +year;
  }
}

export const app = new App();
