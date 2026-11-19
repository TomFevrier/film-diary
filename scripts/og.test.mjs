import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse, describe } from './og-lib.mjs';

const film = (o) => ({
  id: Math.random(),
  date: '2026-01-01',
  watchYear: 2026,
  filmYear: 2000,
  tmdbId: null,
  imdbId: null,
  title: 'X',
  titles: {},
  mediumType: 'streaming',
  rewatch: false,
  rating: null,
  runtime: 100,
  posters: { en: '/p.jpg', fr: '/p.jpg' },
  ...o
});

test('best = top-rated first watches of the year, rewatches and earlier discoveries excluded', () => {
  const films = [
    film({ tmdbId: 1, title: 'Old favourite', watchYear: 2025, date: '2025-05-01', rating: 5 }),
    film({ tmdbId: 1, title: 'Old favourite', date: '2026-02-01', rating: 5, rewatch: true }),
    film({ tmdbId: 2, title: 'New 4.5', date: '2026-03-01', rating: 4.5 }),
    film({ tmdbId: 3, title: 'New 5 older', date: '2026-01-10', rating: 5 }),
    film({ tmdbId: 4, title: 'New 5 recent', date: '2026-04-10', rating: 5 }),
    film({ tmdbId: 5, title: 'Unrated', date: '2026-04-11' }),
    // the only viewing in the data, but flagged as a rewatch: seen before the data starts
    film({ tmdbId: 6, title: 'Seen long ago', date: '2026-05-01', rating: 5, rewatch: true })
  ];
  const { best } = analyse(films, { n: 3 });
  assert.deepEqual(
    best.map((f) => f.title),
    ['New 5 recent', 'New 5 older', 'New 4.5']
  );
});

test('stats: distinct films, all viewings for hours and media', () => {
  const films = [
    film({ tmdbId: 1, mediumType: 'cinema', runtime: 120 }),
    film({ tmdbId: 1, mediumType: 'cinema', runtime: 120, rewatch: true }),
    film({ tmdbId: 2, mediumType: 'physical', runtime: 60 }),
    film({ tmdbId: 3, runtime: 60 })
  ];
  const { stats } = analyse(films, {});
  assert.deepEqual(stats, {
    year: 2026,
    films: 3,
    minutes: 360,
    cinema: 2,
    physical: 1,
    streaming: 1
  });
});

test('films without a poster are skipped while enough others have one', () => {
  const films = [
    film({ tmdbId: 1, title: 'A', rating: 5, posters: { en: null, fr: null } }),
    film({ tmdbId: 2, title: 'B', rating: 4, posters: { en: '/b.jpg', fr: '/b.jpg' } }),
    film({ tmdbId: 3, title: 'C', rating: 3, posters: { en: '/c.jpg', fr: '/c.jpg' } })
  ];
  assert.deepEqual(
    analyse(films, { n: 2 }).best.map((f) => f.title),
    ['B', 'C']
  );
  assert.deepEqual(
    analyse(films, { n: 3 }).best.map((f) => f.title),
    ['A', 'B', 'C']
  );
});

test('description mentions only the cinema count, in each language', () => {
  const picked = analyse(
    [
      film({
        tmdbId: 1,
        title: 'Amelie',
        titles: { en: 'Amélie', fr: 'Le Fabuleux Destin d’Amélie Poulain' },
        rating: 5,
        mediumType: 'cinema',
        runtime: 120
      })
    ],
    {}
  );
  assert.equal(
    describe(picked, 'en').description,
    '2026: 1 films, 2 hours, 1 at the cinema. Best new discoveries so far: Amélie.'
  );
  assert.match(
    describe(picked, 'fr').description,
    /au cinéma\. Mes meilleures découvertes à ce jour\u00a0: Le Fabuleux Destin/
  );
  assert.doesNotMatch(describe(picked, 'en').description, /Blu-ray|streaming/i);
});

test('a mix of new releases (at most 3) and older films, best first', () => {
  const old = (id, rating) =>
    film({ tmdbId: id, title: `old ${id}`, filmYear: 1970, rating, date: `2026-01-${10 + id}` });
  const fresh = (id, rating) =>
    film({ tmdbId: id, title: `new ${id}`, filmYear: 2026, rating, date: `2026-02-${10 + id}` });
  const films = [
    fresh(1, 5),
    fresh(2, 5),
    fresh(3, 4.5),
    fresh(4, 4.5),
    old(5, 4),
    old(6, 4),
    old(7, 3.5)
  ];
  const titles = (r) => r.best.map((f) => f.title);
  // 3 new + 2 classics, even though a 4th new release outranks the classics
  assert.deepEqual(titles(analyse(films, {})), ['new 2', 'new 1', 'new 4', 'old 6', 'old 5']);
  // too few classics: new releases fill the gap
  assert.deepEqual(titles(analyse(films.slice(0, 5), {})), [
    'new 2',
    'new 1',
    'new 4',
    'new 3',
    'old 5'
  ]);
  // too few new releases: classics fill the gap
  assert.deepEqual(titles(analyse(films.slice(3), {})), ['new 4', 'old 6', 'old 5', 'old 7']);
});
