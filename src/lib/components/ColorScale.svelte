<script>
  import { app } from '$lib/state.svelte.js';

  // "Less … More" swatches. `color` maps 0–1 to a colour: each chart passes the mapping it paints its cells with.
  let { color } = $props();
</script>

<span class="scale">
  <span>{app.t('cal.less')}</span>
  {#each [0, 0.25, 0.5, 0.75, 1] as t (t)}<i style:background={color(t)}></i>{/each}
  <span>{app.t('cal.more')}</span>
</span>

<style>
  .scale {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    margin-left: auto;
    font-size: 11px;
  }
  i {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    display: block;
  }
</style>
