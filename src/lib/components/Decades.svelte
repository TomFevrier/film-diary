<script>
  import { max, descending } from 'd3-array';
  import { app, years } from '$lib/state.svelte.js';
  import { tally, decadeOf, unique } from '$lib/stats.js';
  import { ratingColor } from '$lib/colors.js';
  import { tip, onActivate } from '$lib/tip.js';
  import { LABEL } from '$lib/scale.js';

  const films = $derived(unique(app.films('decade'))); // one frame per film, not per viewing
  const f = $derived(app.fmt);
  const groups = $derived(new Map(tally(films, (x) => [decadeOf(x)]).map((g) => [g.key, g])));
  // Every decade is always listed (1920 = "before 1930"), so the chart keeps its shape under any filter.
  const baseGroups = $derived(tally(unique(app.base()), (x) => [decadeOf(x)]));
  const hi = $derived(Math.max(2020, max(baseGroups, (g) => g.key) ?? 2020));
  const decades = $derived(Array.from({ length: (hi - 1920) / 10 + 1 }, (_, i) => 1920 + i * 10));
  // unit sizes are derived from the unfiltered counts, so they stay put while filtering
  const maxCount = $derived(Math.max(1, ...baseGroups.map((g) => g.count)));

  // New releases: films seen in the year they came out
  const fresh = $derived(films.filter((x) => x.filmYear === x.watchYear));
  const freshYear = $derived(app.year ?? years[0]);

  // Geometry. `u` runs along the strip, `a` across it. Vertical (desktop) and horizontal (phone) share the maths.
  const PAD = 4;
  const FRAME_STROKE = '#05081a'; // same colour as the strip: draws the 1px separation
  const cfg = {
    v: { T: 34, S: 6, MAXLEN: 300, SLOT: 42 },
    h: { T: 26, S: 5, MAXLEN: 230, SLOT: 32 }
  };
  const decLabel = (d) => (d === 1920 ? '<1930' : String(d));
  const units = (g) =>
    [...g.films].sort(
      (a, b) => descending(a.rating ?? 0, b.rating ?? 0) || a.date.localeCompare(b.date)
    );

  /** Layout of one orientation. */
  function layout(o) {
    const { T, S, MAXLEN } = cfg[o];
    const inner = T - 2 * S;
    const avail = MAXLEN - 2 * PAD;
    // Square frames, as big as the strip allows: the number per row adapts to the busiest decade, so a decade of
    // 600 films still fits in the same length as one of 40 (frames just get smaller).
    const ideal = Math.min(7, Math.sqrt((inner * avail) / maxCount));
    let PER = Math.max(1, Math.floor(inner / ideal));
    while (PER < 40 && Math.ceil(maxCount / PER) * (inner / PER) > avail) PER++;
    const a = inner / PER;
    const len = (count) => Math.ceil(count / PER) * a + 2 * PAD;
    return {
      ...cfg[o],
      inner,
      PER,
      a,
      b: a,
      len,
      maxLen: len(maxCount),
      stroke: Math.min(1, a * 0.2)
    };
  }
  const lay = $derived({ v: layout('v'), h: layout('h') });
  let box = $state({ v: [0, 0], h: [0, 0] }); // rendered size of each svg, to keep labels at a constant pixel size
  let hover = $state(null); // the frame under the pointer, drawn on top so its outline is never covered

  const tipStrip = (d, g) => () => ({
    title: d === 1920 ? app.t('decades.before') : app.t('decade.label', { d }),
    sub: app.t('unit.films', { n: g.count }),
    rating: g.avg == null ? null : Math.round(g.avg * 2) / 2,
    lines: [f.span(g.minutes)]
  });
  const tipUnit = (u) => () => ({
    title: app.title(u),
    rating: u.rating,
    lines: [`${u.filmYear ?? ''} · ${(u.directors ?? []).join(', ')}`],
    films: [u]
  });
</script>

{#snippet chart(o)}
  {@const L = lay[o]}
  {@const LAB = 20}
  {@const TOP = 16}
  {@const LABW = 50}
  {@const W = o === 'v' ? decades.length * L.SLOT : LABW + L.maxLen + 34}
  {@const H = o === 'v' ? TOP + L.maxLen + LAB : decades.length * L.SLOT + 2}
  {@const k = box[o][0] && box[o][1] ? Math.min(box[o][0] / W, box[o][1] / H) : 1}
  <svg
    class={o}
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="xMidYMax meet"
    bind:clientWidth={box[o][0]}
    bind:clientHeight={box[o][1]}
    role="img"
    aria-label={app.t('decades.title')}
  >
    {#each decades as d, i (d)}
      {@const g = groups.get(d)}
      {@const sel = app.has('decade', d)}
      {@const len = g ? L.len(g.count) : 0}
      <!-- strip origin: top-left corner of its bounding box -->
      {@const sx = o === 'v' ? i * L.SLOT + 4 : LABW}
      {@const sy = o === 'v' ? TOP + L.maxLen - len : i * L.SLOT + 3}
      {@const w = o === 'v' ? L.T : len}
      {@const h = o === 'v' ? len : L.T}
      <g class:dim={app.hasAny('decade') && !sel}>
        {#if g}
          <rect
            x={sx}
            y={sy}
            width={w}
            height={h}
            rx="3"
            fill="#05081a"
            stroke={sel ? 'var(--gold)' : '#2c3b7c'}
            stroke-width={sel ? 1.8 : 1}
            role="button"
            tabindex="-1"
            aria-label="{g.count} — {d}"
            onclick={() => app.toggle('decade', d)}
            onkeydown={onActivate(() => app.toggle('decade', d))}
            use:tip={tipStrip(d, g)}
          />
          <!-- sprocket holes, kept inside the strip on both long sides -->
          {#each Array(Math.max(0, Math.floor((len - 2 * PAD + 2) / 6))) as _, k (k)}
            {@const along = PAD + k * 6}
            {#if o === 'v'}
              <rect
                x={sx + (L.S - 2.2) / 2}
                y={sy + along}
                width="2.2"
                height="2.8"
                rx="0.6"
                fill="#2c3b7c"
                pointer-events="none"
              />
              <rect
                x={sx + L.T - L.S + (L.S - 2.2) / 2}
                y={sy + along}
                width="2.2"
                height="2.8"
                rx="0.6"
                fill="#2c3b7c"
                pointer-events="none"
              />
            {:else}
              <rect
                x={sx + along}
                y={sy + (L.S - 2.2) / 2}
                width="2.8"
                height="2.2"
                rx="0.6"
                fill="#2c3b7c"
                pointer-events="none"
              />
              <rect
                x={sx + along}
                y={sy + L.T - L.S + (L.S - 2.2) / 2}
                width="2.8"
                height="2.2"
                rx="0.6"
                fill="#2c3b7c"
                pointer-events="none"
              />
            {/if}
          {/each}
          <!-- frames: best-rated first, edge to edge -->
          {#each units(g) as u, k (u.id)}
            {@const across = k % L.PER}
            {@const along = Math.floor(k / L.PER)}
            {@const ux = o === 'v' ? sx + L.S + across * L.a : sx + PAD + along * L.b}
            {@const uy = o === 'v' ? sy + h - PAD - (along + 1) * L.b : sy + L.S + across * L.a}
            {@const uw = o === 'v' ? L.a : L.b}
            {@const uh = o === 'v' ? L.b : L.a}
            <rect
              x={ux}
              y={uy}
              width={uw}
              height={uh}
              fill={u.rating == null ? '#56608f' : ratingColor(u.rating)}
              stroke={FRAME_STROKE}
              stroke-width={L.stroke}
              class="u"
              role="button"
              tabindex="-1"
              aria-label={app.title(u)}
              onclick={() => app.openDetail(u)}
              onpointerenter={() => (hover = { o, x: ux, y: uy, w: uw, h: uh })}
              onpointerleave={() => (hover = null)}
              use:tip={o === 'h' ? null : tipUnit(u)}
            />
          {/each}
          {#if o === 'v'}
            <text
              class="lab"
              x={sx + L.T / 2}
              y={sy - 4}
              text-anchor="middle"
              font-size={LABEL / k}
              style="fill:var(--text)"
              role="button"
              tabindex="-1"
              onclick={() => app.toggle('decade', d)}
              use:tip={tipStrip(d, g)}>{g.count}</text
            >
          {:else}
            <text
              class="lab"
              x={sx + len + 6}
              y={sy + L.T / 2 + 3.5}
              font-size={LABEL / k}
              style="fill:var(--text)"
              role="button"
              tabindex="-1"
              onclick={() => app.toggle('decade', d)}
              use:tip={tipStrip(d, g)}>{g.count}</text
            >
          {/if}
        {:else if o === 'v'}
          <rect x={sx} y={TOP + L.maxLen - 3} width={L.T} height="3" rx="1.5" fill="#1d2858" />
        {:else}
          <rect x={sx} y={sy + L.T / 2 - 1.5} width="3" height="3" rx="1.5" fill="#1d2858" />
        {/if}
        {#if o === 'v'}
          <text
            class="lab"
            x={sx + L.T / 2}
            y={H - 5}
            text-anchor="middle"
            font-size={LABEL / k}
            style:fill={sel ? 'var(--gold)' : null}
            role="button"
            tabindex="-1"
            onclick={() => app.toggle('decade', d)}
            use:tip={g ? tipStrip(d, g) : null}>{decLabel(d)}</text
          >
        {:else}
          <text
            class="lab"
            x={LABW - 6}
            y={sy + L.T / 2 + 3.5}
            text-anchor="end"
            font-size={LABEL / k}
            style:fill={sel ? 'var(--gold)' : null}
            role="button"
            tabindex="-1"
            onclick={() => app.toggle('decade', d)}
            use:tip={g ? tipStrip(d, g) : null}>{decLabel(d)}</text
          >
        {/if}
      </g>
    {/each}
    {#if hover?.o === o}
      <rect
        x={hover.x}
        y={hover.y}
        width={hover.w}
        height={hover.h}
        fill="none"
        stroke="#fff"
        stroke-width="1.6"
        pointer-events="none"
      />
    {/if}
  </svg>
{/snippet}

<div class="card fill">
  <div class="card-head">
    <h2>{app.t('decades.title')}</h2>
    <span class="sub">{app.t('decades.sub')}</span>
  </div>
  <div class="wrap">
    {@render chart('v')}
    {@render chart('h')}
  </div>
  <button
    class="fresh"
    class:on={app.has('new', true)}
    onclick={() => app.toggle('new', true)}
    aria-pressed={app.has('new', true)}
  >
    <i></i>
    <b>{f.int(fresh.length)}</b>
    {app.year == null ? app.t('flag.new') : app.t('decades.new', { year: freshYear })}
    <span>{films.length ? f.pct(fresh.length / films.length) : ''}</span>
  </button>
</div>

<style>
  .fill {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .wrap {
    flex: 1;
    min-height: 0;
    position: relative;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  svg.h {
    display: none;
  }
  @media (min-width: 701px) {
    .wrap {
      min-height: 340px;
    }
    svg.v {
      position: absolute;
      inset: 0;
      height: 100%;
    }
  }
  @media (max-width: 700px) {
    svg.v {
      display: none;
    }
    svg.h {
      display: block;
    }
  }
  g {
    transition: opacity 0.15s;
  }
  g.dim {
    opacity: 0.35;
  }
  rect[role='button']:hover {
    stroke: #6f82d6;
  }
  rect.u {
    cursor: pointer;
  }
  text.lab {
    cursor: pointer;
  }
  text.lab:hover {
    fill: var(--gold) !important;
  }
  .fresh {
    margin-top: 12px;
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #0a1030;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 4px 13px 4px 10px;
    font-size: 13px;
    color: var(--text);
  }
  .fresh i {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    background: var(--gold);
    display: block;
  }
  .fresh b {
    color: var(--gold);
  }
  .fresh span {
    color: var(--muted);
  }
  .fresh.on {
    background: var(--red);
    border-color: var(--red);
  }
</style>
