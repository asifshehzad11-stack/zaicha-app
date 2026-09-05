/**
 * Database layer — har user ki pedaishi tafseelat (profile) ko Supabase
 * (Postgres) mein save karta hai, taake:
 *   1. User dobara wahi tafseelat type na kare — apna phone number de kar
 *      apni pehle se saved kundliyan wapas dekh sake (bilkul AstroSage /
 *      AstroMatrix ki tarah).
 *   2. NATAL data (jo kabhi nahi badalta — kundli/advanced, planet-position
 *      [natal], kaal-sarp, ashtakavarga, pedaish ka panchang) sirf EK BAAR
 *      Prokerala se lena pare — agli har baar wahi profile dobara generate
 *      karne par sirf GOCHAR (aaj ki transit position), Sade Sati status,
 *      aur AAJ ka panchang naye sirey se lena parta hai (kyunke sirf yehi
 *      cheezein waqt ke sath badalti hain). Is se ek dafa "confirm" hui
 *      profile par har baar ke credits ~440-740 se ghat kar ~70 tak aa
 *      jaate hain — jo hum ne Prokerala credit-cost discussion mein dekha
 *      tha, usi masle ka seedha hal.
 *
 * SECURITY NOTE (Prokerala credentials wala usool yahan bhi): asal
 * DATABASE_URL sirf .env se aata hai, kabhi is file mein hardcode nahi
 * hua, na Claude ne kabhi asal value dekhi/type ki hai.
 */

'use strict';

const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase apna khud ka SSL certificate use karta hai jo Node ki
      // default trusted-CA list mein nahi hota — is liye rejectUnauthorized
      // false karna zaroori hai (khud Supabase ki documentation mein bhi
      // yahi tareeqa bataya gaya hai).
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

/**
 * isDbConfigured — agar .env mein DATABASE_URL nahi hai to poora "save
 * profile" feature khamoshi se disable ho jata hai (error nahi deta), taake
 * jo log abhi tak sirf Prokerala credentials se local test kar rahe hain
 * unka purana kaam bhi chalta rahe.
 */
function isDbConfigured() {
  return !!process.env.DATABASE_URL;
}

async function ensureSchema() {
  const p = getPool();
  if (!p) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id SERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      name TEXT NOT NULL,
      dob TEXT NOT NULL,
      time TEXT NOT NULL,
      lat TEXT NOT NULL,
      lon TEXT NOT NULL,
      city_label TEXT,
      utc_offset TEXT,
      ayanamsa INTEGER NOT NULL DEFAULT 1,
      natal_cache JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await p.query(`CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);`);
}

/**
 * saveProfile — nayi profile record banata hai (natal_cache abhi khali,
 * pehli baar ka kundli-generate hone ke baad cacheNatalData() ise bharega).
 */
async function saveProfile({ phone, name, dob, time, lat, lon, cityLabel, utcOffset, ayanamsa }) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL configure nahi hai — .env dekhein.');
  const { rows } = await p.query(
    `INSERT INTO profiles (phone, name, dob, time, lat, lon, city_label, utc_offset, ayanamsa)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, phone, name, dob, time, lat, lon, city_label, utc_offset, ayanamsa, created_at`,
    [phone, name, dob, time, lat, lon, cityLabel || null, utcOffset || null, ayanamsa || 1]
  );
  return rows[0];
}

async function listProfilesByPhone(phone) {
  const p = getPool();
  if (!p) return [];
  const { rows } = await p.query(
    `SELECT id, name, dob, time, lat, lon, city_label, utc_offset, ayanamsa, created_at
     FROM profiles WHERE phone = $1 ORDER BY created_at DESC LIMIT 50`,
    [phone]
  );
  return rows;
}

async function getProfileById(id) {
  const p = getPool();
  if (!p) return null;
  const { rows } = await p.query(`SELECT * FROM profiles WHERE id = $1`, [id]);
  return rows[0] || null;
}

/**
 * cacheNatalData — un 5 raw Prokerala responses ko save karta hai jo kisi
 * bhi shakhs ke liye HAMESHA same rehte hain (birth-based, waqt ke sath
 * nahi badalte): kundliAdvanced, natalPlanetPosition, kaalSarp,
 * ashtakavarga, aur birthPanchang. Sade Sati aur gochar (planet-position
 * current) aur "aaj ka panchang" is cache mein NAHI aate — wo har baar
 * naye sirey se Prokerala se lene zaroori hain.
 */
async function cacheNatalData(id, natalCache) {
  const p = getPool();
  if (!p) return;
  await p.query(`UPDATE profiles SET natal_cache = $2 WHERE id = $1`, [id, JSON.stringify(natalCache)]);
}

module.exports = {
  isDbConfigured,
  ensureSchema,
  saveProfile,
  listProfilesByPhone,
  getProfileById,
  cacheNatalData,
};
