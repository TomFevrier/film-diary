#!/usr/bin/env node
// Builds src/lib/data/films.json from the Google Sheet (published CSV) + TMDb (+ Letterboxd ratings).
//
//   SHEET_CSV_URL  published CSV link (or a path to a local CSV)      – falls back to data/movies.csv
//                  (the *current* year: re-read on every run)
//   data/history/*.csv  past years. Each is synced ONCE into a static data/history/<name>.json (commit it);
//                  after that only the JSON is used. Re-synced only when the CSV changes or with --force-history.
//
//   node scripts/sync.mjs --history-only     process data/history/*.csv and stop (npm run sync:history)
//   node scripts/sync.mjs --force-history    re-process every history file
//   TMDB_API_KEY   TMDb v3 key or v4 read-access token                  – optional; without it: no posters/localised titles
//   LETTERBOXD=0   skip the Letterboxd average-rating lookup           – falls back to TMDb ratings
//
// Network lookups are cached in .cache/ (persisted between CI runs), so only new films cost API calls.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  parseCsv,
  parseRating,
  parseDate,
  parseRuntime,
  splitList,
  isTrue,
  classifyMedium,
  countryCode,
  canonicalGenre,
  pickPoster,
  venueName,
  earlierCandidates,
  parseLetterboxdRating,
  isLatin,
  findCredit,
  latinAlias,
  FEATURE_MIN_RUNTIME,
  TV_MOVIE_GENRE,
  norm
} from './lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT_FILE ?? path.join(root, 'src/lib/data/films.json');
const CACHE_DIR = path.join(root, '.cache');
const CACHE_FILE = process.env.CACHE_FILE ?? path.join(CACHE_DIR, 'enrich.json');
const TMDB_BASE = process.env.TMDB_BASE ?? 'https://api.themoviedb.org/3'; // overridable for tests
const LB_BASE = process.env.LETTERBOXD_BASE ?? 'https://letterboxd.com';
const config = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));

loadDotEnv();
const { SHEET_CSV_URL, TMDB_API_KEY } = process.env;
const USE_LB = process.env.LETTERBOXD !== '0';
const args = new Set(process.argv.slice(2));
const HISTORY_ONLY = args.has('--history-only');
const FORCE_HISTORY = args.has('--force-history');
const HIST_DIR = process.env.HISTORY_DIR ?? path.join(root, 'data/history'); // overridable for tests
const DAY = 864e5;

const log = (...a) => console.log('[sync]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadDotEnv() {
  const f = path.join(root, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env) && m[2]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// ---- 1. read the sheet --------------------------------------------------------------------------

/** Accepts a "publish to web" link, a sheet edit link, or a local path. */
function toCsvUrl(u) {
  if (/output=csv|format=csv|tqx=out:csv/.test(u)) return u;
  const m = u.match(/spreadsheets\/d\/([\w-]+)/);
  if (!m || m[1] === 'e') return u;
  const gid = u.match(/gid=(\d+)/)?.[1];
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
}

async function readCsv() {
  if (SHEET_CSV_URL && /^https?:/.test(SHEET_CSV_URL)) {
    const url = toCsvUrl(SHEET_CSV_URL);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok)
      throw new Error(
        `Sheet download failed: HTTP ${res.status} (is it published / shared by link?)`
      );
    const text = await res.text();
    if (/^\s*<(!doctype|html)/i.test(text))
      throw new Error('Sheet URL returned HTML, not CSV (publish it as CSV).');
    log('sheet: downloaded from Google Sheets');
    return text;
  }
  const candidates = [SHEET_CSV_URL, 'data/movies.csv'].filter(Boolean);
  for (const c of candidates) {
    const f = path.resolve(root, c);
    if (fs.existsSync(f)) {
      log('sheet: reading', path.relative(root, f));
      return fs.readFileSync(f, 'utf8');
    }
  }
  throw new Error('No data: set SHEET_CSV_URL or add data/movies.csv');
}

// ---- 2. normalise rows --------------------------------------------------------------------------

/** First non-empty value among several possible column names (the sheets changed a little over the years). */
const col = (r, ...names) => {
  for (const n of names) if (r[n] != null && r[n] !== '') return r[n];
  return '';
};
/** "35 mm" and "35mm" are the same tag. */
const tidyTag = (t) =>
  t
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(\d+)\s*mm\b/i, '$1mm');

function normaliseRows(rows) {
  const films = [];
  const unknownCountries = new Set();
  const skipped = [];
  const seq = {};
  for (const r of rows) {
    const date = parseDate(r.date);
    const title = r.title;
    // ids: `tmdbId`, or `imdbId` ("tt1234567"); an IMDb id pasted in the tmdbId column is understood too
    let tmdbRaw = String(col(r, 'tmdbId', 'tmdb')).trim();
    let imdbRaw = String(col(r, 'imdbId', 'imdb')).trim();
    if (/^tt\d+$/i.test(tmdbRaw)) {
      imdbRaw ||= tmdbRaw;
      tmdbRaw = '';
    }
    if (!title && !tmdbRaw && !imdbRaw) continue; // empty row
    if (!date) {
      skipped.push(title);
      continue;
    } // a viewing needs a date
    const watchYear = +date.slice(0, 4);
    // `year` column = the film's own year (what Letterboxd shows); `releaseYear` = local release, used as fallback.
    const filmYear = parseInt(r.year, 10) || parseInt(r.releaseYear, 10) || null;
    const countries = [];
    for (const name of splitList(r.country)) {
      const code = countryCode(name);
      if (code) countries.push(code);
      else unknownCountries.add(name);
    }
    const mediumType = classifyMedium(r.medium, config);
    const key = `${date}-${tmdbRaw || imdbRaw || title}`;
    seq[key] = (seq[key] ?? 0) + 1;
    const noteNum = parseFloat(r.note_num);
    films.push({
      id: `${key}#${seq[key]}`,
      date,
      watchYear,
      filmYear,
      tmdbId: tmdbRaw ? parseInt(tmdbRaw, 10) || null : null,
      imdbId: imdbRaw || null, // kept: lets the dashboard tell films apart even when TMDb can't resolve one
      title,
      titles: { en: title, fr: title },
      medium: r.medium || null,
      mediumType,
      venue: venueName(r.medium, mediumType, config),
      place: r.place || null,
      with: splitList(r.with),
      rewatch: isTrue(r.rewatch),
      rating: parseRating(r.note) ?? (noteNum > 0 && noteNum <= 5 ? noteNum : null),
      dubbed: isTrue(r.VF),
      comment: r.comment || null,
      tags: splitList(r.comment).map(tidyTag),
      runtime: parseRuntime(r.runtime),
      countries: [...new Set(countries)],
      directors: splitList(r.directors),
      actors: splitList(r.actors).slice(0, config.maxActors ?? 10), // top-billed only
      genres: [...new Set(splitList(r.genres).map(canonicalGenre))],
      femaleDirector: isTrue(col(r, 'femaleDirector', 'womenDirector')),
      // filled by enrichment (all optional)
      posters: { en: null, fr: null }, // per page language
      originalLanguage: null,
      debut: null,
      avg: null
    });
  }
  films.sort((a, b) => a.date.localeCompare(b.date));
  return { films, unknownCountries, skipped };
}

// ---- 3. enrichment (TMDb, Letterboxd) -------------------------------------------------------------

const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
cache.movies ??= {};
cache.people ??= {};
cache.lb ??= {};
cache.runtimes ??= {};
cache.debut ??= {};
cache.imdb ??= {};
cache.credits ??= {};
cache.aliases ??= {};
const saveCache = () => {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
};
const fresh = (e, days) => e && Date.now() - e.at < days * DAY;

let tmdbFailures = 0;
async function tmdb(pathname, params = {}) {
  const u = new URL(`${TMDB_BASE}${pathname}`);
  const headers = { accept: 'application/json' };
  if (TMDB_API_KEY.startsWith('eyJ')) headers.authorization = `Bearer ${TMDB_API_KEY}`;
  else u.searchParams.set('api_key', TMDB_API_KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(u, { headers });
      if (res.status === 429) {
        await sleep((+res.headers.get('retry-after') || 2) * 1000);
        continue;
      }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`TMDb ${res.status} on ${pathname}`);
      tmdbFailures = 0;
      return await res.json();
    } catch (e) {
      if (attempt === 3) {
        tmdbFailures++;
        throw e;
      }
      await sleep(800 * (attempt + 1));
    }
  }
}

async function pool(items, size, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const item = items[i++];
        await fn(item);
      }
    })
  );
}

/** IMDb id ("tt…") -> TMDb id through TMDb's /find endpoint. The mapping never changes, so it is cached for good. */
async function resolveImdbIds(films) {
  const wanted = [...new Set(films.filter((f) => !f.tmdbId && f.imdbId).map((f) => f.imdbId))];
  const todo = wanted.filter((id) => !cache.imdb[id]);
  if (wanted.length) log(`tmdb: ${wanted.length} IMDb ids, ${todo.length} to resolve`);
  await pool(todo, 4, async (imdb) => {
    if (tmdbFailures >= 3) return;
    try {
      const d = await tmdb(`/find/${imdb}`, { external_source: 'imdb_id' });
      cache.imdb[imdb] = { at: Date.now(), tmdbId: d?.movie_results?.[0]?.id ?? null };
    } catch (e) {
      log(`tmdb: ${imdb} failed (${e.message})`);
    }
  });
  for (const f of films) if (!f.tmdbId && f.imdbId) f.tmdbId = cache.imdb[f.imdbId]?.tmdbId ?? null;
}

async function enrichTmdb(films) {
  await resolveImdbIds(films);
  const ids = [...new Set(films.map((f) => f.tmdbId).filter(Boolean))];
  const todo = ids.filter((id) => !(fresh(cache.movies[id], 30) && cache.movies[id].v === 2));
  log(`tmdb: ${ids.length} films, ${todo.length} to fetch`);
  await pool(todo, 4, async (id) => {
    if (tmdbFailures >= 3) return;
    try {
      const d = await tmdb(`/movie/${id}`, {
        language: 'en-US',
        append_to_response: 'images,credits,translations',
        include_image_language: 'en,fr,null'
      });
      if (!d) {
        cache.movies[id] = { at: Date.now(), missing: true };
        return;
      }
      const fr = d.translations?.translations?.find((t) => t.iso_639_1 === 'fr')?.data ?? {};
      let posters = d.images?.posters ?? [];
      if (
        config.posters?.policy === 'always-original' &&
        !['en', 'fr'].includes(d.original_language)
      ) {
        const extra = await tmdb(`/movie/${id}/images`, {
          include_image_language: d.original_language
        });
        posters = posters.concat(extra?.posters ?? []);
      }
      cache.movies[id] = {
        v: 2,
        at: Date.now(),
        titleEn: d.title,
        titleFr: fr.title || null,
        originalTitle: d.original_title,
        originalLanguage: d.original_language,
        posterPath: d.poster_path,
        releaseDate: d.release_date || null,
        voteAverage: d.vote_average,
        voteCount: d.vote_count,
        posters: posters.slice(0, 40).map((p) => ({
          iso_639_1: p.iso_639_1,
          file_path: p.file_path,
          vote_average: p.vote_average,
          vote_count: p.vote_count
        })),
        directors: (d.credits?.crew ?? [])
          .filter((c) => c.job === 'Director')
          .map((c) => ({
            id: c.id,
            name: c.name,
            profile: c.profile_path || null,
            gender: c.gender || 0
          })),
        cast: (d.credits?.cast ?? []).slice(0, 20).map((c) => ({
          id: c.id,
          name: c.name,
          profile: c.profile_path || null,
          gender: c.gender || 0
        }))
      };
    } catch (e) {
      log(`tmdb: movie ${id} failed (${e.message})`);
    }
  });
  if (tmdbFailures >= 3) log('tmdb: too many failures, using cached data only');

  // directors' filmographies -> directorial debut detection (features only: no shorts, no TV movies)
  const people = new Set();
  for (const id of ids) for (const d of cache.movies[id]?.directors ?? []) people.add(d.id);
  const ptodo = [...people].filter(
    (p) => !(fresh(cache.people[p], 120) && cache.people[p].credits)
  );
  log(`tmdb: ${people.size} directors, ${ptodo.length} to fetch`);
  await pool(ptodo, 4, async (pid) => {
    if (tmdbFailures >= 3) return;
    try {
      const d = await tmdb(`/person/${pid}/movie_credits`);
      cache.people[pid] = {
        at: Date.now(),
        credits: (d?.crew ?? [])
          .filter((c) => c.job === 'Director')
          .map((c) => ({
            id: c.id,
            date: c.release_date || '',
            tv: (c.genre_ids ?? []).includes(TV_MOVIE_GENRE)
          }))
      };
    } catch (e) {
      log(`tmdb: person ${pid} failed (${e.message})`);
    }
  });

  /** Runtime of an earlier credit, 0 for TV movies/unknown runtimes, null when it could not be fetched. */
  async function featureRuntime(id) {
    const c = cache.runtimes[id];
    if (fresh(c, 365)) return c.runtime;
    try {
      const d = await tmdb(`/movie/${id}`, { language: 'en-US' });
      const tv = (d?.genres ?? []).some((g) => g.id === TV_MOVIE_GENRE);
      cache.runtimes[id] = { at: Date.now(), runtime: tv ? 0 : d?.runtime || 0 };
      return cache.runtimes[id].runtime;
    } catch {
      return null;
    }
  }

  const dtodo = ids.filter(
    (id) => cache.movies[id] && !cache.movies[id].missing && !fresh(cache.debut[id], 120)
  );
  log(`tmdb: ${dtodo.length} debut checks`);
  await pool(dtodo, 4, async (id) => {
    if (tmdbFailures >= 3) return;
    const m = cache.movies[id];
    if (!m.directors.length || !m.releaseDate) {
      cache.debut[id] = { at: Date.now(), value: null };
      return;
    }
    const status = [];
    for (const d of m.directors) {
      const credits = cache.people[d.id]?.credits;
      if (!credits) {
        status.push('unknown');
        continue;
      }
      let s = 'debut';
      for (const cid of earlierCandidates(id, m.releaseDate, credits)) {
        const rt = await featureRuntime(cid); // stop at the first earlier feature
        if (rt == null) {
          s = 'unknown';
          break;
        }
        if (rt >= FEATURE_MIN_RUNTIME) {
          s = 'not';
          break;
        }
      }
      status.push(s);
    }
    // a film is a debut if any of its directors makes their first feature with it
    const value = status.includes('debut') ? true : status.includes('unknown') ? null : false;
    if (value !== null || !status.includes('unknown')) cache.debut[id] = { at: Date.now(), value };
  });
  saveCache();
}

async function enrichLetterboxd(films) {
  const ids = [...new Set(films.map((f) => f.tmdbId).filter(Boolean))];
  const todo = ids.filter((id) => !fresh(cache.lb[id], 30));
  log(`letterboxd: ${ids.length} films, ${todo.length} to fetch`);
  let fails = 0;
  for (const id of todo) {
    if (fails >= 3) {
      log('letterboxd: blocked or unreachable, community ratings will be missing');
      break;
    }
    try {
      const res = await fetch(`${LB_BASE}/tmdb/${id}/`, {
        redirect: 'follow',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; personal-stats-dashboard)',
          'accept-language': 'en'
        }
      });
      if (res.status === 404) {
        cache.lb[id] = { at: Date.now(), rating: null };
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const { rating, count } = parseLetterboxdRating(html); // twitter:data2 meta, else JSON-LD
      cache.lb[id] = { at: Date.now(), rating, count };
      fails = 0;
    } catch (e) {
      fails++;
      log(`letterboxd: ${id} failed (${e.message})`);
    }
    await sleep(600);
  }
  saveCache();
}

/** A TMDb credit -> { id, p: profile path, g: 'f' | 'm' | 'x' }. */
const personInfo = (c) => ({
  id: c.id,
  p: c.profile || undefined,
  g: { 1: 'f', 2: 'm', 3: 'x' }[c.gender]
});
/** name (as written in the sheet) -> personInfo for people TMDb knows. */
const people = {};
function addPeople(f, m) {
  const byName = new Map([...m.directors, ...(m.cast ?? [])].map((p) => [norm(p.name), p]));
  for (const name of [...f.directors, ...f.actors]) {
    const p = byName.get(norm(name));
    if (p && (p.profile || p.gender)) people[name] ??= personInfo(p);
  }
}

function applyEnrichment(films) {
  for (const f of films) {
    const m = f.tmdbId && cache.movies[f.tmdbId];
    if (m && !m.missing) {
      f.titles = {
        en: m.titleEn || f.title,
        fr:
          m.titleFr ||
          (m.originalLanguage === 'fr' ? m.originalTitle : null) ||
          m.titleEn ||
          f.title
      };
      f.originalTitle = m.originalTitle && m.originalTitle !== f.titles.en ? m.originalTitle : null;
      f.originalLanguage = m.originalLanguage;
      const poster = (lang) =>
        pickPoster(
          { posters: m.posters },
          m.originalLanguage,
          lang,
          m.posterPath,
          config.posters?.policy
        );
      f.posters = { en: poster('en'), fr: poster('fr') };
      f.debut = cache.debut[f.tmdbId]?.value ?? null;
      addPeople(f, m);
    }
    const lb = f.tmdbId && cache.lb[f.tmdbId];
    if (lb?.rating) f.avg = lb.rating; // community average: Letterboxd only
  }
}

// ---- main ---------------------------------------------------------------------------------------

/** peopleFor(films): the slice of the global people dictionary that these films mention. */
function peopleFor(films) {
  const out = {};
  for (const f of films)
    for (const n of [...f.directors, ...f.actors]) if (people[n]) out[n] = people[n];
  return out;
}

/** CSV rows -> final films (normalised, enriched). */
async function processRows(rows, label) {
  const { films, unknownCountries, skipped } = normaliseRows(rows);
  if (skipped.length)
    log(
      `${label}: skipped ${skipped.length} rows without a valid date:`,
      skipped.slice(0, 5).join('; ')
    );
  log(`${label}: ${rows.length} rows -> ${films.length} viewings`);
  if (TMDB_API_KEY) {
    await enrichTmdb(films);
    if (USE_LB) await enrichLetterboxd(films);
  } else {
    log('tmdb: TMDB_API_KEY not set – skipping posters, photos, localised titles and debuts');
  }
  applyEnrichment(films);
  if (unknownCountries.size)
    log(`${label}: unrecognised countries (ignored):`, [...unknownCountries].join(', '));
  const noId = films.filter((f) => !f.tmdbId).length;
  if (noId) log(`${label}: ${noId} viewings without a TMDb match (no poster)`);
  return films;
}

const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);

/**
 * Past years. data/history/<name>.csv is synced once into data/history/<name>.json, which is what the site uses
 * from then on (commit the JSON). Without a TMDb key nothing is written, so an un-enriched file never counts as "done".
 */
async function loadHistory() {
  if (!fs.existsSync(HIST_DIR)) return [];
  const names = new Set(
    fs
      .readdirSync(HIST_DIR)
      .filter((f) => /\.(csv|json)$/.test(f))
      .map((f) => f.replace(/\.(csv|json)$/, ''))
  );
  const datasets = [];
  for (const name of [...names].sort()) {
    const csvPath = path.join(HIST_DIR, `${name}.csv`);
    const jsonPath = path.join(HIST_DIR, `${name}.json`);
    const saved = readJson(jsonPath);
    if (!fs.existsSync(csvPath)) {
      datasets.push({ name, ...saved }); // JSON only: already synced
      continue;
    }
    const text = fs.readFileSync(csvPath, 'utf8');
    const csvHash = createHash('sha1').update(text).digest('hex');
    const done =
      saved && saved.csvHash === csvHash && (saved.enriched || !TMDB_API_KEY) && !FORCE_HISTORY;
    if (done) {
      log(`history ${name}: already synced (${saved.films.length} viewings)`);
      datasets.push({ name, ...saved });
      continue;
    }
    const films = await processRows(parseCsv(text), `history ${name}`);
    const payload = {
      csvHash,
      enriched: !!TMDB_API_KEY,
      syncedAt: new Date().toISOString(),
      people: peopleFor(films),
      films
    };
    if (TMDB_API_KEY) {
      fs.writeFileSync(jsonPath, JSON.stringify(payload));
      log(
        `history ${name}: wrote ${path.relative(root, jsonPath)} – commit it, it won't be synced again`
      );
    } else {
      log(
        `history ${name}: processed in memory only (set TMDB_API_KEY and run "npm run sync:history", then commit the JSON)`
      );
    }
    datasets.push({ name, ...payload });
  }
  return datasets;
}

const history = await loadHistory();
if (HISTORY_ONLY) {
  log('history-only run, done.');
  process.exit(0);
}

/**
 * Names the sheet writes in another script (章子怡, Александр Годунов…) -> the Latin spelling TMDb has for the
 * same person. Runs over every year, history included, so the frozen JSON files never need re-syncing.
 */
async function latinisePeople(films, people) {
  if (!TMDB_API_KEY) return;
  const isNative = (n) => n && !isLatin(n);
  const wanted = films.filter((f) => f.tmdbId && [...f.directors, ...f.actors].some(isNative));
  const ids = [...new Set(wanted.map((f) => f.tmdbId))];
  const todo = ids.filter((id) => !fresh(cache.credits[id], 90));
  log(`tmdb: ${ids.length} films with non-Latin names, ${todo.length} credits to fetch`);
  await pool(todo, 4, async (id) => {
    if (tmdbFailures >= 3) return;
    try {
      const d = await tmdb(`/movie/${id}/credits`, { language: 'en-US' });
      const slim = (c) => ({
        id: c.id,
        name: c.name,
        original_name: c.original_name,
        profile: c.profile_path || null,
        gender: c.gender || 0
      });
      cache.credits[id] = {
        at: Date.now(),
        people: [
          ...(d?.crew ?? []).filter((c) => c.job === 'Director').map(slim),
          ...(d?.cast ?? []).map(slim)
        ]
      };
    } catch (e) {
      log(`tmdb: credits of ${id} failed (${e.message})`);
    }
  });

  // some people have a native name even in English: their aliases usually include a Latin one
  const alias = async (pid) => {
    if (!fresh(cache.aliases[pid], 90) && tmdbFailures < 3) {
      try {
        const d = await tmdb(`/person/${pid}`, { language: 'en-US' });
        cache.aliases[pid] = { at: Date.now(), name: latinAlias(d) };
      } catch (e) {
        log(`tmdb: person ${pid} failed (${e.message})`);
      }
    }
    return cache.aliases[pid]?.name ?? null;
  };

  const unresolved = new Set();
  const renamed = new Map();
  for (const f of wanted) {
    const credits = cache.credits[f.tmdbId]?.people ?? [];
    for (const key of ['directors', 'actors']) {
      const out = [];
      for (const name of f[key]) {
        let next = name;
        if (isNative(name)) {
          const c = findCredit(name, credits);
          const latin = c && (isLatin(c.name) ? c.name : await alias(c.id));
          if (latin) {
            next = latin;
            renamed.set(name, latin);
            if (c.profile || c.gender) people[latin] ??= personInfo(c);
          } else unresolved.add(name);
        }
        out.push(next);
      }
      f[key] = [...new Set(out)];
    }
  }
  // a name TMDb matched under its native spelling keeps its photo under the new one
  for (const [old, latin] of renamed) {
    if (people[old]) {
      people[latin] ??= people[old];
      delete people[old];
    }
  }
  saveCache();
  log(`names: ${renamed.size} renamed to a Latin spelling, ${unresolved.size} left as written`);
  if (unresolved.size) log('names left as written:', [...unresolved].slice(0, 30).join(', '));
}

// the current year: re-read from the sheet on every run
const currentFilms = await processRows(parseCsv(await readCsv()), 'current');
const currentYears = new Set(currentFilms.map((f) => f.watchYear));
// years present in the live sheet win over history files covering the same year
const films = [
  ...history.flatMap((d) => d.films).filter((f) => !currentYears.has(f.watchYear)),
  ...currentFilms
].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
const allPeople = Object.assign({}, ...history.map((d) => d.people ?? {}), peopleFor(currentFilms));
await latinisePeople(films, allPeople);

// report so misclassifications are easy to spot in the CI log
const byType = {};
for (const f of films) (byType[f.mediumType] ??= new Set()).add(f.venue ?? '(none)');
for (const [t, s] of Object.entries(byType)) log(`medium → ${t}: ${[...s].join(', ')}`);
const perYear = {};
for (const f of films) perYear[f.watchYear] = (perYear[f.watchYear] ?? 0) + 1;
log(
  'viewings per year:',
  Object.entries(perYear)
    .map(([y, n]) => `${y}: ${n}`)
    .join(', ')
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    enriched: !!TMDB_API_KEY || history.some((d) => d.enriched),
    people: allPeople,
    films
  })
);
log('wrote', path.relative(root, OUT));
