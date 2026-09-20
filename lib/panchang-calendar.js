// lib/panchang-calendar.js — multi-day Panchang list (Task 40, ROADMAP
// Phase 3: "Panchang Calendar/List view").
//
// AKSRA note — is feature ki khaas baat: server.js ka mojooda
// /api/forward-calendar route already har din (aglay 7 din) ka poora
// Sun+Moon planet-position data ek SHARED cache se fetch karta hai
// (getOrFetchDailyTransit — bilkul FREE, koi extra Prokerala/VedAstro call
// nahi, jaisa lib/astro-engine.js ka buildForwardCalendar() Moon ka
// house/nakshatra nikalta hai). Panchang ke 3 mukhtalif hisse (Tithi,
// Nitya Yoga, Karana) — Nakshatra to already nikal raha hai —  bhi Sun aur
// Moon ki LONGITUDE se hi (koi extra field/API ki zaroorat nahi) classical
// FIXED mathematical formulas se nikaltay hain. Is liye ye poori list
// bhi bilkul FREE hai, seedha usi shared daily-transit data se.
//
// 2 independent sources se har formula cross-check ki gayi (is session
// mein), koi genuine ikhtilaf nahi mila:
//   - Tithi: en.wikipedia.org/wiki/Tithi AUR samvat.in/learn/tithi/ —
//     dono confirm karte hain: tithi = floor(elongation / 12°), jahan
//     elongation = (moonLon - sunLon) mod 360, 30 tithi (0-29). 1-15
//     Shukla Paksha (waxing, ending Purnima), 16-30 Krishna Paksha
//     (waning, ending Amavasya) — dono paksha mein 1-14 ke naam same
//     (Pratipada..Chaturdashi), sirf 15wan tithi ka naam alag hota hai.
//   - Nitya Yoga: en.wikipedia.org/wiki/Nityayoga — yoga = floor((sunLon +
//     moonLon mod 360) / (13°20')), 27 yoga (0-26), poori 27-naam list
//     isi source se li gayi.
//   - Karana: en.wikipedia.org/wiki/Karana_(pancanga) AUR
//     hindu-blog.com/2018/11/karana-in-hindu-astrology-and-panchang.html
//     — dono confirm karte hain: karana = floor(elongation / 6°), 60
//     karana (0-59) fi mahina. K=0 sirf EK BAAR (Kimstughna, mahine ki
//     shuruaat), K=57/58/59 sirf EK BAAR each (Shakuni/Chatushpada/Naga,
//     mahine ke aakhir mein), baaqi K=1..56 mein 7 "chara" (movable)
//     karana (Bava/Balava/Kaulava/Taitila/Gara/Vanija/Vishti) cyclically
//     8 baar repeat hotay hain.
'use strict';

const { indexPlanets, absoluteLongitude, RASI_NAMES_URDU, RASI_NAMES_LATIN, planetDignity, nakshatraFromLongitude, houseFromReference } = require('./astro-engine');

const TITHI_NAMES_1_TO_14 = {
  latin: ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'],
  urdu: ['پرتی پدا', 'دویتیا', 'تریتیا', 'چترتھی', 'پنچمی', 'شسٹھی', 'سپتمی', 'اشٹمی', 'نومی', 'دشمی', 'ایکادشی', 'دوادشی', 'تریودشی', 'چترداشی'],
};
const PURNIMA = { latin: 'Purnima', urdu: 'پورنیما' };
const AMAVASYA = { latin: 'Amavasya', urdu: 'اماوسیا' };

const YOGA_NAMES = {
  latin: ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'],
  urdu: ['وشکمبھ', 'پریتی', 'آیوشمان', 'سوبھاگیہ', 'شوبھنا', 'اتیگنڈا', 'سُکرما', 'دھرتی', 'شولا', 'گنڈا', 'وردھی', 'دھروا', 'ویاگھاتا', 'ہرشنا', 'وجرا', 'سدھی', 'ویاتی پاتا', 'واریان', 'پریگھا', 'شیوا', 'سدھا', 'سادھیہ', 'شبھا', 'شکلا', 'برہما', 'اندرا', 'ویدھرتی'],
};

const KARANA_MOVABLE = {
  latin: ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'],
  urdu: ['باوا', 'بالوا', 'کولوا', 'تیتلا', 'گرا', 'وانجا', 'وشتی'],
};
const KARANA_FIXED = {
  0: { latin: 'Kimstughna', urdu: 'کِمستُغنا' },
  57: { latin: 'Shakuni', urdu: 'شکنی' },
  58: { latin: 'Chatushpada', urdu: 'چتُشپدا' },
  59: { latin: 'Naga', urdu: 'ناگا' },
};

const VAARA_NAMES = {
  latin: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  urdu: ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'],
};

function forwardElongation(moonLon, sunLon) {
  return ((moonLon - sunLon) % 360 + 360) % 360;
}

/** Tithi (0-29 index) — moonLon/sunLon absolute (0-360) longitudes chahiye. */
function tithiFromLongitudes(moonLon, sunLon) {
  const elong = forwardElongation(moonLon, sunLon);
  const index = Math.min(29, Math.floor(elong / 12));
  const isShukla = index < 15;
  const posInPaksha = index % 15; // 0-14
  let latin, urdu;
  if (posInPaksha < 14) {
    latin = TITHI_NAMES_1_TO_14.latin[posInPaksha];
    urdu = TITHI_NAMES_1_TO_14.urdu[posInPaksha];
  } else {
    latin = isShukla ? PURNIMA.latin : AMAVASYA.latin;
    urdu = isShukla ? PURNIMA.urdu : AMAVASYA.urdu;
  }
  return {
    index,
    paksha: isShukla ? 'shukla' : 'krishna',
    pakshaUrdu: isShukla ? 'شکل پکش' : 'کرشن پکش',
    pakshaEn: isShukla ? 'Shukla' : 'Krishna',
    number: posInPaksha + 1, // 1-15
    name: latin,
    nameUrdu: urdu,
  };
}

/** Nitya Yoga (0-26 index). */
function yogaFromLongitudes(moonLon, sunLon) {
  const sum = ((moonLon + sunLon) % 360 + 360) % 360;
  const YOGA_SPAN = 360 / 27; // 13°20'
  const index = Math.min(26, Math.floor(sum / YOGA_SPAN));
  return { index, name: YOGA_NAMES.latin[index], nameUrdu: YOGA_NAMES.urdu[index] };
}

/** Karana (0-59 index). */
function karanaFromLongitudes(moonLon, sunLon) {
  const elong = forwardElongation(moonLon, sunLon);
  const K = Math.min(59, Math.floor(elong / 6));
  if (KARANA_FIXED[K]) {
    return { index: K, name: KARANA_FIXED[K].latin, nameUrdu: KARANA_FIXED[K].urdu, isFixed: true };
  }
  const movableIdx = (K - 1) % 7; // K=1..56 -> 0..6, repeating 8 times
  return { index: K, name: KARANA_MOVABLE.latin[movableIdx], nameUrdu: KARANA_MOVABLE.urdu[movableIdx], isFixed: false };
}

/** Vaara (weekday) — seedha date se, koi longitude ki zaroorat nahi. */
function vaaraFromDateStr(dateStr) {
  // dateStr 'YYYY-MM-DD' — UTC midnight se din nikalte hain (calendar din,
  // koi timezone-sensitive waqt shamil nahi, is liye UTC hi kaafi hai).
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayIndex = d.getUTCDay(); // 0=Sunday .. 6=Saturday
  return { index: dayIndex, name: VAARA_NAMES.latin[dayIndex], nameUrdu: VAARA_NAMES.urdu[dayIndex] };
}

/**
 * buildPanchangCalendar — `dayEntries`: [{ date: 'YYYY-MM-DD', planetList
 * }, ...] — bilkul wahi shape jo lib/astro-engine.js ka
 * buildForwardCalendar() leta hai (server.js ke /api/forward-calendar
 * route se already maujood). `ascendantRasiId` optional hai — agar diya
 * jaye to Moon ka ghar bhi (Weekly Calendar jaisa) saath mein return hota
 * hai, warna sirf khaalis Panchang (Tithi/Vaara/Nakshatra/Yoga/Karana)
 * milta hai.
 */
function buildPanchangCalendar(dayEntries, ascendantRasiId) {
  return dayEntries.map((entry) => {
    const map = indexPlanets(entry.planetList);
    const sun = map.Sun;
    const moon = map.Moon;
    if (!sun || !moon || typeof sun.rasiId !== 'number' || typeof moon.rasiId !== 'number') {
      return { date: entry.date, incomplete: true };
    }
    const sunLon = absoluteLongitude(sun.rasiId, sun.degree);
    const moonLon = absoluteLongitude(moon.rasiId, moon.degree);

    const tithi = tithiFromLongitudes(moonLon, sunLon);
    const yoga = yogaFromLongitudes(moonLon, sunLon);
    const karana = karanaFromLongitudes(moonLon, sunLon);
    const vaara = vaaraFromDateStr(entry.date);
    const moonNakshatra = nakshatraFromLongitude(moonLon);

    const result = {
      date: entry.date,
      vaara,
      tithi,
      yoga,
      karana,
      moon: {
        rasiId: moon.rasiId,
        sign: RASI_NAMES_URDU[moon.rasiId],
        signLatin: RASI_NAMES_LATIN[moon.rasiId],
        dignity: planetDignity('Moon', moon.rasiId),
        nakshatra: moonNakshatra,
      },
    };
    if (typeof ascendantRasiId === 'number') {
      result.moon.house = houseFromReference(moon.rasiId, ascendantRasiId);
    }
    return result;
  });
}

module.exports = {
  buildPanchangCalendar,
  tithiFromLongitudes,
  yogaFromLongitudes,
  karanaFromLongitudes,
  vaaraFromDateStr,
};
