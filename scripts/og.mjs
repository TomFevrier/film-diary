#!/usr/bin/env node
// Generates the social preview image (1200x630 PNG) from the data, at build time:
//   static/og/og-<hash>.png   (the hash changes with the content, so social networks fetch the new one)
//   src/lib/data/og.json      (file name, alt text and description, read by +page.svelte for the <meta> tags)
//
// Shows the year's best-rated first watches (posters from TMDb) and a few stats. It never fails the build: if anything
// goes wrong it logs why and writes og.json without an image, and the page simply gets no og:image.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { analyse, describe, titleOf, TEXT } from './og-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const log = (...a) => console.log('[og]', ...a);
const config = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));
const DATA = path.join(root, 'src/lib/data/films.json');
const OUT_JSON = path.join(root, 'src/lib/data/og.json');
const OUT_DIR = path.join(root, 'static/og');
const CACHE = path.join(root, '.cache/og');
const IMAGE_BASE = process.env.TMDB_IMAGE_BASE ?? 'https://image.tmdb.org/t/p/w342';
const W = 1200;
const H = 630;
const GOLD = '#eab62f';

// ---- posters --------------------------------------------------------------------------------------------------

/** A poster as a data: URI (cached on disk), or null when it can't be fetched. */
async function poster(file) {
  const cached = path.join(CACHE, file.replace(/[^\w.-]/g, '_'));
  try {
    if (!fs.existsSync(cached)) {
      const res = await fetch(IMAGE_BASE + file, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
    }
    const bytes = fs.readFileSync(cached);
    const type = bytes[0] === 0x89 ? 'image/png' : 'image/jpeg';
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch (e) {
    log(`poster ${file} unavailable (${e.message}), using a placeholder`);
    return null;
  }
}

// ---- the card -------------------------------------------------------------------------------------------------

const h = (type, style, ...children) => ({
  type,
  props: {
    style: { display: 'flex', ...style },
    children: children.flat().filter((c) => c != null)
  }
});

/** A Lucide icon as an inline SVG (its path data is read from the installed package). */
const iconNodes = {};
function glyph(name, size) {
  iconNodes[name] ??= JSON.parse(
    fs
      .readFileSync(
        require.resolve(`@lucide/svelte/icons/${name}`).replace(/\.js$/, '.svelte'),
        'utf8'
      )
      .match(/__iconData = (\{.*?\});/s)[1]
  ).node;
  return {
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: GOLD,
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      style: { marginRight: 12, marginTop: 5 },
      children: iconNodes[name].map(([tag, attrs]) => ({ type: tag, props: attrs }))
    }
  };
}

/** The films count is the headline (gold, bigger); the other numbers are white. Lining figures, so they sit on the baseline. */
const numberStyle = (size, headline, extra = {}) => ({
  fontFamily: 'Playfair Display',
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1,
  fontFeatureSettings: '"lnum"',
  color: headline ? GOLD : '#ffffff',
  paddingTop: 4,
  ...extra
});

function card({ stats, hours, films, lang }) {
  const T = TEXT[lang];
  const n = (x) => x.toLocaleString(lang);
  const host = config.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // number (+ label), optionally preceded by an icon; every row has the same height so the icons line up
  const stat = (value, label, icon, size, headline = false) =>
    h(
      'div',
      { alignItems: 'center', height: 64 },
      icon ? glyph(icon, 30) : null,
      h('div', numberStyle(size, headline, { marginRight: 14 }), value),
      label
        ? h(
            'div',
            {
              fontFamily: 'Lato',
              fontWeight: 700,
              fontSize: 26,
              color: '#aab4e4',
              paddingTop: Math.round(size * 0.4) + (headline ? 8 : 0)
            },
            label
          )
        : null
    );
  // the three ways of watching, side by side: cinema, Blu-ray, streaming
  const media = h(
    'div',
    { alignItems: 'center', height: 64 },
    [
      ['popcorn', stats.cinema],
      ['disc-3', stats.physical],
      ['tv', stats.streaming]
    ].map(([icon, v]) =>
      h(
        'div',
        { alignItems: 'center', marginRight: 30 },
        glyph(icon, 30),
        h('div', numberStyle(40, false), n(v))
      )
    )
  );

  // a fan of up to five posters: the middle one in front, the outer ones tilted and lower
  const rotate = [-9, -4.5, 0, 4.5, 9];
  const lift = [46, 18, 0, 18, 46];
  const order = [0, 4, 1, 3, 2]; // paint order: outer posters first
  const count = films.length;
  const spread = 92;
  const fan = order
    .map((slot) => ({ slot, film: films[slot - ((5 - count) >> 1)] }))
    .filter((x) => x.film)
    .map(({ slot, film }) =>
      h(
        'div',
        {
          position: 'absolute',
          left: (slot - ((5 - count) >> 1)) * spread,
          top: lift[slot],
          width: 228,
          height: 342,
          borderRadius: 12,
          overflow: 'hidden',
          transform: `rotate(${rotate[slot]}deg)`,
          border: '3px solid rgba(255,255,255,0.22)',
          boxShadow: '0 20px 44px rgba(0,0,0,0.6)',
          background: '#1a2352'
        },
        film.image
          ? {
              type: 'img',
              props: {
                src: film.image,
                width: 228,
                height: 342,
                style: { width: 228, height: 342, objectFit: 'cover' }
              }
            }
          : h(
              'div',
              {
                width: 228,
                height: 342,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                textAlign: 'center',
                background: 'linear-gradient(160deg, #7a1f27, #1a2352)',
                color: '#f3e7c3',
                fontFamily: 'Playfair Display',
                fontWeight: 700,
                fontSize: 30
              },
              film.title
            )
      )
    );
  const fanWidth = (count - 1) * spread + 228 + 40;

  const sprockets = (top) =>
    h(
      'div',
      {
        position: 'absolute',
        left: 0,
        top,
        width: W,
        height: 18,
        justifyContent: 'space-between',
        padding: '0 14px'
      },
      Array.from({ length: 36 }, () =>
        h('div', { width: 18, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.11)' })
      )
    );

  return h(
    'div',
    {
      position: 'relative',
      width: W,
      height: H,
      background: 'linear-gradient(125deg, #0a0f24 0%, #111a44 58%, #2b1030 100%)'
    },
    h('div', {
      position: 'absolute',
      left: 0,
      top: 0,
      width: W,
      height: H,
      background: 'radial-gradient(circle at 18% 12%, rgba(178,34,34,0.38), rgba(178,34,34,0) 55%)'
    }),
    sprockets(20),
    sprockets(H - 38),
    h(
      'div',
      { position: 'absolute', left: 76, top: 64, flexDirection: 'column', width: 520 },
      h(
        'div',
        { fontFamily: 'Assistant', fontWeight: 800, fontSize: 30, letterSpacing: 7, color: GOLD },
        T.heading
      ),
      h(
        'div',
        {
          fontFamily: 'Playfair Display',
          fontWeight: 800,
          fontSize: 150,
          lineHeight: 1.05,
          color: '#ffffff',
          marginTop: 0
        },
        String(stats.year)
      ),
      h(
        'div',
        { flexDirection: 'column', marginTop: 14 },
        stat(n(stats.films), T.films, null, 56, true),
        stat(n(hours), T.hours, 'clock-3', 38),
        media
      )
    ),
    h(
      'div',
      {
        position: 'absolute',
        right: 70,
        bottom: 56,
        fontFamily: 'Lato',
        fontWeight: 400,
        fontSize: 24,
        color: '#7e89bb'
      },
      host
    ),
    films.length
      ? h('div', { position: 'absolute', right: 44, top: 112, width: fanWidth, height: 420 }, fan)
      : null
  );
}

// ---- main -----------------------------------------------------------------------------------------------------

async function main() {
  const films = JSON.parse(fs.readFileSync(DATA, 'utf8')).films;
  const picked = analyse(films, {});

  const fontFile = (pkg, file) =>
    fs.readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));
  const fonts = [
    {
      name: 'Lato',
      data: fontFile('lato', 'lato-latin-400-normal.woff'),
      weight: 400,
      style: 'normal'
    },
    {
      name: 'Lato',
      data: fontFile('lato', 'lato-latin-700-normal.woff'),
      weight: 700,
      style: 'normal'
    },
    {
      name: 'Assistant',
      data: fontFile('assistant', 'assistant-latin-800-normal.woff'),
      weight: 800,
      style: 'normal'
    },
    {
      name: 'Playfair Display',
      data: fontFile('playfair-display', 'playfair-display-latin-700-normal.woff'),
      weight: 700,
      style: 'normal'
    },
    {
      name: 'Playfair Display',
      data: fontFile('playfair-display', 'playfair-display-latin-800-normal.woff'),
      weight: 800,
      style: 'normal'
    }
  ];

  const images = await Promise.all(picked.best.map((f) => (f.poster ? poster(f.poster) : null)));
  const { default: satori } = await import('satori');
  const { Resvg } = await import('@resvg/resvg-js');
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const out = { width: W, height: H };
  for (const lang of Object.keys(TEXT)) {
    const { summary, description, hours } = describe(picked, lang);
    const shown = picked.best.map((f, i) => ({ title: titleOf(f, lang), image: images[i] }));
    const svg = await satori(card({ stats: picked.stats, hours, films: shown, lang }), {
      width: W,
      height: H,
      fonts
    });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
    const name = `og-${lang}-${crypto.createHash('sha1').update(png).digest('hex').slice(0, 10)}.png`;
    fs.writeFileSync(path.join(OUT_DIR, name), png);
    out[lang] = { file: `og/${name}`, description, alt: `${TEXT[lang].alt}, ${summary}` };
    log(`${lang}: ${description}`);
    log(
      `${lang}: wrote static/og/${name} (${(png.length / 1024).toFixed(0)} KB, ${images.filter(Boolean).length}/${images.length} posters)`
    );
  }
  fs.writeFileSync(OUT_JSON, JSON.stringify(out));
}

try {
  await main();
} catch (e) {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify({}));
  log(`could not generate the preview images (${e.message}); the pages will have no og:image`);
}
