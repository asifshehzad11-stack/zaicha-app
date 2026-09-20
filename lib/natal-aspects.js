// lib/natal-aspects.js — "Planetary Aspects view" (Task 42, ROADMAP Phase
// 3). Ab tak is app mein Parashari drishti (graha-drishti) ka fixed offset
// table (`ASPECT_OFFSETS`, lib/narrative.js) sirf 2 jagah istemal hota tha
// — Transit Aspects (gochar planet -> natal HOUSE significations) aur
// Bhava Drishti Bala/Drik Bala (aggregate +/-15 score) — lekin kisi ne
// khud NATAL planet-to-planet drishti (kaunsa graha kis doosre graha ko
// dekh raha hai) seedha list nahi ki thi. Ye module wahi karta hai, koi
// naya formula nahi (poora ASPECT_OFFSETS table reuse hota hai, jo pehle
// se hi is codebase mein cross-verified/established hai) — sirf ek naya
// PRESENTATION (kis planet ki kis planet par nazar hai, natal chart mein).
'use strict';

const { SIGN_LORDS, PLANET_NAME_URDU, houseFromReference } = require('./astro-engine');
const { ASPECT_OFFSETS } = require('./narrative');

const ASPECT_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function houseOfPlanet(natalMap, ascendantRasiId, planet) {
  if (!natalMap[planet] || typeof natalMap[planet].rasiId !== 'number') return null;
  return houseFromReference(natalMap[planet].rasiId, ascendantRasiId);
}

function planetsInHouse(houseOccupants, house) {
  return houseOccupants[house] || [];
}

/**
 * buildNatalAspects — `data` poora ZAICHA_DATA object. Har planet ke
 * liye: woh kaunse gharon/planeton ko dekh raha hai ("outgoing"), aur
 * usay kaun-kaun dekh raha hai ("incoming") — dono taraf se, taake UI
 * "mutual aspect" (dono ek doosre ko dekh rahay hon) bhi highlight kar
 * sake.
 */
function buildNatalAspects(data) {
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  if (typeof ascendantRasiId !== 'number') return [];

  const houseOfEach = {};
  const houseOccupants = {};
  for (const planet of ASPECT_PLANETS) {
    const house = houseOfPlanet(natalMap, ascendantRasiId, planet);
    if (!house) continue;
    houseOfEach[planet] = house;
    if (!houseOccupants[house]) houseOccupants[house] = [];
    houseOccupants[house].push(planet);
  }

  // Pehle har planet ki "outgoing" aspects nikal lein (kis-kis house ko,
  // aur wahan kaun se planets baithe hain).
  const outgoing = {};
  for (const planet of ASPECT_PLANETS) {
    const fromHouse = houseOfEach[planet];
    if (!fromHouse) continue;
    const offsets = ASPECT_OFFSETS[planet] || [6];
    outgoing[planet] = offsets.map((offset) => {
      const toHouse = ((fromHouse - 1 + offset) % 12) + 1;
      const occupants = planetsInHouse(houseOccupants, toHouse).filter((p) => p !== planet);
      return { toHouse, occupants };
    });
  }

  // Ab "incoming" reverse-lookup: is planet ke apne HOUSE ko kaun-kaun
  // (doosre planets) dekh rahe hain.
  const incoming = {};
  for (const planet of ASPECT_PLANETS) {
    incoming[planet] = [];
  }
  for (const sourcePlanet of ASPECT_PLANETS) {
    if (!outgoing[sourcePlanet]) continue;
    for (const asp of outgoing[sourcePlanet]) {
      for (const targetPlanet of planetsInHouse(houseOccupants, asp.toHouse)) {
        if (targetPlanet === sourcePlanet) continue;
        incoming[targetPlanet].push(sourcePlanet);
      }
    }
  }

  const results = [];
  for (const planet of ASPECT_PLANETS) {
    if (!houseOfEach[planet]) continue;
    const outList = (outgoing[planet] || []).filter((a) => a.occupants.length > 0);
    const inList = incoming[planet] || [];
    const mutual = outList
      .filter((a) => a.occupants.some((occ) => inList.includes(occ)))
      .flatMap((a) => a.occupants.filter((occ) => inList.includes(occ)));

    results.push({
      planet,
      nameUrdu: PLANET_NAME_URDU[planet] || planet,
      nameLatin: planet,
      house: houseOfEach[planet],
      aspectsHouses: (ASPECT_OFFSETS[planet] || [6]).map((o) => ((houseOfEach[planet] - 1 + o) % 12) + 1),
      aspectsPlanets: outList.map((a) => ({ house: a.toHouse, planets: a.occupants })),
      aspectedByPlanets: Array.from(new Set(inList)),
      mutualAspectWith: Array.from(new Set(mutual)),
    });
  }
  return results;
}

module.exports = { buildNatalAspects, ASPECT_PLANETS };
