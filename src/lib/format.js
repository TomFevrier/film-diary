import { formatLocale } from 'd3-format';
import { timeFormatLocale } from 'd3-time-format';

const NUM = {
  en: { decimal: '.', thousands: ',', grouping: [3], currency: ['$', ''] },
  fr: { decimal: ',', thousands: ' ', grouping: [3], currency: ['', ' €'] }
};
const TIME = {
  en: {
    dateTime: '%x, %X',
    date: '%-m/%-d/%Y',
    time: '%-I:%M:%S %p',
    periods: ['AM', 'PM'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    shortDays: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'],
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ],
    shortMonths: [
      'Jan.',
      'Feb.',
      'Mar.',
      'Apr.',
      'May',
      'Jun.',
      'Jul.',
      'Aug.',
      'Sep.',
      'Oct.',
      'Nov.',
      'Dec.'
    ]
  },
  fr: {
    dateTime: '%A %e %B %Y à %X',
    date: '%d/%m/%Y',
    time: '%H:%M:%S',
    periods: ['AM', 'PM'],
    days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    shortDays: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
    months: [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre'
    ],
    shortMonths: [
      'janv.',
      'févr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'août',
      'sept.',
      'oct.',
      'nov.',
      'déc.'
    ]
  }
};

const cache = {};
/** All number / date / duration formatters for a language, built with d3-format and d3-time-format. */
export function makeFormats(lang) {
  if (cache[lang]) return cache[lang];
  const nf = formatLocale(NUM[lang]);
  const tf = timeFormatLocale(TIME[lang]);
  const int = nf.format(',d');
  const dec1 = nf.format(',.1f');
  const dec2 = nf.format(',.2f');
  const pct = nf.format('.0%');
  const fullDate = tf.format(lang === 'fr' ? '%A %-d %B %Y' : '%A, %B %-d, %Y');
  const m = (min) => String(Math.round(min % 60)).padStart(2, '0');
  const stars = (r) => (r == null ? '–' : `${dec1(r).replace(/[.,]0$/, '')} / 5`); // plain-text fallback (aria labels); the UI draws <Stars>
  /**
   * Long totals for the "Time spent" tile: days rounded up ("117 days"), or hours rounded up below 72 hours
   * ("58 hours"). French: "117 jours" / "58 heures".
   */
  const totalSpan = (min) => {
    if (min < 72 * 60) {
      const h = Math.ceil(min / 60);
      if (lang === 'fr') return `${int(h)} ${h <= 1 ? 'heure' : 'heures'}`;
      return `${int(h)} ${h === 1 ? 'hour' : 'hours'}`;
    }
    return `${int(Math.ceil(min / 1440))} ${lang === 'fr' ? 'jours' : 'days'}`;
  };
  return (cache[lang] = {
    int,
    dec1,
    dec2,
    pct,
    date: tf.format(lang === 'fr' ? '%-d %B %Y' : '%B %-d, %Y'),
    fullDate,
    dayMonth: tf.format(lang === 'fr' ? '%-d %b' : '%b %-d'),
    month: tf.format('%B'),
    monthShort: tf.format('%b'),
    weekdayShort: tf.format('%a'),
    weekday: tf.format('%A'),
    parseDay: tf.parse('%Y-%m-%d'),
    /** minutes → "142 h 05" / "142h 05m" */
    duration: (min) => {
      const h = Math.floor(min / 60);
      return lang === 'fr' ? `${int(h)} h ${m(min)}` : `${int(h)}h ${m(min)}m`;
    },
    totalSpan,
    /** like duration, but whole hours (rounded up) from 48 hours on */
    span: (min) =>
      min >= 48 * 60
        ? `${int(Math.ceil(min / 60))} h`
        : lang === 'fr'
          ? `${int(Math.floor(min / 60))} h ${m(min)}`
          : `${int(Math.floor(min / 60))}h ${m(min)}m`,
    initial: (d) => tf.format('%a')(d).charAt(0).toUpperCase(),
    hours: (min) => `${int(Math.ceil(min / 60))} h`,
    stars,
    rating: (r) => (r == null ? '–' : dec1(r).replace(/[.,]0$/, ''))
  });
}
