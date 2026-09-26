// lib/lal-kitab.js — "لال کتاب" tab ke liye (Asif ne pehle bhi AstroSage
// jaisa Lal Kitab option maanga tha; 2026-09-25 ko "jitnay bhi systems hain
// un sab ka tab" ke tehat).
//
// Lal Kitab (1939-1952, Urdu mein likhi gayi, Pt. Roop Chand Joshi se
// mansoob) ka chart:
//   * Ghar (houses) FIXED hote hain — pehle ghar mein hamesha Aries (1), doosre
//     mein Taurus (2) ... (paramarsh.app/patrika/lal-kitab/lal-kitab-houses-
//     pakka-ghar: "Aries as the first sign ... regardless of the rising
//     sign"). Graha usi GHAR mein rehte hain jis mein woh janam-kundli
//     (lagna se) mein hain — sirf rashi-number badal kar ghar-number ho jata
//     hai.
//   * PAKKA GHAR (permanent house) — sources mein kuch ikhtilaf hai:
//       paramarsh.app: Sun 1 · Moon 4 · Mars 3,8 · Mercury 6,7 · Jupiter
//         2,5,9,12 · Venus 7 · Saturn 8,10,11 · Rahu 12 · Ketu 6
//       astrobix.com (primary houses): Sun 1 · Jupiter 2,5,9,11,12 · Mars
//         3,8 · Moon 4 · Mercury 6,7 · Ketu 6 · Venus 7 · Saturn 8,10
//       astrosage.com (LK general principles): "The 7th house is regarded as
//         the Pucca Ghar of Mercury."
//     Yahan `primary` mein sirf woh ghar hain jin par SAB sources muttafiq hain,
//     aur `extended` mein woh jo kuch sources mein izafi hain — dono alag
//     label ke saath dikhaye jate hain (koi ek list "sahi" bana kar nahi).
//   * NOT INCLUDED: Lal Kitab ke upay (remedies) — Asif ki hidayat hai ke
//     upay Islami azkaar/duaon se hon; aur LK ki "soya ghar/soya graha",
//     "rin (karz)" jaise qawaid ke liye abhi 2 mustaqil sources tasdeeq nahi
//     kiye gaye (AKSRA — agla marhala).
'use strict';

// primary = paramarsh AUR astrobix dono mein (Mercury ke liye astrosage bhi).
// Rahu 12 sirf paramarsh mein mila (astrobix ki list mein Rahu hai hi nahi) —
// is liye use "extended" mein rakha gaya hai.
const PAKKA_PRIMARY = {
  Sun: [1], Moon: [4], Mars: [3, 8], Mercury: [7], Jupiter: [2, 5, 9, 12],
  Venus: [7], Saturn: [8, 10], Rahu: [], Ketu: [6],
};
const PAKKA_EXTENDED = {
  Mercury: [6], Jupiter: [11], Saturn: [11], Rahu: [12],
};

function buildLalKitab(natal) {
  const lagnaId = natal.ascendantRasiId;
  const planets = natal.planets || {};
  const houses = [];
  for (let h = 1; h <= 12; h++) houses.push({ house: h, lkSign: h, planets: [] });
  const rows = [];
  for (const p of Object.keys(PAKKA_PRIMARY)) {
    if (!planets[p] || planets[p].rasiId == null) continue;
    const house = (((planets[p].rasiId - lagnaId) % 12) + 12) % 12 + 1;
    houses[house - 1].planets.push(p);
    const inPrimary = PAKKA_PRIMARY[p].includes(house);
    const inExtended = !inPrimary && (PAKKA_EXTENDED[p] || []).includes(house);
    rows.push({
      planet: p,
      house,
      pakkaGhar: PAKKA_PRIMARY[p],
      pakkaGharExtended: PAKKA_EXTENDED[p] || [],
      inPakkaGhar: inPrimary,
      inExtendedPakkaGhar: inExtended,
    });
  }
  // Kaunse pakka-ghar khaali hain (un ka "maalik" graha kahin aur hai).
  return { houses, planets: rows };
}

module.exports = { buildLalKitab, PAKKA_PRIMARY, PAKKA_EXTENDED };
