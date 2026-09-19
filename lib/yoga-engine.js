/**
 * Zaicha Yoga Detection Engine
 * =============================
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
 */

'use strict';

const { SIGN_LORDS, planetDignity, houseFromReference } = require('./astro-engine');
const { ASPECT_OFFSETS } = require('./narrative');

const NATURAL_BENEFICS = ['Jupiter', 'Venus', 'Mercury', 'Moon'];

const KENDRA_HOUSES = [1, 4, 7, 10];
const TRIKONA_HOUSES = [1, 5, 9];

const PLANET_NAME_UR = {
  Sun: 'سورج', Moon: 'چاند', Mars: 'مریخ', Mercury: 'عطارد', Jupiter: 'مشتری',
  Venus: 'زہرہ', Saturn: 'زحل', Rahu: 'راہو', Ketu: 'کیتو',
};

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

/**
 * ---- 1. Gajakesari Yoga ----
 * Classical shart: Mushtari (Jupiter), Chand (Moon) se Kendra (1,4,7,10)
 * mein ho. Asar: shohrat, aql-o-danish, khushhali.
 */
function checkGajakesari(natalMap, ascendantRasiId) {
  if (!natalMap.Moon || !natalMap.Jupiter) return null;
  const houseFromMoon = houseFromReference(natalMap.Jupiter.rasiId, natalMap.Moon.rasiId);
  if (!KENDRA_HOUSES.includes(houseFromMoon)) return null;
  return {
    key: 'gajakesari',
    title: 'گج کیسری یوگ',
    benefic: true,
    description: 'مشتری آپ کے چاند سے کیندر (پہلے، چوتھے، ساتویں یا دسویں گھر) میں ہے — یہ گج کیسری یوگ بناتا ہے، جو شہرت، عقل و دانش اور خوشحالی کی علامت سمجھا جاتا ہے۔',
    cause: 'مشتری، چاند سے کیندر میں ہے۔',
  };
}

/**
 * ---- 2. Chandra-Mangal Yoga ----
 * Classical shart: Chand aur Mangal (Moon-Mars) ek hi raashi mein saath
 * hon (conjunction). Asar: maali soojh-boojh, dolat kamane ki salahiyat.
 */
function checkChandraMangal(natalMap) {
  if (!isConjunct(natalMap, 'Moon', 'Mars')) return null;
  return {
    key: 'chandra_mangal',
    title: 'چاند-مریخ یوگ',
    benefic: true,
    description: 'آپ کی کنڈلی میں چاند اور مریخ ایک ہی راشی میں اکٹھے ہیں — یہ چاند-مریخ یوگ ہے، جو مالی سوجھ بوجھ اور دولت کمانے کی صلاحیت سے جوڑا جاتا ہے۔',
    cause: 'چاند اور مریخ ایک ہی راشی میں ہیں۔',
  };
}

/**
 * ---- 3. Budhaditya Yoga ----
 * Classical shart: Suraj aur Atarad (Sun-Mercury) ek hi raashi mein saath
 * hon. Asar: zehanat, achi guftagu/communication ki salahiyat.
 */
function checkBudhaditya(natalMap) {
  if (!isConjunct(natalMap, 'Sun', 'Mercury')) return null;
  return {
    key: 'budhaditya',
    title: 'بدھادتیہ یوگ',
    benefic: true,
    description: 'سورج اور عطارد ایک ہی راشی میں اکٹھے ہیں — یہ بدھادتیہ یوگ بناتا ہے، جو ذہانت اور اچھی گفتگو/ابلاغ کی صلاحیت کی علامت سمجھا جاتا ہے۔',
    cause: 'سورج اور عطارد ایک ہی راشی میں ہیں۔',
  };
}

/**
 * ---- 4. Panch Mahapurusha Yogas (5 "azeem shakhsiyat" yogas) ----
 * Classical shart: Mangal/Atarad/Mushtari/Zohra/Zohal apni UCH (exalted)
 * ya apni KHUD KI raashi (own sign) mein ho, AUR Lagna se Kendra
 * (1,4,7,10) mein baitha ho.
 */
const MAHAPURUSHA_DEFS = {
  Mars: { key: 'ruchaka', title: 'رچک یوگ' },
  Mercury: { key: 'bhadra', title: 'بھدر یوگ' },
  Jupiter: { key: 'hamsa', title: 'ہنس یوگ' },
  Venus: { key: 'malavya', title: 'مالویہ یوگ' },
  Saturn: { key: 'sasa', title: 'ساسا یوگ' },
};
function checkPanchMahapurusha(natalMap, ascendantRasiId) {
  const results = [];
  for (const planet of Object.keys(MAHAPURUSHA_DEFS)) {
    if (!natalMap[planet]) continue;
    const dignity = planetDignity(planet, natalMap[planet].rasiId);
    if (dignity !== 'exalted' && dignity !== 'own') continue;
    const house = houseOfPlanet(natalMap, ascendantRasiId, planet);
    if (!KENDRA_HOUSES.includes(house)) continue;
    const def = MAHAPURUSHA_DEFS[planet];
    results.push({
      key: def.key,
      title: def.title,
      benefic: true,
      description: `${PLANET_NAME_UR[planet]} اپنی ${dignity === 'exalted' ? 'اعلیٰ (exalted)' : 'اپنی خود کی'} راشی میں کیندر گھر میں بیٹھا ہے — یہ پنچ مہاپرش یوگوں میں سے ایک "${def.title}" بناتا ہے، جو مضبوط شخصیت، قیادت کی صلاحیت اور کامیابی کی علامت سمجھا جاتا ہے۔`,
      cause: `${PLANET_NAME_UR[planet]} ${dignity === 'exalted' ? 'اعلیٰ' : 'اپنی'} راشی میں، کیندر گھر ${house} میں ہے۔`,
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
function checkRajaYogas(natalMap, ascendantRasiId) {
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
      results.push({
        key: `raja_${pairKey.toLowerCase()}`,
        title: 'راجہ یوگ',
        benefic: true,
        description: `${k}ویں گھر کے حاکم (${PLANET_NAME_UR[lordK]}) اور ${t}ویں گھر کے حاکم (${PLANET_NAME_UR[lordT]}) ایک ہی راشی میں اکٹھے ہیں — یہ کیندر-ترِکون راجہ یوگ بناتا ہے، جو عزت، اقتدار اور بلندی کی علامت سمجھا جاتا ہے۔`,
        cause: `${k}ویں گھر کا حاکم اور ${t}ویں گھر کا حاکم ایک ہی راشی میں ہیں۔`,
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
function checkDhanaYoga(natalMap, ascendantRasiId) {
  const lord2 = lordOfHouseFromLagna(ascendantRasiId, 2);
  const lord11 = lordOfHouseFromLagna(ascendantRasiId, 11);
  if (lord2 === lord11) return null;
  if (!natalMap[lord2] || !natalMap[lord11]) return null;
  if (!isConjunct(natalMap, lord2, lord11)) return null;
  return {
    key: 'dhana',
    title: 'دھن یوگ',
    benefic: true,
    description: `دوسرے گھر (دولت) کے حاکم (${PLANET_NAME_UR[lord2]}) اور گیارہویں گھر (آمدنی) کے حاکم (${PLANET_NAME_UR[lord11]}) ایک ہی راشی میں اکٹھے ہیں — یہ دھن یوگ بناتا ہے، جو مالی خوشحالی کی علامت سمجھا جاتا ہے۔`,
    cause: 'دوسرے اور گیارہویں گھر کے حاکم ایک ہی راشی میں ہیں۔',
  };
}

/**
 * ---- 7. Saraswati Yoga ----
 * Classical shart: Mushtari, Zohra aur Atarad teeno Kendra (1,4,7,10),
 * Trikona (1,5,9) ya doosray ghar mein hon, aur Mushtari kamzor (debilitated)
 * na ho. Asar: ilm, hikmat aur fun mein mahaarat.
 */
function checkSaraswati(natalMap, ascendantRasiId) {
  const requiredPlanets = ['Jupiter', 'Venus', 'Mercury'];
  if (!requiredPlanets.every((p) => natalMap[p])) return null;
  const validHouses = [1, 2, 4, 5, 7, 9, 10];
  const allPlaced = requiredPlanets.every((p) => validHouses.includes(houseOfPlanet(natalMap, ascendantRasiId, p)));
  if (!allPlaced) return null;
  if (planetDignity('Jupiter', natalMap.Jupiter.rasiId) === 'debilitated') return null;
  return {
    key: 'saraswati',
    title: 'سرسوتی یوگ',
    benefic: true,
    description: 'مشتری، زہرہ اور عطارد تینوں کیندر/ترِکون یا دوسرے گھر میں ہیں، اور مشتری کمزور نہیں ہے — یہ سرسوتی یوگ بناتا ہے، جو علم، حکمت اور فن میں مہارت کی علامت سمجھا جاتا ہے۔',
    cause: 'مشتری، زہرہ اور عطارد تینوں مضبوط گھروں میں ہیں۔',
  };
}

/**
 * ---- 8. Adhi Yoga ----
 * Classical shart: Chand se 6ویں, 7ویں aur 8ویں ghar mein "shubh" grahas
 * (Atarad/Zohra/Mushtari) mojood hon. Asar: qayadat (leadership), izzat.
 */
function checkAdhiYoga(natalMap) {
  if (!natalMap.Moon) return null;
  const beneficsForAdhi = ['Mercury', 'Venus', 'Jupiter'];
  const targetHouses = [6, 7, 8];
  const covered = targetHouses.every((h) =>
    beneficsForAdhi.some((p) => natalMap[p] && houseFromReference(natalMap[p].rasiId, natalMap.Moon.rasiId) === h)
  );
  if (!covered) return null;
  return {
    key: 'adhi',
    title: 'آدھی یوگ',
    benefic: true,
    description: 'آپ کے چاند سے چھٹے، ساتویں اور آٹھویں گھر میں شبھ سیارے (عطارد، زہرہ، مشتری) موجود ہیں — یہ آدھی یوگ بناتا ہے، جو قیادت کی صلاحیت اور عزت کی علامت سمجھا جاتا ہے۔',
    cause: 'چاند سے 6, 7, 8 ویں گھروں میں شبھ سیارے موجود ہیں۔',
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
  6: { key: 'harsha', title: 'ہرشا یوگ (وپریت راجہ)' },
  8: { key: 'sarala', title: 'سرلا یوگ (وپریت راجہ)' },
  12: { key: 'vimala', title: 'وِملا یوگ (وپریت راجہ)' },
};
function checkVipreetRajaYogas(natalMap, ascendantRasiId) {
  const dusthanas = [6, 8, 12];
  const results = [];
  for (const houseN of dusthanas) {
    const lord = lordOfHouseFromLagna(ascendantRasiId, houseN);
    if (!natalMap[lord]) continue;
    const lordHouse = houseOfPlanet(natalMap, ascendantRasiId, lord);
    const otherDusthanas = dusthanas.filter((h) => h !== houseN);
    if (!otherDusthanas.includes(lordHouse)) continue;
    const def = VIPREET_DEFS[houseN];
    results.push({
      key: def.key,
      title: def.title,
      benefic: true,
      description: `${houseN}ویں گھر کا حاکم (${PLANET_NAME_UR[lord]}) ایک اور مشکل گھر (${lordHouse}) میں بیٹھا ہے — یہ "${def.title}" بناتا ہے، جو مشکلات کے باوجود غیرمتوقع ترقی کی علامت سمجھا جاتا ہے۔`,
      cause: `${houseN}ویں گھر کا حاکم، ${lordHouse}ویں گھر میں ہے۔`,
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
function checkNeechaBhanga(natalMap, ascendantRasiId) {
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
    results.push({
      key: `neecha_bhanga_${planet.toLowerCase()}`,
      title: 'نیچ بھنگ راجہ یوگ',
      benefic: true,
      description: `${PLANET_NAME_UR[planet]} کمزور (نیچ) حالت میں ہے، لیکن اس راشی کا حاکم (${PLANET_NAME_UR[debilSignLord]}) خود لگن یا چاند سے کیندر میں بیٹھا ہے — اس لیے یہ کمزوری "بھنگ" (ختم) ہو جاتی ہے، بلکہ الٹا ایک نیچ بھنگ راجہ یوگ بن جاتا ہے، جو دیر سے ملنے والی مگر بڑی کامیابی کی علامت سمجھا جاتا ہے۔`,
      cause: `${PLANET_NAME_UR[planet]} نیچ کا حاکم، لگن/چاند سے کیندر میں ہے۔`,
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
function checkKemadruma(natalMap) {
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
    title: 'کیمدرم دوش',
    benefic: false,
    description: 'چاند کے دونوں طرف (دوسرے اور بارہویں گھر، چاند سے گنتے ہوئے) اور خود چاند کے ساتھ بھی کوئی گرہ موجود نہیں — یہ کیمدرم دوش بناتا ہے، جو ذہنی بےچینی اور جدوجہد کے ادوار کی علامت سمجھا جاتا ہے۔ یاد رہے: کنڈلی کے دوسرے مضبوط پہلو اس دوش کے اثر کو کافی حد تک کم کر سکتے ہیں۔',
    cause: 'چاند کے ساتھ، اور اس سے دوسرے/بارہویں گھر میں کوئی گرہ نہیں۔',
  };
}

/**
 * buildYogas — poori kundli (natalMap + ascendantRasiId) le kar sab
 * classical yogas check karta hai aur jo bhi maujood hon unki list deta
 * hai (Urdu title + plain-language description + "cause" har entry ke
 * sath). Koi yoga na milay to khaali array wapas aata hai.
 */
function buildYogas(data) {
  const natalMap = data.natal.planets;
  const ascendantRasiId = data.natal.ascendantRasiId;

  const results = [];
  const single = [
    checkGajakesari(natalMap, ascendantRasiId),
    checkChandraMangal(natalMap),
    checkBudhaditya(natalMap),
    checkDhanaYoga(natalMap, ascendantRasiId),
    checkSaraswati(natalMap, ascendantRasiId),
    checkAdhiYoga(natalMap),
    checkKemadruma(natalMap),
  ];
  for (const r of single) if (r) results.push(r);

  results.push(...checkPanchMahapurusha(natalMap, ascendantRasiId));
  results.push(...checkRajaYogas(natalMap, ascendantRasiId));
  results.push(...checkVipreetRajaYogas(natalMap, ascendantRasiId));
  results.push(...checkNeechaBhanga(natalMap, ascendantRasiId));

  return results;
}

module.exports = {
  buildYogas,
};
