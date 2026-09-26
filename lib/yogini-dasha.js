// lib/yogini-dasha.js — Multi-language (EN/UR/HI)
//
// Yogini Dasha — classical 36-year, 8-Yogini dasha system (Phase 2's second
// item, per ROADMAP.md). Prokerala/VedAstro's API does NOT provide this
// dasha (only Vimshottari), so unlike Yoga Detection/Navamsa/Graha Bala —
// which are also "free" (no extra API cost) — this one is self-calculated
// end-to-end from the natal Moon position + birth datetime.
//
// AKSRA principle applied here ("assumption ko fact ki tarah pesh mat
// karo"): the formula below was verified against TWO independent classical
// sources before writing this code (both agree exactly):
//   - ShubhDivas: https://www.shubhdivas.in/jyotisha/yogini-dasha
//     ("(nakshatra number + 3) / 8 — the remainder gives the Yogini
//     number. Remainder 0 = Sankata.")
//   - MyZodiaQ: https://www.myzodiaq.in/en/online-library/panchang/
//     vimshottari-and-yogini/calculating-yogini-dasha-the-36-year-karmic-cycle
//     (same remainder rule, same 8-Yogini order/years/lords)
// Both sources also confirm: (1) balance of the first Mahadasha at birth is
// proportional to the UN-ELAPSED portion of the birth nakshatra (exactly
// like Vimshottari's balance-dasha calculation), and (2) each Mahadasha's
// Antardashas cycle through all 8 Yoginis in the same fixed order STARTING
// from the Mahadasha's own Yogini, each Antardasha's length = (its own
// Yogini's years / 36) * Mahadasha's total years — again structurally
// identical to Vimshottari's Mahadasha/Antardasha proportion rule.
//
// Since no API gives exact calendar dates for this dasha, this module
// calculates them itself from the birth datetime using the same
// days-per-year convention already used elsewhere in this codebase for
// self-calculated date estimates (365.25 days/year — see
// estimateSadeSatiWindow in astro-engine.js). This is disclosed to the user
// via `isEstimate` + a UI disclaimer, exactly like the existing Sade Sati
// window estimate.
'use strict';

const { normLang, planetLabel } = require('./narrative');

const NAK_SPAN = 360 / 27; // 13°20'
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365.25;

// Fixed classical order, ruling planet, and duration (years). Total = 36.
const YOGININ_UR = {
  mangala: 'منگلا', pingala: 'پنگلا', dhanya: 'دھنیا', bhramari: 'بھرامری',
  bhadrika: 'بھدریکا', ulka: 'الکا', siddha: 'سدھا', sankata: 'سنکٹا',
};
const YOGINIS = [
  { key: 'mangala', planet: 'Moon', years: 1 },
  { key: 'pingala', planet: 'Sun', years: 2 },
  { key: 'dhanya', planet: 'Jupiter', years: 3 },
  { key: 'bhramari', planet: 'Mars', years: 4 },
  { key: 'bhadrika', planet: 'Mercury', years: 5 },
  { key: 'ulka', planet: 'Saturn', years: 6 },
  { key: 'siddha', planet: 'Venus', years: 7 },
  { key: 'sankata', planet: 'Rahu', years: 8 },
];
const TOTAL_YEARS = YOGINIS.reduce((s, y) => s + y.years, 0); // 36

function yoginiName(key, lang) {
  return lang === 'ur' ? YOGININ_UR[key] : key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * startingIndex — classical formula: (nakshatra_number + 3) mod 8.
 * nakshatra_number is 1-27 (Ashwini=1); nakshatraIndex0 (as returned by
 * astro-engine.js's nakshatraFromLongitude) is 0-26, so +1 first.
 */
function startingIndex(nakshatraIndex0) {
  const nakshatraNumber = nakshatraIndex0 + 1;
  const remainder = (nakshatraNumber + 3) % 8;
  return remainder === 0 ? 7 : remainder - 1; // 0-based index into YOGINIS
}

/**
 * moonNakshatraProgress — Moon ki nakshatra ke andar kitna "safar" (elapsed
 * fraction, 0..1) ho chuka hai, sirf longitude se. astro-engine.js ke
 * nakshatraFromLongitude() jaisa hi calculation, bas yahan fraction bhi
 * chahiye (jo wo function return nahi karta), is liye chhota local helper.
 */
function moonNakshatraProgress(moonAbsoluteLongitude) {
  const norm = ((moonAbsoluteLongitude % 360) + 360) % 360;
  const index0 = Math.floor(norm / NAK_SPAN);
  const within = norm - index0 * NAK_SPAN;
  return { index0, elapsedFraction: within / NAK_SPAN };
}

function addYears(date, years) {
  return new Date(date.getTime() + years * DAYS_PER_YEAR * MS_PER_DAY);
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * buildYoginiDasha — `data` woh poora ZAICHA_DATA object hai jo
 * buildZaichaData() banata hai (Moon ki natal position ke liye), `birthDate`
 * aur `targetDate` dono JS Date objects hain. `lang` request ki language
 * (en/ur/hi — hi abhi en fallback).
 *
 * Return shape jaan-boojh kar Vimshottari dasha-tree (astro-engine.js ke
 * buildDashaTree) jaisi hi rakhi gayi hai — {lord, start, end, isCurrent,
 * antardasha:[...]} — taake frontend ka pehle se maujood dasha-tree render
 * karne wala code (renderDashaTree/buildDashaTreeRow) isay bhi seedha
 * dikha sake, koi naya UI pattern banane ki zaroorat nahi.
 */
function buildYoginiDasha(data, birthDate, targetDate, lang) {
  lang = normLang(lang);
  const moon = data.natal && data.natal.planets && data.natal.planets.Moon;
  if (!moon || typeof moon.rasiId !== 'number' || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return null;
  }

  // Moon ki absolute (0-360) longitude natal chart mein.
  const moonLon = ((moon.rasiId * 30) + (moon.degree || 0)) % 360;
  const { index0, elapsedFraction } = moonNakshatraProgress(moonLon);
  const startIdx = startingIndex(index0);

  // Kitne pooray 36-saal cycles banayein taake ek poori zindagi (120 saal)
  // aaram se cover ho jaye.
  const CYCLES_TO_BUILD = 4; // 4 * 36 = 144 saal se zyada, kaafi hai
  const totalMahadashaCount = CYCLES_TO_BUILD * 8;

  const mahadashas = [];
  let cursor = new Date(birthDate.getTime());
  for (let i = 0; i < totalMahadashaCount; i++) {
    const idx = (startIdx + i) % 8;
    const yogini = YOGINIS[idx];
    // Pehli Mahadasha ka balance — baqi sab poori duration ki.
    const years = i === 0 ? yogini.years * (1 - elapsedFraction) : yogini.years;
    const start = new Date(cursor.getTime());
    const end = addYears(start, years);

    const isCurrent = targetDate >= start && targetDate < end;

    // Antardashas — usi Yogini se shuru ho kar fixed order mein 8 ka
    // chakar. Classical Vimshottari-jaisa proportion rule: har antardasha
    // ki duration = is Mahadasha ki ASAL (actual, chahe pehli wali balance
    // ho ya baaqi poori) duration * (antardasha-lord ki classical years /
    // 36) — is liye 8 antardashas ka jama hamesha wapas Mahadasha ki poori
    // asal duration ke barabar hota hai.
    // BUG FIX (2026-09-25): pehli (balance wali) Mahadasha mein pehle 8 ki
    // 8 antardashas ko sirf bache hue "balance" waqt mein daba (squeeze)
    // diya jata tha. Sahi tariqa (Vimshottari jaisa, 2 sources:
    // sanatanveda.com/astrology/calculation-of-vimshottari-dasha-system aur
    // vedastro.org ka "Dasas and Bhuktis" chapter): antardashas POORI
    // Mahadasha ki lambai par nikali jati hain, aur jo hissa paidaish se
    // pehle guzar chuka woh chhod diya jata hai — paidaish kisi antardasha
    // ke beech mein aati hai.
    const fullYears = yogini.years;
    const virtualStart = i === 0 ? addYears(start, -(yogini.years * elapsedFraction)) : start;
    let aCursor = new Date(virtualStart.getTime());
    const antardasha = [];
    for (let j = 0; j < 8; j++) {
      const aIdx = (idx + j) % 8;
      const aYogini = YOGINIS[aIdx];
      const aYears = fullYears * (aYogini.years / TOTAL_YEARS);
      const aStartFull = new Date(aCursor.getTime());
      const aEnd = addYears(aStartFull, aYears);
      aCursor = aEnd;
      if (aEnd <= start) continue; // paidaish se pehle mukammal guzar chuki
      const aStart = aStartFull < start ? new Date(start.getTime()) : aStartFull;
      antardasha.push({
        lord: aYogini.planet,
        yoginiKey: aYogini.key,
        yoginiName: yoginiName(aYogini.key, lang),
        start: fmt(aStart),
        end: fmt(aEnd),
        isCurrent: targetDate >= aStart && targetDate < aEnd,
      });
      aCursor = aEnd;
    }

    mahadashas.push({
      lord: yogini.planet,
      yoginiKey: yogini.key,
      yoginiName: yoginiName(yogini.key, lang),
      start: fmt(start),
      end: fmt(end),
      isCurrent,
      antardasha,
    });
    cursor = end;
  }

  const currentMaha = mahadashas.find((m) => m.isCurrent) || null;
  const currentAntar = currentMaha ? currentMaha.antardasha.find((a) => a.isCurrent) || null : null;

  return {
    current: {
      mahadasha: currentMaha,
      antardasha: currentAntar,
    },
    tree: mahadashas,
    isEstimate: true, // dates khud calculate ki gayi hain, koi API in ko confirm nahi karti
  };
}

module.exports = { buildYoginiDasha, YOGINIS, TOTAL_YEARS };
