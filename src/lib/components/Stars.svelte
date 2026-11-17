<script>
  // Letterboxd-style rating: whole stars plus a half star, drawn with Lucide icons.
  import Star from '@lucide/svelte/icons/star';
  import StarHalf from '@lucide/svelte/icons/star-half';

  let { value = null, label = true } = $props();
  const full = $derived(Math.floor(value ?? 0));
  const half = $derived((value ?? 0) % 1 >= 0.5);
</script>

{#if value != null}
  <span
    class="stars"
    role={label ? 'img' : undefined}
    aria-label={label ? `${value} / 5` : undefined}
    aria-hidden={label ? undefined : 'true'}
  >
    {#each Array(full) as _, i (i)}<Star size="1em" fill="currentColor" strokeWidth={1.5} />{/each}
    {#if half}<span class="half"><StarHalf size="1em" fill="currentColor" strokeWidth={1.5} /></span
      >{/if}
  </span>
{:else}–{/if}

<style>
  .stars {
    display: inline-flex;
    align-items: center;
    gap: 0.04em;
    vertical-align: -0.14em;
    line-height: 1;
  }
  .stars :global(svg) {
    display: block;
    flex: none;
  }
  /* the Lucide half star only draws the left half of its box: trim the empty right half */
  .half {
    display: inline-flex;
    width: 0.56em;
    overflow: hidden;
  }
</style>
