import { feature } from 'topojson-client';
import iso from 'iso-3166-1';
import world from 'world-atlas/countries-110m.json';

const num2a2 = new Map(iso.all().map((c) => [c.numeric, c.alpha2]));
/** The 110m atlas' countries, with their ISO alpha-2 code. */
export const countries = feature(world, world.objects.countries).features.map((ft) => ({
  code: num2a2.get(String(ft.id).padStart(3, '0')),
  ft
}));
export const onMap = new Set(countries.map((c) => c.code));

/**
 * Rows of the map. Hong Kong is too small for the 110m atlas, so its films are counted with China's (a film made
 * in both counts once); the list view keeps them apart. `missing` lists the countries the atlas still lacks.
 */
export function mapRows(rows) {
  const hk = rows.find((r) => r.key === 'HK');
  let out = rows;
  if (hk) {
    const cn = rows.find((r) => r.key === 'CN');
    const films = [...new Set([...(cn?.films ?? []), ...hk.films])];
    const rated = films.filter((x) => x.rating != null);
    const merged = {
      key: 'CN',
      count: films.length,
      avg: rated.length ? rated.reduce((a, x) => a + x.rating, 0) / rated.length : null,
      films
    };
    out = [...rows.filter((r) => r.key !== 'CN' && r.key !== 'HK'), merged];
  }
  return { rows: out, hk, missing: out.filter((r) => !onMap.has(r.key)) };
}
