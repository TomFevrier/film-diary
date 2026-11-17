import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCsv,
  parseRating,
  parseDate,
  parseRuntime,
  classifyMedium,
  countryCode,
  canonicalGenre,
  pickPoster,
  venueName,
  earlierCandidates,
  parseLetterboxdRating
} from './lib.mjs';
import config from '../config.json' with { type: 'json' };

test('csv with quotes and commas', () => {
  const r = parseCsv('a,b\n"x, y","say ""hi"""\n');
  assert.deepEqual(r, [{ a: 'x, y', b: 'say "hi"' }]);
});
test('ratings', () => {
  assert.equal(parseRating('***°'), 3.5);
  assert.equal(parseRating('*****'), 5);
  assert.equal(parseRating('°'), 0.5);
  assert.equal(parseRating(''), null);
});
test('dates', () => {
  assert.equal(parseDate('2026-03-04'), '2026-03-04');
  assert.equal(parseDate('04/03/2026'), '2026-03-04');
  assert.equal(parseDate('4.3.2026'), '2026-03-04');
  assert.equal(parseDate('nope'), null);
});
test('runtime', () => {
  assert.equal(parseRuntime('142'), 142);
  assert.equal(parseRuntime('2h22'), 142);
});
test('medium', () => {
  assert.equal(classifyMedium('Netflix', config), 'streaming');
  assert.equal(classifyMedium('myCanal – Location', config), 'streaming');
  assert.equal(classifyMedium('Rip blu-ray', config), 'physical');
  assert.equal(classifyMedium('Cinéma Prince Charles', config), 'cinema');
  assert.equal(classifyMedium('', config), 'streaming');
  assert.equal(venueName('Cinéma Prince Charles', 'cinema', config), 'Prince Charles Cinema');
  assert.equal(venueName('Cinéma Ciné Lumière', 'cinema', config), 'Ciné Lumière');
  assert.equal(venueName('Cinema Odeon Greenwich', 'cinema', config), 'Odeon Greenwich');
  assert.equal(venueName('myCanal – Ciné+ OCS', 'streaming', config), 'myCanal');
  assert.equal(venueName('Sooner (Prime Video)', 'streaming', config), 'Sooner');
});
test('countries & genres', () => {
  assert.equal(countryCode('United States of America'), 'US');
  assert.equal(countryCode('France'), 'FR');
  assert.equal(countryCode('Corée du Sud'), 'KR');
  assert.equal(countryCode('Allemagne'), 'DE');
  assert.equal(canonicalGenre('Comédie'), 'Comedy');
  assert.equal(canonicalGenre('Science-Fiction'), 'Science Fiction');
});
test('posters & debut', () => {
  const images = {
    posters: [
      { iso_639_1: 'ja', file_path: '/ja.jpg' },
      { iso_639_1: 'en', file_path: '/en.jpg' }
    ]
  };
  assert.equal(pickPoster(images, 'ja', '/d.jpg'), '/en.jpg');
  assert.equal(pickPoster(images, 'ja', '/d.jpg', 'always-original'), '/ja.jpg');
});

test('debut candidates skip the film itself, undated, TV and later credits', () => {
  const credits = [
    { id: 1, date: '2020-01-01', tv: false },
    { id: 2, date: '2015-01-01', tv: false },
    { id: 3, date: '2012-01-01', tv: true },
    { id: 4, date: '', tv: false },
    { id: 5, date: '2021-01-01', tv: false },
    { id: 6, date: '2010-01-01', tv: false }
  ];
  assert.deepEqual(earlierCandidates(1, '2020-01-01', credits), [2, 6]);
  assert.deepEqual(earlierCandidates(1, null, credits), []);
});
test('letterboxd rating: meta tag, then CDATA JSON-LD', () => {
  const meta =
    '<meta name="twitter:label2" content="Average rating" />\n<meta name="twitter:data2" content="3.91 out of 5" />';
  assert.deepEqual(parseLetterboxdRating(meta), { rating: 3.91, count: null });
  const ld =
    '<script type="application/ld+json">\n/* <![CDATA[ */\n{"@type":"Movie","aggregateRating":{"@type":"AggregateRating","ratingValue":4.27,"ratingCount":152340,"bestRating":5}}\n/* ]]> */\n</script>';
  assert.deepEqual(parseLetterboxdRating(ld), { rating: 4.27, count: 152340 });
  assert.deepEqual(parseLetterboxdRating(meta + ld), { rating: 3.91, count: 152340 }); // meta wins
  assert.deepEqual(parseLetterboxdRating('<meta content="3,5 out of 5" name="twitter:data2">'), {
    rating: 3.5,
    count: null
  });
  assert.deepEqual(parseLetterboxdRating('<html>unrated</html>'), { rating: null, count: null });
});

test('film identity: rewatches and cross-year duplicates share a key; different films never merge', async () => {
  const { assignFilmKeys } = await import('../src/lib/film-keys.js');
  const films = [
    { title: 'Amélie', filmYear: 2001, tmdbId: 194 }, // 0
    { title: 'Amélie', filmYear: 2001, tmdbId: 194 }, // 1: rewatch, same ids
    { title: 'Le Fabuleux Destin d’Amélie Poulain', filmYear: 2001, tmdbId: 194 }, // 2: other title, same tmdb id
    { title: 'La Haine', filmYear: 1995, tmdbId: null, imdbId: 'tt0113247' }, // 3: only an IMDb id
    { title: 'La Haine', filmYear: 1995, tmdbId: 406 }, // 4: same film, resolved later, matched by title + year
    { title: 'Dune', filmYear: 1984, tmdbId: 841 }, // 5
    { title: 'Dune', filmYear: 1984, tmdbId: 999 }, // 6: same name and year but a different TMDb id: not the same film
    { title: 'Café', filmYear: 2020, tmdbId: null }, // 7
    { title: 'Cafe', filmYear: 2020, tmdbId: null } // 8: accents and case don't matter without ids
  ];
  const n = assignFilmKeys(films);
  const k = films.map((f) => f.film);
  assert.equal(k[0], k[1]);
  assert.equal(k[0], k[2]);
  assert.equal(k[3], k[4]);
  assert.notEqual(k[5], k[6]);
  assert.equal(k[7], k[8]);
  assert.equal(n, 5);
});

test('unique() keeps the latest viewing, preferring one that has a rating', async () => {
  const { unique, summarise } = await import('../src/lib/stats.js');
  const v = (film, date, rating, extra = {}) => ({
    film,
    date,
    rating,
    runtime: 100,
    mediumType: 'cinema',
    ...extra
  });
  const films = [
    v('a', '2024-01-01', 3),
    v('a', '2025-01-01', null),
    v('b', '2025-02-01', 4),
    v('a', '2026-01-01', 5, { rewatch: true })
  ];
  const u = unique(films);
  assert.equal(u.length, 2);
  assert.equal(u.find((f) => f.film === 'a').date, '2026-01-01');
  assert.equal(unique(films.slice(0, 2)).find((f) => f.film === 'a').rating, 3); // an unrated later viewing doesn't erase the rating
  const s = summarise(films);
  assert.equal(s.total.count, 4); // viewings
  assert.equal(s.films, 2); // distinct films
  assert.equal(s.avgRating, 4.5); // (5 + 4) / 2, per film
  assert.equal(s.total.minutes, 400); // time counts every viewing
});
