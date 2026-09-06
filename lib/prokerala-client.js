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

// Roz-ba-roz calendar (aane wale dinon ka gochar) — planetary sign
// positions kisi bhi shakhs ki apni location par nahi (ye geocentric hain,
// har jagah se same dikhte hain), is liye ye call kisi EK PERSON ke liye
// nahi, balke ek fixed reference waqt/location ke sath hoti hai, aur uska
// result (server.js mein) SAB users ke darmiyan SHARE/cache hota hai — is
// se din ba din calendar har user ke liye alag se Prokerala credits nahi
// khaata, sirf ek dafa (poori app ke liye, us din ke liye) khaata hai.
const FORWARD_CALENDAR_REFERENCE_COORDINATES = '33.6844,73.0479'; // Islamabad
const FORWARD_CALENDAR_REFERENCE_TIME = '12:00:00+05:00'; // Pakistan dopeher — sirf ek neutral, mustaqil (fixed) reference waqt

async function getPlanetPositionForDate(dateStr, ayanamsa) {
  return callEndpoint('/planet-position', {
    datetime: `${dateStr}T${FORWARD_CALENDAR_REFERENCE_TIME}`,
    coordinates: FORWARD_CALENDAR_REFERENCE_COORDINATES,
    ayanamsa: String(ayanamsa),
  });
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
 * Ashtakavarga/Sarvashtakavarga — pehle ye function sirf alag alag candidate
 * PATHS try karta tha (400 error dete rehta tha), kyunke asal wajah path
 * nahi thi — asal wajah ye thi ke Prokerala is endpoint par ek REQUIRED
 * `planet` parameter maangta hai jo hum kabhi bhej hi nahi rahe thay.
 *
 * Ye confirm hua Prokerala ke apne live demo form
 * (https://api.prokerala.com/demo/ashtakavarga.php) ka DOM seedha inspect
 * karke — sirf docs padh kar guess nahi kiya gaya:
 *   - Wahi ek form/endpoint SAAT individual grahon (Sun=0 ... Saturn=6) aur
 *     mukammal "Sarvashtakavarga" (combined) dono ke liye istemal hota hai —
 *     farq sirf `planet` param ki value se aata hai.
 *   - Sarvashtakavarga (jo hamein chahiye — har khane ka combined bindu
 *     score) ke liye `planet` ki value literal string "sarvashtakavarga"
 *     hoti hai.
 *   - Baaqi fields (`datetime`, `coordinates` "lat,long", `ayanamsa`) wesay
 *     hi hain jo hum pehle se bhej rahe hain; `chart_style` sirf visual
 *     chart-image wale variant (*-chart) ke liye hai, is liye yahan bhi
 *     shamil kar dete hain taake agar wo bhi required nikla to already ja
 *     raha ho.
 *
 * Endpoint ka asal PATH (jaise /ashtakavarga vs /sarvashtakavarga) ab bhi
 * 100% confirm nahi (Prokerala ki poori reference docs ek JS app ke peeche
 * hain), is liye ab bhi candidate paths try karte hain — bas ab har
 * candidate ke sath sahi `planet` param bhi ja raha hai, jo 400 error ki
 * asal wajah thi.
 */
async function getSarvashtakavargaBestEffort(person) {
  const candidatePaths = ['/ashtakavarga', '/sarvashtakavarga', '/sarvashtakavarga-chart', '/ashtakavarga-chart'];
  const extraParams = { planet: 'sarvashtakavarga', chart_style: 'north-indian' };
  const attempts = [];
  for (const path of candidatePaths) {
    try {
      const data = await callEndpoint(path, { ...buildParams(person), ...extraParams });
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
  getPlanetPositionForDate,
  getSadeSati,
  getKaalSarpDosha,
  getPanchang,
  getSarvashtakavargaBestEffort,
};
