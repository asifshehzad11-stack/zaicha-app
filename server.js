/**
 * Zaicha Backend Server
 * ======================
 * Ye chhota Express server teen kaam karta hai:
 *   1. `public/` folder se frontend (zaicha-app-scaffold.html se wired) serve karta hai
 *   2. `/api/kundli` route par: form se birth details le kar Prokerala ko
 *      calls karta hai (asal Client ID/Secret sirf yahan, server-side, .env
 *      se use hote hain — browser ya frontend code kabhi inhein nahi dekhta)
 *   3. Ashtakavarga jaisi cheezein jab sort ho jayengi, unke routes bhi yahan add honge
 *
 * Chalane ka tareeqa (README.md mein poori detail hai):
 *   npm install
 *   cp .env.example .env      (phir .env kholein aur apni Prokerala
 *                               Client ID/Secret khud type karein)
 *   node server.js
 *   browser mein http://localhost:3000 kholein
 */

'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// ASTRO_PROVIDER=prokerala .env mein set karein to purana Prokerala client
// wapas istemal hoga (rollback ke liye) — default ab VedAstro hai
// (9 saal purana, MIT license, $1/month unlimited calls — Prokerala se
// bohat sasta aur behtar, dekhein lib/vedastro-client.js ke comments).
const prokerala = process.env.ASTRO_PROVIDER === 'prokerala'
  ? require('./lib/prokerala-client')
  : require('./lib/vedastro-client');
const db = require('./lib/db');
const auth = require('./lib/auth');
const safepay = require('./lib/safepay-client');
const { buildZaichaData, normalizePanchang, buildForwardCalendar } = require('./lib/astro-engine');
const { buildPanchangCalendar } = require('./lib/panchang-calendar');
const {
  generateNarrativeViaLLM,
  buildCurrentTransitLines,
  buildTransitAspectLines,
  buildCombinedTransitPredictions,
  buildMonthlyOutlook,
  buildYearlyOutlook,
  buildRemedies,
  buildDailyRoutine,
} = require('./lib/narrative');
const { buildYogas } = require('./lib/yoga-engine');
const { buildNavamsaChart } = require('./lib/navamsa');
const { buildPlanetProfiles } = require('./lib/planet-profile');
const { buildGrahaBala } = require('./lib/graha-bala');
const { buildYoginiDasha } = require('./lib/yogini-dasha');
const { buildCharaKarakas } = require('./lib/jaimini-karaka');
const { buildMuntha } = require('./lib/varshaphal');
const { buildCharaDasha } = require('./lib/chara-dasha');
const { buildBhavaBala } = require('./lib/bhava-bala');
const { buildVimshopakBala } = require('./lib/vimshopak-bala');
const { buildMoonPhases } = require('./lib/moon-phases');
const { buildNatalAspects } = require('./lib/natal-aspects');
const { buildKpInfo } = require('./lib/kp-system');
const { buildWesternChart } = require('./lib/western-chart');
const { buildArabianParts } = require('./lib/arabian-parts');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * ---- TESTING_FREE_MODE ----
 * Asif ne khud manga (testing phase ke doran): jab tak test version
 * finalize nahi ho jata, tab tak koi bhi subscription/paywall lock na ho —
 * SAB predictions (weekly/monthly/yearly/ashtakavarga sameet) har user ko
 * poori tarah free milni chahiye, koi "اپگریڈ کریں" popup ya blur nahi.
 *
 * Neeche poora subscription system (Safepay, plans, DB premium status
 * waghera) bilkul intact/mojood hai — sirf is EK flag se lock temporarily
 * band kiya gaya hai. Jab test version finalize ho jaye aur subscription
 * dobara chalu karni ho, to bas is line ko `false` kar dein (aur
 * public/index.html mein bhi `TESTING_FREE_MODE` ko `false` kar dein) —
 * baaqi sab kuch (qeematein, Safepay integration, premium-status DB
 * calls) waisay hi kaam karna shuru kar dega, kuch bhi dobara likhna nahi
 * paray ga.
 */
const TESTING_FREE_MODE = true;

/**
 * ---- Subscription plans ----
 * Asif ne apni qeemat khud tay ki: Monthly PKR 500, Yearly PKR 11000 (ye
 * `.env.example` mein defaults ke taur par likhi hain, `.env` mein badal
 * kar kabhi bhi update ki ja sakti hain). Dollar (USD) option bhi manga
 * gaya hai — Pakistan se bahar rehne walon ke liye — is liye har plan ki
 * qeemat DO currencies mein ho sakti hai. USD ki qeemat abhi jaan-boojh
 * kar khud tay nahi ki gayi (Asif ne sirf currency option manga tha,
 * number nahi diya), is liye jab tak `.env` mein PLAN_MONTHLY_USD/
 * PLAN_YEARLY_USD set na hon, subscribe screen par sirf PKR dikhega —
 * USD toggle apne aap tabhi nazar aayega jab dono set ho jayein.
 */
const SUPPORTED_CURRENCIES = ['PKR', 'USD'];
const PLAN_CONFIG = {
  monthly: { days: 30, envKeys: { PKR: 'PLAN_MONTHLY_PKR', USD: 'PLAN_MONTHLY_USD' } },
  yearly: { days: 365, envKeys: { PKR: 'PLAN_YEARLY_PKR', USD: 'PLAN_YEARLY_USD' } },
};

function getPlanPrice(planCode, currency) {
  const plan = PLAN_CONFIG[planCode];
  if (!plan || !plan.envKeys[currency]) return null;
  const raw = process.env[plan.envKeys[currency]];
  const amount = raw ? Number(raw) : NaN;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

/**
 * withLockFlag — Asif ne khud manga: non-premium user ko monthly/yearly/
 * ashtakavarga/weekly ka ASAL content dikhna chahiye (dhundla/blurred), na
 * ke sirf ek khaali "locked" card — taake dekh kar upgrade karne ka dil
 * chahe (jaisa AstroMatrix/Nebula jaisi apps karti hain). Is liye asal
 * data yahan se hata kar chhota stub nahi bheja jata — poora data hi
 * jata hai, bas ek `locked: true` flag sath laga dete hain taake frontend
 * ko pata chale isay blur + "اپگریڈ کریں" overlay ke sath dikhana hai.
 *
 * IMANDAARI SE NOTE (Asif ke liye): is tareeqe ka ek asal trade-off hai —
 * chunke asal content response mein poora chala jata hai, koi bhi
 * technical user browser dev-tools (Network tab) se poora paid text dekh
 * sakta hai, sirf UI mein blur hai. Bohat saari asal apps (Medium,
 * LinkedIn "who viewed you" waghera) yehi tareeqa istemal karti hain
 * kyunke conversion ka fayda is chhoti si khaami se zyada hota hai — lekin
 * agar kabhi lage ke ye masla ban raha hai, to hal simple hai: server
 * side par sirf pehli 1-2 lines asal bhejein aur baaqi hata dein (ya ek
 * generic placeholder text bhejein) — abhi ke liye poora data hi ja raha
 * hai, jaisa manga gaya tha.
 */
function withLockFlag(section, isPremium) {
  if (TESTING_FREE_MODE || isPremium || !section) return section;
  if (Array.isArray(section)) return section; // is app mein filhaal koi array-shape section lock nahi hoti
  return Object.assign({}, section, { locked: true });
}

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// DB schema (agar DATABASE_URL .env mein di gayi ho) startup par ensure kar
// lete hain — agar nahi di gayi to "save profile" feature khamoshi se
// disabled reh jata hai, baaqi app bilkul pehle jaisa chalta hai.
db.ensureSchema().catch((err) => {
  console.error('DB schema ensure nahi ho saka (DATABASE_URL check karein):', err.message);
});

/**
 * Promise.allSettled ke `reason` field mein Error object hoti hai, jo
 * JSON.stringify hone par (jaise DB cache mein save karte waqt) apna
 * `.message` kho deti hai (Error ki apni koi enumerable property nahi
 * hoti). Isi liye cache mein save karne se pehle reason ko seedha ek
 * string bana dete hain — is helper se dono shapes (Error object taaza
 * fetch se, ya plain string cache se wapas aane par) sahi tareeqe se
 * handle ho jaati hain.
 */
function reasonMessage(reason) {
  if (!reason) return null;
  return typeof reason === 'string' ? reason : (reason.message || String(reason));
}

/**
 * fetchNatalBundle — un 5 Prokerala calls ko ek sath karta hai jo kisi bhi
 * shakhs ke liye HAMESHA same result dete hain (sirf pedaishi tafseelat
 * par mabni, waqt guzarne se nahi badalte): kundli/advanced, natal
 * planet-position, kaal-sarp-dosha, pedaish ka panchang, aur ashtakavarga.
 * Isi wajah se ye bundle ek dafa fetch ho kar profile ke sath DB mein
 * cache ho sakta hai — agli baar wahi profile dobara generate karne par
 * in 5 calls ko dobara Prokerala se mangwane ki zaroorat nahi rehti.
 */
async function fetchNatalBundle(person) {
  const [kundliAdvanced, natalPlanetPosition, kaalSarp] = await Promise.all([
    prokerala.getKundliAdvanced(person),
    prokerala.getPlanetPosition(person),
    prokerala.getKaalSarpDosha(person),
  ]);
  const [birthPanchangSettled, ashtakavargaSettled] = await Promise.allSettled([
    prokerala.getPanchang(person),
    prokerala.getSarvashtakavargaBestEffort(person),
  ]);
  return {
    kundliAdvanced,
    natalPlanetPosition,
    kaalSarp,
    birthPanchangResult: birthPanchangSettled.status === 'fulfilled'
      ? { status: 'fulfilled', value: birthPanchangSettled.value }
      : { status: 'rejected', reason: reasonMessage(birthPanchangSettled.reason) },
    ashtakavargaResult: ashtakavargaSettled.status === 'fulfilled'
      ? { status: 'fulfilled', value: ashtakavargaSettled.value }
      : { status: 'rejected', reason: reasonMessage(ashtakavargaSettled.reason) },
  };
}

/**
 * POST /api/kundli
 * Body: { name, dob (YYYY-MM-DD), time (HH:MM), lat, lon, ayanamsa,
 *         utcOffset, phone (optional — profile save karne ke liye),
 *         profileId (optional — pehle se saved profile dobara generate
 *         karne ke liye, is soorat mein natal_cache istemal hoga agar
 *         mojood ho) }
 */
app.post('/api/kundli', async (req, res) => {
  try {
    const { name, dob, time, lat, lon, ayanamsa, utcOffset, phone, profileId, cityLabel, lang } = req.body;
    const session = auth.readSession(req);
    // ---- Multi-language foundation: frontend jo bhi language bhejay (en/ur/hi)
    // usi mein saara narrative/prediction content generate hoga. Default English
    // hai (app-wide default) — narrative.js ka normLang() bhi khud fallback
    // karta hai, lekin yahan bhi explicit rakha hai taake saaf rahe.
    const reqLang = ['en', 'ur', 'hi'].indexOf(lang) !== -1 ? lang : 'en';

    let effective = { name, dob, time, lat, lon, ayanamsa, utcOffset };
    let profileRow = null;

    if (profileId) {
      profileRow = await db.getProfileById(profileId);
      if (!profileRow) {
        return res.status(404).json({ error: 'ye saved profile nahi mili — ho sakta hai delete ho gayi ho.' });
      }
      // Agar ye profile kisi account (user_id) se judi hai, to sirf usi
      // account ka session ise dobara generate kar sakta hai — koi aur
      // logged-in ya bina-login user sirf ID guess kar ke kisi doosre ki
      // saved kundli access nahi kar sakta (Step 2 ka asal privacy fayda).
      if (profileRow.user_id && (!session || session.uid !== profileRow.user_id)) {
        return res.status(403).json({ error: 'ye saved kundli sirf iske malik ke account se hi dekhi ja sakti hai — pehle sign in karein.' });
      }
      effective = {
        name: profileRow.name,
        dob: profileRow.dob,
        time: profileRow.time,
        lat: profileRow.lat,
        lon: profileRow.lon,
        ayanamsa: profileRow.ayanamsa,
        utcOffset: profileRow.utc_offset,
      };
    }

    if (!effective.dob || !effective.time || !effective.lat || !effective.lon) {
      return res.status(400).json({ error: 'dob, time, lat, lon zaroori hain.' });
    }

    const offset = effective.utcOffset || '+05:00'; // Pakistan default
    const birthDatetime = `${effective.dob}T${effective.time}:00${offset}`;
    const coordinates = `${effective.lat},${effective.lon}`;
    const ayanamsaVal = effective.ayanamsa || 1; // 1 = Lahiri

    const person = { datetime: birthDatetime, coordinates, ayanamsa: ayanamsaVal };

    const now = new Date();
    const nowDatetime = now.toISOString().replace('Z', offset);
    const gocharPerson = { datetime: nowDatetime, coordinates, ayanamsa: ayanamsaVal };

    // ---- Natal bundle: cache se (agar saved profile hai) ya taaza fetch ----
    let natalBundle;
    let usedCache = false;
    if (profileRow && profileRow.natal_cache) {
      natalBundle = profileRow.natal_cache;
      usedCache = true;
    } else {
      natalBundle = await fetchNatalBundle(person);
    }
    const { kundliAdvanced, natalPlanetPosition, kaalSarp, birthPanchangResult, ashtakavargaResult } = natalBundle;

    // ---- Agar naya profile save karna ho, to yahan save kar ke, saath hi
    // natal bundle cache kar dete hain — is se agli baar isi profile ke
    // liye ye 5 calls dobara nahi karni parengi. Do tareeqon se save ho
    // sakti hai: (1) phone number di gayi ho (purana, bina-login tareeqa),
    // (2) user logged in ho (session) — is soorat mein phone ke bagair bhi
    // profile khud-b-khud us ke account se jud kar save ho jati hai.
    let savedProfileId = profileId || null;
    if (!profileId && (phone || session) && db.isDbConfigured()) {
      try {
        const saved = await db.saveProfile({
          phone: phone || null, name: effective.name || 'صارف', dob: effective.dob, time: effective.time,
          lat: effective.lat, lon: effective.lon, cityLabel, utcOffset: offset, ayanamsa: ayanamsaVal,
          userId: session ? session.uid : null,
        });
        savedProfileId = saved.id;
        await db.cacheNatalData(saved.id, natalBundle);
      } catch (saveErr) {
        console.error('Profile save nahi ho saki (app phir bhi chalta rahega):', saveErr.message);
      }
    }

    // ---- Ye teeno HAMESHA taaza fetch hote hain — waqt/tareekh ke sath
    // badalte hain, is liye cache nahi ho sakte: aaj ki gochar (current
    // transit) positions, Sade Sati ka current status, aur aaj ka panchang.
    const [gocharPlanetPosition, sadeSati, todayPanchangSettled] = await Promise.all([
      prokerala.getPlanetPosition(gocharPerson),
      prokerala.getSadeSati(person),
      prokerala.getPanchang(gocharPerson).then(
        (value) => ({ status: 'fulfilled', value }),
        (reason) => ({ status: 'rejected', reason: reasonMessage(reason) })
      ),
    ]);

    const data = buildZaichaData({
      personName: effective.name || 'صارف',
      kundliAdvanced,
      natalPlanetPosition,
      gocharPlanetPosition,
      sadeSati,
      kaalSarp,
      targetDate: now,
      ayanamsa: ayanamsaVal,
    });

    const panchang = {
      birth: birthPanchangResult.status === 'fulfilled' ? normalizePanchang(birthPanchangResult.value) : null,
      today: todayPanchangSettled.status === 'fulfilled' ? normalizePanchang(todayPanchangSettled.value) : null,
      error: birthPanchangResult.status === 'rejected' ? birthPanchangResult.reason : null,
    };

    const ashtakavarga = ashtakavargaResult.status === 'fulfilled'
      ? { available: true, path: ashtakavargaResult.value.path, raw: ashtakavargaResult.value.data }
      : { available: false, error: ashtakavargaResult.reason };

    if (ashtakavargaResult.status === 'rejected') {
      console.error('Ashtakavarga abhi tak wire nahi ho saka:', ashtakavargaResult.reason);
    }

    const narrative = await generateNarrativeViaLLM({
      lifeAreaKey: 'career',
      mahadashaLord: data.dasha.mahadasha && data.dasha.mahadasha.lord,
      mahadashaLordNatalHouse: data.dasha.mahadashaLordNatalHouse,
      antardashaLord: data.dasha.antardasha && data.dasha.antardasha.lord,
      antardashaLordNatalHouse: data.dasha.antardashaLordNatalHouse,
      antardashaLordRetrograde: data.dasha.antardashaLordRetrograde,
      isInSadeSati: data.sadeSati && data.sadeSati.is_in_sade_sati,
      sadeSatiPhase: data.sadeSati && data.sadeSati.transit_phase,
      hasKaalSarpDosha: data.kaalSarp && data.kaalSarp.has_dosha,
      hasMangalDosha: data.mangalDosha && data.mangalDosha.has_dosha,
    }, reqLang);

    const currentTransits = buildCurrentTransitLines(data.gochar.details, reqLang);
    const transitAspects = buildTransitAspectLines(data.gochar.details, reqLang);
    const transitCombined = buildCombinedTransitPredictions(data.gochar.details, reqLang);
    const monthlyOutlook = buildMonthlyOutlook(data.gochar.details, reqLang);
    const yearlyOutlook = buildYearlyOutlook(data.gochar.details, data.dasha, data.sadeSati, reqLang);
    const dailyRoutine = buildDailyRoutine(data.houses, data.gochar.details.Moon, now, reqLang);
    // ---- Yoga Detection — poori tarah FREE hai (koi extra API call
    // nahi lagti, sirf pehle se maujood natal data par classical rules
    // apply hoti hain). Feature-list mein sab se pehle add kiya gaya
    // (Asif ke "OMNIS 7 jaisa feature-rich banao" wale roadmap ka Phase 1).
    const yogas = buildYogas(data, reqLang);
    // ---- Navamsa (D9) — bhi bilkul free hai, pehle se maujood natal
    // degrees par sirf classical divisional-chart formula apply hoti hai.
    // Roadmap Phase 1 ka doosra item.
    const navamsa = buildNavamsaChart(data);
    // ---- Per-planet deep profile — Phase 1 ka teesra item. Navamsa ke
    // baad banaya isi liye taake har graha ki profile mein uski D9 rasi
    // aur vargottama status bhi shamil ho sake.
    const planetProfiles = buildPlanetProfiles({ ...data, navamsa });
    // ---- Graha Bala (Phase 2 ka pehla item) — bilkul free, sirf pehle se
    // maujood natal degrees par based hai. Poora "textbook Shad Bala" nahi
    // hai (Cheshta Bala + fine Kala Bala data available nahi) — is baat
    // ka disclaimer lib/graha-bala.js ke header comment aur UI dono mein
    // saaf likha gaya hai.
    const grahaBala = buildGrahaBala(data);
    // ---- Yogini Dasha (Phase 2 ka doosra item) — ye bhi bilkul free hai,
    // koi API is dasha ko provide nahi karti (sirf Vimshottari milta hai),
    // is liye poori tarah khud calculate ki gayi hai (lib/yogini-dasha.js
    // dekhein — classical formula do independent sources se verify kiya
    // gaya hai). Dates estimate hain (isEstimate: true), UI mein disclose
    // hota hai — bilkul Sade Sati window estimate ki tarah.
    const yoginiDasha = buildYoginiDasha(data, new Date(birthDatetime), now, reqLang);
    // ---- Chara Karaka (Jaimini) — Phase 3 ka Karakatva building block,
    // aur Chara Dasha (Phase 2, agla item) ke liye bhi zaroori hai. Bilkul
    // free hai, pehle se maujood natal degrees se hi nikal aata hai.
    const charaKarakas = buildCharaKarakas(data, reqLang);
    // ---- Muntha (Varshaphal ka pehla, verified hissa — Phase 2 ka
    // teesra item) — lib/varshaphal.js ka header comment dekhein ke
    // poora Varshaphal (Varshesh/year-lord) abhi kyun shamil nahi.
    const muntha = buildMuntha(data, new Date(birthDatetime), now, reqLang);
    // ---- Chara Dasha (Jaimini) — Phase 2 ka teesra dasha system. Do open
    // classical sawal (starting-sign, antardasha order) genuinely disputed
    // hain lineage ke hisab se — lib/chara-dasha.js ke header comment mein
    // poori tafseel/disclosure hai. Base Mahadasha/Antardasha duration rules
    // sab sources se confirmed hain.
    const charaDasha = buildCharaDasha(data, new Date(birthDatetime), now, reqLang);
    // ---- Bhava Bala (house strength) — OMNIS-7 feature-parity item
    // (Phase 3). lib/bhava-bala.js dekhein — mojooda Graha Bala ko hi
    // extend karta hai, koi nayi API call nahi chahiye.
    const bhavaBala = buildBhavaBala(data);
    // ---- Vimshopak Bala (20-point Shadvarga strength score) — OMNIS-7
    // feature-parity item (Phase 3). lib/vimshopak-bala.js dekhein — 4 nayi
    // divisional-chart (D2/D3/D12/D30) calculators (lib/vargas.js) + D9
    // (lib/navamsa.js, pehle se maujood) ko combine karta hai. Dignity-to-
    // points table ek disclosed simplification hai (poori tafseel us
    // file ke header comment mein).
    const vimshopakBala = buildVimshopakBala(data);
    // ---- Moon Phases (agla New Moon/Amavasya, agla Full Moon/Purnima) —
    // OMNIS-7 feature-parity item (Phase 3, task 41). lib/moon-phases.js
    // dekhein — "aaj" ka Sun/Moon (data.gochar.details, already FREE
    // maujood) se mean-synodic-rate projection, koi extra API call nahi.
    // Eclipses wala hissa disclosed limitation ke sath BLOCKED hai (usi
    // file ke header comment mein poori wajah).
    const moonPhases = buildMoonPhases(
      data.gochar.details.Sun && data.gochar.details.Sun.rasiId,
      data.gochar.details.Sun && data.gochar.details.Sun.degree,
      data.gochar.details.Moon && data.gochar.details.Moon.rasiId,
      data.gochar.details.Moon && data.gochar.details.Moon.degree,
      now.toISOString().slice(0, 10)
    );
    // ---- Planetary Aspects view (natal graha-drishti) — OMNIS-7
    // feature-parity item (Phase 3, task 42). lib/natal-aspects.js dekhein
    // — koi naya formula nahi, mojooda ASPECT_OFFSETS table (jo pehle se
    // Transit Aspects/Bhava Drishti Bala mein istemal ho raha hai) ko
    // seedha natal chart ke planet-to-planet drishti dikhane ke liye
    // reuse karta hai. Koi extra API call nahi.
    const natalAspects = buildNatalAspects(data);
    // ---- KP (Krishnamurti Paddhati) info screen — OMNIS-7 feature-parity
    // item (Phase 3, task 43). lib/kp-system.js dekhein — Star Lord +
    // Sub Lord har planet/Ascendant ke liye, 2 disclosed limitations ke
    // sath (app ka apna Lahiri ayanamsa, aur cuspal significators abhi
    // nahi). Koi extra API call nahi.
    const kpInfo = buildKpInfo(data);
    // ---- Western (Tropical) chart view — OMNIS-7 feature-parity item
    // (Phase 3, task 44). lib/western-chart.js dekhein — mojooda sidereal
    // longitude data mein khud-derive-kiya-gaya ayanamsa-value jama kar ke
    // tropical chart banata hai (koi extra API call nahi), disclosed
    // linear-approximation + whole-sign-house limitations ke sath.
    const westernChart = buildWesternChart(data, new Date(birthDatetime));
    // ---- Arabian Parts (Lots) — OMNIS-7 feature-parity item (Phase 3,
    // task 45). lib/arabian-parts.js dekhein — sirf Fortune + Spirit
    // (sab se mustanad Lots), Hellenistic sect-based (din/raat) formula
    // (2 independent sources se cross-verified), is app ki apni sidereal
    // longitude data par (disclosed frame). Koi extra API call nahi.
    const arabianParts = buildArabianParts(data);
    const remedies = buildRemedies({
      hasMangalDosha: data.mangalDosha && data.mangalDosha.has_dosha,
      hasKaalSarpDosha: data.kaalSarp && data.kaalSarp.has_dosha,
      isInSadeSati: data.sadeSati && data.sadeSati.is_in_sade_sati,
      sadeSatiPhase: data.sadeSati && data.sadeSati.transit_phase,
      weakNatalPlanets: data.weakNatalPlanets,
    }, reqLang);

    // ---- Paywall: Daily (narrative/transits/dailyRoutine/remedies/panchang)
    // hamesha free rehta hai. Monthly/Yearly outlook aur Ashtakavarga sirf
    // active subscription wale account ko poore milte hain — baaqi sab ko
    // "locked" marker milta hai (asal data response mein jata hi nahi).
    // Guest (bina-login) hamesha free tareeqe se treat hota hai.
    const premiumStatus = (session && db.isDbConfigured())
      ? await db.getUserPremiumStatus(session.uid)
      : { isPremium: false, premiumUntil: null };

    res.json({
      ...data,
      narrative,
      currentTransits,
      transitAspects,
      transitCombined,
      monthlyOutlook: withLockFlag(monthlyOutlook, premiumStatus.isPremium),
      yearlyOutlook: withLockFlag(yearlyOutlook, premiumStatus.isPremium),
      dailyRoutine,
      remedies,
      yogas,
      navamsa,
      planetProfiles,
      grahaBala,
      vimshopakBala,
      moonPhases,
      natalAspects,
      kpInfo,
      westernChart,
      arabianParts,
      yoginiDasha,
      charaDasha,
      charaKarakas,
      bhavaBala,
      muntha,
      panchang,
      ashtakavarga: withLockFlag(ashtakavarga, premiumStatus.isPremium),
      asOfDate: now.toISOString().slice(0, 10),
      profileId: savedProfileId,
      usedNatalCache: usedCache,
      // Frontend ko ye chahiye taake baad mein (jab user "ہفتہ وار کیلنڈر"
      // shortcut dabaye) /api/forward-calendar ko call karte waqt poori
      // pedaishi tafseelat dobara bheجne ki zaroorat na pare.
      ayanamsa: ayanamsaVal,
      isPremium: premiumStatus.isPremium,
      lang: reqLang,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Kuch ghalat ho gaya.' });
  }
});

/**
 * ---- Step 2: Auth routes (email/password se asal account) ----
 * Register/Login kamyaab hone par httpOnly cookie mein ek JWT session set
 * ho jata hai (lib/auth.js dekhein) — frontend is cookie ko chhoo nahi
 * sakta, bas har request ke sath khud-b-khud chali jati hai.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/auth/register', async (req, res) => {
  try {
    if (!db.isDbConfigured()) {
      return res.status(400).json({ error: 'اکاؤنٹ کا نظام ابھی سرور پر configure نہیں (DATABASE_URL .env میں سیٹ کریں)۔' });
    }
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const password = String((req.body && req.body.password) || '');
    const name = String((req.body && req.body.name) || '').trim();

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'درست ای میل درج کریں۔' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔' });
    }
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'اس ای میل سے پہلے ہی اکاؤنٹ موجود ہے — سائن اِن کریں۔' });
    }
    const passwordHash = await auth.hashPassword(password);
    const user = await db.createUser({ email, passwordHash, name: name || null });
    auth.setSessionCookie(res, user);
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'رجسٹریشن ناکام ہوئی۔' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!db.isDbConfigured()) {
      return res.status(400).json({ error: 'اکاؤنٹ کا نظام ابھی سرور پر configure نہیں (DATABASE_URL .env میں سیٹ کریں)۔' });
    }
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const password = String((req.body && req.body.password) || '');
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'ای میل یا پاس ورڈ درست نہیں۔' });
    }
    const ok = await auth.verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'ای میل یا پاس ورڈ درست نہیں۔' });
    }
    auth.setSessionCookie(res, user);
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'لاگ اِن ناکام ہوا۔' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  auth.clearSessionCookie(res);
  res.json({ ok: true });
});

/**
 * GET /api/auth/me — page load par frontend ye pooch kar pata karta hai ke
 * koi valid session cookie pehle se mojood hai ya nahi (AstroMatrix ki
 * tarah: agar mojood ho to Welcome/login screen dikhaye bagair seedha app
 * khol dete hain).
 */
app.get('/api/auth/me', async (req, res) => {
  try {
    const session = auth.readSession(req);
    if (!session) return res.json({ user: null });
    const user = await db.getUserById(session.uid);
    res.json({ user: user ? { id: user.id, email: user.email, name: user.name } : null });
  } catch (err) {
    res.json({ user: null });
  }
});

/**
 * GET /api/profiles?phone=03001234567
 * Agar user logged in ho (session cookie valid ho) to sirf USI KE account
 * se judi saved kundliyan wapas aati hain — phone parameter is soorat mein
 * nazar-andaz ho jata hai (taake koi bhi kisi aur ka phone number type kar
 * ke uski kundli na dekh sake). Agar login na ho to purana phone-based
 * tareeqa (backward-compatible) chalta rehta hai.
 */
app.get('/api/profiles', async (req, res) => {
  try {
    if (!db.isDbConfigured()) {
      return res.json({ available: false, profiles: [] });
    }
    const session = auth.readSession(req);
    if (session) {
      const profiles = await db.listProfilesByUserId(session.uid);
      return res.json({ available: true, profiles });
    }
    const phone = (req.query.phone || '').trim();
    if (!phone) return res.json({ available: true, profiles: [] });
    const profiles = await db.listProfilesByPhone(phone);
    res.json({ available: true, profiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Saved kundliyan load nahi ho sakin.' });
  }
});

/**
 * ---- Subscription (paid features: hafta-war calendar, monthly/yearly
 * outlook, ashtakavarga, aage kundli-matching) — Safepay (card payments)
 * ke zariye. Poora tareeqa README mein hai; teeno routes login zaroori
 * maangte hain kyunke premium status hamesha account (user_id) se juda
 * hota hai, kisi device/session se nahi.
 */

/**
 * GET /api/subscribe/status — abhi login wale account ka premium status,
 * aur .env mein set ki gayi (agar ki gayi ho) plan qeematein.
 */
app.get('/api/subscribe/status', async (req, res) => {
  try {
    const session = auth.readSession(req);
    if (!session || !db.isDbConfigured()) {
      return res.json({ isPremium: false, premiumUntil: null, plans: {} });
    }
    const status = await db.getUserPremiumStatus(session.uid);
    // Har plan ke liye jo bhi currencies .env mein set hain wahi bhejte
    // hain — agar sirf PKR set hai to frontend khud USD toggle chhupa
    // dega (dono set hon tabhi dikhega).
    const plans = {};
    for (const code of Object.keys(PLAN_CONFIG)) {
      const amounts = {};
      for (const currency of SUPPORTED_CURRENCIES) {
        const price = getPlanPrice(code, currency);
        if (price) amounts[currency] = price;
      }
      if (Object.keys(amounts).length) plans[code] = { amounts, days: PLAN_CONFIG[code].days };
    }
    res.json({ ...status, plans, safepayConfigured: safepay.isSafepayConfigured() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Subscription status load nahi ho saka.' });
  }
});

/**
 * POST /api/subscribe/checkout
 * Body: { planCode: 'monthly' | 'yearly' }
 * Login zaroori hai. Ek "pending" payment record banata hai aur Safepay ka
 * hosted checkout URL wapas karta hai — frontend seedha isi URL par user ko
 * bhej deta hai (card details Safepay ke apne page par bharti hain, hamare
 * server ko kabhi nahi milti).
 */
app.post('/api/subscribe/checkout', async (req, res) => {
  try {
    const session = auth.readSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Subscription lene ke liye pehle sign in karein.' });
    }
    if (!db.isDbConfigured()) {
      return res.status(400).json({ error: 'Account system server par configure nahi (DATABASE_URL .env mein set karein).' });
    }
    if (!safepay.isSafepayConfigured()) {
      return res.status(400).json({ error: 'Payment gateway abhi configure nahi (.env mein SAFEPAY_API_KEY set karein — README dekhein).' });
    }
    const planCode = String((req.body && req.body.planCode) || '');
    const currency = String((req.body && req.body.currency) || 'PKR').toUpperCase();
    if (!PLAN_CONFIG[planCode]) {
      return res.status(400).json({ error: 'Plan darust nahi (monthly/yearly mein se chunein).' });
    }
    if (SUPPORTED_CURRENCIES.indexOf(currency) === -1) {
      return res.status(400).json({ error: 'Currency darust nahi (PKR/USD mein se chunein).' });
    }
    const amount = getPlanPrice(planCode, currency);
    if (!amount) {
      return res.status(400).json({ error: `${planCode} plan ki ${currency} qeemat abhi .env mein set nahi (${PLAN_CONFIG[planCode].envKeys[currency]}).` });
    }

    // orderId hamara apna unique reference hai (webhook isi se payment
    // dobara dhoondta hai) — user id + waqt + random taake kabhi takra na sake.
    const orderId = `zaicha_${session.uid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.createPendingPayment({
      userId: session.uid,
      planCode,
      amount,
      currency,
      orderId,
    });

    const origin = `${req.protocol}://${req.get('host')}`;
    const checkoutUrl = await safepay.createCheckoutUrl({
      amount: Math.round(amount * 100), // Safepay paise/cents mein leta hai
      currency,
      orderId,
      redirectUrl: `${origin}/?subscribed=1`,
      cancelUrl: `${origin}/?subscribed=0`,
    });

    res.json({ checkoutUrl, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Checkout shuru nahi ho saka.' });
  }
});

/**
 * POST /api/subscribe/webhook — Safepay khud is route ko call karta hai jab
 * payment complete/fail ho. Ye route Safepay dashboard mein "Webhook URL"
 * ke taur par register karni hogi (README mein tareeqa hai):
 *   https://<aapki-domain>/api/subscribe/webhook
 */
app.post('/api/subscribe/webhook', async (req, res) => {
  try {
    if (!safepay.isSafepayConfigured()) {
      return res.status(400).json({ error: 'Safepay configure nahi.' });
    }
    const verified = await safepay.verifyWebhook(req);
    if (!verified) {
      return res.status(400).json({ error: 'Webhook signature verify nahi hui.' });
    }
    const body = req.body || {};
    const orderId = body.order_id || body.orderId || (body.metadata && body.metadata.order_id);
    const paymentStatus = String(body.status || body.state || '').toLowerCase();

    if (!orderId) {
      return res.status(400).json({ error: 'Webhook mein order_id nahi mila.' });
    }
    const payment = await db.getPaymentByOrderId(orderId);
    if (!payment) {
      return res.status(404).json({ error: 'Ye order_id kisi pending payment se match nahi hui.' });
    }

    if (paymentStatus === 'tracker.charge.success' || paymentStatus === 'success' || paymentStatus === 'completed' || paymentStatus === 'paid') {
      const days = PLAN_CONFIG[payment.plan_code] ? PLAN_CONFIG[payment.plan_code].days : 30;
      await db.markPaymentCompleted(orderId, body.tracker || body.reference || null, days);
    } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'tracker.charge.failure') {
      await db.markPaymentFailed(orderId);
    }
    // Safepay ko hamesha 200 bhejte hain jab tak humne request khud process
    // kar li ho — warna wo baar baar retry karta rahega.
    res.json({ ok: true });
  } catch (err) {
    console.error('Safepay webhook process karte waqt masla:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Debug route — real raw Prokerala response dekhne ke liye, taake
 * astro-engine.js ke "SHAPE TODO" comments (dasha_periods ka exact field
 * naming) confirm kiye ja saken jab real credentials se test ho.
 * Production mein ye route hata dena chahiye ya password se protect karna
 * chahiye — abhi ke liye sirf local development ke liye hai.
 */
app.post('/api/debug/kundli-raw', async (req, res) => {
  try {
    const { dob, time, lat, lon, ayanamsa, utcOffset } = req.body;
    const offset = utcOffset || '+05:00';
    const person = {
      datetime: `${dob}T${time}:00${offset}`,
      coordinates: `${lat},${lon}`,
      ayanamsa: ayanamsa || 1,
    };
    const raw = await prokerala.getKundliAdvanced(person);
    res.json(raw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Debug route — Ashtakavarga/Sarvashtakavarga ka asal endpoint aur
 * response shape abhi live confirm nahi ho saka (README/prokerala-client.js
 * mein tafseel hai). Ye route har candidate path ka result (kamyaab ya
 * error) alag alag dikhata hai — jab real credentials se ek dafa test
 * hoga, jo path kaam karay uska asal JSON shape dekh kar hum
 * astro-engine.js/narrative.js mein house-wise numbers nikalne wala code
 * theek se likh sakenge. Production mein hata dena chahiye.
 */
app.post('/api/debug/ashtakavarga-raw', async (req, res) => {
  try {
    const { dob, time, lat, lon, ayanamsa, utcOffset } = req.body;
    const offset = utcOffset || '+05:00';
    const person = {
      datetime: `${dob}T${time}:00${offset}`,
      coordinates: `${lat},${lon}`,
      ayanamsa: ayanamsa || 1,
    };
    // getSarvashtakavargaBestEffort khud saaray candidate paths try karta
    // hai aur agar sab fail hon to har ek ki alag error message ek sath
    // laut ata hai (prokerala-client.js dekhein) — is liye yahan sirf ek
    // hi call kaafi hai.
    const result = await prokerala.getSarvashtakavargaBestEffort(person);
    res.json({ workingPath: result.path, data: result.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Roz-ba-roz calendar (forward-looking, aglay kuch dinon ka gochar) ----

const FORWARD_CALENDAR_DAYS = 7;
const FORWARD_CALENDAR_DEFAULT_AYANAMSA = 1;

/**
 * pakistanDateString — "aaj" ko hamesha Pakistan waqt (+05:00) ke hisab se
 * tay karta hai (bilkul usi reference timezone se jo
 * prokerala-client.js -> getPlanetPositionForDate istemal karta hai), taake
 * server chahe kisi bhi timezone mein chal raha ho (Render UTC par chalta
 * hai), "aaj ka din" hamesha sahi rahay.
 */
function pakistanDateString(baseDate, addDays) {
  const pkOffsetMs = 5 * 60 * 60 * 1000;
  const pk = new Date(baseDate.getTime() + pkOffsetMs);
  pk.setUTCDate(pk.getUTCDate() + addDays);
  return pk.toISOString().slice(0, 10);
}

/**
 * getOrFetchDailyTransit — pehle SHARED cache (daily_transits table, sab
 * users ke darmiyan common) check karta hai; sirf tab Prokerala ko call
 * karta hai jab wo din pehle kisi ne bhi na maanga ho. Ye function hi is
 * poori feature ki asal cost-saving hai (design.md/README mein tafseel) —
 * BAGHAIR is caching ke har user ka har generate 7 alag Prokerala calls
 * leta, is ke sath poori app ke liye din mein sirf ~1 nayi call (naya din
 * jab pehli baar maanga jaye) kaafi hai.
 */
async function getOrFetchDailyTransit(dateStr, ayanamsa) {
  if (db.isDbConfigured()) {
    const cached = await db.getCachedDailyTransit(dateStr, ayanamsa);
    if (cached) return cached;
  }
  const raw = await prokerala.getPlanetPositionForDate(dateStr, ayanamsa);
  const planetList = raw.data.planet_position;
  if (db.isDbConfigured()) {
    try {
      await db.saveCachedDailyTransit(dateStr, ayanamsa, planetList);
    } catch (err) {
      // Cache save fail ho jaye to bhi calendar dikhana chahiye — sirf
      // agli baar phir se yehi din dobara fetch karna paray ga.
      console.error('daily_transits cache save fail:', err.message);
    }
  }
  return planetList;
}

/**
 * POST /api/forward-calendar
 * body: { ascendantRasiId: 0-11, ayanamsa? }
 * Frontend ke paas ye already maujood hota hai (pichlay "زائچہ بنائیں" se
 * — data.natal.ascendantRasiId) — is liye dobara poori pedaishi tafseelat
 * bhejne/refetch karne ki zaroorat nahi.
 */
app.post('/api/forward-calendar', async (req, res) => {
  try {
    // Hafta-war calendar paid feature hai, lekin (jaisa Asif ne manga) asal
    // content non-premium ko bhi mil jata hai — sirf `locked: true` flag ke
    // sath, taake frontend isay blur + "اپگریڈ کریں" overlay ke sath dikhaye
    // (poori route block karne ke bajaye — withLockFlag() ka wahi usool
    // yahan bhi, sirf poori response par).
    const session = auth.readSession(req);
    const premiumStatus = (session && db.isDbConfigured())
      ? await db.getUserPremiumStatus(session.uid)
      : { isPremium: false };

    const { ascendantRasiId, ayanamsa } = req.body;
    if (typeof ascendantRasiId !== 'number' || ascendantRasiId < 0 || ascendantRasiId > 11) {
      return res.status(400).json({ error: 'Pehle "زائچہ بنائیں" dabayein — ascendantRasiId (0-11) zaroori hai.' });
    }
    const ayn = ayanamsa || FORWARD_CALENDAR_DEFAULT_AYANAMSA;

    const dayEntries = [];
    for (let i = 0; i < FORWARD_CALENDAR_DAYS; i++) {
      const dateStr = pakistanDateString(new Date(), i);
      const planetList = await getOrFetchDailyTransit(dateStr, ayn);
      dayEntries.push({ date: dateStr, planetList });
    }

    const calendar = buildForwardCalendar(ascendantRasiId, dayEntries);
    // Panchang Calendar (Tithi/Vaara/Yoga/Karana, roz ka) — bilkul isi
    // shared dayEntries se, koi extra API call nahi (lib/panchang-calendar.js
    // dekhein — 2 independent sources se cross-verified formulas).
    const panchangCalendar = buildPanchangCalendar(dayEntries, ascendantRasiId);
    res.json({ days: calendar, panchangCalendar, locked: TESTING_FREE_MODE ? false : !premiumStatus.isPremium });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/geocode-city?q=lahore
 * "City of birth" search — koi bhi shehar (poori duniya ka) type karte hi
 * uski latitude/longitude nikal deta hai, taake user ko khud lat/long
 * dhoondhna na pare (jaisa aap ne shuru se manga tha).
 *
 * PEHLE ye OpenStreetMap ki "Nominatim" service use karta tha, lekin Render
 * (aur bohat se doosre cloud hosts) ki shared IPs ko Nominatim ne apni
 * policy ke mutabiq block/rate-limit kar diya hai (har request par
 * consistently 429 "Too Many Requests" — chahe kitna bhi debounce/delay
 * kar lein, kam nahi hota, kyunke masla humari request-rate nahi, balke
 * Render ki poori IP range par lagi hui block hai).
 *
 * Ab is ki jagah Open-Meteo ki mufat Geocoding API use ho rahi hai
 * (https://open-meteo.com/en/docs/geocoding-api) — koi API key nahi
 * chahiye, koi cloud-IP block nahi (live test kiya gaya), aur global
 * coverage Nominatim jaisi hi achi hai.
 */
app.get('/api/geocode-city', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ results: [] });

    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', q);
    url.searchParams.set('count', '8');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`Geocoding failed: ${r.status}`);
    const raw = await r.json();

    const results = (raw.results || []).map((item) => {
      const label = [item.name, item.admin1, item.country].filter(Boolean).join(', ');
      return {
        label,
        lat: item.latitude,
        lon: item.longitude,
      };
    });

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Shehar dhoondhne mein masla hua.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    credentialsConfigured: !!(process.env.PROKERALA_CLIENT_ID && process.env.PROKERALA_CLIENT_SECRET),
    dbConfigured: db.isDbConfigured(),
    safepayConfigured: safepay.isSafepayConfigured(),
  });
});

app.listen(PORT, () => {
  console.log(`Zaicha server chal raha hai: http://localhost:${PORT}`);
  if (!process.env.PROKERALA_CLIENT_ID || !process.env.PROKERALA_CLIENT_SECRET) {
    console.log('⚠️  .env file mein PROKERALA_CLIENT_ID / PROKERALA_CLIENT_SECRET nahi mile — .env.example dekhein.');
  }
  if (!auth.isJwtSecretConfigured()) {
    console.log('⚠️  .env mein JWT_SECRET nahi mila — filhaal ek dev-only fallback secret use ho raha hai. Login/register kaam karega, lekin production mein zaroor apna JWT_SECRET set karein (warna sab sessions server restart par khatam ho jayenge, aur sessions forge honay ka khatra rehta hai).');
  }
});
