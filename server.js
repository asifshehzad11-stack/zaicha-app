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
const { buildZaichaData } = require('./lib/astro-engine');
const { generateNarrativeViaLLM, buildCurrentTransitLines } = require('./lib/narrative');

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
    });

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

    const currentTransits = buildCurrentTransitLines(data.gochar.fromLagna);

    res.json({ ...data, narrative, currentTransits, asOfDate: now.toISOString().slice(0, 10) });
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
