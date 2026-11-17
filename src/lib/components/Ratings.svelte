<script>
  import { mean } from 'd3-array';
  import { unique } from '$lib/stats.js';
  import { app } from '$lib/state.svelte.js';
  import { ratingColor } from '$lib/colors.js';
  import { tip, onActivate } from '$lib/tip.js';
  import Stars from './Stars.svelte';
  import StarMark from './StarMark.svelte';

  const films = $derived(unique(app.films('rating'))); // each film counted once, with its latest rating
  const f = $derived(app.fmt);
  const buckets = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  const cols = $derived(buckets.map((r) => ({ r, fs: films.filter((x) => x.rating === r) })));
  const unrated = $derived(films.filter((x) => x.rating == null).length);
  const avg = $derived(
    mean(
      films.filter((x) => x.rating != null),
      (x) => x.rating
    )
  );

  // The plot has a fixed height. Squares are sized from the unfiltered data, so filtering never rescales the chart.
  // They sit edge to edge, separated by a thin stroke in the card colour (a gap would swallow them when a column
  // holds hundreds of films). The number of squares per row adapts so they stay as large as the space allows.
  const BW = 38,
    PADX = 5,
    PLOT = 132;
  const COLW = BW - 2 * PADX;
  const baseFilms = $derived(unique(app.base()));
  const baseMax = $derived(
    Math.max(1, ...buckets.map((r) => baseFilms.filter((x) => x.rating === r).length))
  );
  const grid = $derived.by(() => {
    const avail = PLOT - 4;
    const p0 = Math.min(6, Math.sqrt((COLW * avail) / baseMax)); // ideal square size
    let per = Math.max(1, Math.floor(COLW / p0));
    while (per < 80 && Math.ceil(baseMax / per) * (COLW / per) > avail) per++; // make the tallest column fit
    return { per, size: COLW / per };
  });
  const PER = $derived(grid.per);
  const D = $derived(grid.size);
  const STROKE = $derived(Math.min(0.9, D * 0.2)); // never thicker than a fifth of the square
  const avgX = $derived(avg == null ? null : ((avg - 0.5) / 4.5) * (BW * 9) + BW / 2);
</script>

<div class="card">
  <div class="card-head">
    <h2>{app.t('ratings.title')}</h2>
    {#if unrated}<span class="sub">{app.t('ratings.unrated', { n: unrated })}</span>{/if}
  </div>
  <svg
    viewBox="0 0 {BW * 10} {PLOT + 8}"
    style="--ring: #111a3d"
    role="img"
    aria-label={app.t('ratings.title')}
  >
    {#each cols as c, i (c.r)}
      {@const sel = app.has('rating', c.r)}
      <g opacity={app.hasAny('rating') && !sel ? 0.35 : 1}>
        <rect
          x={i * BW + 2}
          y="0"
          width={BW - 4}
          height={PLOT + 2}
          rx="3"
          class="col"
          class:sel
          role="button"
          tabindex="-1"
          aria-label="{f.stars(c.r)}: {c.fs.length}"
          onclick={() => app.toggle('rating', c.r)}
          onkeydown={onActivate(() => app.toggle('rating', c.r))}
          use:tip={() => ({
            rating: c.r,
            sub: app.t('unit.films', { n: c.fs.length }),
            lines: c.fs.slice(0, 5).map((x) => app.title(x)),
            films: c.fs.slice(-3)
          })}
        />
        {#each c.fs as x, k (x.id)}
          <rect
            x={i * BW + PADX + (k % PER) * D}
            y={PLOT - (Math.floor(k / PER) + 1) * D}
            width={D}
            height={D}
            fill={ratingColor(c.r)}
            stroke="var(--ring)"
            stroke-width={STROKE}
            pointer-events="none"
          />
        {/each}
      </g>
    {/each}
    <line x1="2" x2={BW * 10 - 2} y1={PLOT + 2} y2={PLOT + 2} stroke="#2a3978" />
    {#if avgX != null}<path d="M{avgX - 5} {PLOT + 3} l5 -7 l5 7 z" fill="var(--gold)" />{/if}
  </svg>
  <div class="axis"><span><Stars value={0.5} /></span><span><Stars value={5} /></span></div>
  {#if avg != null}<div class="avg">
      {app.t('ratings.avg', { n: f.dec2(avg) })}
      <StarMark />
    </div>{/if}
</div>

<style>
  .col {
    fill: transparent;
    cursor: pointer;
    transition: fill 0.12s;
  }
  .col:hover {
    fill: #ffffff17;
  }
  .col.sel {
    fill: #ffffff12;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .axis {
    display: flex;
    justify-content: space-between;
    color: var(--muted);
    font-size: 15px;
    padding: 4px 2px 0;
  }
  .avg {
    text-align: right;
    color: var(--gold);
    font-size: 12.5px;
    margin-top: 2px;
  }
</style>
