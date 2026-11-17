// SVG text scales with its viewBox, so the same `font-size` would render at a different size in every chart.
// Each chart measures its own scale `k` (rendered px per viewBox unit) and sets `font-size={LABEL / k}`,
// so labels come out at the same size in real pixels everywhere.
export const LABEL = 12; // axis labels, counts, month and weekday names
export const NUMERAL = 20; // the big percentage in the donuts
