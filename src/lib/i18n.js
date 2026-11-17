// UI strings. Each key holds both languages side by side, so a missing translation is easy to spot.
//   • Add a key here, then use it with `app.t('key', { name: value })`; `{name}` placeholders are filled from the params.
//   • Plurals are written { one, other } and chosen with `params.n` (French treats 0 and 1 as "one").
//   • A missing language falls back to English, then to the key itself.
export const messages = {
  // ── Page header ───────────────────────────────────────────────────────
  'app.title': { en: 'My year in film', fr: 'Mon année de cinéma' },
  'app.title.all': { en: 'My film diary', fr: 'Mon journal de cinéma' },
  'app.subtitle': { en: 'Everything I watched, {scope}', fr: 'Tout ce que j’ai vu, {scope}' },
  'app.description': {
    en: 'Every film I’ve watched, year by year: calendar, ratings, favourite directors, cinemas and more.',
    fr: 'Tous les films que j’ai vus, année par année\u00a0: calendrier, notes, réalisateurs préférés, cinémas et plus encore.'
  },
  'scope.all': { en: 'since {year}', fr: 'depuis {year}' },
  'scope.year': { en: 'in {year}', fr: 'en {year}' },
  'year.all': { en: 'All years', fr: 'Toutes les années' },
  updated: { en: 'Updated {date}', fr: 'Mis à jour le {date}' },
  lang: { en: 'Language', fr: 'Langue' },

  // ── Filter bar ────────────────────────────────────────────────────────
  'filters.active': { en: 'Filtering by', fr: 'Filtré par' },
  'filters.clear': { en: 'Clear all', fr: 'Tout effacer' },
  'filters.hint': {
    en: 'Click anything in a chart to filter the whole dashboard.',
    fr: 'Cliquez sur un élément d’un graphique pour filtrer tout le tableau de bord.'
  },

  // ── Shared ────────────────────────────────────────────────────────────
  'unit.films': {
    en: { one: '{n} film', other: '{n} films' },
    fr: { one: '{n} film', other: '{n} films' }
  },
  'type.cinema': { en: 'Cinema', fr: 'Cinéma' },
  'type.physical': { en: 'Blu-ray', fr: 'Blu-ray' },
  'type.streaming': { en: 'Streaming & TV', fr: 'Streaming & TV' },
  more: { en: 'Show more', fr: 'Voir plus' },
  less: { en: 'Show less', fr: 'Voir moins' },
  empty: { en: 'Nothing matches these filters.', fr: 'Aucun film ne correspond à ces filtres.' },

  // ── Summary tiles ─────────────────────────────────────────────────────
  'tile.films': { en: 'Films', fr: 'Films' },
  'tile.films.sub': {
    // {n} picks the singular/plural form, {nf} is the same number formatted (1,507)
    en: { one: '{nf} viewing', other: '{nf} viewings' },
    fr: { one: '{nf} visionnage', other: '{nf} visionnages' }
  },
  'tile.time': { en: 'Time spent', fr: 'Temps passé' },
  'tile.time.sub': { en: '{span} non-stop', fr: '{span} non-stop' },
  'tile.cinema': { en: 'At the cinema', fr: 'Au cinéma' },
  'tile.physical': { en: 'On Blu-ray', fr: 'En Blu-ray' },
  'tile.streaming': { en: 'Streaming & TV', fr: 'Streaming & TV' },
  'tile.rating': { en: 'Average rating', fr: 'Note moyenne' },
  'tile.rating.sub': { en: 'across {n} rated', fr: 'sur {n} films notés' },

  // ── Calendar ──────────────────────────────────────────────────────────
  'cal.title': { en: 'Calendar', fr: 'Calendrier' },
  'cal.films': { en: 'Films', fr: 'Films' },
  'cal.hours': { en: 'Hours', fr: 'Heures' },
  'cal.less': { en: 'Less', fr: 'Moins' },
  'cal.more': { en: 'More', fr: 'Plus' },
  'cal.busiest': { en: 'Busiest day', fr: 'Jour le plus chargé' },

  // ── Decades ───────────────────────────────────────────────────────────
  'decades.title': { en: 'Decades', fr: 'Décennies' },
  'decades.sub': {
    en: 'One frame per film, tinted by my rating',
    fr: 'Une image par film, teintée selon ma note'
  },
  'decades.before': { en: 'Before 1930', fr: 'Avant 1930' },
  'decades.new': { en: 'Released in {year}', fr: 'Sortis en {year}' },
  'decade.label': { en: '{d}s', fr: 'Années {d}' },

  // ── Ratings ───────────────────────────────────────────────────────────
  'ratings.title': { en: 'Ratings', fr: 'Notes' },
  'ratings.avg': { en: 'avg {n}', fr: 'moy. {n}' },
  'ratings.unrated': { en: '{n} unrated', fr: '{n} sans note' },

  // ── Who’s behind the camera ───────────────────────────────────────────
  'share.title': { en: 'Who’s behind the camera', fr: 'Derrière la caméra' },
  'share.female': { en: 'Directed by women', fr: 'Réalisés par des femmes' },
  'share.debut': { en: 'Directorial debuts', fr: 'Premiers films' },
  'share.of': { en: '{a} of {b}', fr: '{a} sur {b}' },
  'share.needs': { en: 'Needs TMDb data', fr: 'Nécessite les données TMDb' },
  'share.rest': { en: 'Others', fr: 'Autres' },

  // ── Where I watch ─────────────────────────────────────────────────────
  'venues.title': { en: 'Where I watch', fr: 'Où je regarde' },
  'venues.cinemas': { en: 'Cinemas', fr: 'Cinémas' },
  'venues.platforms': { en: 'Platforms', fr: 'Plateformes' },
  'venues.cities': { en: 'Cities', fr: 'Villes' },
  'venues.events': { en: 'Tags', fr: 'Étiquettes' },
  'venues.metric.films': { en: 'Viewings', fr: 'Visionnages' },
  'venues.metric.time': { en: 'Time', fr: 'Durée' },
  'venues.events.hint': {
    en: 'Tags from the comment column, seen at least twice',
    fr: 'Mentions de la colonne commentaire, vues au moins deux fois'
  },

  // ── Favourites ────────────────────────────────────────────────────────
  'people.title': { en: 'Favourites', fr: 'Favoris' },
  'people.directors': { en: 'Directors', fr: 'Réalisateurs' },
  'people.actors': { en: 'Actors', fr: 'Acteurs' },
  'people.countries': { en: 'Countries', fr: 'Pays' },
  'people.genres': { en: 'Genres', fr: 'Genres' },
  'people.actors.hint': {
    en: 'Top-billed cast only (first 10 names of each film)',
    fr: 'Têtes d’affiche uniquement (10 premiers noms de chaque film)'
  },
  'people.map': { en: 'Map', fr: 'Carte' },
  'people.all': { en: 'All', fr: 'Tous' },
  'people.women': { en: 'Women', fr: 'Femmes' },
  'people.men': { en: 'Men', fr: 'Hommes' },
  'people.twice': {
    en: 'Only those seen at least twice',
    fr: 'Seulement ceux vus au moins deux fois'
  },
  'people.list': { en: 'List', fr: 'Liste' },
  'people.offmap': { en: 'Not on the map: {names}', fr: 'Absents de la carte\u00a0: {names}' },
  'people.avg': { en: 'avg {n}', fr: 'moy. {n}' },

  // ── Unpopular opinions ────────────────────────────────────────────────
  'opinions.title': { en: 'Unpopular opinions', fr: 'Avis impopulaires' },
  'opinions.sub': {
    en: 'My rating vs. the Letterboxd average',
    fr: 'Ma note vs la moyenne Letterboxd'
  },
  'opinions.higher': { en: 'Rated higher than the crowd', fr: 'Mieux notés que par la foule' },
  'opinions.lower': { en: 'Rated lower than the crowd', fr: 'Moins bien notés que par la foule' },
  'opinions.none': {
    en: 'Letterboxd averages aren’t available yet. They appear after the first TMDb / Letterboxd sync.',
    fr: 'Les moyennes Letterboxd ne sont pas encore disponibles. Elles apparaissent après la première synchro TMDb / Letterboxd.'
  },
  'opinions.legend.me': { en: 'Me', fr: 'Moi' },
  'opinions.legend.them': { en: 'Letterboxd', fr: 'Letterboxd' },

  // ── Habits ────────────────────────────────────────────────────────────
  'habits.title': { en: 'Habits', fr: 'Habitudes' },
  'habits.weekdays': { en: 'Days of the week', fr: 'Jours de la semaine' },
  'habits.with': { en: 'Watched with', fr: 'Vus avec' },
  'habits.streak': { en: 'Longest streak', fr: 'Plus longue série' },
  'habits.streak.v': {
    en: { one: '{n} day in a row', other: '{n} days in a row' },
    fr: { one: '{n} jour d’affilée', other: '{n} jours d’affilée' }
  },
  'habits.busiest': { en: 'Busiest day', fr: 'Jour le plus chargé' },
  'habits.longest': { en: 'Longest film', fr: 'Film le plus long' },
  'habits.shortest': { en: 'Shortest film', fr: 'Film le plus court' },
  'habits.oldest': { en: 'Oldest film', fr: 'Film le plus ancien' },
  'habits.dubbed': { en: 'Watched dubbed (VF)', fr: 'Vus en VF' },
  'habits.alone': { en: 'Watched alone', fr: 'Vus en solo' },

  // ── The log ───────────────────────────────────────────────────────────
  'wall.title': { en: 'The log', fr: 'Le journal' },
  'wall.sort.date': { en: 'Latest', fr: 'Plus récents' },
  'wall.sort.rating': { en: 'Top rated', fr: 'Mieux notés' },
  'wall.sort.year': { en: 'Oldest first', fr: 'Plus anciens' },
  'wall.rewatch': { en: 'Rewatch', fr: 'Revu' },

  // ── Film popup ────────────────────────────────────────────────────────
  'detail.close': { en: 'Close', fr: 'Fermer' },
  'detail.watched': { en: 'Watched', fr: 'Vu le' },
  'detail.with': { en: 'With', fr: 'Avec' },
  'detail.directors': { en: 'Directed by', fr: 'Réalisé par' },
  'detail.cast': { en: 'Cast', fr: 'Distribution' },
  'detail.runtime': { en: 'Runtime', fr: 'Durée' },
  'detail.original': { en: 'Original title', fr: 'Titre original' },
  'detail.rewatch': { en: 'Rewatch', fr: 'Revu' },
  'detail.dubbed': { en: 'Dubbed (VF)', fr: 'En VF' },
  'detail.community': { en: 'Letterboxd average', fr: 'Moyenne Letterboxd' },
  'detail.tmdb': { en: 'Open on TMDb', fr: 'Voir sur TMDb' },
  'detail.letterboxd': { en: 'Open on Letterboxd', fr: 'Ouvrir sur Letterboxd' },

  // ── Filter chips (flag.*) ─────────────────────────────────────────────
  'flag.female': { en: 'Directed by women', fr: 'Réalisés par des femmes' },
  'flag.debut': { en: 'Directorial debut', fr: 'Premier film' },
  'flag.rewatch': { en: 'Rewatches', fr: 'Revus' },
  'flag.new': { en: 'New releases', fr: 'Sorties de l’année' },
  'flag.festival': { en: 'At a festival', fr: 'En festival' },
  'flag.dubbed': { en: 'Dubbed', fr: 'En VF' },
  'flag.unrated': { en: 'Unrated', fr: 'Sans note' },

  // ── Footer ────────────────────────────────────────────────────────────
  'footer.tmdb': {
    en: 'This product uses the TMDB API but is not endorsed or certified by TMDB.\nPosters and metadata © TMDB.\nLetterboxd averages are fetched from letterboxd.com.',
    fr: 'Ce produit utilise l’API TMDB mais n’est ni approuvé ni certifié par TMDB.\nAffiches et métadonnées © TMDB.\nLes moyennes Letterboxd proviennent de letterboxd.com.'
  }
};

const pluralRules = {};
const plural = (lang, n) => (pluralRules[lang] ??= new Intl.PluralRules(lang)).select(n);

/** Translate `key` into `lang`, filling `{placeholders}` from `params`. */
export function translate(lang, key, params = {}) {
  const entry = messages[key]?.[lang] ?? messages[key]?.en ?? key;
  const text =
    typeof entry === 'object' ? (entry[plural(lang, params.n ?? 0)] ?? entry.other) : entry;
  return String(text).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`);
}

// City names that the sheets write in one language, shown in the other when the UI language differs.
// One list of [English, French] pairs; both directions are derived from it.
const CITIES = [
  ['London', 'Londres'],
  ['Brussels', 'Bruxelles'],
  ['Edinburgh', 'Édimbourg'],
  ['Geneva', 'Genève'],
  ['Lisbon', 'Lisbonne'],
  ['Vienna', 'Vienne'],
  ['Venice', 'Venise'],
  ['Moscow', 'Moscou'],
  ['Warsaw', 'Varsovie'],
  ['Athens', 'Athènes'],
  ['Copenhagen', 'Copenhague'],
  ['Seville', 'Séville'],
  ['Bucharest', 'Bucarest'],
  ['The Hague', 'La Haye'],
  ['North Atlantic', 'Atlantique nord']
];
export const places = {
  fr: Object.fromEntries(CITIES),
  en: Object.fromEntries(CITIES.map(([en, fr]) => [fr, en]))
};
