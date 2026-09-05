/**
 * Prokerala API Client
 * =====================
 * SECURITY NOTE (important, please read):
 * Ye file sirf process.env.PROKERALA_CLIENT_ID aur
 * process.env.PROKERALA_CLIENT_SECRET PADHTI hai — in values ko yahan
 * kabhi hardcode NAHI kiya gaya, aur na hi Claude ne kabhi ye asal values
 * dekhi/type ki hain. Ye .env file se aati hain, jo sirf Asif ke apne
 * computer par, sirf Asif ke apne haathon se bhari jayegi (.env.example
 * dekhein). Ye .gitignore mein bhi hai taake galti se kahin commit na ho.
 */

'use strict';

const TOKEN_URL = 'https://api.prokerala.com/token';
const BASE_URL = 'https://api.prokerala.com/v2/astrology';

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  const clientId = process.env.PROKERALA_CLIENT_ID;
  const clientSecret = process.env.PROKERALA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'PROKERALA_CLIENT_ID / PROKERALA_CLIENT_SECRET .env file mein nahi milay. ' +
      '.env.example ko .env mein copy karein aur apni asal Prokerala credentials khud bharein.'
    );
  }

  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 30000) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Prokerala token request failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  cachedToken = json.access_token;
  cachedTokenExpiry = now + (json.expires_in ? json.expires_in * 1000 : 3600 * 1000);
  return cachedToken;
}

async function callEndpoint(path, queryParams) {
  const token = await getAccessToken();
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Prokerala ${path} failed: ${res.status} ${text}`);
  }

  return res.json();
}

/**
 * datetime: ISO8601 string, e.g. "1994-03-14T06:45:00+05:00"
 * coordinates: "lat,long" string, e.g. "31.5204,74.3587"
 * ayanamsa: number, e.g. 1 for Lahiri
 */
function buildParams({ datetime, coordinates, ayanamsa }) {
  return { datetime, coordinates, ayanamsa: String(ayanamsa) };
}

async function getKundliAdvanced(person) {
  return callEndpoint('/kundli/advanced', buildParams(person));
}

async function getPlanetPosition(person) {
  return callEndpoint('/planet-position', buildParams(person));
}

async function getSadeSati(person) {
  return callEndpoint('/sade-sati', buildParams(person));
}

async function getKaalSarpDosha(person) {
  return callEndpoint('/kaal-sarp-dosha', buildParams(person));
}

/**
 * Panchang (tithi/nakshatra/yoga/karana waghera) — endpoint aur required
 * params (ayanamsa, coordinates, datetime) Prokerala ki public OpenAPI spec
 * (https://api.prokerala.com/spec/astrology.v2.yaml) se confirm kiye gaye
 * hain, is liye ye doosre working endpoints (sade-sati waghera) jitna hi
 * bharosemand hona chahiye.
 */
async function getPanchang(person) {
  return callEndpoint('/panchang', buildParams(person));
}

/**
 * Ashtakavarga/Sarvashtakavarga — IMPORTANT: iska asal endpoint naam aur
 * parameters Prokerala ki publicly milne wali documentation se confirm
 * NAHI ho sakay (unki poori API docs ek JavaScript app ke peeche hain jo
 * yahan se render nahi ho saki, aur jo public OpenAPI spec file mili usmein
 * ye endpoint shamil nahi tha). Isi wajah se pehle bhi ye 400 error de chuka
 * hai. Ye function isi liye defensively kai candidate paths try karta hai —
 * bilkul usi tarah jaise astro-engine.findCurrentDasha() candidate field
 * names try karta hai. Jab real credentials se live test hoga, jo bhi path
 * kaam kare wo /api/debug/kundli-raw jaisay ek chhote debug route se confirm
 * kar ke yahan permanent kiya ja sakta hai.
 */
async function getSarvashtakavargaBestEffort(person) {
  const candidatePaths = ['/sarvashtakavarga', '/ashtakavarga', '/sarvashtakavarga-chart'];
  const attempts = [];
  for (const path of candidatePaths) {
    try {
      const data = await callEndpoint(path, buildParams(person));
      return { path, data };
    } catch (err) {
      attempts.push(`${path} -> ${err.message}`);
    }
  }
  // Har candidate ki alag alag error message ek sath jama kar ke throw kar
  // rahe hain, taake Render ke logs mein poori tafseel dikhe (na ke sirf
  // aakhri wali error) — is se live debugging bohat aasan ho jati hai.
  throw new Error(`Sarvashtakavarga: koi candidate path kaam nahi aaya.\n${attempts.join('\n')}`);
}

module.exports = {
  getAccessToken,
  getKundliAdvanced,
  getPlanetPosition,
  getSadeSati,
  getKaalSarpDosha,
  getPanchang,
  getSarvashtakavargaBestEffort,
};
