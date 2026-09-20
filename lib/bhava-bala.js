// lib/bhava-bala.js — Bhava Bala (House Strength), OMNIS-7 feature-parity
// item (Phase 3 ROADMAP). Extends this codebase's existing simplified
// Graha Bala (lib/graha-bala.js) rather than duplicating a full textbook
// Shad Bala — same disclosed-limitation spirit as that module.
//
// AKSRA note: 2 independent sources cross-checked (VedAstro's own
// "Graha and Bhava Balas Part 13: House Strength" blog, and
// ModernAstro's "Bhava Bala" page) — both agree on the SAME 3-part
// classical formula with no contradiction:
//   Bhava Bala = Bhavadhipati Bala + Bhava Digbala + Bhava Drishti Bala
//   - Bhavadhipati Bala: the house LORD's own planetary-strength score,
//     carried over to the house it rules. Classically this is the lord's
//     full Shad Bala; since this app only computes a simplified 5-factor
//     Graha Bala (see that file's own header comment for why), THAT
//     score is what is carried over here — same transparency approach,
//     not a silent claim of textbook-exact Shad Bala.
//   - Bhava Digbala: Kendra (1/4/7/10) = 60, Panapara (2/5/8/11) = 30,
//     Apoklima (3/6/9/12) = 15 — identical rule already used for a
//     planet's own Kendradi Bala in graha-bala.js, reused here unchanged.
//   - Bhava Drishti Bala: net classical Parashari aspect ON THE HOUSE
//     ITSELF from the 7 classical planets — benefic aspect (Jupiter,
//     Venus; waxing Moon) adds, malefic (Sun, Mars, Saturn; waning Moon)
//     subtracts, Mercury neutral — same +/-15-per-aspect convention as
//     drikBala() in graha-bala.js, just aimed at a house number instead
//     of another planet's placement.
'use strict';

const { SIGN_LORDS, houseFromReference, absoluteLongitude, angularDistance } = require('./astro-engine');
const { ASPECT_OFFSETS } = require('./narrative');
const { buildGrahaBala } = require('./graha-bala');

const CLASSICAL_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

const HOUSE_LABEL_UR = ['پہلا','دوسرا','تیسرا','چوتھا','پانچواں','چھٹا','ساتواں','آٹھواں','نواں','دسواں','گیارھواں','بارھواں'];

function kendradiBala(house) {
  if ([1, 4, 7, 10].includes(house)) return 60;
  if ([2, 5, 8, 11].includes(house)) return 30;
  return 15;
}

function houseOfPlanet(natalMap, ascendantRasiId, planet) {
  if (!natalMap[planet] || typeof natalMap[planet].rasiId !== 'number') return null;
  return houseFromReference(natalMap[planet].rasiId, ascendantRasiId);
}

/** Bhava Drishti Bala (-60..+60) — 7 classical grahon ki nazar is GHAR
 * (house number) par, seedha (planet ki placement par nahi). */
function bhavaDrishtiBala(natalMap, ascendantRasiId, targetHouse, isMoonWaxing) {
  let total = 0;
  for (const planet of CLASSICAL_PLANETS) {
    const ownHouse = houseOfPlanet(natalMap, ascendantRasiId, planet);
    if (!ownHouse) continue;
    const offsets = ASPECT_OFFSETS[planet] || [6];
    const aspectedHouses = offsets.map((o) => ((ownHouse - 1 + o) % 12) + 1);
    if (!aspectedHouses.includes(targetHouse)) continue;

    let benefic;
    if (planet === 'Jupiter' || planet === 'Venus') benefic = true;
    else if (planet === 'Mars' || planet === 'Saturn' || planet === 'Sun') benefic = false;
    else if (planet === 'Moon') benefic = !!isMoonWaxing;
    else continue; // Mercury: neutral (graha-bala.js jaisa hi simplified model)

    total += benefic ? 15 : -15;
  }
  return Math.max(-60, Math.min(60, total));
}

function strengthLabel(percent) {
  if (percent >= 70) return { key: 'strong', ur: 'مضبوط', en: 'Strong' };
  if (percent >= 40) return { key: 'average', ur: 'درمیانہ', en: 'Average' };
  return { key: 'weak', ur: 'کمزور', en: 'Weak' };
}

/**
 * buildBhavaBala — `data` woh poora ZAICHA_DATA object hai. Return: 12
 * houses ki list, har ek ka combined score + uske teeno components.
 */
function buildBhavaBala(data) {
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  if (typeof ascendantRasiId !== 'number' || !natalMap.Sun || !natalMap.Moon) return [];

  const grahaBala = buildGrahaBala(data);
  const grahaBalaByPlanet = {};
  grahaBala.forEach((g) => { grahaBalaByPlanet[g.planet] = g; });

  const sunLon = absoluteLongitude(natalMap.Sun.rasiId, natalMap.Sun.degree);
  const moonLon = absoluteLongitude(natalMap.Moon.rasiId, natalMap.Moon.degree);
  const forwardElongation = ((moonLon - sunLon) % 360 + 360) % 360;
  const isMoonWaxing = forwardElongation <= 180;

  // Generic approximate normalization range — matches graha-bala.js's own
  // approach (theoretical min/max so percent always lands 0-100), using
  // that module's own worst-case lord-virupas range (-45..300).
  const LORD_MIN = -45, LORD_MAX = 300;
  const min = LORD_MIN + 0 + -60;
  const max = LORD_MAX + 60 + 60;

  const results = [];
  for (let house = 1; house <= 12; house++) {
    const signId = (ascendantRasiId + house - 1) % 12;
    const lordPlanet = SIGN_LORDS[signId];
    const lordGraha = grahaBalaByPlanet[lordPlanet];
    const bhavadhipatiBala = lordGraha ? lordGraha.totalVirupas : 0;
    const digBala = kendradiBala(house);
    const drishtiBala = bhavaDrishtiBala(natalMap, ascendantRasiId, house, isMoonWaxing);

    const total = bhavadhipatiBala + digBala + drishtiBala;
    const percent = Math.max(0, Math.min(100, ((total - min) / (max - min)) * 100));
    const label = strengthLabel(percent);

    results.push({
      house,
      houseLabelUr: HOUSE_LABEL_UR[house - 1],
      lordPlanet,
      lordHasOwnData: !!lordGraha,
      components: {
        bhavadhipatiBala: Math.round(bhavadhipatiBala * 100) / 100,
        bhavaDigBala: digBala,
        bhavaDrishtiBala: drishtiBala,
      },
      totalVirupas: Math.round(total * 100) / 100,
      totalRupas: Math.round((total / 60) * 100) / 100,
      percent: Math.round(percent),
      strength: label.key,
      strengthUrdu: label.ur,
      strengthEn: label.en,
    });
  }
  return results;
}

module.exports = { buildBhavaBala };
