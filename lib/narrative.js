/**
 * Zaicha Narrative Generator — Multi-language (EN/UR/HI)
 * =======================================================
 * Pehle ye module sirf Urdu strings return karta tha. Ab har function ek
 * `lang` parameter leta hai ('en' | 'ur' | 'hi', default 'en' — jo Zaicha ka
 * app-wide default language hai). Yeh foundational fix hai: jab tak yeh nahi
 * hota, English/Hindi mode mein UI to English/Hindi dikhti thi lekin
 * predictions/reports hamesha Urdu mein aate thay — ab har language mein
 * poora content sahi generate hota hai.
 *
 * Content status:
 *   - Urdu (ur): original, poora — jaisa pehle tha.
 *   - English (en): poora translate ho chuka hai (yeh ab app ka default hai,
 *     is liye sab se pehle mukammal kiya gaya).
 *   - Hindi (hi): abhi English text hi fallback ke tor par dikhata hai
 *     (translation TODO — ROADMAP.md mein tracked hai). Yeh crash/blank se
 *     behtar hai jab tak asal Hindi translation nahi ho jati.
 *
 * Design principle (dono competitors se seekha gaya):
 *   - AstroSage jaisa purely fatalistic nahi ("ye hoga hi hoga")
 *   - AstroMatrix jaisa purely abstract-psychological bhi nahi
 *   - Practical + respectful + "sabar/consistency" wala tone
 */

'use strict';

const { URDU_ORDINALS, PLANET_NAME_URDU } = require('./astro-engine');

const SUPPORTED_LANGS = ['en', 'ur', 'hi'];
function normLang(lang) {
  return SUPPORTED_LANGS.indexOf(lang) !== -1 ? lang : 'en';
}

// ---------------------------------------------------------------------------
// Ordinals ("1st house" / "پہلے گھر")
// ---------------------------------------------------------------------------
const EN_ORDINALS = {
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th',
  7: '7th', 8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th',
};
function ordinalFor(lang, n) {
  if (lang === 'ur') return URDU_ORDINALS[n] || `${n}ویں`;
  return EN_ORDINALS[n] || `${n}th`; // hi: falls back to en for now
}

// ---------------------------------------------------------------------------
// House significations (Bhava karakatva) — 1st house se 12th tak
// ---------------------------------------------------------------------------
const HOUSE_SIGNIFICATION_UR = {
  1: 'ذات، شخصیت اور صحت', 2: 'مال، بچت اور خاندان', 3: 'ہمت، بہن بھائی اور مختصر سفر',
  4: 'گھر، ماں اور ذہنی سکون', 5: 'اولاد، تعلیم اور تخلیقی صلاحیت', 6: 'مقابلہ، قرض اور صحت کے معاملات',
  7: 'شراکت داری اور ازدواجی زندگی', 8: 'تبدیلی، وراثت اور غیب کے معاملات', 9: 'قسمت، والد اور مذہبی رجحان',
  10: 'کیریئر اور سماجی مقام', 11: 'آمدنی، فوائد اور دوستی', 12: 'اخراجات، نقصان اور تنہائی',
};
const HOUSE_SIGNIFICATION_EN = {
  1: 'self, personality and health', 2: 'wealth, savings and family', 3: 'courage, siblings and short journeys',
  4: 'home, mother and mental peace', 5: 'children, education and creativity', 6: 'competition, debt and health issues',
  7: 'partnership and married life', 8: 'transformation, inheritance and hidden matters', 9: 'fortune, father and religious inclination',
  10: 'career and social standing', 11: 'income, gains and friendships', 12: 'expenses, losses and solitude',
};
const HOUSE_SIGNIFICATION = { ur: HOUSE_SIGNIFICATION_UR, en: HOUSE_SIGNIFICATION_EN, hi: HOUSE_SIGNIFICATION_EN };

const LIFE_AREA_LABELS_UR = { career: 'کیریئر', wealth: 'مال و دولت', health: 'صحت', relationships: 'محبت و رشتے', family: 'گھر اور خاندان' };
const LIFE_AREA_LABELS_EN = { career: 'Career', wealth: 'Wealth', health: 'Health', relationships: 'Love & Relationships', family: 'Home & Family' };
const LIFE_AREA_LABELS = { ur: LIFE_AREA_LABELS_UR, en: LIFE_AREA_LABELS_EN, hi: LIFE_AREA_LABELS_EN };

function ordinal(n, lang) { return ordinalFor(normLang(lang), n); }

// ---------------------------------------------------------------------------
// generateNarrative — Career/etc life-area paragraph from dasha+dosha facts
// ---------------------------------------------------------------------------
function generateNarrative(facts, lang) {
  lang = normLang(lang);
  if (lang === 'ur') return generateNarrativeUr(facts);
  return generateNarrativeEn(facts); // hi falls back to en for now
}

function generateNarrativeUr(facts) {
  const lines = [];
  const areaLabel = LIFE_AREA_LABELS_UR[facts.lifeAreaKey] || facts.lifeAreaKey;

  if (facts.mahadashaLord && facts.mahadashaLordNatalHouse) {
    lines.push(`اس وقت آپ کی ${facts.mahadashaLord} کی مہادشا چل رہی ہے، جو آپ کی کنڈلی کے ${ordinal(facts.mahadashaLordNatalHouse, 'ur')} گھر میں بیٹھی ہے — یعنی یہ دور آپ کی زندگی کے اُس حصے کو زیادہ چھو رہا ہے جو اس گھر سے جڑا ہے، اور ${areaLabel} پر بھی اسی نسبت سے اثر پڑ رہا ہے۔`);
  }
  if (facts.antardashaLord && facts.antardashaLordNatalHouse) {
    let s = `اسی کے اندر ${facts.antardashaLord} کی انتردشا بھی ساتھ چل رہی ہے، جو آپ کے ${ordinal(facts.antardashaLordNatalHouse, 'ur')} گھر میں ہے`;
    s += facts.antardashaLordRetrograde ? '، اور ابھی رجعت (retrograde) میں بھی ہے — اس کا اثر تھوڑی دیر سے لیکن گہرا محسوس ہوگا۔' : '۔';
    lines.push(s);
  }
  if (facts.isInSadeSati) {
    lines.push(`اس وقت آپ ساڑھ ساتی کے "${facts.sadeSatiPhase || ''}" مرحلے میں بھی ہیں — محنت زیادہ اور نتیجہ ذرا دیر سے ملنے کا احساس ہو سکتا ہے، لیکن یہ مرحلہ صبر اور تسلسل سے گزرنے والا ہے، گھبرانے کی بات نہیں۔`);
  }
  if (facts.hasKaalSarpDosha) {
    lines.push('کنڈلی میں کال سرپ یوگ موجود ہے — اس کا مطلب یہ نہیں کہ ہر معاملہ رکا رہے گا، بلکہ یہ اشارہ ہے کہ نتائج تھوڑی تاخیر اور اضافی محنت کے بعد ملتے ہیں۔');
  } else {
    lines.push('اچھی بات یہ ہے کہ آپ کی کنڈلی میں کال سرپ یوگ نہیں ہے، تو بڑے فیصلے لیتے وقت اس رکاوٹ کی فکر نہ کریں۔');
  }
  if (facts.hasMangalDosha) {
    lines.push('منگل دوش بھی موجود ہے — رشتوں اور شراکت داری کے معاملات میں تھوڑی اضافی سمجھ بوجھ اور بات چیت مددگار ثابت ہوگی۔');
  }
  lines.push('مشورہ: بڑے مالی یا کیریئر کے فیصلے جلد بازی میں نہ کریں — اس دور کا فائدہ تب ملے گا جب آپ مستقل مزاجی سے کام کریں گے، شارٹ کٹ ڈھونڈنے کی کوشش نہ کریں۔');
  return lines.join(' ');
}

function generateNarrativeEn(facts) {
  const lines = [];
  const areaLabel = LIFE_AREA_LABELS_EN[facts.lifeAreaKey] || facts.lifeAreaKey;

  if (facts.mahadashaLord && facts.mahadashaLordNatalHouse) {
    lines.push(`Right now you are running the ${facts.mahadashaLord} Mahadasha, which sits in the ${ordinal(facts.mahadashaLordNatalHouse, 'en')} house of your chart — meaning this period is touching that part of your life more, and it is affecting ${areaLabel} accordingly.`);
  }
  if (facts.antardashaLord && facts.antardashaLordNatalHouse) {
    let s = `Within that, the ${facts.antardashaLord} Antardasha is also running, which is in your ${ordinal(facts.antardashaLordNatalHouse, 'en')} house`;
    s += facts.antardashaLordRetrograde ? ', and it is currently retrograde too — its effect will be felt a little later, but more deeply.' : '.';
    lines.push(s);
  }
  if (facts.isInSadeSati) {
    lines.push(`You are also currently in the "${facts.sadeSatiPhase || ''}" phase of Sade Sati — you may feel effort is higher and results come a bit slower, but this is a phase to pass through with patience and consistency, nothing to worry about.`);
  }
  if (facts.hasKaalSarpDosha) {
    lines.push("Kaal Sarp Yoga is present in your chart — this doesn't mean everything will stay stuck, rather it's a sign that results arrive after some delay and extra effort.");
  } else {
    lines.push("The good news is that there is no Kaal Sarp Yoga in your chart, so don't worry about this obstacle when making big decisions.");
  }
  if (facts.hasMangalDosha) {
    lines.push('Mangal Dosha is also present — a little extra understanding and communication will help in matters of relationships and partnership.');
  }
  lines.push("Advice: don't rush into major financial or career decisions — this period will benefit you when you work with consistency, so don't look for shortcuts.");
  return lines.join(' ');
}

/**
 * PLACEHOLDER — future upgrade path.
 * Jab Claude API key available ho, ye function structured facts ko Claude ko
 * bhejega aur dynamic paragraph wapas layega. Filhal template-based
 * generateNarrative() ko hi call karta hai (ab lang-aware).
 */
async function generateNarrativeViaLLM(facts, lang) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return generateNarrative(facts, lang);
  }
  // TODO: real Claude API call yahan aayegi — us waqt bhi `lang` prompt mein
  // pass karna zaroori hoga taake output request ki language mein aaye.
  return generateNarrative(facts, lang);
}

// ---------------------------------------------------------------------------
// TRANSIT_PREDICTIONS — classical Gochar-Phal (transit result) matrix, per
// planet's own nature x house. Ab har language ke liye alag table hai.
// ---------------------------------------------------------------------------
const TRANSIT_PREDICTIONS_UR = {
  Sun: {
    1: 'خود اعتمادی اور قیادت کا جذبہ بڑھے گا، لیکن صحت اور غصے پر تھوڑی توجہ رکھیں۔',
    2: 'مالی معاملات اور خاندانی گفتگو میں توجہ درکار ہوگی — زبان میں نرمی رکھیں۔',
    3: 'ہمت اور محنت رنگ لائے گی، بہن بھائیوں سے تعلقات مضبوط ہوں گے۔',
    4: 'گھریلو زندگی میں کچھ ہلچل رہے گی، ماں کی صحت اور دل کے سکون کا خیال رکھیں۔',
    5: 'تعلیم اور تخلیقی کاموں میں توانائی رہے گی، اولاد کی طرف سے اچھی خبر ممکن ہے۔',
    6: 'مخالفین پر غلبہ اور قرض اتارنے کا موقع ملے گا، لیکن کام کا دباؤ بھی بڑھے گا۔',
    7: 'شراکت داری اور ازدواجی معاملات میں غرور اور سختی سے گریز کریں، توازن ضروری ہے۔',
    8: 'اچانک تبدیلیوں اور غیر متوقع حالات کا سامنا ممکن ہے، صحت میں احتیاط رکھیں۔',
    9: 'قسمت ساتھ دے گی، والد اور مذہبی رجحان سے فائدہ اور سفر کے امکانات بنیں گے۔',
    10: 'کیریئر میں نمایاں کامیابی اور عزت ملے گی، سماجی مقام بلند ہوگا۔',
    11: 'آمدنی اور فوائد میں اضافہ ہوگا، دیرینہ خواہشات کی تکمیل کا وقت ہے۔',
    12: 'اخراجات بڑھیں گے اور تھکاوٹ یا تنہائی کا احساس ہو سکتا ہے، آرام ضروری ہے۔',
  },
  Moon: {
    1: 'ذہنی طور پر حساس وقت ہے، سکون کے لیے آرام اور اچھی نیند ضروری ہے۔',
    2: 'خاندان اور مالی معاملات سے جذباتی وابستگی رہے گی، کھانے پینے کا خیال رکھیں۔',
    3: 'ہمت اور حوصلہ بلند رہے گا، قریبی رشتوں سے گفتگو فائدہ مند ثابت ہوگی۔',
    4: 'گھر اور ماں سے جڑی خوشی کے لمحات ملیں گے، ذہنی سکون بہتر ہوگا۔',
    5: 'دل کی سنی جائے گی، محبت اور تخلیقی معاملات میں خوشگوار وقت ہے۔',
    6: 'ذہنی دباؤ یا معمولی بیماری کا امکان ہے، مقابلے میں ہمت سے کام لیں۔',
    7: 'تعلقات میں نرمی اور محبت رہے گی، شراکت داری میں تعاون بڑھے گا۔',
    8: 'جذباتی اتار چڑھاؤ رہے گا، غیر متوقع خبریں مل سکتی ہیں — صبر رکھیں۔',
    9: 'خوش قسمتی اور رحمدلی کا احساس رہے گا، سفر یا مذہبی رجحان بڑھے گا۔',
    10: 'عوامی زندگی میں پذیرائی ملے گی، ماں کی طرف سے حمایت حاصل ہوگی۔',
    11: 'دوستوں سے خوشی اور آمدنی میں اضافہ ہوگا، خواہشات پوری ہونے کے آثار ہیں۔',
    12: 'اکیلاپن یا زیادہ سوچ بچار رہے گی، نیند اور آرام کا خاص خیال رکھیں۔',
  },
  Mars: {
    1: 'توانائی اور جوش میں اضافہ ہوگا، لیکن غصے اور جلد بازی سے گریز کریں۔',
    2: 'خرچوں میں اضافہ ممکن ہے، خاندان میں بحث سے بچیں اور زبان پر قابو رکھیں۔',
    3: 'ہمت اور بہادری عروج پر ہوگی، مقابلے میں کامیابی اور بھائیوں سے تعاون ملے گا۔',
    4: 'گھریلو ماحول میں تناؤ ممکن ہے، جائیداد کے معاملات میں احتیاط برتیں۔',
    5: 'اولاد یا محبت کے معاملات میں جذباتی تیزی رہے گی، سوچ سمجھ کر فیصلہ کریں۔',
    6: 'مخالفین اور بیماریوں پر غلبہ ملے گا، مقابلے میں فتح کا اچھا وقت ہے۔',
    7: 'شراکت داری اور ازدواجی زندگی میں رگڑ ممکن ہے، صبر اور نرمی سے کام لیں۔',
    8: 'حادثات یا اچانک مسائل سے بچاؤ کی ضرورت ہے، احتیاط لازمی ہے۔',
    9: 'قسمت کے لیے جدوجہد کرنی پڑے گی، سفر میں احتیاط رکھیں۔',
    10: 'کیریئر میں محنت رنگ لائے گی، لیکن اختیار میں سختی نہ دکھائیں۔',
    11: 'محنت سے آمدنی میں اضافہ ہوگا، خواہشات کی تکمیل کے لیے تیزی رہے گی۔',
    12: 'اخراجات اور چھپے مسائل بڑھ سکتے ہیں، غصے پر قابو رکھنا ضروری ہے۔',
  },
  Mercury: {
    1: 'ذہنی چستی اور بات چیت میں مہارت بڑھے گی، نئے خیالات سامنے آئیں گے۔',
    2: 'مالی معاملات میں سمجھداری رہے گی، تحریر و تجارت میں فائدہ ممکن ہے۔',
    3: 'ہمت اور رابطوں میں اضافہ ہوگا، مختصر سفر فائدہ مند ثابت ہوں گے۔',
    4: 'گھریلو معاملات میں سمجھداری سے فیصلے ہوں گے، تعلیم سے متعلق خبر مل سکتی ہے۔',
    5: 'تخلیقی صلاحیت اور سیکھنے کا بہترین وقت ہے، اولاد سے اچھی بات چیت رہے گی۔',
    6: 'مقابلے میں ذہانت سے کامیابی ملے گی، تفصیلات پر خاص توجہ دیں۔',
    7: 'شراکت داری میں بات چیت اور معاہدے فائدہ مند ثابت ہوں گے۔',
    8: 'پوشیدہ معلومات سامنے آ سکتی ہیں، دستاویزات کا خاص خیال رکھیں۔',
    9: 'علم اور مذہبی موضوعات میں دلچسپی بڑھے گی، اچھی خبر ملنے کا امکان ہے۔',
    10: 'کیریئر میں ذہانت سے کامیابی ملے گی، بات چیت اور پیشکش کا ہنر کام آئے گا۔',
    11: 'نیٹ ورکنگ اور دوستی سے فائدہ ہوگا، آمدنی کے نئے ذرائع بن سکتے ہیں۔',
    12: 'زیادہ سوچ بچار یا الجھن محسوس ہو سکتی ہے، فیصلے میں جلدی نہ کریں۔',
  },
  Jupiter: {
    1: 'قسمت اور خوش بختی کا ساتھ ملے گا، شخصیت میں وقار اور اعتماد بڑھے گا۔',
    2: 'مالی حالت میں بہتری اور خاندان میں خوشحالی رہے گی، باتوں میں دانائی جھلکے گی۔',
    3: 'ہمت اور حوصلہ بلند رہے گا، لیکن زیادہ خود اعتمادی سے بچیں۔',
    4: 'گھریلو سکون اور برکت رہے گی، جائیداد یا گھر سے متعلق اچھی خبر ممکن ہے۔',
    5: 'اولاد، تعلیم اور علم میں برکت رہے گی، خوشخبری ملنے کا امکان ہے۔',
    6: 'مقابلوں پر غلبہ ملے گا، صحت میں بہتری اور قرض میں کمی کے آثار ہیں۔',
    7: 'شراکت داری اور ازدواجی زندگی میں خوشحالی اور برکت رہے گی۔',
    8: 'غیبی اور روحانی معاملات میں دلچسپی بڑھے گی، وراثت سے متعلق خبر ممکن ہے۔',
    9: 'قسمت عروج پر ہوگی، سفر، مذہب اور اعلیٰ تعلیم میں فائدہ ملے گا۔',
    10: 'کیریئر میں ترقی اور عزت ملے گی، سماجی مقام میں اضافہ ہوگا۔',
    11: 'آمدنی اور خواہشات کی تکمیل ہوگی، دوستوں سے فائدہ ملے گا۔',
    12: 'اخراجات میں اضافہ ممکن ہے، لیکن روحانی سکون اور اندرونی ترقی کا وقت ہے۔',
  },
  Venus: {
    1: 'کشش اور دلکشی میں اضافہ ہوگا، رشتوں میں محبت کا احساس بڑھے گا۔',
    2: 'مالی خوشحالی اور خاندان میں محبت رہے گی، نئی خریداری کا امکان ہے۔',
    3: 'تخلیقی صلاحیت اور فنی ذوق میں اضافہ ہوگا، دوستوں سے خوشگوار وقت ملے گا۔',
    4: 'گھر میں آرام و آسائش رہے گی، سجاوٹ یا نئی چیزوں کی خواہش بڑھے گی۔',
    5: 'محبت اور رومانس کا بہترین وقت ہے، تخلیقی کاموں میں کامیابی ملے گی۔',
    6: 'تعلقات میں معمولی رنجش ممکن ہے، لیکن مجموعی طور پر وقت خوشگوار رہے گا۔',
    7: 'شراکت داری اور ازدواجی زندگی میں محبت اور تعاون بڑھے گا۔',
    8: 'جذباتی گہرائی اور قربت کا احساس رہے گا، مالی شراکت میں احتیاط رکھیں۔',
    9: 'سفر اور خوشگوار تجربات کا امکان ہے، رومانوی موقع بھی مل سکتا ہے۔',
    10: 'کیریئر میں دلکش شخصیت کا فائدہ ملے گا، تخلیقی میدان میں پذیرائی ہوگی۔',
    11: 'دوستی اور خواہشات کی تکمیل ہوگی، سماجی زندگی میں رونق رہے گی۔',
    12: 'نجی محبت یا خفیہ تعلقات کا رجحان رہے گا، آرام و تفریح پر خرچ بڑھے گا۔',
  },
  Saturn: {
    1: 'ذمہ داریوں کا بوجھ محسوس ہوگا، لیکن صبر اور نظم و ضبط سے کامیابی ملے گی۔',
    2: 'مالی معاملات میں احتیاط ضروری ہے، خاندان میں سنجیدہ ماحول رہے گا۔',
    3: 'محنت سے ہمت اور استقامت بڑھے گی، سست روی کے بعد نتیجہ ضرور ملے گا۔',
    4: 'گھریلو ذمہ داریاں بڑھیں گی، ماں کی صحت کا خاص خیال رکھیں۔',
    5: 'تعلیم یا اولاد سے متعلق معاملات میں صبر درکار ہوگا۔',
    6: 'مقابلوں میں سخت محنت سے فتح ملے گی، لیکن تھکاوٹ کا خیال رکھیں۔',
    7: 'شراکت داری میں سنجیدگی اور ذمہ داری بڑھے گی، صبر آزمائی ممکن ہے۔',
    8: 'مشکل وقت اور تاخیر کا سامنا ہو سکتا ہے، صحت میں احتیاط ضروری ہے۔',
    9: 'قسمت میں تاخیر لیکن مستقل مزاجی سے دیرپا فائدہ ملے گا، بزرگوں کا احترام کریں۔',
    10: 'کیریئر میں سخت محنت لگے گی، لیکن نتیجہ دیرپا اور مضبوط ہوگا۔',
    11: 'آہستہ آہستہ مگر یقینی آمدنی اور فوائد میں اضافہ ہوگا۔',
    12: 'تنہائی، تھکاوٹ یا اخراجات میں اضافہ ممکن ہے، آرام اور احتیاط ضروری ہے۔',
  },
  Rahu: {
    1: 'خواہشات اور بےچینی میں اضافہ ہوگا، غیر روایتی راستے اپنانے کا رجحان بڑھے گا۔',
    2: 'مالی معاملات میں غیر یقینی صورتحال رہے گی، خاندان میں الجھن سے بچیں۔',
    3: 'ہمت اور جرات میں اضافہ ہوگا، لیکن جلد بازی سے نقصان ممکن ہے۔',
    4: 'گھریلو ماحول میں بے چینی رہے گی، ذہنی سکون کے لیے مراقبہ مفید ہوگا۔',
    5: 'اولاد یا تعلیم کے معاملات میں الجھن رہے گی، غیر واضح فیصلوں سے بچیں۔',
    6: 'مخالفین پر غیر متوقع فتح ملے گی، لیکن صحت میں احتیاط ضروری ہے۔',
    7: 'شراکت داری میں دھوکہ یا غلط فہمی سے بچیں، وضاحت سے بات کریں۔',
    8: 'پراسرار اور غیر متوقع واقعات کا امکان ہے، صبر اور ہوشیاری ضروری ہے۔',
    9: 'بیرون ملک یا غیر روایتی مذہبی رجحانات میں دلچسپی بڑھے گی۔',
    10: 'کیریئر میں اچانک تبدیلی یا غیر متوقع موقع مل سکتا ہے۔',
    11: 'آمدنی میں اضافہ ممکن ہے، لیکن ذرائع غیر یقینی ہو سکتے ہیں۔',
    12: 'پوشیدہ اخراجات یا دشمنوں سے چوکنا رہیں، غیر ملکی روابط بن سکتے ہیں۔',
  },
  Ketu: {
    1: 'اندرونی الجھن اور بے دلی کا احساس رہے گا، روحانی رجحان بڑھے گا۔',
    2: 'خاندان یا مال سے بے رغبتی رہے گی، خرچ میں احتیاط ضروری ہے۔',
    3: 'ہمت میں کمی یا بھائیوں سے دوری کا احساس ممکن ہے۔',
    4: 'گھریلو معاملات سے لاتعلقی کا احساس رہے گا، تنہائی ذہنی سکون میں مددگار ہوگی۔',
    5: 'اولاد یا تخلیقی کاموں میں دلچسپی کم ہو سکتی ہے، روحانیت کی طرف رجحان بڑھے گا۔',
    6: 'پوشیدہ مخالفین پر غلبہ ملے گا، لیکن صحت میں غیر واضح مسائل کا خیال رکھیں۔',
    7: 'تعلقات میں دوری یا لاتعلقی کا احساس رہے گا، صبر اور سمجھ بوجھ ضروری ہے۔',
    8: 'غیر متوقع تبدیلی یا نقصان کا امکان ہے، روحانی رجحان میں اضافہ ہوگا۔',
    9: 'مذہبی اور روحانی معاملات میں گہری دلچسپی رہے گی، اچانک سفر ممکن ہے۔',
    10: 'کیریئر میں الجھن یا بے دلی محسوس ہو سکتی ہے، لیکن روحانی کاموں میں کامیابی ملے گی۔',
    11: 'خواہشات میں تبدیلی آ سکتی ہے، دوستوں سے دوری کا احساس ممکن ہے۔',
    12: 'روحانی ترقی اور اندرونی سکون کا بہترین وقت ہے، تنہائی مفید ثابت ہوگی۔',
  },
};

const TRANSIT_PREDICTIONS_EN = {
  Sun: {
    1: 'Self-confidence and leadership drive will grow, but pay some attention to health and temper.',
    2: 'Financial matters and family conversations will need attention — keep your tone gentle.',
    3: "Courage and hard work will pay off; ties with siblings will grow stronger.",
    4: "Some disturbance in home life is likely — watch your mother's health and your own peace of mind.",
    5: 'Energy for study and creative work stays high; good news from children is possible.',
    6: "You'll get a chance to overcome rivals and clear debts, but workload will also increase.",
    7: 'Avoid ego and rigidity in partnerships and married life — balance is essential.',
    8: 'Sudden changes and unexpected situations are possible — take care with health.',
    9: 'Fortune favors you; benefit from father and religious inclination, and travel is likely.',
    10: 'Notable success and respect in career; social standing will rise.',
    11: 'Income and gains will increase — a good time for long-held wishes to be fulfilled.',
    12: 'Expenses will rise and you may feel tired or isolated — rest is important.',
  },
  Moon: {
    1: 'A mentally sensitive time — rest and good sleep are needed for peace of mind.',
    2: 'Emotional attachment to family and money matters will run high — watch your diet.',
    3: 'Courage and morale stay high; talking with close ones will prove helpful.',
    4: 'Happy moments tied to home and mother are likely; peace of mind improves.',
    5: 'Matters of the heart get heard — a pleasant time for love and creative pursuits.',
    6: 'Mental stress or minor illness is possible — face competition with courage.',
    7: 'Gentleness and love mark relationships; cooperation in partnership grows.',
    8: 'Emotional ups and downs continue; unexpected news may arrive — be patient.',
    9: 'A sense of good fortune and compassion prevails; travel or religious inclination increases.',
    10: 'Recognition in public life; support from your mother is likely.',
    11: 'Joy from friends and a rise in income; signs point to wishes being fulfilled.',
    12: 'Loneliness or overthinking may occur — take special care of sleep and rest.',
  },
  Mars: {
    1: 'Energy and enthusiasm rise, but avoid anger and hastiness.',
    2: 'Expenses may increase — avoid arguments at home and watch your words.',
    3: 'Courage and bravery peak; success in competition and support from siblings.',
    4: 'Tension at home is possible — be careful with property matters.',
    5: 'Emotional intensity around children or love matters — decide thoughtfully.',
    6: 'Victory over rivals and illness; a good time to win in competition.',
    7: 'Friction possible in partnership and married life — use patience and gentleness.',
    8: 'Guard against accidents or sudden problems — caution is essential.',
    9: "You'll have to work hard for fortune; be careful while travelling.",
    10: "Hard work pays off in career, but don't be harsh with authority.",
    11: 'Income rises through effort; speed helps fulfil desires.',
    12: 'Expenses and hidden problems may increase — keeping temper in check is important.',
  },
  Mercury: {
    1: 'Mental sharpness and communication skills improve; new ideas emerge.',
    2: 'Good judgment in financial matters; writing and trade can be profitable.',
    3: 'Courage and networking increase; short trips prove useful.',
    4: 'Wise decisions at home; news related to education is possible.',
    5: 'An excellent time for creativity and learning; good conversations with children.',
    6: 'Intelligence brings success in competition; pay close attention to detail.',
    7: 'Discussions and agreements in partnership prove beneficial.',
    8: 'Hidden information may surface — take special care with documents.',
    9: 'Interest in knowledge and religious topics grows; good news is likely.',
    10: 'Intelligence brings career success; communication and presentation skills help.',
    11: 'Networking and friendship bring benefit; new sources of income may open up.',
    12: "Overthinking or confusion is possible — don't rush decisions.",
  },
  Jupiter: {
    1: 'Good fortune accompanies you; dignity and confidence in personality grow.',
    2: 'Financial improvement and prosperity in the family; wisdom shows in your words.',
    3: 'Courage and morale stay high, but avoid over-confidence.',
    4: 'Domestic peace and blessing prevail; good news about property or home is possible.',
    5: 'Blessings around children, education and knowledge; good news is likely.',
    6: 'Victory over rivals; health improves and debts may reduce.',
    7: 'Prosperity and blessing mark partnership and married life.',
    8: 'Interest in occult and spiritual matters grows; news about inheritance is possible.',
    9: 'Fortune peaks; benefit from travel, religion and higher education.',
    10: 'Progress and respect in career; social standing rises.',
    11: 'Income rises and wishes are fulfilled; benefit from friends.',
    12: "Expenses may rise, but it's a time for spiritual peace and inner growth.",
  },
  Venus: {
    1: 'Charm and attractiveness increase; a stronger sense of love in relationships.',
    2: 'Financial prosperity and family love prevail; new purchases are likely.',
    3: 'Creativity and artistic taste increase; a pleasant time with friends.',
    4: 'Comfort and ease at home; desire for decor or new things grows.',
    5: 'An excellent time for love and romance; success in creative work.',
    6: 'Minor friction in relationships is possible, but overall the time stays pleasant.',
    7: 'Love and cooperation grow in partnership and married life.',
    8: 'Emotional depth and closeness are felt; be careful with financial partnerships.',
    9: 'Travel and pleasant experiences are likely; a romantic opportunity may also arise.',
    10: "A charming personality benefits your career; recognition in creative fields.",
    11: 'Friendship and desires are fulfilled; social life gains vibrancy.',
    12: 'A tendency toward private love or secret relationships; spending on comfort and leisure rises.',
  },
  Saturn: {
    1: 'A sense of heavy responsibility, but patience and discipline bring success.',
    2: 'Caution is needed in financial matters; a serious mood prevails at home.',
    3: 'Hard work builds courage and persistence; results come after some delay.',
    4: "Domestic responsibilities increase — pay special attention to your mother's health.",
    5: 'Patience is needed in matters related to education or children.',
    6: 'Hard-won victory in competition, but watch for fatigue.',
    7: 'Seriousness and responsibility grow in partnership; a testing time is possible.',
    8: 'A difficult period and delays may occur — health needs care.',
    9: 'Fortune comes with delay but steady effort brings lasting benefit; respect your elders.',
    10: 'Career demands hard work, but the result will be lasting and strong.',
    11: 'Slow but sure growth in income and gains.',
    12: 'Solitude, fatigue or rising expenses are possible — rest and caution are needed.',
  },
  Rahu: {
    1: 'Desires and restlessness increase; a tendency toward unconventional paths grows.',
    2: 'Uncertainty in financial matters; avoid confusion within the family.',
    3: 'Courage and daring increase, but haste could cause loss.',
    4: 'Restlessness at home — meditation will help mental peace.',
    5: 'Confusion around children or education — avoid unclear decisions.',
    6: 'Unexpected victory over rivals, but take care with health.',
    7: 'Beware deception or misunderstanding in partnership — communicate clearly.',
    8: 'Mysterious and unexpected events are possible — patience and alertness are needed.',
    9: 'Interest grows in foreign connections or unconventional religious inclinations.',
    10: 'A sudden change or unexpected opportunity may appear in career.',
    11: 'Income may rise, but the source could be uncertain.',
    12: 'Watch for hidden expenses or enemies; foreign connections may form.',
  },
  Ketu: {
    1: 'A sense of inner confusion or indifference; spiritual inclination increases.',
    2: 'Detachment from family or money; caution is needed with spending.',
    3: 'A dip in courage or distance from siblings is possible.',
    4: 'A sense of detachment from domestic matters; solitude aids peace of mind.',
    5: 'Interest in children or creative work may dip; inclination toward spirituality grows.',
    6: 'Victory over hidden rivals, but watch for unclear health issues.',
    7: 'A sense of distance or detachment in relationships — patience and understanding are needed.',
    8: 'Unexpected change or loss is possible; spiritual inclination increases.',
    9: 'Deep interest in religious and spiritual matters; sudden travel is possible.',
    10: 'Confusion or indifference in career is possible, but success comes in spiritual pursuits.',
    11: 'Desires may shift; a sense of distance from friends is possible.',
    12: 'An excellent time for spiritual growth and inner peace; solitude proves useful.',
  },
};

const TRANSIT_PREDICTIONS = { ur: TRANSIT_PREDICTIONS_UR, en: TRANSIT_PREDICTIONS_EN, hi: TRANSIT_PREDICTIONS_EN };
const TRANSIT_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function planetLabel(planet, lang) {
  return lang === 'ur' ? (PLANET_NAME_URDU[planet] || planet) : planet; // hi: english name fallback for now
}

const DIGNITY_MODIFIER_UR = {
  exalted: ' یہ سیارہ اپنی اعلیٰ (exalted) حالت میں ہے، اس لیے اثرات معمول سے زیادہ مضبوط اور مثبت ہوں گے۔',
  own: ' یہ سیارہ اپنی ہی راشی میں ہے، اس لیے اثرات مستحکم اور بھرپور رہیں گے۔',
  debilitated: ' یہ سیارہ کمزور (نیچ) حالت میں ہے، اس لیے اثرات میں غیر یقینی یا کمزوری محسوس ہو سکتی ہے، اضافی احتیاط رکھیں۔',
  retrograde: ' یہ سیارہ ابھی رجعت (retrograde) میں بھی ہے، تو اس کا اثر تاخیر سے یا اندرونی/دہرائے جانے والے انداز میں محسوس ہوگا۔',
};
const DIGNITY_MODIFIER_EN = {
  exalted: ' This planet is in its exalted state, so the effects will be stronger and more positive than usual.',
  own: ' This planet is in its own sign, so the effects will be stable and full.',
  debilitated: ' This planet is in a weak (debilitated) state, so the effects may feel uncertain or weak — take extra care.',
  retrograde: ' This planet is also currently retrograde, so its effect will be felt with delay or in a repeated/internal manner.',
};
const DIGNITY_MODIFIER = { ur: DIGNITY_MODIFIER_UR, en: DIGNITY_MODIFIER_EN, hi: DIGNITY_MODIFIER_EN };

function dignityModifier(detail, lang) {
  const dict = DIGNITY_MODIFIER[lang] || DIGNITY_MODIFIER_EN;
  let s = '';
  if (detail && detail.dignity === 'exalted') s += dict.exalted;
  else if (detail && detail.dignity === 'own') s += dict.own;
  else if (detail && detail.dignity === 'debilitated') s += dict.debilitated;
  if (detail && detail.isRetrograde) s += dict.retrograde;
  return s;
}

function buildCurrentTransitLines(gocharDetails, lang) {
  lang = normLang(lang);
  const table = TRANSIT_PREDICTIONS[lang];
  const lines = [];
  for (const planet of TRANSIT_ORDER) {
    const detail = gocharDetails[planet];
    if (!detail || !detail.house) continue;
    const house = detail.house;
    const label = planetLabel(planet, lang);
    const effect = (table[planet] && table[planet][house]) || '';
    const modifier = dignityModifier(detail, lang);
    const text = lang === 'ur'
      ? `${label} اس وقت آپ کے ${ordinal(house, lang)} گھر میں گردش کر رہا ہے۔ ${effect}${modifier}`
      : `${label} is currently transiting your ${ordinal(house, lang)} house. ${effect}${modifier}`;
    lines.push({ planet, planetLabel: label, house, text });
  }
  return lines;
}

// Classical Parashari "khaas nazar" (special drishti) offsets — language-neutral.
const ASPECT_OFFSETS = {
  Sun: [6], Moon: [6], Mercury: [6], Venus: [6],
  Mars: [3, 6, 7], Jupiter: [4, 6, 8], Saturn: [2, 6, 9], Rahu: [4, 6, 8], Ketu: [4, 6, 8],
};

function buildTransitAspectLines(gocharDetails, lang) {
  lang = normLang(lang);
  const table = TRANSIT_PREDICTIONS[lang];
  const sig = HOUSE_SIGNIFICATION[lang];
  const lines = [];
  for (const planet of TRANSIT_ORDER) {
    const detail = gocharDetails[planet];
    if (!detail || !detail.house) continue;
    const offsets = ASPECT_OFFSETS[planet] || [6];
    const label = planetLabel(planet, lang);
    const modifier = dignityModifier(detail, lang);
    for (const offset of offsets) {
      const aspectedHouse = ((detail.house - 1 + offset) % 12) + 1;
      const signification = sig[aspectedHouse] || '';
      const effect = (table[planet] && table[planet][aspectedHouse]) || '';
      const text = lang === 'ur'
        ? `${label} کی نظر آپ کے ${ordinal(aspectedHouse, lang)} گھر پر پڑ رہی ہے — یہ گھر ${signification} سے متعلق ہے۔ اس نظر کے زیرِ اثر: ${effect}${modifier}`
        : `${label}'s aspect is falling on your ${ordinal(aspectedHouse, lang)} house — this house relates to ${signification}. Under this aspect: ${effect}${modifier}`;
      lines.push({ planet, planetLabel: label, fromHouse: detail.house, aspectedHouse, text });
    }
  }
  return lines;
}

function buildCombinedTransitPredictions(gocharDetails, lang) {
  lang = normLang(lang);
  const table = TRANSIT_PREDICTIONS[lang];
  const sig = HOUSE_SIGNIFICATION[lang];
  const cards = [];
  for (const planet of TRANSIT_ORDER) {
    const detail = gocharDetails[planet];
    if (!detail || !detail.house) continue;
    const label = planetLabel(planet, lang);
    const modifier = dignityModifier(detail, lang);
    const house = detail.house;
    const transitEffect = (table[planet] && table[planet][house]) || '';

    const offsets = ASPECT_OFFSETS[planet] || [6];
    const aspects = offsets.map((offset) => {
      const aspectedHouse = ((house - 1 + offset) % 12) + 1;
      const signification = sig[aspectedHouse] || '';
      const effect = (table[planet] && table[planet][aspectedHouse]) || '';
      const text = lang === 'ur'
        ? `${ordinal(aspectedHouse, lang)} گھر پر نظر (${signification}): ${effect}`
        : `Aspect on ${ordinal(aspectedHouse, lang)} house (${signification}): ${effect}`;
      return { aspectedHouse, text };
    });

    const transitText = lang === 'ur'
      ? `${label} اس وقت آپ کے ${ordinal(house, lang)} گھر میں گردش کر رہا ہے۔ ${transitEffect}${modifier}`
      : `${label} is currently transiting your ${ordinal(house, lang)} house. ${transitEffect}${modifier}`;

    cards.push({ planet, planetLabel: label, house, transitText, aspects });
  }
  return cards;
}

function buildTransitLinesFor(gocharDetails, planetList, lang) {
  lang = normLang(lang);
  const table = TRANSIT_PREDICTIONS[lang];
  const lines = [];
  for (const planet of planetList) {
    const detail = gocharDetails[planet];
    if (!detail || !detail.house) continue;
    const house = detail.house;
    const label = planetLabel(planet, lang);
    const effect = (table[planet] && table[planet][house]) || '';
    const modifier = dignityModifier(detail, lang);
    lines.push({ planet, planetLabel: label, house, text: `${label}: ${effect}${modifier}` });
  }
  return lines;
}

const MONTHLY_PLANETS = ['Sun', 'Mercury', 'Venus', 'Mars'];
const YEARLY_PLANETS = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];

const MONTHLY_NOTE = {
  ur: 'یہ رجحان سورج، عطارد، زہرہ اور مریخ کی موجودہ راشی پر مبنی ہے — یہ سیارے تقریباً 3 سے 7 ہفتوں میں اپنی راشی بدلتے ہیں، اس لیے یہ اندازہ اگلے کچھ ہفتوں کے لیے قابلِ اعتماد ہے۔',
  en: 'This trend is based on the current sign positions of the Sun, Mercury, Venus and Mars — these planets change sign roughly every 3 to 7 weeks, so this estimate is reliable for the next few weeks.',
};
MONTHLY_NOTE.hi = MONTHLY_NOTE.en;

function buildMonthlyOutlook(gocharDetails, lang) {
  lang = normLang(lang);
  const lines = buildTransitLinesFor(gocharDetails, MONTHLY_PLANETS, lang);
  return { lines, note: MONTHLY_NOTE[lang] };
}

const YEARLY_NOTE = {
  ur: 'یہ رجحان مشتری، زحل، راہو اور کیتو کی موجودہ راشی پر مبنی ہے — یہ سیارے اپنی راشی میں تقریباً 1 سے 2.5 سال تک رہتے ہیں، اس لیے یہ اندازہ پورے سال کے لیے قابلِ اعتماد ہے۔',
  en: 'This trend is based on the current sign positions of Jupiter, Saturn, Rahu and Ketu — these planets stay in a sign for roughly 1 to 2.5 years, so this estimate is reliable for the whole year.',
};
YEARLY_NOTE.hi = YEARLY_NOTE.en;

function buildYearlyOutlook(gocharDetails, dasha, sadeSati, lang) {
  lang = normLang(lang);
  const lines = buildTransitLinesFor(gocharDetails, YEARLY_PLANETS, lang);
  const extra = [];

  if (dasha && dasha.mahadasha && dasha.mahadasha.lord) {
    extra.push(lang === 'ur'
      ? `آپ کی موجودہ مہادشا ${dasha.mahadasha.lord} کی ہے — یہ کئی سالوں پر محیط دور آپ کی مجموعی زندگی کی سمت طے کر رہا ہے۔`
      : `Your current Mahadasha is of ${dasha.mahadasha.lord} — this multi-year period is shaping the overall direction of your life.`);
  }
  if (sadeSati && sadeSati.is_in_sade_sati) {
    extra.push(lang === 'ur'
      ? `آپ اس وقت ساڑھ ساتی کے "${sadeSati.transit_phase || ''}" مرحلے میں بھی ہیں — یہ ذمہ داری، صبر اور نظم و ضبط سکھانے کا دور ہے، سال بھر اسی حساب سے منصوبہ بندی کریں۔`
      : `You are also currently in the "${sadeSati.transit_phase || ''}" phase of Sade Sati — this is a period that teaches responsibility, patience and discipline; plan your year accordingly.`);
  } else {
    extra.push(lang === 'ur'
      ? 'اچھی بات یہ ہے کہ اس وقت آپ ساڑھ ساتی میں نہیں ہیں، تو زحل کی طرف سے اضافی دباؤ کی فکر نہ کریں۔'
      : "The good news is that you are not in Sade Sati right now, so don't worry about extra pressure from Saturn.");
  }

  return { lines, extra, note: YEARLY_NOTE[lang] };
}

// ---------------------------------------------------------------------------
// Remedies — Islamic-style upay per planet (sadaqa/amal, koi mantra/devta
// naam nahi). "Day" sirf classical hisabi convention hai, ibadat nahi.
// ---------------------------------------------------------------------------
const PLANET_REMEDY_UR = {
  Sun: { day: 'اتوار', text: 'اتوار کے دن گندم یا گڑ کا صدقہ کرنا، اللہ کا شکر ادا کرنا، اور غرور و تکبر سے بچنے کی کوشش کرنا مفید سمجھا جاتا ہے۔' },
  Moon: { day: 'پیر', text: 'پیر کے دن دودھ، چاول یا سفید چیزوں کا صدقہ کرنا، اور ذہنی سکون کے لیے نماز میں توجہ اور زیادہ ذکرِ الٰہی کا اہتمام کرنا مفید سمجھا جاتا ہے۔' },
  Mars: { day: 'منگل', text: 'منگل کے دن مسور کی دال یا سرخ چیزوں کا صدقہ کرنا، اور غصہ آنے پر "اعوذ باللہ من الشیطان الرجیم" پڑھ کر وضو کر لینا (نبی کریمﷺ کی سکھائی ہوئی سنت) مفید سمجھا جاتا ہے۔' },
  Mercury: { day: 'بدھ', text: 'بدھ کے دن سبز چیزوں کا صدقہ کرنا، اور زبان کی حفاظت، سچ بولنے اور سوچ سمجھ کر بات کرنے کا اہتمام کرنا مفید سمجھا جاتا ہے۔' },
  Jupiter: { day: 'جمعرات', text: 'جمعرات کے دن زرد چیزیں، چنے کی دال یا کیلے کا صدقہ کرنا، اور بزرگوں، والدین اور اساتذہ کا احترام کرنا مفید سمجھا جاتا ہے۔' },
  Venus: { day: 'جمعہ', text: 'جمعہ کے دن سفید چیزیں یا چینی کا صدقہ کرنا، اور حلال رزق اور نکاح جیسے معاملات میں تقویٰ کا خیال رکھنا مفید سمجھا جاتا ہے۔' },
  Saturn: { day: 'ہفتہ', text: 'ہفتہ کے دن کالا تل یا سرسوں کے تیل کا صدقہ کرنا، غریبوں اور مزدوروں کی مدد کرنا، اور زیادہ استغفار، صبر اور نماز کی پابندی کا اہتمام کرنا مفید سمجھا جاتا ہے۔' },
  Rahu: { day: 'ہفتہ', text: 'کمبل یا کالی/نیلی چیزوں کا صدقہ کرنا، وہم اور بے صبری سے بچنا، اور زیادہ استغفار کرنا مفید سمجھا جاتا ہے۔' },
  Ketu: { day: 'منگل', text: 'کمبل یا تل کا صدقہ کرنا، اور نوافل اور تلاوتِ قرآن پر توجہ دینا مفید سمجھا جاتا ہے۔' },
};
const PLANET_REMEDY_EN = {
  Sun: { day: 'Sunday', text: "Giving charity of wheat or jaggery on Sunday, thanking Allah, and trying to avoid pride and arrogance is considered beneficial." },
  Moon: { day: 'Monday', text: 'Giving charity of milk, rice or white items on Monday, and focusing on prayer and more remembrance of Allah for peace of mind is considered beneficial.' },
  Mars: { day: 'Tuesday', text: 'Giving charity of masoor lentils or red items on Tuesday, and — when angry — saying "A’oodhu billahi minash-shaytanir-rajeem" and performing wudu (a Sunnah taught by the Prophet ﷺ) is considered beneficial.' },
  Mercury: { day: 'Wednesday', text: 'Giving charity of green items on Wednesday, and guarding your tongue, speaking truthfully and thinking before speaking is considered beneficial.' },
  Jupiter: { day: 'Thursday', text: 'Giving charity of yellow items, chickpea lentils or bananas on Thursday, and respecting elders, parents and teachers is considered beneficial.' },
  Venus: { day: 'Friday', text: 'Giving charity of white items or sugar on Friday, and being mindful of piety in matters like halal earnings and marriage is considered beneficial.' },
  Saturn: { day: 'Saturday', text: 'Giving charity of black sesame or mustard oil on Saturday, helping the poor and laborers, and focusing more on seeking forgiveness, patience and regular prayer is considered beneficial.' },
  Rahu: { day: 'Saturday', text: 'Giving charity of a blanket or dark/blue items, avoiding superstition and impatience, and seeking more forgiveness is considered beneficial.' },
  Ketu: { day: 'Tuesday', text: 'Giving charity of a blanket or sesame seeds, and focusing on voluntary prayers and Quran recitation is considered beneficial.' },
};
const PLANET_REMEDY = { ur: PLANET_REMEDY_UR, en: PLANET_REMEDY_EN, hi: PLANET_REMEDY_EN };

function buildRemedies(facts, lang) {
  lang = normLang(lang);
  const remedy = PLANET_REMEDY[lang];
  const items = [];

  if (facts.hasMangalDosha) {
    items.push({ key: 'mangal', title: lang === 'ur' ? 'منگل دوش' : 'Mangal Dosha', text: remedy.Mars.text });
  }
  if (facts.hasKaalSarpDosha) {
    items.push({
      key: 'kaalsarp',
      title: lang === 'ur' ? 'کال سرپ یوگ' : 'Kaal Sarp Yoga',
      text: lang === 'ur'
        ? 'کمبل یا تل کا صدقہ کرنا، زیادہ استغفار کرنا، اور صبر سے معاملات کو وقت دینا مفید سمجھا جاتا ہے — یہ یوگ ہر معاملے کو نہیں روکتا، صرف نتیجہ تھوڑی تاخیر سے آتا ہے۔'
        : "Giving charity of a blanket or sesame seeds, seeking more forgiveness, and giving matters time with patience is considered beneficial — this yoga doesn't block everything, it just means results come a little later.",
    });
  }
  if (facts.isInSadeSati) {
    items.push({
      key: 'sadesati',
      title: lang === 'ur'
        ? `ساڑھ ساتی${facts.sadeSatiPhase ? ' — ' + facts.sadeSatiPhase + ' مرحلہ' : ''}`
        : `Sade Sati${facts.sadeSatiPhase ? ' — ' + facts.sadeSatiPhase + ' phase' : ''}`,
      text: remedy.Saturn.text,
    });
  }
  for (const planet of facts.weakNatalPlanets || []) {
    const r = remedy[planet];
    if (!r) continue;
    const label = planetLabel(planet, lang);
    items.push({
      key: `weak-${planet}`,
      title: lang === 'ur' ? `${label} کمزور (نیچ) حالت میں` : `${label} in a weak (debilitated) state`,
      text: r.text,
    });
  }

  if (items.length === 0) {
    items.push({
      key: 'none',
      title: lang === 'ur' ? 'کوئی خاص دوش نہیں' : 'No major affliction',
      text: lang === 'ur'
        ? 'آپ کی کنڈلی میں فی الحال کوئی سنگین دوش یا کمزور گرہ نظر نہیں آ رہا — عام صدقہ، نماز اور اچھے اعمال کی پابندی ہی کافی ہے۔'
        : 'There is currently no serious dosha or weak planet visible in your chart — sticking to ordinary charity, prayer and good deeds is enough.',
    });
  }

  items.push({
    key: 'disclaimer',
    title: lang === 'ur' ? 'نوٹ' : 'Note',
    text: lang === 'ur'
      ? 'یہ روایتی (classical) اصولوں پر مبنی عمومی مشورے ہیں، کسی پختہ ضمانت کے طور پر نہ لیں — اہم فیصلوں (خاص طور پر شادی یا صحت سے متعلق) میں کسی باعتماد عالم یا ماہر سے مشورہ ضرور کریں۔'
      : "These are general suggestions based on classical/traditional principles — don't take them as a firm guarantee; for important decisions (especially about marriage or health), do consult a trusted scholar or expert.",
  });

  return items;
}

// "Aaj ka din" ke liye har weekday ka classical hakim graha aur rang.
const WEEKDAY_LORD_UR = [
  { planet: 'Sun', name: 'اتوار', color: 'نارنجی یا سرخ' },
  { planet: 'Moon', name: 'پیر', color: 'سفید' },
  { planet: 'Mars', name: 'منگل', color: 'سرخ' },
  { planet: 'Mercury', name: 'بدھ', color: 'سبز' },
  { planet: 'Jupiter', name: 'جمعرات', color: 'زرد' },
  { planet: 'Venus', name: 'جمعہ', color: 'سفید یا گلابی' },
  { planet: 'Saturn', name: 'ہفتہ', color: 'کالا یا نیلا' },
];
const WEEKDAY_LORD_EN = [
  { planet: 'Sun', name: 'Sunday', color: 'orange or red' },
  { planet: 'Moon', name: 'Monday', color: 'white' },
  { planet: 'Mars', name: 'Tuesday', color: 'red' },
  { planet: 'Mercury', name: 'Wednesday', color: 'green' },
  { planet: 'Jupiter', name: 'Thursday', color: 'yellow' },
  { planet: 'Venus', name: 'Friday', color: 'white or pink' },
  { planet: 'Saturn', name: 'Saturday', color: 'black or blue' },
];
const WEEKDAY_LORD = { ur: WEEKDAY_LORD_UR, en: WEEKDAY_LORD_EN, hi: WEEKDAY_LORD_EN };

// Har life-area ka sab se numaindah (representative) ghar.
const CATEGORY_HOUSE_MAP = { career: 10, wealth: 2, health: 1, relationships: 7, family: 4 };

const HOUSE_LORD_OUTLOOK_UR = {
  exalted: 'بہت مضبوط حالت میں ہے، آج نتائج معمول سے بہتر رہنے کی توقع ہے',
  own: 'اپنی راشی میں مستحکم ہے، آج معاملات سنبھلے ہوئے محسوس ہوں گے',
  debilitated: 'کمزور حالت میں ہے، آج اس شعبے میں اضافی صبر اور احتیاط سے کام لیں',
  default: 'درمیانی حالت میں ہے، آج کا نتیجہ آپ کی اپنی کوشش پر زیادہ منحصر ہوگا',
};
const HOUSE_LORD_OUTLOOK_EN = {
  exalted: 'is in a very strong state — results today are expected to be better than usual',
  own: "is stable in its own sign — matters should feel well under control today",
  debilitated: 'is in a weak state — extra patience and caution are needed in this area today',
  default: "is in a middling state — today's result will depend more on your own effort",
};
const HOUSE_LORD_OUTLOOK = { ur: HOUSE_LORD_OUTLOOK_UR, en: HOUSE_LORD_OUTLOOK_EN, hi: HOUSE_LORD_OUTLOOK_EN };

function houseLordOutlookPhrase(lordDignity, lang) {
  const dict = HOUSE_LORD_OUTLOOK[lang] || HOUSE_LORD_OUTLOOK_EN;
  if (lordDignity === 'exalted') return dict.exalted;
  if (lordDignity === 'own') return dict.own;
  if (lordDignity === 'debilitated') return dict.debilitated;
  return dict.default;
}

function buildDailyRoutine(houses, moonDetail, targetDate, lang) {
  lang = normLang(lang);
  const table = TRANSIT_PREDICTIONS[lang];
  const areaLabels = LIFE_AREA_LABELS[lang];
  const moonHouse = moonDetail && moonDetail.house;
  const moonEffect = moonHouse ? ((table.Moon && table.Moon[moonHouse]) || '') : '';

  const categories = Object.keys(CATEGORY_HOUSE_MAP).map((key) => {
    const houseNum = CATEGORY_HOUSE_MAP[key];
    const houseData = houses[houseNum - 1];
    const label = areaLabels[key] || key;
    const outlook = houseLordOutlookPhrase(houseData.lordDignity, lang);
    const text = lang === 'ur'
      ? `${label} کے گھر (${ordinal(houseNum, lang)}) کا حاکم ${houseData.lord} ${outlook}۔${moonEffect ? ' آج چاند کے حساب سے مجموعی ماحول: ' + moonEffect : ''}`
      : `The lord of the ${label} house (${ordinal(houseNum, lang)}), ${houseData.lord}, ${outlook}.${moonEffect ? " Today's overall mood based on the Moon: " + moonEffect : ''}`;
    return { key, label, house: houseNum, text };
  });

  const weekdayTable = WEEKDAY_LORD[lang] || WEEKDAY_LORD_EN;
  const weekday = targetDate ? weekdayTable[targetDate.getDay()] : null;

  return { weekday, categories };
}

module.exports = {
  generateNarrative,
  generateNarrativeViaLLM,
  buildCurrentTransitLines,
  buildTransitAspectLines,
  buildCombinedTransitPredictions,
  buildMonthlyOutlook,
  buildYearlyOutlook,
  buildRemedies,
  buildDailyRoutine,
  // yoga-engine.js (aur mustaqbil ke doosre modules) isi normLang/planetLabel
  // ko reuse karte hain — taake lang-normalization aur planet-name-per-language
  // ka hisaab poori app mein sirf EK jagah se aaye.
  normLang,
  planetLabel,
  ordinal,
  LIFE_AREA_LABELS_UR,
  HOUSE_SIGNIFICATION_UR,
  // yoga-engine.js isi classical Parashari "khaas nazar" convention ko
  // reuse karta hai — taake poori app mein aspect ka hisaab hamesha EK hi
  // jagah se aaye, kabhi do jagah alag-alag na ho jaye.
  ASPECT_OFFSETS,
};
