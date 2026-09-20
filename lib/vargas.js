// lib/vargas.js — Shadvarga ke baaqi 4 divisional charts (D2, D3, D12, D30)
// jo is codebase mein abhi tak nahi thay (sirf D9/Navamsa lib/navamsa.js
// mein maujood tha). Ye module sirf PURE sign-calculation functions deta
// hai — lib/navamsa.js ke navamsaSignId() jaisi hi style — taake
// lib/vimshopak-bala.js (aur mustaqbil mein koi bhi aur feature) inhein
// reuse kar sake.
//
// AKSRA note — har formula 2 mustaqil (independent) sources se cross-check
// ki gayi hai, is session mein:
//   - D3 Drekkana: jagannathhora.com — 0-10° = apni hi rasi, 10-20° = us se
//     5wan sign, 20-30° = us se 9wan sign. Koi ikhtilaf nahi mila.
//   - D30 Trimsamsa: srath.com (Sanjay Rath ki apni site) AUR
//     blog.indianastrologysoftware.com — dono EXACT same lord-table AUR
//     resulting-sign table dete hain (odd signs: Mars->Aries 0-5°,
//     Saturn->Aquarius 5-10°, Jupiter->Sagittarius 10-18°,
//     Mercury->Gemini 18-25°, Venus->Libra 25-30°; even signs: Venus
//     ->Taurus 0-5°, Mercury->Virgo 5-12°, Jupiter->Pisces 12-20°,
//     Saturn->Capricorn 20-25°, Mars->Scorpio 25-30°). Koi ikhtilaf
//     nahi mila — lekin dono sources khud disclose karte hain ke asal
//     BPHS text sirf lord/deity naam deta hai, resulting-SIGN ek baad ki
//     "published practice" convention hai (na ke seedha primary text se)
//     — is liye ye baat yahan bhi saaf likhi gayi hai.
//   - D2 Hora: jagannathhora.com AUR astroavastha.com — dono EXACT same
//     table dete hain (odd signs: 0-15°=Sun ka Hora->Leo, 15-30°=Moon ka
//     Hora->Cancer; even signs ulta). Koi ikhtilaf nahi mila.
//   - D12 Dwadasamsa: jagannathhora.com AUR desiutils.in — dono EXACT same
//     rule dete hain (har 2°30' hissa, apni hi rasi se shuru ho kar,
//     odd/even ki tafreeq ke baghair, forward sequential 12 signs). Koi
//     ikhtilaf nahi mila.
// In chaaron mein koi genuine dispute nahi mila (Chara Dasha/Vimshopak
// dignity-table jaisa) — is liye seedha implement kiya gaya hai, bina kisi
// alternate-convention disclosure ke.
'use strict';

/** 0-indexed rasiId: Aries=0 classically "odd" sign, is liye even rasiId
 * (0,2,4,6,8,10) hi classically-odd signs hain — poore codebase mein yehi
 * convention hai (dekhein lib/chara-dasha.js ka isOddSign). */
function isOddSign(rasiId) {
  return rasiId % 2 === 0;
}

function clampDegree(degreeInSign) {
  let d = typeof degreeInSign === 'number' ? degreeInSign : 0;
  if (d < 0) d = 0;
  if (d >= 30) d = 29.999; // guard: theek 30° edge case
  return d;
}

/**
 * D2 Hora — sirf Sun (Leo, rasiId 4) aur Moon (Cancer, rasiId 3) ki hi do
 * horain hoti hain, natal sign se qata'a-nazar (independent of natal sign
 * identity, sirf uski odd/even parity aur degree istemal hoti hai).
 */
function horaSignId(rasiId, degreeInSign) {
  if (typeof rasiId !== 'number') return null;
  const d = clampDegree(degreeInSign);
  const oddSign = isOddSign(rasiId);
  const firstHalf = d < 15;
  // Odd sign: 0-15° Sun ka Hora (Leo), 15-30° Moon ka Hora (Cancer).
  // Even sign: ulta.
  const sunsHora = oddSign ? firstHalf : !firstHalf;
  return sunsHora ? 4 /* Leo */ : 3 /* Cancer */;
}

/**
 * D3 Drekkana — teen 10° hisse: 1st = apni hi rasi, 2nd = 5wan sign us se,
 * 3rd = 9wan sign us se (sab signs, odd/even ki tafreeq ke baghair).
 */
function drekkanaSignId(rasiId, degreeInSign) {
  if (typeof rasiId !== 'number') return null;
  const d = clampDegree(degreeInSign);
  const part = Math.floor(d / 10); // 0, 1, ya 2
  const offset = part === 0 ? 0 : part === 1 ? 4 : 8; // 5wan sign = +4, 9wan sign = +8
  return (rasiId + offset) % 12;
}

/**
 * D12 Dwadasamsa — har 2°30' hissa, apni hi rasi se shuru ho kar aage
 * (forward) 12 signs tak, odd/even ki tafreeq ke baghair — ye poore
 * Shadvarga mein sab se saada (simplest) rule hai.
 */
function dwadasamsaSignId(rasiId, degreeInSign) {
  if (typeof rasiId !== 'number') return null;
  const d = clampDegree(degreeInSign);
  const part = Math.floor(d / 2.5); // 0..11
  return (rasiId + part) % 12;
}

// D30 Trimsamsa — Odd/Even signs ke liye alag table, non-uniform spans
// (khaas baat ye hai ke lord planets ki tarteeb dono mein ulti hai, magar
// har planet ka apna span size SAME rehta hai — sirf shuru/end degree
// mirror hote hain).
const TRIMSAMSA_ODD_TABLE = [
  { end: 5, lordSignId: 0 },   // Mars -> Aries
  { end: 10, lordSignId: 10 }, // Saturn -> Aquarius
  { end: 18, lordSignId: 8 },  // Jupiter -> Sagittarius
  { end: 25, lordSignId: 2 },  // Mercury -> Gemini
  { end: 30, lordSignId: 6 },  // Venus -> Libra
];
const TRIMSAMSA_EVEN_TABLE = [
  { end: 5, lordSignId: 1 },   // Venus -> Taurus
  { end: 12, lordSignId: 5 },  // Mercury -> Virgo
  { end: 20, lordSignId: 11 }, // Jupiter -> Pisces
  { end: 25, lordSignId: 9 },  // Saturn -> Capricorn
  { end: 30, lordSignId: 7 },  // Mars -> Scorpio
];

/**
 * D30 Trimsamsa — resulting sign per hissa (segment). AKSRA note: BPHS ka
 * asal matn har hisse ka sirf MALIK planet aur deity naam deta hai, khud
 * koi rasi naam nahi deta — is liye "resulting sign" khud ek "published
 * practice" convention hai, na ke seedha primary text se. Ye convention
 * (jo srath.com — khud Sanjay Rath ki site — AUR blog.indianastrologysoftware.com,
 * dono par HUBAHU same hai) istemal ki gayi hai: har planet ka apna WOH
 * khaas own-sign jo us table mein diya gaya hai (jaise Mars odd mein
 * Aries, even mein Scorpio — uske dono own-signs hi hain, sirf odd/even
 * ke hisaab se alag select hote hain).
 */
function trimsamsaSignId(rasiId, degreeInSign) {
  if (typeof rasiId !== 'number') return null;
  const d = clampDegree(degreeInSign);
  const table = isOddSign(rasiId) ? TRIMSAMSA_ODD_TABLE : TRIMSAMSA_EVEN_TABLE;
  for (const row of table) {
    if (d < row.end) return row.lordSignId;
  }
  return table[table.length - 1].lordSignId;
}

module.exports = {
  horaSignId,
  drekkanaSignId,
  dwadasamsaSignId,
  trimsamsaSignId,
  isOddSign,
};
