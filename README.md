# Film Diary

A Letterboxd-style stats dashboard for a Google Sheets film log. SvelteKit, fully static, EN/FR, mobile friendly.

```
Google Sheet ──(published CSV)──┐
TMDb API (posters, FR titles,   ├─► scripts/sync.mjs ─► films.json ─► SvelteKit static build ─► Netlify
 debuts, ratings) + Letterboxd ─┘          ▲
                                  runs on Netlify every 4 h
```

The sheet is read **at build time**, so your TMDb key never reaches the browser. A scheduled GitHub Action pings a Netlify build hook, which rebuilds the site; that is how it "automatically updates". API results are cached, so only new films cost a request.

## Setup (≈10 min, Netlify)

1. **Publish the sheet.** In Google Sheets: _File → Share → Publish to web →_ pick the _Films_ tab, format **CSV**, Publish. Copy the link.
2. **TMDb key.** Free account → <https://www.themoviedb.org/settings/api> → copy the _API Read Access Token_ (or v3 key).
3. **Push this folder to a GitHub repo** (the sheet's data and `.env` are git-ignored).
4. **Netlify → Add new site → Import from GitHub** and pick the repo. `netlify.toml` already holds the build settings (`npm run build`, publish `build`, Node 22, persistent cache).
5. **Site configuration → Environment variables:** add `SHEET_CSV_URL` and `TMDB_API_KEY`.
6. **Scheduled refresh:** _Build & deploy → Build hooks → Add build hook_, copy the URL, and add it as a GitHub repo secret named `NETLIFY_BUILD_HOOK`. `.github/workflows/refresh.yml` then triggers a rebuild every 4 hours (and from the _Run workflow_ button), which re-reads the sheet.
7. **Serve it at `tomfevrier.io/film-diary/`.** Keep this as its own Netlify site (its `*.netlify.app` address is only used behind the scenes) and add to the **`netlify.toml` of your main site**:

   ```toml
   [[redirects]]
     from = "/film-diary"
     to = "https://<this-site>.netlify.app/"
     status = 200

   [[redirects]]
     from = "/film-diary/*"
     to = "https://<this-site>.netlify.app/:splat"
     status = 200      # proxy: the URL stays tomfevrier.io/film-diary/…
   ```

   Both rules are proxies (`200`), not redirects. **Don't add a `301` from `/film-diary` to `/film-diary/`:** Netlify ignores trailing slashes when matching a rule, so that rule also matches `/film-diary/` and redirects it to itself (a "too many redirects" loop). The site uses absolute asset paths (`paths.relative: false` in `svelte.config.js`), so both `/film-diary` and `/film-diary/` work with these rules.

   `netlify.toml` here already sets `BASE_PATH=/film-diary`. Using another path (or a subdomain)? Change `BASE_PATH` there (empty for a root/subdomain) and the `from` paths above.

   The site's own `*.netlify.app` address works too: `netlify.toml` rewrites `/film-diary/…` to the root there, so the CSS and JS (requested under `/film-diary/_app/…`) load.

   If you ever had the `301` rule live, browsers and Netlify's edge cache it: redeploy the main site and check in a private window.

## URL parameters

The language and the year can be forced from the address, which makes a view easy to share or bookmark:

| Parameter                | Effect                                            |
| ------------------------ | ------------------------------------------------- |
| `?lang=fr` or `?lang=en` | Force the language.                               |
| `?year=2024`             | Show that year (it must be a year that has data). |
| `?year=all`              | Show all years together.                          |

Combine them with `&`, for example `tomfevrier.io/film-diary/?lang=fr&year=2023`. Without a parameter the language follows the browser (the first of its preferred languages that is English or French, otherwise English) and the year is the latest one. Invalid values are ignored. Switching the language or the year in the page updates the URL too, so reloading or sharing it keeps the same view; nothing is stored in the browser.

## Past years (the year dropdown)

The dashboard shows every year you give it, 2026 (the latest) by default, plus "All years". Only the **current year** comes from the Google Sheet and is re-read on every build. Past years are synced **once** into static files:

1. Put one CSV per past year in `data/history/` (any file name, e.g. `2022.csv`). Columns may differ a little from the live sheet: `tmdbId` _or_ `imdbId`, `femaleDirector` or `womenDirector`, `note_num` as a fallback rating, unknown columns are ignored.
2. With `TMDB_API_KEY` in `.env`, run `pnpm run sync:history`. IMDb ids are resolved to TMDb ids, then posters, photos, French titles, debuts and Letterboxd averages are fetched. This writes `data/history/<name>.json`. It is slow the first time (Letterboxd pages are fetched politely, one at a time).
3. **Commit the JSON files.** From then on builds only read them; no API calls are made for past years. A history file is re-synced only if its CSV changes or you run `pnpm run sync:history:force`.

If the live sheet also contains rows of a year that has a history file, the sheet wins for that year. Rows with no id (or an id TMDb doesn't know) stay in the stats but get no poster.

## Festivals

Festival days in the calendar are inferred from the `comment` column: a tag counts as a festival when it contains one of the words in `config.json → festivalKeywords` (default: _festival_ and _PIFFF_; accents and case are ignored). Add festivals whose name doesn't say "festival" there. Each festival gets a bar above the heatmap (from its first to its last viewing); clicking a bar filters on it, and the "At a festival" pill filters on all of them. This is computed in the browser, so changing the keywords never needs a re-sync.

## Local use

```bash
pnpm install
cp .env.example .env     # fill in the three values
pnpm run dev              # syncs, then starts the dev server
pnpm run build            # syncs, then writes ./build (static site)
pnpm test                 # parser tests
```

With no `.env` it reads `data/movies.csv` (git-ignored: drop your own export there). Without a TMDb key the dashboard still works, minus posters, French titles, director/actor photos, directorial debuts and (with Letterboxd) the "unpopular opinions" panel.

## Social preview image

`scripts/og.mjs` (run by `dev` and `build`, after the sync) draws a 1200×630 card for link previews: the latest
year, films, hours, viewings at the cinema / on Blu-ray / streaming, and a fan of the posters of the year's
best-rated **first watches** (rewatches and films first seen in an earlier year are left out). There is one card per
language, and one prerendered page per language, since crawlers don't run JavaScript: share
`https://tomfevrier.io/film-diary/` for English or `…/film-diary/fr/` for French (the main page still picks the
language from `?lang=` or the browser). The images (`static/og/`, hashed names) and `src/lib/data/og.json` are
generated and not committed. If a poster can't be fetched the card shows a placeholder; if rendering fails the build
carries on without an `og:image`. After changing the card, refresh Facebook's cache with the Sharing Debugger.

## Fonts and icons

- Fonts come from Google Fonts (a `<link>` in `src/app.html`): **Lato** for text, **Assistant** for titles, **Playfair Display** for numerals and accents. The tokens are `--sans`, `--title` and `--serif` in `src/app.css`. Visitors' browsers fetch them from Google; to self-host instead, swap the `<link>` for `@fontsource` packages.
- Icons: [Lucide](https://lucide.dev) (`@lucide/svelte`, stars, gender symbols, close, external link…) and the Letterboxd and TMDB logos are image files in `static/logos/` (`letterboxd.svg`, `tmdb.svg`). **The files in the repo are simple placeholders: replace them with the official logos** (file names are listed in `src/lib/logos.js`).

## Code quality

```bash
pnpm run format        # Prettier: rewrites files (Svelte, JS, JSON, CSS, Markdown)
pnpm run format:check  # same, but only reports
pnpm run lint          # ESLint with the Svelte plugin (e.g. requires keys in {#each} blocks)
pnpm run check         # format:check + lint + tests, what CI should run
```

Settings live in `.prettierrc`, `.prettierignore` and `eslint.config.js`.

## How the columns are interpreted

| Column                            | Notes                                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `date`                            | `2026-03-14` or `14/03/2026`. Rows without a valid date are skipped (and logged).                                                                                              |
| `year`                            | The **film's** year (used for decades). `releaseYear` is the fallback. Watch year comes from `date`.                                                                           |
| `note`                            | `***°` = 3.5. A lone `°` = 0.5.                                                                                                                                                |
| `medium`                          | Starts with `Cinéma ` → cinema. Contains `blu-ray`/`dvd` → physical. Anything else → streaming/TV. Tune it in `config.json`; the CI log lists how every medium was classified. |
| `country`, `genres`               | English or French names; normalised to ISO codes / TMDb genres, then localised in the UI. Unknown countries are logged.                                                        |
| `actors`                          | Only the first 10 names per film count (casts include extras). `maxActors` in `config.json`.                                                                                   |
| `comment`                         | Tags that appear ≥ 2 times become the "Events & formats" list.                                                                                                                 |
| `VF`, `rewatch`, `femaleDirector` | Any of `X`, `1`, `true`, `oui`.                                                                                                                                                |

## Data sources & caveats

- **Posters**: original-language poster when the film is English or French; otherwise the international (English) one (`config.json → posters.policy`, or `always-original`). Images load from TMDb's CDN.
- **Titles**: English / French title from TMDb, following the language toggle (sheet title as fallback).
- **Directorial debut**: a film counts if, for at least one of its directors, no earlier _feature_ exists in their TMDb directing credits. Earlier credits are ignored when they are TV movies (TMDb genre) or run under 40 minutes (shorts, or no runtime on record). If TMDb can't be reached for a check the result stays "unknown" rather than guessing.
- **Community average**: Letterboxd only (it has no public API, so the sync reads each film's public page, `letterboxd.com/tmdb/<id>`, at most once per film per 30 days: the `twitter:data2` meta tag, or the JSON-LD `aggregateRating` block as a fallback). There is deliberately no TMDb fallback; if Letterboxd blocks the build server, the "Unpopular opinions" panel stays empty. Disable the lookups with `LETTERBOXD=0`.
- **People**: photos and gender (used to highlight women directors/actors) come from TMDb credits, matched on the names in your sheet. Names TMDb doesn't match simply show initials.
- TMDb attribution is required by their terms and is in the footer.
