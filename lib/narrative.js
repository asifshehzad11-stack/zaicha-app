/**
 * Zaicha Urdu Narrative Generator
 * ================================
 * Ye module zaicha_prototype.py ke generate_urdu_narrative() ka expanded
 * JavaScript version hai. Abhi ye template-based hai (hand-likha, LLM nahi)
 * — jaisa design doc (Section 5, 8) mein tay hua tha, ye ek proof-of-concept
 * hai. Jab Claude API key milegi to `generateNarrativeViaLLM()` function
 * (neeche, filhal placeholder) is ki jagah le lega — baaki poora backend
 * code bilkul nahi badlega, sirf ye ek function replace hogi.
 *
 * Design principle (dono competitors se seekha gaya):
 *   - AstroSage jaisa purely fatalistic nahi ("ye hoga hi hoga")
 *   - AstroMatrix jaisa purely abstract-psychological bhi nahi
 *   - Practical + respectful + "sabar/consistency" wala tone
 */

'use strict';

const { URDU_ORDINALS, PLANET_NAME_URDU } = require('./astro-engine');

// Classical house significations (Bhava karakatva) — 1st house se 12th tak.
// Ye standard/textbook meanings hain, kisi bhi Vedic reference mein milti hain.
const HOUSE_SIGNIFICATION_UR = {
  1: 'ذات، شخصیت اور صحت',
  2: 'مال، بچت اور خاندان',
  3: 'ہمت، بہن بھائی اور مختصر سفر',
  4: 'گھر، ماں اور ذہنی سکون',
  5: 'اولاد، تعلیم اور تخلیقی صلاحیت',
  6: 'مقابلہ، قرض اور صحت کے معاملات',
  7: 'شراکت داری اور ازدواجی زندگی',
  8: 'تبدیلی، وراثت اور غیب کے معاملات',
  9: 'قسمت، والد اور مذہبی رجحان',
  10: 'کیریئر اور سماجی مقام',
  11: 'آمدنی، فوائد اور دوستی',
  12: 'اخراجات، نقصان اور تنہائی',
};

const LIFE_AREA_LABELS_UR = {
  career: 'کیریئر',
  wealth: 'مال و دولت',
  health: 'صحت',
  relationships: 'محبت و رشتے',
  family: 'گھر اور خاندان',
};

function ordinal(n) {
  return URDU_ORDINALS[n] || `${n}ویں`;
}

/**
 * facts shape:
 * {
 *   lifeAreaKey: "career",
 *   mahadashaLord, mahadashaLordNatalHouse, mahadashaPeriod: {start,end},
 *   antardashaLord, antardashaLordNatalHouse, antardashaLordRetrograde, antardashaPeriod,
 *   isInSadeSati, sadeSatiPhase,
 *   hasKaalSarpDosha,
 *   hasMangalDosha,
 * }
 */
function generateNarrative(facts) {
  const lines = [];
  const areaLabel = LIFE_AREA_LABELS_UR[facts.lifeAreaKey] || facts.lifeAreaKey;

  if (facts.mahadashaLord && facts.mahadashaLordNatalHouse) {
    lines.push(
      `اس وقت آپ کی ${facts.mahadashaLord} کی مہادشا چل رہی ہے، جو آپ کی کنڈلی کے ${ordinal(facts.mahadashaLordNatalHouse)} گھر میں بیٹھی ہے — یعنی یہ دور آپ کی زندگی کے اُس حصے کو زیادہ چھو رہا ہے جو اس گھر سے جڑا ہے، اور ${areaLabel} پر بھی اسی نسبت سے اثر پڑ رہا ہے۔`
    );
  }

  if (facts.antardashaLord && facts.antardashaLordNatalHouse) {
    let s = `اسی کے اندر ${facts.antardashaLord} کی انتردشا بھی ساتھ چل رہی ہے، جو آپ کے ${ordinal(facts.antardashaLordNatalHouse)} گھر میں ہے`;
    if (facts.antardashaLordRetrograde) {
      s += '، اور ابھی رجعت (retrograde) میں بھی ہے — اس کا اثر تھوڑی دیر سے لیکن گہرا محسوس ہوگا۔';
    } else {
      s += '۔';
    }
    lines.push(s);
  }

  if (facts.isInSadeSati) {
    lines.push(
      `اس وقت آپ ساڑھ ساتی کے "${facts.sadeSatiPhase || ''}" مرحلے میں بھی ہیں — محنت زیادہ اور نتیجہ ذرا دیر سے ملنے کا احساس ہو سکتا ہے، لیکن یہ مرحلہ صبر اور تسلسل سے گزرنے والا ہے، گھبرانے کی بات نہیں۔`
    );
  }

  if (facts.hasKaalSarpDosha) {
    lines.push(
      'کنڈلی میں کال سرپ یوگ موجود ہے — اس کا مطلب یہ نہیں کہ ہر معاملہ رکا رہے گا، بلکہ یہ اشارہ ہے کہ نتائج تھوڑی تاخیر اور اضافی محنت کے بعد ملتے ہیں۔'
    );
  } else {
    lines.push('اچھی بات یہ ہے کہ آپ کی کنڈلی میں کال سرپ یوگ نہیں ہے، تو بڑے فیصلے لیتے وقت اس رکاوٹ کی فکر نہ کریں۔');
  }

  if (facts.hasMangalDosha) {
    lines.push('منگل دوش بھی موجود ہے — رشتوں اور شراکت داری کے معاملات میں تھوڑی اضافی سمجھ بوجھ اور بات چیت مددگار ثابت ہوگی۔');
  }

  lines.push(
    'مشورہ: بڑے مالی یا کیریئر کے فیصلے جلد بازی میں نہ کریں — اس دور کا فائدہ تب ملے گا جب آپ مستقل مزاجی سے کام کریں گے، شارٹ کٹ ڈھونڈنے کی کوشش نہ کریں۔'
  );

  return lines.join(' ');
}

/**
 * PLACEHOLDER — future upgrade path.
 * Jab Claude API key available ho (Asif ke apne account se, alag se .env
 * variable ANTHROPIC_API_KEY), to ye function structured facts ko Claude ko
 * bhejega aur dynamic, har chart ke liye unique paragraph wapas layega.
 * Filhal ye sirf template-based generateNarrative() ko call karta hai taake
 * baaki backend code (routes waghera) bilkul na badalna pade jab ye upgrade
 * ho.
 */
async function generateNarrativeViaLLM(facts) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return generateNarrative(facts);
  }
  // TODO: real Claude API call yahan aayegi (Messages API), structured
  // facts JSON ko prompt mein bhej kar. Abhi ke liye template hi use ho raha
  // hai chahe key ho ya na ho, jab tak ye function khud implement na ho.
  return generateNarrative(facts);
}

/**
 * gocharFromLagna: { "Sun": 12, "Moon": 3, ... } (planet -> house-from-Lagna,
 * jaisa astro-engine.buildZaichaData() return karta hai).
 *
 * Ye 7 classical grahas (Sun..Saturn) ke liye ek-ek chhoti line banata hai —
 * asal computed house placement par based, koi fictional date/day nahi.
 * Rahu/Ketu bhi shamil hain agar list mein maujood hon.
 */
function buildCurrentTransitLines(gocharFromLagna) {
  const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const lines = [];
  for (const planet of order) {
    const house = gocharFromLagna[planet];
    if (!house) continue;
    const label = PLANET_NAME_URDU[planet] || planet;
    const signification = HOUSE_SIGNIFICATION_UR[house] || '';
    lines.push({
      planet,
      planetLabel: label,
      house,
      text: `${label} اس وقت آپ کے ${URDU_ORDINALS[house]} گھر میں گردش کر رہا ہے — یہ گھر ${signification} سے متعلق ہے، تو اسی حوالے سے تھوڑی زیادہ سرگرمی یا توجہ محسوس ہو سکتی ہے۔`,
    });
  }
  return lines;
}

module.exports = {
  generateNarrative,
  generateNarrativeViaLLM,
  buildCurrentTransitLines,
  LIFE_AREA_LABELS_UR,
  HOUSE_SIGNIFICATION_UR,
};
