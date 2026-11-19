<script>
  import { app } from '$lib/state.svelte.js';
  import Stars from './Stars.svelte';
  import X from '@lucide/svelte/icons/x';

  function label(key, v) {
    const f = app.fmt;
    switch (key) {
      case 'type':
        return app.t(`type.${v}`);
      case 'place':
        return app.placeName(v);
      case 'venue':
        return app.venueName(v);
      case 'country':
        return app.countryName(v);
      case 'genre':
        return app.genreName(v);
      case 'decade':
        return v === 1920 ? app.t('decades.before') : app.t('decade.label', { d: v });
      case 'rating':
        return v === 0 ? app.t('flag.unrated') : f.stars(v); // text fallback; chips draw <Stars>
      case 'day':
        return f.date(f.parseDay(v));
      case 'weekday':
        return f.weekday(new Date(2024, 0, 7 + v));
      case 'female':
      case 'festival':
      case 'debut':
      case 'new':
      case 'rewatch':
      case 'dubbed':
        return app.t(`flag.${key}`);
      default:
        return v;
    }
  }
  const chips = $derived(
    app.active.flatMap(([k, vs]) => vs.map((v) => ({ k, v, text: label(k, v) })))
  );
</script>

<div class="bar" class:on={chips.length}>
  {#if chips.length}
    <div class="pill">
      <span class="lead">{app.t('filters.active')}</span>
      {#each chips as c (c.k + c.v)}
        <button class="chip" onclick={() => app.toggle(c.k, c.v)} aria-label="{c.text} ×"
          >{#if c.k === 'rating' && c.v > 0}<Stars value={c.v} />{:else}{c.text}{/if}<b
            ><X size={12} /></b
          ></button
        >
      {/each}
      <button class="clear" onclick={() => app.clear()}>{app.t('filters.clear')}</button>
    </div>
  {:else}
    <span class="hint">{app.t('filters.hint')}</span>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    min-height: 44px;
    margin-bottom: 8px;
  }
  /* only the active-filter pill sticks; the hint scrolls away with the page */
  .bar.on {
    position: sticky;
    top: 8px;
    z-index: 20;
    pointer-events: none;
  }
  .hint {
    color: var(--muted);
    font-size: 12.5px;
  }
  .pill {
    pointer-events: auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 5px 8px 5px 14px;
    font-size: 13px;
    border-radius: 22px;
    background: color-mix(in srgb, var(--bg) 80%, transparent);
    border: 1px solid #ffffff1f;
    -webkit-backdrop-filter: blur(14px) saturate(1.3);
    backdrop-filter: blur(14px) saturate(1.3);
    box-shadow: 0 6px 24px #0005;
  }
  .lead {
    color: var(--muted);
  }
  .chip {
    background: #b2222299;
    border: 1px solid #e8584c66;
    color: #fff;
    border-radius: 999px;
    padding: 2px 4px 2px 11px;
    font-size: 12.5px;
  }
  .chip b {
    display: inline-grid;
    place-items: center; /* centres the × icon */
    vertical-align: middle;
    opacity: 0.65;
    margin-left: 3px;
    padding: 0 5px;
    font-weight: 500;
  }
  .chip b :global(svg) {
    display: block;
  }
  .chip:hover {
    background: var(--red);
  }
  .clear {
    background: transparent;
    border: 0;
    color: var(--gold);
    padding: 3px 6px;
    font-size: 12.5px;
  }
  .clear:hover {
    text-decoration: underline;
  }
</style>
