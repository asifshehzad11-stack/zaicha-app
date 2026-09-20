// lib/chara-dasha.js — Multi-language (EN/UR/HI)
//
// Chara Dasha (Jaimini) — Phase 2's third dasha system. Code writing was
// PAUSED earlier in this project specifically because of 4 open/contested
// classical questions (see ROADMAP.md "Research note — Chara Dasha").
// This session did a second, deeper round of research — 6 independent
// sources fetched (srath.com, a PDF of Sanjay Rath's own "Narayana Dasa"
// book, astrobix.com, Gary Gomes/saptarishisastrology.com, paramarsh.app,
// jothishi.com) — to try to resolve each open question from primary/
// authoritative material rather than guessing. Result: 2 of the 4 are now
// CONFIRMED (no real dispute, just previously under-researched); 2 remain
// GENUINE lineage splits, which are handled the same way this codebase
// already handles the 8-Karaka/7-Karaka Chara Karaka split — both
// conventions are computed and disclosed, nothing is silently picked.
//
// ---- (1) Overall sequence starting sign — NOW CONFIRMED (Lagna only) ----
// Gary Gomes (saptarishisastrology.com), paramarsh.app, AND jothishi.com
// all independently state the Mahadasha sequence always starts from the
// Lagna, "no exceptions". Sanjay Rath's own material (srath.com + a PDF of
// his "Narayana Dasa" book) instead says it starts from "whichever of the
// Lagna or 7th house is stronger" with a detailed multi-rule tie-break
// procedure. Since 3 independent non-Rath sources agree on the simpler
// "always Lagna" rule, and Rath's stronger-sign method needs its own
// separate, not-yet-verified strength-scoring algorithm, this module
// implements Lagna-only for now. Rath's alternative is a known, disclosed
// limitation — NOT silently ignored — see `startingSignNote` in the return
// value.
//
// ---- (2) Direction of the Mahadasha sequence — CONFIRMED ----
// Paramarsh.app and Gary Gomes describe it as "Lagna odd = forward,
// Lagna even = backward". jothishi.com and the Sanjay Rath PDF instead
// describe it via the 9th house's odd/even ("Vimsapada"/"Samapada").
// These are NOT actually in conflict: a sign's 9th house is always 8
// signs away, and 8 is even, so the 9th house from any sign always has
// the SAME odd/even parity as that sign itself. Both phrasings describe
// the identical rule. Confirmed, no dispute.
//
// ---- (3) Per-sign Mahadasha duration — CONFIRMED (base rule) ----
// All sources agree: count from the sign to its lord's natal sign
// (inclusive of both ends), forward if the COUNTING sign itself is odd,
// backward if even; subtract 1; if the lord sits in its own sign (count
// lands on 0), the duration is 12 years. This module always computes and
// returns this base duration.
// A SEPARATE, disclosed-but-not-applied-by-default refinement exists: the
// Sanjay Rath source states +1 year if the sign's lord is exalted, -1 if
// debilitated (capped so it never exceeds 12). Paramarsh.app calls this
// "optional, lineage-specific" rather than universal. Since it is not
// confirmed as universally applied, the PRIMARY duration used for the
// actual displayed dates is the undisputed base rule; the Rath refinement
// is returned separately as `adjustedYears` / `dignityAdjustment` so nothing
// is hidden, but it does not drive the calendar dates shown to the user.
//
// ---- (4) Antardasha order (own sign first or last) — GENUINE, UNRESOLVED
// SPLIT (both sides independently confirmed) ----
// The Sanjay Rath PDF explicitly states: "The dasa sign itself becomes the
// first antardasha." jothishi.com explicitly states the OPPOSITE, using
// the same example sign: "So an Aries Chara Dasha will have the last
// sub-period as Aries and not the first." paramarsh.app independently adds
// "some lineages place the Mahadasha sign first, while many Jaimini
// teachers place it last" — i.e. a genuine, acknowledged lineage split, not
// a gap in research. Per this project's AKSRA principle, this module does
// NOT silently pick one: it returns BOTH orderings
// (`antardashaOwnSignFirst` and `antardashaOwnSignLast`), defaulting the
// primary/displayed one to "own sign first" (Rath's is the only source
// that is an actual quoted primary text; jothishi/paramarsh are secondary
// commentary), with the alternate available for a future toggle.
//
// Antardasha direction within a Mahadasha: divides that Mahadasha's BASE
// duration into 12 equal parts (confirmed, undisputed), cycling through
// the signs starting at the Mahadasha's own sign, forward if that sign is
// odd and backward if even (same rule as (2), applied per-sign — matches
// astrobix.com: "the order of Antardashas will be according to the order
// of Mahadasha").
'use strict';

const { normLang } = require('./narrative');
const {
  RASI_NAMES_URDU, RASI_NAMES_LATIN, SIGN_LORDS, EXALTATION_RASI,
  DEBILITATION_RASI, houseFromReference,
} = require('./astro-engine');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365.25; // isEstimate:true disclosure covers this, same convention as yogini-dasha.js

function isOddSign(rasiId) {
  // 0-indexed rasiId: Aries=0 is classically the "1st" (odd) sign, so even
  // rasiId values (0,2,4,6,8,10) are the classically-odd signs.
  return rasiId % 2 === 0;
}

/** Inclusive step-count from `fromId` to `toId` around the 12 signs. */
function countSteps(fromId, toId, forward) {
  const diff = forward ? ((toId - fromId + 12) % 12) : ((fromId - toId + 12) % 12);
  return diff + 1; // inclusive of both ends
}

function baseDuration(signId, lordRasiId) {
  const forward = isOddSign(signId);
  const steps = countSteps(signId, lordRasiId, forward);
  const years = steps - 1;
  return years === 0 ? 12 : years;
}

function dignityAdjustment(lordPlanet, lordRasiId) {
  if (EXALTATION_RASI[lordPlanet] === lordRasiId) return 1;
  if (DEBILITATION_RASI[lordPlanet] === lordRasiId) return -1;
  return 0;
}

function addYears(date, years) {
  return new Date(date.getTime() + years * DAYS_PER_YEAR * MS_PER_DAY);
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

/** Builds the ordered list of 12 sign-ids for the overall Mahadasha
 * sequence, starting at `startSignId`, in `forward`/backward direction. */
function buildSignSequence(startSignId, forward) {
  const seq = [];
  for (let i = 0; i < 12; i++) {
    seq.push(forward ? (startSignId + i) % 12 : ((startSignId - i) % 12 + 12) % 12);
  }
  return seq;
}

/**
 * buildCharaDasha — `data` woh poora ZAICHA_DATA object hai (natal Lagna +
 * planet positions ke liye), `birthDate`/`targetDate` JS Date objects.
 *
 * Return shape jaan-boojh kar Vimshottari/Yogini Dasha tree jaisi rakhi gayi
 * hai ({lord, start, end, isCurrent, antardasha:[...]}), lekin har period
 * asal mein ek RAASHI hai, planet nahi — is liye `lord` field us raashi ke
 * CLASSICAL RULING PLANET ka naam hai (taake frontend ka maujooda
 * icon/emoji/rang wala code seedha kaam kare), aur raashi ka naam khud
 * `sign`/`signLatin` mein hai (frontend ko yeh dikhana hoga, planet ka naam
 * nahi — jaise Yogini Dasha mein yoginiName ka suffix pattern istemal hua
 * tha).
 */
function buildCharaDasha(data, birthDate, targetDate, lang) {
  lang = normLang(lang);
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  const natalMap = (data.natal && data.natal.planets) || {};
  if (typeof ascendantRasiId !== 'number' || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return null;
  }
  // Sab 12 raashion ke lord natal chart mein kahan baithe hain — ek baar
  // nikaal lete hain (agar koi graha data missing ho to us raashi ki dasha
  // sirf base-duration calculate nahi kar sakegi; is app ke Sun..Saturn
  // hamesha maujood hote hain, is liye practically ye hamesha available hai).
  function lordRasiOf(signId) {
    const lordPlanet = SIGN_LORDS[signId];
    const p = natalMap[lordPlanet];
    return typeof p?.rasiId === 'number' ? p.rasiId : null;
  }

  const seqForward = isOddSign(ascendantRasiId);
  const signSequenceOneCycle = buildSignSequence(ascendantRasiId, seqForward);

  // Pehle se har raashi ki base duration + dignity-adjustment nikaal lete
  // hain (chart-dependent hai lekin cycle-se-cycle nahi badalti).
  const signInfo = {};
  for (let s = 0; s < 12; s++) {
    const lordPlanet = SIGN_LORDS[s];
    const lordRasiId = lordRasiOf(s);
    if (lordRasiId === null) { signInfo[s] = null; continue; }
    const years = baseDuration(s, lordRasiId);
    const adj = dignityAdjustment(lordPlanet, lordRasiId);
    const adjustedYears = Math.min(12, Math.max(1, years + adj)); // classical rule silent on floor; 1-year floor is our own safety clamp, disclosed below
    signInfo[s] = { lordPlanet, lordRasiId, years, dignityAdjustment: adj, adjustedYears };
  }
  if (Object.values(signInfo).some((v) => v === null)) return null; // incomplete natal data

  const CYCLES_TO_BUILD = 3; // ek cycle ki lambai chart se chart alag hoti hai (~70-90 saal average); 3 cycles hamesha 120+ saal cover karte hain
  const mahadashas = [];
  let cursor = new Date(birthDate.getTime());
  for (let c = 0; c < CYCLES_TO_BUILD; c++) {
    for (let i = 0; i < 12; i++) {
      const signId = signSequenceOneCycle[i];
      const info = signInfo[signId];
      const years = info.years; // base (undisputed) duration hi calendar dates chalata hai
      const start = new Date(cursor.getTime());
      const end = addYears(start, years);
      const isCurrent = targetDate >= start && targetDate < end;

      // Antardasha: 12 barabar hisse, is raashi ke apne odd/even se
      // direction, khud is raashi se shuru (ownSignFirst) ya us se pehle
      // wali raashi tak khatam (ownSignLast) — dono disclose kiye ja rahe
      // hain (upar ka header note dekhein).
      const antardashaForward = isOddSign(signId);
      const antarSeq = buildSignSequence(signId, antardashaForward); // [ownSign, next, next, ... ] = "ownSignFirst" order
      let aCursor = new Date(start.getTime());
      const antardashaOwnSignFirst = antarSeq.map((aSignId) => {
        const aYears = years / 12;
        const aStart = new Date(aCursor.getTime());
        const aEnd = addYears(aStart, aYears);
        const row = {
          rasiId: aSignId,
          sign: RASI_NAMES_URDU[aSignId],
          signLatin: RASI_NAMES_LATIN[aSignId],
          lord: SIGN_LORDS[aSignId],
          start: fmt(aStart),
          end: fmt(aEnd),
          isCurrent: targetDate >= aStart && targetDate < aEnd,
        };
        aCursor = aEnd;
        return row;
      });
      // "ownSignLast" ordering — wahi 12 periods, bas rotate kiye gaye
      // taake apni raashi AAKHRI mein aaye (start/end dates same rehti
      // hain kyunke ye sirf DISPLAY ORDER ka farq hai, timeline nahi).
      const antardashaOwnSignLast = antardashaOwnSignFirst.slice(1).concat([antardashaOwnSignFirst[0]]);

      mahadashas.push({
        rasiId: signId,
        sign: RASI_NAMES_URDU[signId],
        signLatin: RASI_NAMES_LATIN[signId],
        lord: info.lordPlanet,
        house: houseFromReference(signId, ascendantRasiId),
        years,
        dignityAdjustment: info.dignityAdjustment, // -1, 0, or +1 (Rath's disclosed-not-applied refinement)
        adjustedYears: info.adjustedYears,
        start: fmt(start),
        end: fmt(end),
        isCurrent,
        antardasha: antardashaOwnSignFirst, // default display order
        antardashaOwnSignFirst,
        antardashaOwnSignLast,
      });
      cursor = end;
    }
  }

  const currentMaha = mahadashas.find((m) => m.isCurrent) || null;
  const currentAntar = currentMaha ? currentMaha.antardasha.find((a) => a.isCurrent) || null : null;

  return {
    current: { mahadasha: currentMaha, antardasha: currentAntar },
    tree: mahadashas,
    isEstimate: true, // dates khud calculate ki gayi hain (365.25 din/saal convention), koi API in ko confirm nahi karti
    startingSignNote: 'lagna', // hamesha Lagna se shuru — Sanjay Rath ki lineage "stronger of Lagna/7th" istemal karti hai, jo abhi implement nahi hui (disclosed limitation)
    antardashaOrderDisputed: true, // dono orderings har period mein maujood hain — dekhein antardashaOwnSignFirst/antardashaOwnSignLast
    dignityAdjustmentApplied: false, // primary dates base duration se hain, Rath ka +1/-1 refinement sirf disclose kiya gaya hai
  };
}

module.exports = { buildCharaDasha };
