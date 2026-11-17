<script>
  import { app } from '$lib/state.svelte.js';
  import { summarise } from '$lib/stats.js';
  import StarMark from './StarMark.svelte';
  const all = $derived(summarise(app.films()));
  const byType = $derived(summarise(app.films('type')));
  const f = $derived(app.fmt);
  const types = ['cinema', 'physical', 'streaming'];
  const typeTotal = $derived(byType.total.count || 1);
</script>

<section class="tiles" aria-label="Summary">
  <div class="tile hero">
    <div class="k">{app.t('tile.films')}</div>
    <div class="v">{f.int(all.films)}</div>
    <div class="s">
      {app.t('tile.films.sub', { n: all.total.count, nf: f.int(all.total.count) })}
    </div>
  </div>
  <div class="tile hero">
    <div class="k">{app.t('tile.time')}</div>
    <div class="v">{f.int(Math.round(all.total.minutes / 60))}<small>h</small></div>
    <div class="s">{app.t('tile.time.sub', { span: f.totalSpan(all.total.minutes) })}</div>
  </div>
  {#each types as t (t)}
    {@const s = byType[t]}
    <button
      class="tile"
      class:on={app.has('type', t)}
      class:dim={app.hasAny('type') && !app.has('type', t)}
      onclick={() => app.toggle('type', t)}
      aria-pressed={app.has('type', t)}
    >
      <div class="k">{app.t(`tile.${t}`)}</div>
      <div class="v">{f.int(s.count)}</div>
      <div class="s">{f.int(Math.round(s.minutes / 60))} h · {f.pct(s.count / typeTotal)}</div>
      <div class="bar" style:--w="{(s.count / typeTotal) * 100}%"></div>
    </button>
  {/each}
  <div class="tile">
    <div class="k">{app.t('tile.rating')}</div>
    <div class="v">
      {all.avgRating == null ? '–' : f.dec2(all.avgRating)}<small><StarMark /></small>
    </div>
    <div class="s">{app.t('tile.rating.sub', { n: all.rated })}</div>
  </div>
</section>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }
  @media (max-width: 900px) {
    .tiles {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .tile {
    text-align: left;
    background: linear-gradient(180deg, var(--card), var(--bg2));
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 13px 15px 14px;
    position: relative;
    overflow: hidden;
  }
  .hero {
    background: linear-gradient(135deg, #6d1a22, #3a1030 70%);
    border-color: #8d2a30;
  }
  button.tile:hover {
    border-color: #4a5cb0;
  }
  .tile.on {
    border-color: var(--gold);
    box-shadow: 0 0 0 1px var(--gold) inset;
  }
  .tile.dim {
    opacity: 0.55;
  }
  .k {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .hero .k {
    color: #f0c9b8;
  }
  .v {
    font: 700 clamp(28px, 4.5vw, 38px)/1.1 var(--serif);
    margin-top: 4px;
  }
  .v small {
    font: 600 0.45em var(--sans);
    margin-left: 4px;
    color: var(--gold);
  }
  .s {
    font-size: 12.5px;
    color: var(--muted);
    margin-top: 2px;
  }
  .hero .s {
    color: #e6bba9;
  }
  .bar {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: var(--w);
    background: linear-gradient(90deg, var(--red), var(--gold));
  }
</style>
