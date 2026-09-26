// lib/kundli-milan.js — "Kundli Milan" (Ashtakoot Guna Milan, shadi ki
// mutabiqat/compatibility) feature (Task 47, ROADMAP Phase 3). Ye classical
// tareeqa DO logon ke sirf MOON ki rashi + nakshatra ka mowazna karta hai
// (poori birth chart ki zaroorat nahi) — 8 "koota" (categories), total
// 36 points.
//
// AKSRA note — har koota 2+ independent sources se cross-verify kiya gaya
// hai (jahan sirf EK source mila — jaise Yoni/Vashya ki poori matrix, aur
// Nadi/Gana ki nakshatra-list — wo saravali.github.io se hai, jo ek
// astrology-SOFTWARE project hai, is liye code-grade precise hone ka
// zyada imkaan hai; phir bhi neeche har jagah disclose kiya gaya hai jahan
// sirf 1 source mila):
//   - astrolozyy.com/blogs/astrology/kundali-matching-points-guide.html
//   - saravali.github.io/astrology/koota_*.html (Varna/Vashya/Yoni/Gana/
//     Nadi/Tara ki detailed tables — ek khula-source astrology calculator)
//   - vedicka.com/planetary-friendship-enmity (Graha Maitri table)
//   Total score interpretation (0-17 incompatible, 18-24 average, 25-32
//   good, 33-36 excellent) DO independent sources (astrolozyy +
//   jagannathhora.com) mein HUBAHU match karta hai.
//
// DISCLOSED SIMPLIFICATION (Gana Koota scoring): 2 alag versions milay —
// (1) astrolozyy jaisi ZYADA-MASHOOR, SYMMETRIC table (Same=6, Deva-
// Manushya=5, Manushya-Rakshasa=1, Deva-Rakshasa=0 — bride/groom order se
// farq nahi), (2) saravali ka ek ASYMMETRIC version (order/gender ke
// hisab se score badalta hai). Sirf saravali (1 hi source) mein
// asymmetric version mila, is liye YAHAN ZYADA-MASHOOR SYMMETRIC version
// istemal kiya gaya hai (jo bhi ziyada mustanad/commonly-cited hai) —
// asymmetric version disclosed-out hai.
//
// DISCLOSED SIMPLIFICATION (Nadi Dosha cancellation): kuch sources mein
// "agar dono ka nakshatra bilkul ALAG ho (sirf Nadi wohi ho) to dosha
// cancel" jaisa ek istisna (exception) zikar milta hai, lekin iski exact
// shart clear/mustanad tor par 2 sources se confirm nahi hui (aur
// saravali jaisay code-grade source mein koi exception zikar nahi) — is
// liye YAHAN sirf seedha "alag Nadi=8, same Nadi=0" rule follow kiya gaya
// hai, koi cancellation exception implement nahi (disclosed).
//
// DISCLOSED (Bhakoot cancellation): agar dono Moon-rashi ke lord (a) same
// hon, ya (b) is app ki mojooda Naisargika Graha Maitri table ke mutabiq
// "friend" hon, to Bhakoot Dosha maaf/cancel samjha jata hai (astrolozyy
// se confirmed) — is app ki apni maujooda Graha Maitri table (isi module
// mein neeche) reuse hoti hai.
//
// SCOPE: ye sirf ASHTAKOOT (North Indian, 8-koota, 36-point) system hai —
// Dashakoot/Porutham (South Indian, 10-koota) system ALAG hai aur yahan
// shamil nahi. Mangal Dosha (Kuja Dosha) bhi is v1 mein shamil NAHI (alag,
// bada feature hoga — har chart mein Mars ki placement dekh kar match
// karna).
'use strict';

const { RASI_NAMES_URDU, RASI_NAMES_LATIN, SIGN_LORDS, PLANET_NAME_URDU, NAKSHATRA_NAMES_LATIN, NAKSHATRA_NAMES_URDU, houseFromReference, nakshatraFromLongitude, absoluteLongitude } = require('./astro-engine');

// ---- 1) Varna Koota (1 point) ----
// Cancer/Scorpio/Pisces=Brahmin, Aries/Leo/Sagittarius=Kshatriya,
// Taurus/Virgo/Capricorn=Vaishya, Gemini/Libra/Aquarius=Shudra.
const VARNA_BY_RASI = ['kshatriya', 'vaishya', 'shudra', 'brahmin', 'kshatriya', 'vaishya', 'shudra', 'brahmin', 'kshatriya', 'vaishya', 'shudra', 'brahmin'];
const VARNA_RANK = { brahmin: 4, kshatriya: 3, vaishya: 2, shudra: 1 };
const VARNA_LABEL_UR = { brahmin: 'برہمن', kshatriya: 'کھشتری', vaishya: 'ویش', shudra: 'شودر' };

function varnaKoota(groomRasiId, brideRasiId) {
  const g = VARNA_BY_RASI[groomRasiId];
  const b = VARNA_BY_RASI[brideRasiId];
  const score = VARNA_RANK[g] >= VARNA_RANK[b] ? 1 : 0;
  return { score, max: 1, groom: g, bride: b, groomUrdu: VARNA_LABEL_UR[g], brideUrdu: VARNA_LABEL_UR[b] };
}

// ---- 2) Vashya Koota (2 points) ----
// 5 groups; Sagittarius aur Capricorn do hisson mein baटte hain (0-15°,
// 15-30°) — Sagittarius: pehla hissa Manava(insaan-jaisa dhड़), doosra
// Chatushpada(ghoड़e jaisa dhड़); Capricorn: pehla Chatushpada(bakri-sar),
// doosra Jalachara(machli-dum) — classical "Makara" ki do-tarah shakl.
function vashyaGroup(rasiId, degreeInSign) {
  if (rasiId === 0 || rasiId === 1) return 'chatushpada'; // Aries, Taurus
  if (rasiId === 2 || rasiId === 5 || rasiId === 6 || rasiId === 10) return 'manava'; // Gemini, Virgo, Libra, Aquarius
  if (rasiId === 3 || rasiId === 11) return 'jalachara'; // Cancer, Pisces
  if (rasiId === 4) return 'vanachara'; // Leo
  if (rasiId === 7) return 'keeta'; // Scorpio
  if (rasiId === 8) return degreeInSign < 15 ? 'manava' : 'chatushpada'; // Sagittarius
  if (rasiId === 9) return degreeInSign < 15 ? 'chatushpada' : 'jalachara'; // Capricorn
  return 'manava';
}
// Matrix source: saravali.github.io/astrology/koota_vashya.html (order:
// chatushpada, manava, jalachara, vanachara, keeta). [bride][groom].
const VASHYA_ORDER = ['chatushpada', 'manava', 'jalachara', 'vanachara', 'keeta'];
const VASHYA_MATRIX = [
  [2, 0, 0, 0.5, 0],
  [1, 2, 1, 0.5, 1],
  [0.5, 1, 2, 1, 1],
  [0, 0, 0, 2, 0],
  [1, 1, 1, 0, 2],
];
const VASHYA_LABEL_UR = { chatushpada: 'چوپایہ', manava: 'انسان نما', jalachara: 'آبی', vanachara: 'جنگلی (شیر)', keeta: 'کیڑا (بچھو)' };

function vashyaKoota(groomRasi, brideRasi) {
  const g = vashyaGroup(groomRasi.rasiId, groomRasi.degree);
  const b = vashyaGroup(brideRasi.rasiId, brideRasi.degree);
  const score = VASHYA_MATRIX[VASHYA_ORDER.indexOf(b)][VASHYA_ORDER.indexOf(g)];
  return { score, max: 2, groom: g, bride: b, groomUrdu: VASHYA_LABEL_UR[g], brideUrdu: VASHYA_LABEL_UR[b] };
}

// ---- 3) Tara Koota (3 points) ----
// Confirmed 2 sources (astrolozyy + saravali.github.io/astrology/
// koota_dina.html), hubahu match: har taraf (bride->groom, groom->bride)
// nakshatra-count/9 ka remainder nikalein — 3,5,7 = 0 points, baaqi sab
// (1,2,4,6,8,9-yani-0) = 1.5 points; dono taraf jama kar ke total /3.
function taraRemainder(fromIdx, toIdx) {
  const count = (((toIdx - fromIdx) % 27) + 27) % 27 + 1; // 1-27, inclusive count
  const rem = ((count - 1) % 9) + 1; // 1-9
  return rem;
}
function taraKoota(groomNakIdx, brideNakIdx) {
  const remGtoB = taraRemainder(groomNakIdx, brideNakIdx);
  const remBtoG = taraRemainder(brideNakIdx, groomNakIdx);
  const BAD = [3, 5, 7];
  const half1 = BAD.includes(remGtoB) ? 0 : 1.5;
  const half2 = BAD.includes(remBtoG) ? 0 : 1.5;
  return { score: half1 + half2, max: 3, remainderGroomToBride: remGtoB, remainderBrideToGroom: remBtoG };
}

// ---- 4) Yoni Koota (4 points) ----
// 27-nakshatra -> 14-animal mapping aur 14x14 compatibility matrix, dono
// saravali.github.io/astrology/koota_yoni.html se (ek software-project
// reference, is liye code-grade precise honay ka zyada imkaan) — is app
// ke 27-nakshatra (bina Abhijit ke) system mein "Nakul/Mongoose" sirf EK
// nakshatra (Uttara Ashadha) se milta hai (baaqi 13 animals do-do se).
const YONI_BY_NAKSHATRA = [
  'horse', 'elephant', 'sheep', 'serpent', 'serpent', 'dog', 'cat', 'sheep', 'cat', 'rat', // Ashwini..Magha(9)
  'rat', 'cow', 'buffalo', 'tiger', 'buffalo', 'tiger', 'deer', 'deer', 'dog', 'monkey', // PurvaPhalguni(10)..PurvaAshadha(19)
  'mongoose', 'monkey', 'lion', 'horse', 'lion', 'cow', 'elephant', // UttaraAshadha(20)..Revati(26)
];
const YONI_LABEL_UR = {
  horse: 'گھوड़ا', elephant: 'ہاتھی', sheep: 'بھیڑ', serpent: 'سانپ', dog: 'کتا', cat: 'بلی',
  rat: 'چوہا', cow: 'گائے', buffalo: 'بھینس', tiger: 'شیر', deer: 'ہرن', monkey: 'بندر', mongoose: 'نیولا', lion: 'شیر ببر',
};
const YONI_ORDER = ['horse', 'elephant', 'sheep', 'serpent', 'dog', 'cat', 'rat', 'cow', 'buffalo', 'tiger', 'deer', 'monkey', 'mongoose', 'lion'];
const YONI_MATRIX = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [1, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 2, 4],
];

function yoniKoota(groomNakIdx, brideNakIdx) {
  const g = YONI_BY_NAKSHATRA[groomNakIdx];
  const b = YONI_BY_NAKSHATRA[brideNakIdx];
  const score = YONI_MATRIX[YONI_ORDER.indexOf(b)][YONI_ORDER.indexOf(g)];
  return { score, max: 4, groom: g, bride: b, groomUrdu: YONI_LABEL_UR[g], brideUrdu: YONI_LABEL_UR[b] };
}

// ---- 5) Graha Maitri Koota (5 points) ----
// Classical Naisargika (natural) friendship table (BPHS) — confirmed 2
// sources (astrolozyy + vedicka.com/planetary-friendship-enmity), hubahu
// match, koi tazad nahi.
const NATURAL_FRIENDSHIP = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'] },
};
function naturalRelation(fromPlanet, toPlanet) {
  if (fromPlanet === toPlanet) return 'same';
  const rel = NATURAL_FRIENDSHIP[fromPlanet];
  if (!rel) return 'neutral';
  if (rel.friends.includes(toPlanet)) return 'friend';
  if (rel.enemies.includes(toPlanet)) return 'enemy';
  return 'neutral';
}
function grahaMaitriKoota(groomRasiId, brideRasiId) {
  const groomLord = SIGN_LORDS[groomRasiId];
  const brideLord = SIGN_LORDS[brideRasiId];
  const relGtoB = naturalRelation(groomLord, brideLord);
  const relBtoG = naturalRelation(brideLord, groomLord);
  // "same" (dono ka lord ek hi planet) — dono taraf se dosti se behtar,
  // seedha 5 diya jata hai (classical: apna hi lord = behtareen mel).
  let score;
  if (groomLord === brideLord) score = 5;
  else if (relGtoB === 'friend' && relBtoG === 'friend') score = 5;
  else if ((relGtoB === 'friend' && relBtoG === 'neutral') || (relGtoB === 'neutral' && relBtoG === 'friend')) score = 4;
  else if (relGtoB === 'neutral' && relBtoG === 'neutral') score = 3;
  else if ((relGtoB === 'friend' && relBtoG === 'enemy') || (relGtoB === 'enemy' && relBtoG === 'friend')) score = 1;
  else if ((relGtoB === 'neutral' && relBtoG === 'enemy') || (relGtoB === 'enemy' && relBtoG === 'neutral')) score = 0.5;
  else score = 0; // both enemy
  return { score, max: 5, groomLord, brideLord, relationGroomToBride: relGtoB, relationBrideToGroom: relBtoG };
}

// ---- 6) Gana Koota (6 points) ----
// Nakshatra->gana list confirmed 2 sources (astrolozyy + saravali.github
// .io/astrology/koota_gana.html), hubahu match. Scoring: widely-cited
// SYMMETRIC version istemal (header comment mein disclosed simplification
// dekhein — saravali ka asymmetric version implement nahi kiya gaya).
const GANA_BY_NAKSHATRA = [
  'deva', 'manushya', 'rakshasa', 'manushya', 'deva', 'manushya', 'deva', 'deva', 'rakshasa', 'rakshasa', // Ashwini..Magha
  'manushya', 'manushya', 'deva', 'rakshasa', 'deva', 'rakshasa', 'deva', 'rakshasa', 'rakshasa', 'manushya', // PurvaPhalguni..PurvaAshadha
  'manushya', 'deva', 'rakshasa', 'rakshasa', 'manushya', 'manushya', 'deva', // UttaraAshadha..Revati
];
const GANA_LABEL_UR = { deva: 'دیو', manushya: 'انسانی', rakshasa: 'راکشس' };
function ganaKoota(groomNakIdx, brideNakIdx) {
  const g = GANA_BY_NAKSHATRA[groomNakIdx];
  const b = GANA_BY_NAKSHATRA[brideNakIdx];
  let score;
  if (g === b) score = 6;
  else if ((g === 'deva' && b === 'manushya') || (g === 'manushya' && b === 'deva')) score = 5;
  else if ((g === 'manushya' && b === 'rakshasa') || (g === 'rakshasa' && b === 'manushya')) score = 1;
  else score = 0; // deva-rakshasa
  return { score, max: 6, groom: g, bride: b, groomUrdu: GANA_LABEL_UR[g], brideUrdu: GANA_LABEL_UR[b] };
}

// ---- 7) Bhakoot Koota (7 points) ----
// Dosha jab rashi-distance (dono taraf se) {2,5,6,8,9,12} mein ho (yani
// 6-8, 2-12, ya 5-9 ka rishta) — dono directions ka jamea hamesha 14 hota
// hai, is liye sirf EK direction check karna kaafi hai. Cancellation:
// agar dono rashi-lord same ya (Graha Maitri table ke mutabiq) friend
// hon, to dosha maaf (astrolozyy se disclosed).
const BHAKOOT_DOSHA_HOUSES = [2, 5, 6, 8, 9, 12];
function bhakootKoota(groomRasiId, brideRasiId) {
  const houseOfBrideFromGroom = houseFromReference(brideRasiId, groomRasiId);
  const hasDosha = BHAKOOT_DOSHA_HOUSES.includes(houseOfBrideFromGroom);
  const groomLord = SIGN_LORDS[groomRasiId];
  const brideLord = SIGN_LORDS[brideRasiId];
  const lordsFriendly = groomLord === brideLord || naturalRelation(groomLord, brideLord) === 'friend' || naturalRelation(brideLord, groomLord) === 'friend';
  const cancelled = hasDosha && lordsFriendly;
  const score = (!hasDosha || cancelled) ? 7 : 0;
  return { score, max: 7, hasDosha, cancelled, houseRelation: houseOfBrideFromGroom };
}

// ---- 8) Nadi Koota (8 points) ----
// Nakshatra->nadi list confirmed 2 sources (astrolozyy + saravali.github
// .io/astrology/koota_nadi.html), hubahu match. Koi cancellation
// exception implement nahi (header comment mein disclosed).
const NADI_BY_NAKSHATRA = [
  'aadi', 'madhya', 'antya', 'antya', 'madhya', 'aadi', 'aadi', 'madhya', 'antya', 'antya', // Ashwini..Magha
  'madhya', 'aadi', 'aadi', 'madhya', 'antya', 'antya', 'madhya', 'aadi', 'aadi', 'madhya', // PurvaPhalguni..PurvaAshadha
  'antya', 'antya', 'madhya', 'aadi', 'aadi', 'madhya', 'antya', // UttaraAshadha..Revati
];
// BUG FIX (2026-09-25): index 24 (Purva Bhadrapada) pehle ghalti se 'antya'
// likha tha — dono sources (saravali.github.io/astrology/koota_nadi.html
// AUR aaps.space/tools/nadi-dosha-calculator) ke mutabiq Purva Bhadrapada
// ADI nadi hai (har nadi mein 9-9 nakshatra; pehle Adi 8 aur Antya 10 ban
// rahe thay). Is se Purva Bhadrapada walon ki Nadi Koota/Nadi Dosha ghalat
// aa rahi thi.
const NADI_LABEL_UR = { aadi: 'آدی (وات)', madhya: 'مدھیہ (پِت)', antya: 'انتیہ (کف)' };
function nadiKoota(groomNakIdx, brideNakIdx) {
  const g = NADI_BY_NAKSHATRA[groomNakIdx];
  const b = NADI_BY_NAKSHATRA[brideNakIdx];
  const score = g === b ? 0 : 8;
  return { score, max: 8, groom: g, bride: b, groomUrdu: NADI_LABEL_UR[g], brideUrdu: NADI_LABEL_UR[b], hasDosha: g === b };
}

function interpretTotal(total) {
  if (total <= 17) return 'incompatible';
  if (total <= 24) return 'average';
  if (total <= 32) return 'good';
  return 'excellent';
}

/**
 * buildKundliMilan — `groom`/`bride` shape: { rasiId, degree } (Moon ki
 * rashi aur uske andar degree, 0-30) — dono taraf se sirf Moon ka data
 * chahiye, poori birth chart nahi.
 */
function buildKundliMilan(groom, bride) {
  if (!groom || !bride || typeof groom.rasiId !== 'number' || typeof bride.rasiId !== 'number') return null;

  const groomLon = absoluteLongitude(groom.rasiId, groom.degree);
  const brideLon = absoluteLongitude(bride.rasiId, bride.degree);
  const groomNak = nakshatraFromLongitude(groomLon);
  const brideNak = nakshatraFromLongitude(brideLon);

  const varna = varnaKoota(groom.rasiId, bride.rasiId);
  const vashya = vashyaKoota(groom, bride);
  const tara = taraKoota(groomNak.index, brideNak.index);
  const yoni = yoniKoota(groomNak.index, brideNak.index);
  const grahaMaitri = grahaMaitriKoota(groom.rasiId, bride.rasiId);
  const gana = ganaKoota(groomNak.index, brideNak.index);
  const bhakoot = bhakootKoota(groom.rasiId, bride.rasiId);
  const nadi = nadiKoota(groomNak.index, brideNak.index);

  const kootas = { varna, vashya, tara, yoni, grahaMaitri, gana, bhakoot, nadi };
  const totalScore = varna.score + vashya.score + tara.score + yoni.score + grahaMaitri.score + gana.score + bhakoot.score + nadi.score;

  return {
    groom: {
      rasiId: groom.rasiId, sign: RASI_NAMES_URDU[groom.rasiId], signLatin: RASI_NAMES_LATIN[groom.rasiId],
      nakshatra: NAKSHATRA_NAMES_LATIN[groomNak.index], nakshatraUrdu: NAKSHATRA_NAMES_URDU[groomNak.index], pada: groomNak.pada,
    },
    bride: {
      rasiId: bride.rasiId, sign: RASI_NAMES_URDU[bride.rasiId], signLatin: RASI_NAMES_LATIN[bride.rasiId],
      nakshatra: NAKSHATRA_NAMES_LATIN[brideNak.index], nakshatraUrdu: NAKSHATRA_NAMES_URDU[brideNak.index], pada: brideNak.pada,
    },
    kootas,
    totalScore: Math.round(totalScore * 100) / 100,
    maxScore: 36,
    interpretation: interpretTotal(totalScore), // 'incompatible' | 'average' | 'good' | 'excellent'
    hasNadiDosha: nadi.hasDosha,
    hasBhakootDosha: bhakoot.hasDosha && !bhakoot.cancelled,
    scopeNote: 'ashtakoot-v1', // Mangal Dosha/Kuja Dosha shamil nahi (disclosed, header comment dekhein)
  };
}

module.exports = { buildKundliMilan, VARNA_BY_RASI, GANA_BY_NAKSHATRA, NADI_BY_NAKSHATRA, YONI_BY_NAKSHATRA };
