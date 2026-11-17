<script>
  import { max, greatest, least } from 'd3-array';
  import { app } from '$lib/state.svelte.js';
  import { tally, streaks, unique } from '$lib/stats.js';
  import { tip, onActivate } from '$lib/tip.js';
  import { LABEL } from '$lib/scale.js';

  const f = $derived(app.fmt);
  let barsW = $state(0);
  const k = $derived(barsW ? barsW / 280 : 1); // rendered px per viewBox unit
  const films = $derived(app.films()); // every viewing: days, weekdays, companions…
  const once = $derived(unique(films)); // each film once: longest / shortest / oldest
  const wd = $derived.by(() => {
    const src = app.films('weekday');
    return [1, 2, 3, 4, 5, 6, 0].map((d) => ({
      d,
      fs: src.filter((x) => new Date(x.date + 'T12:00:00').getDay() === d)
    }));
  });
  const wdMax = $derived(max(wd, (w) => w.fs.length) || 1);
  const companions = $derived(tally(app.films('with'), (x) => x.with).slice(0, 8));
  const alone = $derived(films.filter((x) => !x.with.length).length);
  const s = $derived(streaks(films, f.parseDay));
  const longest = $derived(
    greatest(
      once.filter((x) => x.runtime),
      (x) => x.runtime
    )
  );
  const shortest = $derived(
    least(
      once.filter((x) => x.runtime),
      (x) => x.runtime
    )
  );
  const oldest = $derived(
    least(
      once.filter((x) => x.filmYear),
      (x) => x.filmYear
    )
  );
  const dubbed = $derived(films.filter((x) => x.dubbed).length);
  const facts = $derived(
    [
      s.streak.n > 1 && {
        k: 'habits.streak',
        v: app.t('habits.streak.v', { n: s.streak.n }),
        sub: `${f.dayMonth(f.parseDay(s.streak.from))} → ${f.dayMonth(f.parseDay(s.streak.to))}`
      },
      s.busiest &&
        s.busiest.films.length > 1 && {
          k: 'habits.busiest',
          v: app.t('unit.films', { n: s.busiest.films.length }),
          sub: f.date(f.parseDay(s.busiest.date)),
          films: s.busiest.films
        },
      longest && {
        k: 'habits.longest',
        v: f.duration(longest.runtime),
        sub: app.title(longest),
        films: [longest]
      },
      shortest && {
        k: 'habits.shortest',
        v: f.duration(shortest.runtime),
        sub: app.title(shortest),
        films: [shortest]
      },
      oldest && {
        k: 'habits.oldest',
        v: String(oldest.filmYear),
        sub: app.title(oldest),
        films: [oldest]
      },
      dubbed > 0 && { k: 'habits.dubbed', v: f.int(dubbed), sub: '' }
    ].filter(Boolean)
  );
</script>

<div class="card">
  <div class="card-head"><h2>{app.t('habits.title')}</h2></div>

  <div class="sub lab">{app.t('habits.weekdays')}</div>
  <svg
    viewBox="0 0 280 78"
    bind:clientWidth={barsW}
    role="img"
    aria-label={app.t('habits.weekdays')}
  >
    {#each wd as w, i (w.d)}
      {@const h = (w.fs.length / wdMax) * 38}
      {@const sel = app.has('weekday', w.d)}
      <g opacity={app.hasAny('weekday') && !sel ? 0.4 : 1}>
        <rect
          x={i * 40 + 3}
          y="0"
          width="34"
          height="62"
          fill="transparent"
          role="button"
          tabindex="0"
          aria-label="{f.weekday(new Date(2024, 0, 7 + w.d))}: {w.fs.length}"
          onclick={() => app.toggle('weekday', w.d)}
          onkeydown={onActivate(() => app.toggle('weekday', w.d))}
          use:tip={() => ({
            title: f.weekday(new Date(2024, 0, 7 + w.d)),
            sub: app.t('unit.films', { n: w.fs.length }),
            films: w.fs.slice(-3)
          })}
        />
        <rect
          x={i * 40 + 8}
          y={58 - h}
          width="24"
          height={Math.max(2, h)}
          rx="3"
          fill={w.d === 0 || w.d === 6 ? 'var(--gold)' : 'var(--red)'}
          pointer-events="none"
        />
        <text x={i * 40 + 20} y="74" text-anchor="middle" font-size={LABEL / k}
          >{f.weekdayShort(new Date(2024, 0, 7 + w.d))}</text
        >
        <text
          x={i * 40 + 20}
          y={52 - h}
          text-anchor="middle"
          font-size={LABEL / k}
          style="fill:var(--text)">{w.fs.length || ''}</text
        >
      </g>
    {/each}
  </svg>

  {#if companions.length}
    <div class="sub lab">{app.t('habits.with')}</div>
    <div class="chips">
      {#each companions as c (c.key)}
        <button
          class="pill"
          class:on={app.has('with', c.key)}
          onclick={() => app.toggle('with', c.key)}>{c.key} <b>{c.count}</b></button
        >
      {/each}
      <span class="pill static">{app.t('habits.alone')} <b>{alone}</b></span>
    </div>
  {/if}

  <dl>
    {#each facts as x (x.k)}
      <div use:tip={() => (x.films ? { title: x.sub, films: x.films.slice(0, 3) } : null)}>
        <dt>{app.t(x.k)}</dt>
        <dd>
          <b>{x.v}</b>{#if x.sub && x.films}<span title={x.sub}>{x.sub}</span>{:else if x.sub}<span
              >{x.sub}</span
            >{/if}
        </dd>
      </div>
    {/each}
  </dl>
</div>

<style>
  .lab {
    margin: 4px 0 6px;
    font-size: 12px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    margin-bottom: 14px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }
  .pill {
    background: #0a1030;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 3px 11px;
    font-size: 12.5px;
    color: var(--text);
  }
  .pill b {
    color: var(--gold);
    margin-left: 3px;
  }
  .pill.on {
    background: var(--red);
    border-color: var(--red);
  }
  .pill.static {
    color: var(--muted);
    border-style: dashed;
  }
  dl {
    margin: 0;
    display: grid;
    gap: 1px;
    border-top: 1px solid var(--line);
  }
  dl > div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 0;
    border-bottom: 1px solid #1d2859;
    align-items: baseline;
  }
  dt {
    color: var(--muted);
    font-size: 12.5px;
    white-space: nowrap;
  }
  dd {
    margin: 0;
    text-align: right;
    min-width: 0;
    display: grid;
  }
  dd b {
    font: 700 14px var(--serif);
  }
  dd span {
    font-size: 12px;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
