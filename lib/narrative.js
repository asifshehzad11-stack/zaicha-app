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
 * TRANSIT_PREDICTIONS — classical Gochar-Phal (transit result) matrix.
 * Har graha (planet) ke liye alag alag 12 gharon ka asar likha gaya hai —
 * yani ye sirf "ye ghar ye represent karta hai" nahi batata, balke khud us
 * SITARAY (graha) ki apni fitrat (nature) ke hisab se us ghar mein us waqt
 * kaisa asar hoga, ye batata hai. Har graha ki apni tabiyat hai (jaise Zohal
 * = sabar/mehnat/taakheer, Mushtari = barkat/khushi, Mangal = josh/tez mizaji
 * waghera), is liye ek hi ghar (jaise 7th/shadi ka ghar) mein bhi Zohal ka
 * asar Mushtari se bilkul mukhtalif likha gaya hai — yehi woh cheez hai jo
 * pehle template mein missing thi.
 */
const TRANSIT_PREDICTIONS = {
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

const TRANSIT_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

/**
 * Ek graha ki current dignity/retrograde status ke mutabiq mool prediction
 * ke sath ek chhota sa modifier jorta hai — taake ye sirf "ghar" par nahi,
 * balke us waqt SITARAY ki apni halat par bhi mabni ho.
 */
function dignityModifier(detail) {
  let s = '';
  if (detail && detail.dignity === 'exalted') {
    s += ' یہ سیارہ اپنی اعلیٰ (exalted) حالت میں ہے، اس لیے اثرات معمول سے زیادہ مضبوط اور مثبت ہوں گے۔';
  } else if (detail && detail.dignity === 'own') {
    s += ' یہ سیارہ اپنی ہی راشی میں ہے، اس لیے اثرات مستحکم اور بھرپور رہیں گے۔';
  } else if (detail && detail.dignity === 'debilitated') {
    s += ' یہ سیارہ کمزور (نیچ) حالت میں ہے، اس لیے اثرات میں غیر یقینی یا کمزوری محسوس ہو سکتی ہے، اضافی احتیاط رکھیں۔';
  }
  if (detail && detail.isRetrograde) {
    s += ' یہ سیارہ ابھی رجعت (retrograde) میں بھی ہے، تو اس کا اثر تاخیر سے یا اندرونی/دہرائے جانے والے انداز میں محسوس ہوگا۔';
  }
  return s;
}

/**
 * gocharDetails: { "Sun": {house, rasiId, dignity, isRetrograde}, ... }
 * (astro-engine.buildZaichaData() ke gochar.details se aata hai).
 *
 * Har graha ke liye uski apni fitrat ke mutabiq — TRANSIT_PREDICTIONS table
 * se — asal prediction banata hai (na ke sirf "ye ghar ye represent karta
 * hai" wali generic line), aur dignity/retrograde modifier bhi jorta hai.
 */
function buildCurrentTransitLines(gocharDetails) {
  const lines = [];
  for (const planet of TRANSIT_ORDER) {
    const detail = gocharDetails[planet];
    if (!detail || !detail.house) continue;
    const house = detail.house;
    const label = PLANET_NAME_URDU[planet] || planet;
    const effect = (TRANSIT_PREDICTIONS[planet] && TRANSIT_PREDICTIONS[planet][house]) || '';
    const modifier = dignityModifier(detail);
    lines.push({
      planet,
      planetLabel: label,
      house,
      text: `${label} اس وقت آپ کے ${URDU_ORDINALS[house]} گھر میں گردش کر رہا ہے۔ ${effect}${modifier}`,
    });
  }
  return lines;
}

/**
 * ASPECT_OFFSETS — classical Parashari "khaas nazar" (special drishti):
 *   - Har graha apni 7ویں (opposite) ghar par nazar rakhta hai (offset 6).
 *   - Mangal: 4th/7th/8th (offsets 3,6,7)
 *   - Mushtari: 5th/7th/9th (offsets 4,6,8)
 *   - Zohal: 3rd/7th/10th (offsets 2,6,9)
 *   - Rahu/Ketu: aam tor par (jaise zyada tar jadeed Vedic software mein)
 *     Mushtari ki tarah 5th/7th/9th mana jata hai — is convention ka koi
 *     mukammal ittifaq nahi hai, lekin yehi sab se zyada rائج tareeqa hai.
 * Offset = kitne ghar aagay (0-indexed se +6 matlab 7ویں ghar).
 */
const ASPECT_OFFSETS = {
  Sun: [6],
  Moon: [6],
  Mercury: [6],
  Venus: [6],
  Mars: [3, 6, 7],
  Jupiter: [4, 6, 8],
  Saturn: [2, 6, 9],
  Rahu: [4, 6, 8],
  Ketu: [4, 6, 8],
};

/**
 * gocharDetails wohi shape jo buildCurrentTransitLines leta hai.
 *
 * Ye batata hai: "kis sitaray ki nazar kis ghar par pad rahi hai, aur uske
 * asrat kya honge" — har graha apni current gochar position se hisaab laga
 * kar apni khaas nazar wale gharon par TRANSIT_PREDICTIONS ka mutaliqa asar
 * "nazar ke zariye" (indirect) andaz mein batata hai.
 */
function buildTransitAspectLines(gocharDetails) {
  const lines = [];
  for (const planet of TRANSIT_ORDER) {
    const detail = gocharDetails[planet];
    if (!detail || !detail.house) continue;
    const offsets = ASPECT_OFFSETS[planet] || [6];
    const label = PLANET_NAME_URDU[planet] || planet;
    const modifier = dignityModifier(detail);
    for (const offset of offsets) {
      const aspectedHouse = ((detail.house - 1 + offset) % 12) + 1;
      const signification = HOUSE_SIGNIFICATION_UR[aspectedHouse] || '';
      const effect = (TRANSIT_PREDICTIONS[planet] && TRANSIT_PREDICTIONS[planet][aspectedHouse]) || '';
      lines.push({
        planet,
        planetLabel: label,
        fromHouse: detail.house,
        aspectedHouse,
        text: `${label} کی نظر آپ کے ${URDU_ORDINALS[aspectedHouse]} گھر پر پڑ رہی ہے — یہ گھر ${signification} سے متعلق ہے۔ اس نظر کے زیرِ اثر: ${effect}${modifier}`,
      });
    }
  }
  return lines;
}

/**
 * buildTransitLinesFor — buildCurrentTransitLines jaisa hi output banata hai,
 * lekin sirf diye gaye grahas ki list ke liye. Ye is liye alag rakha hai
 * taake Monthly/Yearly outlook apne mutabiq (dhime chalne wale grahas) sirf
 * unhi ka istemal karein, na ke saaray 9 grahas ka.
 */
function buildTransitLinesFor(gocharDetails, planetList) {
  const lines = [];
  for (const planet of planetList) {
    const detail = gocharDetails[planet];
    if (!detail || !detail.house) continue;
    const house = detail.house;
    const label = PLANET_NAME_URDU[planet] || planet;
    const effect = (TRANSIT_PREDICTIONS[planet] && TRANSIT_PREDICTIONS[planet][house]) || '';
    const modifier = dignityModifier(detail);
    lines.push({
      planet,
      planetLabel: label,
      house,
      text: `${label}: ${effect}${modifier}`,
    });
  }
  return lines;
}

// Monthly outlook un grahas par mabni hai jo darmiyani raftar se chalte hain
// (aik raashi mein taqreeban 3-7 hafte tak) — Sun, Mercury, Venus, Mars.
const MONTHLY_PLANETS = ['Sun', 'Mercury', 'Venus', 'Mars'];

// Yearly outlook un grahas par mabni hai jo bohat dheere chalte hain (aik
// raashi mein taqreeban 1 se 2.5 saal tak) — Jupiter, Saturn, Rahu, Ketu.
// Yehi wajah hai ke Sade Sati (Saturn) aur Mahadasha bhi isi tab mein shamil
// kiye gaye hain, kyunke ye bhi saalon tak chalne wale factors hain.
const YEARLY_PLANETS = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];

/**
 * "Is mahine ka rujhan" — Sun/Mercury/Venus/Mars ki current gochar position
 * se bana. Note: ye asal daily/weekly personalized calendar nahi hai (uske
 * liye aane wale hafton ke liye alag se Prokerala calls chahiye hongi —
 * abhi ke liye ye ek honest, astronomically sahi "current month snapshot"
 * hai, kyunke ye chaar grahas itni jaldi apni raashi nahi badalte.
 */
function buildMonthlyOutlook(gocharDetails) {
  const lines = buildTransitLinesFor(gocharDetails, MONTHLY_PLANETS);
  const note = 'یہ رجحان سورج، عطارد، زہرہ اور مریخ کی موجودہ راشی پر مبنی ہے — یہ سیارے تقریباً 3 سے 7 ہفتوں میں اپنی راشی بدلتے ہیں، اس لیے یہ اندازہ اگلے کچھ ہفتوں کے لیے قابلِ اعتماد ہے۔';
  return { lines, note };
}

/**
 * "Is saal ka rujhan" — Jupiter/Saturn/Rahu/Ketu (dheeme grahas) + Sade Sati
 * + current Mahadasha/Antardasha ko combine karta hai, kyunke yehi asal
 * "saalana" factors hain classical Vedic astrology mein.
 */
function buildYearlyOutlook(gocharDetails, dasha, sadeSati) {
  const lines = buildTransitLinesFor(gocharDetails, YEARLY_PLANETS);
  const extra = [];

  if (dasha && dasha.mahadasha && dasha.mahadasha.lord) {
    extra.push(`آپ کی موجودہ مہادشا ${dasha.mahadasha.lord} کی ہے — یہ کئی سالوں پر محیط دور آپ کی مجموعی زندگی کی سمت طے کر رہا ہے۔`);
  }
  if (sadeSati && sadeSati.is_in_sade_sati) {
    extra.push(`آپ اس وقت ساڑھ ساتی کے "${sadeSati.transit_phase || ''}" مرحلے میں بھی ہیں — یہ ذمہ داری، صبر اور نظم و ضبط سکھانے کا دور ہے، سال بھر اسی حساب سے منصوبہ بندی کریں۔`);
  } else {
    extra.push('اچھی بات یہ ہے کہ اس وقت آپ ساڑھ ساتی میں نہیں ہیں، تو زحل کی طرف سے اضافی دباؤ کی فکر نہ کریں۔');
  }

  const note = 'یہ رجحان مشتری، زحل، راہو اور کیتو کی موجودہ راشی پر مبنی ہے — یہ سیارے اپنی راشی میں تقریباً 1 سے 2.5 سال تک رہتے ہیں، اس لیے یہ اندازہ پورے سال کے لیے قابلِ اعتماد ہے۔';
  return { lines, extra, note };
}

// Har graha ke roایتی (classical) upay — mantra, daan/sadaqa, aur din. Ye
// AKSRA jaisi kisi gehri tehqeeq ka nateeja nahi, balke aam tor par mustanad
// classical Vedic texts mein milne wale upay hain — general guidance ke
// tor par pesh kiye ja rahe hain, kisi wagai/pukhta wade ke tor par nahi.
const PLANET_REMEDY_UR = {
  Sun: { day: 'اتوار', text: 'اتوار کے دن صبح سورج کو پانی چڑھانا، گندم یا گڑ کا صدقہ کرنا، اور "اوم سوریہ نمہ" کا ورد مفید سمجھا جاتا ہے۔' },
  Moon: { day: 'پیر', text: 'پیر کے دن دودھ، چاول یا سفید چیزوں کا صدقہ کرنا، اور "اوم چندرمسے نمہ" کا ورد مفید سمجھا جاتا ہے۔' },
  Mars: { day: 'منگل', text: 'منگل کے دن مسور کی دال یا سرخ چیزوں کا صدقہ کرنا، حنومان چالیسا پڑھنا، اور غصے میں فیصلوں سے بچنا مفید سمجھا جاتا ہے۔' },
  Mercury: { day: 'بدھ', text: 'بدھ کے دن سبز چیزوں کا صدقہ کرنا، اور "اوم بدھائے نمہ" کا ورد مفید سمجھا جاتا ہے۔' },
  Jupiter: { day: 'جمعرات', text: 'جمعرات کے دن زرد چیزیں، چنے کی دال یا کیلے کا صدقہ کرنا، اور بزرگوں و اساتذہ کا احترام مفید سمجھا جاتا ہے۔' },
  Venus: { day: 'جمعہ', text: 'جمعہ کے دن سفید چیزیں، چینی یا دہی کا صدقہ کرنا مفید سمجھا جاتا ہے۔' },
  Saturn: { day: 'ہفتہ', text: 'ہفتہ کے دن کالا تل یا سرسوں کے تیل کا صدقہ کرنا، غریبوں اور مزدوروں کی مدد کرنا، اور حنومان چالیسا پڑھنا مفید سمجھا جاتا ہے۔' },
  Rahu: { day: 'ہفتہ', text: 'نیلی یا کالی چیزوں کا صدقہ کرنا، اور جلد بازی سے گریز کرتے ہوئے صبر سے کام لینا مفید سمجھا جاتا ہے۔' },
  Ketu: { day: 'منگل', text: 'کمبل یا تل کا صدقہ کرنا، اور روحانی مشغلوں (نماز/مراقبہ) پر توجہ دینا مفید سمجھا جاتا ہے۔' },
};

/**
 * buildRemedies — kundli mein maujood doshon (Mangal Dosha, Kaal Sarp),
 * Sade Sati, aur kamzor (debilitated) natal grahas ke mutabiq hi upay
 * dikhata hai — har kisi ko ek jaisi generic list nahi.
 *
 * facts: { hasMangalDosha, hasKaalSarpDosha, isInSadeSati, sadeSatiPhase,
 *          weakNatalPlanets: ['Saturn', ...] }
 */
function buildRemedies(facts) {
  const items = [];

  if (facts.hasMangalDosha) {
    items.push({ key: 'mangal', title: 'منگل دوش', text: PLANET_REMEDY_UR.Mars.text });
  }
  if (facts.hasKaalSarpDosha) {
    items.push({
      key: 'kaalsarp',
      title: 'کال سرپ یوگ',
      text: 'راہو-کیتو کی شانتی کے لیے کمبل یا تل کا صدقہ کرنا اور صبر سے معاملات کو وقت دینا مفید سمجھا جاتا ہے — یہ یوگ ہر معاملے کو نہیں روکتا، صرف نتیجہ تھوڑی تاخیر سے آتا ہے۔',
    });
  }
  if (facts.isInSadeSati) {
    items.push({
      key: 'sadesati',
      title: `ساڑھ ساتی${facts.sadeSatiPhase ? ' — ' + facts.sadeSatiPhase + ' مرحلہ' : ''}`,
      text: PLANET_REMEDY_UR.Saturn.text,
    });
  }
  for (const planet of facts.weakNatalPlanets || []) {
    const remedy = PLANET_REMEDY_UR[planet];
    if (!remedy) continue;
    const label = PLANET_NAME_URDU[planet] || planet;
    items.push({
      key: `weak-${planet}`,
      title: `${label} کمزور (نیچ) حالت میں`,
      text: remedy.text,
    });
  }

  if (items.length === 0) {
    items.push({
      key: 'none',
      title: 'کوئی خاص دوش نہیں',
      text: 'آپ کی کنڈلی میں فی الحال کوئی سنگین دوش یا کمزور گرہ نظر نہیں آ رہا — عام صدقہ، نماز اور اچھے اعمال کی پابندی ہی کافی ہے۔',
    });
  }

  items.push({
    key: 'disclaimer',
    title: 'نوٹ',
    text: 'یہ روایتی (classical) اصولوں پر مبنی عمومی مشورے ہیں، کسی پختہ ضمانت کے طور پر نہ لیں — اہم فیصلوں (خاص طور پر شادی یا صحت سے متعلق) میں کسی باعتماد عالم یا ماہر سے مشورہ ضرور کریں۔',
  });

  return items;
}

module.exports = {
  generateNarrative,
  generateNarrativeViaLLM,
  buildCurrentTransitLines,
  buildTransitAspectLines,
  buildMonthlyOutlook,
  buildYearlyOutlook,
  buildRemedies,
  LIFE_AREA_LABELS_UR,
  HOUSE_SIGNIFICATION_UR,
};
