#!/usr/bin/env node
// Generates data/sample.csv – a fake viewing log in the same shape as your Google Sheet.
// (tmdbIds are illustrative; use your real sheet for real posters.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// [tmdbId, title, releaseYear, runtime, countries, directors, actors, genres, female]
const F = [
  [
    238,
    'The Godfather',
    1972,
    175,
    'United States of America',
    'Francis Ford Coppola',
    'Marlon Brando, Al Pacino, James Caan',
    'Drama, Crime'
  ],
  [
    129,
    'Spirited Away',
    2001,
    125,
    'Japan',
    'Hayao Miyazaki',
    'Rumi Hiiragi, Miyu Irino',
    'Animation, Family, Fantasy'
  ],
  [
    496243,
    'Parasite',
    2019,
    133,
    'South Korea',
    'Bong Joon-ho',
    'Song Kang-ho, Choi Woo-shik, Park So-dam',
    'Comedy, Thriller, Drama'
  ],
  [
    680,
    'Pulp Fiction',
    1994,
    154,
    'United States of America',
    'Quentin Tarantino',
    'John Travolta, Samuel L. Jackson, Uma Thurman',
    'Thriller, Crime'
  ],
  [
    603,
    'The Matrix',
    1999,
    136,
    'United States of America',
    'Lana Wachowski, Lilly Wachowski',
    'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss',
    'Action, Science Fiction',
    1
  ],
  [
    78,
    'Blade Runner',
    1982,
    117,
    'United States of America, United Kingdom',
    'Ridley Scott',
    'Harrison Ford, Rutger Hauer, Sean Young',
    'Science Fiction, Drama'
  ],
  [
    348,
    'Alien',
    1979,
    117,
    'United Kingdom, United States of America',
    'Ridley Scott',
    'Sigourney Weaver, Tom Skerritt',
    'Horror, Science Fiction'
  ],
  [
    194,
    'Amélie',
    2001,
    122,
    'France, Germany',
    'Jean-Pierre Jeunet',
    'Audrey Tautou, Mathieu Kassovitz',
    'Comedy, Romance'
  ],
  [
    406,
    'La Haine',
    1995,
    98,
    'France',
    'Mathieu Kassovitz',
    'Vincent Cassel, Hubert Koundé, Saïd Taghmaoui',
    'Drama, Crime'
  ],
  [
    539,
    'Psycho',
    1960,
    109,
    'United States of America',
    'Alfred Hitchcock',
    'Anthony Perkins, Janet Leigh',
    'Horror, Mystery, Thriller'
  ],
  [
    426,
    'Vertigo',
    1958,
    128,
    'United States of America',
    'Alfred Hitchcock',
    'James Stewart, Kim Novak',
    'Mystery, Romance, Thriller'
  ],
  [
    346,
    'Seven Samurai',
    1954,
    207,
    'Japan',
    'Akira Kurosawa',
    'Toshiro Mifune, Takashi Shimura',
    'Action, Drama'
  ],
  [
    18148,
    'Tokyo Story',
    1953,
    136,
    'Japan',
    'Yasujirō Ozu',
    'Chishū Ryū, Chieko Higashiyama',
    'Drama'
  ],
  [
    19,
    'Metropolis',
    1927,
    153,
    'Germany',
    'Fritz Lang',
    'Brigitte Helm, Alfred Abel',
    'Science Fiction, Drama'
  ],
  [
    531428,
    'Portrait of a Lady on Fire',
    2019,
    122,
    'France',
    'Céline Sciamma',
    'Noémie Merlant, Adèle Haenel',
    'Drama, Romance, History',
    1
  ],
  [
    915935,
    'Anatomy of a Fall',
    2023,
    152,
    'France',
    'Justine Triet',
    'Sandra Hüller, Swann Arlaud, Milo Machado-Graner',
    'Drama, Crime, Mystery',
    1
  ],
  [
    666277,
    'Past Lives',
    2023,
    106,
    'United States of America, South Korea',
    'Celine Song',
    'Greta Lee, Teo Yoo, John Magaro',
    'Drama, Romance',
    1
  ],
  [
    153,
    'Lost in Translation',
    2003,
    102,
    'United States of America, Japan',
    'Sofia Coppola',
    'Bill Murray, Scarlett Johansson',
    'Drama, Romance',
    1
  ],
  [
    1018,
    'Mulholland Drive',
    2001,
    147,
    'United States of America, France',
    'David Lynch',
    'Naomi Watts, Laura Harring',
    'Thriller, Mystery, Drama'
  ],
  [
    843,
    'In the Mood for Love',
    2000,
    98,
    'Hong Kong, France',
    'Wong Kar-wai',
    'Tony Leung Chiu-wai, Maggie Cheung',
    'Drama, Romance'
  ],
  [
    758866,
    'Drive My Car',
    2021,
    179,
    'Japan',
    'Ryusuke Hamaguchi',
    'Hidetoshi Nishijima, Tōko Miura',
    'Drama'
  ],
  [
    619264,
    'Titane',
    2021,
    108,
    'France, Belgium',
    'Julia Ducournau',
    'Agathe Rousselle, Vincent Lindon',
    'Horror, Thriller, Drama',
    1
  ],
  [
    346698,
    'Barbie',
    2023,
    114,
    'United States of America, United Kingdom',
    'Greta Gerwig',
    'Margot Robbie, Ryan Gosling, America Ferrera',
    'Comedy, Adventure, Fantasy',
    1
  ],
  [
    545611,
    'Everything Everywhere All at Once',
    2022,
    139,
    'United States of America',
    'Daniel Kwan, Daniel Scheinert',
    'Michelle Yeoh, Ke Huy Quan, Stephanie Hsu',
    'Action, Adventure, Science Fiction'
  ],
  [
    8392,
    'My Neighbor Totoro',
    1988,
    86,
    'Japan',
    'Hayao Miyazaki',
    'Noriko Hidaka, Chika Sakamoto',
    'Animation, Family, Fantasy'
  ],
  [
    1417,
    "Pan's Labyrinth",
    2006,
    119,
    'Mexico, Spain, United States of America',
    'Guillermo del Toro',
    'Ivana Baquero, Sergi López',
    'Fantasy, Drama, War'
  ],
  [
    4935,
    "Howl's Moving Castle",
    2004,
    119,
    'Japan',
    'Hayao Miyazaki',
    'Chieko Baisho, Takuya Kimura',
    'Animation, Fantasy, Adventure'
  ],
  [
    244786,
    'Whiplash',
    2014,
    107,
    'United States of America',
    'Damien Chazelle',
    'Miles Teller, J. K. Simmons',
    'Drama, Music'
  ],
  [
    335984,
    'Blade Runner 2049',
    2017,
    164,
    'United States of America, Canada',
    'Denis Villeneuve',
    'Ryan Gosling, Harrison Ford, Ana de Armas',
    'Science Fiction, Drama'
  ],
  [
    27205,
    'Inception',
    2010,
    148,
    'United States of America, United Kingdom',
    'Christopher Nolan',
    'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page',
    'Action, Science Fiction, Adventure'
  ],
  [
    157336,
    'Interstellar',
    2014,
    169,
    'United States of America, United Kingdom',
    'Christopher Nolan',
    'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    'Adventure, Drama, Science Fiction'
  ],
  [
    872585,
    'Oppenheimer',
    2023,
    181,
    'United States of America, United Kingdom',
    'Christopher Nolan',
    'Cillian Murphy, Emily Blunt, Matt Damon',
    'Drama, History'
  ],
  [
    361743,
    'Top Gun: Maverick',
    2022,
    131,
    'United States of America',
    'Joseph Kosinski',
    'Tom Cruise, Miles Teller, Jennifer Connelly',
    'Action, Drama'
  ],
  [
    20,
    'Jeanne Dielman',
    1975,
    201,
    'Belgium, France',
    'Chantal Akerman',
    'Delphine Seyrig',
    'Drama',
    1
  ],
  [
    1262,
    'Cléo from 5 to 7',
    1962,
    90,
    'France, Italy',
    'Agnès Varda',
    'Corinne Marchand, Antoine Bourseiller',
    'Drama',
    1
  ],
  [
    713,
    'The Piano',
    1993,
    121,
    'New Zealand, Australia, France',
    'Jane Campion',
    'Holly Hunter, Harvey Keitel, Anna Paquin',
    'Drama, Romance, Music',
    1
  ],
  [
    11216,
    'Cinema Paradiso',
    1988,
    124,
    'Italy, France',
    'Giuseppe Tornatore',
    'Philippe Noiret, Salvatore Cascio',
    'Drama, Romance'
  ],
  [
    637,
    'Life Is Beautiful',
    1997,
    116,
    'Italy',
    'Roberto Benigni',
    'Roberto Benigni, Nicoletta Braschi',
    'Comedy, Drama, Romance'
  ],
  [
    14,
    'American Beauty',
    1999,
    122,
    'United States of America',
    'Sam Mendes',
    'Kevin Spacey, Annette Bening',
    'Drama'
  ],
  [
    185,
    'A Clockwork Orange',
    1971,
    136,
    'United Kingdom, United States of America',
    'Stanley Kubrick',
    'Malcolm McDowell, Patrick Magee',
    'Science Fiction, Crime'
  ],
  [
    62,
    '2001: A Space Odyssey',
    1968,
    149,
    'United Kingdom, United States of America',
    'Stanley Kubrick',
    'Keir Dullea, Gary Lockwood',
    'Science Fiction, Mystery, Adventure'
  ],
  [
    1858,
    'Persepolis',
    2007,
    96,
    'France, United States of America',
    'Marjane Satrapi, Vincent Paronnaud',
    'Chiara Mastroianni, Catherine Deneuve',
    'Animation, Drama, History',
    1
  ],
  [
    3782,
    'A Separation',
    2011,
    123,
    'Iran',
    'Asghar Farhadi',
    'Peyman Moaadi, Leila Hatami',
    'Drama'
  ],
  [
    1578,
    'Raging Bull',
    1980,
    129,
    'United States of America',
    'Martin Scorsese',
    'Robert De Niro, Cathy Moriarty, Joe Pesci',
    'Drama'
  ],
  [
    769,
    'GoodFellas',
    1990,
    145,
    'United States of America',
    'Martin Scorsese',
    'Ray Liotta, Robert De Niro, Joe Pesci',
    'Drama, Crime'
  ],
  [
    103,
    'Taxi Driver',
    1976,
    114,
    'United States of America',
    'Martin Scorsese',
    'Robert De Niro, Jodie Foster',
    'Crime, Drama'
  ],
  [
    370172,
    'No Time to Die',
    2021,
    163,
    'United Kingdom, United States of America',
    'Cary Joji Fukunaga',
    'Daniel Craig, Léa Seydoux, Rami Malek',
    'Action, Adventure, Thriller'
  ],
  [
    693134,
    'Dune: Part Two',
    2024,
    167,
    'United States of America, Canada',
    'Denis Villeneuve',
    'Timothée Chalamet, Zendaya, Rebecca Ferguson',
    'Science Fiction, Adventure'
  ],
  [
    933260,
    'The Substance',
    2024,
    141,
    'United Kingdom, France',
    'Coralie Fargeat',
    'Demi Moore, Margaret Qualley, Dennis Quaid',
    'Horror, Science Fiction',
    1
  ],
  [
    1064213,
    'Anora',
    2024,
    139,
    'United States of America',
    'Sean Baker',
    'Mikey Madison, Mark Eydelshteyn',
    'Comedy, Drama, Romance'
  ],
  [
    1241982,
    'Sinners',
    2025,
    137,
    'United States of America',
    'Ryan Coogler',
    'Michael B. Jordan, Hailee Steinfeld',
    'Horror, Thriller'
  ],
  [
    1084736,
    'Sirāt',
    2025,
    114,
    'Spain, France',
    'Oliver Laxe',
    'Sergi López, Bruno Núñez',
    'Drama, Thriller'
  ],
  [
    1011985,
    'The Brutalist',
    2024,
    215,
    'United States of America, United Kingdom, Hungary',
    'Brady Corbet',
    'Adrien Brody, Felicity Jones, Guy Pearce',
    'Drama'
  ],
  [
    1100099,
    'Hamnet',
    2025,
    125,
    'United Kingdom, United States of America',
    'Chloé Zhao',
    'Jessie Buckley, Paul Mescal',
    'Drama, Romance, History',
    1
  ],
  [
    10098,
    'Playtime',
    1967,
    124,
    'France',
    'Jacques Tati',
    'Jacques Tati, Barbara Dennek',
    'Comedy'
  ],
  [
    1359,
    'Black Girl',
    1966,
    65,
    'Senegal, France',
    'Ousmane Sembène',
    'Mbissine Thérèse Diop',
    'Drama'
  ],
  [
    65,
    "Cinema Dell'Arte",
    1963,
    100,
    'Italy',
    'Federico Fellini',
    'Marcello Mastroianni',
    'Drama, Fantasy'
  ],
  [11, 'Persona', 1966, 85, 'Sweden', 'Ingmar Bergman', 'Bibi Andersson, Liv Ullmann', 'Drama'],
  [
    1184,
    'Festen',
    1998,
    105,
    'Denmark, Sweden',
    'Thomas Vinterberg',
    'Ulrich Thomsen, Henning Moritzen',
    'Drama'
  ],
  [
    86838,
    'Pather Panchali',
    1955,
    125,
    'India',
    'Satyajit Ray',
    'Subir Banerjee, Kanu Banerjee',
    'Drama'
  ],
  [
    1130,
    'Y tu mamá también',
    2001,
    106,
    'Mexico',
    'Alfonso Cuarón',
    'Gael García Bernal, Diego Luna',
    'Drama, Romance, Comedy'
  ]
];

const CINEMAS = [
  ['MK2 Bibliothèque', 'Paris', 9],
  ['Le Champo', 'Paris', 8],
  ['Cinéma du Panthéon', 'Paris', 5],
  ['UGC Ciné Cité Les Halles', 'Paris', 4],
  ['Cinémathèque française', 'Paris', 6],
  ['Utopia', 'Bordeaux', 3],
  ['Lumière Terreaux', 'Lyon', 2],
  ['Le Grand Rex', 'Paris', 2]
];
const HOME = [
  ['Netflix', 6],
  ['MUBI', 8],
  ['Canal+', 3],
  ['Arte', 3],
  ['Prime Video', 2],
  ['Blu-ray', 7],
  ['Disney+', 1]
];
const WITH = ['', '', '', '', 'Alice', 'Marc', 'Alice, Marc', 'Maman', 'Inès'];

let seed = 20260101;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const weighted = (a) => {
  let r = rnd() * a.reduce((s, x) => s + x[a.length ? x.length - 1 : 0], 0);
  for (const x of a) {
    r -= x[x.length - 1];
    if (r <= 0) return x;
  }
  return a[0];
};
const stars = (v) => '*'.repeat(Math.floor(v)) + (v % 1 ? '°' : '');
const pad = (n) => String(n).padStart(2, '0');
const q = (s) => (/[",\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : s);

const seen = new Set();
const out = [];
const today = new Date('2026-11-15T00:00:00Z');
const start = new Date('2025-12-20T00:00:00Z');
const span = (today - start) / 864e5;
const dates = Array.from({ length: 168 }, () => {
  // burstier than uniform: weekends and a few "festival" weeks
  let d = Math.floor(Math.pow(rnd(), 0.9) * span);
  const dt = new Date(start.getTime() + d * 864e5);
  if (dt.getUTCDay() > 0 && dt.getUTCDay() < 5 && rnd() < 0.45)
    dt.setUTCDate(dt.getUTCDate() + (6 - dt.getUTCDay()));
  return dt > today ? today : dt;
}).sort((a, b) => a - b);

for (const dt of dates) {
  const f = pick(F);
  const [id, title, ry, rt, country, dirs, actors, genres, female] = f;
  const date = `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  const rewatch = seen.has(id);
  seen.add(id);
  const cinema = ry < 1990 ? rnd() < 0.35 : rnd() < 0.5;
  const [medium, place] = cinema
    ? ((c) => [c[0], c[1]])(weighted(CINEMAS))
    : [weighted(HOME)[0], rnd() < 0.85 ? 'Paris' : 'Lyon'];
  const rating = Math.min(
    5,
    Math.max(1, Math.round((3.4 + (rnd() + rnd() - 1) * 2.4 + (ry < 1980 ? 0.4 : 0)) * 2) / 2)
  );
  out.push(
    [
      date,
      id,
      title,
      medium,
      place,
      pick(WITH),
      rewatch ? 'X' : '',
      stars(rating),
      rnd() < 0.04 ? 'VF' : '',
      rnd() < 0.15 ? 'Magnifique.' : '',
      ry,
      dt.getUTCFullYear(),
      rt,
      country,
      dirs,
      actors,
      genres,
      female ? 'X' : ''
    ]
      .map(q)
      .join(',')
  );
}

const header =
  'date,tmdbId,title,medium,place,with,rewatch,note,VF,comment,releaseYear,year,runtime,country,directors,actors,genres,femaleDirector';
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/sample.csv'), [header, ...out].join('\n') + '\n');
console.log(`wrote data/sample.csv (${out.length} viewings of ${seen.size} films)`);
