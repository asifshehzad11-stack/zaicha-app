/**
 * transit-windows.js — when did each planet enter its current sidereal sign, and when will it leave?
 *
 * Used for the "duration of this phase" line in the transit / daily detail popups.
 * Everything is computed offline with astronomy-engine (MIT, VSOP87/ELP based, arc-second level),
 * so it costs no engine (VedAstro) calls.
 *
 * Accuracy notes (shown to nobody, kept here for the record):
 *  - Sidereal = tropical longitude of date minus the ayanamsa. Lahiri is modelled as
 *    23.85306° at J2000 + 50.2788"/year; Raman and KP are fixed offsets from Lahiri.
 *    Good to roughly a minute of arc for these decades, i.e. minutes of time for the Moon,
 *    hours for the Sun and inner planets, a day or so for the slow planets.
 *  - Rahu/Ketu use the MEAN node (Meeus 47.7). The true node wobbles around it by up to ~1.7°,
 *    so node dates can differ from a true-node chart by some weeks; the popup calls them "about".
 *  - A planet that turns retrograde can leave and re-enter a sign; "end" is the first exit.
 */
'use strict';

const Astronomy = require('astronomy-engine');

const BODIES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const DAY = 86400000;
const STEP = { Moon: DAY / 12, Sun: DAY, Mercury: DAY / 2, Venus: DAY, Mars: DAY, Jupiter: 3 * DAY, Saturn: 3 * DAY, Rahu: 3 * DAY, Ketu: 3 * DAY };
const RANGE = { Moon: 4 * DAY, Sun: 40 * DAY, Mercury: 160 * DAY, Venus: 200 * DAY, Mars: 300 * DAY, Jupiter: 600 * DAY, Saturn: 1400 * DAY, Rahu: 700 * DAY, Ketu: 700 * DAY };
const PRECISION = { Moon: 60000, default: 30 * 60000 };   // 1 minute for the Moon, 30 minutes for the rest

function norm(x) { return ((x % 360) + 360) % 360; }

function lahiri(date) {
  const years = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * DAY);
  return 23.85306 + years * (50.2788 / 3600);
}
const AYANAMSA_OFFSET = { 1: 0, 3: -1.4336, 5: -0.0966 };   // Lahiri, Raman, KP (degrees, relative to Lahiri)

function tropicalLongitude(body, date) {
  if (body === 'Rahu' || body === 'Ketu') {
    const T = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / (36525 * DAY);
    const node = norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000);
    return body === 'Rahu' ? node : norm(node + 180);
  }
  if (body === 'Moon') return norm(Astronomy.EclipticGeoMoon(date).lon);
  if (body === 'Sun') return norm(Astronomy.SunPosition(date).elon);
  const vec = Astronomy.GeoVector(Astronomy.Body[body], date, true);
  return norm(Astronomy.Ecliptic(vec).elon);
}

function siderealSign(body, date, ayanamsa) {
  const off = AYANAMSA_OFFSET[ayanamsa] != null ? AYANAMSA_OFFSET[ayanamsa] : 0;
  const lon = norm(tropicalLongitude(body, date) - (lahiri(date) + off));
  return Math.floor(lon / 30);
}

// Walk from t0 in steps of dir*step until the sign differs from `sign`; then bisect the boundary.
function findBoundary(body, t0, sign, dir, ayanamsa) {
  const step = STEP[body], limit = RANGE[body], prec = PRECISION[body] || PRECISION.default;
  let a = t0, b = null;
  for (let t = t0 + dir * step; Math.abs(t - t0) <= limit; t += dir * step) {
    if (siderealSign(body, new Date(t), ayanamsa) !== sign) { b = t; break; }
    a = t;
  }
  if (b == null) return null;
  // a: still in sign, b: outside. Bisect.
  while (Math.abs(b - a) > prec) {
    const m = (a + b) / 2;
    if (siderealSign(body, new Date(m), ayanamsa) === sign) a = m; else b = m;
  }
  return dir > 0 ? b : a;   // exit time going forward, entry time going backward
}

const cache = new Map();   // key: ayanamsa|hour -> result (same for every visitor)

/**
 * @param {Date} [now]
 * @param {number} [ayanamsa] 1 Lahiri (default), 3 Raman, 5 KP
 * @returns {{[planet:string]: {sign:number, start:string|null, end:string|null}}}
 */
function transitWindows(now, ayanamsa) {
  now = now || new Date();
  ayanamsa = Number(ayanamsa) || 1;
  const key = ayanamsa + '|' + Math.floor(now.getTime() / 3600000);
  if (cache.has(key)) return cache.get(key);
  const t0 = now.getTime();
  const out = {};
  for (const body of BODIES) {
    try {
      const sign = siderealSign(body, now, ayanamsa);
      const start = findBoundary(body, t0, sign, -1, ayanamsa);
      const end = findBoundary(body, t0, sign, +1, ayanamsa);
      out[body] = { sign, start: start ? new Date(start).toISOString() : null, end: end ? new Date(end).toISOString() : null };
    } catch (e) {
      out[body] = null;
    }
  }
  if (cache.size > 200) cache.clear();
  cache.set(key, out);
  return out;
}

module.exports = { transitWindows, siderealSign };
