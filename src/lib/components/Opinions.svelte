<script>
  import { app } from '$lib/state.svelte.js';
  import { opinions } from '$lib/stats.js';
  import Poster from './Poster.svelte';
  import StarMark from './StarMark.svelte';

  const o = $derived(opinions(app.films()));
  const f = $derived(app.fmt);
  const sign = (d) => (d > 0 ? '+' : '−') + f.dec1(Math.abs(d)).replace(/[.,]0$/, '');
</script>

<div class="card">
  <div class="card-head">
    <h2>{app.t('opinions.title')}</h2>
    {#if o.count}<span class="sub">{app.t('opinions.sub')}</span>{/if}
  </div>
  {#if !o.count}
    <p class="empty">{app.t('opinions.none')}</p>
  {:else}
    <div class="legend">
      <i class="me"></i>{app.t('opinions.legend.me')} <i class="them"></i>{app.t(
        'opinions.legend.them'
      )}
    </div>
    <div class="cols">
      {#each [['higher', o.higher], ['lower', o.lower]] as [k, list] (k)}
        <section>
          <h3>{app.t(`opinions.${k}`)}</h3>
          <ul>
            {#each list as r (r.film.id)}
              <li>
                <button onclick={() => app.openDetail(r.film)}>
                  <span class="p"><Poster film={r.film} size="w92" /></span>
                  <span class="t">
                    <span class="ti">{app.title(r.film)}</span>
                    <!-- one track: the base line, the ticks, the link and the dots all share its vertical centre -->
                    <span class="track" aria-hidden="true">
                      {#each [1, 2, 3, 4] as g (g)}<i class="tick" style:left="{g * 20}%"
                        ></i>{/each}
                      <i
                        class="link"
                        class:up={r.delta > 0}
                        style:left="{(Math.min(r.film.avg, r.film.rating) / 5) * 100}%"
                        style:width="{(Math.abs(r.film.rating - r.film.avg) / 5) * 100}%"
                      ></i>
                      <i class="dot them" style:left="{(r.film.avg / 5) * 100}%"></i>
                      <i class="dot me" style:left="{(r.film.rating / 5) * 100}%"></i>
                    </span>
                  </span>
                  <span class="d" class:up={r.delta > 0}
                    >{sign(r.delta)}<StarMark /><small
                      ><b class="mine">{f.rating(r.film.rating)}<StarMark /></b>
                      <i class="sep"></i><b class="theirs">{f.dec2(r.film.avg)}<StarMark /></b
                      ></small
                    ></span
                  >
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card {
    --lb: #7d93ff;
    --ring: #111a3d; /* the card background: gives the dots a cut-out edge instead of a coloured stroke */
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 36px;
  }
  @media (max-width: 860px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  h3 {
    font: 700 14px var(--title);
    color: var(--text);
    margin: 14px 0 6px;
  }
  .legend {
    font-size: 12px;
    color: var(--muted);
    display: flex;
    gap: 6px;
    align-items: center;
    margin-top: -6px;
  }
  .legend i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin-left: 8px;
  }
  .legend .me {
    background: #fff;
  }
  .legend .them {
    background: var(--lb);
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 4px;
  }
  button {
    width: 100%;
    display: grid;
    grid-template-columns: 30px 1fr auto;
    gap: 12px;
    align-items: center;
    text-align: left;
    background: transparent;
    border: 0;
    padding: 4px;
    border-radius: 10px;
  }
  button:hover {
    background: #ffffff0d;
  }
  .p {
    font-size: 5px;
  }
  .t {
    display: grid;
    gap: 1px;
    min-width: 0;
    position: relative;
  }
  .ti {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13.5px;
  }
  .track {
    position: relative;
    display: block;
    height: 14px;
  }
  /* everything on the track is centred on its middle line */
  .track::before,
  .tick,
  .link,
  .dot {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
  .track::before {
    content: '';
    left: 0;
    right: 0;
    height: 1px;
    background: #26336a;
  }
  .tick {
    width: 1px;
    height: 5px;
    background: #26336a;
  }
  .link {
    height: 3px;
    background: var(--red-hi);
  }
  .link.up {
    background: var(--gold);
  }
  .dot {
    box-sizing: content-box;
    width: 10px;
    height: 10px;
    border: 2px solid var(--ring);
    border-radius: 50%;
    transform: translate(-50%, -50%); /* centred on its value, both ways */
  }
  .dot.me {
    background: #fff;
    z-index: 2;
  }
  .dot.them {
    background: var(--lb);
    z-index: 1;
  }
  .d {
    font: 700 15px var(--serif);
    color: var(--red-hi);
    text-align: right;
    white-space: nowrap;
  }
  .d.up {
    color: var(--gold);
  }
  .d small {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    font: 400 12px var(--sans);
  }
  .d small .sep {
    width: 1px;
    height: 12px;
    background: var(--line);
  }
  .d small b {
    font-weight: 600;
  }
  .d small .mine {
    color: #fff;
  }
  .d small .theirs {
    color: var(--lb);
  }
</style>
