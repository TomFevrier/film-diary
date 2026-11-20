<script>
  import { timeDays, timeMonday, timeMonth } from 'd3-time';
  import { sum, group } from 'd3-array';
  import { app } from '$lib/state.svelte.js';
  import { ramp } from '$lib/colors.js';
  import { tip, onActivate } from '$lib/tip.js';
  import { LABEL } from '$lib/scale.js';

  // One year of the heatmap. byDay / maxV / bestKey come from the parent so colours and the busiest-day ring are
  // consistent across years. `films` are the films of the whole calendar (already filtered), used for festival bars.
  let { year, films, byDay, metric, maxV, bestKey, showYear = false } = $props();

  const S = 14,
    G = 3,
    LEFT = 2,
    LANE = 6, // height of a festival bar
    LANE_GAP = 3;
  const f = $derived(app.fmt);
  const val = (fs) => (metric === 'films' ? fs.length : sum(fs, (x) => x.runtime ?? 0));

  const days = $derived(timeDays(new Date(year, 0, 1), new Date(year + 1, 0, 1)));
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const week0 = $derived(timeMonday.floor(new Date(year, 0, 1)));
  const col = (d) => timeMonday.count(week0, d); // week column of a date

  // Festivals of this year: first to last viewing, stacked in lanes so overlapping ones don't collide.
  const spans = $derived.by(() => {
    const byName = group(
      films.filter((x) => x.watchYear === year),
      (x) => x.festivals[0] ?? null
    );
    const list = [];
    for (const [name, fs] of byName) {
      if (name == null) continue;
      const dates = fs.map((x) => x.date).sort();
      list.push({ name, from: dates[0], to: dates.at(-1), films: fs });
    }
    list.sort((a, b) => a.from.localeCompare(b.from));
    const laneEnd = []; // last occupied column per lane
    for (const sp of list) {
      sp.c0 = col(f.parseDay(sp.from));
      sp.c1 = col(f.parseDay(sp.to));
      let lane = laneEnd.findIndex((e) => e < sp.c0);
      if (lane < 0) lane = laneEnd.length;
      laneEnd[lane] = sp.c1;
      sp.lane = lane;
    }
    return list;
  });
  const lanes = $derived(spans.reduce((m, sp) => Math.max(m, sp.lane + 1), 0));
  const TOP = $derived(20 + (lanes ? lanes * (LANE + LANE_GAP) + 3 : 0));

  const cells = $derived(
    days.map((d) => {
      const k = iso(d);
      const fs = byDay.get(k) ?? [];
      return {
        d,
        k,
        x: LEFT + col(d) * (S + G),
        y: TOP + ((d.getDay() + 6) % 7) * (S + G),
        fs,
        festivals: [...new Set(fs.flatMap((x) => x.festivals))]
      };
    })
  );
  const bestCell = $derived(bestKey ? cells.find((c) => c.k === bestKey) : null);
  const months = $derived(
    timeMonth
      .range(new Date(year, 0, 1), new Date(year + 1, 0, 1))
      .map((d) => ({ d, x: LEFT + col(timeMonday.ceil(d)) * (S + G) }))
  );
  const W = $derived(LEFT + (col(new Date(year, 11, 31)) + 1) * (S + G));
  const H = $derived(TOP + 7 * (S + G));
  const dayLabels = [0, 1, 2, 3, 4, 5, 6];

  const fill = (c) =>
    c.fs.length ? ramp(0.18 + 0.82 * Math.sqrt(val(c.fs) / maxV)) : 'var(--cell)';
  // no weekday in the tooltip: just the date, the festival(s) and the films
  const tipFor = (c) => () => ({
    title: f.date(c.d),
    sub: `${app.t('unit.films', { n: c.fs.length })} · ${f.duration(sum(c.fs, (x) => x.runtime ?? 0))}`,
    festivals: c.festivals,
    lines: c.fs.map((x) => app.title(x)),
    films: c.fs
  });
  const tipSpan = (sp) => () => ({
    title: sp.name,
    festivals: [],
    sub: `${f.dayMonth(f.parseDay(sp.from))}${sp.to !== sp.from ? ` – ${f.dayMonth(f.parseDay(sp.to))}` : ''} · ${app.t('unit.films', { n: sp.films.length })}`,
    lines: [f.duration(sum(sp.films, (x) => x.runtime ?? 0))],
    films: sp.films.slice(-4)
  });

  let scroller;
  let svgH = $state(0); // rendered height of the heatmap, so the pinned weekday column lines up at any scale
  let svgW = $state(0);
  const k = $derived(svgW ? svgW / W : 1); // rendered px per viewBox unit (heatmap)
  const kd = $derived(svgH ? svgH / H : 1); // same for the pinned weekday column
  $effect(() => {
    // on small screens, start near the most recent activity, with a month label at the left edge (never cut in half).
    // scrollLeft is in pixels and month positions are in viewBox units, hence the scale.
    if (scroller && year) {
      const scale = scroller.firstElementChild.clientWidth / W || 1;
      const last = cells.findLast?.((c) => c.fs.length);
      const want = last ? Math.max(0, last.x * scale - scroller.clientWidth + 80) : 0;
      const target = Math.min(want, scroller.scrollWidth - scroller.clientWidth);
      const snap = months.filter((m) => m.x * scale - 4 <= target).at(-1);
      scroller.scrollLeft = snap && target > 0 ? snap.x * scale - 4 : 0;
    }
  });
</script>

<div class="year">
  {#if showYear}<div class="label">{year}</div>{/if}
  <div class="cal">
    <svg class="days" viewBox="0 0 12 {H}" style:height="{svgH}px" aria-hidden="true">
      {#each dayLabels as r (r)}<text
          x="6"
          y={TOP + r * (S + G) + S - 3}
          font-size={LABEL / kd}
          text-anchor="middle">{f.initial(new Date(2024, 0, 1 + r))}</text
        >{/each}
    </svg>
    <div class="scroll" bind:this={scroller}>
      <svg
        viewBox="0 0 {W} {H}"
        bind:clientHeight={svgH}
        bind:clientWidth={svgW}
        style:min-width="{Math.min(W, 760)}px"
        role="img"
        aria-label="{app.t('cal.title')} {year}"
      >
        {#each months as m (m.x)}<text x={m.x} y="11" font-size={LABEL / k}
            >{f.monthShort(m.d)}</text
          >{/each}

        <!-- festival bars: one per festival, from its first to its last viewing -->
        {#each spans as sp (sp.name)}
          {@const on = app.has('event', sp.name)}
          <rect
            class="fbar"
            class:on
            x={LEFT + sp.c0 * (S + G)}
            y={17 + sp.lane * (LANE + LANE_GAP)}
            width={(sp.c1 - sp.c0 + 1) * (S + G) - G}
            height={LANE}
            rx="3"
            role="button"
            tabindex="-1"
            aria-label={sp.name}
            onclick={() => app.toggle('event', sp.name)}
            onkeydown={onActivate(() => app.toggle('event', sp.name))}
            use:tip={tipSpan(sp)}
          />
        {/each}

        {#each cells as c (c.k)}
          {#if c.fs.length}
            <rect
              x={c.x}
              y={c.y}
              width={S}
              height={S}
              rx="3"
              fill={fill(c)}
              aria-label="{f.date(c.d)}: {c.fs.length}"
              use:tip={tipFor(c)}
            />
          {:else}
            <rect x={c.x} y={c.y} width={S} height={S} rx="3" fill="var(--cell)" />
          {/if}
        {/each}
        {#if bestCell}
          <rect
            x={bestCell.x - 2}
            y={bestCell.y - 2}
            width={S + 4}
            height={S + 4}
            rx="4.5"
            fill="none"
            stroke="#fff"
            stroke-width="1.8"
            pointer-events="none"
          />
        {/if}
      </svg>
    </div>
  </div>
</div>

<style>
  .label {
    font: 700 13px var(--title);
    color: var(--muted);
    margin: 0 0 10px 16px;
  }
  .cal {
    display: flex;
    gap: 4px;
    align-items: flex-start;
  }
  .days {
    flex: none;
    width: auto;
    display: block;
  }
  .scroll {
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
    flex: 1;
    min-width: 0;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  rect[aria-label]:hover {
    cursor: pointer;
    stroke: #fff;
    stroke-width: 1.5;
  }
  .fbar {
    fill: #fff;
    opacity: 0.7;
    cursor: pointer;
    transition: opacity 0.12s;
  }
  .fbar:hover,
  .fbar.on {
    opacity: 1;
    filter: drop-shadow(0 0 3px #ffffffaa);
  }
</style>
