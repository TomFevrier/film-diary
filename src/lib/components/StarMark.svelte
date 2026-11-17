<script>
  // A single filled star next to a number (e.g. "3.46 ★").
  import Star from '@lucide/svelte/icons/star';
</script>

<span class="mark" aria-hidden="true"
  ><Star size="1em" fill="currentColor" strokeWidth={1.5} /></span
>

<style>
  .mark {
    display: inline-flex;
    vertical-align: -0.12em;
  }
</style>
