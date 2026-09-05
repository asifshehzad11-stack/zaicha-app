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

const prokerala = require('./lib/prokerala-client');
const { buildZaichaData, normalizePanchang } = require('./lib/astro-engine');
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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /api/kundli
 * Body: { name, dob (YYYY-MM-DD), time (HH:MM), lat, lon, ayanamsa, utcOffset }
 */
app.post('/api/kundli', async (req, res) => {
  try {
    const { name, dob, time, lat, lon, ayanamsa, utcOffset } = req.body;

    if (!dob || !time || !lat || !lon) {
      return res.status(400).json({ error: 'dob, time, lat, lon zaroori hain.' });
    }

    const offset = utcOffset || '+05:00'; // Pakistan default
    const birthDatetime = `${dob}T${time}:00${offset}`;
    const coordinates = `${lat},${lon}`;
    const ayanamsaVal = ayanamsa || 1; // 1 = Lahiri

    const person = { datetime: birthDatetime, coordinates, ayanamsa: ayanamsaVal };

    const now = new Date();
    const nowDatetime = now.toISOString().replace('Z', offset);
    const gocharPerson = { datetime: nowDatetime, coordinates, ayanamsa: ayanamsaVal };

    const [kundliAdvanced, natalPlanetPosition, gocharPlanetPosition, sadeSati, kaalSarp] = await Promise.all([
      prokerala.getKundliAdvanced(person),
      prokerala.getPlanetPosition(person),
      prokerala.getPlanetPosition(gocharPerson),
      prokerala.getSadeSati(person),
      prokerala.getKaalSarpDosha(person),
    ]);

    const data = buildZaichaData({
      personName: name || 'صارف',
      kundliAdvanced,
      natalPlanetPosition,
      gocharPlanetPosition,
      sadeSati,
      kaalSarp,
      targetDate: now,
      ayanamsa: ayanamsaVal,
    });

    // Panchang aur Ashtakavarga alag se, non-fatal tareeqe se fetch kiye ja
    // rahe hain — agar in mein se koi fail ho (khaaskar Ashtakavarga, jiska
    // asal endpoint abhi tak public docs se confirm nahi ho saka), to poori
    // /api/kundli request crash nahi hogi, sirf wo ek tab "abhi dastyab
    // nahi" dikha dega.
    const [birthPanchangResult, todayPanchangResult, ashtakavargaResult] = await Promise.allSettled([
      prokerala.getPanchang(person),
      prokerala.getPanchang(gocharPerson),
      prokerala.getSarvashtakavargaBestEffort(person),
    ]);

    const panchang = {
      birth: birthPanchangResult.status === 'fulfilled' ? normalizePanchang(birthPanchangResult.value) : null,
      today: todayPanchangResult.status === 'fulfilled' ? normalizePanchang(todayPanchangResult.value) : null,
      error: birthPanchangResult.status === 'rejected' ? birthPanchangResult.reason.message : null,
    };

    const ashtakavarga = ashtakavargaResult.status === 'fulfilled'
      ? { available: true, path: ashtakavargaResult.value.path, raw: ashtakavargaResult.value.data }
      : { available: false, error: ashtakavargaResult.reason && ashtakavargaResult.reason.message };

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
    });

    const currentTransits = buildCurrentTransitLines(data.gochar.details);
    const transitAspects = buildTransitAspectLines(data.gochar.details);
    const transitCombined = buildCombinedTransitPredictions(data.gochar.details);
    const monthlyOutlook = buildMonthlyOutlook(data.gochar.details);
    const yearlyOutlook = buildYearlyOutlook(data.gochar.details, data.dasha, data.sadeSati);
    const dailyRoutine = buildDailyRoutine(data.houses, data.gochar.details.Moon, now);
    const remedies = buildRemedies({
      hasMangalDosha: data.mangalDosha && data.mangalDosha.has_dosha,
      hasKaalSarpDosha: data.kaalSarp && data.kaalSarp.has_dosha,
      isInSadeSati: data.sadeSati && data.sadeSati.is_in_sade_sati,
      sadeSatiPhase: data.sadeSati && data.sadeSati.transit_phase,
      weakNatalPlanets: data.weakNatalPlanets,
    });

    res.json({
      ...data,
      narrative,
      currentTransits,
      transitAspects,
      monthlyOutlook,
      yearlyOutlook,
      remedies,
      panchang,
      ashtakavarga,
      asOfDate: now.toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Kuch ghalat ho gaya.' });
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

/**
 * GET /api/geocode-city?q=lahore
 * "City of birth" search — koi bhi shehar (poori duniya ka) type karte hi
 * uski latitude/longitude nikal deta hai, taake user ko khud lat/long
 * dhoondhna na pare (jaisa aap ne shuru se manga tha).
 *
 * Ye OpenStreetMap ki mufat "Nominatim" service use karta hai — koi API key
 * nahi chahiye, koi bhi shehar mil jata hai. NOTE: Nominatim ki apni usage
 * policy hai (halki traffic ke liye theek hai, bhaari commercial scale par
 * apna geocoding provider lagana chahiye — README mein note kar diya hai).
 */
app.get('/api/geocode-city', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ results: [] });

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '8');

    const r = await fetch(url.toString(), {
      headers: {
        // Nominatim ki policy ke mutabiq ek pehchan-e-laiq User-Agent zaroori hai.
        'User-Agent': 'ZaichaApp/0.1 (astrology web app; contact: via app owner)',
      },
    });
    if (!r.ok) throw new Error(`Geocoding failed: ${r.status}`);
    const raw = await r.json();

    const results = raw.map((item) => {
      const addr = item.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || item.name;
      const state = addr.state || addr.state_district || '';
      const country = addr.country || '';
      const label = [city, state, country].filter(Boolean).join(', ');
      return {
        label,
        lat: item.lat,
        lon: item.lon,
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
  });
});

app.listen(PORT, () => {
  console.log(`Zaicha server chal raha hai: http://localhost:${PORT}`);
  if (!process.env.PROKERALA_CLIENT_ID || !process.env.PROKERALA_CLIENT_SECRET) {
    console.log('⚠️  .env file mein PROKERALA_CLIENT_ID / PROKERALA_CLIENT_SECRET nahi mile — .env.example dekhein.');
  }
});
