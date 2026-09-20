/**
 * Zaicha Yoga Detection Engine — Multi-language (EN/UR/HI)
 * ==========================================================
 * Ye module kundli mein classical Vedic "Yogas" (khaas grahon ke
 * combinations, jinhein Brihat Parashara Hora Shastra jaisi qadeem
 * (classical) kitabon mein bayan kiya gaya hai) automatically detect karta
 * hai — jaise Gajakesari Yoga, Raja Yoga, Panch Mahapurusha Yoga waghera.
 *
 * IMPORTANT (imandaari se): ye saare yogas AAM/classical Vedic astrology
 * ka hissa hain — kisi khaas software ya company ki milkiyat nahi. Har
 * formula neeche apne comment mein wazeh (clear) kiya gaya hai taake
 * traceability rahe (AKSRA ke usool ke mutabiq — "assumption ko fact na
 * banayein"). Jahan classical texts mein tafseel mein ikhtilaf (variation)
 * paya jata hai (jaise Neecha Bhanga Raja Yoga ke kai versions hain), wahan
 * sab se zyada aam/mustanad (widely-accepted) simplified version istemal
 * ki gayi hai — mustaqbil mein AKSRA research se aur behtar/mukammal kiya
 * ja sakta hai.
 *
 * Data ye leta hai jo lib/astro-engine.js ki buildZaichaData() se pehle se
 * ban chuka hota hai — koi nai Prokerala/VedAstro call nahi lagti, is liye
 * ye bilkul FREE hai (na extra API cost, na extra load time).
 *
 * Multi-language: buildYogas(data, lang) ab har yoga ka title/description/
 * cause request ki language (en/ur/hi — hi abhi en fallback) mein deta hai.
 * normLang/planetLabel narrative.js se reuse hote hain taake poori app mein
 * ek hi jagah se lang-normalization aaye.
 */

'use strict';

const { SIGN_LORDS, planetDignity, houseFromReference } = require('./astro-engine');
const { ASPECT_OFFSETS, normLang, planetLabel, ordinal } = require('./narrative');

// English ordinal ("1st"/"4th"/...) for house numbers in English/Hindi text;
// Urdu doesn't need this (ویں already works for any number), so Urdu templates
// keep using the raw number directly.
function houseOrdinal(n, lang) {
  return lang === 'ur' ? n : ordinal(n, lang);
}

const NATURAL_BENEFICS = ['Jupiter', 'Venus', 'Mercury', 'Moon'];

const KENDRA_HOUSES = [1, 4, 7, 10];
const TRIKONA_HOUSES = [1, 5, 9];

/**
 * houseOfPlanet — Lagna se gin kar planet kis ghar mein baitha hai.
 */
function houseOfPlanet(natalMap, ascendantRasiId, planet) {
  if (!natalMap[planet]) return null;
  return houseFromReference(natalMap[planet].rasiId, ascendantRasiId);
}

/**
 * lordOfHouseFromLagna — Lagna se gin kar Nth ghar ka hakim (ruling
 * planet) kaun hai.
 */
function lordOfHouseFromLagna(ascendantRasiId, houseNum) {
  const signId = (ascendantRasiId + (houseNum - 1)) % 12;
  return SIGN_LORDS[signId];
}

/**
 * aspectedHousesOf — classical Parashari "khaas nazar" (special drishti)
 * ke mutabiq, ye planet apni jagah se kaun kaun se ghar (Lagna se ginte
 * hue) dekh raha hai — wahi ASPECT_OFFSETS jo transit-predictions (
 * narrative.js) mein bhi istemal hoti hai, taake poori app mein ek hi
 * hisaab rahe.
 */
function aspectedHousesOf(natalMap, ascendantRasiId, planet) {
  const ownHouse = houseOfPlanet(natalMap, ascendantRasiId, planet);
  if (!ownHouse) return [];
  const offsets = ASPECT_OFFSETS[planet] || [6];
  return offsets.map((o) => ((ownHouse - 1 + o) % 12) + 1);
}

function isConjunct(natalMap, planetA, planetB) {
  if (!natalMap[planetA] || !natalMap[planetB]) return false;
  return natalMap[planetA].rasiId === natalMap[planetB].rasiId;
}

// ---------------------------------------------------------------------------
// Yoga titles — {ur, en} pairs (hi falls back to en).
// ---------------------------------------------------------------------------
const TITLES = {
  gajakesari: { ur: 'گج کیسری یوگ', en: 'Gajakesari Yoga' },
  chandra_mangal: { ur: 'چاند-مریخ یوگ', en: 'Chandra-Mangal Yoga' },
  budhaditya: { ur: 'بدھادتیہ یوگ', en: 'Budhaditya Yoga' },
  raja: { ur: 'راجہ یوگ', en: 'Raja Yoga' },
  dhana: { ur: 'دھن یوگ', en: 'Dhana Yoga' },
  saraswati: { ur: 'سرسوتی یوگ', en: 'Saraswati Yoga' },
  adhi: { ur: 'آدھی یوگ', en: 'Adhi Yoga' },
  neecha_bhanga: { ur: 'نیچ بھنگ راجہ یوگ', en: 'Neecha Bhanga Raja Yoga' },
  kemadruma: { ur: 'کیمدرم دوش', en: 'Kemadruma Dosha' },
};
function title(key, lang) {
  const t = TITLES[key];
  return lang === 'ur' ? t.ur : t.en;
}

/**
 * ---- 1. Gajakesari Yoga ----
 * Classical shart: Mushtari (Jupiter), Chand (Moon) se Kendra (1,4,7,10)
 * mein ho. Asar: shohrat, aql-o-danish, khushhali.
 */
function checkGajakesari(natalMap, ascendantRasiId, lang) {
  if (!natalMap.Moon || !natalMap.Jupiter) return null;
  const houseFromMoon = houseFromReference(natalMap.Jupiter.rasiId, natalMap.Moon.rasiId);
  if (!KENDRA_HOUSES.includes(houseFromMoon)) return null;
  return {
    key: 'gajakesari',
    title: title('gajakesari', lang),
    benefic: true,
    description: lang === 'ur'
      ? 'مشتری آپ کے چاند سے کیندر (پہلے، چوتھے، ساتویں یا دسویں گھر) میں ہے — یہ گج کیسری یوگ بناتا ہے، جو شہرت، عقل و دانش اور خوشحالی کی علامت سمجھا جاتا ہے۔'
      : 'Jupiter is in a Kendra (1st, 4th, 7th or 10th house) from your Moon — this forms Gajakesari Yoga, considered a sign of fame, wisdom and prosperity.',
    cause: lang === 'ur' ? 'مشتری، چاند سے کیندر میں ہے۔' : 'Jupiter is in a Kendra house from the Moon.',
  };
}

/**
 * ---- 2. Chandra-Mangal Yoga ----
 * Classical shart: Chand aur Mangal (Moon-Mars) ek hi raashi mein saath
 * hon (conjunction). Asar: maali soojh-boojh, dolat kamane ki salahiyat.
 */
function checkChandraMangal(natalMap, lang) {
  if (!isConjunct(natalMap, 'Moon', 'Mars')) return null;
  return {
    key: 'chandra_mangal',
    title: title('chandra_mangal', lang),
    benefic: true,
    description: lang === 'ur'
      ? 'آپ کی کنڈلی میں چاند اور مریخ ایک ہی راشی میں اکٹھے ہیں — یہ چاند-مریخ یوگ ہے، جو مالی سوجھ بوجھ اور دولت کمانے کی صلاحیت سے جوڑا جاتا ہے۔'
      : 'In your chart, the Moon and Mars are together in the same sign — this is Chandra-Mangal Yoga, associated with financial acumen and the ability to earn wealth.',
    cause: lang === 'ur' ? 'چاند اور مریخ ایک ہی راشی میں ہیں۔' : 'The Moon and Mars are in the same sign.',
  };
}

/**
 * ---- 3. Budhaditya Yoga ----
 * Classical shart: Suraj aur Atarad (Sun-Mercury) ek hi raashi mein saath
 * hon. Asar: zehanat, achi guftagu/communication ki salahiyat.
 */
function checkBudhaditya(natalMap, lang) {
  if (!isConjunct(natalMap, 'Sun', 'Mercury')) return null;
  return {
    key: 'budhaditya',
    title: title('budhaditya', lang),
    benefic: true,
    description: lang === 'ur'
      ? 'سورج اور عطارد ایک ہی راشی میں اکٹھے ہیں — یہ بدھادتیہ یوگ بناتا ہے، جو ذہانت اور اچھی گفتگو/ابلاغ کی صلاحیت کی علامت سمجھا جاتا ہے۔'
      : 'The Sun and Mercury are together in the same sign — this forms Budhaditya Yoga, considered a sign of intelligence and strong communication ability.',
    cause: lang === 'ur' ? 'سورج اور عطارد ایک ہی راشی میں ہیں۔' : 'The Sun and Mercury are in the same sign.',
  };
}

/**
 * ---- 4. Panch Mahapurusha Yogas (5 "azeem shakhsiyat" yogas) ----
 * Classical shart: Mangal/Atarad/Mushtari/Zohra/Zohal apni UCH (exalted)
 * ya apni KHUD KI raashi (own sign) mein ho, AUR Lagna se Kendra
 * (1,4,7,10) mein baitha ho.
 */
const MAHAPURUSHA_DEFS = {
  Mars: { key: 'ruchaka', ur: 'رچک یوگ', en: 'Ruchaka Yoga' },
  Mercury: { key: 'bhadra', ur: 'بھدر یوگ', en: 'Bhadra Yoga' },
  Jupiter: { key: 'hamsa', ur: 'ہنس یوگ', en: 'Hamsa Yoga' },
  Venus: { key: 'malavya', ur: 'مالویہ یوگ', en: 'Malavya Yoga' },
  Saturn: { key: 'sasa', ur: 'ساسا یوگ', en: 'Sasa Yoga' },
};
function checkPanchMahapurusha(natalMap, ascendantRasiId, lang) {
  const results = [];
  for (const planet of Object.keys(MAHAPURUSHA_DEFS)) {
    if (!natalMap[planet]) continue;
    const dignity = planetDignity(planet, natalMap[planet].rasiId);
    if (dignity !== 'exalted' && dignity !== 'own') continue;
    const house = houseOfPlanet(natalMap, ascendantRasiId, planet);
    if (!KENDRA_HOUSES.includes(house)) continue;
    const def = MAHAPURUSHA_DEFS[planet];
    const t = lang === 'ur' ? def.ur : def.en;
    const label = planetLabel(planet, lang);
    results.push({
      key: def.key,
      title: t,
      benefic: true,
      description: lang === 'ur'
        ? `${label} اپنی ${dignity === 'exalted' ? 'اعلیٰ (exalted)' : 'اپنی خود کی'} راشی میں کیندر گھر میں بیٹھا ہے — یہ پنچ مہاپرش یوگوں میں سے ایک "${t}" بناتا ہے، جو مضبوط شخصیت، قیادت کی صلاحیت اور کامیابی کی علامت سمجھا جاتا ہے۔`
        : `${label} is in a Kendra house in its ${dignity === 'exalted' ? 'exalted' : 'own'} sign — this forms "${t}", one of the Panch Mahapurusha Yogas, considered a sign of a strong personality, leadership ability and success.`,
      cause: lang === 'ur'
        ? `${label} ${dignity === 'exalted' ? 'اعلیٰ' : 'اپنی'} راشی میں، کیندر گھر ${house} میں ہے۔`
        : `${label} is in its ${dignity === 'exalted' ? 'exalted' : 'own'} sign, in Kendra house ${house}.`,
    });
  }
  return results;
}

/**
 * ---- 5. Raja Yoga (Kendra-Trikona lord connection) ----
 * Classical shart: kisi Kendra ghar (1,4,7,10) ka hakim aur kisi Trikona
 * ghar (1,5,9) ka hakim — agar do alag grahas hon aur ek hi raashi mein
 * saath baithe hon (conjunction) — to Raja Yoga banta hai. Ye Raja Yoga ki
 * sab se ziyada rائج (widely-cited) classical shakal hai.
 */
function checkRajaYogas(natalMap, ascendantRasiId, lang) {
  const seenPairs = new Set();
  const results = [];
  for (const k of KENDRA_HOUSES) {
    for (const t of TRIKONA_HOUSES) {
      if (k === t) continue;
      const lordK = lordOfHouseFromLagna(ascendantRasiId, k);
      const lordT = lordOfHouseFromLagna(ascendantRasiId, t);
      if (lordK === lordT) continue;
      if (!natalMap[lordK] || !natalMap[lordT]) continue;
      if (!isConjunct(natalMap, lordK, lordT)) continue;
      const pairKey = [lordK, lordT].sort().join('-');
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      const labelK = planetLabel(lordK, lang);
      const labelT = planetLabel(lordT, lang);
      results.push({
        key: `raja_${pairKey.toLowerCase()}`,
        title: title('raja', lang),
        benefic: true,
        description: lang === 'ur'
          ? `${k}ویں گھر کے حاکم (${labelK}) اور ${t}ویں گھر کے حاکم (${labelT}) ایک ہی راشی میں اکٹھے ہیں — یہ کیندر-ترِکون راجہ یوگ بناتا ہے، جو عزت، اقتدار اور بلندی کی علامت سمجھا جاتا ہے۔`
          : `The lord of the ${houseOrdinal(k, lang)} house (${labelK}) and the lord of the ${houseOrdinal(t, lang)} house (${labelT}) are together in the same sign — this forms a Kendra-Trikona Raja Yoga, considered a sign of honor, power and elevation.`,
        cause: lang === 'ur'
          ? `${k}ویں گھر کا حاکم اور ${t}ویں گھر کا حاکم ایک ہی راشی میں ہیں۔`
          : `The lord of the ${houseOrdinal(k, lang)} house and the lord of the ${houseOrdinal(t, lang)} house are in the same sign.`,
      });
    }
  }
  return results;
}

/**
 * ---- 6. Dhana Yoga (maali khushhali) ----
 * Classical shart: 2ری ghar (dolat) aur 11wan ghar (aamdani) ke hakim
 * ek hi raashi mein saath hon.
 */
function checkDhanaYoga(natalMap, ascendantRasiId, lang) {
  const lord2 = lordOfHouseFromLagna(ascendantRasiId, 2);
  const lord11 = lordOfHouseFromLagna(ascendantRasiId, 11);
  if (lord2 === lord11) return null;
  if (!natalMap[lord2] || !natalMap[lord11]) return null;
  if (!isConjunct(natalMap, lord2, lord11)) return null;
  const label2 = planetLabel(lord2, lang);
  const label11 = planetLabel(lord11, lang);
  return {
    key: 'dhana',
    title: title('dhana', lang),
    benefic: true,
    description: lang === 'ur'
      ? `دوسرے گھر (دولت) کے حاکم (${label2}) اور گیارہویں گھر (آمدنی) کے حاکم (${label11}) ایک ہی راشی میں اکٹھے ہیں — یہ دھن یوگ بناتا ہے، جو مالی خوشحالی کی علامت سمجھا جاتا ہے۔`
      : `The lord of the 2nd house (wealth), ${label2}, and the lord of the 11th house (income), ${label11}, are together in the same sign — this forms Dhana Yoga, considered a sign of financial prosperity.`,
    cause: lang === 'ur'
      ? 'دوسرے اور گیارہویں گھر کے حاکم ایک ہی راشی میں ہیں۔'
      : 'The lords of the 2nd and 11th houses are in the same sign.',
  };
}

/**
 * ---- 7. Saraswati Yoga ----
 * Classical shart: Mushtari, Zohra aur Atarad teeno Kendra (1,4,7,10),
 * Trikona (1,5,9) ya doosray ghar mein hon, aur Mushtari kamzor (debilitated)
 * na ho. Asar: ilm, hikmat aur fun mein mahaarat.
 */
function checkSaraswati(natalMap, ascendantRasiId, lang) {
  const requiredPlanets = ['Jupiter', 'Venus', 'Mercury'];
  if (!requiredPlanets.every((p) => natalMap[p])) return null;
  const validHouses = [1, 2, 4, 5, 7, 9, 10];
  const allPlaced = requiredPlanets.every((p) => validHouses.includes(houseOfPlanet(natalMap, ascendantRasiId, p)));
  if (!allPlaced) return null;
  if (planetDignity('Jupiter', natalMap.Jupiter.rasiId) === 'debilitated') return null;
  return {
    key: 'saraswati',
    title: title('saraswati', lang),
    benefic: true,
    description: lang === 'ur'
      ? 'مشتری، زہرہ اور عطارد تینوں کیندر/ترِکون یا دوسرے گھر میں ہیں، اور مشتری کمزور نہیں ہے — یہ سرسوتی یوگ بناتا ہے، جو علم، حکمت اور فن میں مہارت کی علامت سمجھا جاتا ہے۔'
      : 'Jupiter, Venus and Mercury are all placed in Kendra/Trikona or the 2nd house, and Jupiter is not debilitated — this forms Saraswati Yoga, considered a sign of knowledge, wisdom and mastery in the arts.',
    cause: lang === 'ur'
      ? 'مشتری، زہرہ اور عطارد تینوں مضبوط گھروں میں ہیں۔'
      : 'Jupiter, Venus and Mercury are all in strong houses.',
  };
}

/**
 * ---- 8. Adhi Yoga ----
 * Classical shart: Chand se 6ویں, 7ویں aur 8ویں ghar mein "shubh" grahas
 * (Atarad/Zohra/Mushtari) mojood hon. Asar: qayadat (leadership), izzat.
 */
function checkAdhiYoga(natalMap, lang) {
  if (!natalMap.Moon) return null;
  const beneficsForAdhi = ['Mercury', 'Venus', 'Jupiter'];
  const targetHouses = [6, 7, 8];
  const covered = targetHouses.every((h) =>
    beneficsForAdhi.some((p) => natalMap[p] && houseFromReference(natalMap[p].rasiId, natalMap.Moon.rasiId) === h)
  );
  if (!covered) return null;
  return {
    key: 'adhi',
    title: title('adhi', lang),
    benefic: true,
    description: lang === 'ur'
      ? 'آپ کے چاند سے چھٹے، ساتویں اور آٹھویں گھر میں شبھ سیارے (عطارد، زہرہ، مشتری) موجود ہیں — یہ آدھی یوگ بناتا ہے، جو قیادت کی صلاحیت اور عزت کی علامت سمجھا جاتا ہے۔'
      : 'Benefic planets (Mercury, Venus, Jupiter) occupy the 6th, 7th and 8th houses from your Moon — this forms Adhi Yoga, considered a sign of leadership ability and honor.',
    cause: lang === 'ur'
      ? 'چاند سے 6, 7, 8 ویں گھروں میں شبھ سیارے موجود ہیں۔'
      : 'Benefic planets occupy the 6th, 7th and 8th houses from the Moon.',
  };
}

/**
 * ---- 9. Vipreet Raja Yoga (Harsha / Sarala / Vimala) ----
 * Classical shart: kisi "dusthana" ghar (6, 8, ya 12) ka hakim doosray
 * dusthana ghar mein baitha ho (apne khud ke ghar mein nahi) — ye
 * paradoxical tor par mushkilat ke bawajood tarraqi ki alamat samjha
 * jata hai.
 */
const VIPREET_DEFS = {
  6: { key: 'harsha', ur: 'ہرشا یوگ (وپریت راجہ)', en: 'Harsha Yoga (Vipreet Raja)' },
  8: { key: 'sarala', ur: 'سرلا یوگ (وپریت راجہ)', en: 'Sarala Yoga (Vipreet Raja)' },
  12: { key: 'vimala', ur: 'وِملا یوگ (وپریت راجہ)', en: 'Vimala Yoga (Vipreet Raja)' },
};
function checkVipreetRajaYogas(natalMap, ascendantRasiId, lang) {
  const dusthanas = [6, 8, 12];
  const results = [];
  for (const houseN of dusthanas) {
    const lord = lordOfHouseFromLagna(ascendantRasiId, houseN);
    if (!natalMap[lord]) continue;
    const lordHouse = houseOfPlanet(natalMap, ascendantRasiId, lord);
    const otherDusthanas = dusthanas.filter((h) => h !== houseN);
    if (!otherDusthanas.includes(lordHouse)) continue;
    const def = VIPREET_DEFS[houseN];
    const t = lang === 'ur' ? def.ur : def.en;
    const label = planetLabel(lord, lang);
    results.push({
      key: def.key,
      title: t,
      benefic: true,
      description: lang === 'ur'
        ? `${houseN}ویں گھر کا حاکم (${label}) ایک اور مشکل گھر (${lordHouse}) میں بیٹھا ہے — یہ "${t}" بناتا ہے، جو مشکلات کے باوجود غیرمتوقع ترقی کی علامت سمجھا جاتا ہے۔`
        : `The lord of the ${houseN}th house (${label}) sits in another difficult house (${lordHouse}) — this forms "${t}", considered a sign of unexpected progress despite difficulties.`,
      cause: lang === 'ur'
        ? `${houseN}ویں گھر کا حاکم، ${lordHouse}ویں گھر میں ہے۔`
        : `The lord of the ${houseN}th house is in the ${lordHouse}th house.`,
    });
  }
  return results;
}

/**
 * ---- 10. Neecha Bhanga Raja Yoga (kamzori ka khatma) ----
 * Classical shart (sab se aam simplified version): agar koi graha kamzor
 * (debilitated) ho, lekin uski kamzori wali raashi ka hakim khud Lagna ya
 * Chand se Kendra (1,4,7,10) mein baitha ho — to us kamzori ka "bhang"
 * (cancellation) ho jata hai, aur ye ulta Raja Yoga mein badal jata hai.
 */
function checkNeechaBhanga(natalMap, ascendantRasiId, lang) {
  const results = [];
  for (const planet of Object.keys(natalMap)) {
    if (planetDignity(planet, natalMap[planet].rasiId) !== 'debilitated') continue;
    const debilSignLord = SIGN_LORDS[natalMap[planet].rasiId];
    if (!natalMap[debilSignLord]) continue;
    const houseFromLagna = houseFromReference(natalMap[debilSignLord].rasiId, ascendantRasiId);
    const houseFromMoon = natalMap.Moon
      ? houseFromReference(natalMap[debilSignLord].rasiId, natalMap.Moon.rasiId)
      : null;
    if (!KENDRA_HOUSES.includes(houseFromLagna) && !KENDRA_HOUSES.includes(houseFromMoon)) continue;
    const planetLbl = planetLabel(planet, lang);
    const lordLbl = planetLabel(debilSignLord, lang);
    results.push({
      key: `neecha_bhanga_${planet.toLowerCase()}`,
      title: title('neecha_bhanga', lang),
      benefic: true,
      description: lang === 'ur'
        ? `${planetLbl} کمزور (نیچ) حالت میں ہے، لیکن اس راشی کا حاکم (${lordLbl}) خود لگن یا چاند سے کیندر میں بیٹھا ہے — اس لیے یہ کمزوری "بھنگ" (ختم) ہو جاتی ہے، بلکہ الٹا ایک نیچ بھنگ راجہ یوگ بن جاتا ہے، جو دیر سے ملنے والی مگر بڑی کامیابی کی علامت سمجھا جاتا ہے۔`
        : `${planetLbl} is in a weak (debilitated) state, but the lord of that sign (${lordLbl}) itself sits in a Kendra from the Ascendant or the Moon — so this weakness gets "cancelled", and instead turns into a Neecha Bhanga Raja Yoga, considered a sign of success that comes later but is significant.`,
      cause: lang === 'ur'
        ? `${planetLbl} نیچ کا حاکم، لگن/چاند سے کیندر میں ہے۔`
        : `The lord of ${planetLbl}'s debilitation sign is in a Kendra from the Ascendant/Moon.`,
    });
  }
  return results;
}

/**
 * ---- 11. Kemdrum Dosh (ek aam "kamzori" combination) ----
 * Classical shart: Chand se 2ری aur 12ویں ghar dono khaali hon (koi
 * graha na ho), AUR khud Chand ke sath bhi koi graha na baitha ho
 * (Suraj/Rahu/Ketu ke ilawa). Ye ek dosh hai (yoga nahi), lekin isay bhi
 * isi list mein "منفی" (negative) tag ke sath dikhaya jata hai, taake
 * user ko poori tasveer mile.
 */
function checkKemadruma(natalMap, lang) {
  if (!natalMap.Moon) return null;
  const moonRasi = natalMap.Moon.rasiId;
  const otherPlanets = Object.keys(natalMap).filter((p) => p !== 'Moon' && p !== 'Sun' && p !== 'Rahu' && p !== 'Ketu');
  const secondRasi = (moonRasi + 1) % 12;
  const twelfthRasi = (moonRasi + 11) % 12;
  const hasNeighbor = otherPlanets.some((p) => [secondRasi, twelfthRasi].includes(natalMap[p].rasiId));
  const hasConjunction = otherPlanets.some((p) => natalMap[p].rasiId === moonRasi);
  if (hasNeighbor || hasConjunction) return null;
  return {
    key: 'kemadruma',
    title: title('kemadruma', lang),
    benefic: false,
    description: lang === 'ur'
      ? 'چاند کے دونوں طرف (دوسرے اور بارہویں گھر، چاند سے گنتے ہوئے) اور خود چاند کے ساتھ بھی کوئی گرہ موجود نہیں — یہ کیمدرم دوش بناتا ہے، جو ذہنی بےچینی اور جدوجہد کے ادوار کی علامت سمجھا جاتا ہے۔ یاد رہے: کنڈلی کے دوسرے مضبوط پہلو اس دوش کے اثر کو کافی حد تک کم کر سکتے ہیں۔'
      : "There is no planet on either side of the Moon (the 2nd and 12th houses counted from the Moon) and none conjunct the Moon either — this forms Kemadruma Dosha, considered a sign of mental restlessness and periods of struggle. Keep in mind: other strong factors in the chart can significantly reduce this dosha's effect.",
    cause: lang === 'ur'
      ? 'چاند کے ساتھ، اور اس سے دوسرے/بارہویں گھر میں کوئی گرہ نہیں۔'
      : "No planet is conjunct the Moon, or in the 2nd/12th house from it.",
  };
}

/**
 * buildYogas — poori kundli (natalMap + ascendantRasiId) le kar sab
 * classical yogas check karta hai aur jo bhi maujood hon unki list deta
 * hai (title + plain-language description + "cause" har entry ke sath,
 * request ki language mein — 'lang' second parameter, default 'en').
 * Koi yoga na milay to khaali array wapas aata hai.
 */
function buildYogas(data, lang) {
  lang = normLang(lang);
  const natalMap = data.natal.planets;
  const ascendantRasiId = data.natal.ascendantRasiId;

  const results = [];
  const single = [
    checkGajakesari(natalMap, ascendantRasiId, lang),
    checkChandraMangal(natalMap, lang),
    checkBudhaditya(natalMap, lang),
    checkDhanaYoga(natalMap, ascendantRasiId, lang),
    checkSaraswati(natalMap, ascendantRasiId, lang),
    checkAdhiYoga(natalMap, lang),
    checkKemadruma(natalMap, lang),
  ];
  for (const r of single) if (r) results.push(r);

  results.push(...checkPanchMahapurusha(natalMap, ascendantRasiId, lang));
  results.push(...checkRajaYogas(natalMap, ascendantRasiId, lang));
  results.push(...checkVipreetRajaYogas(natalMap, ascendantRasiId, lang));
  results.push(...checkNeechaBhanga(natalMap, ascendantRasiId, lang));

  return results;
}

module.exports = {
  buildYogas,
};
