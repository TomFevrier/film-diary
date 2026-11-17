<script>
  import { group, sum, max, greatest } from 'd3-array';
  import { app, years } from '$lib/state.svelte.js';
  import { ramp } from '$lib/colors.js';
  import CalendarYear from './CalendarYear.svelte';

  let metric = $state('films');
  const f = $derived(app.fmt);
  // one heatmap for the selected year, or one per year (newest first) for "all years"
  const calYears = $derived(app.year == null ? years : [app.year]);
  const films = $derived(app.films('day'));
  const byDay = $derived(group(films, (x) => x.date));
  const val = (fs) => (metric === 'films' ? fs.length : sum(fs, (x) => x.runtime ?? 0));
  const maxV = $derived(max([...byDay.values()], val) || 1);
  // busiest day under the current metric and filters (first one wins a tie)
  const best = $derived(greatest([...byDay], ([, fs]) => val(fs)));
  // festival films, ignoring the festival filter itself so the pill always shows how many there are
  const festivalCount = $derived(app.films('festival').filter((x) => x.festivals.length).length);
</script>

<div class="card">
  <div class="card-head">
    <h2>{app.t('cal.title')} {calYears.length === 1 && years.length > 1 ? calYears[0] : ''}</h2>
    <div class="seg" role="group">
      <button aria-pressed={metric === 'films'} onclick={() => (metric = 'films')}
        >{app.t('cal.films')}</button
      >
      <button aria-pressed={metric === 'hours'} onclick={() => (metric = 'hours')}
        >{app.t('cal.hours')}</button
      >
    </div>
  </div>
  {#each calYears as y (y)}
    <div class="yr">
      <CalendarYear
        year={y}
        {films}
        {byDay}
        {metric}
        {maxV}
        bestKey={best?.[0]}
        showYear={calYears.length > 1}
      />
    </div>
  {/each}
  <div class="legend">
    {#if festivalCount || app.has('festival', true)}
      <button
        class="fest"
        class:on={app.has('festival', true)}
        onclick={() => app.toggle('festival', true)}
        aria-pressed={app.has('festival', true)}
      >
        <i></i><b>{f.int(festivalCount)}</b>
        {app.t('flag.festival')}
      </button>
    {/if}
    {#if best}
      <span class="best"
        ><i class="ring"></i>{app.t('cal.busiest')}: {f.date(f.parseDay(best[0]))} · {metric ===
        'films'
          ? app.t('unit.films', { n: best[1].length })
          : f.duration(sum(best[1], (x) => x.runtime ?? 0))}</span
      >
    {/if}
    <span class="scale">
      <span>{app.t('cal.less')}</span>
      {#each [0, 0.25, 0.5, 0.75, 1] as t (t)}<i style:background={ramp(0.18 + 0.82 * t)}
        ></i>{/each}
      <span>{app.t('cal.more')}</span>
    </span>
  </div>
</div>

<style>
  /* defined here, not in CalendarYear: Svelte can't match a sibling selector across component instances */
  .yr + .yr {
    margin-top: 56px;
  }
  .legend {
    display: flex;
    gap: 8px 16px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-top: 8px;
    font-size: 12px;
    color: var(--muted);
  }
  .best {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--text);
  }
  .ring {
    width: 11px;
    height: 11px;
    border: 1.8px solid #fff;
    border-radius: 3.5px;
    display: inline-block;
  }
  .fest {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #0a1030;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 3px 12px 3px 9px;
    font-size: 12.5px;
    color: var(--text);
  }
  .fest i {
    width: 14px;
    height: 5px;
    border-radius: 3px;
    background: #fff;
    display: block;
  }
  .fest b {
    color: #fff;
  }
  .fest.on {
    background: var(--red);
    border-color: var(--red);
  }
  .fest.on b {
    color: #fff;
  }
  .scale {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    margin-left: auto;
    font-size: 11px;
  }
  .scale i {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    display: block;
  }
</style>
