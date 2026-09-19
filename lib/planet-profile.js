// lib/planet-profile.js
//
// Per-planet "deep profile" — Phase 1 ka teesra/aakhri item (Yoga
// Detection aur Navamsa ke baad), OMNIS-7-jaisa "Degrees" button/panel se
// inspire ho kar. Har graha ka ek jagah pura profile: sign, house, exact
// degree, nakshatra + pada + us nakshatra ka Vimshottari lord, classical
// dignity, retrograde/combust status, aur Navamsa (D9) placement.
//
// Bilkul free — koi nayi API call nahi, sirf pehle se maujood
// buildZaichaData() + buildNavamsaChart() ke output par based hai.
'use strict';

const {
  RASI_NAMES_URDU,
  PLANET_NAME_URDU,
  PLANET_COLOR_VAR,
  planetDignity,
  houseFromReference,
  absoluteLongitude,
  nakshatraFromLongitude,
} = require('./astro-engine');

// Nakshatra lords: classical Vimshottari cycle, Ashwini se shuru, 9
// grahas ka fixed sequence har 9 nakshatra ke baad repeat hota hai
// (27 / 9 = 3 pura chakar). Ye public-domain classical fact hai (Brihat
// Parashara Hora Shastra), kisi proprietary software se nahi liya gaya.
const NAKSHATRA_LORD_CYCLE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];

const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

const DIGNITY_LABEL_UR = {
  exalted: 'اعلیٰ (Exalted)',
  own: 'اپنا گھر (Own Sign)',
  debilitated: 'کمزور (Debilitated)',
  neutral: 'درمیانہ',
};

function buildPlanetProfiles(data) {
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  const combustSet = new Set(data.combustPlanets || []);
  const navamsa = data.navamsa || null;

  const profiles = [];
  for (const name of PLANET_ORDER) {
    const p = natalMap[name];
    if (!p || typeof p.rasiId !== 'number') continue;

    const lon = absoluteLongitude(p.rasiId, p.degree);
    const nak = nakshatraFromLongitude(lon);
    const dignity = planetDignity(name, p.rasiId);
    const houseNum = typeof ascendantRasiId === 'number' ? houseFromReference(p.rasiId, ascendantRasiId) : null;
    const navSign = navamsa && navamsa.planetSigns ? navamsa.planetSigns[name] : null;
    const isVargottama = !!(navamsa && navamsa.vargottamaPlanets && navamsa.vargottamaPlanets.indexOf(name) !== -1);

    profiles.push({
      name,
      nameUrdu: PLANET_NAME_URDU[name] || name,
      color: PLANET_COLOR_VAR[name] || 'var(--text-muted)',
      signId: p.rasiId,
      sign: RASI_NAMES_URDU[p.rasiId],
      degree: typeof p.degree === 'number' ? `${Math.floor(p.degree)}°${Math.round((p.degree % 1) * 60)}'` : null,
      house: houseNum,
      nakshatra: nak.nameUrdu,
      nakshatraLatin: nak.nameLatin,
      pada: nak.pada,
      nakshatraLord: NAKSHATRA_LORD_CYCLE[nak.index % 9],
      nakshatraLordUrdu: PLANET_NAME_URDU[NAKSHATRA_LORD_CYCLE[nak.index % 9]] || NAKSHATRA_LORD_CYCLE[nak.index % 9],
      dignity,
      dignityLabel: DIGNITY_LABEL_UR[dignity] || DIGNITY_LABEL_UR.neutral,
      isRetrograde: !!p.isRetrograde,
      isCombust: combustSet.has(name),
      navamsaSign: typeof navSign === 'number' ? RASI_NAMES_URDU[navSign] : null,
      isVargottama,
    });
  }
  return profiles;
}

module.exports = { buildPlanetProfiles, NAKSHATRA_LORD_CYCLE };
