/**
 * VedAstro API Client — Prokerala ka drop-in replacement
 * ========================================================
 * Ye file lib/prokerala-client.js ki JAGAH par use hoti hai (sirf server.js
 * mein ek `require()` line badal ke). Maqsad: exported function names aur
 * unka return shape BILKUL Prokerala jaisa rakhna, taake server.js aur
 * lib/astro-engine.js mein koi aur tabdeeli na karni pare.
 *
 * VedAstro (https://vedastro.org, https://github.com/VedAstro/VedAstro) ek
 * open-source (MIT), 2014 se chal raha Vedic astrology REST API hai:
 *   - Free: 5 calls/minute (bila kisi API key ke)
 *   - Paid: $1/month unlimited calls (API key process.env.VEDASTRO_API_KEY
 *     mein daalein — .env file mein, kabhi is file mein hardcode na karein)
 *
 * URL shape (live testing se confirm shuda, docs se NAHI — docs ki dashes
 * wali date format GHALAT hai aur chup-chaap ghalat stub data deti hai):
 *   https://api.vedastro.org/api/Calculate/{Method}/[extra/params/]
 *     Location/{lat,lon}/Time/{HH:MM}/{DD/MM/YYYY}/{±HH:MM}/Ayanamsa/{NAME}
 * Zaroori: date mein "/" hi chalega, "-" nahi (warna 01/01/2000 wala
 * default/stub data chup-chaap wapas aata hai, koi error nahi milta).
 *
 * SHAPE TODO / DESIGN NOTES:
 * - VedAstro AllPlanetData mein Ascendant/Lagna shamil nahi hoti — is liye
 *   HouseLongitude/1 se alag se nikal kar id:100 wali "planet" ki tarah
 *   list mein jaga di jati hai (Prokerala ka wahi convention, jo
 *   astro-engine.js ka findAscendant()/houses-loop dono istemal karte hain).
 * - VedAstro ke paas koi dedicated "Sade Sati" method nahi hai — is liye
 *   yahan classical formula khud implement ki gayi hai (Saturn transit
 *   Moon se 12th/1st/2nd bhaav mein ho to Sade Sati). Isi tarah Mangal
 *   Dosha bhi classical Lagna-based formula (Mars 1,2,4,7,8,12 ghar mein)
 *   se khud nikala gaya hai, kyunke VedAstro ka KujaDosaScore ek raw score
 *   deta hai (boolean nahi), jiska threshold documented nahi.
 */

'use strict';

const BASE_URL = 'https://api.vedastro.org/api/Calculate';

// Prokerala ke numeric ayanamsa codes -> VedAstro ke naam-based enum.
// (index.html abhi sirf 1=Lahiri aur 5=KP istemal karne deta hai.)
const AYANAMSA_NAME = {
  1: 'LAHIRI',
  3: 'RAMAN',
  5: 'KRISHNAMURTI',
};

// astro-engine.js ke RASI_NAMES_LATIN (Mesha..Meena) ke isi tarteeb mein.
const RASI_ENGLISH = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];
const SIGN_NAME_TO_ID = {};
RASI_ENGLISH.forEach((name, idx) => { SIGN_NAME_TO_ID[name] = idx; });

// Roz-ba-roz forward-calendar ke liye fixed reference (prokerala-client.js
// jaisa hi) — planetary sign positions geocentric hain, kisi ek location se
// bandhay nahi, is liye sab users ke darmiyan cache/share ho sakte hain.
const FORWARD_CALENDAR_REFERENCE_COORDINATES = '33.6844,73.0479'; // Islamabad
const FORWARD_CALENDAR_REFERENCE_TIME = '12:00:00+05:00';

function apiKey() {
  return process.env.VEDASTRO_API_KEY || '';
}

/**
 * "1994-03-14T06:45:00+05:00" (ya ...Z) ko VedAstro ke
 * {HH:MM}/{DD/MM/YYYY}/{±HH:MM} segments mein todta hai.
 */
function splitDateTime(datetime) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.exec(
    String(datetime).trim()
  );
  if (!m) {
    throw new Error(`vedastro-client: datetime format samajh nahi aaya: ${datetime}`);
  }
  const [, year, month, day, hour, minute, rawOffset] = m;
  const offset = rawOffset === 'Z' ? '+00:00' : rawOffset;
  return { time: `${hour}:${minute}`, date: `${day}/${month}/${year}`, offset };
}

/**
 * VedAstro ki "HH:MM DD/MM/YYYY ±HH:MM" waali time string ko wapas ISO8601
 * mein badalta hai, taake astro-engine.js ka `new Date(period.start)`
 * (findCurrentDasha/buildDashaTree mein) theek se chale.
 */
function vedastroTimeToIso(str) {
  const m = /^(\d{2}):(\d{2}) (\d{2})\/(\d{2})\/(\d{4}) ([+-]\d{2}:\d{2})$/.exec(String(str).trim());
  if (!m) return str;
  const [, hh, mm, dd, mo, yyyy, offset] = m;
  return `${yyyy}-${mo}-${dd}T${hh}:${mm}:00${offset}`;
}

function extractTimeOnly(stdTime) {
  const m = /^(\d{2}:\d{2})/.exec(String(stdTime || ''));
  return m ? m[1] : stdTime || null;
}

/**
 * buildUrl('AllPlanetData', person, ['PlanetName', 'All'])
 */
function buildUrl(method, { datetime, coordinates, ayanamsa }, extraSegments) {
  const { time, date, offset } = splitDateTime(datetime);
  const ayanamsaName = AYANAMSA_NAME[Number(ayanamsa)] || 'LAHIRI';
  const parts = [BASE_URL, method];
  if (extraSegments && extraSegments.length) parts.push(...extraSegments);
  parts.push('Location', coordinates, 'Time', time, date, offset, 'Ayanamsa', ayanamsaName);
  return parts.join('/');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * vedastroGet — RETRY-WITH-BACKOFF (2026-09-25, session 6 add). Live testing
 * is session mein dikhaya ke VedAstro ka apna "Unlimited" paid plan bhi
 * kabhi-kabhi thoRi der ke liye 429/"rate limit" de deta hai (khud VedAstro
 * ke Account page se confirm kiya ke subscription Active/Healthy thi, phir
 * bhi lagataar 2-3 requests fail hui) — ye humari API-key ka masla nahi
 * lagta, balke VedAstro ke apne server ka ek transient (aana-jaana) burst
 * behavior hai. Is liye, har chhoti "abhi busy hai" halat par seedha user
 * ko error dikhane ki bajaye, pehle khud thoRa ruk kar 2 dafa dobara koshish
 * karte hain — is se zyada tar transient rate-limit khud hi resolve ho
 * jata hai, user ko pata bhi nahi chalta. Sirf 429/rate-limit jaisi error
 * par retry hota hai — kisi aur wajah (galat data, auth waghera) se turant
 * fail hota hai jaisa pehle tha.
 */
async function vedastroGet(url, attempt = 1) {
  const headers = {};
  const key = apiKey();
  if (key) headers['Authorization'] = `Bearer ${key}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const isRateLimited = res.status === 429 || /rate limit|too many requests/i.test(text);
    if (isRateLimited && attempt < 3) {
      await sleep(attempt * 1500); // 1.5s, phir 3s
      return vedastroGet(url, attempt + 1);
    }
    throw new Error(`VedAstro request failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  if (json.Status !== 'Pass') {
    throw new Error(`VedAstro ${url} ne Status="${json.Status}" diya: ${JSON.stringify(json.Payload)}`);
  }
  return json.Payload;
}

/** "{ Longitude = 95.65..., Latitude = -4.05..., ... }" se {longitude,
 * latitude} nikalta hai — Rahu/Ketu True Node feature (lib/true-node.js)
 * ke liye. */
function parseSwissEphemeris(str) {
  const m = /Longitude\s*=\s*([-\d.]+),\s*Latitude\s*=\s*([-\d.]+)/.exec(String(str || ''));
  if (!m) return null;
  return { longitude: parseFloat(m[1]), latitude: parseFloat(m[2]) };
}

async function callMethod(method, person, extraSegments) {
  const url = buildUrl(method, person, extraSegments);
  const payload = await vedastroGet(url);
  return payload[method];
}

// getAccessToken — Prokerala interface-compat ke liye rakha gaya hai (kahin
// call nahi hota, VedAstro ko OAuth token ki zaroorat nahi).
async function getAccessToken() {
  return null;
}

/**
 * getPlanetPosition(person) — Prokerala ki tarah:
 *   { data: { planet_position: [ {id, name, rasi:{id,name}, degree,
 *     is_retrograde}, ... ] } }
 * id===100 wali entry Ascendant/Lagna hai.
 */
async function getPlanetPosition(person) {
  const [allPlanetData, houseLongitude] = await Promise.all([
    callMethod('AllPlanetData', person, ['PlanetName', 'All']),
    callMethod('HouseLongitude', person, ['HouseNumber', '1']),
  ]);

  const planetPosition = [];
  for (const key of Object.keys(allPlanetData)) {
    const entryObj = allPlanetData[key];
    const name = Object.keys(entryObj)[0];
    const p = entryObj[name];
    const rasiSign = p.PlanetRasiD1Sign || {};
    const rasiName = rasiSign.Name || null;
    const rasiId = rasiName != null ? SIGN_NAME_TO_ID[rasiName] : null;
    const degree = rasiSign.DegreesIn ? Number(rasiSign.DegreesIn.TotalDegrees) : null;
    const isRetro = p.IsPlanetRetrograde === true || String(p.IsPlanetRetrograde).toLowerCase() === 'true';
    // Moon ka TROPICAL (Sayana) longitude/latitude bhi yahin se, isi call
    // se, save kar lete hain (Rahu/Ketu True Node feature ke liye) — is se
    // computeTrueNodeForPerson() ko T1 ke liye alag se ek dedicated call
    // nahi lagani parti (sirf T2, +3 ghante wala sample, alag se chahiye
    // hota hai) — True Node ki total extra-calls lagat 2 se ghat kar 1
    // reh jati hai, jo VedAstro rate-limit se bachne mein madad karta hai.
    const swiss = name === 'Moon' ? parseSwissEphemeris(p.SwissEphemeris) : null;
    planetPosition.push({
      id: null,
      name,
      rasi: { id: rasiId, name: rasiName },
      degree,
      is_retrograde: isRetro,
      ...(swiss ? { tropicalLongitude: swiss.longitude, tropicalLatitude: swiss.latitude } : {}),
    });
  }

  // "Begin:324.0903, Middle:339.2856, End:354.0903" — Middle = Lagna
  // (House 1 ka theek beech wala) sidereal longitude.
  const midMatch = /Middle:\s*([\d.]+)/.exec(String(houseLongitude || ''));
  if (midMatch) {
    const ascLongitude = parseFloat(midMatch[1]);
    const ascRasiId = Math.floor(ascLongitude / 30) % 12;
    const ascDegree = ascLongitude - ascRasiId * 30;
    planetPosition.push({
      id: 100,
      name: 'Ascendant',
      rasi: { id: ascRasiId, name: RASI_ENGLISH[ascRasiId] },
      degree: ascDegree,
      is_retrograde: false,
    });
  }

  return { data: { planet_position: planetPosition } };
}

/**
 * getMoonTropicalSnapshot(person) — Rahu/Ketu TRUE NODE feature (lib/
 * true-node.js) ke liye: Moon ki TROPICAL (Sayana) ecliptic longitude aur
 * latitude, seedha VedAstro ke apne internal Swiss Ephemeris debug field
 * (`SwissEphemeris`) se — normal `PlanetRasiD1Sign` sirf SIDEREAL longitude
 * (rasi+degree) deta hai, aur latitude bilkul nahi deta, is liye ye alag
 * (halka — sirf Moon, "PlanetName/All" nahi) call banayi gayi hai.
 *
 * NOTE: VedAstro ka SwissEphemeris field "SpeedLongitude"/"SpeedLatitude"
 * hamesha 0 deta hai (khud VedAstro ki API ki apni limitation, live test se
 * confirm kiya gaya, 2026-09-25) — is liye velocity seedha nahi mil sakti,
 * isi wajah se True Node 2 qareebi time-samples (T1, T1+3h) se cross-
 * product ke zariye nikala jata hai, seedha ek hi call ki speed-field se
 * nahi (dekhein lib/true-node.js header comment, poora tariqa wahan hai).
 */
async function getMoonTropicalSnapshot(person) {
  const moonObj = await callMethod('AllPlanetData', person, ['PlanetName', 'Moon']);
  const swiss = parseSwissEphemeris(moonObj && moonObj.SwissEphemeris);
  if (!swiss) {
    throw new Error('vedastro-client: Moon ka SwissEphemeris data nahi mila (True Node ke liye zaroori).');
  }
  return swiss;
}

/**
 * Roz-ba-roz forward-calendar ke liye — ek fixed reference location/time
 * se planetary sign positions (server.js sab users ke darmiyan cache/share
 * karta hai).
 */
async function getPlanetPositionForDate(dateStr, ayanamsa) {
  return getPlanetPosition({
    datetime: `${dateStr}T${FORWARD_CALENDAR_REFERENCE_TIME}`,
    coordinates: FORWARD_CALENDAR_REFERENCE_COORDINATES,
    ayanamsa,
  });
}

/**
 * DasaForLife ke "{Lord: {Start,End,SubDasas:{...}}}" wale nested-object
 * shape ko astro-engine.js ke findCurrentDasha()/buildDashaTree() jo shape
 * expect karte hain us mein badalta hai:
 *   { name, lord, start, end, antardasha: [ { ..., pratyantardasha: [...] } ] }
 */
function convertDasaNode(name, node) {
  const antarEntries = node && node.SubDasas ? Object.entries(node.SubDasas) : [];
  return {
    name,
    lord: name,
    start: vedastroTimeToIso(node.Start),
    end: vedastroTimeToIso(node.End),
    antardasha: antarEntries.map(([antarName, antarNode]) => {
      const pratyantarEntries = antarNode && antarNode.SubDasas ? Object.entries(antarNode.SubDasas) : [];
      return {
        name: antarName,
        lord: antarName,
        start: vedastroTimeToIso(antarNode.Start),
        end: vedastroTimeToIso(antarNode.End),
        pratyantardasha: pratyantarEntries.map(([pratyName, pratyNode]) => ({
          name: pratyName,
          lord: pratyName,
          start: vedastroTimeToIso(pratyNode.Start),
          end: vedastroTimeToIso(pratyNode.End),
        })),
      };
    }),
  };
}

/**
 * getKundliAdvanced(person) — Prokerala ki tarah:
 *   { data: { dasha_periods: [...], mangal_dosha: { has_dosha } } }
 */
async function getKundliAdvanced(person) {
  const [dasaForLife, planetPos] = await Promise.all([
    callMethod('DasaForLife', person),
    getPlanetPosition(person),
  ]);

  const dashaPeriods = Object.entries(dasaForLife)
    .map(([name, node]) => convertDasaNode(name, node))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Classical Mangal (Kuja) Dosha — Mars Lagna se 1,2,4,7,8,12 ghar mein ho.
  const list = planetPos.data.planet_position;
  const asc = list.find((p) => p.id === 100);
  const mars = list.find((p) => p.name === 'Mars');
  let hasMangalDosha = false;
  if (asc && mars && asc.rasi.id != null && mars.rasi.id != null) {
    const house = (((mars.rasi.id - asc.rasi.id) % 12) + 12) % 12 + 1;
    hasMangalDosha = [1, 2, 4, 7, 8, 12].includes(house);
  }

  return {
    data: {
      dasha_periods: dashaPeriods,
      mangal_dosha: { has_dosha: hasMangalDosha },
    },
  };
}

/**
 * getSadeSati(person) — VedAstro ke paas dedicated method nahi hai, is
 * liye classical formula khud lagayi gayi hai: transit Saturn agar natal
 * Moon se 12th, 1st ya 2nd bhaav mein ho to Sade Sati chal rahi hai.
 *   { data: { is_in_sade_sati, transit_phase } }
 */
async function getSadeSati(person) {
  const nowIso = new Date().toISOString();
  const transitPerson = { datetime: nowIso, coordinates: person.coordinates, ayanamsa: person.ayanamsa };

  const [natalPos, transitPos] = await Promise.all([
    getPlanetPosition(person),
    getPlanetPosition(transitPerson),
  ]);

  const moon = natalPos.data.planet_position.find((p) => p.name === 'Moon');
  const saturn = transitPos.data.planet_position.find((p) => p.name === 'Saturn');

  let isInSadeSati = false;
  let transitPhase = null;
  if (moon && saturn && moon.rasi.id != null && saturn.rasi.id != null) {
    const house = (((saturn.rasi.id - moon.rasi.id) % 12) + 12) % 12 + 1;
    if (house === 12) {
      isInSadeSati = true;
      transitPhase = 'پہلا مرحلہ (چڑھتی ساڑھ ساتی)';
    } else if (house === 1) {
      isInSadeSati = true;
      transitPhase = 'عروج کا مرحلہ';
    } else if (house === 2) {
      isInSadeSati = true;
      transitPhase = 'آخری مرحلہ (اترتی ساڑھ ساتی)';
    }
  }

  return { data: { is_in_sade_sati: isInSadeSati, transit_phase: transitPhase } };
}

/**
 * getKaalSarpDosha(person) — { data: { has_dosha, ... } }
 */
async function getKaalSarpDosha(person) {
  const k = await callMethod('KalaSarpaYoga', person);
  return {
    data: {
      has_dosha: !!k.IsOccuring,
      occupied_side: k.OccupiedSide || null,
      hemmed_planets: k.HemmedPlanets || [],
      escaped_planets: k.EscapedPlanets || [],
    },
  };
}

/**
 * getPanchang(person) — lib/astro-engine.js ke normalizePanchang() ki
 * flexible shape ke mutabiq: { data: { vaara, tithi, nakshatra, yoga,
 * karana, sunrise, sunset } }
 */
async function getPanchang(person) {
  const t = await callMethod('PanchangaTable', person);
  return {
    data: {
      vaara: t.Vara || null,
      tithi: t.Tithi ? { name: t.Tithi.Name, paksha: t.Tithi.Paksha } : null,
      nakshatra: t.Nakshatra || null,
      yoga: t.Yoga ? { name: t.Yoga.Name } : null,
      karana: t.Karana || null,
      sunrise: t.Sunrise ? extractTimeOnly(t.Sunrise.StdTime) : null,
      sunset: t.Sunset ? extractTimeOnly(t.Sunset.StdTime) : null,
    },
  };
}

/**
 * getSarvashtakavargaBestEffort(person) — { path, data }
 * Frontend (index.html renderAshtakavarga) is JSON ko seedha raw dump kar
 * deta hai, is liye shape ka exact match zaroori nahi — VedAstro ka
 * SarvashtakavargaChart output khud hi saaf aur mukammal hai (har graha
 * ka Total + 12 signs ki Rows).
 */
async function getSarvashtakavargaBestEffort(person) {
  const data = await callMethod('SarvashtakavargaChart', person);
  return { path: 'vedastro:SarvashtakavargaChart', data };
}

module.exports = {
  getAccessToken,
  getKundliAdvanced,
  getPlanetPosition,
  getPlanetPositionForDate,
  getSadeSati,
  getKaalSarpDosha,
  getPanchang,
  getSarvashtakavargaBestEffort,
  getMoonTropicalSnapshot,
};
