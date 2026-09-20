// lib/varshaphal.js — Multi-language (EN/UR/HI)
//
// Varshaphal (Tajika annual/solar-return chart) — Phase 2's third item.
// This file DELIBERATELY implements only ONE piece of Varshaphal so far:
// Muntha (the "progressed ascendant" that advances one sign per
// completed year of age). This is the one part of Varshaphal that is
// simple, astronomically/mathematically exact, and — unlike the rest of
// Tajika Varshaphal — NOT disputed across sources (2 independent sources
// checked, both give the identical formula with no caveats):
//   - VedAstro's own blog: https://vedastro.org/blog/Varshaphala-Part-8-Muntha.html
//   - Hindu Calculator: https://hinducalculator.com/muntha/
//
// AKSRA note — why the REST of Varshaphal is not here yet: a full
// Varshaphal chart needs (1) the exact solar-return MOMENT (the precise
// time each year when transiting Sun returns to its exact natal
// longitude — this itself would need a new API call per requested year,
// which also interacts with the already-flagged VedAstro rate-limit
// issue, see ROADMAP.md), and (2) Varshesh/year-lord via the
// "Panchadhikari" 5-dignity scoring method, which — like Chara Dasha —
// has real cross-source disagreement on the scoring weights. Rather than
// present a half-verified year-lord as fact, only the safe, agreed-upon
// Muntha piece is shipped now; the rest stays a documented ROADMAP item.
'use strict';

const { normLang } = require('./narrative');
const { RASI_NAMES_URDU, RASI_NAMES_LATIN, SIGN_LORDS, houseFromReference } = require('./astro-engine');

/** Completed years of age as of targetDate — calendar-accurate (not a
 * 365.25-day division, which can drift a day around the birthday). */
function completedAgeYears(birthDate, targetDate) {
  let age = targetDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthMonthDay = birthDate.getUTCMonth() * 100 + birthDate.getUTCDate();
  const targetMonthDay = targetDate.getUTCMonth() * 100 + targetDate.getUTCDate();
  if (targetMonthDay < birthMonthDay) age -= 1;
  return Math.max(0, age);
}

/**
 * buildMuntha — `data` woh ZAICHA_DATA object hai (natal ascendant ke
 * liye), `birthDate`/`targetDate` JS Date objects. Return: Muntha ki
 * raashi, uska lord, aur natal Lagna se uska ghar (house) — kyunke
 * classically Muntha kis ghar mein padi hai ye khud ek ahem baat hoti
 * hai (misal: 8th house mein Muntha ko roayti tor par mushkil mana
 * jata hai).
 */
function buildMuntha(data, birthDate, targetDate, lang) {
  lang = normLang(lang);
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  if (typeof ascendantRasiId !== 'number' || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return null;
  }
  const age = completedAgeYears(birthDate, targetDate);
  const munthaRasiId = (ascendantRasiId + age) % 12;
  const lord = SIGN_LORDS[munthaRasiId];
  const house = houseFromReference(munthaRasiId, ascendantRasiId);

  return {
    age,
    rasiId: munthaRasiId,
    sign: RASI_NAMES_URDU[munthaRasiId],
    signLatin: RASI_NAMES_LATIN[munthaRasiId],
    lord,
    house, // natal Lagna se count kiya gaya ghar
    isEstimate: false, // ye hissa exact classical formula hai, koi tukhmeena nahi
  };
}

module.exports = { buildMuntha };
