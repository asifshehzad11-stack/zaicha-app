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

  // ---- Step 2: asal accounts (email/password) — is se pehle "saved
  // kundliyan" sirf phone number se milti thi (koi bhi kisi ka phone
  // number type kar ke uski kundli dekh sakta tha). Ab jo user login
  // karega uski kundliyan sirf usi ke account (user_id) se judi hongi. ----
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Purani "profiles" table mein user_id column add karte hain (nullable —
  // taake bina-login save ki hui purani/phone-based profiles bhi kaam
  // karti rahein), aur phone ko optional bana dete hain (logged-in user
  // phone diye bagair bhi save kar sake).
  await p.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);`);
  await p.query(`ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;`);
  await p.query(`CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);`);

  // ---- Subscription/premium (paid features: hafta-war calendar, monthly/
  // yearly outlook, ashtakavarga, aage chal kar kundli-matching) ----
  // `premium_until` NULL ya guzra hua waqt = free user. Jab bhi koi payment
  // "completed" ho, is column ko aagay badha dete hain (agar user pehle se
  // bhi premium hai to naye plan ka time us ki maujooda expiry ke UPAR jorte
  // hain, na ke abhi se — taake jaldi renew karne wale ka baaqi waqt zaya na
  // ho).
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;`);

  // Har payment attempt (Safepay checkout session) ka record — order_id
  // hamara apna banaya hua unique reference hai jo checkout session banate
  // waqt Safepay ko diya jata hai aur webhook wapas isi ke sath aata hai, is
  // liye is se hi asal payment ko dobara dhoond kar match karte hain.
  await p.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      plan_code TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PKR',
      order_id TEXT NOT NULL UNIQUE,
      gateway TEXT NOT NULL DEFAULT 'safepay',
      status TEXT NOT NULL DEFAULT 'pending',
      gateway_reference TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await p.query(`CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);`);

  // ---- Roz-ba-roz calendar (forward-looking daily transit) — ye data
  // kisi EK user ki nahi, balke us TAAREEKH (aur ayanamsa) ki hai, is liye
  // sab users ke darmiyan SHARE hoti hai. Ek dafa koi bhi user kisi din ka
  // data maang le, to wo hamesha ke liye yahan cache ho jata hai (kyunke
  // guzray/tay-shuda din ka gochar kabhi nahi badalta) — is se poori app
  // ke liye is feature ka Prokerala cost din mein ek dafa (per naya din)
  // reh jata hai, har user ke liye alag se nahi.
  await p.query(`
    CREATE TABLE IF NOT EXISTS daily_transits (
      transit_date DATE NOT NULL,
      ayanamsa INTEGER NOT NULL DEFAULT 1,
      raw_data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (transit_date, ayanamsa)
    );
  `);
}

/**
 * saveProfile — nayi profile record banata hai (natal_cache abhi khali,
 * pehli baar ka kundli-generate hone ke baad cacheNatalData() ise bharega).
 */
async function saveProfile({ phone, name, dob, time, lat, lon, cityLabel, utcOffset, ayanamsa, userId }) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL configure nahi hai — .env dekhein.');
  const { rows } = await p.query(
    `INSERT INTO profiles (phone, name, dob, time, lat, lon, city_label, utc_offset, ayanamsa, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id, phone, name, dob, time, lat, lon, city_label, utc_offset, ayanamsa, user_id, created_at`,
    [phone || null, name, dob, time, lat, lon, cityLabel || null, utcOffset || null, ayanamsa || 1, userId || null]
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

/**
 * listProfilesByUserId — logged-in account ki apni saved kundliyan (Step 2
 * ka asal fayda: ab kisi aur ka phone number type kar ke uski kundli nahi
 * dekhi ja sakti, sirf apna account hi apni list dekh sakta hai).
 */
async function listProfilesByUserId(userId) {
  const p = getPool();
  if (!p) return [];
  const { rows } = await p.query(
    `SELECT id, name, dob, time, lat, lon, city_label, utc_offset, ayanamsa, created_at
     FROM profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
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

/**
 * ---- Users (Step 2: asal accounts) ----
 * email hamesha lowercase/trimmed save hota hai taake "Ali@x.com" aur
 * "ali@x.com" do alag account na ban jayein.
 */
async function createUser({ email, passwordHash, name }) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL configure nahi hai — .env dekhein.');
  const { rows } = await p.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1,$2,$3)
     RETURNING id, email, name, created_at`,
    [email, passwordHash, name || null]
  );
  return rows[0];
}

async function getUserByEmail(email) {
  const p = getPool();
  if (!p) return null;
  const { rows } = await p.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return rows[0] || null;
}

async function getUserById(id) {
  const p = getPool();
  if (!p) return null;
  const { rows } = await p.query(`SELECT id, email, name, created_at FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

/**
 * ---- Roz-ba-roz calendar ki SHARED cache (sab users ke darmiyan common) ----
 */
async function getCachedDailyTransit(dateStr, ayanamsa) {
  const p = getPool();
  if (!p) return null;
  const { rows } = await p.query(
    `SELECT raw_data FROM daily_transits WHERE transit_date = $1 AND ayanamsa = $2`,
    [dateStr, ayanamsa]
  );
  return rows[0] ? rows[0].raw_data : null;
}

async function saveCachedDailyTransit(dateStr, ayanamsa, rawData) {
  const p = getPool();
  if (!p) return;
  // ON CONFLICT DO NOTHING — guzray din ka gochar kabhi nahi badalta, is
  // liye agar (race condition mein) do users ne ek sath yehi din maanga
  // ho to jo pehle likh de wahi hamesha rahega, dono ka data waisay bhi
  // ek jaisa hoga.
  await p.query(
    `INSERT INTO daily_transits (transit_date, ayanamsa, raw_data)
     VALUES ($1, $2, $3)
     ON CONFLICT (transit_date, ayanamsa) DO NOTHING`,
    [dateStr, ayanamsa, JSON.stringify(rawData)]
  );
}

/**
 * ---- Subscription/premium ----
 * isPremiumActive — sirf ek jagah ye check karta hai (naya Date() se
 * compare) taake server.js aur is file mein alag alag jagah "abhi premium
 * hai ya nahi" ka hisaab do tareeqon se na lage.
 */
function isPremiumActive(premiumUntil) {
  return !!premiumUntil && new Date(premiumUntil).getTime() > Date.now();
}

async function getUserPremiumStatus(userId) {
  const p = getPool();
  if (!p) return { isPremium: false, premiumUntil: null };
  const { rows } = await p.query(`SELECT premium_until FROM users WHERE id = $1`, [userId]);
  const premiumUntil = rows[0] ? rows[0].premium_until : null;
  return { isPremium: isPremiumActive(premiumUntil), premiumUntil };
}

async function createPendingPayment({ userId, planCode, amount, currency, orderId }) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL configure nahi hai — .env dekhein.');
  const { rows } = await p.query(
    `INSERT INTO payments (user_id, plan_code, amount, currency, order_id, status)
     VALUES ($1,$2,$3,$4,$5,'pending')
     RETURNING id, order_id, status`,
    [userId, planCode, amount, currency, orderId]
  );
  return rows[0];
}

async function getPaymentByOrderId(orderId) {
  const p = getPool();
  if (!p) return null;
  const { rows } = await p.query(`SELECT * FROM payments WHERE order_id = $1`, [orderId]);
  return rows[0] || null;
}

/**
 * markPaymentCompleted — Safepay webhook ke confirm karne par chalta hai.
 * Ek hi payment do dafa "completed" na ho jaye (jaise webhook kabhi dobara
 * bhej diya jaye) is liye pehle status check karte hain — agar pehle se hi
 * completed hai to premium_until dobara aagay nahi badhate.
 */
async function markPaymentCompleted(orderId, gatewayReference, extendDays) {
  const p = getPool();
  if (!p) return null;
  const payment = await getPaymentByOrderId(orderId);
  if (!payment) return null;
  if (payment.status === 'completed') return payment; // idempotent — dobara na badhaya jaye

  await p.query(
    `UPDATE payments SET status = 'completed', gateway_reference = $2, updated_at = now() WHERE order_id = $1`,
    [orderId, gatewayReference || null]
  );

  // Naye plan ka waqt maujooda expiry (agar abhi bhi active hai) ke UPAR
  // jorte hain, warna aaj se shuru karte hain.
  const { rows } = await p.query(`SELECT premium_until FROM users WHERE id = $1`, [payment.user_id]);
  const currentUntil = rows[0] ? rows[0].premium_until : null;
  const base = isPremiumActive(currentUntil) ? new Date(currentUntil) : new Date();
  const newUntil = new Date(base.getTime() + extendDays * 24 * 60 * 60 * 1000);
  await p.query(`UPDATE users SET premium_until = $2 WHERE id = $1`, [payment.user_id, newUntil.toISOString()]);
  return { ...payment, status: 'completed', premiumUntil: newUntil };
}

async function markPaymentFailed(orderId) {
  const p = getPool();
  if (!p) return;
  await p.query(`UPDATE payments SET status = 'failed', updated_at = now() WHERE order_id = $1 AND status = 'pending'`, [orderId]);
}

module.exports = {
  isDbConfigured,
  ensureSchema,
  saveProfile,
  listProfilesByPhone,
  listProfilesByUserId,
  getProfileById,
  cacheNatalData,
  createUser,
  getUserByEmail,
  getUserById,
  getCachedDailyTransit,
  saveCachedDailyTransit,
  isPremiumActive,
  getUserPremiumStatus,
  createPendingPayment,
  getPaymentByOrderId,
  markPaymentCompleted,
  markPaymentFailed,
};
