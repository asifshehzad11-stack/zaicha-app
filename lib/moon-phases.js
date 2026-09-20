// lib/moon-phases.js — "New/Full Moons & Eclipses" ROADMAP item (Task 41,
// Phase 3), sirf MOON-PHASES (New Moon/Amavasya, Full Moon/Purnima) wala
// hissa. Eclipses wala hissa jaan-boojh kar implement NAHI kiya gaya —
// neeche wajah disclose ki gayi hai (AKSRA: missing-prerequisite pattern,
// Varshesh ki tarah, guess kar ke ghalat "eclipse date" dikhana khatarnak
// hoga kyunke ye ek checkable, public fact hai).
//
// AKSRA note:
//   - Formula: agla New Moon tab hota hai jab Moon-Sun elongation (Moon ki
//     longitude - Sun ki longitude) ek poora 360° cycle mukammal kar le;
//     agla Full Moon tab jab elongation 180° tak pahunche. Is app ke paas
//     abhi kisi bhi future din ka Moon/Sun ki EXACT longitude nikalne ka
//     zariya nahi (ephemeris wire nahi) — is liye "aaj" ki maloom
//     Sun/Moon longitude (jo already `/api/kundli` ke `gochar.details`
//     mein FREE maujood hai, koi extra API call nahi) se, classical MEAN
//     synodic rate ke zariye AGE ka waqt project kiya jata hai:
//       mean synodic month = 29.530589 din (eclipsewise.com — NASA/Fred
//       Espenak ki eclipse-prediction site — AUR astropixels.com, dono
//       independent astronomy sources, hubahu same value)
//       mean elongation rate = 360° / 29.530589 din = 12.19075°/din
//     Ye "mean" rate hai (asal Moon/Sun ki raftar Kepler ki elliptical
//     orbits ki wajah se thodi kam/zyada hoti rehti hai — asal synodic
//     month 29.27 se 29.83 din tak ho sakta hai, eclipsewise.com/
//     astropixels.com dono is variation ko explicitly confirm karte hain)
//     — is liye result hamesha `isEstimate: true` ke sath, aur
//     +/- ek din tak ka farq mumkin hai, yehi UI mein bhi disclose hota
//     hai (Chara Dasha ke 365.25-din-saal wale isEstimate pattern jaisa).
//
//   - ECLIPSES — BLOCKED, disclosed (guess nahi kiya gaya): ek asal
//     eclipse sirf tab hota hai jab New/Full Moon ki GHARI mein Moon
//     lunar node (Rahu/Ketu) ke itna qareeb ho ke uski ECLIPTIC LATITUDE
//     (north/south) bhi kaafi kam ho — eclipsewise.com ke mutabiq
//     "ecliptic limit" tak. Latitude nikalne ke liye poori lunar
//     ephemeris chahiye hoti hai (sirf longitude/rasiId+degree kaafi
//     nahi, jo is app ke paas hai) — is app mein woh capability wire
//     nahi. Sirf "New/Full Moon Rahu/Ketu ke qareeb hai ya nahi" jaisa
//     mahaz longitude-based heuristic banana aasan hota, lekin do
//     estimate (Moon-phase date ka apna estimate + Rahu ki mean-motion
//     projection) ek doosre par jama kar ke ek "eclipse hoga/nahi" jaisa
//     confident-lagne wala (lekin asal mein kamzor) dawa banta — aur
//     eclipses ek aisi cheez hai jo public tor par verify ho sakti hai
//     (NASA/timeanddate list), is liye ghalat hone ki soorat mein bhi
//     saaf pakड़i jayegi. Isi wajah se Varshesh ki tarah, jab tak asal
//     ephemeris/latitude data na mil jaye, ye hissa implement NAHI hua.
'use strict';

const { absoluteLongitude } = require('./astro-engine');
const { tithiFromLongitudes } = require('./panchang-calendar');

const SYNODIC_MONTH_DAYS = 29.530589; // eclipsewise.com + astropixels.com, dono confirm
const MEAN_ELONGATION_RATE = 360 / SYNODIC_MONTH_DAYS; // ~12.19075°/din

function forwardElongation(moonLon, sunLon) {
  return ((moonLon - sunLon) % 360 + 360) % 360;
}

function addDaysToDateStr(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

/**
 * buildMoonPhases — `sunRasiId`/`sunDegree`, `moonRasiId`/`moonDegree`
 * AAJ (reference date) ki longitude hain (data.gochar.details.Sun/.Moon
 * se, jo `/api/kundli` mein already FREE maujood hai). `todayStr` =
 * 'YYYY-MM-DD'.
 */
function buildMoonPhases(sunRasiId, sunDegree, moonRasiId, moonDegree, todayStr) {
  if (typeof sunRasiId !== 'number' || typeof moonRasiId !== 'number') return null;
  const sunLon = absoluteLongitude(sunRasiId, sunDegree);
  const moonLon = absoluteLongitude(moonRasiId, moonDegree);
  const elong = forwardElongation(moonLon, sunLon);

  const degreesToNewMoon = elong === 0 ? 360 : 360 - elong;
  const degreesToFullMoon = elong < 180 ? (180 - elong) : (180 - elong + 360);

  const daysToNewMoon = degreesToNewMoon / MEAN_ELONGATION_RATE;
  const daysToFullMoon = degreesToFullMoon / MEAN_ELONGATION_RATE;

  const currentTithi = tithiFromLongitudes(moonLon, sunLon);

  return {
    currentTithi,
    nextNewMoon: {
      date: addDaysToDateStr(todayStr, daysToNewMoon),
      daysAway: Math.round(daysToNewMoon),
    },
    nextFullMoon: {
      date: addDaysToDateStr(todayStr, daysToFullMoon),
      daysAway: Math.round(daysToFullMoon),
    },
    isEstimate: true, // mean synodic rate se project kiya gaya — asal waqt se +/- ek din tak farq mumkin
    eclipsesSupported: false, // disclosed limitation — header comment dekhein
  };
}

module.exports = { buildMoonPhases, SYNODIC_MONTH_DAYS, MEAN_ELONGATION_RATE };
