// lib/navamsa.js
//
// Navamsa (D9) divisional chart — Phase 1 ka doosra item (Yoga Detection ke
// baad), Asif ke "OMNIS 7 jaisa feature-rich banao" roadmap se.
//
// Navamsa shaadi/partner, dharma aur kisi bhi planet ki "asal" (deeper)
// taaqat dekhne ke liye classical Vedic astrology mein sab se zyada
// istemal hone wala divisional chart hai — D1 (Rasi) ke baad sab se
// pehle isi ko dekha jata hai.
//
// Classical formula (Parashari, universal — movable/fixed/dual teeno
// tarah ke signs ke liye ek hi formula se kaam chal jata hai):
//   pada          = floor(degreeInSign / (30/9))       -> 0 se 8 tak
//   navamsaSignId = ((rasiId * 9) + pada) mod 12
//
// Ye formula khud verify: Aries (movable, rasiId=0) ka pada-0 => Aries
// khud (movable signs apne hi sign se shuru hote hain). Taurus (fixed,
// rasiId=1) ka pada-0 => Capricorn (fixed signs apne se 9wein sign se
// shuru hote hain). Gemini (dual, rasiId=2) ka pada-0 => Libra (dual
// signs apne se 5wein sign se shuru hote hain). Teeno classical rules
// is ek formula mein khud ba khud aa jate hain.
'use strict';

const {
  RASI_NAMES_URDU,
  RASI_NAMES_LATIN,
  SIGN_LORDS,
  PLANET_ABBR,
  PLANET_COLOR_VAR,
  PLANET_NAME_URDU,
  planetDignity,
  houseFromReference,
} = require('./astro-engine');

const NAVAMSA_SPAN = 30 / 9; // 3°20'

function navamsaSignId(rasiId, degreeInSign) {
  if (typeof rasiId !== 'number') return null;
  let d = typeof degreeInSign === 'number' ? degreeInSign : 0;
  if (d < 0) d = 0;
  if (d >= 30) d = 29.999; // guard: theek 30° edge case
  const pada = Math.floor(d / NAVAMSA_SPAN); // 0..8
  return ((rasiId * 9) + pada) % 12;
}

/**
 * `data` woh poora object hai jo buildZaichaData() return karta hai
 * (server.js is se already `const data = buildZaichaData(...)` bana chuka
 * hota hai) — is liye ye function koi nayi API call nahi karta, sirf
 * pehle se maujood natal degrees par formula apply karta hai. Bilkul
 * free feature, jaisa Yoga Detection hai.
 */
function buildNavamsaChart(data) {
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  const ascendantDegree = (data.natal && data.natal.ascendantDegree) || 0;

  if (typeof ascendantRasiId !== 'number') return null;

  const navAscSignId = navamsaSignId(ascendantRasiId, ascendantDegree);
  if (navAscSignId === null) return null;

  const houses = [];
  for (let h = 1; h <= 12; h++) {
    const signId = (navAscSignId + (h - 1)) % 12;
    const lordPlanet = SIGN_LORDS[signId];
    const lordNatalD9 = navamsaSignId(
      natalMap[lordPlanet] ? natalMap[lordPlanet].rasiId : null,
      natalMap[lordPlanet] ? natalMap[lordPlanet].degree : null
    );
    houses.push({
      n: h,
      signId,
      sign: RASI_NAMES_URDU[signId],
      signLatin: RASI_NAMES_LATIN[signId],
      lord: PLANET_NAME_URDU[lordPlanet] || lordPlanet,
      // D9 mein lord ki dignity bhi D9 ki rasi se hi tay hoti hai, D1 se nahi
      lordDignity: lordNatalD9 !== null ? planetDignity(lordPlanet, lordNatalD9) : 'neutral',
      planets: [],
    });
  }

  const planetNavSign = {};
  for (const name of Object.keys(natalMap)) {
    const p = natalMap[name];
    if (typeof p.rasiId !== 'number') continue;
    const navSign = navamsaSignId(p.rasiId, p.degree);
    if (navSign === null) continue;
    planetNavSign[name] = navSign;
    const houseNum = houseFromReference(navSign, navAscSignId);
    houses[houseNum - 1].planets.push({
      abbr: PLANET_ABBR[name] || name.slice(0, 2),
      name,
      color: PLANET_COLOR_VAR[name] || 'var(--text-muted)',
      dignity: planetDignity(name, navSign),
      isRetrograde: !!p.isRetrograde,
    });
  }
  houses[0].planets.unshift({
    abbr: 'Lg',
    name: 'Ascendant',
    color: PLANET_COLOR_VAR.Ascendant,
    isRetrograde: false,
  });

  // Vargottama: agar koi graha D1 aur D9 dono mein EK HI rasi mein ho, to
  // wo "vargottama" kehlata hai — classical tor par bohot mazboot mana
  // jata hai. Chhota lekin bohot value wala insight, front-end isay
  // highlight kar sakta hai.
  const vargottamaPlanets = Object.keys(natalMap).filter((name) => {
    const p = natalMap[name];
    return typeof p.rasiId === 'number' && planetNavSign[name] === p.rasiId;
  });

  return {
    ascendantSignId: navAscSignId,
    ascendantSignName: RASI_NAMES_URDU[navAscSignId],
    ascendantSignLatin: RASI_NAMES_LATIN[navAscSignId],
    houses,
    planetSigns: planetNavSign,
    vargottamaPlanets,
  };
}

module.exports = { buildNavamsaChart, navamsaSignId };
