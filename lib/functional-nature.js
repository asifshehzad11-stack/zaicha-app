// lib/functional-nature.js
//
// "THE CELESTIAL BLUEPRINT" — Asif ki upload ki hui PDF (10 slides,
// "Decoding Auspicious & Inauspicious Planets: A Modern Diagnostic
// Framework for Laghu Parashari Principles") ke tariqe par har graha ki
// FUNCTIONAL NATURE (lagna ke hisaab se shubh/ashubh) nikalta hai. Asif ki
// hidayat (2026-09-25): "jab zaicha create ho to is attached file mein jo
// methods use huay hain usi andaz mein zaichay ko bayan karo".
//
// PDF ke methods jo yahan code kiye gaye hain (slide number ke saath):
//   Slide 2  — Natural nature nahi, FUNCTIONAL nature dekhi jaye (lagna se
//              kaunse ghar ka malik hai).
//   Slide 3  — 3 Pillars: (1) Lagna Friendship (lagna-lord se natural
//              dosti/dushmani = baseline), (2) Kendra & Trikona (blessings),
//              (3) Trishadaya 3/6/11 (obstacles).
//   Slide 4  — Zones: Kendra 1,4,7,10 · Trikona 1,5,9 · Trishadaya 3,6,11 ·
//              Maraka 2,7.
//   Slide 5  — Functional Diagnostic Engine (flowchart):
//              Red Flag: 3/6/11 ka malik?  -> Path A: Functional Malefic
//              Golden Rule: Kendra AUR Trikona dono? -> Path B: Yoga Karaka
//              Maraka Check: 2 AUR 7 dono? -> Path C: Mixed/Neutral
//              warna -> Path D: Placement dependent.
//   Slide 6  — Yoga Karaka (Kingmaker).
//   Slide 7  — Exceptions: (1) Maraka Paradox (do maraka = negativity kam),
//              (2) 8th/12th Neutrality (contextual, placement par munhasir),
//              (3) Kendra Adhipati Dosha (natural benefic 2 kendron ka malik).
//   Slide 8-9 — Ascendant Diagnostic Matrix (12 lagnon ki Champion/Neutral/
//              Antagonist table) — HUBAHU neeche ASCENDANT_MATRIX mein.
//   Slide 10 — Trikona Principle: "Jis ki Trikon achi, uski zindagi achi."
//
// AKSRA DISCLOSURES (kisi andaze ko haqiqat bana kar pesh nahi kiya gaya):
//   * Matrix (slides 8-9) PDF ka apna "final" faisla hai, is liye jo graha
//     matrix mein likha hai us ka verdict MATRIX se liya jata hai
//     (verdictSource:'matrix'). Jo graha kisi lagna ke liye matrix mein
//     likha hi nahi (masalan Aries ke liye Sun/Moon/Jupiter), un ka verdict
//     slide 5 ke flowchart se nikala jata hai aur saaf label hota hai
//     (verdictSource:'flowchart').
//   * Kuch jagah matrix aur flowchart mukhtalif hain (masalan Aries ke liye
//     Saturn 11th ka malik hai — flowchart "Red Flag" kehta, matrix
//     "Neutral") — aisi jagah PDF ki table (matrix) ko tarjeeh di gayi hai,
//     aur `flowchartPath` alag se bhi diya jata hai taake farq nazar aaye.
//   * Pisces ki "Neutral" column mein PDF mein "None purely positive" likha
//     hai (ye jumla asal mein Gemini ki Champion column jaisa hai — shayad
//     slide ki typing ghalti). Isay khaali (koi neutral nahi) samjha gaya.
//   * Rahu/Ketu PDF ke framework mein shamil hi nahi (kisi rashi ke malik
//     nahi) — un ka verdict 'placement' (Path D) rakha gaya, label ke saath.
//   * Trikona "level" (strong/moderate/weak) PDF ke slide 10 ke usool ka
//     app ki taraf se ek saaf, transparent summary hai (kaunse graha trikon
//     se jure hain aur un ka functional verdict kya hai) — PDF khud koi
//     number/score nahi deti.
'use strict';

const SIGN_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];
const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const NODES = ['Rahu', 'Ketu'];

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const TRISHADAYA = [3, 6, 11];
const MARAKA = [2, 7];
const DUSTHANA = [6, 8, 12];

// Naisargika (natural) friendship — BPHS, wahi table jo lib/kundli-milan.js
// mein 2 sources se verified hai.
const NATURAL_FRIENDSHIP = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'] },
};
const NATURAL_BENEFICS = ['Jupiter', 'Venus', 'Mercury', 'Moon'];

// ---- Slides 8 & 9: "The Ascendant Diagnostic Matrix" — hubahu. ----
// note codes: yk = Yoga Karaka, dm = Double Maraka cancellation,
// kad = Kendra Adhipati (dosha), t36 = 3rd/6th lord, rj = Raj Yoga.
const ASCENDANT_MATRIX = {
  0: { champion: [['Mars']], neutral: [['Saturn'], ['Venus', 'dm']], antagonist: [['Mercury', 't36']] }, // Aries
  1: { champion: [['Saturn', 'yk'], ['Sun']], neutral: [['Venus'], ['Mercury']], antagonist: [['Jupiter'], ['Mars'], ['Moon']] }, // Taurus
  2: { champion: [], neutral: [['Saturn'], ['Venus']], antagonist: [['Mars'], ['Sun'], ['Moon'], ['Jupiter', 'kad']] }, // Gemini
  3: { champion: [['Mars', 'yk']], neutral: [['Jupiter']], antagonist: [['Saturn'], ['Mercury'], ['Venus']] }, // Cancer
  4: { champion: [['Mars', 'yk']], neutral: [['Moon']], antagonist: [['Saturn'], ['Mercury'], ['Venus']] }, // Leo
  5: { champion: [['Venus']], neutral: [['Saturn'], ['Sun']], antagonist: [['Mars'], ['Jupiter'], ['Moon']] }, // Virgo
  6: { champion: [['Saturn', 'yk'], ['Mercury']], neutral: [['Moon'], ['Mars']], antagonist: [['Jupiter'], ['Sun']] }, // Libra
  7: { champion: [['Jupiter'], ['Moon'], ['Sun']], neutral: [['Saturn']], antagonist: [['Mercury'], ['Venus']] }, // Scorpio
  8: { champion: [['Sun', 'rj'], ['Jupiter'], ['Mars']], neutral: [['Moon']], antagonist: [['Venus'], ['Saturn']] }, // Sagittarius
  9: { champion: [['Venus', 'yk']], neutral: [['Mercury']], antagonist: [['Moon'], ['Mars'], ['Jupiter'], ['Sun']] }, // Capricorn
  10: { champion: [['Venus', 'yk'], ['Saturn'], ['Mercury']], neutral: [['Mars']], antagonist: [['Jupiter'], ['Moon'], ['Sun']] }, // Aquarius
  11: { champion: [['Moon'], ['Jupiter'], ['Mars']], neutral: [], antagonist: [['Saturn'], ['Venus'], ['Sun'], ['Mercury']] }, // Pisces
};

function houseOfSign(signId, lagnaId) {
  return (((signId - lagnaId) % 12) + 12) % 12 + 1;
}

function ownedHouses(planet, lagnaId) {
  const out = [];
  for (let s = 0; s < 12; s++) {
    if (SIGN_LORDS[s] === planet) out.push(houseOfSign(s, lagnaId));
  }
  return out.sort((a, b) => a - b);
}

function naturalRelation(from, to) {
  if (from === to) return 'self';
  const rel = NATURAL_FRIENDSHIP[from];
  if (!rel) return 'neutral';
  if (rel.friends.includes(to)) return 'friend';
  if (rel.enemies.includes(to)) return 'enemy';
  return 'neutral';
}

function placementZone(house) {
  if (house == null) return null;
  if (house === 1) return 'lagna';
  if (KENDRA.includes(house)) return 'kendra';
  if (TRIKONA.includes(house)) return 'trikona';
  if (DUSTHANA.includes(house)) return 'dusthana';
  if (house === 11) return 'gain';
  return 'other'; // 2, 3
}

/**
 * Slide 5 ka flowchart — bilkul usi tarteeb mein.
 */
function flowchartPath(owns) {
  if (owns.some((h) => TRISHADAYA.includes(h))) return 'A';
  // Golden Rule (slide 5/6): EK kendra AUR EK trikona ki "dual-ownership".
  // Lagna (1) khud kendra bhi hai aur trikona bhi, is liye yahan kendra =
  // 4/7/10 aur trikona = 5/9 liye gaye hain — ye PDF ki apni matrix se
  // hubahu milta hai: matrix mein jin 7 jagah "(Yoga Karaka)" likha hai
  // (Taurus/Libra Saturn, Cancer/Leo Mars, Capricorn/Aquarius Venus) wo
  // sab 4/7/10 + 5/9 ke malik hain, aur Gemini/Virgo ke liye Mercury (1+4,
  // 1+10) ko PDF Yoga Karaka nahi kehti (Gemini: "None purely positive").
  const dualKT = owns.some((h) => [4, 7, 10].includes(h)) && owns.some((h) => [5, 9].includes(h));
  if (dualKT) return 'B';
  if (owns.includes(2) && owns.includes(7)) return 'C';
  return 'D';
}

function verdictFromPath(path) {
  if (path === 'A') return 'antagonist';
  if (path === 'B') return 'champion';
  if (path === 'C') return 'neutral';
  return 'placement';
}

function matrixLookup(lagnaId, planet) {
  const row = ASCENDANT_MATRIX[lagnaId];
  if (!row) return null;
  for (const verdict of ['champion', 'neutral', 'antagonist']) {
    const hit = row[verdict].find((e) => e[0] === planet);
    if (hit) return { verdict, note: hit[1] || null };
  }
  return null;
}

/**
 * @param {object} natal  data.natal  ({ ascendantRasiId, planets: {Sun:{rasiId,degree,isRetrograde},...} })
 * @returns structured, language-neutral result (codes only; frontend I18N
 *   har language mein bayan karta hai).
 */
function buildFunctionalNature(natal) {
  const lagnaId = natal.ascendantRasiId;
  const planets = natal.planets || {};
  const lagnaLord = SIGN_LORDS[lagnaId];
  const houseOfPlanet = (p) => (planets[p] && planets[p].rasiId != null ? houseOfSign(planets[p].rasiId, lagnaId) : null);

  const rows = [];
  for (const p of SEVEN) {
    const owns = ownedHouses(p, lagnaId);
    const path = flowchartPath(owns);
    const m = matrixLookup(lagnaId, p);
    const placedHouse = houseOfPlanet(p);
    const kendrasOwned = owns.filter((h) => KENDRA.includes(h) && h !== 1);
    // Lagna-lord jo matrix mein darj nahi (masalan Cancer ka Moon, Scorpio
    // ka Mars, Capricorn ka Saturn) — PDF ke pehle pillar ke mutabiq wo
    // khud "baseline" hai (baqi sab ki dosti/dushmani usi se naapi jati
    // hai), is liye use flowchart se "antagonist" wagera ka label nahi diya
    // jata; flowchartPath phir bhi saath diya jata hai (transparency).
    const isLagnaLord = p === lagnaLord;
    const verdict = m ? m.verdict : isLagnaLord ? 'baseline' : verdictFromPath(path);
    const row = {
      planet: p,
      owns,
      placedHouse,
      placement: placementZone(placedHouse),
      isRetrograde: !!(planets[p] && planets[p].isRetrograde),
      flowchartPath: path,
      verdict,
      verdictSource: m ? 'matrix' : isLagnaLord ? 'lagnaLord' : 'flowchart',
      matrixNote: m ? m.note : null,
      lagnaRelation: naturalRelation(lagnaLord, p),
      flags: {
        lagnaLord: p === lagnaLord,
        trishadaya: owns.filter((h) => TRISHADAYA.includes(h)),
        kendra: owns.filter((h) => KENDRA.includes(h)),
        trikona: owns.filter((h) => TRIKONA.includes(h)),
        maraka: owns.filter((h) => MARAKA.includes(h)),
        doubleMaraka: owns.includes(2) && owns.includes(7),
        dusthanaNeutral: owns.filter((h) => h === 8 || h === 12),
        yogaKaraka: path === 'B' || !!(m && m.note === 'yk'),
        kendradhipatiDosha: NATURAL_BENEFICS.includes(p) && kendrasOwned.length >= 2,
      },
    };
    // Path D (placement dependent) ka asal natija — graha kahan baitha hai.
    if (row.verdict === 'placement' || row.verdict === 'baseline') {
      row.placementOutcome = ['lagna', 'kendra', 'trikona', 'gain'].includes(row.placement)
        ? 'supportive'
        : row.placement === 'dusthana' ? 'strained' : 'mixed';
    }
    rows.push(row);
  }
  for (const p of NODES) {
    const placedHouse = houseOfPlanet(p);
    if (placedHouse == null) continue;
    const dispositor = planets[p] ? SIGN_LORDS[planets[p].rasiId] : null;
    const zone = placementZone(placedHouse);
    rows.push({
      planet: p,
      owns: [],
      placedHouse,
      placement: zone,
      isRetrograde: true,
      flowchartPath: 'D',
      verdict: 'placement',
      verdictSource: 'nodes',
      matrixNote: null,
      dispositor,
      lagnaRelation: null,
      flags: {},
      placementOutcome: ['lagna', 'kendra', 'trikona', 'gain'].includes(zone) || [3, 6, 11].includes(placedHouse)
        ? 'supportive'
        : zone === 'dusthana' ? 'strained' : 'mixed',
    });
  }

  const byPlanet = {};
  rows.forEach((r) => { byPlanet[r.planet] = r; });

  // ---- Slide 10: Trikona Principle ----
  const trikonaHouses = TRIKONA.map((h) => {
    const signId = (lagnaId + h - 1) % 12;
    const lord = SIGN_LORDS[signId];
    const occupants = Object.keys(planets)
      .filter((p) => houseOfPlanet(p) === h)
      .map((p) => ({ planet: p, verdict: byPlanet[p] ? byPlanet[p].verdict : 'placement' }));
    return {
      house: h,
      signId,
      lord,
      lordVerdict: byPlanet[lord] ? byPlanet[lord].verdict : null,
      lordPlacedHouse: houseOfPlanet(lord),
      lordPlacement: placementZone(houseOfPlanet(lord)),
      occupants,
    };
  });
  let plus = 0; let minus = 0;
  const reasons = [];
  trikonaHouses.forEach((t) => {
    if (['lagna', 'kendra', 'trikona', 'gain'].includes(t.lordPlacement)) { plus++; reasons.push({ code: 'lordWellPlaced', house: t.house, planet: t.lord, placedHouse: t.lordPlacedHouse }); }
    if (t.lordPlacement === 'dusthana') { minus++; reasons.push({ code: 'lordInDusthana', house: t.house, planet: t.lord, placedHouse: t.lordPlacedHouse }); }
    t.occupants.forEach((o) => {
      if (o.verdict === 'champion') { plus++; reasons.push({ code: 'championInTrikona', house: t.house, planet: o.planet }); }
      else if (o.verdict === 'antagonist') { minus++; reasons.push({ code: 'antagonistInTrikona', house: t.house, planet: o.planet }); }
    });
  });
  const level = plus - minus >= 2 ? 'strong' : plus - minus >= 0 ? 'moderate' : 'weak';

  const lagnaLordHouse = houseOfPlanet(lagnaLord);
  return {
    source: 'celestial-blueprint',
    lagna: {
      rasiId: lagnaId,
      lord: lagnaLord,
      lordPlacedHouse: lagnaLordHouse,
      lordPlacement: placementZone(lagnaLordHouse),
      friends: SEVEN.filter((p) => naturalRelation(lagnaLord, p) === 'friend'),
      enemies: SEVEN.filter((p) => naturalRelation(lagnaLord, p) === 'enemy'),
      neutrals: SEVEN.filter((p) => naturalRelation(lagnaLord, p) === 'neutral'),
    },
    planets: rows,
    champions: rows.filter((r) => r.verdict === 'champion').map((r) => r.planet),
    neutrals: rows.filter((r) => r.verdict === 'neutral').map((r) => r.planet),
    antagonists: rows.filter((r) => r.verdict === 'antagonist').map((r) => r.planet),
    placementDependent: rows.filter((r) => r.verdict === 'placement').map((r) => r.planet),
    baseline: rows.filter((r) => r.verdict === 'baseline').map((r) => r.planet),
    yogaKarakas: rows.filter((r) => r.flags && r.flags.yogaKaraka).map((r) => r.planet),
    trikona: { houses: trikonaHouses, level, plus, minus, reasons },
  };
}

module.exports = { buildFunctionalNature, ASCENDANT_MATRIX, ownedHouses, flowchartPath };
