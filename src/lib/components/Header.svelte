<script>
  import { app, years } from '$lib/state.svelte.js';
  const scope = $derived(
    app.year == null
      ? app.t('scope.all', { year: years.at(-1) })
      : app.t('scope.year', { year: app.year })
  );
</script>

<header>
  <div class="bulbs" aria-hidden="true"></div>
  <div class="row">
    <div>
      <h1>{app.year == null ? app.t('app.title.all') : app.t('app.title')}</h1>
      <p>{app.t('app.subtitle', { scope })}</p>
    </div>
    <div class="controls">
      {#if years.length > 1}
        <label class="sel">
          <span class="sr">{app.t('year.all')}</span>
          <select
            value={app.year ?? ''}
            onchange={(e) => app.setYear(e.currentTarget.value ? +e.currentTarget.value : null)}
          >
            {#each years as y (y)}<option value={y}>{y}</option>{/each}
            <option value="">{app.t('year.all')}</option>
          </select>
        </label>
      {/if}
      <div class="seg" role="group" aria-label={app.t('lang')}>
        <button aria-pressed={app.lang === 'en'} onclick={() => app.setLang('en')}>EN</button>
        <button aria-pressed={app.lang === 'fr'} onclick={() => app.setLang('fr')}>FR</button>
      </div>
    </div>
  </div>
</header>

<style>
  header {
    padding: 18px 0 22px;
  }
  .bulbs {
    height: 8px;
    margin-bottom: 18px;
    background: radial-gradient(circle at 6px 4px, var(--gold) 2.2px, transparent 2.8px) 0 0 / 18px
      8px repeat-x;
    opacity: 0.85;
    mask: linear-gradient(90deg, #000 60%, transparent);
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
  }
  h1 {
    font: 800 clamp(32px, 6.4vw, 56px)/1 var(--title);
    letter-spacing: -0.01em;
    background: linear-gradient(95deg, #fff 30%, var(--gold));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  p {
    margin: 6px 0 0;
    color: var(--muted);
  }
  .controls {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  @media (max-width: 700px) {
    .controls {
      flex-basis: 100%;
    }
  }
  .sel select {
    appearance: none;
    background: #0a1030
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%239aa5d3' stroke-width='1.5'/%3E%3C/svg%3E")
      no-repeat right 12px center;
    color: var(--text);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 6px 32px 6px 14px;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
