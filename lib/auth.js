/**
 * Auth layer — email/password se asal accounts (Step 2, jaisa Asif ne
 * mangwaya: pehle sirf UI/flow tha, ab yahan se real login/register hai).
 *
 * Tareeqa-e-kaar: password bcrypt se hash ho kar users table (lib/db.js)
 * mein save hota hai (kabhi plain-text nahi), aur login/register kamyaab
 * hone par ek JWT ek httpOnly cookie mein set kar dete hain — is se
 * browser JS is token ko chhoo bhi nahi sakta (XSS se mehfooz), aur har
 * request ke sath khud-b-khud bhej diya jata hai.
 *
 * SECURITY NOTE (Prokerala/DATABASE_URL wala usool yahan bhi): JWT_SECRET
 * sirf .env se aata hai — agar .env mein na diya jaye to ek dev-only
 * fallback secret use hota hai jo sirf local testing ke liye theek hai,
 * production mein zaroor apna JWT_SECRET .env mein set karein (warna
 * server restart hone par sab purane sessions bhi invalid ho jayenge, aur
 * agar koi is fallback string ko jaan le to session forge kar sakta hai).
 */

'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'zaicha-dev-only-insecure-secret-set-JWT_SECRET-in-env';
const COOKIE_NAME = 'zaicha_session';
const SESSION_DAYS = 30;

function isJwtSecretConfigured() {
  return !!process.env.JWT_SECRET;
}

// ---- SECURITY PASS (2026-10-04) ----------------------------------------
// The fallback secret above sits in a PUBLIC repository. If it were ever
// used on a live server, anyone who read the file could sign a cookie for
// any account. So on a live server we do not fall back at all: sessions are
// switched off entirely until JWT_SECRET is set, and a forged cookie is
// never even verified (readSession returns null before jwt.verify runs).
// Render sets RENDER=true on every service, so a missing NODE_ENV cannot
// quietly turn this protection off.
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
const SESSION_ENABLED = isJwtSecretConfigured() || !IS_PRODUCTION;

function isSessionEnabled() {
  return SESSION_ENABLED;
}

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

function signSessionToken(user) {
  if (!SESSION_ENABLED) throw new Error('JWT_SECRET is not set — sessions are disabled.');
  return jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
}

function verifySessionToken(token) {
  if (!SESSION_ENABLED) return null;   // never verify against the public fallback
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Same flags on set and clear — a cookie cleared with different options is
// not cleared at all in some browsers.
const COOKIE_OPTS = {
  httpOnly: true,                 // browser JS can never read it (XSS)
  sameSite: 'lax',
  secure: IS_PRODUCTION,          // on a live server it only travels over HTTPS
};

function setSessionCookie(res, user) {
  const token = signSessionToken(user);
  res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTS, maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTS);
}

/**
 * readSession — request ki cookie se session padhta hai (agar mojood aur
 * valid ho). Route handlers isay optional auth ke liye use kar sakte hain:
 * agar session mile to us user se jode gaye data ka istemal karein, agar
 * na mile to purana (bina-login) tareeqa chalta rahe — koi route is se
 * "block" nahi hoti, sirf behtar/mehfooz behavior milta hai jab user
 * logged in ho.
 */
function readSession(req) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

/* ======================================================================
   PATH B (2026-10-04) — the guest key.

   Login is skipped for now, so a saved chart cannot belong to an account.
   Instead it belongs to the BROWSER that made it: a random id kept in a
   signed, httpOnly cookie. The server stores that id on the row
   (profiles.owner_key) and will only hand a row back to a request that
   presents the same id.

   Signed with the same HMAC key as the session, so a tampered or
   hand-written cookie is rejected — and, exactly like sessions, the whole
   mechanism refuses to run on a live server without JWT_SECRET rather than
   fall back to the secret that sits in this public repo.
   ====================================================================== */
const GUEST_COOKIE = 'zaicha_guest';
const GUEST_DAYS = 365;

function guestSign(id) {
  return crypto.createHmac('sha256', JWT_SECRET).update('zaicha-guest-v1|' + id).digest('base64url');
}

function isGuestEnabled() {
  return SESSION_ENABLED;
}

/** readGuestKey — the id from the cookie, only if the signature matches. */
function readGuestKey(req) {
  if (!SESSION_ENABLED) return null;
  const raw = req.cookies && req.cookies[GUEST_COOKIE];
  if (!raw || typeof raw !== 'string') return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return null;
  const id = raw.slice(0, dot), sig = raw.slice(dot + 1);
  if (!/^[0-9a-f]{32}$/.test(id)) return null;
  const want = Buffer.from(guestSign(id));
  const got = Buffer.from(sig);
  if (want.length !== got.length) return null;
  return crypto.timingSafeEqual(want, got) ? id : null;
}

/**
 * ensureGuestKey — returns this browser's id, minting and setting one if it
 * has none. Only called where a chart is actually being saved, so a passer-by
 * who never generates anything is never given a cookie.
 */
function ensureGuestKey(req, res) {
  if (!SESSION_ENABLED) return null;
  const existing = readGuestKey(req);
  if (existing) return existing;
  const id = crypto.randomBytes(16).toString('hex');
  res.cookie(GUEST_COOKIE, id + '.' + guestSign(id), {
    ...COOKIE_OPTS,
    maxAge: GUEST_DAYS * 24 * 60 * 60 * 1000,
  });
  return id;
}

module.exports = {
  isJwtSecretConfigured,
  isSessionEnabled,
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  readSession,
  COOKIE_NAME,
  // PATH B
  isGuestEnabled,
  readGuestKey,
  ensureGuestKey,
  GUEST_COOKIE,
};
