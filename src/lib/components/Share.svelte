<script>
  import { app } from '$lib/state.svelte.js';
  import Pie from './Pie.svelte';
</script>

<div class="card">
  <div class="card-head"><h2>{app.t('share.title')}</h2></div>
  <div class="two">
    <Pie
      flag="female"
      label={app.t('share.female')}
      hit={(x) => x.femaleDirector}
      color="var(--gold)"
    />
    <Pie
      flag="debut"
      label={app.t('share.debut')}
      hit={(x) => x.debut === true}
      known={(x) => x.debut != null}
      color="var(--red-hi)"
    />
  </div>
</div>

<style>
  .two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
</style>
