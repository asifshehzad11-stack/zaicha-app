/**
 * Zaicha Astro Engine
 * ====================
 * Ye file zaicha_prototype.py (Claude ke pehle prototype) ka JavaScript port
 * hai, lekin ek badi improvement ke sath: dasha walker ab classical fixed
 * durations se "recompute" nahi karta — ye seedha Prokerala ke apne
 * `dasha_periods` array ko scan karta hai aur us mein se "jis period ke
 * start<=today<=end hai" wo dhoondta hai. Ye zyada sahi hai kyunke real
 * dasha_periods mein Prokerala khud saara calculation kar ke deta hai.
 *
 * IMPORTANT — is file ke andar jagah jagah "SHAPE TODO" comments hain jahan
 * humein Prokerala ke asal live JSON field names abhi 100% confirm nahi hain
 * (kyunke abhi tak humne sirf top-level dasha_periods[0].start/end dekha
 * hai, poora nested Antardasha/Pratyantardasha tree ka exact field naming
 * live nahi dekha). Is liye ye code defensively kai possible field-name
 * variants try karta hai. Jab Asif real API se pehla asli response is
 * backend ke `/api/debug/kundli-raw` route se dekhega, to agar koi field
 * match na ho to wahan se exact naam le kar yahan ek line fix karni hogi.
 */

'use strict';

const RASI_NAMES_LATIN = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

const RASI_NAMES_URDU = [
  'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبلہ',
  'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت',
];

const URDU_ORDINALS = {
  1: 'پہلے', 2: 'دوسرے', 3: 'تیسرے', 4: 'چوتھے', 5: 'پانچویں',
  6: 'چھٹے', 7: 'ساتویں', 8: 'آٹھویں', 9: 'نویں', 10: 'دسویں',
  11: 'گیارہویں', 12: 'بارہویں',
};

const PLANET_ABBR = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
  Ascendant: 'Lg',
};

const PLANET_COLOR_VAR = {
  Sun: 'var(--su)', Moon: 'var(--mo)', Mars: 'var(--ma)', Mercury: 'var(--me)',
  Jupiter: 'var(--ju)', Venus: 'var(--ve)', Saturn: 'var(--sa)', Rahu: 'var(--ra)',
  Ketu: 'var(--ke)', Ascendant: 'var(--gold)',
};

const PLANET_NAME_URDU = {
  Sun: 'سورج', Moon: 'چاند', Mars: 'مریخ', Mercury: 'عطارد', Jupiter: 'مشتری',
  Venus: 'زہرہ', Saturn: 'زحل', Rahu: 'راہو', Ketu: 'کیتو',
};

// Classical (Parashari) sign rulerships — rasi id (0=Mesha) -> ruling planet.
// Rahu/Ketu classically don't rule any sign.
const SIGN_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];

// Exaltation sign (rasi id) per planet — classical values.
const EXALTATION_RASI = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};

// Debilitation sign (rasi id) per planet — exact opposite of exaltation.
const DEBILITATION_RASI = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0,
};

// Own signs per planet (rasi ids it rules).
const OWN_SIGNS = {
  Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11],
  Venus: [1, 6], Saturn: [9, 10],
};

/**
 * Bohat hi basic classical dignity check — asal Vedic astrology mein
 * strength (Shadbala waghera) is se kahin zyada gehri hai, lekin ye ek
 * sensible, transparent shuru'aat hai jab tak Ashtakavarga wire na ho jaye
 * (design doc Section 3 dekhein).
 */
function planetDignity(planetName, rasiId) {
  if (EXALTATION_RASI[planetName] === rasiId) return 'exalted';
  if (DEBILITATION_RASI[planetName] === rasiId) return 'debilitated';
  if ((OWN_SIGNS[planetName] || []).includes(rasiId)) return 'own';
  return 'neutral';
}

/**
 * House-from-reference formula — live-verified against real Prokerala data
 * (Ascendant rasi.id=11, Sun rasi.id=10 -> house 12).
 */
function houseFromReference(planetRasiId, referenceRasiId) {
  return (((planetRasiId - referenceRasiId) % 12) + 12) % 12 + 1;
}

/**
 * Prokerala planet-position response ke andar se Ascendant entry (id:100)
 * dhoondta hai.
 */
function findAscendant(planetPositionList) {
  return planetPositionList.find((p) => p.id === 100 || p.name === 'Ascendant');
}

/**
 * planet-position response ko ek simple lookup map mein badalta hai:
 * { "Sun": {rasiId, degree, isRetrograde}, ... }
 */
function indexPlanets(planetPositionList) {
  const map = {};
  for (const p of planetPositionList) {
    map[p.name] = {
      rasiId: p.rasi && p.rasi.id,
      rasiName: p.rasi && p.rasi.name,
      degree: p.degree,
      isRetrograde: !!p.is_retrograde,
    };
  }
  return map;
}

/**
 * dasha_periods (ya jo bhi asal field naam nikle) ke nested array ko
 * scan kar ke current Mahadasha/Antardasha/Pratyantardasha dhoondta hai.
 *
 * SHAPE TODO: Prokerala docs/SDK samples ke mutabiq is tarah ki nested
 * shape aam hai:
 *   [ { name/lord, start, end, antardasha: [ { name, start, end,
 *       paryantardasha: [ {name,start,end}, ... ] }, ... ] }, ... ]
 * Lekin exact key spelling (antardasha vs antar_dasha vs sub_period,
 * paryantardasha vs pratyantardasha vs pratyantar_dasha) confirm nahi hai
 * — is liye har level par multiple candidate key names try kiye jate hain.
 */
function findCurrentDasha(dashaPeriods, targetDate) {
  const t = targetDate.getTime();

  function inRange(period) {
    const start = new Date(period.start).getTime();
    const end = new Date(period.end).getTime();
    return t >= start && t < end;
  }

  function lordOf(period) {
    return period.name || period.lord || period.planet || period.dasha_lord || '?';
  }

  function childrenOf(period, candidateKeys) {
    for (const key of candidateKeys) {
      if (Array.isArray(period[key])) return period[key];
    }
    return null;
  }

  const ANTAR_KEYS = ['antardasha', 'antar_dasha', 'antardashas', 'sub_periods', 'children'];
  const PRATYANTAR_KEYS = ['pratyantardasha', 'paryantardasha', 'pratyantar_dasha', 'sub_periods', 'children'];

  const result = { mahadasha: null, antardasha: null, pratyantardasha: null };

  const maha = (dashaPeriods || []).find(inRange);
  if (!maha) return result;

  result.mahadasha = {
    lord: lordOf(maha),
    start: maha.start,
    end: maha.end,
  };

  const antarList = childrenOf(maha, ANTAR_KEYS);
  if (antarList) {
    const antar = antarList.find(inRange);
    if (antar) {
      result.antardasha = {
        lord: lordOf(antar),
        start: antar.start,
        end: antar.end,
      };

      const pratyantarList = childrenOf(antar, PRATYANTAR_KEYS);
      if (pratyantarList) {
        const pratyantar = pratyantarList.find(inRange);
        if (pratyantar) {
          result.pratyantardasha = {
            lord: lordOf(pratyantar),
            start: pratyantar.start,
            end: pratyantar.end,
          };
        }
      }
    }
  }

  return result;
}

/**
 * Asal function jo Prokerala se aayi hui raw responses (kundli/advanced,
 * planet-position [natal], planet-position [gochar/current], sade-sati,
 * kaal-sarp-dosha) ko combine kar ke frontend ke liye ZAICHA_DATA jaisi
 * shape banata hai.
 */
function buildZaichaData({ personName, kundliAdvanced, natalPlanetPosition, gocharPlanetPosition, sadeSati, kaalSarp, targetDate }) {
  const natalList = natalPlanetPosition.data.planet_position;
  const ascendant = findAscendant(natalList);
  const ascendantRasiId = ascendant.rasi.id;
  const natalMap = indexPlanets(natalList);

  const moonRasiId = natalMap.Moon ? natalMap.Moon.rasiId : ascendantRasiId;

  // ---- Houses (1-12), sign + planets sitting there, from-Lagna ----
  const houses = [];
  for (let h = 1; h <= 12; h++) {
    const signId = (ascendantRasiId + (h - 1)) % 12;
    const lordPlanet = SIGN_LORDS[signId];
    const lordNatal = natalMap[lordPlanet];
    const lordDignity = lordNatal ? planetDignity(lordPlanet, lordNatal.rasiId) : 'neutral';
    houses.push({
      n: h,
      signId,
      sign: RASI_NAMES_URDU[signId],
      signLatin: RASI_NAMES_LATIN[signId],
      lord: PLANET_NAME_URDU[lordPlanet] || lordPlanet,
      lordDignity, // 'exalted' | 'own' | 'neutral' | 'debilitated'
      lordStrong: lordDignity === 'exalted' || lordDignity === 'own',
      planets: [],
    });
  }
  for (const p of natalList) {
    if (p.id === 100) continue; // Ascendant khud house-marker nahi, chip alag dikhti hai
    const rasiId = p.rasi.id;
    const houseNum = houseFromReference(rasiId, ascendantRasiId);
    houses[houseNum - 1].planets.push({
      abbr: PLANET_ABBR[p.name] || p.name.slice(0, 2),
      name: p.name,
      color: PLANET_COLOR_VAR[p.name] || 'var(--text-muted)',
      degree: typeof p.degree === 'number' ? `${Math.floor(p.degree)}°` : null,
      isRetrograde: !!p.is_retrograde,
    });
  }
  // Ascendant chip alag se house 1 mein add
  houses[0].planets.unshift({ abbr: 'Lg', name: 'Ascendant', color: PLANET_COLOR_VAR.Ascendant, degree: null, isRetrograde: false });

  // ---- Gochar (transit): same formula, current planet positions ----
  // `details` har planet ke gochar (transit) rasi mein uski dignity aur
  // retrograde status bhi record karta hai, taake narrative.js sirf
  // "ye ghar ye represent karta hai" jaisi generic line ke bajaye asal
  // sitaron (planets) ke hisab se mukhtalif prediction bana sake.
  const gocharList = gocharPlanetPosition.data.planet_position;
  const gocharFromLagna = {};
  const gocharFromMoon = {};
  const gocharDetails = {};
  for (const p of gocharList) {
    if (p.id === 100) continue;
    const houseFromLagna = houseFromReference(p.rasi.id, ascendantRasiId);
    gocharFromLagna[p.name] = houseFromLagna;
    gocharFromMoon[p.name] = houseFromReference(p.rasi.id, moonRasiId);
    gocharDetails[p.name] = {
      house: houseFromLagna,
      rasiId: p.rasi.id,
      dignity: planetDignity(p.name, p.rasi.id),
      isRetrograde: !!p.is_retrograde,
    };
  }

  // ---- Dasha ----
  const dashaPeriods = (kundliAdvanced.data && (kundliAdvanced.data.dasha_periods || kundliAdvanced.data.vimshottari_dasha || [])) || [];
  const dasha = findCurrentDasha(dashaPeriods, targetDate);

  const mahaLordHouse = dasha.mahadasha && natalMap[dasha.mahadasha.lord]
    ? houseFromReference(natalMap[dasha.mahadasha.lord].rasiId, ascendantRasiId)
    : null;
  const antarLordHouse = dasha.antardasha && natalMap[dasha.antardasha.lord]
    ? houseFromReference(natalMap[dasha.antardasha.lord].rasiId, ascendantRasiId)
    : null;

  return {
    person: {
      name: personName,
      ascendantSignName: RASI_NAMES_URDU[ascendantRasiId],
      ascendantSignLatin: RASI_NAMES_LATIN[ascendantRasiId],
      system: 'لاہری',
    },
    natal: {
      ascendantRasiId,
      moonRasiId,
      planets: natalMap,
    },
    houses,
    gochar: {
      fromLagna: gocharFromLagna,
      fromMoon: gocharFromMoon,
      details: gocharDetails,
    },
    dasha: {
      mahadasha: dasha.mahadasha,
      antardasha: dasha.antardasha,
      pratyantardasha: dasha.pratyantardasha,
      mahadashaLordNatalHouse: mahaLordHouse,
      antardashaLordNatalHouse: antarLordHouse,
      mahadashaLordRetrograde: dasha.mahadasha && natalMap[dasha.mahadasha.lord] ? natalMap[dasha.mahadasha.lord].isRetrograde : false,
      antardashaLordRetrograde: dasha.antardasha && natalMap[dasha.antardasha.lord] ? natalMap[dasha.antardasha.lord].isRetrograde : false,
    },
    mangalDosha: (kundliAdvanced.data && kundliAdvanced.data.mangal_dosha) || null,
    sadeSati: sadeSati.data || sadeSati,
    kaalSarp: kaalSarp.data || kaalSarp,
  };
}

module.exports = {
  RASI_NAMES_LATIN,
  RASI_NAMES_URDU,
  URDU_ORDINALS,
  PLANET_ABBR,
  PLANET_COLOR_VAR,
  PLANET_NAME_URDU,
  SIGN_LORDS,
  planetDignity,
  houseFromReference,
  findAscendant,
  indexPlanets,
  findCurrentDasha,
  buildZaichaData,
};
