import config from '../../config.json';

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const keywords = (config.festivalKeywords ?? ['festival']).map(norm);

/** A comment tag is a festival when it contains one of the keywords from config.json → festivalKeywords. */
export const isFestival = (tag) => {
  const t = norm(tag);
  return keywords.some((k) => t.includes(k));
};
