<script>
  import { max } from 'd3-array';
  import { app } from '$lib/state.svelte.js';
  import { tally } from '$lib/stats.js';

  let tab = $state('cinemas');
  let metric = $state('films');
  let expanded = $state(false);

  const cfg = {
    cinemas: { key: 'venue', src: (x) => x.mediumType === 'cinema', by: (x) => [x.venue] },
    platforms: { key: 'venue', src: (x) => x.mediumType !== 'cinema', by: (x) => [x.venue] },
    cities: { key: 'place', src: () => true, by: (x) => [x.place] },
    events: { key: 'event', src: () => true, by: (x) => x.tags }
  };
  const c = $derived(cfg[tab]);
  const f = $derived(app.fmt);
  // Only items with two viewings or more are listed (counted on the unfiltered year, so filtering doesn't empty the list)
  const eligible = $derived(
    new Set(
      tally(app.base().filter(c.src), c.by)
        .filter((x) => x.count >= 2)
        .map((x) => x.key)
    )
  );
  const rows = $derived.by(() => {
    const r = tally(app.films(c.key).filter(c.src), c.by).filter((x) => eligible.has(x.key));
    return metric === 'films' ? r : [...r].sort((a, b) => b.minutes - a.minutes);
  });
  const val = (r) => (metric === 'films' ? r.count : r.minutes);
  const top = $derived(max(rows, val) || 1);
  const shown = $derived(expanded ? rows : rows.slice(0, 7));
</script>

<div class="card fill">
  <div class="card-head">
    <h2>{app.t('venues.title')}</h2>
    <div class="seg" role="tablist">
      {#each Object.keys(cfg) as k (k)}
        <button
          role="tab"
          aria-selected={tab === k}
          onclick={() => {
            tab = k;
            expanded = false;
          }}>{app.t(`venues.${k}`)}</button
        >
      {/each}
    </div>
  </div>
  <div class="tools">
    <span class="sub">{app.t(tab === 'events' ? 'venues.events.hint' : 'venues.twice')}</span>
    <div class="seg">
      <button aria-pressed={metric === 'films'} onclick={() => (metric = 'films')}
        >{app.t('venues.metric.films')}</button
      >
      <button aria-pressed={metric === 'time'} onclick={() => (metric = 'time')}
        >{app.t('venues.metric.time')}</button
      >
    </div>
  </div>
  <ul>
    {#each shown as r (r.key)}
      {@const on = app.has(c.key, r.key)}
      <li>
        <button
          class="stub"
          class:on
          class:dim={app.hasAny(c.key) && !on}
          style:--w="{(val(r) / top) * 100}%"
          onclick={() => app.toggle(c.key, r.key)}
          aria-pressed={on}
        >
          <span class="name"
            >{tab === 'cities'
              ? app.placeName(r.key)
              : c.key === 'venue'
                ? app.venueName(r.key)
                : r.key}</span
          >
          <!-- count when the toggle is on Films, runtime when it is on Time -->
          <span class="val"
            >{#if metric === 'films'}<b>{f.int(r.count)}</b>{:else}{f.hours(r.minutes)}{/if}</span
          >
        </button>
      </li>
    {:else}
      <li class="empty">{app.t('empty')}</li>
    {/each}
  </ul>
  {#if rows.length > 7}
    <button class="more" onclick={() => (expanded = !expanded)}
      >{expanded ? app.t('less') : app.t('more')} ({rows.length})</button
    >
  {/if}
</div>

<style>
  .tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin: -4px 0 10px;
    min-height: 30px;
    flex-wrap: wrap;
  }
  /* same height as the Habits card next to it: the card stretches, the ticket rows keep their height */
  .fill {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
    flex: 1;
    grid-auto-rows: 52px; /* the same bar height on every tab; spare room stays empty at the bottom */
    align-content: start;
  }
  .stub {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    text-align: left;
    border: 0;
    padding: 8px 18px;
    color: var(--text);
    font-size: 13.5px;
    position: relative;
    background: linear-gradient(90deg, #7d1d22 0 var(--w), #1a2558 var(--w) 100%);
    --n: radial-gradient(circle 6px at 0 50%, #0000 97%, #000);
    --m: radial-gradient(circle 6px at 100% 50%, #0000 97%, #000);
    -webkit-mask: var(--n), var(--m);
    -webkit-mask-composite: source-in;
    mask: var(--n), var(--m);
    mask-composite: intersect;
    border-radius: 6px;
    transition: filter 0.15s;
  }
  .stub:hover {
    filter: brightness(1.2);
  }
  .stub.on {
    background: linear-gradient(90deg, #c98a14 0 var(--w), #26357a var(--w) 100%);
  }
  .stub.dim {
    opacity: 0.5;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .val {
    color: #dbe0f7;
    white-space: nowrap;
    font-size: 12.5px;
  }
  .val b {
    color: #fff;
  }
  .more {
    margin-top: 10px;
    background: none;
    border: 0;
    color: var(--gold);
    padding: 4px 0;
    font-size: 13px;
  }
</style>
