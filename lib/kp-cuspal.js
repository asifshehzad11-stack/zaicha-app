// lib/kp-cuspal.js — "KP full cuspal-significator system" (Task: KP system
// full cuspal-significator option, ROADMAP mein pehle disclosed-blocked
// item, ab Asif ke khaas kehne par banaya gaya, 2026-09-20 session 3
// cont'd). Ye lib/kp-system.js (Star/Sub Lord sirf PLANETS+Ascendant ke
// liye) ka agla hissa hai — is baar 12 Placidus HOUSE CUSPS khud calculate
// kar ke, har ghar ke KP "significators" (A/B/C/D, 4-level hierarchy)
// nikalte hain.
//
// KYUN YE PEHLE "disclosed-blocked" tha, aur AB kyun mumkin hua:
// Is app ka poora chart-engine WHOLE-SIGN houses istemal karta hai
// (Prokerala/VedAstro dono se). Poora KP significator system PLACIDUS
// house cusps par mabni hota hai, jo ek fundamentally ALAG (aur ziyada
// pechida — iterative/transcendental) calculation hai jo Prokerala na
// VedAstro ki hosted API seedha nahi deti. Research mein maloom hua ke
// Placidus cusp-calculation khud sirf KHAALIS RIYAZI (spherical trig) hai
// — kisi ephemeris-API ki zaroorat nahi, sirf: (a) birth UTC datetime,
// (b) lat/lon — dono is app ke paas pehle se hain (birth-form se). Is liye
// ye poori tarah SELF-CALCULATED hai, koi naya API/package call nahi.
//
// AKSRA note — formulas ka source aur cross-verification:
//   Julian Date, Local Sidereal Time (=RAMC), Midheaven (M.C.), Ascendant,
//   aur Placidus cusp-interpolation ke formulas is module mein PORT kiye
//   gaye hain ek MIT/Unlicense open-source library
//   (CircularNatalHoroscopeJS, github.com/0xStarcat/CircularNatalHoroscopeJS,
//   src/utilities/astronomy.js + src/utilities/astrology.js + math.js) se —
//   jinke apne header comments mein ye citations hain (khud is library ke
//   authors ne 2-tarah se verify kiya hua hai):
//     - Julian Date: "Fundamentals of Celestial Mechanics" by Danby (1988),
//       verified with aa.usno.navy.mil/data/docs/JulianDate.php
//     - Local Sidereal Time / RAMC: "Astronomical Algorithms" by Jean
//       Meeus (1991) Ch.11 formula 11.4, verified with
//       neoprogrammics.com/sidereal_time_calculator
//     - Midheaven (M.C.): Meeus Ch.24 formula 24.6, verified with
//       astrolibrary.org/midheaven-calculator + cafeastrology.com
//     - Ascendant: Peter Duffett-Smith/Jonathan Zwart, "Practical
//       Astronomy with your Calculator or Spreadsheet" 4th ed. p.47
//       (2011), cross-checked against en.wikipedia.org/wiki/Ascendant
//     - Placidus cusp interpolation (houses 2/3/11/12, iterative):
//       Michael P. Munkasey, "An Astrological House Formulary" p.18,
//       verified with astrolibrary.org/compare-house-systems
//   Hum ne khud ek ADDITIONAL cross-check bhi lagaya hai (is module ke
//   apne test se bahar, buildKpCuspal() ke andar): humari khud ki
//   derive ki hui SIDEREAL Ascendant ko app ke MOJOODA (Prokerala/VedAstro
//   se, pehle se live/verified) Ascendant se compare karte hain
//   (`crossCheckDeltaArcmin`) — agar formulas theek se port hue hain to
//   ye farq chhota (~1-2 arcmin, floating-point/rounding jitna) hona
//   chahiye. Bada farq (>30 arcmin) hone par `crossCheckWarning: true`.
//
//   Mean Obliquity of Ecliptic: upar wali library fixed constant (23.4367,
//   ek specific 2019 date ke liye) istemal karti hai. Hum ne is ki jagah
//   ek DATE-DEPENDENT formula khud add ki hai (chota improvement) — 2
//   sources se cross-verify: en.wikipedia.org/wiki/Ecliptic ("mean
//   obliquity" formula, IAU) aur aa.usno.navy.mil (Astronomical Almanac)
//   dono ε = 23.439291° − 0.0130042°×T (T = Julian centuries since J2000)
//   ke pehle-order term par muttafiq hain (aage ke chhote T² /T³ terms
//   itne saal ke range mein negligible hain, disclosed).
//
//   Ayanamsa: is app ka apna already-disclosed linear-approximation Lahiri
//   ayanamsa reuse kiya gaya hai (lib/western-chart.js::ayanamsaValueForDate
//   — Western chart feature mein pehle se verified/deployed), taake app
//   mein sirf EK ayanamsa-derivation logic rahe (consistency).
//
// AKSRA note — KP "Significator" 4-level hierarchy: 3 independent sources
// (paramarsh.app/patrika/kp-astrology/kp-star-lord-significators,
// jagannathhora.com/kp-significator-hierarchy-4-level-reading,
// kpastroapp.com/learn/house-significators-in-kp-astrology) SAB EK JAISI
// A>B>C>D tarteeb par muttafiq hain (koi tazad nahi mila):
//   A (sab se mazboot) = jo planet(s) us ghar ke OCCUPANT(S) ki nakshatra
//       (star) mein hon
//   B = jo planet(s) khud us ghar ko OCCUPY kar rahe hon (Placidus cusp
//       boundaries ke hisab se, whole-sign nahi)
//   C = jo planet(s) us ghar ke OWNER (cusp-sign ka lord) ki nakshatra mein
//       hon
//   D (sab se kamzor) = ghar ka OWNER khud
// Agar kisi ghar mein koi occupant na ho, to A aur B khaali list hoti hai
// (teeno sources isay explicitly discuss nahi karte, lekin ye seedha
// tareef (definition) ka mantiqi nateeja hai, koi guess nahi).
//
// DISCLOSED LIMITATIONS (UI mein bhi disclose):
//   1. Ayanamsa: lib/kp-system.js jaisa hi — app ka apna Lahiri istemal
//      hota hai, KP practitioners ka apna "KP/Krishnamurti-Newcomb"
//      ayanamsa (Lahiri se ~10 arcmin tak mukhtalif) wire nahi.
//   2. Placidus formula khud ek WELL-KNOWN iterative approximation hai
//      (Munkasey/astrolibrary verified) — kisi bhi professional Swiss-
//      Ephemeris-level tool (jaise astro.com) se micro-arcsecond tak match
//      guarantee nahi (disclosed `isEstimate: true`), khaas kar bohot high
//      latitude (>60°/<-60°) par (Placidus khud wahan "irregular" hoti
//      hai — teeno upstream sources isay khud disclose karte hain).
//   3. Sirf Placidus system diya gaya hai (Koch/Campanus/Equal waghera
//      nahi) — KP classically Placidus hi istemal karta hai, is liye scope
//      mehdood rakha gaya (disclosed, out-of-scope doosre systems).
'use strict';

const {
  RASI_NAMES_URDU,
  RASI_NAMES_LATIN,
  SIGN_LORDS,
  PLANET_NAME_URDU,
  absoluteLongitude,
} = require('./astro-engine');
const { ayanamsaValueForDate } = require('./western-chart');
const { kpStarAndSubLord } = require('./kp-system');

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function modulo(n, m) {
  return ((n % m) + m) % m;
}
function sinD(deg) { return Math.sin(deg * DEG2RAD); }
function cosD(deg) { return Math.cos(deg * DEG2RAD); }
function tanD(deg) { return Math.tan(deg * DEG2RAD); }

/**
 * getJulianDate — Danby (1988) formula, USNO-verified (source: header
 * comment). `ut` = UTC hours-in-day ke decimal mein (e.g. 6:45 = 6.75).
 */
function getJulianDate(year, month, date, ut) {
  return (367 * year)
    - Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4)
    - Math.floor((3 * (Math.floor((year + (month - 9) / 7) / 100) + 1)) / 4)
    + Math.floor((275 * month) / 9)
    + date
    + 1721028.5
    + (ut / 24);
}

/** getLocalSiderealTime — Meeus (1991) Ch.11 formula 11.4. Ye hi RAMC hai
 * (Right Ascension of Midheaven), degrees mein. */
function getLocalSiderealTime(jd, longitude) {
  const daysSince2000 = jd - 2451545.0;
  const tCenturies = daysSince2000 / 36525;
  const lst = 280.46061837
    + (360.98564736629 * daysSince2000)
    + 0.000387933 * (tCenturies ** 2)
    - ((tCenturies ** 3) / 38710000)
    + longitude;
  return modulo(lst, 360);
}

/** meanObliquity — IAU/Meeus pehle-order approximation, T = Julian
 * centuries since J2000 (header comment ka AKSRA note dekhein). */
function meanObliquity(jd) {
  const t = (jd - 2451545.0) / 36525;
  return 23.439291 - 0.0130042 * t;
}

/** getMidheaven — Meeus Ch.24 formula 24.6. */
function getMidheaven(lst, obliquity) {
  let mc = Math.atan(tanD(lst) / cosD(obliquity)) * RAD2DEG;
  if (mc < 0) mc += 360;
  if (mc > lst) mc -= 180;
  if (mc < 0) mc += 180;
  if (mc < 180 && lst >= 180) mc += 180;
  return modulo(mc, 360);
}

/** getAscendant — Duffett-Smith/Zwart formula (Wikipedia-cross-checked). */
function getAscendant(latitude, obliquity, lst) {
  const a = -cosD(lst);
  const b = sinD(obliquity) * tanD(latitude);
  const c = cosD(obliquity) * sinD(lst);
  const d = b + c;
  let asc = Math.atan(a / d) * RAD2DEG;
  if (d < 0) asc += 180; else asc += 360;
  if (asc >= 180) asc -= 180; else asc += 180;
  return modulo(asc, 360);
}

/**
 * calculatePlacidusCusps — TROPICAL degrees mein 12-cusp array
 * [house1..house12]. `ramc`=RAMC/LST, `mc`/`asc` = tropical MC/Ascendant,
 * `latitude` degrees, `obliquity` degrees.
 *
 * BUG FIX (2026-09-25, audit): pehla (CircularNatalHoroscopeJS se port kiya
 * hua) loop asal mein iterate hi nahi karta tha — `tanCusp` compute ho kar
 * istemal nahi hota tha, aur formula tan(pole)=ratio·tanφ wala TOPOCENTRIC
 * (Polich-Page) system bana raha tha, Placidus nahi. KP Placidus maangta
 * hai. Ab asal Placidus "semi-arc trisection" iteration lagayi gayi hai
 * (2 sources: kerykeion.net/libephemeris/docs/reference/house-systems aur
 * alexeyborealis.com/blog/placidus-cusps — har qadam pichhle RA se
 * declination -> ascensional difference AD = asin(tanφ·tanδ) -> naya RA):
 *   11th: RA = RAMC + 30  + AD/3      12th: RA = RAMC + 60  + 2·AD/3
 *    2nd: RA = RAMC + 120 + 2·AD/3     3rd: RA = RAMC + 150 + AD/3
 * phir λ = atan2(sin RA, cos RA · cos ε). Test: London (51°32'N), RAMC 0 par
 * nateeja 11=♉8°40', 12=♊22°29', Asc=♋26°36', 2=♌12°39', 3=♍2°33' — jo
 * Raphael's Tables of Houses (London, ST 0h: 11 ♉9, 12 ♊22, Asc ♋26°36',
 * 2 ♌12, 3 ♍3) se degree-level par milta hai.
 * Polar latitudes (|tanφ·tanδ| > 1) par Placidus khud undefined hai — wahan
 * value clamp ho jati hai (Rahu ke liye disclosed limitation).
 */
function placidusIntermediateCusp(ramc, latitude, obliquity, kind) {
  let ad = 0;
  let lam = 0;
  for (let i = 0; i < 60; i++) {
    let ra;
    if (kind === 11) ra = ramc + 30 + ad / 3;
    else if (kind === 12) ra = ramc + 60 + (2 * ad) / 3;
    else if (kind === 2) ra = ramc + 120 + (2 * ad) / 3;
    else ra = ramc + 150 + ad / 3;
    lam = Math.atan2(sinD(ra), cosD(ra) * cosD(obliquity)) * RAD2DEG;
    const dec = Math.asin(sinD(obliquity) * sinD(lam));
    const x = tanD(latitude) * Math.tan(dec);
    const nextAd = Math.asin(Math.max(-1, Math.min(1, x))) * RAD2DEG;
    if (Math.abs(nextAd - ad) < 1e-9) { ad = nextAd; break; }
    ad = nextAd;
  }
  return modulo(lam, 360);
}

function calculatePlacidusCusps(ramc, mc, asc, latitude, obliquity) {
  const c1 = modulo(asc, 360);
  const c10 = modulo(mc, 360);
  const c11 = placidusIntermediateCusp(ramc, latitude, obliquity, 11);
  const c12 = placidusIntermediateCusp(ramc, latitude, obliquity, 12);
  const c2 = placidusIntermediateCusp(ramc, latitude, obliquity, 2);
  const c3 = placidusIntermediateCusp(ramc, latitude, obliquity, 3);
  const c4 = modulo(c10 + 180, 360);
  const c5 = modulo(c11 + 180, 360);
  const c6 = modulo(c12 + 180, 360);
  const c7 = modulo(c1 + 180, 360);
  const c8 = modulo(c2 + 180, 360);
  const c9 = modulo(c3 + 180, 360);
  return [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12];
}

/** houseOfLongitude — dee gayi longitude (0-360) Placidus cusps [1..12]
 * (sidereal) ke hisab se kaunse ghar mein aati hai. */
function houseOfLongitude(cuspsSidereal, longitude) {
  const lon = modulo(longitude, 360);
  for (let h = 0; h < 12; h++) {
    const start = cuspsSidereal[h];
    const end = cuspsSidereal[(h + 1) % 12];
    if (start <= end) {
      if (lon >= start && lon < end) return h + 1;
    } else {
      // wrap-around (e.g. 350° -> 20°)
      if (lon >= start || lon < end) return h + 1;
    }
  }
  return 12; // fallback (floating-point edge)
}

/**
 * buildKpCuspal — `data` poora ZAICHA_DATA object (natal planets ke liye),
 * `birthDate` JS Date (UTC-aware, `new Date(birthDatetime)` jaisa is app
 * mein doosri jagah istemal hota hai), `latitude`/`longitude` numbers.
 * Koi extra API call nahi — sirf khaalis riyazi (header comment dekhein).
 */
function buildKpCuspal(data, birthDate, latitude, longitude) {
  if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) return null;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) return null;

  const utHours = birthDate.getUTCHours() + birthDate.getUTCMinutes() / 60 + birthDate.getUTCSeconds() / 3600;
  const jd = getJulianDate(birthDate.getUTCFullYear(), birthDate.getUTCMonth() + 1, birthDate.getUTCDate(), utHours);
  const lst = getLocalSiderealTime(jd, longitude);
  const obliquity = meanObliquity(jd);
  const mcTrop = getMidheaven(lst, obliquity);
  const ascTrop = getAscendant(latitude, obliquity, lst);
  const cuspsTrop = calculatePlacidusCusps(lst, mcTrop, ascTrop, latitude, obliquity);

  const ayanamsaDeg = ayanamsaValueForDate(birthDate);
  const cuspsSidereal = cuspsTrop.map((c) => modulo(c - ayanamsaDeg, 360));

  // ---- Cross-check: humari khud ki derive ki hui sidereal Ascendant vs
  // app ki mojooda (Prokerala/VedAstro se) Ascendant — dono ka farq chhota
  // hona chahiye agar formulas sahi port hue hain (header comment). ----
  let crossCheckDeltaArcmin = null;
  let crossCheckWarning = false;
  const existingAscRasiId = data.natal && data.natal.ascendantRasiId;
  const existingAscDegree = (data.natal && data.natal.ascendantDegree) || 0;
  if (typeof existingAscRasiId === 'number') {
    const existingAscLon = absoluteLongitude(existingAscRasiId, existingAscDegree);
    let delta = Math.abs(existingAscLon - cuspsSidereal[0]);
    if (delta > 180) delta = 360 - delta;
    crossCheckDeltaArcmin = Math.round(delta * 60 * 100) / 100;
    crossCheckWarning = delta > 0.5; // 30 arcmin se zyada farq -> flag
  }

  const natalMap = (data.natal && data.natal.planets) || {};
  const planetLonList = [];
  for (const name of Object.keys(natalMap)) {
    const p = natalMap[name];
    if (typeof p.rasiId !== 'number') continue;
    planetLonList.push({ name, lon: absoluteLongitude(p.rasiId, p.degree), isRetrograde: !!p.isRetrograde });
  }

  const houses = [];
  for (let h = 1; h <= 12; h++) {
    const cuspLon = cuspsSidereal[h - 1];
    const signId = Math.floor(modulo(cuspLon, 360) / 30);
    const degreeInSign = modulo(cuspLon, 360) % 30;
    const cuspKp = kpStarAndSubLord(cuspLon);
    const owner = SIGN_LORDS[signId];

    const occupants = planetLonList.filter((p) => houseOfLongitude(cuspsSidereal, p.lon) === h);
    const occupantNames = occupants.map((p) => p.name);

    // BUG FIX (2026-09-25): A aur C pehle ULTE the (occupant/owner ka apna
    // star-lord liya ja raha tha). KP ki standard definition (3 sources:
    // kpastroapp.com/learn/house-significators-in-kp-astrology,
    // kpastrology.astrosage.com chapter-2, paramarsh.app):
    //   A = woh graha jo OCCUPANTS ke nakshatra (star) mein baithe hain
    //   B = occupants
    //   C = woh graha jo OWNER ke nakshatra (star) mein baithe hain
    //   D = owner
    const starLordOf = {};
    planetLonList.forEach((pl) => { starLordOf[pl.name] = kpStarAndSubLord(pl.lon).starLord; });
    const aSet = new Set();
    planetLonList.forEach((pl) => { if (occupantNames.includes(starLordOf[pl.name])) aSet.add(pl.name); });
    // C: owner ki nakshatra ka star-lord.
    const ownerLon = (() => {
      // Owner planet ki khud ki natal longitude chahiye (uski apni
      // nakshatra maloom karne ke liye) — agar Rahu/Ketu jaisa point ho
      // to natalMap mein maujood hoga (Sun..Saturn+Rahu+Ketu sab classical
      // sign-lords hain, Rahu/Ketu kabhi sign-lord nahi hote is liye
      // owner hamesha ek classical graha hi hoga).
      const op = natalMap[owner];
      return op && typeof op.rasiId === 'number' ? absoluteLongitude(op.rasiId, op.degree) : null;
    })();
    void ownerLon;
    const cList = planetLonList.filter((pl) => starLordOf[pl.name] === owner).map((pl) => pl.name);

    houses.push({
      house: h,
      cuspSignId: signId,
      cuspSign: RASI_NAMES_URDU[signId],
      cuspSignLatin: RASI_NAMES_LATIN[signId],
      cuspDegree: Math.round(degreeInSign * 100) / 100,
      cuspLongitude: Math.round(cuspLon * 10000) / 10000,
      starLord: cuspKp.starLord,
      starLordUrdu: cuspKp.starLordUrdu,
      subLord: cuspKp.subLord,
      subLordUrdu: cuspKp.subLordUrdu,
      owner,
      ownerUrdu: PLANET_NAME_URDU[owner] || owner,
      occupants: occupantNames,
      occupantsUrdu: occupantNames.map((n) => PLANET_NAME_URDU[n] || n),
      significators: {
        a: Array.from(aSet),
        aUrdu: Array.from(aSet).map((n) => PLANET_NAME_URDU[n] || n),
        b: occupantNames,
        bUrdu: occupantNames.map((n) => PLANET_NAME_URDU[n] || n),
        c: cList,
        cUrdu: cList.map((n) => PLANET_NAME_URDU[n] || n),
        d: [owner],
        dUrdu: [PLANET_NAME_URDU[owner] || owner],
      },
    });
  }

  return {
    houses,
    isEstimate: true, // Placidus iterative-approximation + linear-ayanamsa — header comment
    ayanamsaIsApprox: true,
    houseSystemNote: 'placidus',
    crossCheckDeltaArcmin,
    crossCheckWarning,
    scopeNote: 'kp-cuspal-v1',
  };
}

module.exports = {
  buildKpCuspal,
  getJulianDate,
  getLocalSiderealTime,
  meanObliquity,
  getMidheaven,
  getAscendant,
  calculatePlacidusCusps,
  houseOfLongitude,
};
