// lib/sudarshan-chakra.js — language-neutral (codes only; the UI translates)
//
// Sudarshan Chakra (BPHS) — the chart is read simultaneously from three
// references: Lagna, Chandra (Moon) and Surya (Sun). A result that shows up
// from all three references is considered confirmed ("triple check").
// Sudarshan (yearly) dasha: in each year of life one house becomes active,
// counted from all three references together: age 0 (1st year) = house 1,
// age 1 = house 2 ... in a 12-year cycle (age 12 = house 1 again).
//
// AKSRA — rules checked against (2026-09-26):
//   1. Sudarsana Chakra Dasa — Learning Astrology (astroveda.wikidot.com):
//      "Dasas of the 12 houses run in cycles ... Each dasa is for one year";
//      house = (completed years + 1) mod 12 (0 -> 12), e.g. 45th year -> 9th
//      house; read from Lagna, Moon and Sun (or the strongest of them).
//   2. Varaha Mihira, "Secrets of Sudarshana Chakra Dasa" (Medium) and
//      BPHS's Sudarshana Chakra chapter — same three rings and yearly rule.
// DISPUTES / LIMITATIONS (codes in `disputes`):
//   - 'monthly_subdivision_omitted': authors differ on the monthly rule, so
//     only the yearly rule is computed.
//   - 'decadal_variant': some writers (e.g. himalayavedicworld.com) use a
//     different 12 x 10-year scheme starting from Jupiter's sign; not used.
//   - Dates use 365.25-day years (codebase convention) -> isEstimate.
'use strict';

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function ring(refSignId, planets) {
  const out = [];
  for (let h = 1; h <= 12; h++) {
    const signId = (refSignId + h - 1) % 12;
    out.push({
      house: h,
      signId,
      planets: PLANETS.filter((p) => planets[p] && planets[p].rasiId === signId),
    });
  }
  return out;
}

function fmt(d) { return d.toISOString().slice(0, 10); }

function buildSudarshanChakra(natal, birthDate, now = new Date()) {
  if (natal && natal.natal && natal.natal.planets) natal = natal.natal;
  const p = natal && natal.planets;
  if (!p || !p.Sun || !p.Moon || typeof natal.ascendantRasiId !== 'number') return null;
  const refs = { lagna: natal.ascendantRasiId, moon: p.Moon.rasiId, sun: p.Sun.rasiId };
  const rings = { lagna: ring(refs.lagna, p), moon: ring(refs.moon, p), sun: ring(refs.sun, p) };

  const years = [];
  let currentYear = null;
  const valid = birthDate instanceof Date && !isNaN(birthDate.getTime());
  if (valid) {
    for (let age = 0; age < 120; age++) {
      const s = new Date(birthDate.getTime() + age * MS_PER_YEAR);
      const e = new Date(birthDate.getTime() + (age + 1) * MS_PER_YEAR);
      const house = (age % 12) + 1;
      years.push({ age, house, startISO: fmt(s), endISO: fmt(e) });
      if (now >= s && now < e) {
        currentYear = {
          age,
          houseFromEach: house,
          startISO: fmt(s),
          endISO: fmt(e),
          signs: { lagna: rings.lagna[house - 1].signId, moon: rings.moon[house - 1].signId, sun: rings.sun[house - 1].signId },
          planetsInActivated: { lagna: rings.lagna[house - 1].planets, moon: rings.moon[house - 1].planets, sun: rings.sun[house - 1].planets },
        };
      }
    }
  }
  return {
    system: 'sudarshan',
    references: refs,
    rings,
    currentYear,
    years,
    isEstimate: true,
    disputes: ['monthly_subdivision_omitted', 'decadal_variant'],
    sources: [
      { title: 'Sudarsana Chakra Dasa — Learning Astrology', url: 'https://astroveda.wikidot.com/sudarsana-chakra-dasa' },
      { title: 'Secrets of Sudarshana Chakra Dasa (Varaha Mihira)', url: 'https://medium.com/thoughts-on-jyotish/secrets-of-sudarshana-chakra-dasa-part-2-84214579b0d7' },
    ],
  };
}

module.exports = { buildSudarshanChakra };
