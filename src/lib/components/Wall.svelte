<script>
  import { descending, ascending } from 'd3-array';
  import { unique } from '$lib/stats.js';
  import { app } from '$lib/state.svelte.js';
  import Poster from './Poster.svelte';
  import Stars from './Stars.svelte';
  import Repeat2 from '@lucide/svelte/icons/repeat-2';

  let sort = $state('rating');
  let limit = $state(60);
  const f = $derived(app.fmt);
  const list = $derived.by(() => {
    const fs = [...unique(app.films())];
    if (sort === 'rating')
      return fs.sort(
        (a, b) => descending(a.rating ?? -1, b.rating ?? -1) || b.date.localeCompare(a.date)
      );
    if (sort === 'year')
      return fs.sort(
        (a, b) => ascending(a.filmYear ?? 9999, b.filmYear ?? 9999) || a.date.localeCompare(b.date)
      );
    return fs.sort((a, b) => b.date.localeCompare(a.date));
  });
</script>

<div class="card">
  <div class="card-head">
    <h2>{app.t('wall.title')} <span class="n">{f.int(list.length)}</span></h2>
    <div class="seg" role="group">
      {#each ['rating', 'date', 'year'] as s (s)}
        <button
          aria-pressed={sort === s}
          onclick={() => {
            sort = s;
            limit = 60;
          }}>{app.t(`wall.sort.${s}`)}</button
        >
      {/each}
    </div>
  </div>
  {#if list.length}
    <ul>
      {#each list.slice(0, limit) as x (x.id)}
        <li>
          <button onclick={() => app.openDetail(x)} aria-label={app.title(x)}>
            <Poster film={x} size="w185" />
            {#if x.rating != null}<span class="r"><Stars value={x.rating} /></span>{/if}
            {#if x.rewatch}<span class="rw" title={app.t('wall.rewatch')}
                ><Repeat2 size={12} /></span
              >{/if}
          </button>
        </li>
      {/each}
    </ul>
    {#if list.length > limit}<button class="more" onclick={() => (limit += 60)}
        >{app.t('more')}</button
      >{/if}
  {:else}
    <p class="empty">{app.t('empty')}</p>
  {/if}
</div>

<style>
  .n {
    color: var(--muted);
    font-weight: 400;
    margin-left: 6px;
    letter-spacing: 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
    gap: 10px;
  }
  li button {
    position: relative;
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    border-radius: 6px;
    font-size: 10px;
    transition: transform 0.12s;
  }
  li button:hover {
    transform: translateY(-3px);
  }
  .r {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    text-align: center;
    font: 600 11px var(--sans);
    color: var(--gold);
    padding: 14px 0 3px;
    background: linear-gradient(transparent, #000c);
    border-radius: 0 0 6px 6px;
    letter-spacing: 0.5px;
  }
  .rw {
    position: absolute;
    top: 4px;
    right: 4px;
    background: #000a;
    color: #fff;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center; /* centres the icon in the circle, both ways */
  }
  .rw :global(svg) {
    display: block;
  }
  .more {
    display: block;
    margin: 14px auto 0;
    background: var(--card2);
    border: 1px solid var(--line);
    color: var(--text);
    border-radius: 999px;
    padding: 7px 20px;
  }
</style>
