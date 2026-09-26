// lib/ashtottari-dasha.js — language-neutral (codes only; the UI translates)
//
// Ashtottari Dasha — the classical 108-year, 8-lord nakshatra dasha of
// Brihat Parashara Hora Shastra (BPHS). Like Yogini Dasha (see
// lib/yogini-dasha.js, whose conventions this module copies), no API used by
// this app provides it, so it is self-calculated from the natal Moon's
// sidereal longitude + the birth datetime.
//
// AKSRA principle ("assumption ko fact ki tarah pesh mat karo"): every rule
// below was checked against at least two independent sources. Where the
// sources disagree, the most standard version is implemented and a code is
// pushed into the `disputes` array of the output (never hidden).
//
// SOURCES (verified 2026-09-26):
//   1. Satyori, "Ashtottari Dasha" — lords/years (Sun 6, Moon 15, Mars 8,
//      Mercury 17, Saturn 10, Jupiter 19, Rahu 12, Venus 21 = 108) and the
//      three (disputed) applicability rules: Rahu in kendra/trikona from the
//      Lagna lord (not in Lagna); day+Krishna / night+Shukla; Lagna in a
//      Rahu nakshatra. https://satyori.com/jyotish/dasha/ashtottari/
//   2. teistro-sdk PR #168 (open-source jyotish engine) — counting "from
//      Ardra in groups of four and three over the twenty-eight nakshatras",
//      Abhijit = 276°40' .. 280°53'20", balance = Moon's time across its
//      own group segment. https://github.com/teispace/teistro-sdk/pull/168
//   3. astrosutras.in, "Ashtottari Dasha System in BPHS" (search listing) —
//      same lords/years and the same applicability rules; mentions the
//      Krittikadi vs Ardradi starting variants.
//      https://astrosutras.in/index.php/2025/03/04/ashtottari-dasha-system-in-brihat-parashara-hora-shastra-bphs/
//   Groups of 4-3-4-3... from Ardra with Abhijit inside Saturn's group are
//   the standard (Ardradi) BPHS reading; variants are listed in `disputes`.
'use strict';

const { SIGN_LORDS, houseFromReference } = require('./astro-engine');

const NAK_SPAN = 360 / 27; // 13°20'
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365.25; // same convention as yogini-dasha.js / Sade Sati estimate

// Dasha order + years (BPHS). Total = 108.
const LORDS = [
  { lord: 'Sun', years: 6 },
  { lord: 'Moon', years: 15 },
  { lord: 'Mars', years: 8 },
  { lord: 'Mercury', years: 17 },
  { lord: 'Saturn', years: 10 },
  { lord: 'Jupiter', years: 19 },
  { lord: 'Rahu', years: 12 },
  { lord: 'Venus', years: 21 },
];
const TOTAL_YEARS = LORDS.reduce((s, l) => s + l.years, 0); // 108

// 28-nakshatra wheel (27 + Abhijit), counted from Ardra, alternately in
// groups of 4 and 3 for the 8 lords in dasha order.
//   Sun     : Ardra, Punarvasu, Pushya, Ashlesha
//   Moon    : Magha, Purva Phalguni, Uttara Phalguni
//   Mars    : Hasta, Chitra, Swati, Vishakha
//   Mercury : Anuradha, Jyeshtha, Mula
//   Saturn  : Purva Ashadha, Uttara Ashadha, Abhijit, Shravana
//   Jupiter : Dhanishta, Shatabhisha, Purva Bhadrapada
//   Rahu    : Uttara Bhadrapada, Revati, Ashwini, Bharani
//   Venus   : Krittika, Rohini, Mrigashira
const NAK_CODES = [
  'ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra', 'punarvasu',
  'pushya', 'ashlesha', 'magha', 'purva_phalguni', 'uttara_phalguni', 'hasta',
  'chitra', 'swati', 'vishakha', 'anuradha', 'jyeshtha', 'mula', 'purva_ashadha',
  'uttara_ashadha', 'shravana', 'dhanishta', 'shatabhisha', 'purva_bhadrapada',
  'uttara_bhadrapada', 'revati',
];
const GROUP_SIZES = [4, 3, 4, 3, 4, 3, 4, 3];

// Abhijit's span (standard convention): the last pada (quarter) of Uttara
// Ashadha + the first 1/15 of Shravana = 276°40' .. 280°53'20" (4°13'20").
const ABHIJIT_START = 20 * NAK_SPAN + 0.75 * NAK_SPAN; // 276.6667
const ABHIJIT_END = 21 * NAK_SPAN + NAK_SPAN / 15; // 280.8889

/**
 * Builds the 28 wheel segments (in order from Ardra) with their sidereal
 * longitude span and ruling Ashtottari lord. Uttara Ashadha is shortened at
 * its end and Shravana at its start to make room for Abhijit.
 */
function buildWheel() {
  const segs = [];
  for (let k = 0; k < 27; k++) {
    const i = (5 + k) % 27; // start from Ardra (index 5)
    let start = i * NAK_SPAN;
    let end = (i + 1) * NAK_SPAN;
    if (i === 20) end = ABHIJIT_START;
    if (i === 21) start = ABHIJIT_END;
    segs.push({ code: NAK_CODES[i], start, end });
    if (i === 20) segs.push({ code: 'abhijit', start: ABHIJIT_START, end: ABHIJIT_END });
  }
  let p = 0;
  GROUP_SIZES.forEach((n, g) => {
    for (let k = 0; k < n; k++) {
      segs[p].lordIndex = g;
      segs[p].posInGroup = k;
      segs[p].groupSize = n;
      p++;
    }
  });
  return segs; // length 28
}
const WHEEL = buildWheel();

function norm360(x) {
  return ((x % 360) + 360) % 360;
}

function arcLen(s) {
  return norm360(s.end - s.start) || 360;
}

/**
 * Locate the Moon on the 28-wheel and compute the fraction of its lord's
 * first (birth) mahadasha that has already elapsed at birth.
 *
 * Method (standard Ardradi 4/3 reading): the lord's years are shared EQUALLY among
 * the nakshatras of its group (e.g. Sun: 6/4 = 1.5 years per nakshatra);
 * elapsed = (whole nakshatras of the group already passed + fraction of the
 * current nakshatra traversed) * share. For groups without Abhijit this is
 * identical to "fraction of the group's arc traversed" because all spans
 * are equal; only the Saturn group (with the short Abhijit segment) differs.
 */
function locateMoon(moonLon) {
  const lon = norm360(moonLon);
  const seg = WHEEL.find((s) => {
    const d = norm360(lon - s.start);
    return d < arcLen(s);
  });
  const within = norm360(lon - seg.start) / arcLen(seg);
  const elapsedFraction = (seg.posInGroup + within) / seg.groupSize;
  return { seg, withinFraction: within, elapsedFraction };
}

function addYears(date, years) {
  return new Date(date.getTime() + years * DAYS_PER_YEAR * MS_PER_DAY);
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function round4(x) {
  return Math.round(x * 10000) / 10000;
}

/**
 * Applicability (shown to everyone, never used to hide the dasha).
 *  - rahuRule: Rahu in a kendra (1,4,7,10) or trikona (1,5,9) counted from
 *    the Lagna lord's sign, provided Rahu is NOT in the Lagna itself.
 *  - pakshaRule: day birth in Krishna paksha OR night birth in Shukla paksha.
 *    isDayBirth: the Sun is above the horizon when its sidereal longitude
 *    lies in the half of the ecliptic running from the Descendant back to
 *    the Ascendant — i.e. (Asc − Sun) mod 360 in (0°,180°). This is the
 *    degree-exact form of "Sun in houses 7-12 from Lagna" (whole-sign
 *    houses 7-12 = above horizon); it ignores refraction/the solar disc, so
 *    a Sun within ~1° of the horizon is flagged `nearHorizon`.
 */
function computeApplicability(natal) {
  const p = natal.planets || {};
  const out = {
    lagnaLord: null,
    rahuFromLagnaLord: null,
    rahuInLagna: null,
    rahuRuleMet: null,
    pakshaRule: { paksha: null, isDayBirth: null, sunHouseFromLagna: null, nearHorizon: null, met: null },
  };
  const ascId = natal.ascendantRasiId;
  if (typeof ascId === 'number') {
    const lagnaLord = SIGN_LORDS[ascId];
    out.lagnaLord = lagnaLord;
    const ll = p[lagnaLord];
    if (p.Rahu && typeof p.Rahu.rasiId === 'number' && ll && typeof ll.rasiId === 'number') {
      const h = houseFromReference(p.Rahu.rasiId, ll.rasiId);
      out.rahuFromLagnaLord = h;
      out.rahuInLagna = p.Rahu.rasiId === ascId;
      out.rahuRuleMet = [1, 4, 5, 7, 9, 10].includes(h) && !out.rahuInLagna;
    }
  }
  if (p.Sun && p.Moon && typeof p.Sun.rasiId === 'number' && typeof p.Moon.rasiId === 'number') {
    const sunLon = p.Sun.rasiId * 30 + (p.Sun.degree || 0);
    const moonLon = p.Moon.rasiId * 30 + (p.Moon.degree || 0);
    const elong = norm360(moonLon - sunLon);
    out.pakshaRule.paksha = elong < 180 ? 'shukla' : 'krishna';
    if (typeof ascId === 'number') {
      out.pakshaRule.sunHouseFromLagna = houseFromReference(p.Sun.rasiId, ascId);
      if (typeof natal.ascendantDegree === 'number') {
        const ascLon = ascId * 30 + natal.ascendantDegree;
        const d = norm360(ascLon - sunLon); // 0..180 => above horizon
        out.pakshaRule.isDayBirth = d > 0 && d < 180;
        out.pakshaRule.nearHorizon = d < 1 || d > 359 || Math.abs(d - 180) < 1;
      } else {
        // Fallback: whole-sign houses 7-12 from Lagna = above horizon.
        out.pakshaRule.isDayBirth = out.pakshaRule.sunHouseFromLagna >= 7;
      }
      const isDay = out.pakshaRule.isDayBirth;
      out.pakshaRule.met = (isDay && out.pakshaRule.paksha === 'krishna') || (!isDay && out.pakshaRule.paksha === 'shukla');
    }
  }
  return out;
}

/**
 * buildAshtottariDasha(natal, birthDate, now)
 *  natal: { ascendantRasiId, ascendantDegree, moonRasiId, planets:{Sun:{rasiId,degree},...} }
 *         (the full ZAICHA data object with a `.natal` field is also accepted)
 *  birthDate / now: JS Date objects.
 */
function buildAshtottariDasha(natal, birthDate, now = new Date()) {
  if (natal && natal.natal && natal.natal.planets) natal = natal.natal;
  const moon = natal && natal.planets && natal.planets.Moon;
  if (!moon || typeof moon.rasiId !== 'number' || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return null;
  }
  const target = now instanceof Date && !isNaN(now.getTime()) ? now : new Date();

  const moonLon = norm360(moon.rasiId * 30 + (moon.degree || 0));
  const { seg, withinFraction, elapsedFraction } = locateMoon(moonLon);
  const startLordIdx = seg.lordIndex;

  // Build mahadashas until at least 120 years after birth are covered.
  const horizon = addYears(birthDate, 120);
  const mahadashas = [];
  let cursor = new Date(birthDate.getTime());
  for (let i = 0; cursor < horizon; i++) {
    const idx = (startLordIdx + i) % 8;
    const L = LORDS[idx];
    const years = i === 0 ? L.years * (1 - elapsedFraction) : L.years;
    const start = new Date(cursor.getTime());
    const end = addYears(start, years);

    // Antardashas over the FULL mahadasha length (yogini-dasha.js fix):
    // the first mahadasha starts virtually before birth; sub-periods that
    // ended before birth are dropped, the one running at birth is clipped.
    const virtualStart = i === 0 ? addYears(start, -(L.years * elapsedFraction)) : start;
    let aCursor = new Date(virtualStart.getTime());
    const antardashas = [];
    for (let j = 0; j < 8; j++) {
      const aL = LORDS[(idx + j) % 8];
      const aYears = L.years * (aL.years / TOTAL_YEARS);
      const aStartFull = new Date(aCursor.getTime());
      const aEnd = addYears(aStartFull, aYears);
      aCursor = aEnd;
      if (aEnd <= start) continue;
      const aStart = aStartFull < start ? new Date(start.getTime()) : aStartFull;
      antardashas.push({
        lord: aL.lord,
        startISO: fmt(aStart),
        endISO: fmt(aEnd),
        isCurrent: target >= aStart && target < aEnd,
        _s: aStart.getTime(),
        _e: aEnd.getTime(),
      });
    }

    mahadashas.push({
      lord: L.lord,
      startISO: fmt(start),
      endISO: fmt(end),
      years: round4(years),
      fullYears: L.years,
      isBalance: i === 0,
      isCurrent: target >= start && target < end,
      antardashas,
      _s: start.getTime(),
      _e: end.getTime(),
      _vs: virtualStart.getTime(),
    });
    cursor = end;
  }

  const curM = mahadashas.find((m) => m.isCurrent) || null;
  const curA = curM ? curM.antardashas.find((a) => a.isCurrent) || null : null;

  // Strip internal ms fields from the public output but keep them available
  // on a non-enumerable property for tests.
  const precise = mahadashas.map((m) => ({
    lord: m.lord, start: m._s, end: m._e, virtualStart: m._vs,
    antardashas: m.antardashas.map((a) => ({ lord: a.lord, start: a._s, end: a._e })),
  }));
  mahadashas.forEach((m) => {
    delete m._s; delete m._e; delete m._vs;
    m.antardashas.forEach((a) => { delete a._s; delete a._e; });
  });

  const disputes = ['START_KRITTIKADI_VARIANT', 'GROUPING_THREE_EACH_VARIANT', 'APPLICABILITY_RULES_DISPUTED', 'BALANCE_EQUAL_SHARE_PER_NAKSHATRA'];
  if (seg.lordIndex === 4) disputes.push('MOON_IN_SATURN_GROUP_ABHIJIT_CONVENTION_AFFECTS_BALANCE');

  const result = {
    system: 'ashtottari',
    totalYears: TOTAL_YEARS,
    isEstimate: true,
    moon: {
      longitude: round4(moonLon),
      nakshatra: seg.code,
      groupLord: LORDS[seg.lordIndex].lord,
      positionInGroup: seg.posInGroup + 1,
      groupSize: seg.groupSize,
      traversedInNakshatra: round4(withinFraction),
      elapsedFractionOfFirstDasha: round4(elapsedFraction),
      balanceYears: round4(LORDS[seg.lordIndex].years * (1 - elapsedFraction)),
    },
    mahadashas,
    current: {
      mahadasha: curM ? { lord: curM.lord, startISO: curM.startISO, endISO: curM.endISO, years: curM.years } : null,
      antardasha: curA ? { lord: curA.lord, startISO: curA.startISO, endISO: curA.endISO } : null,
    },
    applicability: computeApplicability(natal),
    disputes,
    sources: SOURCES,
  };
  Object.defineProperty(result, '_precise', { value: precise, enumerable: false });
  return result;
}

const SOURCES = [
  { title: 'Satyori — Ashtottari Dasha', url: 'https://satyori.com/jyotish/dasha/ashtottari/' },
  { title: 'teistro-sdk PR #168 — 28-nakshatra Ashtottari wheel', url: 'https://github.com/teispace/teistro-sdk/pull/168' },
  { title: 'astrosutras.in — Ashtottari Dasha in BPHS', url: 'https://astrosutras.in/index.php/2025/03/04/ashtottari-dasha-system-in-brihat-parashara-hora-shastra-bphs/' },
];

module.exports = { buildAshtottariDasha, LORDS, TOTAL_YEARS, WHEEL, locateMoon, computeApplicability };
