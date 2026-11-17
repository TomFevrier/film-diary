import { interpolateRgbBasis } from 'd3-interpolate';

// navy → burgundy → firebrick → amber → gold : one ramp used for ratings, heatmap and ranks
export const ramp = interpolateRgbBasis(['#2c3d86', '#7a2f5c', '#b22222', '#d9822a', '#eab62f']);
/** 0.5–5 stars → colour */
export const ratingColor = (r) => ramp(Math.max(0, Math.min(1, ((r ?? 3) - 0.5) / 4.5)));
export const GOLD = '#eab62f';
export const RED = '#b22222';
export const NAVY = '#3a4fa3';
