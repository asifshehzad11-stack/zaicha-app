// lib/jaimini-karaka.js — Multi-language (EN/UR/HI)
//
// Chara Karaka (Jaimini's "movable/changing" significators) — a SHARED
// building block noted in ROADMAP.md for two features: (1) the Karakatva
// (significations) list [Phase 3], and (2) Chara Dasha [Phase 2], which
// needs to know each planet's karaka rank before it can determine the
// dasha-sign sequence. This module only computes the karaka ranking
// itself — it does not yet build the significations text or the dasha.
//
// AKSRA principle applied here: the classical rule below was cross-checked
// against THREE independent sources before writing this code (all three
// agree on the core ranking rule and the Rahu-reversal rule):
//   - Jagannatha Hora guide: https://jagannathhora.com/chara-karakas-jaimini-complete-guide/
//   - Paramarsh: https://paramarsh.app/patrika/jaimini-astrology/jaimini-chara-karakas
//   - Shubham Alock: https://shubhamalock.com/chara-karakas/ (confirms the
//     7-karaka name list independently)
//
// Core rule (all 3 sources agree): take each planet's degree WITHIN its
// own sign (0-30, sign itself ignored) and rank planets from highest to
// lowest. Rahu is a special case — because it moves backward through the
// zodiac, its ranking degree is (30 - its actual in-sign degree), i.e.
// read in reverse. Ketu is excluded from BOTH classical schemes (no
// source disputes this).
//
// IMPORTANT — an honestly-disclosed open question, not silently resolved:
// there are TWO classical schemes in live use today, and sources do not
// agree which is "the" correct one (both are legitimately classical,
// per all 3 sources — this is a genuine tradition split, not a case
// where one side is simply wrong):
//   - 8-Karaka scheme: the 7 classical planets (Sun..Saturn) + Rahu are
//     ALL ranked together (8 planets → 8 karaka roles). This is the
//     scheme used by default here, because it is the one most widely
//     seen in contemporary Jaimini software or write-ups.
//   - 7-Karaka scheme: only the 7 classical planets are ranked (Rahu
//     excluded too); Matrikaraka then stands for BOTH parents and
//     Pitrikaraka is dropped. `karakas7` below is ALSO returned, so a
//     future screen can let the user pick a scheme rather than this
//     module silently picking one on their behalf.
//
// Tie-breaking: none of the 3 sources gives a documented classical rule
// for two planets sharing the EXACT same degree — they only note this is
// "vanishingly rare" once minutes/seconds are used. Since this codebase's
// planet degrees carry decimal precision (not rounded to whole degrees),
// an exact tie is a near-impossibility here too; if one ever occurs, this
// module breaks it by fixed planet order (Sun..Saturn, Rahu) rather than
// inventing a "classical" rule that isn't documented anywhere.
'use strict';

const { normLang } = require('./narrative');
const { RASI_NAMES_URDU, RASI_NAMES_LATIN, houseFromReference } = require('./astro-engine');

// 8-Karaka scheme order (rank 1 = highest degree ... rank 8 = lowest).
const KARAKA_ORDER_8 = [
  'atmakaraka', 'amatyakaraka', 'bhratrikaraka', 'matrikaraka',
  'pitrikaraka', 'putrakaraka', 'gnatikaraka', 'darakaraka',
];
// 7-Karaka scheme order — same names minus pitrikaraka (matrikaraka
// covers both parents in this scheme).
const KARAKA_ORDER_7 = [
  'atmakaraka', 'amatyakaraka', 'bhratrikaraka', 'matrikaraka',
  'putrakaraka', 'gnatikaraka', 'darakaraka',
];

const KARAKA_LABEL_UR = {
  atmakaraka: 'آتما کارک (خود، روح، شخصیت)',
  amatyakaraka: 'امات کارک (پیشہ، مشورہ دینے والا)',
  bhratrikaraka: 'بھراتر کارک (بہن بھائی، ہمت)',
  matrikaraka: 'ماترو کارک (والدہ، گھر)',
  pitrikaraka: 'پتری کارک (والد)',
  putrakaraka: 'پتر کارک (اولاد)',
  gnatikaraka: 'گناتی کارک (رشتہ دار، مقابلہ)',
  darakaraka: 'دارا کارک (شریکِ حیات)',
};
const KARAKA_LABEL_EN = {
  atmakaraka: 'Atmakaraka (self, soul)',
  amatyakaraka: 'Amatyakaraka (career, counsel)',
  bhratrikaraka: 'Bhratrikaraka (siblings, courage)',
  matrikaraka: 'Matrikaraka (mother, home)',
  pitrikaraka: 'Pitrikaraka (father)',
  putrakaraka: 'Putrakaraka (children)',
  gnatikaraka: 'Gnatikaraka (relatives, competition)',
  darakaraka: 'Darakaraka (spouse)',
};

// Rahu classically has no fixed sign-lordship, so it is not part of
// SIGN_LORDS — but it DOES participate in the 8-karaka ranking. Ketu is
// excluded from ranking entirely in both schemes (per all 3 sources).
const PLANETS_FOR_8_KARAKA = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'];
const PLANETS_FOR_7_KARAKA = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// ---- Naisargika Karaka (fixed/natural significators) — Phase 3 ka
// "Karakatva" item ka pehla hissa (Chara Karaka doosra hissa hai, upar
// dekhein). Ye table CHART-INDEPENDENT hai — har insaan ke liye same
// rehti hai (Sun hamesha baap/rooh ka karaka hai, chahe kisi ki bhi
// kundli ho) — is liye koi natal data ki zaroorat nahi, sirf ek fixed
// dictionary hai.
//
// AKSRA note: 2 independent sources se cross-verify kiya (dono ka
// mazmoon match karta hai, koi tazad nahi mila — is table par kisi
// tarah ka lineage-dispute nahi hai jaisa Chara Dasha mein mila):
//   - Steer (condensed modern list): https://steer.coach/karakas-significators/
//   - Phaladeepika (classical text, "Thoughts on Jyotish" summary):
//     https://medium.com/thoughts-on-jyotish/using-karakas-for-fine-tuning-the-judgement-of-a-horoscope-767e7d13239e
// Sirf 7 classical graha (Rahu/Ketu ka naisargika karakatva alag-alag
// texts mein mukhtalif tareeqe se bataya jata hai, koi wahid mustanad
// list nahi mili — is liye, Graha Bala ki tarah, yahan bhi Rahu/Ketu
// shamil nahi kiye gaye).
const NAISARGIKA_KARAKA_UR = {
  Sun: 'خود، روح، والد، صحت و توانائی، عزت و اختیار',
  Moon: 'ذہن، جذبات، والدہ، گھر، سکون',
  Mars: 'ہمت، توانائی، بہن بھائی (خصوصاً بھائی)، زمین جائیداد',
  Mercury: 'ذہانت، گفتگو و تحریر، تعلیم، ہنر، تجارت',
  Jupiter: 'حکمت و علم، عقیدہ، دولت و خوش قسمتی، اولاد',
  Venus: 'محبت و شادی، شریکِ حیات، خوبصورتی و فن، آرام و عیش',
  Saturn: 'نظم و محنت، وقت، بڑھاپا و عمر، مشکلات میں صبر، ملازمت',
};
const NAISARGIKA_KARAKA_EN = {
  Sun: 'Self, soul, father, vitality and health, authority and status',
  Moon: 'Mind and emotions, mother, home, comfort',
  Mars: 'Courage, energy and drive, siblings (especially brothers), land and property',
  Mercury: 'Intelligence, speech and writing, learning, skill, commerce',
  Jupiter: 'Wisdom and knowledge, faith, wealth and fortune, children',
  Venus: 'Love and marriage, the spouse, beauty and art, comfort and pleasure',
  Saturn: 'Discipline and labour, time, old age and longevity, patience under hardship, service',
};
const NAISARGIKA_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function buildNaisargikaKarakas(lang) {
  return NAISARGIKA_PLANETS.map((planet) => ({
    planet,
    signification: lang === 'ur' ? NAISARGIKA_KARAKA_UR[planet] : NAISARGIKA_KARAKA_EN[planet],
  }));
}

function karakaLabel(key, lang) {
  return lang === 'ur' ? KARAKA_LABEL_UR[key] : KARAKA_LABEL_EN[key];
}

/** Ranking degree (0-30) — Rahu ka hisaab ulta (reverse) hota hai. */
function rankingDegree(planet, degreeInSign) {
  const d = degreeInSign || 0;
  return planet === 'Rahu' ? (30 - d) : d;
}

function rankPlanets(natalMap, planetList) {
  const rows = planetList
    .filter((name) => natalMap[name] && typeof natalMap[name].rasiId === 'number')
    .map((name, idx) => ({
      planet: name,
      rasiId: natalMap[name].rasiId,
      degreeInSign: natalMap[name].degree || 0,
      rankingDegree: rankingDegree(name, natalMap[name].degree),
      fixedOrderIdx: idx, // tie-break fallback — Sun..Saturn, Rahu order
    }));
  rows.sort((a, b) => (b.rankingDegree - a.rankingDegree) || (a.fixedOrderIdx - b.fixedOrderIdx));
  return rows;
}

function buildScheme(natalMap, planetList, karakaOrder, ascendantRasiId, lang) {
  const ranked = rankPlanets(natalMap, planetList);
  return ranked.map((row, i) => {
    const key = karakaOrder[i];
    if (!key) return null; // (safety — shouldn't happen, list lengths match)
    return {
      karakaKey: key,
      karakaLabel: karakaLabel(key, lang),
      rank: i + 1,
      planet: row.planet,
      degreeInSign: Math.round(row.degreeInSign * 100) / 100,
      sign: RASI_NAMES_URDU[row.rasiId],
      signLatin: RASI_NAMES_LATIN[row.rasiId],
      house: typeof ascendantRasiId === 'number' ? houseFromReference(row.rasiId, ascendantRasiId) : null,
    };
  }).filter(Boolean);
}

/**
 * buildCharaKarakas — `data` woh poora ZAICHA_DATA object hai jo
 * buildZaichaData() banata hai. Return shape: { scheme: 'eight', karakas:
 * [...8-karaka list, rank 1..8...], karakas7: [...7-karaka list...],
 * atmakaraka: <8-karaka scheme ka AK row> }.
 *
 * `karakas` (8-scheme) UI ka default hai; `karakas7` sirf reference ke
 * liye saath diya gaya hai (dekhein upar ka "IMPORTANT" note) — future
 * mein agar user ko scheme choose karne dena ho to dono maujood hain.
 */
function buildCharaKarakas(data, lang) {
  lang = normLang(lang);
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  if (!natalMap.Sun || !natalMap.Moon) return null;

  const karakas = buildScheme(natalMap, PLANETS_FOR_8_KARAKA, KARAKA_ORDER_8, ascendantRasiId, lang);
  const karakas7 = buildScheme(natalMap, PLANETS_FOR_7_KARAKA, KARAKA_ORDER_7, ascendantRasiId, lang);

  return {
    scheme: 'eight',
    karakas,
    karakas7,
    atmakaraka: karakas.find((k) => k.karakaKey === 'atmakaraka') || null,
    naisargika: buildNaisargikaKarakas(lang),
  };
}

module.exports = { buildCharaKarakas, KARAKA_ORDER_8, KARAKA_ORDER_7 };
