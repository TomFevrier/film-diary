<script>
  import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo';
  import { feature } from 'topojson-client';
  import iso from 'iso-3166-1';
  import world from 'world-atlas/countries-110m.json';
  import { app } from '$lib/state.svelte.js';
  import { ramp } from '$lib/colors.js';
  import { tip, onActivate } from '$lib/tip.js';

  let { rows } = $props(); // [{key: 'FR', count, ...}]

  const num2a2 = new Map(iso.all().map((c) => [c.numeric, c.alpha2]));
  const countries = feature(world, world.objects.countries).features.map((ft) => ({
    code: num2a2.get(String(ft.id).padStart(3, '0')),
    ft
  }));
  const onMap = new Set(countries.map((c) => c.code));

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

  const by = $derived(new Map(rows.map((r) => [r.key, r])));
  const top = $derived(Math.max(1, ...rows.map((r) => r.count)));
  const missing = $derived(rows.filter((r) => !onMap.has(r.key)));
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
            class:sel={app.has('country', s.code)}
            role={r ? 'button' : undefined}
            tabindex={r ? -1 : undefined}
            onclick={() => r && app.toggle('country', s.code)}
            onkeydown={r ? onActivate(() => app.toggle('country', s.code)) : undefined}
            use:tip={() =>
              r
                ? {
                    title: app.countryName(s.code),
                    sub: app.t('unit.films', { n: r.count }),
                    avg: r.avg,
                    films: r.films.slice(-3)
                  }
                : null}
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
  {#if missing.length}
    <p class="miss">
      {app.t('people.offmap', {
        names: missing.map((m) => `${app.countryName(m.key)} (${m.count})`).join(', ')
      })}
    </p>
  {/if}
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
  path.hit:hover {
    stroke: #fff;
    stroke-width: 1;
  }
  path.sel {
    stroke: #fff;
    stroke-width: 1.6;
  }
  .miss {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--muted);
    text-align: center;
  }
</style>
