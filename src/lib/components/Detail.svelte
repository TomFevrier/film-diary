<script>
  import { app } from '$lib/state.svelte.js';
  import Poster from './Poster.svelte';
  import Stars from './Stars.svelte';
  import StarMark from './StarMark.svelte';
  import Logo from './Logo.svelte';
  import X from '@lucide/svelte/icons/x';
  import Repeat2 from '@lucide/svelte/icons/repeat-2';
  import PartyPopper from '@lucide/svelte/icons/party-popper';

  const x = $derived(app.detail);
  const f = $derived(app.fmt);
  const close = () => (app.detail = null);
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && close()} />

{#if x}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="back" onclick={(e) => e.target === e.currentTarget && close()}>
    <div class="dlg" role="dialog" aria-modal="true" aria-label={app.title(x)}>
      <button class="x" onclick={close} aria-label={app.t('detail.close')}><X size={22} /></button>

      <div class="poster-col">
        <Poster film={x} size="w342" />
        {#if x.rewatch}
          <span class="rewatch"
            ><Repeat2 size={13} strokeWidth={2.25} />{app.t('detail.rewatch')}</span
          >
        {/if}
        {#if x.tmdbId}
          <div class="links">
            <a
              href="https://letterboxd.com/tmdb/{x.tmdbId}/"
              target="_blank"
              rel="noopener"
              title={app.t('detail.letterboxd')}
              aria-label={app.t('detail.letterboxd')}
            >
              <Logo name="letterboxd" height={10} />
            </a>
            <a
              href="https://www.themoviedb.org/movie/{x.tmdbId}"
              target="_blank"
              rel="noopener"
              title={app.t('detail.tmdb')}
              aria-label={app.t('detail.tmdb')}
            >
              <Logo name="tmdb" height={10} />
            </a>
          </div>
        {/if}
      </div>

      <div class="b">
        <h3>{app.title(x)} <span class="yr">{x.filmYear ?? ''}</span></h3>
        {#if x.originalTitle && x.originalTitle !== app.title(x)}
          <div class="muted">{app.t('detail.original')}: {x.originalTitle}</div>
        {/if}

        <div class="ratings">
          <span class="mine"><Stars value={x.rating} /></span>
          {#if x.avg}
            <span class="lb" title={app.t('detail.community')}>
              <Logo name="letterboxd" height={10} />
              <b>{f.dec2(x.avg)}</b>
              <StarMark />
            </span>
          {/if}
        </div>

        <dl>
          <dt>{app.t('detail.watched')}</dt>
          <dd>
            {f.date(f.parseDay(x.date))}{x.venue ? ` · ${x.venue}` : ''}{x.place
              ? `, ${app.placeName(x.place)}`
              : ''}
          </dd>
          {#if x.with.length}
            <dt>{app.t('detail.with')}</dt>
            <dd>{x.with.join(', ')}</dd>
          {/if}
          {#if x.directors.length}
            <dt>{app.t('detail.directors')}</dt>
            <dd>{x.directors.join(', ')}</dd>
          {/if}
          {#if x.runtime}
            <dt>{app.t('detail.runtime')}</dt>
            <dd>{f.duration(x.runtime)}</dd>
          {/if}
          {#if x.countries.length}
            <dt>{app.t('people.countries')}</dt>
            <dd>{x.countries.map(app.countryName).join(', ')}</dd>
          {/if}
          {#if x.genres.length}
            <dt>{app.t('people.genres')}</dt>
            <dd>{x.genres.map(app.genreName).join(', ')}</dd>
          {/if}
          {#if x.actors.length}
            <dt>{app.t('detail.cast')}</dt>
            <dd>{x.actors.slice(0, 6).join(', ')}</dd>
          {/if}
        </dl>

        {#if x.dubbed || x.tags.length}
          <div class="tags">
            {#if x.dubbed}<span>{app.t('detail.dubbed')}</span>{/if}
            {#each x.tags as tag (tag)}
              {#if x.festivals.includes(tag)}
                <span class="festival"><PartyPopper size={13} />{tag}</span>
              {:else}<span>{tag}</span>{/if}
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .back {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: #04061acc;
    backdrop-filter: blur(4px);
    display: grid;
    place-items: center;
    padding: 16px;
    overflow: auto;
  }
  .dlg {
    position: relative;
    display: grid;
    grid-template-columns: 170px 1fr;
    gap: 22px;
    max-width: 640px;
    width: 100%;
    background: linear-gradient(180deg, var(--card), var(--bg2));
    border: 1px solid #3b4a8f;
    border-radius: 18px;
    padding: 20px;
  }
  @media (max-width: 520px) {
    .dlg {
      grid-template-columns: 1fr;
    }
    .poster-col {
      max-width: 170px;
    }
  }
  .x {
    position: absolute;
    top: 10px;
    right: 12px;
    background: none;
    border: 0;
    color: var(--muted);
    display: grid;
    place-items: center;
    padding: 2px;
  }
  .x:hover {
    color: var(--text);
  }

  /* poster with the rewatch pill on top and the logo buttons along the bottom */
  .poster-col {
    position: relative;
    align-self: start;
    font-size: 9px;
  }
  .rewatch {
    position: absolute;
    top: 8px;
    right: 8px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 22px;
    padding: 0 9px 0 7px;
    border-radius: 999px;
    background: #070b1ccc;
    border: 1px solid #ffffff26;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    color: var(--text);
    font: 700 11.5px/1 var(--sans);
    letter-spacing: 0.01em;
  }
  .rewatch :global(svg) {
    display: block;
    flex: none;
  }
  .links {
    position: absolute;
    left: 8px;
    bottom: 8px;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr; /* both pills as wide as the wider logo, plus a little padding */
    gap: 6px;
  }
  .links a {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 26px;
    padding: 0 7px;
    border-radius: 999px;
    background: #070b1ccc;
    border: 1px solid #ffffff26;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    transition:
      background 0.12s,
      border-color 0.12s;
  }
  .links a:hover {
    background: #121b45;
    border-color: #ffffff59;
  }

  h3 {
    font: 800 26px/1.15 var(--title);
    padding-right: 20px;
  }
  .yr {
    color: var(--muted);
    font: 400 16px var(--sans);
  }
  .ratings {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin: 8px 0 12px;
  }
  .mine {
    color: var(--gold);
    font-size: 20px;
    display: inline-flex;
    align-items: center;
  }
  .lb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding-left: 14px;
    border-left: 1px solid var(--line);
    color: var(--text);
    font-size: 14px;
  }
  .lb b {
    font-weight: 700;
  }
  .lb :global(.mark) {
    color: var(--gold);
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    margin: 0 0 12px;
    font-size: 13.5px;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tags .festival {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #fff;
    border-color: #ffffff59;
  }
  .tags .festival :global(svg) {
    display: block;
    flex: none;
  }
  .tags span {
    background: #0a1030;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 12.5px;
  }
</style>
