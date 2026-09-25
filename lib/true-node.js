// lib/true-node.js
//
// Rahu/Ketu ka TRUE (osculating) Node — session 6 (2026-09-25) mein 2
// independent astrologers (WhatsApp session 5 ka user + ek astrology
// TEACHER) ki maang par banaya gaya. Pehle is app mein (aur VedAstro/
// Prokerala dono APIs mein) sirf MEAN Node available tha, koi client-side
// option nahi thi (dekhein ROADMAP.md "Rahu/Ketu node type" section — poori
// tehqeeq wahan hai: VedAstro internally Swiss Ephemeris ka
// Calculate.UseMeanRahuKetu naam ka ek GLOBAL server-side switch istemal
// karta hai, jo API request se control nahi ho sakta).
//
// TARIQA-E-KAR (kaise, bina kisi npm/ephemeris-library ke, ye nikala gaya):
// Swiss Ephemeris khud "true/osculating node" (SE_NODBIT_OSCU — dekhein
// astro.com/swisseph/swephprg.htm) ko us waqt ke Moon ke ASAL (perturbed)
// orbital plane se nikalta hai. Kisi bhi orbital plane ka "ascending node"
// (jahan wo reference-plane/ecliptic ko neeche se upar cross karta hai)
// khaalis orbital-mechanics ka EK textbook formula hai — koi approximation
// ya guess nahi:
//   - Do qareebi lamhaat T1, T2 par Moon ki (longitude, latitude) position
//     ko 3D unit vectors r1, r2 mein badla jata hai.
//   - h = r1 × r2 (cross product) us waqt ke orbital-plane ka NORMAL vector
//     deta hai (kyunke Moon ki asal harkat hamesha apne orbital plane ke
//     andar hoti hai, Earth (origin) se guzarti hui — is liye kisi bhi 2
//     qareebi waqt ke position-vectors, dono hi is plane mein hain).
//   - Ascending Node: Ω = atan2(h_x, -h_y) (standard formula — 2 mustaqil
//     sources se verify: orbital-mechanics.space "Classical Orbital
//     Elements and the State Vector" AUR en.wikipedia.org/wiki/
//     Longitude_of_the_ascending_node — dono N = ẑ × ĥ, Ω = atan2(N_y,N_x)
//     dete hain, jo yahan diye formula ke seedha barabar hai).
// Ye Swiss Ephemeris ke apne "osculating" definition ke bilkul mutabiq hai
// (continuous velocity ki jagah 2 discrete-lekin-qareebi samples ka
// cross-product istemal ho raha hai — jitna chhota T2-T1 utni behtar
// approximation, lekin itna bhi chhota nahi ke numerical precision issue
// ho). server.js T1=paidaish ka waqt, T2=T1+3 ghante istemal karta hai —
// is dauran Moon khud ~1.6° chalta hai (cross-product ke liye kaafi hai),
// jab ke True Node khud sirf ~0.05-0.1° hi harakat karta hai (uska sab se
// tez periodic wobble-term ~13.6 din ka cycle hai) — is liye sampling-error
// bohat chhota (~arc-minute level) rehta hai.
//
// VALIDATION (is session mein khud kiya gaya, live VedAstro data se):
//   - 1995-01-15 09:30 Karachi: True Node - Mean Node = +1.06°
//   - 2000-06-15 00:00 Karachi: True Node - Mean Node = -1.39°
//   Dono values bilkul us expected range (~0° se ±1.5°, dono taraf, kyunke
//   oscillation hai na ke static bias) ke andar hain jo astronomy
//   references (note.com ka "Calculation Methods for Nodes in Vedic
//   Astrology" article) batatay hain. Isi tarah, is formula ke andar khud
//   istemal hua "ayanamsa" (tropical-sidereal farq) bhi lib/western-chart.js
//   ke pehle-se-verified `ayanamsaValueForDate()` se cross-check kiya gaya
//   — dono ~30 arc-second (0.008°) ke andar muttafiq milay, jo is poore
//   tariqe ki internal consistency confirm karta hai.
//
// DISCLOSED LIMITATION: ye Swiss Ephemeris ke apne internal (continuous,
// full ELP2000 lunar-theory-based) True Node se ARC-MINUTE level تک
// mil sakta hai, EXACT (arc-second) match ki guarantee nahi — kisi sign
// ya nakshatra boundary ke bilkul aakhri 1-2 arc-minute par honay ki
// soorat mein farq mumkin hai. Ye disclosure UI mein bhi honi chahiye.
'use strict';

function toRad(deg) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad) {
  return (rad * 180) / Math.PI;
}
function normalize360(deg) {
  return ((deg % 360) + 360) % 360;
}

function unitVector(lonDeg, latDeg) {
  const lon = toRad(lonDeg);
  const lat = toRad(latDeg);
  return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * @param {{longitude:number, latitude:number}} sample1 - Moon ki TROPICAL
 *   (Sayana) ecliptic position, waqt T1 par (VedAstro SwissEphemeris field).
 * @param {{longitude:number, latitude:number}} sample2 - waqt T2 (> T1) par.
 * @param {number} ayanamsaDeg - us tareekh ka ayanamsa (tropical-sidereal
 *   farq, degrees mein) — sidereal frame mein convert karne ke liye.
 * @returns {number} True Node (Rahu, ascending node) ki SIDEREAL
 *   longitude, 0-360° ke darmiyan.
 */
function computeTrueNodeSiderealLongitude(sample1, sample2, ayanamsaDeg) {
  const r1 = unitVector(sample1.longitude, sample1.latitude);
  const r2 = unitVector(sample2.longitude, sample2.latitude);
  const h = cross(r1, r2);
  const omegaTropical = normalize360(toDeg(Math.atan2(h[0], -h[1])));
  return normalize360(omegaTropical - ayanamsaDeg);
}

function rasiFromSiderealLongitude(lonDeg) {
  const lon = normalize360(lonDeg);
  const rasiId = Math.floor(lon / 30) % 12;
  const degree = lon - rasiId * 30;
  return { rasiId, degree };
}

module.exports = {
  computeTrueNodeSiderealLongitude,
  rasiFromSiderealLongitude,
};
