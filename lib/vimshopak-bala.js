// lib/vimshopak-bala.js — Vimshopak Bala (Shadvarga-based 20-point
// strength score), OMNIS-7 feature-parity item (Phase 3 ROADMAP, task 39).
//
// AKSRA note — do hisso mein research hui:
//
// (1) Shadvarga WEIGHT table — 2 mustaqil sources se confirmed, koi
//     ikhtilaf nahi (astrosaxena.com AUR theartofvedicastrology.com):
//       D1 (Rasi) = 6, D2 (Hora) = 2, D3 (Drekkana) = 4, D9 (Navamsa) = 5,
//       D12 (Dwadasamsa) = 2, D30 (Trimsamsa) = 1  — total = 20.
//     D2/D3/D9/D12/D30 sign-formulas khud lib/vargas.js aur lib/navamsa.js
//     mein alag se cross-verified hain (dekhein un files ke header
//     comments).
//
// (2) Dignity-ko-POINTS convert karne wala table — YE GENUINE IKHTILAF
//     hai. Classical Vimshopaka Bala poori "Panchadha Maitri" (5-tarah ki
//     dosti: Adhi Mitra/Mitra/Sama/Shatru/Adhi Shatru, jo natural aur
//     temporary dono friendships jama kar ke banti hai) ke 7 darjaat
//     (Moolatrikona, Own, Great-Friend, Friend, Neutral, Enemy,
//     Great-Enemy, Debilitated) par mabni hoti hai. Do sources check
//     kiye: ek clear 20/18/15/10/7/5/0-jaisa point-table deta hai, doosra
//     iske bajaye ek "commenter ka uncertain alternate percentage scale"
//     bayan karta hai — matlab khud us dusre source ko bhi apne table par
//     poora yaqeen nahi. Is codebase mein Panchadha Maitri (graha-graha
//     dosti ka poora table) kahin implement nahi hui (na hi kisi aur
//     module mein) — poora 7-darja table banane ke liye ye naya, bada
//     infrastructure chahiye hoga.
//
//     FAISLA (disclosed simplification, graha-bala.js/bhava-bala.js jaisa
//     spirit): iski bajaye is app ki apni maujooda, saada dignity
//     categories (astro-engine.js ka planetDignity(): 'exalted' / 'own' /
//     'neutral' / 'debilitated') istemal ki gayi hain, in 4 categories ko
//     ek monotonic 0-20 point scale par map kar ke:
//       exalted = 20, own = 18, neutral = 10, debilitated = 2
//     Ye poori classical 7-darja table ka SAHIH badal (substitute) hone ka
//     dawa nahi karta — sirf ek transparent, reasonably-graded approximation
//     hai jab tak Panchadha Maitri wire na ho. UI mein bhi yehi baat saaf
//     likhi gayi hai.
'use strict';

const { SIGN_LORDS, PLANET_NAME_URDU, planetDignity } = require('./astro-engine');
const { navamsaSignId } = require('./navamsa');
const { horaSignId, drekkanaSignId, dwadasamsaSignId, trimsamsaSignId } = require('./vargas');

const CLASSICAL_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// Shadvarga weights (total = 20) — cross-verified, no dispute (see header).
const VARGA_WEIGHTS = { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 };
const TOTAL_WEIGHT = 20;

// Dignity -> points (0-20 scale) — DISCLOSED SIMPLIFICATION, see header.
const DIGNITY_POINTS = { exalted: 20, own: 18, neutral: 10, debilitated: 2 };

function dignityPoints(planet, signId) {
  if (typeof signId !== 'number') return null;
  const dignity = planetDignity(planet, signId);
  return DIGNITY_POINTS[dignity] != null ? DIGNITY_POINTS[dignity] : DIGNITY_POINTS.neutral;
}

function strengthLabel(percent) {
  if (percent >= 70) return { key: 'strong', ur: 'مضبوط', en: 'Strong' };
  if (percent >= 40) return { key: 'average', ur: 'درمیانہ', en: 'Average' };
  return { key: 'weak', ur: 'کمزور', en: 'Weak' };
}

/**
 * buildVimshopakBala — `data` woh poora ZAICHA_DATA object hai. Har
 * classical planet (Sun...Saturn) ke liye 6 varga charts (D1/D2/D3/D9/
 * D12/D30) mein uski dignity nikal kar, Shadvarga weights se weighted-
 * average lete hain — result hamesha 0-20 range mein (classical
 * "Vimshopaka" naam isi 20-point scale se aata hai).
 */
function buildVimshopakBala(data) {
  const natalMap = (data.natal && data.natal.planets) || {};
  if (!natalMap.Sun || !natalMap.Moon) return [];

  const results = [];
  for (const planet of CLASSICAL_PLANETS) {
    const p = natalMap[planet];
    if (!p || typeof p.rasiId !== 'number') continue;
    const rasiId = p.rasiId;
    const degree = p.degree || 0;

    const vargaSigns = {
      D1: rasiId,
      D2: horaSignId(rasiId, degree),
      D3: drekkanaSignId(rasiId, degree),
      D9: navamsaSignId(rasiId, degree),
      D12: dwadasamsaSignId(rasiId, degree),
      D30: trimsamsaSignId(rasiId, degree),
    };

    const components = {};
    let weightedSum = 0;
    for (const varga of Object.keys(VARGA_WEIGHTS)) {
      const signId = vargaSigns[varga];
      const points = dignityPoints(planet, signId);
      const weight = VARGA_WEIGHTS[varga];
      components[varga] = {
        signId,
        dignity: signId != null ? planetDignity(planet, signId) : 'neutral',
        points,
        weight,
      };
      weightedSum += (points != null ? points : DIGNITY_POINTS.neutral) * weight;
    }

    const vimshopakBala = weightedSum / TOTAL_WEIGHT; // 0-20 scale
    const percent = Math.max(0, Math.min(100, (vimshopakBala / 20) * 100));
    const label = strengthLabel(percent);

    results.push({
      planet,
      nameUrdu: PLANET_NAME_URDU[planet] || planet,
      nameLatin: planet,
      components,
      vimshopakBala: Math.round(vimshopakBala * 100) / 100,
      percent: Math.round(percent),
      strength: label.key,
      strengthUrdu: label.ur,
      strengthEn: label.en,
    });
  }
  return results;
}

module.exports = { buildVimshopakBala, VARGA_WEIGHTS, DIGNITY_POINTS };
