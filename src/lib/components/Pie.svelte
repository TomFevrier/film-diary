<script>
  import { pie, arc } from 'd3-shape';
  import { app } from '$lib/state.svelte.js';
  import { tip, onActivate } from '$lib/tip.js';
  import { unique } from '$lib/stats.js';
  import { NUMERAL } from '$lib/scale.js';

  // flag: the boolean filter key ('female' | 'debut'); the pie ignores only its own filter
  let { flag, hit, known = () => true, label, color = 'var(--gold)' } = $props();
  const f = $derived(app.fmt);
  const withData = $derived(unique(app.films(flag)).filter(known));
  const hits = $derived(withData.filter(hit));
  const rest = $derived(withData.filter((x) => !hit(x)));
  const n = $derived(withData.length);
  const active = $derived(app.has(flag, true));
  const toggle = () => app.toggle(flag, true);

  let pw = $state(0);
  const k = $derived(pw ? pw / 120 : 1); // rendered px per viewBox unit
  const R = 54,
    r = 36;
  const slices = $derived(
    pie()
      .sort(null)
      .startAngle(0)
      .padAngle(hits.length && rest.length ? 0.03 : 0)([hits.length, rest.length])
  );
  const path = (d, grow = 0) =>
    arc()
      .innerRadius(r)
      .outerRadius(R + grow)
      .cornerRadius(2.5)(d);
</script>

<div class="p">
  <svg
    viewBox="-60 -60 120 120"
    bind:clientWidth={pw}
    role="img"
    aria-label="{label}: {n ? f.pct(hits.length / n) : '–'}"
  >
    {#if n}
      <path
        d={path(slices[1])}
        fill="#25347a"
        opacity={active ? 0.5 : 1}
        use:tip={() => ({
          title: app.t('share.rest'),
          sub: app.t('unit.films', { n: rest.length }),
          films: rest.slice(-3)
        })}
      />
      <path
        d={path(slices[0], active ? 3 : 0)}
        fill={color}
        role="button"
        tabindex="-1"
        aria-pressed={active}
        aria-label={label}
        onclick={toggle}
        onkeydown={onActivate(toggle)}
        use:tip={() => ({
          title: label,
          sub: app.t('unit.films', { n: hits.length }),
          films: hits.slice(-4)
        })}
      />
      <text
        class="pct"
        style:font-size="{NUMERAL / k}px"
        x="0"
        y="0"
        text-anchor="middle"
        dominant-baseline="central">{f.pct(hits.length / n)}</text
      >
    {:else}
      <circle
        r={(R + r) / 2}
        fill="none"
        stroke="#25347a"
        stroke-width={R - r}
        stroke-dasharray="3 4"
        opacity="0.6"
      />
      <text
        class="pct"
        style:font-size="{NUMERAL / k}px"
        x="0"
        y="0"
        text-anchor="middle"
        dominant-baseline="central">–</text
      >
    {/if}
  </svg>
  <div class="lbl">{label}</div>
  <div class="of">
    {n ? app.t('share.of', { a: f.int(hits.length), b: f.int(n) }) : app.t('share.needs')}
  </div>
</div>

<style>
  .p {
    text-align: center;
    min-width: 0;
  }
  svg {
    width: 100%;
    max-width: 104px;
    height: auto;
    display: block;
    margin: 0 auto 6px;
    overflow: visible;
  }
  path[role='button'] {
    cursor: pointer;
  }
  path[role='button']:hover {
    filter: brightness(1.15);
  }
  .pct {
    font-family: var(--serif);
    font-weight: 700;
    fill: var(--text);
  }
  .lbl {
    font-size: 13px;
  }
  .of {
    font-size: 12px;
    color: var(--muted);
  }
</style>
