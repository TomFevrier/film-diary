<script>
  import { onMount } from 'svelte';
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

  onMount(() => {
    app.init();
    return initSegs(); // sliding pill in the toggles
  });
  const updated = $derived(app.fmt.date(new Date(generatedAt)));
</script>

<svelte:head>
  <title>{app.year == null ? app.t('app.title.all') : app.t('app.title')}</title>
  <meta name="description" content={app.t('app.subtitle', { scope: '' })} />
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
