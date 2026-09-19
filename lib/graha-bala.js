// lib/graha-bala.js
//
// "Graha Bala" (Planetary Strength Score) — Phase 2 ka pehla item, OMNIS-7
// jaisay professional software ke "Shad Bala/Vimshopak" feature se inspire
// ho kar. Classical Shad Bala poore 6 factors (Sthana, Dig, Kala, Cheshta,
// Naisargika, Drik Bala) par mabni hota hai.
//
// AKSRA ka apna usool yahan follow kiya gaya hai: "assumption ko fact ki
// tarah pesh mat karo." Cheshta Bala (motional strength) ko theek se
// nikalne ke liye graha ki ROZANA RAFTAR (daily speed in degrees) chahiye
// hoti hai — Prokerala ka planet-position response ye field nahi deta
// (sirf rasi + degree + is_retrograde boolean milta hai). Isi tarah poora
// Kala Bala (Hora/Dina/Masa/Varsha Bala, Ayana Bala) ke liye sunrise-sunset
// aur calendar-lord tables chahiye jo abhi wire nahi hain. Is liye ye
// module EK POORA "textbook Shad Bala" hone ka dawa NAHI karta — ye 5
// classical factors (jo maujood data se sahih tareeqe se nikal saktay
// hain) ka combined score hai, aur Naisargika Bala (fixed classical
// constant) alag se, sirf reference ke tor par, dikhata hai. Ye baat
// UI mein bhi saaf likhi gayi hai (index.html ka "grahaBalaNote").
//
// Sirf 7 classical graha (Sun...Saturn) — Rahu/Ketu classically Shad Bala
// mein shamil nahi hote (ye khud bhi classical/textbook rule hai, kotahi
// nahi).
'use strict';

const {
  SIGN_LORDS,
  PLANET_NAME_URDU,
  houseFromReference,
  absoluteLongitude,
  angularDistance,
  EXALTATION_RASI,
} = require('./astro-engine');
const { ASPECT_OFFSETS } = require('./narrative');

const CLASSICAL_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// Exact exaltation degree (0-30, within the exaltation rasi) — classical
// Parashari values (Brihat Parashara Hora Shastra).
const EXALT_DEGREE = { Sun: 10, Moon: 3, Mars: 28, Mercury: 15, Jupiter: 5, Venus: 27, Saturn: 20 };

// Naisargika (natural/inherent) Bala — fixed classical constants in
// Virupas (1 Rupa = 60 Virupas). Ye kisi bhi kundli mein NAHI badalte,
// har insaan ke liye same hain — is liye percent-score mein shamil nahi
// kiye gaye, sirf FYI ke tor par dikhaye jate hain.
const NAISARGIKA_BALA = {
  Sun: 60, Moon: 51.43, Venus: 42.86, Mercury: 25.71, Mars: 17.14, Jupiter: 34.29, Saturn: 8.57,
};
// (Note: classical order by natural strength is Sun>Moon>Venus>Jupiter>Mercury>Mars>Saturn
// — kept as-is from BPHS constants above.)

// Dig Bala — har graha ka "sab se mazboot ghar" (jahan poori 60 Virupa
// milti hai); iske theek ulta (opposite) ghar mein 0 milti hai.
const DIG_STRONG_HOUSE = { Sun: 10, Mars: 10, Moon: 4, Venus: 4, Jupiter: 1, Mercury: 1, Saturn: 7 };

function houseOfPlanet(natalMap, ascendantRasiId, planet) {
  if (!natalMap[planet] || typeof natalMap[planet].rasiId !== 'number') return null;
  return houseFromReference(natalMap[planet].rasiId, ascendantRasiId);
}

/** Uchcha Bala (0-60) — debilitation point se angular fasla / 3. */
function uchchaBala(planet, rasiId, degree) {
  const exaltRasi = EXALTATION_RASI[planet];
  if (typeof exaltRasi !== 'number') return 0;
  const exaltLon = absoluteLongitude(exaltRasi, EXALT_DEGREE[planet]);
  const debilLon = (exaltLon + 180) % 360;
  const planetLon = absoluteLongitude(rasiId, degree || 0);
  const dist = angularDistance(planetLon, debilLon); // 0 (debilitation) .. 180 (exaltation)
  return dist / 3;
}

/** Kendradi Bala (15/30/60) — ghar ki qisam (Kendra/Panapara/Apoklima) se. */
function kendradiBala(house) {
  if ([1, 4, 7, 10].includes(house)) return 60;
  if ([2, 5, 8, 11].includes(house)) return 30;
  return 15;
}

/** Dig Bala (0-60) — apne "strong ghar" se kitna door hai, us hisab se. */
function digBala(planet, house) {
  const strong = DIG_STRONG_HOUSE[planet];
  if (!strong || !house) return 0;
  const diff = Math.abs(house - strong) % 12;
  const circDist = Math.min(diff, 12 - diff); // 0 (strong ghar) .. 6 (theek ulta ghar)
  return 60 * (1 - circDist / 6);
}

/**
 * Drik Bala (simplified, -60 se +60) — doosre classical grahas ki nazar
 * (Parashari aspect) is graha par kitni "achi" ya "buri" par rahi hai.
 * Mustaqil (natural) benefic/malefic ki jagah, Moon ka apna paksha
 * (waxing/waning) use hota hai (classical rule), Mercury neutral rehta
 * hai (kyunke uski nature sirf saath baithe graha se tay hoti hai, jo
 * yahan separate se check nahi ki gayi).
 */
function drikBala(natalMap, ascendantRasiId, targetPlanet, isMoonWaxing) {
  let total = 0;
  for (const other of CLASSICAL_PLANETS) {
    if (other === targetPlanet || !natalMap[other]) continue;
    const ownHouse = houseOfPlanet(natalMap, ascendantRasiId, other);
    if (!ownHouse) continue;
    const offsets = ASPECT_OFFSETS[other] || [6];
    const aspectedHouses = offsets.map((o) => ((ownHouse - 1 + o) % 12) + 1);
    const targetHouse = houseOfPlanet(natalMap, ascendantRasiId, targetPlanet);
    if (!targetHouse || !aspectedHouses.includes(targetHouse)) continue;

    let benefic;
    if (other === 'Jupiter' || other === 'Venus') benefic = true;
    else if (other === 'Mars' || other === 'Saturn' || other === 'Sun') benefic = false;
    else if (other === 'Moon') benefic = !!isMoonWaxing;
    else continue; // Mercury: neutral, is simplified model mein shamil nahi

    total += benefic ? 15 : -15;
  }
  return Math.max(-60, Math.min(60, total));
}

/** Paksha Bala (0-60) — Chand-Suraj ke darmiyan phase angle par mabni. */
function pakshaBala(planet, phaseAngle) {
  if (planet === 'Sun') return 0; // classically Sun ka apna paksha bala nahi hota
  if (planet === 'Mars' || planet === 'Saturn') return (180 - phaseAngle) / 3;
  return phaseAngle / 3; // Moon, Mercury, Jupiter, Venus
}

function strengthLabel(percent) {
  if (percent >= 70) return { key: 'strong', ur: 'مضبوط' };
  if (percent >= 40) return { key: 'average', ur: 'درمیانہ' };
  return { key: 'weak', ur: 'کمزور' };
}

function buildGrahaBala(data) {
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  if (typeof ascendantRasiId !== 'number' || !natalMap.Sun || !natalMap.Moon) return [];

  const sunLon = absoluteLongitude(natalMap.Sun.rasiId, natalMap.Sun.degree);
  const moonLon = absoluteLongitude(natalMap.Moon.rasiId, natalMap.Moon.degree);
  const phaseAngle = angularDistance(moonLon, sunLon); // 0 (amavas) .. 180 (poornima)
  // Waxing (Shukla Paksha) tabhi hota hai jab Chand, Suraj se AAGE ho
  // (forward elongation 0-180) — angularDistance khud direction nahi
  // batata, is liye alag se forward-elongation nikal kar tay karte hain.
  const forwardElongation = ((moonLon - sunLon) % 360 + 360) % 360;
  const isMoonWaxing = forwardElongation <= 180;

  const results = [];
  for (const planet of CLASSICAL_PLANETS) {
    const p = natalMap[planet];
    if (!p || typeof p.rasiId !== 'number') continue;
    const house = houseOfPlanet(natalMap, ascendantRasiId, planet);

    const uchcha = uchchaBala(planet, p.rasiId, p.degree);
    const kendradi = kendradiBala(house);
    const dig = digBala(planet, house);
    const drik = drikBala(natalMap, ascendantRasiId, planet, isMoonWaxing);
    const paksha = pakshaBala(planet, phaseAngle);

    const variableTotal = uchcha + kendradi + dig + drik + paksha;
    // Har factor ka apna min/max (Drik -60..60, baqi 0..60, Sun ka paksha
    // hamesha 0 — is liye uska range bhi 0..0) jama kar ke is graha ke
    // liye theoretical range banayi jati hai, taake percent hamesha
    // 0-100 ke andar rahe, chahe koi bhi combination ho.
    const pakshaMax = planet === 'Sun' ? 0 : 60;
    const min = 0 + 15 + 0 + -60 + 0;
    const max = 60 + 60 + 60 + 60 + pakshaMax;
    const percent = Math.max(0, Math.min(100, ((variableTotal - min) / (max - min)) * 100));
    const label = strengthLabel(percent);

    results.push({
      planet,
      nameUrdu: PLANET_NAME_URDU[planet] || planet,
      house,
      components: {
        uchchaBala: Math.round(uchcha * 100) / 100,
        kendradiBala: kendradi,
        digBala: Math.round(dig * 100) / 100,
        drikBala: drik,
        pakshaBala: Math.round(paksha * 100) / 100,
      },
      naisargikaBala: NAISARGIKA_BALA[planet],
      totalVirupas: Math.round(variableTotal * 100) / 100,
      totalRupas: Math.round((variableTotal / 60) * 100) / 100,
      percent: Math.round(percent),
      strength: label.key,
      strengthUrdu: label.ur,
    });
  }
  return results;
}

module.exports = { buildGrahaBala };
