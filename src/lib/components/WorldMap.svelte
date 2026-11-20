<script>
  import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo';
  import { app } from '$lib/state.svelte.js';
  import { ramp } from '$lib/colors.js';
  import { tip, onActivate } from '$lib/tip.js';
  import { countries, mapRows } from '$lib/map-rows.js';
  import ColorScale from './ColorScale.svelte';

  let { rows } = $props(); // [{key: 'FR', count, ...}]

  // Three full globes: the Americas, Europe / Africa and Asia / Oceania, each tilted a little to the north.
  // Asia is listed last, so it is drawn on top of the other two. Two arrangements, both slightly overlapping:
  // side by side on wide screens, a triangle (Asia at the bottom) on phones.
  const CENTERS = {
    Americas: [-85, 25],
    'Europe / Africa': [18, 17],
    'Asia / Oceania': [115, 5]
  };
  const LAYOUTS = {
    wide: {
      R: 148,
      box: [904, 356],
      at: { Americas: [219, 178], 'Europe / Africa': [452, 178], 'Asia / Oceania': [685, 178] }
    },
    tri: {
      R: 160,
      box: [760, 612],
      at: { Americas: [235, 172], 'Europe / Africa': [525, 172], 'Asia / Oceania': [380, 432] }
    }
  };

  function build({ R, at }) {
    return Object.entries(CENTERS).map(([name, center]) => {
      const proj = geoOrthographic()
        .rotate([-center[0], -center[1]])
        .translate(at[name])
        .scale(R)
        .clipAngle(90);
      const path = geoPath(proj);
      return {
        name,
        sphere: path({ type: 'Sphere' }),
        grid: path(geoGraticule10()),
        shapes: countries.map((c) => ({ code: c.code, d: path(c.ft) })).filter((s) => s.d)
      };
    });
  }
  const layouts = Object.fromEntries(
    Object.entries(LAYOUTS).map(([k, l]) => [k, { box: l.box, views: build(l) }])
  );

  const merged = $derived(mapRows(rows));
  const hk = $derived(merged.hk);
  const by = $derived(new Map(merged.rows.map((r) => [r.key, r])));
  const top = $derived(Math.max(1, ...merged.rows.map((r) => r.count)));

  // Selecting China selects Hong Kong too, so the filter matches the number shown
  const codesOf = (code) => (code === 'CN' && hk ? ['CN', 'HK'] : [code]);
  function toggle(code) {
    const on = app.has('country', code);
    for (const c of codesOf(code)) if (app.has('country', c) === on) app.toggle('country', c);
  }

  // The outline of the hovered / selected countries is drawn again on top of all the others, so neighbours never clip it
  let hover = $state(null);
</script>

{#snippet globes(kind)}
  {@const l = layouts[kind]}
  <svg class={kind} viewBox="0 0 {l.box[0]} {l.box[1]}" role="img" aria-label="Map">
    {#each l.views as v (v.name)}
      <g>
        <path
          class="ocean"
          d={v.sphere}
          fill="#0b1233"
          stroke="#fff"
          stroke-opacity="0.9"
          stroke-width="1.6"
        />
        <path d={v.grid} fill="none" stroke="#ffffff10" stroke-width="0.5" pointer-events="none" />
        {#each v.shapes as s, i (i)}
          {@const r = by.get(s.code)}
          <path
            d={s.d}
            fill={r ? ramp(0.3 + 0.7 * Math.sqrt(r.count / top)) : '#18224d'}
            stroke="#0a0f24"
            stroke-width="0.5"
            class:hit={!!r}
            role={r ? 'button' : undefined}
            tabindex={r ? -1 : undefined}
            onclick={() => r && toggle(s.code)}
            onkeydown={r ? onActivate(() => toggle(s.code)) : undefined}
            onpointerenter={() => r && (hover = s.code)}
            onpointerleave={() => (hover = null)}
            use:tip={() =>
              r
                ? {
                    title: app.countryName(s.code),
                    sub: app.t('unit.films', { n: r.count }),
                    avg: r.avg,
                    films: r.films.slice(-3),
                    minWidth: 150
                  }
                : null}
          />
        {/each}
        {#each v.shapes.filter((s) => by.has(s.code) && (s.code === hover || app.has('country', s.code))) as s (s.code)}
          <path
            d={s.d}
            fill="none"
            stroke="#fff"
            stroke-width={app.has('country', s.code) ? 1.6 : 1}
            stroke-linejoin="round"
            pointer-events="none"
          />
        {/each}
      </g>
    {/each}
  </svg>
{/snippet}

<div class="wm">
  <div class="maps">
    {@render globes('wide')}
    {@render globes('tri')}
  </div>
  <div class="foot">
    <ColorScale color={(t) => ramp(0.3 + 0.7 * Math.sqrt(t))} />
  </div>
</div>

<style>
  .wm {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .maps {
    flex: 1;
    min-height: 0;
    display: grid;
    place-items: center;
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  svg.tri {
    display: none;
  }
  @media (max-width: 760px) {
    svg.wide {
      display: none;
    }
    svg.tri {
      display: block;
    }
  }
  .ocean {
    pointer-events: none;
  }
  path.hit {
    cursor: pointer;
  }
  .foot {
    display: flex;
    margin-top: 6px;
  }
</style>
