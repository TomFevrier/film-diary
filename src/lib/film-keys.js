// One film can appear several times: rewatches, or the same film in different years' sheets. Every viewing gets a
// `film` key shared by all viewings of the same film. Matching, strongest first: TMDb id, IMDb id, then title + year
// (the last one covers rows whose ids aren't resolved yet, and never merges two films with different TMDb ids).

const norm = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Sets `film` on every viewing (films must be in date order). Returns the number of distinct films. */
export function assignFilmKeys(films) {
  const byTmdb = new Map();
  const byImdb = new Map();
  const byName = new Map();
  const tmdbOf = new Map(); // film key -> its TMDb id, if known
  let count = 0;
  for (const f of films) {
    const name = `${norm(f.title)}|${f.filmYear ?? ''}`;
    let key = (f.tmdbId && byTmdb.get(f.tmdbId)) || (f.imdbId && byImdb.get(f.imdbId)) || undefined;
    if (!key) {
      const k = byName.get(name);
      if (k && (!f.tmdbId || !tmdbOf.get(k) || tmdbOf.get(k) === f.tmdbId)) key = k;
    }
    if (!key) key = `f${++count}`;
    f.film = key;
    if (f.tmdbId) {
      byTmdb.set(f.tmdbId, key);
      tmdbOf.set(key, f.tmdbId);
    }
    if (f.imdbId) byImdb.set(f.imdbId, key);
    byName.set(name, key);
  }
  return count;
}
