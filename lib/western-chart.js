// lib/western-chart.js — "Western (Tropical) chart view" (Task 44,
// ROADMAP Phase 3). Is app ka poora engine SIDEREAL (Lahiri ayanamsa)
// hai — Western/Tropical chart banane ke liye har planet ki longitude
// mein AYANAMSA (tropical - sidereal ka farq, degrees mein) wapas jama
// karna padta hai. Is app ke paas kisi bhi API se seedha "ayanamsa VALUE"
// (jaise 24°13') nahi aata — sirf ek selector ID (1=Lahiri) jata hai,
// jiska hisab khud API (Prokerala/VedAstro) apne andar karti hai. Is liye
// ayanamsa ki VALUE khud, ek disclosed linear-approximation formula se,
// nikali gayi hai — koi extra API call nahi.
//
// AKSRA note — 2 independent sources se cross-verify:
//   - jagannathhora.com ("Lahiri Ayanamsa 2026" reference page): Lahiri
//     ayanamsa 2000-01-01 = 23°51'12" (23.8533°), 2026-01-01 = 24°13'19"
//     (24.2219°).
//   - en.wikipedia.org/wiki/Ayanamsa: J2000 (2000) value ≈ 23.84° —
//     dono sources ~1 arcminute ke andar muttafiq hain (chhota farq
//     alag-alag exact reference-epoch definitions ki wajah se, dono hi
//     khud disclose karte hain ke asal rate saal-ba-saal thoda non-linear
//     hai — Moon/planets ki gravitational influence se).
//   FORMULA (dono jagannathhora data-points se seedha derive kiya gaya,
//   koi bahar se li hui constant nahi): rate = (24.2219-23.8533)/26 =
//   0.014178°/saal. `ayanamsa(date) = 23.8533 + 0.014178 * (saal - 2000)`.
//   Ye ek LINEAR approximation hai (jaisa khud sources warn karte hain,
//   asal Swiss-Ephemeris-level precision non-linear hoti hai) — is liye
//   result hamesha `isEstimate: true` ke sath, +/- 1-2 arcminute tak farq
//   mumkin hai (kisi sign-boundary ke bilkul qareeb hone par shayad
//   1 arcmin ka farq bhi sign badal sakta hai — disclosed).
//
// House system: is app ka sidereal D1 chart bhi WHOLE-SIGN houses
// istemal karta hai (Placidus cusp-calculation wire nahi) — isi
// consistency ke liye Western chart bhi whole-sign houses (tropical
// Ascendant se) deta hai, Placidus/Koch jaisa professional Western
// house-system nahi (disclosed).
'use strict';

const { RASI_NAMES_URDU, RASI_NAMES_LATIN, SIGN_LORDS, PLANET_ABBR, PLANET_COLOR_VAR, PLANET_NAME_URDU, planetDignity, houseFromReference, absoluteLongitude } = require('./astro-engine');

const AYANAMSA_EPOCH_YEAR = 2000;
const AYANAMSA_EPOCH_VALUE = 23.8533; // jagannathhora.com, 2000-01-01
const AYANAMSA_ANNUAL_RATE = (24.2219 - 23.8533) / 26; // 2026-01-01 se derive kiya, ~0.014178°/saal

/** yearFraction — birth date se decimal saal (linear approximation ke
 * liye kaafi sahih hai, din ka fraction chhota asar dalta hai). */
function yearFraction(date) {
  const year = date.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const startOfNextYear = Date.UTC(year + 1, 0, 1);
  const frac = (date.getTime() - startOfYear) / (startOfNextYear - startOfYear);
  return year + frac;
}

function ayanamsaValueForDate(date) {
  const yrs = yearFraction(date) - AYANAMSA_EPOCH_YEAR;
  return AYANAMSA_EPOCH_VALUE + AYANAMSA_ANNUAL_RATE * yrs;
}

function tropicalLongitude(siderealRasiId, siderealDegree, ayanamsaDeg) {
  const siderealLon = absoluteLongitude(siderealRasiId, siderealDegree);
  return ((siderealLon + ayanamsaDeg) % 360 + 360) % 360;
}

/**
 * buildWesternChart — `data` poora ZAICHA_DATA object, `birthDate` JS
 * Date. Sidereal natal longitudes ko tropical mein badal kar, whole-sign
 * houses ke sath poora chart deta hai (natal chart ke `houses` jaisi
 * shape, taake frontend mojooda chart-SVG renderer reuse kar sake).
 */
function buildWesternChart(data, birthDate) {
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  const ascendantDegree = (data.natal && data.natal.ascendantDegree) || 0;
  if (typeof ascendantRasiId !== 'number' || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) return null;

  const ayanamsaDeg = ayanamsaValueForDate(birthDate);

  const tropAscLon = tropicalLongitude(ascendantRasiId, ascendantDegree, ayanamsaDeg);
  const tropAscSignId = Math.floor(tropAscLon / 30);
  const tropAscDegree = tropAscLon % 30;

  const houses = [];
  for (let h = 1; h <= 12; h++) {
    const signId = (tropAscSignId + (h - 1)) % 12;
    houses.push({
      n: h,
      signId,
      sign: RASI_NAMES_URDU[signId],
      signLatin: RASI_NAMES_LATIN[signId],
      lord: PLANET_NAME_URDU[SIGN_LORDS[signId]] || SIGN_LORDS[signId],
      lordLatin: SIGN_LORDS[signId],
      planets: [],
    });
  }

  const planetTropSign = {};
  for (const name of Object.keys(natalMap)) {
    const p = natalMap[name];
    if (typeof p.rasiId !== 'number') continue;
    const lon = tropicalLongitude(p.rasiId, p.degree, ayanamsaDeg);
    const signId = Math.floor(lon / 30);
    const degreeInSign = lon % 30;
    planetTropSign[name] = { signId, degree: degreeInSign };
    const houseNum = houseFromReference(signId, tropAscSignId);
    houses[houseNum - 1].planets.push({
      abbr: PLANET_ABBR[name] || name.slice(0, 2),
      name,
      color: PLANET_COLOR_VAR[name] || 'var(--text-muted)',
      degree: Math.round(degreeInSign * 100) / 100,
      // Dignity classical tor par sirf SIDEREAL rasi se batayi jati hai
      // (Vedic dignity-table Western tropical signs par apply nahi hoti,
      // dono alag systems hain) — is liye yahan dignity SHAMIL NAHI ki
      // gayi, taake koi ghalat cross-system dawa na bane.
      isRetrograde: !!p.isRetrograde,
    });
  }
  houses[0].planets.unshift({ abbr: 'Lg', name: 'Ascendant', color: PLANET_COLOR_VAR.Ascendant, isRetrograde: false });

  return {
    ascendantSignId: tropAscSignId,
    ascendantSignName: RASI_NAMES_URDU[tropAscSignId],
    ascendantSignLatin: RASI_NAMES_LATIN[tropAscSignId],
    ascendantDegree: Math.round(tropAscDegree * 100) / 100,
    houses,
    planetSigns: planetTropSign,
    ayanamsaUsed: Math.round(ayanamsaDeg * 10000) / 10000,
    isEstimate: true, // linear-approximation ayanamsa formula — header comment dekhein
    houseSystemNote: 'whole-sign', // Placidus nahi — disclosed
  };
}

module.exports = { buildWesternChart, ayanamsaValueForDate, tropicalLongitude };
