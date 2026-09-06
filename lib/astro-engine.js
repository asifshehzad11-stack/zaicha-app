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

// 27 Nakshatras (chandra mansions), Ashwini (0° Mesha) se shuru — ye classical,
// har jagah tasleem-shuda (universally accepted) naam hain, kisi API se
// confirm karne ki zaroorat nahi (bilkul RASI_NAMES ki tarah fixed data).
const NAKSHATRA_NAMES_LATIN = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];
const NAKSHATRA_NAMES_URDU = [
  'اشوِنی', 'بھرنی', 'کرتیکا', 'روہنی', 'مرگشیرا', 'آردرا',
  'پنرواسو', 'پشیہ', 'اسلیشا', 'مگھا', 'پورو پھالگنی', 'اترا پھالگنی',
  'ہستا', 'چترا', 'سواتی', 'وشاکھا', 'انورادھا', 'جیشٹھا',
  'مولا', 'پورو آشاڑھا', 'اترا آشاڑھا', 'شراونا', 'دھنِشٹھا', 'شتبھیشا',
  'پورو بھادرپدا', 'اترا بھادرپدا', 'ریوتی',
];
const NAKSHATRA_NAMES_HINDI = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा',
  'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी',
  'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा',
  'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा',
  'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती',
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
 * buildDashaTree — findCurrentDasha ki tarah hi wahi defensive
 * key-detection (ANTAR_KEYS/PRATYANTAR_KEYS, lordOf) istemal karta hai,
 * lekin sirf "current" period dhoondne ke bajaye SAARI Mahadashas (aur
 * un ke andar saari Antardashas, aur un ke andar saari Pratyantardashas)
 * ki poori list wapas karta hai — har period par `isCurrent: true/false`
 * flag ke sath. Ye AstroSage jaisi click-to-expand dasha list (Mahadasha
 * row per tap → us ki Antardashas, Antardasha row per tap → us ki
 * Pratyantardashas) frontend mein banane ke liye hai. Purana
 * findCurrentDasha() bilkul waisa hi rehta hai (narrative engine wahi
 * "sirf current" shape istemal karta rehta hai) — ye ek alag, additive
 * function hai.
 */
function buildDashaTree(dashaPeriods, targetDate) {
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

  return (dashaPeriods || []).map(function (maha) {
    const mahaCurrent = inRange(maha);
    const antarList = childrenOf(maha, ANTAR_KEYS) || [];
    return {
      lord: lordOf(maha),
      start: maha.start,
      end: maha.end,
      isCurrent: mahaCurrent,
      antardasha: antarList.map(function (antar) {
        const antarCurrent = mahaCurrent && inRange(antar);
        const pratyantarList = childrenOf(antar, PRATYANTAR_KEYS) || [];
        return {
          lord: lordOf(antar),
          start: antar.start,
          end: antar.end,
          isCurrent: antarCurrent,
          pratyantardasha: pratyantarList.map(function (pratyantar) {
            return {
              lord: lordOf(pratyantar),
              start: pratyantar.start,
              end: pratyantar.end,
              isCurrent: antarCurrent && inRange(pratyantar),
            };
          }),
        };
      }),
    };
  });
}

/**
 * normalizePanchang — Prokerala ke /panchang response ko ek simple, safe
 * shape mein badalta hai. SHAPE TODO: tithi/nakshatra/yoga/karana asal
 * response mein array ke andar {name, start, end} jaisi shape mein aane ki
 * tawaqqo hai (kyunke Gregorian din ke darmiyan ye badal sakte hain), lekin
 * exact field naming abhi live confirm nahi hui — is liye ye function
 * defensively kai possible shapes handle karta hai (jaisay findCurrentDasha
 * karta hai), taake agar shape thodi mukhtalif bhi ho to poora route crash
 * na ho, sirf wo ek field khali reh jaye.
 */
function extractPanchangName(entry) {
  if (!entry) return null;
  const first = Array.isArray(entry) ? entry[0] : entry;
  if (!first) return null;
  if (typeof first === 'string') return first;
  return first.name || first.tithi || first.nakshatra || first.yoga || first.karana || null;
}

function normalizePanchang(raw) {
  const d = (raw && raw.data) || raw || {};
  const tithiEntry = Array.isArray(d.tithi) ? d.tithi[0] : d.tithi;
  return {
    vaara: (d.vaara && (d.vaara.name || d.vaara)) || null,
    tithi: extractPanchangName(d.tithi),
    tithiPaksha: (tithiEntry && tithiEntry.paksha) || null,
    nakshatra: extractPanchangName(d.nakshatra),
    yoga: extractPanchangName(d.yoga),
    karana: extractPanchangName(d.karana),
    sunrise: d.sunrise || null,
    sunset: d.sunset || null,
  };
}

// Combustion (Asta) — jab koi graha Sun ke itna qareeb ho ke uski roshni
// "dhak" jati hai, is degree ke andar aane par classical tor par woh graha
// "combust" mana jata hai. Ye standard Parashari orbs hain (direct motion
// ke liye — retrograde mein kuch grahas (Mercury/Venus) ka orb thoda kam ho
// jata hai, lekin simplicity ke liye yahan sirf direct-motion wali values
// use ki gayi hain, jo zyada tar practical maqasid ke liye kaafi hain).
const COMBUSTION_ORB_DEGREES = {
  Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15,
};

function absoluteLongitude(rasiId, degree) {
  return rasiId * 30 + (typeof degree === 'number' ? degree : 0);
}

/**
 * nakshatraFromLongitude — kisi bhi graha (khaas kar Chand) ki absolute
 * zodiacal longitude (0-360°) se uska nakshatra aur pada (1-4) nikalta hai.
 * Har nakshatra 13°20' (=13.3333°) ka hota hai, aur har pada 3°20' ka —
 * ye fixed classical formula hai, kisi API call ki zaroorat nahi (bilkul
 * RASI ki tarah), is liye Chand ka roz-ba-roz nakshatra bhi BAGHAIR kisi
 * extra Prokerala call ke maloom ho sakta hai.
 */
function nakshatraFromLongitude(longitude) {
  const norm = ((longitude % 360) + 360) % 360;
  const NAK_SPAN = 360 / 27; // 13.3333...
  const index = Math.floor(norm / NAK_SPAN);
  const withinNakshatra = norm - index * NAK_SPAN;
  const pada = Math.floor(withinNakshatra / (NAK_SPAN / 4)) + 1;
  return {
    index,
    nameLatin: NAKSHATRA_NAMES_LATIN[index],
    nameUrdu: NAKSHATRA_NAMES_URDU[index],
    nameHindi: NAKSHATRA_NAMES_HINDI[index],
    pada,
  };
}

/**
 * Do zodiacal longitudes ke darmiyan sab se chhota angular fasla (0-180)
 * nikalta hai — taake sign-boundary ke qareeb (jaise Sun 29° Aquarius aur
 * Mercury 2° Pisces) ko bhi sahi tarah "qareeb" pehchana ja sake, na ke
 * sirf isi liye door samjha jaye ke ye alag alag raashiyon mein hain.
 */
function angularDistance(lonA, lonB) {
  const diff = Math.abs(lonA - lonB) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * findCombustPlanets — natalMap (indexPlanets() ka output) mein se un
 * grahas ki list deta hai jo Sun ke itne qareeb hain ke combust mane
 * jayenge. Sun/Rahu/Ketu is check se bahar hain (classical tor par in par
 * combustion apply nahi hoti).
 */
function findCombustPlanets(natalMap) {
  const sun = natalMap.Sun;
  if (!sun || typeof sun.rasiId !== 'number') return [];
  const sunLon = absoluteLongitude(sun.rasiId, sun.degree);

  const combust = [];
  for (const planet of Object.keys(COMBUSTION_ORB_DEGREES)) {
    const p = natalMap[planet];
    if (!p || typeof p.rasiId !== 'number') continue;
    const lon = absoluteLongitude(p.rasiId, p.degree);
    const dist = angularDistance(lon, sunLon);
    if (dist <= COMBUSTION_ORB_DEGREES[planet]) {
      combust.push({ planet, distanceFromSun: Math.round(dist * 100) / 100, orb: COMBUSTION_ORB_DEGREES[planet] });
    }
  }
  return combust;
}

// Zohal (Saturn) taqreeban 30° raashi mein 2.5 saal mein tay karta hai —
// yani taqreeban 0.0329°/din. Ye sirf ek AVERAGE raftar hai (retrograde
// stations ki wajah se asal raftar ghatti-badhti rehti hai), is liye is se
// nikla hua Sade Sati start/end sirf ek TAKHMEENA (estimate) hai, exact
// nahi — jaisa Prokerala ka apna sade-sati response bhi sirf current phase
// aur is_in_sade_sati batata hai, exact tareekhain nahi deta (live response
// se confirm kiya gaya).
const SATURN_AVG_DEGREES_PER_DAY = 30 / (2.5 * 365.25);

/**
 * estimateSadeSatiWindow — Saturn ki current gochar rasi/degree aur natal
 * Moon rasi se, teeno phases (12th/1st/2nd from Moon) ke taqreeban shuru
 * aur khatam hone ki tareekhen nikalta hai. Har phase ~2.5 saal ki hoti hai.
 */
function estimateSadeSatiWindow(saturnGocharRasiId, saturnGocharDegree, moonRasiId, targetDate) {
  if (typeof saturnGocharRasiId !== 'number' || typeof moonRasiId !== 'number') return null;

  const houseFromMoon = houseFromReference(saturnGocharRasiId, moonRasiId);
  // Sade Sati sirf tab jab Saturn 12th, 1st, ya 2nd house from Moon mein ho.
  if (houseFromMoon !== 12 && houseFromMoon !== 1 && houseFromMoon !== 2) return null;

  const phaseLabel = houseFromMoon === 12 ? 'Rising (چڑھتی)' : houseFromMoon === 1 ? 'Peak (عروج)' : 'Setting (اترتی)';
  const daysIntoSign = (typeof saturnGocharDegree === 'number' ? saturnGocharDegree : 15) / SATURN_AVG_DEGREES_PER_DAY;
  const daysLeftInSign = (30 - (typeof saturnGocharDegree === 'number' ? saturnGocharDegree : 15)) / SATURN_AVG_DEGREES_PER_DAY;

  const msPerDay = 24 * 60 * 60 * 1000;
  const currentPhaseStart = new Date(targetDate.getTime() - daysIntoSign * msPerDay);
  const currentPhaseEnd = new Date(targetDate.getTime() + daysLeftInSign * msPerDay);

  // Poori Sade Sati (teeno phases) ka mota mota tazmeen: current phase se
  // pehle/baad ke phases ke liye 2.5-2.5 saal aur jorna.
  const phasesBefore = houseFromMoon === 12 ? 0 : houseFromMoon === 1 ? 1 : 2;
  const phasesAfter = 2 - phasesBefore;
  const wholeSadeSatiStart = new Date(currentPhaseStart.getTime() - phasesBefore * 2.5 * 365.25 * msPerDay);
  const wholeSadeSatiEnd = new Date(currentPhaseEnd.getTime() + phasesAfter * 2.5 * 365.25 * msPerDay);

  const fmt = (d) => d.toISOString().slice(0, 10);
  return {
    phaseLabel,
    isEstimate: true,
    currentPhaseStart: fmt(currentPhaseStart),
    currentPhaseEnd: fmt(currentPhaseEnd),
    wholeSadeSatiStart: fmt(wholeSadeSatiStart),
    wholeSadeSatiEnd: fmt(wholeSadeSatiEnd),
  };
}

/**
 * Asal function jo Prokerala se aayi hui raw responses (kundli/advanced,
 * planet-position [natal], planet-position [gochar/current], sade-sati,
 * kaal-sarp-dosha) ko combine kar ke frontend ke liye ZAICHA_DATA jaisi
 * shape banata hai.
 */
// Ayanamsa numeric code -> Urdu label (chart header par dikhane ke liye).
// Codes Swiss Ephemeris ke standard sidereal-mode constants par mabni hain
// (1=Lahiri, 3=Raman, 5=Krishnamurti/KP) — Lahiri is app mein pehle se
// live-confirmed hai, KP abhi tak sirf inhi maroof constants par bharosa
// kar ke enable kiya gaya hai (README/prokerala-client.js mein note hai).
const AYANAMSA_LABEL_UR = {
  1: 'لاہری',
  3: 'رامن',
  5: 'KP (کرشنامورتی)',
};

function buildZaichaData({ personName, kundliAdvanced, natalPlanetPosition, gocharPlanetPosition, sadeSati, kaalSarp, targetDate, ayanamsa }) {
  const natalList = natalPlanetPosition.data.planet_position;
  const ascendant = findAscendant(natalList);
  const ascendantRasiId = ascendant.rasi.id;
  const natalMap = indexPlanets(natalList);

  const moonRasiId = natalMap.Moon ? natalMap.Moon.rasiId : ascendantRasiId;

  // Kamzor (debilitated) natal grahas ki list — remedies/upay tab (narrative.js)
  // isko use kar ke sirf unhi planets ke liye upay dikhayega jinki asal
  // kundli mein zaroorat hai, generic har kisi ke liye ek jaisi list nahi.
  const weakNatalPlanets = Object.keys(natalMap).filter(
    (name) => planetDignity(name, natalMap[name].rasiId) === 'debilitated'
  );

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
      degree: typeof p.degree === 'number' ? p.degree : null,
      dignity: planetDignity(p.name, p.rasi.id),
      isRetrograde: !!p.is_retrograde,
    };
  }

  // ---- Gochar (transit) chart data ----
  // North Indian style chart mein gharon ki jagah/sign hamesha Ascendant se
  // tay hoti hai (wo transit se nahi badalti) — sirf ye badalta hai ke is
  // waqt kaunsa graha kis ghar mein baitha hai. Isi liye ye wahi `houses`
  // wala sign-layout reuse karta hai, sirf planets[] gochar (abhi ki)
  // positions se bharta hai — taake frontend natal chart wala hi SVG
  // renderer transit ke liye bhi istemal kar sake.
  const gocharHouses = [];
  for (let h = 1; h <= 12; h++) {
    const signId = (ascendantRasiId + (h - 1)) % 12;
    gocharHouses.push({
      n: h,
      signId,
      sign: RASI_NAMES_URDU[signId],
      signLatin: RASI_NAMES_LATIN[signId],
      planets: [],
    });
  }
  for (const p of gocharList) {
    if (p.id === 100) continue;
    const houseNum = houseFromReference(p.rasi.id, ascendantRasiId);
    gocharHouses[houseNum - 1].planets.push({
      abbr: PLANET_ABBR[p.name] || p.name.slice(0, 2),
      name: p.name,
      color: PLANET_COLOR_VAR[p.name] || 'var(--text-muted)',
      degree: typeof p.degree === 'number' ? `${Math.floor(p.degree)}°` : null,
      isRetrograde: !!p.is_retrograde,
    });
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
      system: AYANAMSA_LABEL_UR[Number(ayanamsa)] || 'لاہری',
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
      houses: gocharHouses,
    },
    dasha: {
      mahadasha: dasha.mahadasha,
      antardasha: dasha.antardasha,
      pratyantardasha: dasha.pratyantardasha,
      mahadashaLordNatalHouse: mahaLordHouse,
      antardashaLordNatalHouse: antarLordHouse,
      mahadashaLordRetrograde: dasha.mahadasha && natalMap[dasha.mahadasha.lord] ? natalMap[dasha.mahadasha.lord].isRetrograde : false,
      antardashaLordRetrograde: dasha.antardasha && natalMap[dasha.antardasha.lord] ? natalMap[dasha.antardasha.lord].isRetrograde : false,
      // Poori Mahadasha → Antardasha → Pratyantardasha tree (AstroSage-style
      // click-to-expand list ke liye) — dasha.mahadasha/antardasha/
      // pratyantardasha (upar) sirf "abhi kya chal raha hai" ke liye rehte
      // hain, ye tree poori list deta hai.
      tree: buildDashaTree(dashaPeriods, targetDate),
    },
    mangalDosha: (kundliAdvanced.data && kundliAdvanced.data.mangal_dosha) || null,
    sadeSati: sadeSati.data || sadeSati,
    kaalSarp: kaalSarp.data || kaalSarp,
    weakNatalPlanets,
    combustPlanets: findCombustPlanets(natalMap),
    sadeSatiWindow: gocharDetails.Saturn
      ? estimateSadeSatiWindow(gocharDetails.Saturn.rasiId, gocharDetails.Saturn.degree, moonRasiId, targetDate)
      : null,
  };
}

// Roz-ba-roz calendar mein sirf dheeme grahas ke sign-badlane ko "event"
// mana jata hai (Moon to har 1-2.5 din mein sign badalta hai, is liye uska
// sign khud har din ka "headline" hai, alag se event nahi banta).
const FORWARD_CALENDAR_EVENT_PLANETS = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];

/**
 * buildForwardCalendar — AGLE kuch dinon ka Vedic "roz ka snapshot" banata
 * hai, BAGHAIR kisi user-specific Prokerala call ke: caller ne pehle se ek
 * SHARED (sab users ke darmiyan common) daily transit cache se har din ka
 * raw planet_position list fetch kar rakha hai (server.js dekhein) — ye
 * function sirf us cached data ko is USER ki apni Lagna (ascendantRasiId)
 * ke hisab se ghar/house mein badalta hai, jo bilkul free hai.
 *
 * dayEntries: [{ date: 'YYYY-MM-DD', planetList: [...raw Prokerala
 *   planet_position array...] }, ...] — chronological order mein.
 *
 * Har din ke liye: Chand ka ghar/sign/nakshatra/pada (roz ka headline),
 * aur dheeme grahas (Sun..Ketu) ke sign-change "events" (pichlay fetched
 * din ke muqablay mein — is liye pehlay din ke liye events hamesha khali
 * hote hain, kyunke us se pehlay wale din ka data hamare paas nahi).
 */
function buildForwardCalendar(ascendantRasiId, dayEntries) {
  let prevMap = null;
  return dayEntries.map((entry) => {
    const map = indexPlanets(entry.planetList);
    const moon = map.Moon;
    const moonHouse = moon ? houseFromReference(moon.rasiId, ascendantRasiId) : null;
    const moonNakshatra = moon ? nakshatraFromLongitude(absoluteLongitude(moon.rasiId, moon.degree)) : null;

    const events = [];
    if (prevMap) {
      for (const planetName of FORWARD_CALENDAR_EVENT_PLANETS) {
        const before = prevMap[planetName];
        const after = map[planetName];
        if (before && after && before.rasiId !== after.rasiId) {
          events.push({
            planet: planetName,
            planetUrdu: PLANET_NAME_URDU[planetName] || planetName,
            fromSignId: before.rasiId,
            toSignId: after.rasiId,
            toSign: RASI_NAMES_URDU[after.rasiId],
            toSignLatin: RASI_NAMES_LATIN[after.rasiId],
            isRetrograde: after.isRetrograde,
          });
        }
      }
    }
    prevMap = map;

    return {
      date: entry.date,
      moon: moon ? {
        house: moonHouse,
        rasiId: moon.rasiId,
        sign: RASI_NAMES_URDU[moon.rasiId],
        signLatin: RASI_NAMES_LATIN[moon.rasiId],
        dignity: planetDignity('Moon', moon.rasiId),
        isRetrograde: moon.isRetrograde,
        nakshatra: moonNakshatra,
      } : null,
      events,
    };
  });
}

module.exports = {
  RASI_NAMES_LATIN,
  RASI_NAMES_URDU,
  NAKSHATRA_NAMES_LATIN,
  NAKSHATRA_NAMES_URDU,
  NAKSHATRA_NAMES_HINDI,
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
  buildDashaTree,
  normalizePanchang,
  findCombustPlanets,
  estimateSadeSatiWindow,
  buildZaichaData,
  absoluteLongitude,
  nakshatraFromLongitude,
  buildForwardCalendar,
};
