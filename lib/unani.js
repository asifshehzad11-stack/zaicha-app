// lib/unani.js — "Unani / Greco-Arabic (Ilm-e-Nujoom)" calculations.
//
// WHAT THIS IS
//   The Hellenistic -> Persian -> Arabic ("Unani", i.e. Greek-derived)
//   tradition of astrology as systematised in the Islamic world. The classic
//   Islamic reference is Al-Biruni, "The Book of Instruction in the Elements
//   of the Art of Astrology" (Ghazna, 1029 CE; tr. R. Ramsay Wright, 1934).
//   That tradition uses the TROPICAL zodiac, so every position here is the
//   app's sidereal (Lahiri) position converted back to tropical with the
//   existing western-chart.js helpers (linear-approximation ayanamsa, +/- 1-2
//   arcmin -> `ayanamsaIsEstimate: true`). Houses are WHOLE-SIGN from the
//   tropical Ascendant (the Hellenistic default, and consistent with
//   western-chart.js).
//
//   Output is language-neutral: only codes and numbers. The UI translates.
//
// AKSRA — every table was checked against at least two independent sources
// before use (see SOURCES below; the same list is returned in `sources`).
//   1. Domicile rulers, detriments   -> Sira Uysal dignities table; Wikipedia
//      "Essential dignity"; Wikipedia "Decan (astrology)" (Lilly table).
//   2. Exaltations + degrees (Sun 19 Ari, Moon 3 Tau, Mercury 15 Vir,
//      Jupiter 15 Can, Venus 27 Pis, Saturn 21 Lib, Mars 28 Cap), falls
//      -> Sira Uysal table; Wikipedia "Essential dignity"; Wikipedia
//      "Exaltation (astrology)".
//   3. Dorothean triplicity lords (Fire Sun/Jupiter/Saturn, Earth
//      Venus/Moon/Mars, Air Saturn/Mercury/Jupiter, Water Venus/Mars/Moon)
//      -> Wikipedia "Triplicity"; Peter Stockinger "Tables of Essential
//      Dignities"; Sira Uysal table.
//   4. Egyptian terms (bounds), all 12 signs -> Sira Uysal table; Seven
//      Stars Astrology "The Bounds: Tables and Origins" (+ see SOURCES).
//   5. Chaldean faces (Mars at 0 Aries, Chaldean order) -> Wikipedia
//      "Decan (astrology)" (Lilly's "Faces of the Planets"); Sira Uysal table.
//   6. Firdaria (Abu Ma'shar sequences, years, 7 equal Chaldean sub-periods)
//      -> see SOURCES (Augurine, 100percentastrology, Birchfield "Fardarat").
//   7. Lots of Fortune/Spirit with sect reversal -> Wikipedia "Arabic parts";
//      astrolium.com Hellenistic guide (already used by arabian-parts.js).
//   8. Planetary hours (Chaldean order, unequal hours from sunrise, first
//      hour = day ruler) -> Wikipedia "Planetary hours" + see SOURCES.
//   9. Sunrise/sunset -> NOAA Solar Calculator equations (Meeus,
//      "Astronomical Algorithms"), zenith 90.833 deg (refraction + solar
//      semi-diameter).
//  10. Point scores (5/4/3/2/1, -5/-4) -> AstroConnexions "Essential
//      Dignities and Debilities"; Wikipedia "Essential dignity".
//  (Final per-table source list is in SOURCES; see that array.)
//
// CHOICES WHERE TRADITIONS DISAGREE (the chosen option is the most standard
// in the Hellenistic/Arabic line; the variant is emitted in `disputes`):
//   - Triplicities: Dorothean (as in Al-Biruni and the Arabic authors), NOT
//     Ptolemy's / Lilly's (Water = Mars only). -> 'triplicity_ptolemy_lilly_variant'
//   - Triplicity DIGNITY of a planet (+3) is given only to the triplicity lord
//     OF THE SECT (day lord by day, night lord by night), as in Lilly-style
//     point scoring; Hellenistic practice lets all three lords "share".
//     -> 'triplicity_all_three_lords'
//   - Terms: Egyptian (Al-Biruni, Dorotheus, Valens), NOT Ptolemaic (which
//     Lilly used). -> 'terms_ptolemaic_variant'
//   - Faces: Chaldean (Mars first). No real dispute in this tradition; the
//     Indian drekkana (triplicity-based) is a different system.
//   - Lots: sect-reversed (Hellenistic/Arabic). Ptolemy and Lilly used the
//     day formula for all charts. -> 'lot_fortune_no_reversal_ptolemy_lilly'
//   - Firdaria: Abu Ma'shar's nocturnal order (nodes at the END). Bonatti
//     put the nodes after Mars in night charts.
//     -> 'firdaria_nodes_nocturnal_bonatti' (night charts only)
//     Nodal firdars carry no sub-periods here; some modern authors subdivide
//     them. -> 'firdaria_nodes_subperiods'
//     After 75 years some authors restart the cycle; we stop at 75
//     (current = null). -> 'firdaria_after_75_restart' (only when relevant)
//   - Almuten of the Ascendant: domicile 5, exaltation (sign) 4, triplicity
//     lord OF THE SECT 3, term 2, face 1. Variant: all three triplicity lords
//     get 3. -> 'almuten_triplicity_all_three'
//   - Mercury's sect: diurnal when oriental (rising before the Sun, i.e. at a
//     lower longitude), nocturnal when occidental. -> 'mercury_sect_by_phase'
//   - Sect: Sun above the ecliptic horizon (Asc-Desc axis, degree based).
//     arabian-parts.js uses the whole-sign house of the Sun (houses 7-12); if
//     the two disagree for this chart -> 'sect_wholesign_differs'. If the
//     Sun's true altitude disagrees (birth within minutes of sunrise/sunset)
//     -> 'sect_near_horizon'.
//   - Peregrine planets get no -5 penalty in `score` (Lilly gives one).
//     -> 'score_peregrine_penalty_omitted'
//   - Firdaria / profection dates use 365.25-day years (codebase convention,
//     as yogini-dasha.js) -> firdaria.isEstimate = true.
//
// LIMITATIONS
//   - Ayanamsa is a linear approximation (see western-chart.js), so a planet
//     within ~2 arcmin of a sign/term/face boundary could be misplaced.
//   - Sunrise/sunset: NOAA algorithm, ~1 min accuracy between +/-72 deg lat;
//     no altitude/terrain correction. Polar day/night -> hourRuler & dayRuler null.
//   - Nodes come from the app's own node type (mean/true) — not recomputed.
'use strict';

const { ayanamsaValueForDate, tropicalLongitude } = require('./western-chart');

// ---------------------------------------------------------------------------
// SOURCES (returned verbatim in the output `sources` array)
// ---------------------------------------------------------------------------
const SOURCES = [
  { title: 'Al-Biruni, The Book of Instruction in the Elements of the Art of Astrology (1029), tr. R. Ramsay Wright (1934) — Skyscript facsimile', url: 'https://www.skyscript.co.uk/albiruni_elements.html' },
  { title: 'Sira Uysal — Essential and Accidental Dignities Table (Egyptian terms, Dorothean triplicities)', url: 'https://sirauysal.com/en/dignities' },
  { title: 'Wikipedia — Essential dignity', url: 'https://en.wikipedia.org/wiki/Essential_dignity' },
  { title: 'Wikipedia — Triplicity', url: 'https://en.wikipedia.org/wiki/Triplicity' },
  { title: 'Wikipedia — Decan (astrology) (Lilly, "The Faces of the Planets")', url: 'https://en.wikipedia.org/wiki/Decan_(astrology)' },
  { title: 'Peter Stockinger — A look at Tables of Essential Dignities and Debilities', url: 'https://starsandstones.wordpress.com/2013/11/16/tables-of-essential-dignities-and-debilities/' },
  { title: 'AstroConnexions — Essential Dignities and Debilities (point values)', url: 'https://astroconnexions.com/knowledgebase/essential-dignities-and-debilities/' },
  { title: 'Seven Stars Astrology — The Bounds: Tables and Origins', url: 'https://sevenstarsastrology.com/bounds-tables-origin/' },
  { title: 'Wikipedia — Arabic parts', url: 'https://en.wikipedia.org/wiki/Arabic_parts' },
  { title: 'Astrolium — Hellenistic astrology guide (Lots, sect)', url: 'https://astrolium.com/guides/hellenistic-astrology' },
  { title: 'Augurine — Firdaria: Guide to Planetary Periods and Sub-Periods', url: 'https://www.augurine.com/learn/firdaria' },
  { title: '100 Percent Astrology — The Nocturnal Firdaria Sequence: Bonatti vs Abu Mashar', url: 'https://100percentastrology.com/nocturnal-firdaria-sequence-bonatti/' },
  { title: 'Wikipedia — Planetary hours', url: 'https://en.wikipedia.org/wiki/Planetary_hours' },
  { title: 'NOAA Global Monitoring Laboratory — Solar Calculator / calculation details (Meeus)', url: 'https://gml.noaa.gov/grad/solcalc/calcdetails.html' },
];

// ---------------------------------------------------------------------------
// TABLES (signId 0 = Aries ... 11 = Pisces, tropical)
// ---------------------------------------------------------------------------
const CLASSICAL = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

/** Chaldean order (slowest -> fastest). Used for faces, planetary hours and
 * firdaria sub-periods. */
const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

/** Domicile (house) rulers. */
const DOMICILE = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

/** Exaltations: planet -> { signId, degree }. The exaltation "degree" is
 * informational; dignity is counted for the whole sign. */
const EXALTATION = {
  Sun: { signId: 0, degree: 19 },      // Aries 19
  Moon: { signId: 1, degree: 3 },      // Taurus 3
  Mercury: { signId: 5, degree: 15 },  // Virgo 15
  Jupiter: { signId: 3, degree: 15 },  // Cancer 15
  Venus: { signId: 11, degree: 27 },   // Pisces 27
  Saturn: { signId: 6, degree: 21 },   // Libra 21
  Mars: { signId: 9, degree: 28 },     // Capricorn 28
};
/** signId -> exalted planet (or null). Derived from EXALTATION. */
const EXALTATION_RULER = Array.from({ length: 12 }, (_, s) =>
  Object.keys(EXALTATION).find((p) => EXALTATION[p].signId === s) || null);

/** Dorothean triplicity lords by element (0 fire, 1 earth, 2 air, 3 water;
 * element of a sign = signId % 4). */
const TRIPLICITY = [
  { day: 'Sun', night: 'Jupiter', participating: 'Saturn' },   // Fire
  { day: 'Venus', night: 'Moon', participating: 'Mars' },      // Earth
  { day: 'Saturn', night: 'Mercury', participating: 'Jupiter' }, // Air
  { day: 'Venus', night: 'Mars', participating: 'Moon' },      // Water
];

/** Egyptian terms (bounds): per sign, [planet, endDegree(exclusive)]. */
const EGYPTIAN_TERMS = [
  [['Jupiter', 6], ['Venus', 12], ['Mercury', 20], ['Mars', 25], ['Saturn', 30]],  // Aries
  [['Venus', 8], ['Mercury', 14], ['Jupiter', 22], ['Saturn', 27], ['Mars', 30]],  // Taurus
  [['Mercury', 6], ['Jupiter', 12], ['Venus', 17], ['Mars', 24], ['Saturn', 30]],  // Gemini
  [['Mars', 7], ['Venus', 13], ['Mercury', 19], ['Jupiter', 26], ['Saturn', 30]],  // Cancer
  [['Jupiter', 6], ['Venus', 11], ['Saturn', 18], ['Mercury', 24], ['Mars', 30]],  // Leo
  [['Mercury', 7], ['Venus', 17], ['Jupiter', 21], ['Mars', 28], ['Saturn', 30]],  // Virgo
  [['Saturn', 6], ['Mercury', 14], ['Jupiter', 21], ['Venus', 28], ['Mars', 30]],  // Libra
  [['Mars', 7], ['Venus', 11], ['Mercury', 19], ['Jupiter', 24], ['Saturn', 30]],  // Scorpio
  [['Jupiter', 12], ['Venus', 17], ['Mercury', 21], ['Saturn', 26], ['Mars', 30]], // Sagittarius
  [['Mercury', 7], ['Jupiter', 14], ['Venus', 22], ['Saturn', 26], ['Mars', 30]],  // Capricorn
  [['Mercury', 7], ['Venus', 13], ['Jupiter', 20], ['Mars', 25], ['Saturn', 30]],  // Aquarius
  [['Venus', 12], ['Jupiter', 16], ['Mercury', 19], ['Mars', 28], ['Saturn', 30]], // Pisces
];

/** Chaldean faces (decans): 36 x 10 deg, Mars at 0 Aries, then Chaldean
 * order cyclically. FACES[signId] = [0-10, 10-20, 20-30]. */
const FACES = Array.from({ length: 12 }, (_, s) => [0, 1, 2].map((k) =>
  CHALDEAN_ORDER[(CHALDEAN_ORDER.indexOf('Mars') + s * 3 + k) % 7]));

/** Weekday rulers, JS getUTCDay() index (0 = Sunday). */
const WEEKDAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/** Planetary sect membership (diurnal / nocturnal). Mercury is handled
 * separately (depends on its phase relative to the Sun). */
const PLANET_SECT = { Sun: 'day', Jupiter: 'day', Saturn: 'day', Moon: 'night', Venus: 'night', Mars: 'night' };

/** Firdaria (Abu Ma'shar). Total 75 years each. */
const FIRDARIA_DAY = [
  ['Sun', 10], ['Venus', 8], ['Mercury', 13], ['Moon', 9], ['Saturn', 11],
  ['Jupiter', 12], ['Mars', 7], ['NorthNode', 3], ['SouthNode', 2],
];
const FIRDARIA_NIGHT = [
  ['Moon', 9], ['Saturn', 11], ['Jupiter', 12], ['Mars', 7], ['Sun', 10],
  ['Venus', 8], ['Mercury', 13], ['NorthNode', 3], ['SouthNode', 2],
];
/** Bonatti's nocturnal variant (reported in `disputes` only, not used). */
const FIRDARIA_NIGHT_BONATTI = [
  ['Moon', 9], ['Saturn', 11], ['Jupiter', 12], ['Mars', 7], ['NorthNode', 3],
  ['SouthNode', 2], ['Sun', 10], ['Venus', 8], ['Mercury', 13],
];

const SCORE = { domicile: 5, exaltation: 4, triplicity: 3, term: 2, face: 1, detriment: -5, fall: -4 };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365.25; // codebase convention (yogini-dasha.js)
const DEG = Math.PI / 180;

const norm360 = (x) => ((x % 360) + 360) % 360;
const r4 = (x) => Math.round(x * 10000) / 10000;
const isoDate = (d) => d.toISOString().slice(0, 10);
const addYears = (date, years) => new Date(date.getTime() + years * DAYS_PER_YEAR * MS_PER_DAY);
const houseOf = (signId, ascSignId) => (((signId - ascSignId) % 12) + 12) % 12 + 1;
const oppositeSign = (s) => (s + 6) % 12;

function termRuler(signId, deg) {
  for (const [planet, end] of EGYPTIAN_TERMS[signId]) if (deg < end) return planet;
  return EGYPTIAN_TERMS[signId][4][0];
}
function faceRuler(signId, deg) {
  return FACES[signId][Math.min(2, Math.floor(deg / 10))];
}

/** All rulers of a zodiacal point (sign + degree). */
function rulersAt(signId, deg) {
  const trip = TRIPLICITY[signId % 4];
  return {
    domicile: DOMICILE[signId],
    exaltation: EXALTATION_RULER[signId],
    triplicity: { day: trip.day, night: trip.night, participating: trip.participating },
    term: termRuler(signId, deg),
    face: faceRuler(signId, deg),
  };
}

// ---------------------------------------------------------------------------
// NOAA / Meeus solar position (enough for sunrise/sunset to ~1 minute)
// ---------------------------------------------------------------------------
function julianDay(ms) { return ms / MS_PER_DAY + 2440587.5; }

/** Sun's declination (deg) and equation of time (minutes) at Julian
 * century t (NOAA Solar Calculator formulas). */
function solarParams(t) {
  const L0 = norm360(280.46646 + t * (36000.76983 + 0.0003032 * t));
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const C = Math.sin(M * DEG) * (1.914602 - t * (0.004817 + 0.000014 * t))
    + Math.sin(2 * M * DEG) * (0.019993 - 0.000101 * t)
    + Math.sin(3 * M * DEG) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * DEG);
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * DEG);
  const decl = Math.asin(Math.sin(eps * DEG) * Math.sin(lambda * DEG)) / DEG;
  const y = Math.tan((eps / 2) * DEG) ** 2;
  const eqt = y * Math.sin(2 * L0 * DEG) - 2 * e * Math.sin(M * DEG)
    + 4 * e * y * Math.sin(M * DEG) * Math.cos(2 * L0 * DEG)
    - 0.5 * y * y * Math.sin(4 * L0 * DEG) - 1.25 * e * e * Math.sin(2 * M * DEG);
  return { decl, eqTimeMin: 4 * eqt / DEG };
}
const julianCentury = (ms) => (julianDay(ms) - 2451545) / 36525;

/**
 * sunEvent — UTC ms of sunrise (rising=true) or sunset on the calendar date
 * whose 00:00 UTC is `dayStartMs`, at lat/lon (east +). Zenith 90.833 deg.
 * Returns null when the Sun does not rise/set that day (polar day/night).
 */
function sunEvent(dayStartMs, lat, lon, rising) {
  let minutes = 720 - 4 * lon; // first guess: local solar noon, UTC minutes
  for (let i = 0; i < 4; i++) {
    const { decl, eqTimeMin } = solarParams(julianCentury(dayStartMs + minutes * 60000));
    const cosH = Math.cos(90.833 * DEG) / (Math.cos(lat * DEG) * Math.cos(decl * DEG))
      - Math.tan(lat * DEG) * Math.tan(decl * DEG);
    if (!(cosH >= -1 && cosH <= 1)) return null;
    const H = Math.acos(cosH) / DEG;
    minutes = 720 - 4 * lon - eqTimeMin + (rising ? -4 * H : 4 * H);
  }
  return dayStartMs + minutes * 60000;
}

/** Geometric altitude (deg, no refraction) of the Sun at instant ms. */
function sunAltitude(ms, lat, lon) {
  const { decl, eqTimeMin } = solarParams(julianCentury(ms));
  const utcMin = ((ms % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY / 60000;
  const trueSolarMin = utcMin + eqTimeMin + 4 * lon;
  const ha = trueSolarMin / 4 - 180;
  const sinAlt = Math.sin(lat * DEG) * Math.sin(decl * DEG)
    + Math.cos(lat * DEG) * Math.cos(decl * DEG) * Math.cos(ha * DEG);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG;
}

/**
 * dayAndHour — astrological weekday (starts at local sunrise) and unequal
 * planetary hour at the birth instant. The "local date" is taken from local
 * MEAN time (UTC + lon/15 h), which avoids any timezone database; since the
 * astrological day changes at sunrise (never near midnight outside polar
 * regions) this gives the same result as the civil date would.
 */
function dayAndHour(birthDate, lat, lon) {
  const t = birthDate.getTime();
  const lmt = new Date(t + (lon / 15) * 3600000);
  const d0 = Date.UTC(lmt.getUTCFullYear(), lmt.getUTCMonth(), lmt.getUTCDate());
  const rise = (d) => sunEvent(d, lat, lon, true);
  const set = (d) => sunEvent(d, lat, lon, false);

  const riseToday = rise(d0);
  const setToday = set(d0);
  if (riseToday == null || setToday == null) return null;

  let dayStart; let startMs; let endMs; let isDayHour; let sunriseMs; let sunsetMs;
  if (t < riseToday) {
    // Before today's sunrise -> still the night of the previous astrological day.
    const dPrev = d0 - MS_PER_DAY;
    const setPrev = set(dPrev); const risePrev = rise(dPrev);
    if (setPrev == null || risePrev == null) return null;
    dayStart = dPrev; isDayHour = false; startMs = setPrev; endMs = riseToday;
    sunriseMs = risePrev; sunsetMs = setPrev;
  } else if (t < setToday) {
    dayStart = d0; isDayHour = true; startMs = riseToday; endMs = setToday;
    sunriseMs = riseToday; sunsetMs = setToday;
  } else {
    const riseNext = rise(d0 + MS_PER_DAY);
    if (riseNext == null) return null;
    dayStart = d0; isDayHour = false; startMs = setToday; endMs = riseNext;
    sunriseMs = riseToday; sunsetMs = setToday;
  }

  const dayRuler = WEEKDAY_RULERS[new Date(dayStart).getUTCDay()];
  const hourLen = (endMs - startMs) / 12;
  const hourNumber = Math.min(12, Math.floor((t - startMs) / hourLen) + 1);
  // Hour 1 of the day = day ruler; then Chaldean order continues through the
  // 12 day hours and on into the 12 night hours.
  const seq = (isDayHour ? 0 : 12) + hourNumber - 1;
  const hourPlanet = CHALDEAN_ORDER[(CHALDEAN_ORDER.indexOf(dayRuler) + seq) % 7];
  return {
    dayRuler,
    hourRuler: {
      planet: hourPlanet,
      hourNumber,
      isDayHour,
      sunriseISO: new Date(sunriseMs).toISOString(),
      sunsetISO: new Date(sunsetMs).toISOString(),
      periodStartISO: new Date(startMs).toISOString(),
      periodEndISO: new Date(endMs).toISOString(),
      hourLengthMin: Math.round(hourLen / 600) / 100,
    },
  };
}

// ---------------------------------------------------------------------------
// Firdaria
// ---------------------------------------------------------------------------
function buildFirdaria(isDay, birthDate, now) {
  const seq = isDay ? FIRDARIA_DAY : FIRDARIA_NIGHT;
  const periods = [];
  let cursorYears = 0;
  for (const [lord, years] of seq) {
    const start = addYears(birthDate, cursorYears);
    const end = addYears(birthDate, cursorYears + years);
    const subs = [];
    if (CHALDEAN_ORDER.includes(lord)) {
      const i0 = CHALDEAN_ORDER.indexOf(lord);
      const subLen = years / 7;
      for (let k = 0; k < 7; k++) {
        subs.push({
          lord: CHALDEAN_ORDER[(i0 + k) % 7],
          startISO: isoDate(addYears(birthDate, cursorYears + k * subLen)),
          endISO: isoDate(addYears(birthDate, cursorYears + (k + 1) * subLen)),
          _s: addYears(birthDate, cursorYears + k * subLen).getTime(),
          _e: addYears(birthDate, cursorYears + (k + 1) * subLen).getTime(),
        });
      }
    }
    periods.push({ lord, startISO: isoDate(start), endISO: isoDate(end), years, subs, _s: start.getTime(), _e: end.getTime() });
    cursorYears += years;
  }

  let current = null;
  const n = now.getTime();
  for (const p of periods) {
    if (n >= p._s && n < p._e) {
      const sub = p.subs.find((s) => n >= s._s && n < s._e);
      current = { lord: p.lord, sub: sub ? sub.lord : null };
    }
  }
  // strip internal ms fields
  for (const p of periods) { delete p._s; delete p._e; for (const s of p.subs) { delete s._s; delete s._e; } }
  const beyondCycle = n >= addYears(birthDate, 75).getTime();
  return { scheme: 'abu-mashar', totalYears: cursorYears, periods, current, beyondCycle, isEstimate: true };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
/**
 * buildUnani(natal, birthDate, lat, lon, now?)
 *   natal: sidereal (Lahiri) { ascendantRasiId, ascendantDegree, planets: {...} }
 *   birthDate: JS Date, true UTC instant of birth
 *   lat/lon: degrees, east positive
 *   now: optional Date for firdaria/profection "current" (default new Date())
 * Returns null on unusable input.
 */
function buildUnani(natal, birthDate, lat, lon, now) {
  if (!natal || typeof natal.ascendantRasiId !== 'number' || !natal.planets) return null;
  if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) return null;
  const P = natal.planets;
  for (const name of CLASSICAL) if (!P[name] || typeof P[name].rasiId !== 'number') return null;
  const nowDate = now instanceof Date && !isNaN(now.getTime()) ? now : new Date();
  const hasPlace = Number.isFinite(lat) && Number.isFinite(lon);

  const disputes = [];
  const ayanamsa = ayanamsaValueForDate(birthDate);

  // --- Ascendant (tropical) ---
  const ascLon = tropicalLongitude(natal.ascendantRasiId, natal.ascendantDegree || 0, ayanamsa);
  const ascSignId = Math.floor(ascLon / 30);
  const ascDeg = ascLon - ascSignId * 30;

  const lonOf = (name) => tropicalLongitude(P[name].rasiId, P[name].degree || 0, ayanamsa);
  const L = {};
  for (const name of CLASSICAL) L[name] = lonOf(name);

  // --- Sect: Sun above the ecliptic horizon (Asc-Desc axis) ---
  // (ascLon - sunLon) mod 360 in (0,180) => Sun in the half from Asc back
  // through MC to Desc, i.e. above the horizon.
  const sunFromAsc = norm360(ascLon - L.Sun);
  const isDay = sunFromAsc > 0 && sunFromAsc < 180;
  const sunHouseWS = houseOf(Math.floor(L.Sun / 30), ascSignId);
  const isDayWholeSign = sunHouseWS >= 7;
  if (isDayWholeSign !== isDay) disputes.push('sect_wholesign_differs');
  let sunAlt = null;
  if (hasPlace) {
    sunAlt = sunAltitude(birthDate.getTime(), lat, lon);
    // -0.833 = apparent horizon (refraction + semi-diameter)
    if ((sunAlt > -0.833) !== isDay) disputes.push('sect_near_horizon');
  }
  const sect = isDay ? 'day' : 'night';

  // --- Mercury phase (oriental = rises before the Sun = lower longitude) ---
  const mercElong = norm360(L.Mercury - L.Sun); // (180,360) => behind Sun => oriental
  const mercuryOriental = mercElong > 180;
  const mercurySect = mercuryOriental ? 'day' : 'night';
  disputes.push('mercury_sect_by_phase');

  // --- Planets ---
  const planets = CLASSICAL.map((name) => {
    const lonP = L[name];
    const signId = Math.floor(lonP / 30);
    const deg = lonP - signId * 30;
    const rulers = rulersAt(signId, deg);
    const sectTripLord = isDay ? rulers.triplicity.day : rulers.triplicity.night;
    const exalt = EXALTATION[name];
    const dignities = {
      domicile: rulers.domicile === name,
      exaltation: rulers.exaltation === name,
      triplicity: sectTripLord === name,
      term: rulers.term === name,
      face: rulers.face === name,
      detriment: DOMICILE[oppositeSign(signId)] === name,
      fall: !!exalt && oppositeSign(exalt.signId) === signId,
    };
    let score = 0;
    for (const k of Object.keys(SCORE)) if (dignities[k]) score += SCORE[k];
    const peregrine = !(dignities.domicile || dignities.exaltation || dignities.triplicity || dignities.term || dignities.face);
    const planetSect = name === 'Mercury' ? mercurySect : PLANET_SECT[name];
    const out = {
      planet: name,
      lon: r4(lonP), signId, deg: r4(deg),
      house: houseOf(signId, ascSignId),
      retro: !!P[name].isRetrograde,
      rulers, dignities, score, peregrine,
      sect: planetSect,
      inSect: planetSect === sect,
    };
    if (name === 'Mercury') out.oriental = mercuryOriental;
    return out;
  });
  disputes.push('triplicity_ptolemy_lilly_variant', 'triplicity_all_three_lords', 'terms_ptolemaic_variant');
  if (planets.some((p) => p.peregrine)) disputes.push('score_peregrine_penalty_omitted');

  // --- Nodes (listed separately; no essential dignities in this tradition) ---
  const nodes = [];
  for (const name of ['Rahu', 'Ketu']) {
    const p = P[name];
    if (!p || typeof p.rasiId !== 'number') continue;
    const lonN = lonOf(name);
    const signId = Math.floor(lonN / 30);
    nodes.push({ planet: name, lon: r4(lonN), signId, deg: r4(lonN - signId * 30), house: houseOf(signId, ascSignId) });
  }

  // --- Almuten of the Ascendant degree ---
  const ascRulers = rulersAt(ascSignId, ascDeg);
  const scores = {};
  for (const n of CLASSICAL) scores[n] = 0;
  scores[ascRulers.domicile] += SCORE.domicile;
  if (ascRulers.exaltation) scores[ascRulers.exaltation] += SCORE.exaltation;
  scores[isDay ? ascRulers.triplicity.day : ascRulers.triplicity.night] += SCORE.triplicity;
  scores[ascRulers.term] += SCORE.term;
  scores[ascRulers.face] += SCORE.face;
  const maxScore = Math.max(...Object.values(scores));
  const winners = CLASSICAL.filter((n) => scores[n] === maxScore);
  if (winners.length > 1) disputes.push('almuten_tie');
  disputes.push('almuten_triplicity_all_three');
  const almutenAsc = {
    planet: winners[0], tiedWith: winners.slice(1), scores,
    triplicityConvention: 'sect-lord-only', rulers: ascRulers,
  };

  // --- Lots (sect-reversed) ---
  const fortuneLon = norm360(isDay ? ascLon + L.Moon - L.Sun : ascLon + L.Sun - L.Moon);
  const spiritLon = norm360(isDay ? ascLon + L.Sun - L.Moon : ascLon + L.Moon - L.Sun);
  const pt = (lonX) => {
    const s = Math.floor(lonX / 30);
    return { lon: r4(lonX), signId: s, deg: r4(lonX - s * 30), house: houseOf(s, ascSignId), lord: DOMICILE[s] };
  };
  const lots = { fortune: pt(fortuneLon), spirit: pt(spiritLon) };
  disputes.push('lot_fortune_no_reversal_ptolemy_lilly');

  // --- Firdaria ---
  const firdaria = buildFirdaria(isDay, birthDate, nowDate);
  if (!isDay) disputes.push('firdaria_nodes_nocturnal_bonatti');
  disputes.push('firdaria_nodes_subperiods');
  if (firdaria.beyondCycle) disputes.push('firdaria_after_75_restart');

  // --- Annual profection (whole-sign, from the Ascendant) ---
  // Completed years by calendar anniversary of the UTC birth instant.
  let age = nowDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const anniv = new Date(birthDate.getTime());
  anniv.setUTCFullYear(nowDate.getUTCFullYear());
  if (nowDate.getTime() < anniv.getTime()) age -= 1;
  let profection = null;
  if (age >= 0) {
    const profSign = (ascSignId + age) % 12;
    profection = { age, signId: profSign, house: (age % 12) + 1, lordOfYear: DOMICILE[profSign] };
  }

  // --- Day ruler & planetary hour ---
  const dh = hasPlace ? dayAndHour(birthDate, lat, lon) : null;
  if (hasPlace && !dh) disputes.push('polar_no_sunrise');

  return {
    frame: 'tropical',
    ayanamsa: r4(ayanamsa),
    ayanamsaIsEstimate: true,
    houseSystem: 'whole-sign',
    sect,
    sectMethod: 'ecliptic-horizon',
    sunAltitude: sunAlt == null ? null : Math.round(sunAlt * 100) / 100,
    sectLight: isDay ? 'Sun' : 'Moon',
    sectBenefic: isDay ? 'Jupiter' : 'Venus',
    sectMalefic: isDay ? 'Saturn' : 'Mars',
    ascendant: { lon: r4(ascLon), signId: ascSignId, deg: r4(ascDeg) },
    planets,
    nodes,
    almutenAsc,
    lots,
    firdaria,
    profection,
    dayRuler: dh ? dh.dayRuler : null,
    hourRuler: dh ? dh.hourRuler : null,
    disputes,
    sources: SOURCES.map((s) => ({ title: s.title, url: s.url })),
  };
}

module.exports = {
  buildUnani,
  // tables (read-only use please)
  CLASSICAL, CHALDEAN_ORDER, DOMICILE, EXALTATION, EXALTATION_RULER, TRIPLICITY,
  EGYPTIAN_TERMS, FACES, WEEKDAY_RULERS, PLANET_SECT, FIRDARIA_DAY, FIRDARIA_NIGHT,
  FIRDARIA_NIGHT_BONATTI, SCORE, SOURCES,
  // helpers (exported for tests)
  termRuler, faceRuler, rulersAt, sunEvent, sunAltitude, dayAndHour,
};
