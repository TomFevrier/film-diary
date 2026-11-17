<script>
  import { onMount } from 'svelte';
  import config from '../../../config.json';
  import og from '$lib/data/og.json';
  import { app, generatedAt } from '$lib/state.svelte.js';
  import { initSegs } from '$lib/seg.js';
  import Header from '$lib/components/Header.svelte';
  import FilterBar from '$lib/components/FilterBar.svelte';
  import Tiles from '$lib/components/Tiles.svelte';
  import Calendar from '$lib/components/Calendar.svelte';
  import Decades from '$lib/components/Decades.svelte';
  import Ratings from '$lib/components/Ratings.svelte';
  import Share from '$lib/components/Share.svelte';
  import Venues from '$lib/components/Venues.svelte';
  import Leaders from '$lib/components/Leaders.svelte';
  import Opinions from '$lib/components/Opinions.svelte';
  import Habits from '$lib/components/Habits.svelte';
  import Wall from '$lib/components/Wall.svelte';
  import Detail from '$lib/components/Detail.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';

  /** Language this page is for (the /fr/ page); the main page picks one from the URL or the browser. */
  let { lang = null } = $props();
  // set before the first render so the prerendered HTML (and its <meta> tags) are in the right language
  // svelte-ignore state_referenced_locally
  app.lang = lang ?? 'en';
  const card = $derived(og[app.lang]);
  const site = og.siteUrl ?? config.siteUrl;
  // svelte-ignore state_referenced_locally
  const url = site + (lang === 'fr' ? 'fr/' : '');

  onMount(() => {
    app.init(lang);
    return initSegs(); // sliding pill in the toggles
  });
  const updated = $derived(app.fmt.date(new Date(generatedAt)));
</script>

<svelte:head>
  <title>{app.year == null ? app.t('app.title.all') : app.t('app.title')}</title>
  <meta name="description" content={app.t('app.description')} />
  <link rel="canonical" href={url} />
  <link rel="alternate" hreflang="en" href={site} />
  <link rel="alternate" hreflang="fr" href="{site}fr/" />
  <link rel="alternate" hreflang="x-default" href={site} />
  <!-- social previews (crawlers don't run scripts: they read the prerendered HTML, one page per language) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={app.t('app.title.all')} />
  <meta property="og:title" content={app.t('app.title.all')} />
  <meta property="og:url" content={url} />
  <meta property="og:locale" content={app.lang === 'fr' ? 'fr_FR' : 'en_US'} />
  <meta property="og:locale:alternate" content={app.lang === 'fr' ? 'en_US' : 'fr_FR'} />
  <meta property="og:description" content={card?.description ?? app.t('app.description')} />
  {#if card?.file}
    <meta property="og:image" content={site + card.file} />
    <meta property="og:image:width" content={og.width} />
    <meta property="og:image:height" content={og.height} />
    <meta property="og:image:alt" content={card.alt} />
    <meta name="twitter:card" content="summary_large_image" />
  {:else}
    <meta name="twitter:card" content="summary" />
  {/if}
</svelte:head>

<div class="page">
  <Header />
  <FilterBar />
  <Tiles />
  <div class="grid">
    <div class="s12"><Calendar /></div>
    <div class="s7"><Decades /></div>
    <div class="s5 stack"><Ratings /><Share /></div>
    <div class="s7"><Venues /></div>
    <div class="s5"><Habits /></div>
    <div class="s12"><Leaders /></div>
    <div class="s12"><Opinions /></div>
    <div class="s12"><Wall /></div>
  </div>
  <footer>
    <p class="legal">
      {#each app.t('footer.tmdb').split('\n') as line (line)}<span class="line">{line}</span>{/each}
    </p>
    <p>{app.t('updated', { date: updated })}</p>
  </footer>
</div>

<Detail />
<Tooltip />

<style>
  .stack {
    display: grid;
    gap: 16px;
    align-content: start;
    grid-template-columns: minmax(0, 1fr);
  }
  footer {
    margin-top: 28px;
    color: var(--muted);
    font-size: 12px;
    text-align: center;
    max-width: 720px;
    margin-inline: auto;
  }
  /* each sentence is its own block, so text-wrap: balance (inherited from app.css) evens out every one of them */
  .line {
    display: block;
  }
  footer p {
    margin: 4px 0;
  }
</style>
