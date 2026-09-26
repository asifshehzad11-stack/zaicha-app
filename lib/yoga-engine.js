/**
 * Zaicha Yoga Detection Engine — Multi-language (EN/UR/HI/AR/ZH)
 * ================================================================
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
 * Multi-language: buildYogas(data, lang) har yoga ka title/description/
 * cause request ki language (en/ur/hi/ar/zh) mein deta hai. Language
 * handling (lang-normalization, planet names, house ordinals) is file mein
 * LOCAL hai — narrative.js par depend nahi karti — taake ye module kisi bhi
 * doosri file ki language support se independent rahe. Terminology
 * scratchpad glossary (Zaicha terminology glossary) ke mutabiq hai.
 */

'use strict';

const { SIGN_LORDS, planetDignity, houseFromReference, PLANET_NAME_URDU } = require('./astro-engine');
const { ASPECT_OFFSETS } = require('./narrative');

// ---------------------------------------------------------------------------
// Local language helpers (en/ur/hi/ar/zh) — unknown lang falls back to en.
// ---------------------------------------------------------------------------
const LANGS = ['en', 'ur', 'hi', 'ar', 'zh'];
function normLang(lang) {
  return LANGS.indexOf(lang) !== -1 ? lang : 'en';
}
/** pick — {en, ur, hi, ar, zh} object se request ki language ki value (fallback en). */
function pick(obj, lang) {
  if (!obj) return undefined;
  return obj[lang] !== undefined ? obj[lang] : obj.en;
}

const PLANET_NAMES = {
  en: {
    Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mercury', Jupiter: 'Jupiter',
    Venus: 'Venus', Saturn: 'Saturn', Rahu: 'Rahu', Ketu: 'Ketu',
  },
  ur: PLANET_NAME_URDU,
  hi: {
    Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु',
    Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
  },
  ar: {
    Sun: 'الشمس', Moon: 'القمر', Mars: 'المريخ', Mercury: 'عطارد', Jupiter: 'المشتري',
    Venus: 'الزهرة', Saturn: 'زحل', Rahu: 'راهو', Ketu: 'كيتو',
  },
  zh: {
    Sun: '太阳', Moon: '月亮', Mars: '火星', Mercury: '水星', Jupiter: '木星',
    Venus: '金星', Saturn: '土星', Rahu: '罗睺', Ketu: '计都',
  },
};
function planetLabel(planet, lang) {
  const names = PLANET_NAMES[lang] || PLANET_NAMES.en;
  return names[planet] || planet;
}

// House ordinals. en: "7th"; hi: "सातवें" (use as "सातवें भाव");
// ar: "البيت السابع" (full phrase incl. "house"); zh: templates use "第7宫" directly.
// Urdu doesn't need this (ویں already works for any number), so Urdu
// templates keep using the raw number directly.
const EN_ORDINALS = {
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th',
  7: '7th', 8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th',
};
const HI_ORDINALS = {
  1: 'पहले', 2: 'दूसरे', 3: 'तीसरे', 4: 'चौथे', 5: 'पाँचवें', 6: 'छठे',
  7: 'सातवें', 8: 'आठवें', 9: 'नौवें', 10: 'दसवें', 11: 'ग्यारहवें', 12: 'बारहवें',
};
const AR_HOUSE = {
  1: 'البيت الأول', 2: 'البيت الثاني', 3: 'البيت الثالث', 4: 'البيت الرابع',
  5: 'البيت الخامس', 6: 'البيت السادس', 7: 'البيت السابع', 8: 'البيت الثامن',
  9: 'البيت التاسع', 10: 'البيت العاشر', 11: 'البيت الحادي عشر', 12: 'البيت الثاني عشر',
};
function enOrd(n) { return EN_ORDINALS[n] || `${n}th`; }
function hiOrd(n) { return HI_ORDINALS[n] || `${n}वें`; }
function arHouse(n) { return AR_HOUSE[n] || `البيت ${n}`; }

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
// Yoga titles — {en, ur, hi, ar, zh}.
// ---------------------------------------------------------------------------
const TITLES = {
  gajakesari: {
    ur: 'گج کیسری یوگ', en: 'Gajakesari Yoga',
    hi: 'गजकेसरी योग', ar: 'غاجاكيساري يوغا', zh: '象狮瑜伽组合（Gajakesari Yoga）',
  },
  chandra_mangal: {
    ur: 'چاند-مریخ یوگ', en: 'Chandra-Mangal Yoga',
    hi: 'चंद्र-मंगल योग', ar: 'تشاندرا-مانغال يوغا (القمر والمريخ)', zh: '月火瑜伽组合（Chandra-Mangal Yoga）',
  },
  budhaditya: {
    ur: 'بدھادتیہ یوگ', en: 'Budhaditya Yoga',
    hi: 'बुधादित्य योग', ar: 'بودهاديتيا يوغا', zh: '日水瑜伽组合（Budhaditya Yoga）',
  },
  raja: {
    ur: 'راجہ یوگ', en: 'Raja Yoga',
    hi: 'राजयोग', ar: 'راجا يوغا', zh: '王者瑜伽组合（Raja Yoga）',
  },
  dhana: {
    ur: 'دھن یوگ', en: 'Dhana Yoga',
    hi: 'धन योग', ar: 'دهانا يوغا', zh: '财富瑜伽组合（Dhana Yoga）',
  },
  saraswati: {
    ur: 'سرسوتی یوگ', en: 'Saraswati Yoga',
    hi: 'सरस्वती योग', ar: 'ساراسواتي يوغا', zh: '萨拉斯瓦蒂瑜伽组合（Saraswati Yoga）',
  },
  adhi: {
    ur: 'آدھی یوگ', en: 'Adhi Yoga',
    hi: 'अधि योग', ar: 'آدهي يوغا', zh: '阿迪瑜伽组合（Adhi Yoga）',
  },
  neecha_bhanga: {
    ur: 'نیچ بھنگ راجہ یوگ', en: 'Neecha Bhanga Raja Yoga',
    hi: 'नीचभंग राजयोग', ar: 'نيتشا بهانغا راجا يوغا', zh: '落陷化解王者瑜伽组合（Neecha Bhanga Raja Yoga）',
  },
  kemadruma: {
    ur: 'کیمدرم دوش', en: 'Kemadruma Dosha',
    hi: 'केमद्रुम दोष', ar: 'كيمادروما دوشا', zh: '孤月格局（Kemadruma Dosha）',
  },
};
function title(key, lang) {
  return pick(TITLES[key], lang);
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
    description: pick({
      ur: 'مشتری آپ کے چاند سے کیندر (پہلے، چوتھے، ساتویں یا دسویں گھر) میں ہے — یہ گج کیسری یوگ بناتا ہے، جو شہرت، عقل و دانش اور خوشحالی کی علامت سمجھا جاتا ہے۔',
      en: 'Jupiter is in a Kendra (1st, 4th, 7th or 10th house) from your Moon — this forms Gajakesari Yoga, considered a sign of fame, wisdom and prosperity.',
      hi: 'गुरु आपके चंद्र से केंद्र (पहले, चौथे, सातवें या दसवें भाव) में है — इससे गजकेसरी योग बनता है, जिसे यश, बुद्धि और समृद्धि का संकेत माना जाता है।',
      ar: 'المشتري في الوتد (كيندرا) من قمرك، أي في البيت الأول أو الرابع أو السابع أو العاشر منه — وهذا يكوّن غاجاكيساري يوغا، التي تُعدّ علامةً على الشهرة والحكمة والرخاء.',
      zh: '木星位于您月亮的角宫（Kendra，即从月亮起算的第1、4、7或10宫）——这构成象狮瑜伽组合（Gajakesari Yoga），被视为名望、智慧与富足的象征。',
    }, lang),
    cause: pick({
      ur: 'مشتری، چاند سے کیندر میں ہے۔',
      en: 'Jupiter is in a Kendra house from the Moon.',
      hi: 'गुरु, चंद्र से केंद्र भाव में है।',
      ar: 'المشتري في بيت وتدي (كيندرا) من القمر.',
      zh: '木星位于月亮的角宫（Kendra）。',
    }, lang),
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
    description: pick({
      ur: 'آپ کی کنڈلی میں چاند اور مریخ ایک ہی راشی میں اکٹھے ہیں — یہ چاند-مریخ یوگ ہے، جو مالی سوجھ بوجھ اور دولت کمانے کی صلاحیت سے جوڑا جاتا ہے۔',
      en: 'In your chart, the Moon and Mars are together in the same sign — this is Chandra-Mangal Yoga, associated with financial acumen and the ability to earn wealth.',
      hi: 'आपकी कुंडली में चंद्र और मंगल एक ही राशि में साथ हैं — यह चंद्र-मंगल योग है, जिसे आर्थिक समझ और धन कमाने की क्षमता से जोड़ा जाता है।',
      ar: 'في خريطتك الفلكية يجتمع القمر والمريخ في البرج نفسه — وهذه هي تشاندرا-مانغال يوغا، المرتبطة بالفطنة المالية والقدرة على كسب المال.',
      zh: '在您的星盘中，月亮与火星同处一个星座——这就是月火瑜伽组合（Chandra-Mangal Yoga），与理财头脑和赚取财富的能力相关。',
    }, lang),
    cause: pick({
      ur: 'چاند اور مریخ ایک ہی راشی میں ہیں۔',
      en: 'The Moon and Mars are in the same sign.',
      hi: 'चंद्र और मंगल एक ही राशि में हैं।',
      ar: 'القمر والمريخ في البرج نفسه.',
      zh: '月亮与火星位于同一星座。',
    }, lang),
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
    description: pick({
      ur: 'سورج اور عطارد ایک ہی راشی میں اکٹھے ہیں — یہ بدھادتیہ یوگ بناتا ہے، جو ذہانت اور اچھی گفتگو/ابلاغ کی صلاحیت کی علامت سمجھا جاتا ہے۔',
      en: 'The Sun and Mercury are together in the same sign — this forms Budhaditya Yoga, considered a sign of intelligence and strong communication ability.',
      hi: 'सूर्य और बुध एक ही राशि में साथ हैं — इससे बुधादित्य योग बनता है, जिसे बुद्धिमत्ता और अच्छी संवाद क्षमता का संकेत माना जाता है।',
      ar: 'تجتمع الشمس وعطارد في البرج نفسه — وهذا يكوّن بودهاديتيا يوغا، التي تُعدّ علامةً على الذكاء والقدرة القوية على التواصل.',
      zh: '太阳与水星同处一个星座——这构成日水瑜伽组合（Budhaditya Yoga），被视为聪慧与出色沟通能力的象征。',
    }, lang),
    cause: pick({
      ur: 'سورج اور عطارد ایک ہی راشی میں ہیں۔',
      en: 'The Sun and Mercury are in the same sign.',
      hi: 'सूर्य और बुध एक ही राशि में हैं।',
      ar: 'الشمس وعطارد في البرج نفسه.',
      zh: '太阳与水星位于同一星座。',
    }, lang),
  };
}

/**
 * ---- 4. Panch Mahapurusha Yogas (5 "azeem shakhsiyat" yogas) ----
 * Classical shart: Mangal/Atarad/Mushtari/Zohra/Zohal apni UCH (exalted)
 * ya apni KHUD KI raashi (own sign) mein ho, AUR Lagna se Kendra
 * (1,4,7,10) mein baitha ho.
 */
const MAHAPURUSHA_DEFS = {
  Mars: { key: 'ruchaka', ur: 'رچک یوگ', en: 'Ruchaka Yoga', hi: 'रुचक योग', ar: 'روتشاكا يوغا', zh: '鲁查卡瑜伽组合（Ruchaka Yoga）' },
  Mercury: { key: 'bhadra', ur: 'بھدر یوگ', en: 'Bhadra Yoga', hi: 'भद्र योग', ar: 'بهادرا يوغا', zh: '巴德拉瑜伽组合（Bhadra Yoga）' },
  Jupiter: { key: 'hamsa', ur: 'ہنس یوگ', en: 'Hamsa Yoga', hi: 'हंस योग', ar: 'هامسا يوغا', zh: '哈姆萨瑜伽组合（Hamsa Yoga）' },
  Venus: { key: 'malavya', ur: 'مالویہ یوگ', en: 'Malavya Yoga', hi: 'मालव्य योग', ar: 'مالافيا يوغا', zh: '马拉维亚瑜伽组合（Malavya Yoga）' },
  Saturn: { key: 'sasa', ur: 'ساسا یوگ', en: 'Sasa Yoga', hi: 'शश योग', ar: 'ساسا يوغا', zh: '萨萨瑜伽组合（Sasa Yoga）' },
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
    const t = pick(def, lang);
    const label = planetLabel(planet, lang);
    const ex = dignity === 'exalted';
    let description;
    let cause;
    if (lang === 'ur') {
      description = `${label} اپنی ${ex ? 'اعلیٰ (exalted)' : 'اپنی خود کی'} راشی میں کیندر گھر میں بیٹھا ہے — یہ پنچ مہاپرش یوگوں میں سے ایک "${t}" بناتا ہے، جو مضبوط شخصیت، قیادت کی صلاحیت اور کامیابی کی علامت سمجھا جاتا ہے۔`;
      cause = `${label} ${ex ? 'اعلیٰ' : 'اپنی'} راشی میں، کیندر گھر ${house} میں ہے۔`;
    } else if (lang === 'hi') {
      description = `${label} ${ex ? 'अपनी उच्च राशि' : 'अपनी स्वराशि'} में केंद्र भाव में बैठा है — इससे पंच महापुरुष योगों में से एक "${t}" बनता है, जिसे मज़बूत व्यक्तित्व, नेतृत्व क्षमता और सफलता का संकेत माना जाता है।`;
      cause = `${label} ${ex ? 'उच्च राशि' : 'स्वराशि'} में होकर केंद्र के ${hiOrd(house)} भाव में है।`;
    } else if (lang === 'ar') {
      description = `${label} ${ex ? 'في الشرف' : 'في بيته'}، ومكانه في بيت وتدي (كيندرا) — وهذا يكوّن "${t}"، إحدى يوغات بانتش ماهابوروشا الخمس، التي تُعدّ علامةً على شخصية قوية وقدرة على القيادة ونجاح.`;
      cause = `${label} ${ex ? 'في الشرف' : 'في بيته'}، في ${arHouse(house)} وهو بيت وتدي (كيندرا).`;
    } else if (lang === 'zh') {
      description = `${label}${ex ? '入旺' : '入庙'}并位于角宫（Kendra）——这构成五大人物瑜伽组合（Panch Mahapurusha Yoga）之一的“${t}”，被视为性格坚强、具备领导才能与成功的象征。`;
      cause = `${label}${ex ? '入旺' : '入庙'}，位于角宫（Kendra）第${house}宫。`;
    } else {
      description = `${label} is in a Kendra house in its ${ex ? 'exalted' : 'own'} sign — this forms "${t}", one of the Panch Mahapurusha Yogas, considered a sign of a strong personality, leadership ability and success.`;
      cause = `${label} is in its ${ex ? 'exalted' : 'own'} sign, in Kendra house ${house}.`;
    }
    results.push({
      key: def.key,
      title: t,
      benefic: true,
      description,
      cause,
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
        description: pick({
          ur: `${k}ویں گھر کے حاکم (${labelK}) اور ${t}ویں گھر کے حاکم (${labelT}) ایک ہی راشی میں اکٹھے ہیں — یہ کیندر-ترِکون راجہ یوگ بناتا ہے، جو عزت، اقتدار اور بلندی کی علامت سمجھا جاتا ہے۔`,
          en: `The lord of the ${enOrd(k)} house (${labelK}) and the lord of the ${enOrd(t)} house (${labelT}) are together in the same sign — this forms a Kendra-Trikona Raja Yoga, considered a sign of honor, power and elevation.`,
          hi: `${hiOrd(k)} भाव के स्वामी (${labelK}) और ${hiOrd(t)} भाव के स्वामी (${labelT}) एक ही राशि में साथ हैं — इससे केंद्र-त्रिकोण राजयोग बनता है, जिसे मान-सम्मान, अधिकार और उन्नति का संकेत माना जाता है।`,
          ar: `رب ${arHouse(k)} (${labelK}) ورب ${arHouse(t)} (${labelT}) يجتمعان في البرج نفسه — وهذا يكوّن راجا يوغا من نوع الوتد والمثلث (كيندرا-تريكونا)، التي تُعدّ علامةً على الشرف والسلطة والرفعة.`,
          zh: `第${k}宫主星（${labelK}）与第${t}宫主星（${labelT}）同处一个星座——这构成角宫-三方宫（Kendra-Trikona）王者瑜伽组合（Raja Yoga），被视为荣誉、权力与地位提升的象征。`,
        }, lang),
        cause: pick({
          ur: `${k}ویں گھر کا حاکم اور ${t}ویں گھر کا حاکم ایک ہی راشی میں ہیں۔`,
          en: `The lord of the ${enOrd(k)} house and the lord of the ${enOrd(t)} house are in the same sign.`,
          hi: `${hiOrd(k)} भाव का स्वामी और ${hiOrd(t)} भाव का स्वामी एक ही राशि में हैं।`,
          ar: `رب ${arHouse(k)} ورب ${arHouse(t)} في البرج نفسه.`,
          zh: `第${k}宫主星与第${t}宫主星位于同一星座。`,
        }, lang),
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
    description: pick({
      ur: `دوسرے گھر (دولت) کے حاکم (${label2}) اور گیارہویں گھر (آمدنی) کے حاکم (${label11}) ایک ہی راشی میں اکٹھے ہیں — یہ دھن یوگ بناتا ہے، جو مالی خوشحالی کی علامت سمجھا جاتا ہے۔`,
      en: `The lord of the 2nd house (wealth), ${label2}, and the lord of the 11th house (income), ${label11}, are together in the same sign — this forms Dhana Yoga, considered a sign of financial prosperity.`,
      hi: `दूसरे भाव (धन) के स्वामी ${label2} और ग्यारहवें भाव (आय) के स्वामी ${label11} एक ही राशि में साथ हैं — इससे धन योग बनता है, जिसे आर्थिक समृद्धि का संकेत माना जाता है।`,
      ar: `رب البيت الثاني (المال)، ${label2}، ورب البيت الحادي عشر (الدخل)، ${label11}، يجتمعان في البرج نفسه — وهذا يكوّن دهانا يوغا، التي تُعدّ علامةً على الرخاء المالي.`,
      zh: `第2宫（财富）主星${label2}与第11宫（收入）主星${label11}同处一个星座——这构成财富瑜伽组合（Dhana Yoga），被视为财务富足的象征。`,
    }, lang),
    cause: pick({
      ur: 'دوسرے اور گیارہویں گھر کے حاکم ایک ہی راشی میں ہیں۔',
      en: 'The lords of the 2nd and 11th houses are in the same sign.',
      hi: 'दूसरे और ग्यारहवें भाव के स्वामी एक ही राशि में हैं।',
      ar: 'رب البيت الثاني ورب البيت الحادي عشر في البرج نفسه.',
      zh: '第2宫主星与第11宫主星位于同一星座。',
    }, lang),
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
    description: pick({
      ur: 'مشتری، زہرہ اور عطارد تینوں کیندر/ترِکون یا دوسرے گھر میں ہیں، اور مشتری کمزور نہیں ہے — یہ سرسوتی یوگ بناتا ہے، جو علم، حکمت اور فن میں مہارت کی علامت سمجھا جاتا ہے۔',
      en: 'Jupiter, Venus and Mercury are all placed in Kendra/Trikona or the 2nd house, and Jupiter is not debilitated — this forms Saraswati Yoga, considered a sign of knowledge, wisdom and mastery in the arts.',
      hi: 'गुरु, शुक्र और बुध तीनों केंद्र/त्रिकोण या दूसरे भाव में हैं, और गुरु नीच नहीं है — इससे सरस्वती योग बनता है, जिसे ज्ञान, विवेक और कलाओं में निपुणता का संकेत माना जाता है।',
      ar: 'المشتري والزهرة وعطارد جميعها في بيوت الوتد أو المثلث (كيندرا/تريكونا) أو في البيت الثاني، والمشتري ليس في الهبوط — وهذا يكوّن ساراسواتي يوغا، التي تُعدّ علامةً على العلم والحكمة والإتقان في الفنون.',
      zh: '木星、金星和水星都位于角宫/三方宫（Kendra/Trikona）或第2宫，且木星没有落陷——这构成萨拉斯瓦蒂瑜伽组合（Saraswati Yoga），被视为学识、智慧与艺术造诣的象征。',
    }, lang),
    cause: pick({
      ur: 'مشتری، زہرہ اور عطارد تینوں مضبوط گھروں میں ہیں۔',
      en: 'Jupiter, Venus and Mercury are all in strong houses.',
      hi: 'गुरु, शुक्र और बुध तीनों मज़बूत भावों में हैं।',
      ar: 'المشتري والزهرة وعطارد جميعها في بيوت قوية.',
      zh: '木星、金星和水星都位于强势宫位。',
    }, lang),
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
    description: pick({
      ur: 'آپ کے چاند سے چھٹے، ساتویں اور آٹھویں گھر میں شبھ سیارے (عطارد، زہرہ، مشتری) موجود ہیں — یہ آدھی یوگ بناتا ہے، جو قیادت کی صلاحیت اور عزت کی علامت سمجھا جاتا ہے۔',
      en: 'Benefic planets (Mercury, Venus, Jupiter) occupy the 6th, 7th and 8th houses from your Moon — this forms Adhi Yoga, considered a sign of leadership ability and honor.',
      hi: 'आपके चंद्र से छठे, सातवें और आठवें भाव में शुभ ग्रह (बुध, शुक्र, गुरु) मौजूद हैं — इससे अधि योग बनता है, जिसे नेतृत्व क्षमता और सम्मान का संकेत माना जाता है।',
      ar: 'تشغل الكواكب السعيدة (عطارد والزهرة والمشتري) البيوت السادس والسابع والثامن من قمرك — وهذا يكوّن آدهي يوغا، التي تُعدّ علامةً على القدرة على القيادة والمكانة المحترمة.',
      zh: '吉星（水星、金星、木星）位于从您月亮起算的第6、7、8宫——这构成阿迪瑜伽组合（Adhi Yoga），被视为领导才能与受人尊敬的象征。',
    }, lang),
    cause: pick({
      ur: 'چاند سے 6, 7, 8 ویں گھروں میں شبھ سیارے موجود ہیں۔',
      en: 'Benefic planets occupy the 6th, 7th and 8th houses from the Moon.',
      hi: 'चंद्र से छठे, सातवें और आठवें भाव में शुभ ग्रह मौजूद हैं।',
      ar: 'الكواكب السعيدة في البيوت السادس والسابع والثامن من القمر.',
      zh: '从月亮起算的第6、7、8宫有吉星。',
    }, lang),
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
  6: {
    key: 'harsha', ur: 'ہرشا یوگ (وپریت راجہ)', en: 'Harsha Yoga (Vipreet Raja)',
    hi: 'हर्ष योग (विपरीत राजयोग)', ar: 'هارشا يوغا (فيبريت راجا)', zh: '哈沙瑜伽组合（Harsha Yoga，逆转王者）',
  },
  8: {
    key: 'sarala', ur: 'سرلا یوگ (وپریت راجہ)', en: 'Sarala Yoga (Vipreet Raja)',
    hi: 'सरल योग (विपरीत राजयोग)', ar: 'سارالا يوغا (فيبريت راجا)', zh: '萨拉拉瑜伽组合（Sarala Yoga，逆转王者）',
  },
  12: {
    key: 'vimala', ur: 'وِملا یوگ (وپریت راجہ)', en: 'Vimala Yoga (Vipreet Raja)',
    hi: 'विमल योग (विपरीत राजयोग)', ar: 'فيمالا يوغا (فيبريت راجا)', zh: '维马拉瑜伽组合（Vimala Yoga，逆转王者）',
  },
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
    const t = pick(def, lang);
    const label = planetLabel(lord, lang);
    results.push({
      key: def.key,
      title: t,
      benefic: true,
      description: pick({
        ur: `${houseN}ویں گھر کا حاکم (${label}) ایک اور مشکل گھر (${lordHouse}) میں بیٹھا ہے — یہ "${t}" بناتا ہے، جو مشکلات کے باوجود غیرمتوقع ترقی کی علامت سمجھا جاتا ہے۔`,
        en: `The lord of the ${houseN}th house (${label}) sits in another difficult house (${lordHouse}) — this forms "${t}", considered a sign of unexpected progress despite difficulties.`,
        hi: `${hiOrd(houseN)} भाव का स्वामी (${label}) एक और कठिन भाव, यानी ${hiOrd(lordHouse)} भाव में बैठा है — इससे "${t}" बनता है, जिसे कठिनाइयों के बावजूद अप्रत्याशित प्रगति का संकेत माना जाता है।`,
        ar: `رب ${arHouse(houseN)} (${label}) يقع في بيت صعب آخر، هو ${arHouse(lordHouse)} — وهذا يكوّن "${t}"، التي تُعدّ علامةً على تقدّم غير متوقع رغم الصعوبات.`,
        zh: `第${houseN}宫主星（${label}）落在另一个困难宫位——第${lordHouse}宫——这构成“${t}”，被视为虽经困难却能意外取得进展的象征。`,
      }, lang),
      cause: pick({
        ur: `${houseN}ویں گھر کا حاکم، ${lordHouse}ویں گھر میں ہے۔`,
        en: `The lord of the ${houseN}th house is in the ${lordHouse}th house.`,
        hi: `${hiOrd(houseN)} भाव का स्वामी ${hiOrd(lordHouse)} भाव में है।`,
        ar: `رب ${arHouse(houseN)} في ${arHouse(lordHouse)}.`,
        zh: `第${houseN}宫主星位于第${lordHouse}宫。`,
      }, lang),
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
      description: pick({
        ur: `${planetLbl} کمزور (نیچ) حالت میں ہے، لیکن اس راشی کا حاکم (${lordLbl}) خود لگن یا چاند سے کیندر میں بیٹھا ہے — اس لیے یہ کمزوری "بھنگ" (ختم) ہو جاتی ہے، بلکہ الٹا ایک نیچ بھنگ راجہ یوگ بن جاتا ہے، جو دیر سے ملنے والی مگر بڑی کامیابی کی علامت سمجھا جاتا ہے۔`,
        en: `${planetLbl} is in a weak (debilitated) state, but the lord of that sign (${lordLbl}) itself sits in a Kendra from the Ascendant or the Moon — so this weakness gets "cancelled", and instead turns into a Neecha Bhanga Raja Yoga, considered a sign of success that comes later but is significant.`,
        hi: `${planetLbl} कमज़ोर (नीच) स्थिति में है, लेकिन उस राशि का स्वामी (${lordLbl}) स्वयं लग्न या चंद्र से केंद्र में बैठा है — इसलिए यह कमज़ोरी "भंग" (समाप्त) हो जाती है, और उल्टा नीचभंग राजयोग बन जाता है, जिसे देर से मिलने वाली लेकिन बड़ी सफलता का संकेत माना जाता है।`,
        ar: `${planetLbl} في حالة ضعف (في الهبوط)، لكن رب ذلك البرج (${lordLbl}) نفسه يقع في وتد (كيندرا) من الطالع أو القمر — لذلك "يُلغى" هذا الضعف، بل يتحول إلى نيتشا بهانغا راجا يوغا، التي تُعدّ علامةً على نجاح يأتي متأخراً لكنه كبير.`,
        zh: `${planetLbl}处于较弱的落陷状态，但该星座的主星（${lordLbl}）本身位于上升点或月亮的角宫（Kendra）——因此这种弱势被“化解”，反而转变为落陷化解王者瑜伽组合（Neecha Bhanga Raja Yoga），被视为成功虽来得较晚、却意义重大的象征。`,
      }, lang),
      cause: pick({
        ur: `${planetLbl} نیچ کا حاکم، لگن/چاند سے کیندر میں ہے۔`,
        en: `The lord of ${planetLbl}'s debilitation sign is in a Kendra from the Ascendant/Moon.`,
        hi: `${planetLbl} की नीच राशि का स्वामी लग्न/चंद्र से केंद्र में है।`,
        ar: `رب برج هبوط ${planetLbl} في وتد (كيندرا) من الطالع/القمر.`,
        zh: `${planetLbl}落陷星座的主星位于上升点/月亮的角宫（Kendra）。`,
      }, lang),
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
    description: pick({
      ur: 'چاند کے دونوں طرف (دوسرے اور بارہویں گھر، چاند سے گنتے ہوئے) اور خود چاند کے ساتھ بھی کوئی گرہ موجود نہیں — یہ کیمدرم دوش بناتا ہے، جو ذہنی بےچینی اور جدوجہد کے ادوار کی علامت سمجھا جاتا ہے۔ یاد رہے: کنڈلی کے دوسرے مضبوط پہلو اس دوش کے اثر کو کافی حد تک کم کر سکتے ہیں۔',
      en: "There is no planet on either side of the Moon (the 2nd and 12th houses counted from the Moon) and none conjunct the Moon either — this forms Kemadruma Dosha, considered a sign of mental restlessness and periods of struggle. Keep in mind: other strong factors in the chart can significantly reduce this dosha's effect.",
      hi: 'चंद्र के दोनों ओर (चंद्र से गिनकर दूसरे और बारहवें भाव में) और स्वयं चंद्र के साथ भी कोई ग्रह नहीं है — इससे केमद्रुम दोष बनता है, जिसे मानसिक बेचैनी और संघर्ष के दौर का संकेत माना जाता है। याद रखें: कुंडली के दूसरे मज़बूत पहलू इस दोष के असर को काफ़ी हद तक कम कर सकते हैं।',
      ar: 'لا يوجد كوكب على جانبي القمر (البيتان الثاني والثاني عشر بالعدّ من القمر)، ولا كوكب مقترن بالقمر نفسه — وهذا يكوّن كيمادروما دوشا، التي تُعدّ علامةً على قلق ذهني وفترات من الكفاح. وتذكّر: العوامل القوية الأخرى في خريطتك الفلكية يمكن أن تخفّف أثرها إلى حدّ كبير.',
      zh: '月亮两侧（从月亮起算的第2宫和第12宫）都没有行星，月亮本身也没有与任何行星同宫——这构成孤月格局（Kemadruma Dosha），被视为内心不安与奋斗时期的象征。请记住：星盘中其他强势因素可以在很大程度上减轻这一格局的影响。',
    }, lang),
    cause: pick({
      ur: 'چاند کے ساتھ، اور اس سے دوسرے/بارہویں گھر میں کوئی گرہ نہیں۔',
      en: 'No planet is conjunct the Moon, or in the 2nd/12th house from it.',
      hi: 'चंद्र के साथ, और उससे दूसरे/बारहवें भाव में कोई ग्रह नहीं है।',
      ar: 'لا كوكب مقترن بالقمر، ولا في البيت الثاني أو الثاني عشر منه.',
      zh: '月亮没有与行星同宫，其第2/12宫也没有行星。',
    }, lang),
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
