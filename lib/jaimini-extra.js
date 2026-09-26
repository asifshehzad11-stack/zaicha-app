// lib/jaimini-extra.js
//
// Jaimini system ke woh hisse jo pehle app mein nahi thay (Chara Karaka aur
// Chara Dasha pehle se lib/jaimini-karaka.js + lib/chara-dasha.js mein hain):
//   1) Arudha Padas (A1..A12) — khaas taur par Arudha Lagna (AL = A1) aur
//      Upapada (UL = A12).
//   2) Karakamsa — Atmakaraka graha ki Navamsa (D9) rashi, aur D1 mein woh
//      rashi lagna se kaunse ghar mein padti hai.
//
// AKSRA — formula 3 mustaqil sources se verify kiya gaya (2026-09-25):
//   * sarvatobhadra.com/arudha-lagna-bhav-padas: "Count the number of houses
//     from the Ascendant to the Ascendant lord. Then, count the same number
//     of houses from the Ascendant lord... Arudha Lagna can never occupy the
//     1st or 7th houses. If the counting reaches the 1st or 7th house, count
//     10 houses from those."
//   * timelineastrology.com/arudha.html: same counting; own-sign case -> 10th
//     from it; 7th case -> "count 10 signs from there, and end up in the 4th".
//   * saptarishisastrology.com (BPHS Arudha chapter, Madura Krishnamurthi
//     Sastri): own house -> 10th; 7th -> 4th.
//   Teeno muttafiq hain (10th from the 7th = 4th house).
//
// DISCLOSED IKHTILAF: Scorpio (Mars+Ketu) aur Aquarius (Saturn+Rahu) ke do
// malik hain; kaunsa lord liya jaye is par sources mukhtalif hain ("jo zyada
// grahon ke saath ho" vs "jo zyada taaqatwar ho"). Yahan PRIMARY hisab
// classical malik (Mars/Saturn) se hota hai, aur agar co-lord (Ketu/Rahu) se
// nateeja mukhtalif aaye to `alternate` field mein woh bhi diya jata hai —
// koi ek "sahi" faisla khud se thopa nahi gaya.
'use strict';

const { navamsaSignId } = require('./navamsa');

const SIGN_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];
const CO_LORD = { 7: 'Ketu', 10: 'Rahu' }; // Scorpio, Aquarius

function mod12(n) { return ((n % 12) + 12) % 12; }

function padaFromLord(houseSignId, lordSignId) {
  const count = mod12(lordSignId - houseSignId); // 0-based distance
  let pada = mod12(lordSignId + count);
  if (pada === houseSignId) pada = mod12(houseSignId + 9); // 10th from house
  else if (pada === mod12(houseSignId + 6)) pada = mod12(houseSignId + 3); // 10th from 7th = 4th
  return pada;
}

function buildArudhaPadas(natal) {
  const lagnaId = natal.ascendantRasiId;
  const planets = natal.planets || {};
  const padas = [];
  for (let h = 1; h <= 12; h++) {
    const signId = mod12(lagnaId + h - 1);
    const lord = SIGN_LORDS[signId];
    const lordPos = planets[lord];
    if (!lordPos || lordPos.rasiId == null) continue;
    const padaSign = padaFromLord(signId, lordPos.rasiId);
    const entry = {
      house: h,
      key: 'A' + h,
      signId,
      lord,
      lordSignId: lordPos.rasiId,
      padaSignId: padaSign,
      padaHouse: mod12(padaSign - lagnaId) + 1,
    };
    const co = CO_LORD[signId];
    if (co && planets[co] && planets[co].rasiId != null) {
      const alt = padaFromLord(signId, planets[co].rasiId);
      if (alt !== padaSign) {
        entry.alternate = { lord: co, padaSignId: alt, padaHouse: mod12(alt - lagnaId) + 1 };
      }
    }
    padas.push(entry);
  }
  return padas;
}

function buildKarakamsa(natal, charaKarakas) {
  const ak = charaKarakas && charaKarakas.karakas && charaKarakas.karakas.find((k) => k.karakaKey === 'atmakaraka');
  if (!ak) return null;
  const pos = natal.planets[ak.planet];
  if (!pos || pos.rasiId == null || pos.degree == null) return null;
  const d9 = navamsaSignId(pos.rasiId, pos.degree);
  // Karakamsa rashi mein D1 ke kaunse graha baithe hain (Jaimini: "planets in
  // Karakamsa") — sirf D1 positions se.
  const occupantsD1 = Object.keys(natal.planets).filter((p) => natal.planets[p].rasiId === d9);
  return {
    atmakaraka: ak.planet,
    navamsaSignId: d9,
    houseFromLagna: mod12(d9 - natal.ascendantRasiId) + 1,
    occupantsD1,
  };
}

function buildJaiminiExtra(natal, charaKarakas) {
  const padas = buildArudhaPadas(natal);
  const al = padas.find((p) => p.house === 1) || null;
  const ul = padas.find((p) => p.house === 12) || null;
  const occupants = (signId) => Object.keys(natal.planets).filter((p) => natal.planets[p].rasiId === signId);
  return {
    arudhaLagna: al ? { ...al, occupants: occupants(al.padaSignId) } : null,
    upapada: ul ? { ...ul, occupants: occupants(ul.padaSignId) } : null,
    padas,
    karakamsa: buildKarakamsa(natal, charaKarakas),
  };
}

module.exports = { buildJaiminiExtra, padaFromLord };
