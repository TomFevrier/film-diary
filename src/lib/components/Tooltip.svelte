<script>
  import { app } from '$lib/state.svelte.js';
  import Poster from './Poster.svelte';
  import Stars from './Stars.svelte';
  import StarMark from './StarMark.svelte';
  import PartyPopper from '@lucide/svelte/icons/party-popper';
  let w = $state(220);
  let h = $state(60);
  let vw = $state(1000);
  const pos = $derived.by(() => {
    const t = app.tip;
    if (!t) return null;
    let left = t.x + 14;
    if (left + w > vw - 8) left = Math.max(8, t.x - w - 14);
    let top = t.y - h - 12;
    if (top < 8) top = t.y + 18;
    return { left, top };
  });
  function dismiss(e) {
    if (app.tip && !e.target.closest?.('.tooltip')) app.tip = null;
  }
</script>

<svelte:window bind:innerWidth={vw} onpointerdown={dismiss} />

{#if app.tip && pos}
  {@const c = app.tip.c}
  <div
    class="tooltip"
    role="tooltip"
    bind:clientWidth={w}
    bind:clientHeight={h}
    style:left="{pos.left}px"
    style:top="{pos.top}px"
    style:min-width={c.minWidth ? `${c.minWidth}px` : undefined}
  >
    {#if c.films?.length}
      <div class="posters">
        {#each c.films.slice(0, 4) as f (f.id)}<div class="p">
            <Poster film={f} size="w92" />
          </div>{/each}
      </div>
    {/if}
    {#if c.title}<div class="title">{c.title}</div>{/if}
    {#if c.rating != null}<div class="sub"><Stars value={c.rating} /></div>{/if}
    {#each c.festivals ?? [] as fe (fe)}<div class="fest">
        <PartyPopper size={12} />
        {fe}
      </div>{/each}
    {#if c.avg != null}<div class="line">
        {app.t('people.avg', { n: app.fmt.rating(c.avg) })}
        <StarMark />
      </div>{/if}
    {#if c.sub}<div class="sub">{c.sub}</div>{/if}
    {#each c.lines ?? [] as l, i (i)}<div class="line">{l}</div>{/each}
  </div>
{/if}

<style>
  .tooltip {
    position: fixed;
    z-index: 100;
    max-width: min(280px, calc(100vw - 16px));
    pointer-events: none;
    background: #070b1c;
    border: 1px solid #3b4a8f;
    border-radius: 10px;
    padding: 9px 11px;
    box-shadow: 0 10px 30px #0009;
    font-size: 12.5px;
    line-height: 1.35;
  }
  .title {
    font-weight: 650;
    color: var(--text);
  }
  .sub {
    color: var(--gold);
    margin-top: 1px;
  }
  .line {
    color: var(--muted);
  }
  .fest {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #fff;
    font-weight: 600;
  }
  .posters {
    display: flex;
    gap: 5px;
    margin-bottom: 7px;
  }
  .p {
    width: 38px;
    font-size: 6px;
  }
</style>
