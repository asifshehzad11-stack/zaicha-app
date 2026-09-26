// lib/nadi.js — "ناڑی" (Nadi) system tab ke liye (Asif ki hidayat
// 2026-09-25: "Nari (Nadi) system aur jitnay bhi Vedic systems hain un sab ka
// tab bnao aur wo system backend par use karo").
//
// ZAROORI DISCLOSURE (AKSRA): asal "Nadi Jyotish" (taad-patra / palm-leaf
// granth jo angoothe ke nishaan se dhoonde jate hain) koi calculation nahi
// hai — use kisi software se "nikala" nahi ja sakta. Is liye yahan sirf woh
// Nadi hisse hain jo khaalis birth-chart se, mustanad qawaid ke saath,
// nikal sakte hain:
//
//  (1) BHRIGU NANDI NADI (BNN, R.G. Rao ki mashhoor shakhsiyat se mansoob)
//      ke "graha-sambandh" (planetary links) — BNN mein ghar (bhava) nahi,
//      RASHI ke faasle se graha jurte hain. Sources (2026-09-25, 3 mustaqil):
//        - astroindus.com/bhrigu-nandi-nadi: same sign ("100% combined"),
//          trines 1-5-9 ("as if 75% in conjunction"), 7th ("strong but
//          dialectical"), 3-11 ("supporting but secondary"), 2-12 ("the
//          weakest relational connection ... but still relevant").
//        - futurestudyonline.com/Article-Details/338: trines 1-5-9 "together",
//          2nd = future contact, 12th = past, 7th = opposite, 3rd/11th.
//        - shatabhishaastrology.com/fundamental-principles-of-nadi-astrology:
//          same sign, trinal (1-5-9), opposition (7th).
//      Karaka (sources: astroindus + shatabhisha): Jupiter = mard ka "jeev"
//      (self), Venus = aurat ka self / mard ki biwi, Saturn = pesha/karma,
//      Mars = aurat ki kundli mein shohar / bhai, Sun = walid, Moon = walida.
//      NOT INCLUDED (sirf 1 source mein mila): retrograde graha ka "pichhli
//      rashi se bhi" jurna — futurestudyonline mein hai, astroindus mein
//      nahi; is liye shamil nahi kiya.
//
//  (2) NAKSHATRA NADI (Adi/Madhya/Antya) — Moon ke nakshatra se; Kundli Milan
//      ki "Nadi Koota" isi par hai. Table lib/kundli-milan.js wali (2 sources,
//      aur 2026-09-25 ko Purva Bhadrapada wali ghalti bhi theek ki gayi).
'use strict';

const { NADI_BY_NAKSHATRA } = require('./kundli-milan');

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

// rashi-faasla (0-based: other ki rashi - is graha ki rashi) -> relation
function relationFor(diff) {
  switch (diff) {
    case 0: return 'conjunct';
    case 4: return 'trine5';
    case 8: return 'trine9';
    case 6: return 'opposite';
    case 1: return 'second';
    case 11: return 'twelfth';
    case 2: return 'third';
    case 10: return 'eleventh';
    default: return null; // 4th/6th/8th/10th — BNN "hidden" (futurestudyonline)
  }
}
const STRENGTH = {
  conjunct: 'strongest', trine5: 'strong', trine9: 'strong', opposite: 'strong',
  third: 'secondary', eleventh: 'secondary', second: 'weak', twelfth: 'weak',
};

const KARAKA_FOCUS = [
  { key: 'selfMale', planet: 'Jupiter' },
  { key: 'selfFemale', planet: 'Venus' },
  { key: 'career', planet: 'Saturn' },
  { key: 'father', planet: 'Sun' },
  { key: 'mother', planet: 'Moon' },
  { key: 'siblingsHusband', planet: 'Mars' },
  { key: 'intellect', planet: 'Mercury' },
];

function buildNadi(natal) {
  const planets = natal.planets || {};
  const links = {};
  for (const a of PLANETS) {
    if (!planets[a] || planets[a].rasiId == null) continue;
    links[a] = [];
    for (const b of PLANETS) {
      if (a === b || !planets[b] || planets[b].rasiId == null) continue;
      // Rahu-Ketu hamesha ek doosre se 7th hote hain — is joray ko "link"
      // gin'na be-maani hai, chhod diya.
      if ((a === 'Rahu' && b === 'Ketu') || (a === 'Ketu' && b === 'Rahu')) continue;
      const diff = (((planets[b].rasiId - planets[a].rasiId) % 12) + 12) % 12;
      const rel = relationFor(diff);
      if (rel) links[a].push({ with: b, relation: rel, strength: STRENGTH[rel] });
    }
    const order = { strongest: 0, strong: 1, secondary: 2, weak: 3 };
    links[a].sort((x, y) => order[x.strength] - order[y.strength]);
  }

  const karakaFocus = KARAKA_FOCUS
    .filter((k) => links[k.planet])
    .map((k) => ({
      key: k.key,
      planet: k.planet,
      rasiId: planets[k.planet].rasiId,
      isRetrograde: !!planets[k.planet].isRetrograde,
      links: links[k.planet],
    }));

  let nakshatraNadi = null;
  if (planets.Moon && planets.Moon.rasiId != null) {
    const lon = planets.Moon.rasiId * 30 + (planets.Moon.degree || 0);
    const idx = Math.floor(lon / (360 / 27)) % 27;
    nakshatraNadi = { nakshatraIndex: idx, nadi: NADI_BY_NAKSHATRA[idx] };
  }

  return { links, karakaFocus, nakshatraNadi };
}

module.exports = { buildNadi };
