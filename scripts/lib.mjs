import { csvParse } from 'd3-dsv';
import { timeParse, timeFormat } from 'd3-time-format';

// Pure helpers used by sync.mjs (kept side-effect free so they can be unit tested).

/** CSV -> array of objects (d3-dsv), with trimmed headers/values and BOM stripped. */
export function parseCsv(text) {
  return csvParse(text.replace(/^\uFEFF/, ''))
    .map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), (v ?? '').trim()])))
    .filter((r) => Object.values(r).some(Boolean));
}

/** `***°` -> 3.5, `****` -> 4. Also tolerates ★ and ½. Returns null when unrated. */
export function parseRating(s) {
  if (!s) return null;
  const stars = (s.match(/[*★]/g) || []).length;
  const half = /[°½]/.test(s) ? 0.5 : 0;
  const v = stars + half;
  return v > 0 ? Math.min(5, v) : null;
}

// Day-first formats are tried before month-first; ISO first of all.
const DATE_PARSERS = ['%Y-%m-%d', '%d/%m/%Y', '%d.%m.%Y', '%d-%m-%Y', '%d/%m/%y', '%m/%d/%Y'].map(
  (f) => timeParse(f)
);
const isoDay = timeFormat('%Y-%m-%d');

/** 2026-03-14, 14/03/2026, 14.03.2026, 14/03/26 (day first) -> "YYYY-MM-DD" or null. */
export function parseDate(s) {
  if (!s) return null;
  s = s.trim().slice(0, 10).replace(/T.*/, '');
  for (const p of DATE_PARSERS) {
    const d = p(s);
    if (d) return isoDay(d);
  }
  return null;
}

/** 142, "142", "2h22", "2h 22min", "1:35" -> minutes */
export function parseRuntime(s) {
  if (!s) return null;
  s = String(s).trim();
  let m = s.match(/^(\d+)\s*[h:]\s*(\d+)?/i);
  if (m) return +m[1] * 60 + (m[2] ? +m[2] : 0);
  m = s.match(/^(\d+)/);
  return m ? +m[1] : null;
}

export const splitList = (s) =>
  (s || '')
    .split(/\s*,\s*/)
    .map((x) => x.trim())
    .filter(Boolean);

export const isTrue = (s) => /^(x|✓|1|true|yes|oui|vf)$/i.test((s || '').trim());

export const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * cinema | streaming | physical.
 * Order: explicit cinema prefix ("Cinéma …") -> physical keywords ("blu-ray") -> explicit cinema overrides
 * -> explicit streaming names -> config.defaultType (anything else is home viewing by default).
 */
export function classifyMedium(medium, config) {
  const n = norm(medium);
  if (!n) return config.defaultType ?? 'streaming';
  const starts = (list) =>
    (list || []).some((t) => {
      t = norm(t);
      return n === t || n.startsWith(t + ' ');
    });
  if (
    starts(config.cinemaOverrides) ||
    (config.cinemaPrefixes || []).some((p) => n.startsWith(norm(p) + ' '))
  )
    return 'cinema';
  if ((config.physicalKeywords || []).some((k) => n.includes(norm(k)))) return 'physical';
  if (starts(config.streaming)) return 'streaming';
  return config.defaultType ?? 'streaming';
}

/**
 * Display name of the place/platform: "Cinéma Prince Charles" -> "Prince Charles Cinema" (via config.venueNames),
 * "Cinéma Ciné Lumière" -> "Ciné Lumière" (only the first prefix is removed), "myCanal – Location" -> "myCanal".
 */
export function venueName(medium, type, config) {
  let v = (medium || '').trim();
  if (!v) return null;
  if (type === 'cinema') {
    const prefix = (config.cinemaPrefixes || []).find((p) => norm(v).startsWith(norm(p) + ' '));
    if (prefix) v = v.slice(prefix.length).trim();
    return config.venueNames?.[v] ?? v;
  }
  if (type === 'physical') return 'Blu-ray';
  return v.split(/\s[–—-](?:\s|$)|\s\(/)[0].trim();
}

// ---- countries: free-text name (English or French) -> ISO 3166-1 alpha-2 -----------------------

const ALIASES = {
  'united states of america': 'US',
  usa: 'US',
  'etats-unis': 'US',
  'états-unis': 'US',
  'united states': 'US',
  'united kingdom': 'GB',
  uk: 'GB',
  'royaume-uni': 'GB',
  'great britain': 'GB',
  russia: 'RU',
  'soviet union': 'RU',
  urss: 'RU',
  'czech republic': 'CZ',
  czechoslovakia: 'CZ',
  tchecoslovaquie: 'CZ',
  'south korea': 'KR',
  'korea, south': 'KR',
  'coree du sud': 'KR',
  'north korea': 'KP',
  'west germany': 'DE',
  'east germany': 'DE',
  'federal republic of germany': 'DE',
  yugoslavia: 'RS',
  'hong kong': 'HK',
  taiwan: 'TW',
  iran: 'IR',
  'republic of ireland': 'IE',
  'the netherlands': 'NL',
  'ivory coast': 'CI',
  "cote d'ivoire": 'CI',
  "côte d'ivoire": 'CI',
  palestine: 'PS',
  'palestinian territory': 'PS',
  vietnam: 'VN',
  macedonia: 'MK',
  'north macedonia': 'MK',
  'bosnia and herzegovina': 'BA',
  burma: 'MM',
  'democratic republic of the congo': 'CD',
  'congo-kinshasa': 'CD',
  'republic of the congo': 'CG'
};

const SKIP = new Set([
  'FX',
  'EU',
  'UN',
  'EZ',
  'XA',
  'XB',
  'ZZ',
  'QO',
  'AC',
  'CP',
  'DG',
  'EA',
  'IC',
  'TA',
  'DD',
  'SU',
  'YU',
  'CS',
  'BU',
  'NT',
  'TP',
  'ZR',
  'VD',
  'NH',
  'HV',
  'RH'
]);
let reverse;
function reverseCountries() {
  if (reverse) return reverse;
  reverse = new Map();
  for (const loc of ['en', 'fr']) {
    const dn = new Intl.DisplayNames([loc], { type: 'region' });
    for (let a = 65; a <= 90; a++)
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);
        let name;
        try {
          name = dn.of(code);
        } catch {
          continue;
        }
        if (name && name !== code && !SKIP.has(code) && !reverse.has(norm(name)))
          reverse.set(norm(name), code);
      }
  }
  for (const [k, v] of Object.entries(ALIASES)) reverse.set(norm(k), v);
  return reverse;
}

/** Returns [{code}] for known names, keeps unknown ones as `name` so nothing is silently lost. */
export function countryCode(name) {
  if (/^[A-Za-z]{2}$/.test(name.trim())) return name.trim().toUpperCase();
  return reverseCountries().get(norm(name)) ?? null;
}

// ---- genres: TMDb canonical English names ------------------------------------------------------

const GENRES = {
  Action: ['action'],
  Adventure: ['aventure'],
  Animation: ['animation'],
  Comedy: ['comedie'],
  Crime: ['crime'],
  Documentary: ['documentaire'],
  Drama: ['drame'],
  Family: ['familial', 'famille'],
  Fantasy: ['fantastique', 'fantasy'],
  History: ['histoire', 'historique'],
  Horror: ['horreur', 'epouvante-horreur', 'epouvante'],
  Music: ['musique', 'musical'],
  Mystery: ['mystere'],
  Romance: ['romance'],
  'Science Fiction': ['science-fiction', 'science fiction', 'sci-fi', 'scifi', 'sf'],
  'TV Movie': ['telefilm', 'tv movie'],
  Thriller: ['thriller'],
  War: ['guerre'],
  Western: ['western']
};
const genreMap = new Map();
for (const [en, others] of Object.entries(GENRES)) {
  genreMap.set(norm(en), en);
  for (const o of others) genreMap.set(norm(o), en);
}
export const canonicalGenre = (g) => genreMap.get(norm(g)) ?? g;

// ---- TMDb picking helpers -----------------------------------------------------------------------

/**
 * Poster of a film for a page language (`lang`, "en" or "fr"). Same rule in cine-stats and video-club:
 *   English page: an English-language poster whenever TMDb has one, then the original language, then French.
 *   French page:  policy "original": English and French films keep their original poster, the others get the French
 *                 one (then English, then the original language). Policy "always-original": the original language first.
 * Within a language the best-rated poster wins; TMDb's default poster is the last resort, so there is always one.
 */
export function pickPoster(images, originalLanguage, lang, defaultPath, policy = 'original') {
  const list = [...(images?.posters ?? [])].sort(
    (a, b) =>
      (b.vote_average ?? 0) - (a.vote_average ?? 0) || (b.vote_count ?? 0) - (a.vote_count ?? 0)
  );
  const by = (l) => list.find((p) => p.iso_639_1 === l)?.file_path;
  const orig = originalLanguage || 'en';
  const wanted =
    lang === 'en'
      ? ['en', orig, 'fr']
      : policy === 'always-original' || orig === 'en' || orig === 'fr'
        ? [orig, 'fr', 'en']
        : ['fr', 'en', orig];
  for (const l of wanted) {
    const p = by(l);
    if (p) return p;
  }
  return defaultPath || list[0]?.file_path || null;
}

/** Minimum runtime (minutes) for a credit to count as a feature film (Academy / BAFTA convention). */
export const FEATURE_MIN_RUNTIME = 40;
/** TMDb genre id of "TV Movie". */
export const TV_MOVIE_GENRE = 10770;

/**
 * Candidate earlier directing credits of a director, closest to the film first.
 * `credits`: [{id, date, tv}] (tv = TMDb "TV Movie" genre). Excludes the film itself, undated and TV credits;
 * the caller then checks each candidate's runtime (shorts are < FEATURE_MIN_RUNTIME).
 */
export function earlierCandidates(filmId, releaseDate, credits) {
  if (!releaseDate) return [];
  return credits
    .filter((c) => c.id !== filmId && c.date && c.date < releaseDate && !c.tv)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((c) => c.id);
}

/**
 * Average rating from a Letterboxd film page: the `twitter:data2` meta tag ("3.91 out of 5"),
 * falling back to the JSON-LD block (wrapped in CDATA comment markers) `aggregateRating`.
 */
export function parseLetterboxdRating(html) {
  let rating = null;
  let count = null;
  const meta =
    html.match(/<meta[^>]*name=["']twitter:data2["'][^>]*content=["']\s*([\d.,]+)\s*out of 5/i) ??
    html.match(/<meta[^>]*content=["']\s*([\d.,]+)\s*out of 5[^>]*name=["']twitter:data2["']/i);
  if (meta) rating = parseFloat(meta[1].replace(',', '.'));
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    const body = m[1]
      .replace(/\/\*\s*<!\[CDATA\[\s*\*\//, '')
      .replace(/\/\*\s*\]\]>\s*\*\//, '')
      .trim();
    try {
      const json = JSON.parse(body);
      const ar = (Array.isArray(json) ? json.find((j) => j.aggregateRating) : json)
        ?.aggregateRating;
      if (ar) {
        if (rating == null) rating = Number(ar.ratingValue);
        count = Number(ar.ratingCount ?? ar.reviewCount) || null;
      }
    } catch {
      /* not the block we want */
    }
  }
  return { rating: rating > 0 && rating <= 5 ? rating : null, count };
}
