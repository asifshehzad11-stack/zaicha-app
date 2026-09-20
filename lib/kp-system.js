// lib/kp-system.js — "KP (Krishnamurti Paddhati) info screen" (Task 43,
// ROADMAP Phase 3). Scope: har classical planet + Ascendant ka STAR LORD
// (nakshatra lord — already is app mein maujood, lib/planet-profile.js)
// aur SUB LORD (naya — is module mein).
//
// AKSRA note — 3 independent sources check kiye, 1 correction hui:
//   - Sub-lord ki proportional-division formula: jagannathhora.com aur
//     roxyapi.com dono confirm karte hain — har nakshatra (13°20' = 800
//     arcmin) ko 9 UNEQUAL hisso mein taqseem kiya jata hai, Vimshottari
//     Dasha years ke tanasub (proportion) se: hissa = (dasha_years/120) *
//     13°20'. (Ketu=7, Venus=20, Sun=6, Moon=10, Mars=7, Rahu=18,
//     Jupiter=16, Saturn=19, Mercury=17, total=120 saal.)
//   - 9 sub-lord ki TARTEEB (order): pehli research pass mein 2 sources
//     ka jawab ALAG mila (ek: "hamesha us nakshatra ke apne lord se shuru
//     hota hai", doosra: "hamesha Ketu se shuru hota hai") — teesra source
//     (paramarsh.app) se poori tarah clear ho gaya: SAHIH qaeda ye hai ke
//     tarteeb hamesha US NAKSHATRA KE APNE LORD se shuru hoti hai, phir
//     fixed Vimshottari cycle (Ketu->Venus->Sun->Moon->Mars->Rahu->
//     Jupiter->Saturn->Mercury) mein aagay chalti hai. Doosre source ka
//     "hamesha Ketu se" wala jawab غلط fahmi thi — Ashwini (jo Ketu se
//     shuru hoti hai) ko misaal bana kar generalize kar diya gaya tha.
//     Bharani (Venus ki nakshatra) ka worked example teesre source ne
//     confirm kiya: Bharani mein pehla sub Venus (khud), phir Sun, Moon,
//     Mars... (Ketu se nahi).
//
// DISCLOSED LIMITATIONS (dono UI mein bhi saaf likhi gayi hain):
//   1. Ayanamsa: KP practitioners classically apna "Krishnamurti/KP-
//      Newcomb" ayanamsa istemal karte hain, jo Lahiri se thoda mukhtalif
//      hota hai (roxyapi.com ke mutabiq "typically under 10 arc-minutes")
//      — is app mein sirf ek hi ayanamsa (Lahiri) wire hai, is liye ye
//      calculation usi Lahiri-based longitude se hoti hai. Itna chhota
//      farq kabhi-kabhi (khaas kar kisi sub-lord boundary ke bilkul
//      qareeb waqt) sub-lord badal sakta hai — is liye disclosed hai,
//      guess nahi kiya gaya ke "bilkul same hoga."
//   2. Cuspal Sub-Lords: is module mein sirf PLANET + Ascendant ke
//      sub-lords hain. Poora KP cuspal-significator system (12 Placidus
//      house cusps + A/B/C/D significator hierarchy) ab lib/kp-cuspal.js
//      mein ALAG se bana diya gaya hai (2026-09-20, session 3 cont'd) —
//      wahan dekhein.
'use strict';

const { PLANET_NAME_URDU, absoluteLongitude, nakshatraFromLongitude } = require('./astro-engine');
const { NAKSHATRA_LORD_CYCLE } = require('./planet-profile');

const NAK_SPAN = 360 / 27; // 13°20'
const VIMSHOTTARI_CYCLE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const TOTAL_YEARS = 120;

const KP_POINTS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

/** subLordCycleForNakshatra — nakshatra ke apne lord se shuru hone wali,
 * fixed Vimshottari order mein 9-planet cycle. */
function subLordCycleForNakshatra(starLord) {
  const startIdx = VIMSHOTTARI_CYCLE.indexOf(starLord);
  const cycle = [];
  for (let i = 0; i < 9; i++) {
    cycle.push(VIMSHOTTARI_CYCLE[(startIdx + i) % 9]);
  }
  return cycle;
}

/**
 * kpStarAndSubLord — kisi bhi absolute longitude (0-360°) ke liye Star
 * Lord (nakshatra lord) aur Sub Lord dono nikalta hai.
 */
function kpStarAndSubLord(longitude) {
  const nak = nakshatraFromLongitude(longitude);
  const starLord = NAKSHATRA_LORD_CYCLE[nak.index % 9];
  const nakStart = nak.index * NAK_SPAN;
  const posInNak = longitude - nakStart; // 0..13.3333

  const cycle = subLordCycleForNakshatra(starLord);
  let cumulative = 0;
  let subLord = cycle[cycle.length - 1]; // fallback (floating-point edge case ke liye)
  for (const planet of cycle) {
    const span = (DASHA_YEARS[planet] / TOTAL_YEARS) * NAK_SPAN;
    if (posInNak < cumulative + span) {
      subLord = planet;
      break;
    }
    cumulative += span;
  }

  return {
    nakshatra: nak,
    starLord,
    starLordUrdu: PLANET_NAME_URDU[starLord] || starLord,
    subLord,
    subLordUrdu: PLANET_NAME_URDU[subLord] || subLord,
  };
}

/**
 * buildKpInfo — `data` poora ZAICHA_DATA object. Har classical planet
 * (Rahu/Ketu samet) + Ascendant ka Star Lord + Sub Lord return karta hai.
 * Koi extra API call nahi (mojooda natal longitude data se hi).
 */
function buildKpInfo(data) {
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  const ascendantDegree = (data.natal && data.natal.ascendantDegree) || 0;

  const points = [];
  for (const planet of KP_POINTS) {
    const p = natalMap[planet];
    if (!p || typeof p.rasiId !== 'number') continue;
    const lon = absoluteLongitude(p.rasiId, p.degree);
    const kp = kpStarAndSubLord(lon);
    points.push({ point: planet, pointUrdu: PLANET_NAME_URDU[planet] || planet, ...kp });
  }
  if (typeof ascendantRasiId === 'number') {
    const lon = absoluteLongitude(ascendantRasiId, ascendantDegree);
    const kp = kpStarAndSubLord(lon);
    points.push({ point: 'Ascendant', pointUrdu: 'لگن', ...kp });
  }

  return {
    points,
    ayanamsaIsApprox: true, // disclosed limitation — header comment dekhein
    cuspalSubLordsSupported: true, // ab lib/kp-cuspal.js mein bana hai — header comment dekhein
  };
}

module.exports = { buildKpInfo, kpStarAndSubLord, subLordCycleForNakshatra, DASHA_YEARS, VIMSHOTTARI_CYCLE };
