import test from 'node:test';
import assert from 'node:assert/strict';
import { makeFormats } from '../src/lib/format.js';

const H = 60; // minutes in an hour
const D = 24 * H;

test('totalSpan: days rounded up, hours below 72 hours', () => {
  const en = makeFormats('en');
  assert.equal(en.totalSpan(116 * D + 8 * H), '117 days'); // not "116 days 8h"
  assert.equal(en.totalSpan(116 * D), '116 days'); // an exact number of days is not rounded up
  assert.equal(en.totalSpan(116 * D + 1), '117 days'); // one minute over rounds up
  assert.equal(en.totalSpan(72 * H), '3 days'); // 72 hours is the first value shown in days
  assert.equal(en.totalSpan(72 * H + 1), '4 days');
  assert.equal(en.totalSpan(71 * H + 59), '72 hours'); // under 72 hours: hours, rounded up
  assert.equal(en.totalSpan(58 * H + 20), '59 hours');
  assert.equal(en.totalSpan(H), '1 hour');
  assert.equal(en.totalSpan(0), '0 hours');
  assert.equal(en.totalSpan(1000 * D), '1,000 days'); // thousands separator
});

test('totalSpan in French', () => {
  const fr = makeFormats('fr');
  assert.equal(fr.totalSpan(116 * D + 8 * H), '117 jours');
  assert.equal(fr.totalSpan(58 * H), '58 heures');
  assert.equal(fr.totalSpan(H), '1 heure');
  assert.equal(fr.totalSpan(0), '0 heure');
});
