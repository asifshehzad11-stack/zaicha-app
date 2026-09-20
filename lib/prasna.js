// lib/prasna.js — "Prasna" (Horary Astrology / Sawal ka Zaicha) feature
// (Task 46, ROADMAP Phase 3). Classical Vedic Prashna mein sawal poochne
// ke EXACT LAMHE (moment) aur QUERENT ki us waqt ki location ke liye ek
// TAAZA chart banaya jata hai (Lagna us lamhe ka) — birth chart se bilkul
// mukhtalif calculation, isi liye ye apna alag route/module hai.
//
// AKSRA note — 2 independent sources se cross-verify (koi tazad nahi in
// core principles mein):
//   - vedicka.com/prashna-chart-analysis-principles
//   - vedicsiddhanta.in/2019/03/the-essence-of-prashna-techniques.html
//   Dono muttafiq: (1) Lagna + Lagna Lord = querent (poochne wala), (2)
//   sawal se mutaliq ghar (bhava) ka lord ("Karyesha") = jis cheez ke
//   baare mein poocha ja raha hai, (3) dono ki dignity (exalted/own/
//   neutral/debilitated/combust) aur Kendra(1,4,7,10)+Trikona(5,9) [achi]
//   vs Dusthana(6,8,12) [buri] placement se unki "strength" tay hoti hai,
//   (4) Lagna rashi ka nature — Chara(movable)=jaldi tabdeeli, Sthira
//   (fixed)=tabdeeli mushkil/susth, Dwiswabhava(dual)=tabdeeli-magar-
//   pechida — waqt (timing) ka ishara deta hai, (5) Moon ka Ithasala
//   (applying — "haan" ki taraf) ya Isarapha (separating — "na" ki taraf)
//   yoga ek ehem factor hai.
//
// DISCLOSED SIMPLIFICATION (Ithasala/Isarapha): asal classical tareeqa
// TAMAM aspects (conjunction, trine, square) par, exact daily-motion
// (speed, degree/din) data se "kitne din/ghante mein exact hoga" nikalta
// hai. Is app ke paas kisi bhi planet ki exact speed/motion field nahi
// (sirf rasiId + degree-in-sign + isRetrograde Prokerala se milta hai) —
// is liye yahan SIRF ek disclosed, simple case handle kiya gaya hai: Moon
// ka kisi significator ke SAME SIGN (conjunction) mein hona. Ye is liye
// "safe" hai kyunke Moon ek astronomical fact ke tor par HAMESHA baaqi
// sab classical grahas se tez chalta hai (~13°/din) — is liye seedha
// degree-in-sign compare karke "Moon peeche hai (applying)" ya "Moon
// aage nikal chuka (separating)" kaha ja sakta hai, BASHARTE doosra
// planet retrograde na ho (retrograde hone par dynamic ulat sakta hai —
// us soorat mein 'uncertain' return hota hai, guess nahi kiya jata).
// Trine/square jaise doosre aspects ke liye Ithasala/Isarapha, aur poora
// KP horary-number (1-249) system — dono jaan-boojh kar IMPLEMENT NAHI
// kiye gaye (disclosed out-of-scope, jaisa KP cuspal-system pehle se
// disclosed hai).
//
// DISCLOSED SCOPE: sirf un question-categories ko shamil kiya gaya hai
// jinki ghar/bhava-signification par sources mein KOI ikhtilaf nahi mila
// (universal Parashari bhava significations — har bunyadi Vedic text mein
// same). "Kho'i hui cheez" (lost object) jaan-boojh kar SHAMIL NAHI ki
// gayi — classical Prasna Marga ismein ek poora ALAG, ziyada pechida
// tareeqa istemal karta hai (chart ki disha, hora, drishti se cheez ki
// jagah tak batana) jo is v1 ke scope se bahar hai.
//
// DISCLOSED VERDICT MODEL: overall "لین" (lean) sirf ek SEEDHA, SHAFFAF
// (transparent) additive score hai (neeche dekhein) — koi authoritative
// yes/no dawa nahi, sirf ek "encouraging/mixed/cautionary" ka surface-
// level ishara, taake sanjeeda maamlaat (shadi, sehat) mein overclaim na
// ho.
'use strict';

const {
  RASI_NAMES_URDU, RASI_NAMES_LATIN, SIGN_LORDS, PLANET_NAME_URDU,
  planetDignity, houseFromReference, findAscendant, indexPlanets,
  findCombustPlanets, absoluteLongitude,
} = require('./astro-engine');
const { tithiFromLongitudes } = require('./panchang-calendar');

// Category -> ghar (house number, Lagna se). Jahan ek se zyada ghar
// classically mil-jul kar dekhe jate hain (jaise wealth: 2+11), pehla
// number PRIMARY (Karyesha yahan se nikalta hai) hai, baaqi supporting.
const CATEGORY_HOUSES = {
  general: { houses: [1], labelUr: 'عمومی صورتحال', labelEn: 'General Situation' },
  marriage: { houses: [7], labelUr: 'شادی / رشتہ', labelEn: 'Marriage / Relationship' },
  career: { houses: [10], labelUr: 'ملازمت / کیریئر', labelEn: 'Job / Career' },
  wealth: { houses: [2, 11], labelUr: 'مال و دولت', labelEn: 'Wealth / Finance' },
  health: { houses: [6], labelUr: 'صحت / بیماری', labelEn: 'Health / Illness' },
  education: { houses: [5], labelUr: 'تعلیم', labelEn: 'Education' },
  litigation: { houses: [6], labelUr: 'مقدمہ / جھگڑا', labelEn: 'Litigation / Dispute' },
  travel: { houses: [3, 9, 12], labelUr: 'سفر (ملکی/غیر ملکی)', labelEn: 'Travel (local/foreign)' },
  property: { houses: [4], labelUr: 'جائیداد / گھر', labelEn: 'Property / Home' },
  children: { houses: [5], labelUr: 'اولاد', labelEn: 'Children' },
};

const CHARA_SIGNS = [0, 3, 6, 9]; // Aries, Cancer, Libra, Capricorn
const STHIRA_SIGNS = [1, 4, 7, 10]; // Taurus, Leo, Scorpio, Aquarius
// baaqi (2,5,8,11 — Gemini/Virgo/Sagittarius/Pisces) Dwiswabhava (dual) hain

function signMovementType(signId) {
  if (CHARA_SIGNS.includes(signId)) return 'chara';
  if (STHIRA_SIGNS.includes(signId)) return 'sthira';
  return 'dwiswabhava';
}

const KENDRA_TRIKONA = [1, 4, 5, 7, 9, 10];
const DUSTHANA = [6, 8, 12];

/**
 * significatorReading — ek significator planet ki dignity + house-
 * placement se ek SHAFFAF (transparent), numeric additive score banata
 * hai. Ye poori Shadbala/Vimshopak-level strength nahi (jaan-boojh kar
 * simple rakha gaya, is app ki Bhava Bala jaisi hi "basic, transparent
 * shuru'aat" filosofi ke mutabiq).
 */
function significatorReading(planetName, natalMap, ascendantRasiId, combustList) {
  const p = natalMap[planetName];
  if (!p || typeof p.rasiId !== 'number') return null;
  const dignity = planetDignity(planetName, p.rasiId);
  const house = houseFromReference(p.rasiId, ascendantRasiId);
  const isCombust = combustList.some((c) => c.planet === planetName);

  let score = 0;
  if (dignity === 'exalted' || dignity === 'own') score += 1;
  if (dignity === 'debilitated') score -= 1;
  if (isCombust) score -= 1;
  if (KENDRA_TRIKONA.includes(house)) score += 1;
  if (DUSTHANA.includes(house)) score -= 1;

  const strength = score >= 1 ? 'strong' : score <= -1 ? 'weak' : 'mixed';

  return {
    planet: planetName,
    planetUrdu: PLANET_NAME_URDU[planetName] || planetName,
    rasiId: p.rasiId,
    sign: RASI_NAMES_URDU[p.rasiId],
    signLatin: RASI_NAMES_LATIN[p.rasiId],
    house,
    dignity,
    isCombust,
    isRetrograde: !!p.isRetrograde,
    score,
    strength, // 'strong' | 'weak' | 'mixed'
  };
}

/**
 * moonConjunctionYoga — header comment mein disclosed simplification
 * dekhein. `moon`/`target` shape: {rasiId, degree, isRetrograde}.
 */
function moonConjunctionYoga(moon, target, targetName) {
  if (!moon || !target || typeof moon.rasiId !== 'number' || typeof target.rasiId !== 'number') {
    return { type: 'unavailable' };
  }
  if (moon.rasiId !== target.rasiId) return { type: 'none', planet: targetName };
  if (target.isRetrograde) {
    return { type: 'uncertain', planet: targetName };
  }
  if (moon.degree < target.degree) return { type: 'ithasala', planet: targetName }; // applying
  if (moon.degree > target.degree) return { type: 'isarapha', planet: targetName }; // separating
  return { type: 'exact', planet: targetName };
}

/**
 * buildPrasnaJudgment — `planetPositionList` seedha Prokerala/VedAstro ke
 * `/planet-position` response ka array (Ascendant id:100 shamil), poochay
 * jaane ke LAMHE aur querent ki location ke liye fetch kiya gaya. `category`
 * CATEGORY_HOUSES ki koi key.
 */
function buildPrasnaJudgment(planetPositionList, category) {
  const ascendant = findAscendant(planetPositionList);
  if (!ascendant || !ascendant.rasi) return null;
  const ascendantRasiId = ascendant.rasi.id;
  const ascendantDegree = ascendant.degree || 0;
  const natalMap = indexPlanets(planetPositionList);
  const combustList = findCombustPlanets(natalMap);

  const catInfo = CATEGORY_HOUSES[category] || CATEGORY_HOUSES.general;
  const primaryHouse = catInfo.houses[0];
  const primarySignId = (ascendantRasiId + (primaryHouse - 1)) % 12;
  const karyeshaPlanet = SIGN_LORDS[primarySignId];
  const lagnaLordPlanet = SIGN_LORDS[ascendantRasiId];

  const lagnaLordReading = significatorReading(lagnaLordPlanet, natalMap, ascendantRasiId, combustList);
  const isGeneral = primaryHouse === 1; // Karyesha khud Lagna Lord ke barabar hai
  const karyeshaReading = isGeneral ? null : significatorReading(karyeshaPlanet, natalMap, ascendantRasiId, combustList);

  const moon = natalMap.Moon;
  const sun = natalMap.Sun;
  let moonPaksha = null;
  if (moon && sun && typeof moon.rasiId === 'number' && typeof sun.rasiId === 'number') {
    const moonLon = absoluteLongitude(moon.rasiId, moon.degree);
    const sunLon = absoluteLongitude(sun.rasiId, sun.degree);
    const tithi = tithiFromLongitudes(moonLon, sunLon);
    moonPaksha = {
      paksha: tithi.paksha,
      pakshaUrdu: tithi.pakshaUrdu,
      pakshaEn: tithi.pakshaEn,
      tithiName: tithi.name,
      tithiNameUrdu: tithi.nameUrdu,
    };
  }

  const yogaWithLagnaLord = (lagnaLordPlanet !== 'Moon' && natalMap[lagnaLordPlanet])
    ? moonConjunctionYoga(moon, natalMap[lagnaLordPlanet], lagnaLordPlanet) : { type: 'n/a' };
  const yogaWithKaryesha = (!isGeneral && karyeshaPlanet !== 'Moon' && natalMap[karyeshaPlanet])
    ? moonConjunctionYoga(moon, natalMap[karyeshaPlanet], karyeshaPlanet) : { type: 'n/a' };

  // ---- Overall lean: seedha, shaffaf additive score (disclosed) ----
  let overallScore = 0;
  if (lagnaLordReading) overallScore += lagnaLordReading.score;
  if (karyeshaReading) overallScore += karyeshaReading.score;
  if (moonPaksha) overallScore += moonPaksha.paksha === 'shukla' ? 1 : -1;
  for (const yoga of [yogaWithLagnaLord, yogaWithKaryesha]) {
    if (yoga.type === 'ithasala') overallScore += 1;
    if (yoga.type === 'isarapha') overallScore -= 1;
  }
  const overallLean = overallScore >= 2 ? 'favorable' : overallScore <= -2 ? 'cautionary' : 'mixed';

  return {
    category,
    categoryLabelUr: catInfo.labelUr,
    categoryLabelEn: catInfo.labelEn,
    houses: catInfo.houses,
    isGeneral,
    ascendant: {
      rasiId: ascendantRasiId,
      sign: RASI_NAMES_URDU[ascendantRasiId],
      signLatin: RASI_NAMES_LATIN[ascendantRasiId],
      degree: Math.round(ascendantDegree * 100) / 100,
      movementType: signMovementType(ascendantRasiId), // 'chara'|'sthira'|'dwiswabhava'
    },
    lagnaLord: lagnaLordReading,
    karyesha: karyeshaReading,
    moonPaksha,
    yogaWithLagnaLord,
    yogaWithKaryesha,
    overallScore,
    overallLean, // 'favorable' | 'mixed' | 'cautionary'
    scopeNote: 'basic-classical-v1', // disclosed simplification marker
  };
}

module.exports = { buildPrasnaJudgment, CATEGORY_HOUSES, signMovementType };
