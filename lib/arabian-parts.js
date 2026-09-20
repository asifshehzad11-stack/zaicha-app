// lib/arabian-parts.js — "Arabian Parts (Lots)" feature (Task 45, ROADMAP
// Phase 3). Scope: sirf do sab se ziyada mustanad/mustaqil Lots — Lot of
// Fortune (Fortuna) aur Lot of Spirit (Daimon) — poore Hellenistic
// tradition mein ye dono hi sab se pehle aur sab se zyada muttafiq-alaih
// (agreed-upon) hain; baaqi dargzar (dozens of) "Arabic parts" jo baad ke
// medieval texts mein milte hain unke formulas source-se-source bohot
// mukhtalif hain, is liye is round mein shamil nahi kiye gaye.
//
// AKSRA note — 2 independent sources se cross-verify (koi ikhtilaf nahi
// core formula mein):
//   - en.wikipedia.org/wiki/Arabic_parts
//   - astrolium.com/guides/hellenistic-astrology
//   Dono HUBAHU muttafiq: SECT (din/raat ka chart) ke hisab se Fortune aur
//   Spirit ke formulas EK DOOSRE se SWAP hotay hain:
//     Din (diurnal) ka chart — Sun UFUQ (horizon) se OOPAR (Ascendant-
//       Descendant axis se, MC ki taraf, yani whole-sign houses 7-12):
//       Fortune = Ascendant + Moon - Sun
//       Spirit  = Ascendant + Sun - Moon
//     Raat (nocturnal) ka chart — Sun ufuq se NEECHE (houses 1-6):
//       Fortune = Ascendant + Sun - Moon
//       Spirit  = Ascendant + Moon - Sun
//   DISCLOSED historical note: Wikipedia khud batata hai ke baad ke
//   medieval/Renaissance daur (William Lilly, 17th century) mein sirf
//   DIN wala formula, sect dekhe baghair, hamesha istemal hone laga —
//   ye is app mein IMPLEMENT NAHI kiya gaya (purane/Hellenistic,
//   sect-based tareeqa hi primary hai, is project ke established usool
//   ke mutabiq: jahan classical convention mojood ho, baad ki
//   simplified/populist convention ki bajaye ussi ko tarjeeh di jati
//   hai — Chara Dasha ke "hamesha Lagna se shuru" wale faisle jaisa).
//
// DISCLOSED FRAME CHOICE: ye Lots asal mein Hellenistic (tropical/Western
// zodiac) tradition se hain, lekin yahan is app ki apni MAUJOOD sidereal
// (Lahiri) longitude data par hi seedha formula apply kiya gaya hai (koi
// extra API call ya tropical-conversion nahi) — Chara Karaka/Bhava Bala
// jaisa hi "apna maujood data reuse karo, frame disclose karo" usool.
// Is se result ka SIGN Hellenistic/tropical practitioners ke result se
// mukhtalif ho sakta hai (bilkul waisay hi jaisay is app ka poora natal
// chart tropical astrologers ke chart se mukhtalif hota hai) — koi
// ghalat cross-system dawa nahi kiya gaya.
'use strict';

const { RASI_NAMES_URDU, RASI_NAMES_LATIN, SIGN_LORDS, PLANET_NAME_URDU, absoluteLongitude, houseFromReference, nakshatraFromLongitude } = require('./astro-engine');

function normalizeLongitude(lon) {
  return ((lon % 360) + 360) % 360;
}

/**
 * buildArabianParts — `data` poora ZAICHA_DATA object. Sect (din/raat)
 * khud Sun ke ghar (whole-sign, Ascendant se) se tay hota hai: houses
 * 7-12 = din ka chart (Sun ufuq se oopar), houses 1-6 = raat ka chart.
 */
function buildArabianParts(data) {
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  const ascendantDegree = (data.natal && data.natal.ascendantDegree) || 0;
  const sun = natalMap.Sun;
  const moon = natalMap.Moon;
  if (typeof ascendantRasiId !== 'number' || !sun || !moon ||
      typeof sun.rasiId !== 'number' || typeof moon.rasiId !== 'number') {
    return null;
  }

  const ascLon = absoluteLongitude(ascendantRasiId, ascendantDegree);
  const sunLon = absoluteLongitude(sun.rasiId, sun.degree);
  const moonLon = absoluteLongitude(moon.rasiId, moon.degree);

  const sunHouse = houseFromReference(sun.rasiId, ascendantRasiId);
  const isDayChart = sunHouse >= 7 && sunHouse <= 12; // Sun ufuq se oopar

  const fortuneLon = isDayChart
    ? normalizeLongitude(ascLon + moonLon - sunLon)
    : normalizeLongitude(ascLon + sunLon - moonLon);
  const spiritLon = isDayChart
    ? normalizeLongitude(ascLon + sunLon - moonLon)
    : normalizeLongitude(ascLon + moonLon - sunLon);

  function pointInfo(lon) {
    const signId = Math.floor(lon / 30);
    const degreeInSign = lon % 30;
    const house = houseFromReference(signId, ascendantRasiId);
    return {
      signId,
      sign: RASI_NAMES_URDU[signId],
      signLatin: RASI_NAMES_LATIN[signId],
      degree: Math.round(degreeInSign * 100) / 100,
      house,
      lord: PLANET_NAME_URDU[SIGN_LORDS[signId]] || SIGN_LORDS[signId],
      lordLatin: SIGN_LORDS[signId],
      nakshatra: nakshatraFromLongitude(lon),
    };
  }

  return {
    isDayChart,
    sect: isDayChart ? 'day' : 'night',
    sectUrdu: isDayChart ? 'دن کا زائچہ (Diurnal)' : 'رات کا زائچہ (Nocturnal)',
    fortune: pointInfo(fortuneLon),
    spirit: pointInfo(spiritLon),
    frameNote: 'sidereal', // disclosed limitation — header comment dekhein
  };
}

module.exports = { buildArabianParts };
