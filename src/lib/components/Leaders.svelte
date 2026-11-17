<script>
  import { app, people } from '$lib/state.svelte.js';
  import { tally, unique } from '$lib/stats.js';
  import { tip } from '$lib/tip.js';
  import Poster from './Poster.svelte';
  import WorldMap from './WorldMap.svelte';
  import StarMark from './StarMark.svelte';
  import Venus from '@lucide/svelte/icons/venus';
  import Mars from '@lucide/svelte/icons/mars';

  let tab = $state('directors');
  let view = $state('map');
  let expanded = $state(false);
  let gender = $state('all'); // all | f | m

  const cfg = {
    directors: { key: 'director', by: (x) => x.directors, person: true },
    actors: { key: 'actor', by: (x) => x.actors, person: true },
    countries: { key: 'country', by: (x) => x.countries },
    genres: { key: 'genre', by: (x) => x.genres }
  };
  const c = $derived(cfg[tab]);
  const f = $derived(app.fmt);
  const hasGender = $derived(Object.values(people).some((p) => p.g));
  const tallied = $derived(tally(unique(app.films(c.key)), c.by));
  // Only items seen at least twice are listed (counted on the unfiltered year, so filtering doesn't empty the list)
  const eligible = $derived(
    new Set(
      tally(unique(app.base()), c.by)
        .filter((r) => r.count >= 2)
        .map((r) => r.key)
    )
  );
  const all = $derived.by(() => {
    let t = tallied.filter((r) => eligible.has(r.key));
    if (c.person && gender !== 'all') t = t.filter((r) => people[r.key]?.g === gender);
    return t;
  });
  // As many rows as fit in the fixed-height body (rows are 50px + a 4px gap; two columns on wide screens)
  let bodyH = $state(400);
  let vw = $state(1280);
  const fit = $derived(Math.max(1, Math.floor((bodyH + 4) / 54)) * (vw > 760 ? 2 : 1));
  const rows = $derived(expanded ? all : all.slice(0, fit));
  const canExpand = $derived(all.length > fit);
  // tabs without a toolbar (e.g. Genres) hand its reserved height to the list, so the card height never changes
  const hasTools = $derived(tab === 'countries' || (c.person && hasGender));
  const name = (k) =>
    tab === 'countries' ? app.countryName(k) : tab === 'genres' ? app.genreName(k) : k;
  const top = $derived(all[0]?.count || 1);
  const initials = (n) =>
    n
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  const recent = (r) => [...r.films].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const filmTip = (fl) => () => ({
    title: app.title(fl),
    sub: `${fl.filmYear ?? ''}${fl.rating != null ? ' · ' + f.stars(fl.rating) : ''}`,
    lines: [f.date(f.parseDay(fl.date))]
  });
</script>

<svelte:window bind:innerWidth={vw} />

<div class="card">
  <div class="card-head">
    <h2>{app.t('people.title')}</h2>
    <div class="seg" role="tablist">
      {#each Object.keys(cfg) as k (k)}
        <button
          role="tab"
          aria-selected={tab === k}
          onclick={() => {
            tab = k;
            expanded = false;
          }}>{app.t(`people.${k}`)}</button
        >
      {/each}
    </div>
  </div>

  <div class="tools" class:none={!hasTools}>
    {#if tab === 'countries'}
      <div class="seg" role="group">
        <button aria-pressed={view === 'map'} onclick={() => (view = 'map')}
          >{app.t('people.map')}</button
        >
        <button aria-pressed={view === 'list'} onclick={() => (view = 'list')}
          >{app.t('people.list')}</button
        >
      </div>
    {/if}
    {#if c.person && hasGender}
      <div class="seg gender" role="group">
        <button aria-pressed={gender === 'all'} onclick={() => (gender = 'all')}
          >{app.t('people.all')}</button
        >
        <button
          class="gf"
          aria-label={app.t('people.women')}
          aria-pressed={gender === 'f'}
          onclick={() => (gender = 'f')}><Venus size={17} /></button
        >
        <button
          class="gm"
          aria-label={app.t('people.men')}
          aria-pressed={gender === 'm'}
          onclick={() => (gender = 'm')}><Mars size={17} /></button
        >
      </div>
    {/if}
  </div>

  <!-- same height on every tab, the map included; a long list scrolls inside it -->
  <div
    class="body"
    class:map={tab === 'countries' && view === 'map'}
    style:--extra={hasTools ? '0px' : '40px'}
    bind:clientHeight={bodyH}
  >
    {#if tab === 'countries' && view === 'map'}
      <WorldMap rows={tallied} />
    {:else}
      <ol style:--rows={Math.ceil(rows.length / 2)}>
        {#each rows as r, i (r.key)}
          {@const on = app.has(c.key, r.key)}
          {@const pp = c.person ? people[r.key] : null}
          <li
            class="row"
            class:on
            class:dim={app.hasAny(c.key) && !on}
            style:--w="{(r.count / top) * 100}%"
          >
            <button class="main" onclick={() => app.toggle(c.key, r.key)} aria-pressed={on}>
              <span class="rank">{i + 1}</span>
              {#if c.person}
                <span class="avatar g-{pp?.g ?? 'none'}">
                  <b>{initials(r.key)}</b>
                  {#if pp?.p}<img
                      src="https://image.tmdb.org/t/p/w185{pp.p}"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onerror={(e) => e.currentTarget.remove()}
                    />{/if}
                </span>
              {/if}
              <span class="who">
                <span class="name">{name(r.key)}</span>
                <span class="meta"
                  >{app.t('unit.films', { n: r.count })}{#if r.avg}&nbsp;· {app.t('people.avg', {
                      n: f.rating(r.avg)
                    })}
                    <StarMark />{/if}</span
                >
              </span>
            </button>
            <span class="thumbs">
              {#each recent(r) as fl (fl.id)}
                <button
                  class="t"
                  onclick={() => app.openDetail(fl)}
                  aria-label={app.title(fl)}
                  use:tip={filmTip(fl)}><Poster film={fl} size="w92" /></button
                >
              {/each}
            </span>
          </li>
        {/each}
      </ol>
      {#if !rows.length}<p class="empty">{app.t('empty')}</p>{/if}
    {/if}
  </div>
  <div class="foot">
    {#if !(tab === 'countries' && view === 'map')}
      {#if canExpand}<button class="more" onclick={() => (expanded = !expanded)}
          >{expanded ? app.t('less') : `${app.t('more')} (${all.length})`}</button
        >{/if}
      {#if tab === 'actors'}<span class="sub">{app.t('people.actors.hint')}</span>{/if}
      <span class="sub">{app.t('people.twice')}</span>
    {/if}
  </div>
</div>

<style>
  .tools.none {
    display: none;
  }
  .tools {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    margin: -4px 0 12px;
    min-height: 32px; /* reserved on every tab so the card keeps its height */
  }
  .body {
    height: calc(400px + var(--extra, 0px));
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
  }
  .body.map {
    overflow: hidden;
  }
  @media (max-width: 760px) {
    .body {
      height: calc(290px + var(--extra, 0px));
    }
  }
  /* outline colours by gender: gold for women, purple for men, grey for unknown / non-binary */
  .gender {
    --gf: var(--gold);
    --gm: #a78bfa;
  }
  .gender button {
    display: inline-flex;
    align-items: center;
    justify-content: center; /* centres the ♀ / ♂ icons */
    font-size: 17px;
    line-height: 1;
    padding: 3px 12px;
  }
  .gender button :global(svg) {
    display: block;
  }
  .gender button:first-child {
    font-size: 12.5px;
    padding: 4px 11px;
  }
  .gender .gf {
    color: var(--gf);
  }
  .gender .gm {
    color: var(--gm);
  }
  .gender {
    --thumb: #1b2762;
  }
  .gender:not([data-thumb]) button[aria-pressed='true'] {
    background: #1b2762;
    box-shadow: 0 0 0 1px currentColor inset;
  }
  .gender .gf[aria-pressed='true'] {
    color: var(--gf);
  }
  .gender .gm[aria-pressed='true'] {
    color: var(--gm);
  }

  /* items run down first, then to the next column */
  ol {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(var(--rows), auto);
    gap: 4px 18px;
  }
  @media (max-width: 760px) {
    ol {
      grid-auto-flow: row;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: none;
    }
  }
  .row {
    min-height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-radius: 12px;
    padding: 4px 6px;
    position: relative;
    isolation: isolate;
    min-width: 0;
  }
  .row::before {
    content: '';
    position: absolute;
    inset: 0;
    width: var(--w);
    background: linear-gradient(90deg, #7d1d2240, transparent);
    border-radius: 12px;
    z-index: -1;
  }
  .row.on {
    box-shadow: 0 0 0 1.5px var(--gold) inset;
  }
  .row.dim {
    opacity: 0.5;
  }
  .main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
    text-align: left;
    background: none;
    border: 0;
    padding: 0;
  }
  .rank {
    font: 700 13px var(--serif);
    color: var(--gold);
    width: 18px;
    text-align: center;
    flex: none;
  }
  .avatar {
    position: relative;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    flex: none;
    background: #1d2a63;
    display: grid;
    place-items: center;
    box-shadow: 0 0 0 2px #2c3b7c;
  }
  .avatar img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
  }
  .avatar b {
    font: 600 13px var(--sans);
    color: var(--muted);
  }
  .avatar {
    --ring: #6f7898;
  }
  .avatar.g-f {
    --ring: var(--gold);
  }
  .avatar.g-m {
    --ring: #a78bfa;
  }
  .avatar.g-x {
    --ring: #6f7898;
  }
  .avatar {
    box-shadow: 0 0 0 2px var(--ring);
  }
  .who {
    min-width: 0;
    display: grid;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 550;
  }
  .meta {
    font-size: 12px;
    color: var(--muted);
  }
  .thumbs {
    display: flex;
    gap: 4px;
    flex: none;
  }
  .t {
    width: 26px;
    padding: 0;
    border: 0;
    background: none;
    font-size: 5px;
    border-radius: 4px;
    transition: transform 0.12s;
  }
  .t:hover {
    transform: translateY(-3px) scale(1.12);
  }
  @media (max-width: 520px) {
    .t:nth-child(n + 4) {
      display: none;
    }
  }
  .foot {
    display: flex;
    align-items: baseline;
    gap: 6px 14px;
    flex-wrap: wrap;
    margin-top: 10px;
    min-height: 28px;
  }
  @media (max-width: 760px) {
    .foot {
      min-height: 78px; /* the hints wrap to a few lines on phones: reserved on every tab */
    }
  }
  @media (max-width: 400px) {
    .foot {
      min-height: 98px; /* four lines of hints on the narrowest phones */
    }
  }
  .more {
    background: none;
    border: 0;
    color: var(--gold);
    padding: 4px 0;
    font-size: 13px;
  }
</style>
