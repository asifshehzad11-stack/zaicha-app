/**
 * Zaicha Narrative Generator — Multi-language (EN/UR/HI/AR/ZH)
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
 *   - Hindi (hi), Arabic (ar), Simplified Chinese (zh): 2026-09-26 se poora
 *     translate ho chuka hai (English se, Urdu ka lehja/Islami nuance rakh
 *     kar). Terminology scratchpad glossary ke mutabiq hai (bhav/البيت/宫
 *     waghera). Remedies Islami azkar/sadaqa hi hain — Arabic dua/Quran ke
 *     alfaaz har zaban mein Arabic script mein rehte hain.
 *
 * Design principle (dono competitors se seekha gaya):
 *   - AstroSage jaisa purely fatalistic nahi ("ye hoga hi hoga")
 *   - AstroMatrix jaisa purely abstract-psychological bhi nahi
 *   - Practical + respectful + "sabar/consistency" wala tone
 */

'use strict';

const { URDU_ORDINALS, PLANET_NAME_URDU } = require('./astro-engine');

const SUPPORTED_LANGS = ['en', 'ur', 'hi', 'ar', 'zh'];
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
// hi: oblique ordinal ("दसवें") — templates add "भाव" after it.
const HI_ORDINALS = {
  1: 'पहले', 2: 'दूसरे', 3: 'तीसरे', 4: 'चौथे', 5: 'पाँचवें', 6: 'छठे',
  7: 'सातवें', 8: 'आठवें', 9: 'नौवें', 10: 'दसवें', 11: 'ग्यारहवें', 12: 'बारहवें',
};
// ar: full "البيت {n}" phrase (ordinal adjective) — templates do NOT add البيت again.
const AR_ORDINALS = {
  1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس', 6: 'السادس',
  7: 'السابع', 8: 'الثامن', 9: 'التاسع', 10: 'العاشر', 11: 'الحادي عشر', 12: 'الثاني عشر',
};
function ordinalFor(lang, n) {
  if (lang === 'ur') return URDU_ORDINALS[n] || `${n}ویں`;
  if (lang === 'hi') return HI_ORDINALS[n] || `${n}वें`;
  if (lang === 'ar') return `البيت ${AR_ORDINALS[n] || n}`;
  if (lang === 'zh') return `第${n}宫`; // zh: full "第{n}宫" — templates do NOT add 宫 again.
  return EN_ORDINALS[n] || `${n}th`;
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
const HOUSE_SIGNIFICATION_HI = {
  1: 'स्वयं, व्यक्तित्व और स्वास्थ्य', 2: 'धन, बचत और परिवार', 3: 'साहस, भाई-बहन और छोटी यात्रा',
  4: 'घर, माता और मानसिक शांति', 5: 'संतान, शिक्षा और रचनात्मकता', 6: 'प्रतियोगिता, कर्ज़ और रोग',
  7: 'साझेदारी और वैवाहिक जीवन', 8: 'परिवर्तन, विरासत और गूढ़ विषय', 9: 'भाग्य, पिता और धार्मिक झुकाव',
  10: 'करियर और सामाजिक प्रतिष्ठा', 11: 'आय, लाभ और मित्रता', 12: 'खर्च, हानि और एकांत',
};
const HOUSE_SIGNIFICATION_AR = {
  1: 'الذات والشخصية والصحة', 2: 'المال والادخار والأسرة', 3: 'الشجاعة والإخوة والأسفار القصيرة',
  4: 'المنزل والأم وراحة البال', 5: 'الأبناء والتعليم والإبداع', 6: 'المنافسة والديون وشؤون الصحة',
  7: 'الشراكة والحياة الزوجية', 8: 'التحوّل والميراث والأمور الخفية', 9: 'الحظ والأب والميل الديني',
  10: 'المهنة والمكانة الاجتماعية', 11: 'الدخل والمكاسب والصداقات', 12: 'النفقات والخسائر والعزلة',
};
const HOUSE_SIGNIFICATION_ZH = {
  1: '自我、性格与健康', 2: '财富、储蓄与家庭', 3: '勇气、兄弟姐妹与短途旅行',
  4: '家庭、母亲与内心安宁', 5: '子女、教育与创造力', 6: '竞争、债务与健康问题',
  7: '合作关系与婚姻生活', 8: '转变、遗产与隐秘之事', 9: '运气、父亲与宗教倾向',
  10: '事业与社会地位', 11: '收入、收益与友谊', 12: '开支、损失与独处',
};
const HOUSE_SIGNIFICATION = {
  ur: HOUSE_SIGNIFICATION_UR, en: HOUSE_SIGNIFICATION_EN,
  hi: HOUSE_SIGNIFICATION_HI, ar: HOUSE_SIGNIFICATION_AR, zh: HOUSE_SIGNIFICATION_ZH,
};

const LIFE_AREA_LABELS_UR = { career: 'کیریئر', wealth: 'مال و دولت', health: 'صحت', relationships: 'محبت و رشتے', family: 'گھر اور خاندان' };
const LIFE_AREA_LABELS_EN = { career: 'Career', wealth: 'Wealth', health: 'Health', relationships: 'Love & Relationships', family: 'Home & Family' };
const LIFE_AREA_LABELS_HI = { career: 'करियर', wealth: 'धन-संपत्ति', health: 'स्वास्थ्य', relationships: 'प्रेम और रिश्ते', family: 'घर और परिवार' };
const LIFE_AREA_LABELS_AR = { career: 'المهنة', wealth: 'المال والثروة', health: 'الصحة', relationships: 'الحب والعلاقات', family: 'المنزل والأسرة' };
const LIFE_AREA_LABELS_ZH = { career: '事业', wealth: '财富', health: '健康', relationships: '爱情与人际关系', family: '家庭' };
const LIFE_AREA_LABELS = {
  ur: LIFE_AREA_LABELS_UR, en: LIFE_AREA_LABELS_EN,
  hi: LIFE_AREA_LABELS_HI, ar: LIFE_AREA_LABELS_AR, zh: LIFE_AREA_LABELS_ZH,
};

// ---------------------------------------------------------------------------
// Planet names per language (glossary) — planetLabel() inhi se banta hai.
// ur: astro-engine ka PLANET_NAME_URDU (jaisa pehle tha); en: English key.
// ---------------------------------------------------------------------------
const PLANET_NAMES = {
  hi: { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु', Ascendant: 'लग्न' },
  ar: { Sun: 'الشمس', Moon: 'القمر', Mars: 'المريخ', Mercury: 'عطارد', Jupiter: 'المشتري', Venus: 'الزهرة', Saturn: 'زحل', Rahu: 'راهو', Ketu: 'كيتو', Ascendant: 'الطالع' },
  zh: { Sun: '太阳', Moon: '月亮', Mars: '火星', Mercury: '水星', Jupiter: '木星', Venus: '金星', Saturn: '土星', Rahu: '罗睺', Ketu: '计都', Ascendant: '上升点（命宫）' },
};

// Sade Sati phase — vedastro-client hamesha Urdu phase string deta hai; hi/ar/zh
// ke liye yahan uska tarjuma hota hai (en/ur ka rawaiyya jaisa tha waisa hi).
const SADE_SATI_PHASE_I18N = {
  'پہلا مرحلہ (چڑھتی ساڑھ ساتی)': { en: 'first (rising)', hi: 'पहला चरण (चढ़ती साढ़े साती)', ar: 'المرحلة الأولى (بداية ساده ساتي)', zh: '第一阶段·上升期' },
  'عروج کا مرحلہ': { en: 'peak', hi: 'चरम चरण', ar: 'مرحلة الذروة', zh: '高峰阶段' },
  'آخری مرحلہ (اترتی ساڑھ ساتی)': { en: 'last (setting)', hi: 'अंतिम चरण (उतरती साढ़े साती)', ar: 'المرحلة الأخيرة (نهاية ساده ساتي)', zh: '最后阶段·下降期' },
};
function sadeSatiPhaseLabel(phase, lang) {
  if (!phase) return '';
  const m = SADE_SATI_PHASE_I18N[phase];
  return (m && m[lang]) || phase;
}

function ordinal(n, lang) { return ordinalFor(normLang(lang), n); }

// ---------------------------------------------------------------------------
// generateNarrative — Career/etc life-area paragraph from dasha+dosha facts
// ---------------------------------------------------------------------------
function generateNarrative(facts, lang) {
  lang = normLang(lang);
  if (lang === 'ur') return generateNarrativeUr(facts);
  if (lang === 'hi') return generateNarrativeHi(facts);
  if (lang === 'ar') return generateNarrativeAr(facts);
  if (lang === 'zh') return generateNarrativeZh(facts);
  return generateNarrativeEn(facts);
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
    lines.push(`You are also currently in the "${sadeSatiPhaseLabel(facts.sadeSatiPhase, 'en')}" phase of Sade Sati — you may feel effort is higher and results come a bit slower, but this is a phase to pass through with patience and consistency, nothing to worry about.`);
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

function generateNarrativeHi(facts) {
  const lines = [];
  const areaLabel = LIFE_AREA_LABELS_HI[facts.lifeAreaKey] || facts.lifeAreaKey;

  if (facts.mahadashaLord && facts.mahadashaLordNatalHouse) {
    lines.push(`इस समय आपकी ${planetLabel(facts.mahadashaLord, 'hi')} की महादशा चल रही है, जो आपकी कुंडली के ${ordinal(facts.mahadashaLordNatalHouse, 'hi')} भाव में स्थित है — यानी यह अवधि आपके जीवन के उस हिस्से को ज़्यादा छू रही है जो इस भाव से जुड़ा है, और ${areaLabel} पर भी इसी हिसाब से असर पड़ रहा है।`);
  }
  if (facts.antardashaLord && facts.antardashaLordNatalHouse) {
    let s = `इसी के भीतर ${planetLabel(facts.antardashaLord, 'hi')} की अंतर्दशा भी साथ चल रही है, जो आपके ${ordinal(facts.antardashaLordNatalHouse, 'hi')} भाव में है`;
    s += facts.antardashaLordRetrograde ? ', और अभी वक्री भी है — इसका असर थोड़ी देर से लेकिन गहराई से महसूस होगा।' : '।';
    lines.push(s);
  }
  if (facts.isInSadeSati) {
    const ph = sadeSatiPhaseLabel(facts.sadeSatiPhase, 'hi');
    lines.push(`इस समय आप साढ़े साती${ph ? ` के "${ph}"` : ''} में भी हैं — मेहनत ज़्यादा और परिणाम थोड़ा देर से मिलने का एहसास हो सकता है, लेकिन यह चरण धैर्य और निरंतरता से पार होने वाला है, घबराने की कोई बात नहीं।`);
  }
  if (facts.hasKaalSarpDosha) {
    lines.push('आपकी कुंडली में काल सर्प योग मौजूद है — इसका मतलब यह नहीं कि हर काम रुका रहेगा, बल्कि यह संकेत है कि परिणाम थोड़ी देरी और अतिरिक्त मेहनत के बाद मिलते हैं।');
  } else {
    lines.push('अच्छी बात यह है कि आपकी कुंडली में काल सर्प योग नहीं है, इसलिए बड़े निर्णय लेते समय इस रुकावट की चिंता न करें।');
  }
  if (facts.hasMangalDosha) {
    lines.push('मंगल दोष भी मौजूद है — रिश्तों और साझेदारी के मामलों में थोड़ी अतिरिक्त समझदारी और बातचीत मददगार साबित होगी।');
  }
  lines.push('सलाह: बड़े आर्थिक या करियर संबंधी निर्णय जल्दबाज़ी में न लें — इस अवधि का लाभ तब मिलेगा जब आप निरंतरता से काम करेंगे, शॉर्टकट ढूँढने की कोशिश न करें।');
  return lines.join(' ');
}

function generateNarrativeAr(facts) {
  const lines = [];
  const areaLabel = LIFE_AREA_LABELS_AR[facts.lifeAreaKey] || facts.lifeAreaKey;

  if (facts.mahadashaLord && facts.mahadashaLordNatalHouse) {
    lines.push(`تمرّ الآن بالداشا الكبرى لكوكب ${planetLabel(facts.mahadashaLord, 'ar')}، الذي يقع في ${ordinal(facts.mahadashaLordNatalHouse, 'ar')} من خريطتك الفلكية — أي أن هذه المرحلة تمسّ أكثر ذلك الجانب من حياتك المرتبط بهذا البيت، وتؤثّر على ${areaLabel} بالقدر نفسه.`);
  }
  if (facts.antardashaLord && facts.antardashaLordNatalHouse) {
    let s = `وضمنها تجري أيضًا الداشا الفرعية لكوكب ${planetLabel(facts.antardashaLord, 'ar')}، الذي يقع في ${ordinal(facts.antardashaLordNatalHouse, 'ar')} لديك`;
    s += facts.antardashaLordRetrograde ? '، وهو راجع حاليًا أيضًا — سيُشعَر بأثره متأخرًا قليلًا لكن بعمق أكبر.' : '.';
    lines.push(s);
  }
  if (facts.isInSadeSati) {
    const ph = sadeSatiPhaseLabel(facts.sadeSatiPhase, 'ar');
    lines.push(`أنت الآن أيضًا في ساده ساتي${ph ? `، وتحديدًا في "${ph}"` : ''} — قد تشعر بأن الجهد أكبر وأن النتائج تتأخر قليلًا، لكنها مرحلة تُعبَر بالصبر والمثابرة، ولا داعي للقلق.`);
  }
  if (facts.hasKaalSarpDosha) {
    lines.push('توجد في خريطتك الفلكية يوغا كال سارب — وهذا لا يعني أن كل الأمور ستبقى متوقفة، بل هو إشارة إلى أن النتائج تأتي بعد شيء من التأخير والجهد الإضافي.');
  } else {
    lines.push('والخبر الطيب أنه لا توجد يوغا كال سارب في خريطتك الفلكية، فلا تقلق من هذا العائق عند اتخاذ القرارات الكبيرة.');
  }
  if (facts.hasMangalDosha) {
    lines.push('ويوجد أيضًا منغال دوشا — سيساعدك شيء من التفهّم والحوار الإضافي في شؤون العلاقات والشراكة.');
  }
  lines.push('نصيحة: لا تتعجّل في القرارات المالية أو المهنية الكبرى — ستجني فائدة هذه المرحلة حين تعمل بمثابرة، فلا تبحث عن طرق مختصرة.');
  return lines.join(' ');
}

function generateNarrativeZh(facts) {
  const lines = [];
  const areaLabel = LIFE_AREA_LABELS_ZH[facts.lifeAreaKey] || facts.lifeAreaKey;

  if (facts.mahadashaLord && facts.mahadashaLordNatalHouse) {
    lines.push(`目前您正在走${planetLabel(facts.mahadashaLord, 'zh')}大运，它位于您星盘的${ordinal(facts.mahadashaLordNatalHouse, 'zh')}——也就是说，这段时期更多地触及您生活中与该宫相关的部分，${areaLabel}方面也会相应受到影响。`);
  }
  if (facts.antardashaLord && facts.antardashaLordNatalHouse) {
    let s = `在此之中，${planetLabel(facts.antardashaLord, 'zh')}子运也在同时运行，它位于您的${ordinal(facts.antardashaLordNatalHouse, 'zh')}`;
    s += facts.antardashaLordRetrograde ? '，且目前处于逆行——其影响会来得稍晚，但更为深刻。' : '。';
    lines.push(s);
  }
  if (facts.isInSadeSati) {
    const ph = sadeSatiPhaseLabel(facts.sadeSatiPhase, 'zh');
    lines.push(`您目前还处于土星七年半（Sade Sati）期间${ph ? `（${ph}）` : ''}——可能会感到付出更多、结果来得稍慢，但这是一个以耐心和坚持就能度过的阶段，无需担心。`);
  }
  if (facts.hasKaalSarpDosha) {
    lines.push('您的星盘中存在卡尔萨帕瑜伽组合（Kaal Sarp Yoga）——这并不意味着所有事情都会停滞，而是表示结果会在一些延迟和额外努力之后到来。');
  } else {
    lines.push('好消息是，您的星盘中没有卡尔萨帕瑜伽组合（Kaal Sarp Yoga），因此在做重大决定时无需担心这一障碍。');
  }
  if (facts.hasMangalDosha) {
    lines.push('星盘中也存在火星凶位（Mangal Dosha）——在感情和合作关系方面，多一点理解与沟通会很有帮助。');
  }
  lines.push('建议：不要仓促做出重大的财务或事业决定——只有坚持不懈地努力，才能从这段时期获益，不要寻找捷径。');
  return lines.join('');
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

const TRANSIT_PREDICTIONS_HI = {
  Sun: {
    1: 'आत्मविश्वास और नेतृत्व की भावना बढ़ेगी, लेकिन स्वास्थ्य और गुस्से पर थोड़ा ध्यान रखें।',
    2: 'आर्थिक मामलों और पारिवारिक बातचीत पर ध्यान देने की ज़रूरत होगी — अपनी वाणी में नरमी रखें।',
    3: 'साहस और मेहनत रंग लाएगी, भाई-बहनों से संबंध मज़बूत होंगे।',
    4: 'घरेलू जीवन में कुछ हलचल रहेगी, माता के स्वास्थ्य और अपने मन की शांति का ध्यान रखें।',
    5: 'पढ़ाई और रचनात्मक कार्यों में ऊर्जा बनी रहेगी, संतान की ओर से अच्छी खबर मिल सकती है।',
    6: 'विरोधियों पर विजय और कर्ज़ उतारने का अवसर मिलेगा, लेकिन काम का दबाव भी बढ़ेगा।',
    7: 'साझेदारी और वैवाहिक मामलों में अहंकार और कठोरता से बचें, संतुलन ज़रूरी है।',
    8: 'अचानक बदलाव और अप्रत्याशित परिस्थितियों का सामना हो सकता है, स्वास्थ्य में सावधानी रखें।',
    9: 'भाग्य साथ देगा, पिता और धार्मिक झुकाव से लाभ होगा और यात्रा की संभावना बनेगी।',
    10: 'करियर में उल्लेखनीय सफलता और सम्मान मिलेगा, सामाजिक प्रतिष्ठा बढ़ेगी।',
    11: 'आय और लाभ में वृद्धि होगी, पुरानी इच्छाओं के पूरे होने का समय है।',
    12: 'खर्च बढ़ेंगे और थकान या अकेलेपन का एहसास हो सकता है, आराम ज़रूरी है।',
  },
  Moon: {
    1: 'मानसिक रूप से संवेदनशील समय है, मन की शांति के लिए आराम और अच्छी नींद ज़रूरी है।',
    2: 'परिवार और आर्थिक मामलों से भावनात्मक लगाव रहेगा, खान-पान का ध्यान रखें।',
    3: 'साहस और हौसला बुलंद रहेगा, करीबी लोगों से बातचीत फ़ायदेमंद साबित होगी।',
    4: 'घर और माता से जुड़े खुशी के पल मिलेंगे, मानसिक शांति बेहतर होगी।',
    5: 'दिल की बात सुनी जाएगी, प्रेम और रचनात्मक कार्यों के लिए सुखद समय है।',
    6: 'मानसिक तनाव या मामूली बीमारी की संभावना है, प्रतियोगिता का सामना हिम्मत से करें।',
    7: 'रिश्तों में कोमलता और प्रेम रहेगा, साझेदारी में सहयोग बढ़ेगा।',
    8: 'भावनात्मक उतार-चढ़ाव रहेगा, अप्रत्याशित खबर मिल सकती है — धैर्य रखें।',
    9: 'सौभाग्य और दया का भाव रहेगा, यात्रा या धार्मिक झुकाव बढ़ेगा।',
    10: 'सार्वजनिक जीवन में सराहना मिलेगी, माता की ओर से सहयोग मिलने की संभावना है।',
    11: 'मित्रों से खुशी और आय में वृद्धि होगी, इच्छाएँ पूरी होने के संकेत हैं।',
    12: 'अकेलापन या ज़्यादा सोच-विचार रह सकता है, नींद और आराम का खास ध्यान रखें।',
  },
  Mars: {
    1: 'ऊर्जा और उत्साह बढ़ेगा, लेकिन गुस्से और जल्दबाज़ी से बचें।',
    2: 'खर्च बढ़ सकते हैं, परिवार में बहस से बचें और अपनी वाणी पर नियंत्रण रखें।',
    3: 'साहस और बहादुरी चरम पर होगी, प्रतियोगिता में सफलता और भाई-बहनों से सहयोग मिलेगा।',
    4: 'घर के माहौल में तनाव संभव है, संपत्ति के मामलों में सावधानी बरतें।',
    5: 'संतान या प्रेम के मामलों में भावनात्मक तेज़ी रहेगी, सोच-समझकर निर्णय लें।',
    6: 'विरोधियों और बीमारियों पर विजय मिलेगी, प्रतियोगिता में जीत का अच्छा समय है।',
    7: 'साझेदारी और वैवाहिक जीवन में टकराव संभव है, धैर्य और नरमी से काम लें।',
    8: 'दुर्घटनाओं या अचानक आने वाली समस्याओं से बचाव की ज़रूरत है, सावधानी आवश्यक है।',
    9: 'भाग्य के लिए मेहनत करनी पड़ेगी, यात्रा में सावधानी रखें।',
    10: 'करियर में मेहनत रंग लाएगी, लेकिन अधिकार जताने में कठोरता न दिखाएँ।',
    11: 'मेहनत से आय बढ़ेगी, इच्छाएँ पूरी करने में तेज़ी रहेगी।',
    12: 'खर्च और छिपी समस्याएँ बढ़ सकती हैं, गुस्से पर नियंत्रण रखना ज़रूरी है।',
  },
  Mercury: {
    1: 'मानसिक चुस्ती और बातचीत का कौशल बढ़ेगा, नए विचार सामने आएँगे।',
    2: 'आर्थिक मामलों में समझदारी रहेगी, लेखन और व्यापार में लाभ संभव है।',
    3: 'साहस और संपर्कों में वृद्धि होगी, छोटी यात्राएँ फ़ायदेमंद साबित होंगी।',
    4: 'घरेलू मामलों में समझदारी से निर्णय होंगे, शिक्षा से जुड़ी खबर मिल सकती है।',
    5: 'रचनात्मकता और सीखने के लिए उत्तम समय है, संतान से अच्छी बातचीत रहेगी।',
    6: 'प्रतियोगिता में बुद्धिमानी से सफलता मिलेगी, बारीकियों पर खास ध्यान दें।',
    7: 'साझेदारी में बातचीत और समझौते लाभदायक साबित होंगे।',
    8: 'छिपी हुई जानकारी सामने आ सकती है, दस्तावेज़ों का खास ध्यान रखें।',
    9: 'ज्ञान और धार्मिक विषयों में रुचि बढ़ेगी, अच्छी खबर मिलने की संभावना है।',
    10: 'करियर में बुद्धिमानी से सफलता मिलेगी, बातचीत और प्रस्तुति का हुनर काम आएगा।',
    11: 'संपर्कों और मित्रता से लाभ होगा, आय के नए स्रोत बन सकते हैं।',
    12: 'ज़्यादा सोच-विचार या उलझन महसूस हो सकती है, निर्णय में जल्दबाज़ी न करें।',
  },
  Jupiter: {
    1: 'भाग्य और सौभाग्य का साथ मिलेगा, व्यक्तित्व में गरिमा और आत्मविश्वास बढ़ेगा।',
    2: 'आर्थिक स्थिति में सुधार और परिवार में खुशहाली रहेगी, बातों में समझदारी झलकेगी।',
    3: 'साहस और हौसला बुलंद रहेगा, लेकिन ज़रूरत से ज़्यादा आत्मविश्वास से बचें।',
    4: 'घर में सुख-शांति और बरकत रहेगी, संपत्ति या घर से जुड़ी अच्छी खबर संभव है।',
    5: 'संतान, शिक्षा और ज्ञान में बरकत रहेगी, शुभ समाचार मिलने की संभावना है।',
    6: 'विरोधियों पर विजय मिलेगी, स्वास्थ्य में सुधार और कर्ज़ में कमी के संकेत हैं।',
    7: 'साझेदारी और वैवाहिक जीवन में खुशहाली और बरकत रहेगी।',
    8: 'गूढ़ और आध्यात्मिक विषयों में रुचि बढ़ेगी, विरासत से जुड़ी खबर संभव है।',
    9: 'भाग्य चरम पर होगा, यात्रा, धर्म और उच्च शिक्षा में लाभ मिलेगा।',
    10: 'करियर में तरक्की और सम्मान मिलेगा, सामाजिक प्रतिष्ठा बढ़ेगी।',
    11: 'आय बढ़ेगी और इच्छाएँ पूरी होंगी, मित्रों से लाभ मिलेगा।',
    12: 'खर्च बढ़ सकते हैं, लेकिन यह आध्यात्मिक शांति और आंतरिक विकास का समय है।',
  },
  Venus: {
    1: 'आकर्षण और मनमोहकता बढ़ेगी, रिश्तों में प्रेम का एहसास गहरा होगा।',
    2: 'आर्थिक समृद्धि और परिवार में प्रेम बना रहेगा, नई खरीदारी की संभावना है।',
    3: 'रचनात्मकता और कलात्मक रुचि बढ़ेगी, मित्रों के साथ सुखद समय बीतेगा।',
    4: 'घर में आराम और सुख-सुविधा रहेगी, सजावट या नई चीज़ों की इच्छा बढ़ेगी।',
    5: 'प्रेम और रोमांस के लिए उत्तम समय है, रचनात्मक कार्यों में सफलता मिलेगी।',
    6: 'रिश्तों में मामूली अनबन संभव है, लेकिन कुल मिलाकर समय सुखद रहेगा।',
    7: 'साझेदारी और वैवाहिक जीवन में प्रेम और सहयोग बढ़ेगा।',
    8: 'भावनात्मक गहराई और निकटता का एहसास रहेगा, आर्थिक साझेदारी में सावधानी रखें।',
    9: 'यात्रा और सुखद अनुभवों की संभावना है, रोमांटिक अवसर भी मिल सकता है।',
    10: 'आकर्षक व्यक्तित्व का करियर में लाभ मिलेगा, रचनात्मक क्षेत्र में सराहना होगी।',
    11: 'मित्रता और इच्छाओं की पूर्ति होगी, सामाजिक जीवन में रौनक रहेगी।',
    12: 'निजी प्रेम या गुप्त संबंधों की ओर झुकाव रहेगा, आराम और मनोरंजन पर खर्च बढ़ेगा।',
  },
  Saturn: {
    1: 'ज़िम्मेदारियों का बोझ महसूस होगा, लेकिन धैर्य और अनुशासन से सफलता मिलेगी।',
    2: 'आर्थिक मामलों में सावधानी ज़रूरी है, परिवार में गंभीर माहौल रहेगा।',
    3: 'मेहनत से साहस और दृढ़ता बढ़ेगी, धीमी गति के बाद परिणाम ज़रूर मिलेगा।',
    4: 'घरेलू ज़िम्मेदारियाँ बढ़ेंगी, माता के स्वास्थ्य का खास ध्यान रखें।',
    5: 'शिक्षा या संतान से जुड़े मामलों में धैर्य की ज़रूरत होगी।',
    6: 'प्रतियोगिता में कड़ी मेहनत से जीत मिलेगी, लेकिन थकान का ध्यान रखें।',
    7: 'साझेदारी में गंभीरता और ज़िम्मेदारी बढ़ेगी, धैर्य की परीक्षा हो सकती है।',
    8: 'कठिन समय और देरी का सामना हो सकता है, स्वास्थ्य में सावधानी ज़रूरी है।',
    9: 'भाग्य में देरी, लेकिन निरंतर प्रयास से स्थायी लाभ मिलेगा, बड़ों का सम्मान करें।',
    10: 'करियर में कड़ी मेहनत लगेगी, लेकिन परिणाम स्थायी और मज़बूत होगा।',
    11: 'धीरे-धीरे लेकिन निश्चित रूप से आय और लाभ में वृद्धि होगी।',
    12: 'एकांत, थकान या खर्च में वृद्धि संभव है, आराम और सावधानी ज़रूरी है।',
  },
  Rahu: {
    1: 'इच्छाएँ और बेचैनी बढ़ेंगी, अपरंपरागत रास्ते अपनाने का झुकाव बढ़ेगा।',
    2: 'आर्थिक मामलों में अनिश्चितता रहेगी, परिवार में उलझन से बचें।',
    3: 'साहस और हिम्मत बढ़ेगी, लेकिन जल्दबाज़ी से नुकसान संभव है।',
    4: 'घर के माहौल में बेचैनी रहेगी, मन की शांति के लिए कुछ देर शांत बैठना (मेडिटेशन) उपयोगी होगा।',
    5: 'संतान या शिक्षा के मामलों में उलझन रहेगी, अस्पष्ट निर्णयों से बचें।',
    6: 'विरोधियों पर अप्रत्याशित जीत मिलेगी, लेकिन स्वास्थ्य में सावधानी ज़रूरी है।',
    7: 'साझेदारी में धोखे या गलतफ़हमी से बचें, स्पष्ट बातचीत करें।',
    8: 'रहस्यमय और अप्रत्याशित घटनाओं की संभावना है, धैर्य और सतर्कता ज़रूरी है।',
    9: 'विदेश या अपरंपरागत धार्मिक झुकावों में रुचि बढ़ेगी।',
    10: 'करियर में अचानक बदलाव या अप्रत्याशित अवसर मिल सकता है।',
    11: 'आय में वृद्धि संभव है, लेकिन स्रोत अनिश्चित हो सकते हैं।',
    12: 'छिपे खर्चों या शत्रुओं से सावधान रहें, विदेशी संपर्क बन सकते हैं।',
  },
  Ketu: {
    1: 'भीतरी उलझन और उदासीनता का एहसास रहेगा, आध्यात्मिक झुकाव बढ़ेगा।',
    2: 'परिवार या धन से अरुचि रहेगी, खर्च में सावधानी ज़रूरी है।',
    3: 'साहस में कमी या भाई-बहनों से दूरी का एहसास संभव है।',
    4: 'घरेलू मामलों से अलगाव का एहसास रहेगा, एकांत मानसिक शांति में मददगार होगा।',
    5: 'संतान या रचनात्मक कार्यों में रुचि कम हो सकती है, आध्यात्मिकता की ओर झुकाव बढ़ेगा।',
    6: 'छिपे विरोधियों पर विजय मिलेगी, लेकिन स्वास्थ्य की अस्पष्ट समस्याओं का ध्यान रखें।',
    7: 'रिश्तों में दूरी या अलगाव का एहसास रहेगा, धैर्य और समझदारी ज़रूरी है।',
    8: 'अप्रत्याशित बदलाव या नुकसान की संभावना है, आध्यात्मिक झुकाव बढ़ेगा।',
    9: 'धार्मिक और आध्यात्मिक विषयों में गहरी रुचि रहेगी, अचानक यात्रा संभव है।',
    10: 'करियर में उलझन या उदासीनता महसूस हो सकती है, लेकिन आध्यात्मिक कार्यों में सफलता मिलेगी।',
    11: 'इच्छाओं में बदलाव आ सकता है, मित्रों से दूरी का एहसास संभव है।',
    12: 'आध्यात्मिक उन्नति और आंतरिक शांति के लिए उत्तम समय है, एकांत उपयोगी साबित होगा।',
  },
};

const TRANSIT_PREDICTIONS_AR = {
  Sun: {
    1: 'ستزداد الثقة بالنفس وروح القيادة، لكن انتبه قليلًا لصحتك وحدّة طبعك.',
    2: 'ستحتاج الشؤون المالية والأحاديث العائلية إلى اهتمام — احرص على لين الكلام.',
    3: 'ستؤتي الشجاعة والاجتهاد ثمارهما، وستتوطّد العلاقة مع الإخوة والأخوات.',
    4: 'قد تشهد الحياة المنزلية بعض الاضطراب، فاعتنِ بصحة والدتك وبراحة بالك.',
    5: 'تبقى الطاقة عالية للدراسة والأعمال الإبداعية، وقد تأتي أخبار سارّة من الأبناء.',
    6: 'ستُتاح لك فرصة التغلّب على المنافسين وسداد الديون، لكن ضغط العمل سيزداد أيضًا.',
    7: 'تجنّب الكِبر والتصلّب في الشراكة والحياة الزوجية، فالتوازن ضروري.',
    8: 'قد تواجه تغيّرات مفاجئة وظروفًا غير متوقعة، فاحرص على صحتك.',
    9: 'سيحالفك الحظ، وستنتفع من الأب ومن الميل الديني، ومن المرجّح أن تسافر.',
    10: 'نجاح لافت واحترام في المهنة، وسترتفع مكانتك الاجتماعية.',
    11: 'سيزداد الدخل والمكاسب، وهو وقت مناسب لتحقّق أمنيات طال انتظارها.',
    12: 'ستزداد النفقات وقد تشعر بالتعب أو العزلة، والراحة مهمة.',
  },
  Moon: {
    1: 'وقت حسّاس نفسيًا، والراحة والنوم الجيد ضروريان لراحة البال.',
    2: 'سيكون التعلّق العاطفي بالأسرة والشؤون المالية قويًا، فانتبه لطعامك وشرابك.',
    3: 'تبقى الشجاعة والمعنويات مرتفعة، وسيكون الحديث مع المقرّبين مفيدًا.',
    4: 'لحظات سعيدة مرتبطة بالمنزل والأم، وتتحسّن راحة البال.',
    5: 'سيُصغى لما في القلب — وقت لطيف للحب والأعمال الإبداعية.',
    6: 'قد يحدث ضغط نفسي أو وعكة بسيطة، فواجه المنافسة بشجاعة.',
    7: 'يسود اللين والمودّة في العلاقات، ويزداد التعاون في الشراكة.',
    8: 'تستمر التقلّبات العاطفية، وقد تصلك أخبار غير متوقعة — فتحلَّ بالصبر.',
    9: 'يسود شعور بحسن الحظ والرحمة، ويزداد السفر أو الميل الديني.',
    10: 'تقدير في الحياة العامة، ومن المرجّح أن تلقى دعمًا من والدتك.',
    11: 'فرح من الأصدقاء وزيادة في الدخل، والعلامات تشير إلى تحقّق الأمنيات.',
    12: 'قد تشعر بالوحدة أو بكثرة التفكير، فاعتنِ عناية خاصة بالنوم والراحة.',
  },
  Mars: {
    1: 'تزداد الطاقة والحماس، لكن تجنّب الغضب والتسرّع.',
    2: 'قد تزداد النفقات، فتجنّب الجدال في الأسرة واضبط كلامك.',
    3: 'تبلغ الشجاعة والإقدام ذروتهما، مع نجاح في المنافسة ودعم من الإخوة.',
    4: 'قد يسود التوتر في أجواء المنزل، فاحترس في شؤون العقارات والممتلكات.',
    5: 'حدّة عاطفية في شؤون الأبناء أو الحب، فاتخذ قراراتك بتروٍّ.',
    6: 'الغلبة على المنافسين والأمراض، ووقت جيد للفوز في المنافسة.',
    7: 'قد يحدث احتكاك في الشراكة والحياة الزوجية، فتعامل بالصبر واللين.',
    8: 'احترس من الحوادث أو المشكلات المفاجئة، فالحذر ضروري.',
    9: 'ستحتاج إلى السعي والاجتهاد من أجل الحظ، واحترس أثناء السفر.',
    10: 'يؤتي الجهد ثماره في المهنة، لكن لا تُظهر شدّة في استعمال السلطة.',
    11: 'يزداد الدخل بالجهد، والهمّة تساعد على تحقيق الأمنيات.',
    12: 'قد تزداد النفقات والمشكلات الخفية، وضبط الغضب أمر مهم.',
  },
  Mercury: {
    1: 'تتحسّن سرعة البديهة ومهارات التواصل، وتظهر أفكار جديدة.',
    2: 'حكمة في الشؤون المالية، وقد تكون الكتابة والتجارة مربحتين.',
    3: 'تزداد الشجاعة وشبكة العلاقات، والرحلات القصيرة مفيدة.',
    4: 'قرارات حكيمة في شؤون المنزل، وقد تصلك أخبار تتعلق بالتعليم.',
    5: 'وقت ممتاز للإبداع والتعلّم، مع أحاديث طيبة مع الأبناء.',
    6: 'يجلب الذكاء النجاح في المنافسة، فأولِ التفاصيل اهتمامًا خاصًا.',
    7: 'تكون المحادثات والاتفاقات في الشراكة مفيدة.',
    8: 'قد تظهر معلومات خفية، فاعتنِ بالوثائق عناية خاصة.',
    9: 'يزداد الاهتمام بالعلم والمواضيع الدينية، ومن المرجّح أن تصلك أخبار طيبة.',
    10: 'يجلب الذكاء النجاح في المهنة، وتفيدك مهارات التواصل والعرض.',
    11: 'تعود العلاقات والصداقات بالنفع، وقد تنفتح مصادر دخل جديدة.',
    12: 'قد تشعر بكثرة التفكير أو الحيرة، فلا تتعجّل في القرارات.',
  },
  Jupiter: {
    1: 'يرافقك الحظ والتوفيق، ويزداد الوقار والثقة في شخصيتك.',
    2: 'تحسّن في الوضع المالي ورخاء في الأسرة، وتظهر الحكمة في كلامك.',
    3: 'تبقى الشجاعة والمعنويات مرتفعة، لكن تجنّب الثقة الزائدة بالنفس.',
    4: 'تسود الطمأنينة والبركة في المنزل، وقد تصلك أخبار طيبة عن عقار أو مسكن.',
    5: 'بركة في الأبناء والتعليم والعلم، ومن المرجّح أن تصلك بشرى.',
    6: 'الغلبة على المنافسين، وتتحسّن الصحة وقد تقلّ الديون.',
    7: 'يسود الرخاء والبركة في الشراكة والحياة الزوجية.',
    8: 'يزداد الاهتمام بالأمور الخفية والروحية، وقد تصلك أخبار عن الميراث.',
    9: 'يبلغ الحظ ذروته، مع فائدة من السفر والدين والتعليم العالي.',
    10: 'تقدّم واحترام في المهنة، وترتفع المكانة الاجتماعية.',
    11: 'يزداد الدخل وتتحقق الأمنيات، مع فائدة من الأصدقاء.',
    12: 'قد تزداد النفقات، لكنه وقت للسكينة الروحية والنمو الداخلي.',
  },
  Venus: {
    1: 'تزداد الجاذبية والحضور، ويقوى الإحساس بالمحبة في العلاقات.',
    2: 'رخاء مالي ومحبة في الأسرة، ومن المرجّح القيام بمشتريات جديدة.',
    3: 'يزداد الإبداع والذوق الفني، مع أوقات ممتعة مع الأصدقاء.',
    4: 'راحة ورفاهية في المنزل، وتزداد الرغبة في التزيين أو اقتناء أشياء جديدة.',
    5: 'وقت ممتاز للحب والرومانسية، ونجاح في الأعمال الإبداعية.',
    6: 'قد يحدث خلاف بسيط في العلاقات، لكن الوقت سيبقى طيبًا عمومًا.',
    7: 'تزداد المحبة والتعاون في الشراكة والحياة الزوجية.',
    8: 'يُشعَر بعمق عاطفي وقُرب، فاحترس في الشراكات المالية.',
    9: 'من المرجّح السفر وتجارب ممتعة، وقد تسنح فرصة عاطفية أيضًا.',
    10: 'تفيد الشخصيةُ الجذّابة مسيرتك المهنية، مع تقدير في المجالات الإبداعية.',
    11: 'تتحقق الصداقات والأمنيات، وتزدهر الحياة الاجتماعية.',
    12: 'ميل إلى المشاعر الخاصة أو العلاقات الخفية، ويزداد الإنفاق على الراحة والترفيه.',
  },
  Saturn: {
    1: 'ستشعر بثقل المسؤوليات، لكن الصبر والانضباط يجلبان النجاح.',
    2: 'الحذر مطلوب في الشؤون المالية، ويسود جوّ جادّ في الأسرة.',
    3: 'يبني الجهد الشجاعة والثبات، والنتيجة تأتي حتمًا بعد شيء من البطء.',
    4: 'تزداد المسؤوليات المنزلية، فاعتنِ عناية خاصة بصحة والدتك.',
    5: 'يلزم الصبر في الأمور المتعلقة بالتعليم أو الأبناء.',
    6: 'فوز في المنافسة بعد جهد شاق، لكن انتبه للإرهاق.',
    7: 'تزداد الجدّية والمسؤولية في الشراكة، وقد يكون وقت اختبار للصبر.',
    8: 'قد تمر بفترة صعبة وتأخيرات، والصحة تحتاج إلى عناية.',
    9: 'يتأخر الحظ، لكن المثابرة تجلب نفعًا دائمًا، فأكرم كبار السن.',
    10: 'تتطلب المهنة جهدًا شاقًا، لكن النتيجة ستكون دائمة وقوية.',
    11: 'نموّ بطيء لكنه أكيد في الدخل والمكاسب.',
    12: 'قد تزداد العزلة أو التعب أو النفقات، فالراحة والحذر ضروريان.',
  },
  Rahu: {
    1: 'تزداد الرغبات والقلق، ويقوى الميل إلى سلوك طرق غير تقليدية.',
    2: 'عدم يقين في الشؤون المالية، فتجنّب الارتباك داخل الأسرة.',
    3: 'تزداد الشجاعة والجرأة، لكن التسرّع قد يسبب خسارة.',
    4: 'قلق في أجواء المنزل، والتأمّل والسكون سيساعدان على راحة البال.',
    5: 'حيرة في شؤون الأبناء أو التعليم، فتجنّب القرارات غير الواضحة.',
    6: 'انتصار غير متوقع على المنافسين، لكن احرص على صحتك.',
    7: 'احذر الخداع أو سوء الفهم في الشراكة، وتحدّث بوضوح.',
    8: 'أحداث غامضة وغير متوقعة محتملة، فالصبر واليقظة ضروريان.',
    9: 'يزداد الاهتمام بالسفر إلى الخارج أو بالميول الدينية غير التقليدية.',
    10: 'قد يطرأ تغيير مفاجئ أو تلوح فرصة غير متوقعة في المهنة.',
    11: 'قد يزداد الدخل، لكن مصدره قد يكون غير مضمون.',
    12: 'احذر النفقات الخفية أو الخصوم، وقد تنشأ صلات بالخارج.',
  },
  Ketu: {
    1: 'شعور بحيرة داخلية أو فتور، ويزداد الميل الروحي.',
    2: 'زهد في الأسرة أو المال، والحذر مطلوب في الإنفاق.',
    3: 'قد تضعف الشجاعة قليلًا أو تشعر بالبعد عن الإخوة.',
    4: 'شعور بالانفصال عن الشؤون المنزلية، والخلوة تعين على راحة البال.',
    5: 'قد يقلّ الاهتمام بالأبناء أو الأعمال الإبداعية، ويزداد الميل إلى الروحانية.',
    6: 'غلبة على الخصوم الخفيين، لكن انتبه لمشكلات صحية غير واضحة.',
    7: 'شعور بالبعد أو الفتور في العلاقات، فالصبر والتفهّم ضروريان.',
    8: 'تغيير أو خسارة غير متوقعة محتملة، ويزداد الميل الروحي.',
    9: 'اهتمام عميق بالأمور الدينية والروحية، وقد يحدث سفر مفاجئ.',
    10: 'قد تشعر بالحيرة أو الفتور في المهنة، لكن النجاح يأتي في المساعي الروحية.',
    11: 'قد تتغير الرغبات، وقد تشعر بالبعد عن الأصدقاء.',
    12: 'وقت ممتاز للنمو الروحي والسكينة الداخلية، والخلوة مفيدة.',
  },
};

const TRANSIT_PREDICTIONS_ZH = {
  Sun: {
    1: '自信心和领导力会增强，但要稍加留意健康和脾气。',
    2: '财务事务和家庭交流需要多加关注——说话要温和。',
    3: '勇气和努力会有回报，与兄弟姐妹的关系会更加牢固。',
    4: '家庭生活可能有些波动，请关注母亲的健康和自己的内心安宁。',
    5: '学习和创作方面精力充沛，可能会有来自子女的好消息。',
    6: '有机会战胜对手、偿还债务，但工作压力也会增加。',
    7: '在合作关系和婚姻中避免傲慢和固执，保持平衡至关重要。',
    8: '可能会遇到突然的变化和意外情况，请注意健康。',
    9: '好运相伴，可从父亲和宗教信仰中获益，也可能有出行机会。',
    10: '事业上会取得显著成功并获得尊重，社会地位将提升。',
    11: '收入和收益会增加，是长久心愿得以实现的好时机。',
    12: '开支会增加，可能感到疲惫或孤独，休息很重要。',
  },
  Moon: {
    1: '这是情绪较为敏感的时期，需要休息和充足睡眠来保持内心平静。',
    2: '对家庭和金钱事务的情感牵挂较深，请注意饮食。',
    3: '勇气和士气高涨，与亲近之人交谈会很有帮助。',
    4: '会有与家庭和母亲相关的快乐时光，内心安宁会改善。',
    5: '心声会被倾听——是谈情说爱和从事创作的愉快时光。',
    6: '可能出现精神压力或小病，要勇敢面对竞争。',
    7: '人际关系中充满温柔与爱，合作中的配合会加强。',
    8: '情绪起伏会持续，可能收到意外消息——请保持耐心。',
    9: '会感到幸运与慈悲，出行或宗教倾向会增加。',
    10: '在公众生活中获得认可，可能得到母亲的支持。',
    11: '朋友带来欢乐，收入增加，心愿有望实现。',
    12: '可能感到孤独或思虑过多——要特别注意睡眠和休息。',
  },
  Mars: {
    1: '精力和热情高涨，但要避免发怒和急躁。',
    2: '开支可能增加——避免家庭争吵，注意言辞。',
    3: '勇气和胆识达到顶峰，在竞争中取得成功，并得到兄弟姐妹的支持。',
    4: '家中可能出现紧张气氛——处理房产事务时要谨慎。',
    5: '在子女或感情方面情绪较为激烈——请深思熟虑后再做决定。',
    6: '能战胜对手和疾病，是在竞争中取胜的好时机。',
    7: '合作关系和婚姻中可能出现摩擦——要以耐心和温和相待。',
    8: '需防范意外或突发问题——务必谨慎。',
    9: '需要努力争取好运，出行时要小心。',
    10: '事业上的努力会有回报，但行使权力时不要过于强硬。',
    11: '通过努力收入会增加，积极行动有助于实现心愿。',
    12: '开支和隐藏的问题可能增加——控制脾气很重要。',
  },
  Mercury: {
    1: '思维敏捷度和沟通能力提升，新想法不断涌现。',
    2: '在财务上判断明智，写作和贸易可能带来收益。',
    3: '勇气和人脉增加，短途旅行会很有益。',
    4: '家中事务能明智决断，可能收到与教育相关的消息。',
    5: '是创作和学习的绝佳时机，与子女沟通良好。',
    6: '凭智慧在竞争中取得成功——要特别注意细节。',
    7: '合作中的商谈和协议会带来益处。',
    8: '隐藏的信息可能浮出水面——要特别注意文件。',
    9: '对知识和宗教话题的兴趣增加，可能会有好消息。',
    10: '凭智慧在事业上取得成功，沟通和表达能力会派上用场。',
    11: '人脉和友谊带来益处，可能开辟新的收入来源。',
    12: '可能思虑过多或感到困惑——不要仓促做决定。',
  },
  Jupiter: {
    1: '好运相随，个人的威望与自信会增强。',
    2: '财务状况改善，家庭富足，言谈中显出智慧。',
    3: '勇气和士气高涨，但要避免过于自信。',
    4: '家中安宁有福，可能有关于房产或住宅的好消息。',
    5: '子女、教育和学识方面蒙受福佑，可能会有喜讯。',
    6: '能战胜对手，健康改善，债务可能减少。',
    7: '合作关系和婚姻生活富足且蒙福。',
    8: '对玄秘和灵性事物的兴趣增加，可能有关于遗产的消息。',
    9: '运势达到顶峰，可从出行、宗教和高等教育中获益。',
    10: '事业进步并受到尊重，社会地位提升。',
    11: '收入增加，心愿得以实现，并能从朋友处获益。',
    12: '开支可能增加，但这是获得心灵平静和内在成长的时期。',
  },
  Venus: {
    1: '魅力和吸引力增加，人际关系中的爱意更浓。',
    2: '财务富足，家庭充满爱，可能会有新的购置。',
    3: '创造力和艺术品味提升，与朋友共度愉快时光。',
    4: '家中舒适安逸，对装饰或添置新物的兴趣增加。',
    5: '是恋爱和浪漫的绝佳时机，创作方面会取得成功。',
    6: '人际关系中可能有小摩擦，但总体上时光依然愉快。',
    7: '合作关系和婚姻生活中的爱与配合会加深。',
    8: '感受到情感上的深度与亲密，在财务合作上要谨慎。',
    9: '可能有出行和愉快的经历，也可能出现浪漫的机会。',
    10: '迷人的个性有助于事业，在创意领域获得认可。',
    11: '友谊和心愿得以实现，社交生活丰富多彩。',
    12: '倾向于私密的感情或隐秘的关系，在舒适和休闲上的花费增加。',
  },
  Saturn: {
    1: '会感到责任重大，但耐心和自律会带来成功。',
    2: '财务方面需要谨慎，家中气氛较为严肃。',
    3: '努力会培养勇气和毅力，经过一段缓慢之后必有结果。',
    4: '家庭责任增加——要特别关注母亲的健康。',
    5: '在教育或子女相关的事情上需要耐心。',
    6: '经过艰苦努力在竞争中获胜，但要注意疲劳。',
    7: '合作关系中的严肃性和责任感增加，可能是考验耐心的时期。',
    8: '可能遇到困难时期和延误——健康需要注意。',
    9: '运气来得较迟，但持之以恒会带来长久的益处；请尊敬长辈。',
    10: '事业需要付出艰辛努力，但结果会持久而稳固。',
    11: '收入和收益缓慢但稳定地增长。',
    12: '可能出现独处、疲劳或开支增加——需要休息和谨慎。',
  },
  Rahu: {
    1: '欲望和不安增加，倾向于走非传统的道路。',
    2: '财务上存在不确定性，避免家庭中的混乱。',
    3: '勇气和胆量增加，但急躁可能导致损失。',
    4: '家中气氛不安——静心冥想有助于内心平静。',
    5: '在子女或教育方面感到困惑——避免做出不明确的决定。',
    6: '意外战胜对手，但要注意健康。',
    7: '在合作关系中谨防欺骗或误解——要清楚地沟通。',
    8: '可能发生神秘和意外的事件——需要耐心和警觉。',
    9: '对海外联系或非传统宗教倾向的兴趣增加。',
    10: '事业上可能出现突然的变化或意外的机会。',
    11: '收入可能增加，但来源可能不稳定。',
    12: '留意隐藏的开支或敌人，可能建立海外联系。',
  },
  Ketu: {
    1: '会感到内心困惑或淡漠，灵性倾向增加。',
    2: '对家庭或金钱较为淡漠，花钱需谨慎。',
    3: '勇气可能减退，或感到与兄弟姐妹疏远。',
    4: '对家庭事务有疏离感，独处有助于内心安宁。',
    5: '对子女或创作的兴趣可能减弱，对灵性的倾向增加。',
    6: '能战胜隐藏的对手，但要留意不明确的健康问题。',
    7: '在人际关系中感到距离或疏离——需要耐心和理解。',
    8: '可能发生意外的变化或损失，灵性倾向增加。',
    9: '对宗教和灵性事物有浓厚兴趣，可能突然出行。',
    10: '事业上可能感到困惑或淡漠，但在灵性追求上会取得成功。',
    11: '愿望可能发生变化，可能感到与朋友疏远。',
    12: '是灵性成长和内心平静的绝佳时机，独处会很有益。',
  },
};

const TRANSIT_PREDICTIONS = {
  ur: TRANSIT_PREDICTIONS_UR, en: TRANSIT_PREDICTIONS_EN,
  hi: TRANSIT_PREDICTIONS_HI, ar: TRANSIT_PREDICTIONS_AR, zh: TRANSIT_PREDICTIONS_ZH,
};
const TRANSIT_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function planetLabel(planet, lang) {
  if (lang === 'ur') return PLANET_NAME_URDU[planet] || planet;
  const names = PLANET_NAMES[lang];
  return (names && names[planet]) || planet; // en (or unknown key): English name as-is
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
const DIGNITY_MODIFIER_HI = {
  exalted: ' यह ग्रह अपनी उच्च अवस्था में है, इसलिए प्रभाव सामान्य से ज़्यादा मज़बूत और सकारात्मक होंगे।',
  own: ' यह ग्रह अपनी स्वराशि में है, इसलिए प्रभाव स्थिर और भरपूर रहेंगे।',
  debilitated: ' यह ग्रह कमज़ोर (नीच) अवस्था में है, इसलिए प्रभावों में अनिश्चितता या कमज़ोरी महसूस हो सकती है — अतिरिक्त सावधानी रखें।',
  retrograde: ' यह ग्रह अभी वक्री भी है, इसलिए इसका असर देरी से या भीतरी/दोहराए जाने वाले ढंग से महसूस होगा।',
};
const DIGNITY_MODIFIER_AR = {
  exalted: ' هذا الكوكب في الشرف، لذا ستكون آثاره أقوى وأكثر إيجابية من المعتاد.',
  own: ' هذا الكوكب في بيته، لذا ستكون آثاره مستقرة ووافية.',
  debilitated: ' هذا الكوكب في حالة ضعيفة (في الهبوط)، لذا قد تبدو آثاره غير مؤكدة أو ضعيفة — فاحرص على مزيد من الحذر.',
  retrograde: ' هذا الكوكب راجع حاليًا أيضًا، لذا سيُشعَر بأثره متأخرًا أو بصورة داخلية/متكررة.',
};
const DIGNITY_MODIFIER_ZH = {
  exalted: '该行星处于入旺状态，因此影响会比平时更强、更积极。',
  own: '该行星入庙（位于自己的星座），因此影响稳定而充分。',
  debilitated: '该行星处于落陷（较弱）状态，因此影响可能显得不确定或较弱——请格外谨慎。',
  retrograde: '该行星目前还处于逆行，因此其影响会延迟显现，或以内在、反复的方式体现。',
};
const DIGNITY_MODIFIER = {
  ur: DIGNITY_MODIFIER_UR, en: DIGNITY_MODIFIER_EN,
  hi: DIGNITY_MODIFIER_HI, ar: DIGNITY_MODIFIER_AR, zh: DIGNITY_MODIFIER_ZH,
};

// hi/ar/zh sentence templates for the transit builders (en/ur templates stay
// inline in the builders exactly as before).
const TRANSIT_TPL = {
  hi: {
    transit: (label, ord, effect, mod) => `${label} इस समय आपके ${ord} भाव में गोचर कर रहा है। ${effect}${mod}`,
    aspect: (label, ord, sig, effect, mod) => `${label} की दृष्टि आपके ${ord} भाव पर पड़ रही है — यह भाव ${sig} से संबंधित है। इस दृष्टि के प्रभाव में: ${effect}${mod}`,
    aspectShort: (ord, sig, effect) => `${ord} भाव पर दृष्टि (${sig}): ${effect}`,
    brief: (label, effect, mod) => `${label}: ${effect}${mod}`,
  },
  ar: {
    transit: (label, ord, effect, mod) => `العبور الحالي: ${label} في ${ord} من خريطتك الفلكية. ${effect}${mod}`,
    aspect: (label, ord, sig, effect, mod) => `يقع نظر ${label} على ${ord} من خريطتك — وهذا البيت يخصّ: ${sig}. وتحت تأثير هذا النظر: ${effect}${mod}`,
    aspectShort: (ord, sig, effect) => `النظر على ${ord} (${sig}): ${effect}`,
    brief: (label, effect, mod) => `${label}: ${effect}${mod}`,
  },
  zh: {
    transit: (label, ord, effect, mod) => `${label}目前正在行运经过您的${ord}。${effect}${mod}`,
    aspect: (label, ord, sig, effect, mod) => `${label}的相位（Drishti）正落在您的${ord}——该宫主管：${sig}。在此相位影响下：${effect}${mod}`,
    aspectShort: (ord, sig, effect) => `对${ord}的相位（${sig}）：${effect}`,
    brief: (label, effect, mod) => `${label}：${effect}${mod}`,
  },
};

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
      : TRANSIT_TPL[lang]
        ? TRANSIT_TPL[lang].transit(label, ordinal(house, lang), effect, modifier)
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
        : TRANSIT_TPL[lang]
          ? TRANSIT_TPL[lang].aspect(label, ordinal(aspectedHouse, lang), signification, effect, modifier)
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
        : TRANSIT_TPL[lang]
          ? TRANSIT_TPL[lang].aspectShort(ordinal(aspectedHouse, lang), signification, effect)
          : `Aspect on ${ordinal(aspectedHouse, lang)} house (${signification}): ${effect}`;
      return { aspectedHouse, text };
    });

    const transitText = lang === 'ur'
      ? `${label} اس وقت آپ کے ${ordinal(house, lang)} گھر میں گردش کر رہا ہے۔ ${transitEffect}${modifier}`
      : TRANSIT_TPL[lang]
        ? TRANSIT_TPL[lang].transit(label, ordinal(house, lang), transitEffect, modifier)
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
    const text = TRANSIT_TPL[lang] ? TRANSIT_TPL[lang].brief(label, effect, modifier) : `${label}: ${effect}${modifier}`;
    lines.push({ planet, planetLabel: label, house, text });
  }
  return lines;
}

const MONTHLY_PLANETS = ['Sun', 'Mercury', 'Venus', 'Mars'];
const YEARLY_PLANETS = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];

const MONTHLY_NOTE = {
  ur: 'یہ رجحان سورج، عطارد، زہرہ اور مریخ کی موجودہ راشی پر مبنی ہے — یہ سیارے تقریباً 3 سے 7 ہفتوں میں اپنی راشی بدلتے ہیں، اس لیے یہ اندازہ اگلے کچھ ہفتوں کے لیے قابلِ اعتماد ہے۔',
  en: 'This trend is based on the current sign positions of the Sun, Mercury, Venus and Mars — these planets change sign roughly every 3 to 7 weeks, so this estimate is reliable for the next few weeks.',
};
MONTHLY_NOTE.hi = 'यह रुझान सूर्य, बुध, शुक्र और मंगल की वर्तमान राशि पर आधारित है — ये ग्रह लगभग 3 से 7 सप्ताह में अपनी राशि बदलते हैं, इसलिए यह अनुमान अगले कुछ हफ़्तों के लिए भरोसेमंद है।';
MONTHLY_NOTE.ar = 'يستند هذا الاتجاه إلى الأبراج الحالية للشمس وعطارد والزهرة والمريخ — وهذه الكواكب تغيّر برجها كل 3 إلى 7 أسابيع تقريبًا، لذا فهذا التقدير موثوق للأسابيع القليلة القادمة.';
MONTHLY_NOTE.zh = '此趋势基于太阳、水星、金星和火星当前所在的星座——这些行星大约每3至7周更换一次星座，因此该预测在接下来几周内较为可靠。';

function buildMonthlyOutlook(gocharDetails, lang) {
  lang = normLang(lang);
  const lines = buildTransitLinesFor(gocharDetails, MONTHLY_PLANETS, lang);
  return { lines, note: MONTHLY_NOTE[lang] };
}

const YEARLY_NOTE = {
  ur: 'یہ رجحان مشتری، زحل، راہو اور کیتو کی موجودہ راشی پر مبنی ہے — یہ سیارے اپنی راشی میں تقریباً 1 سے 2.5 سال تک رہتے ہیں، اس لیے یہ اندازہ پورے سال کے لیے قابلِ اعتماد ہے۔',
  en: 'This trend is based on the current sign positions of Jupiter, Saturn, Rahu and Ketu — these planets stay in a sign for roughly 1 to 2.5 years, so this estimate is reliable for the whole year.',
};
YEARLY_NOTE.hi = 'यह रुझान गुरु, शनि, राहु और केतु की वर्तमान राशि पर आधारित है — ये ग्रह एक राशि में लगभग 1 से 2.5 वर्ष तक रहते हैं, इसलिए यह अनुमान पूरे वर्ष के लिए भरोसेमंद है।';
YEARLY_NOTE.ar = 'يستند هذا الاتجاه إلى الأبراج الحالية للمشتري وزحل وراهو وكيتو — وهذه الكواكب تبقى في البرج الواحد من سنة إلى سنتين ونصف تقريبًا، لذا فهذا التقدير موثوق للعام كله.';
YEARLY_NOTE.zh = '此趋势基于木星、土星、罗睺和计都当前所在的星座——这些行星在一个星座中大约停留1至2.5年，因此该预测在全年内较为可靠。';

// hi/ar/zh text for buildYearlyOutlook's `extra` lines.
const YEARLY_EXTRA_TPL = {
  hi: {
    maha: (lord) => `आपकी वर्तमान महादशा ${lord} की है — कई वर्षों तक चलने वाली यह अवधि आपके जीवन की समग्र दिशा तय कर रही है।`,
    sade: (ph) => `आप इस समय साढ़े साती${ph ? ` के "${ph}"` : ''} में भी हैं — यह ज़िम्मेदारी, धैर्य और अनुशासन सिखाने वाला दौर है, पूरे साल की योजना इसी हिसाब से बनाएँ।`,
    noSade: 'अच्छी बात यह है कि इस समय आप साढ़े साती में नहीं हैं, इसलिए शनि की ओर से अतिरिक्त दबाव की चिंता न करें।',
  },
  ar: {
    maha: (lord) => `الداشا الكبرى الحالية لديك هي داشا ${lord} — وهذه المرحلة الممتدة لسنوات عدّة ترسم الاتجاه العام لحياتك.`,
    sade: (ph) => `أنت الآن أيضًا في ساده ساتي${ph ? `، وتحديدًا في "${ph}"` : ''} — وهي فترة تعلّم المسؤولية والصبر والانضباط، فخطّط لعامك على هذا الأساس.`,
    noSade: 'والخبر الطيب أنك لست في ساده ساتي حاليًا، فلا تقلق من ضغط إضافي من جهة زحل.',
  },
  zh: {
    maha: (lord) => `您当前的大运是${lord}大运——这段持续多年的时期正在塑造您人生的整体方向。`,
    sade: (ph) => `您目前还处于土星七年半（Sade Sati）期间${ph ? `（${ph}）` : ''}——这是一段教人担当、耐心与自律的时期，请据此规划您的一年。`,
    noSade: '好消息是，您目前不在土星七年半（Sade Sati）期间，因此不必担心来自土星的额外压力。',
  },
};

function buildYearlyOutlook(gocharDetails, dasha, sadeSati, lang) {
  lang = normLang(lang);
  const lines = buildTransitLinesFor(gocharDetails, YEARLY_PLANETS, lang);
  const extra = [];

  const xt = YEARLY_EXTRA_TPL[lang];
  if (xt) {
    // hi/ar/zh
    if (dasha && dasha.mahadasha && dasha.mahadasha.lord) extra.push(xt.maha(planetLabel(dasha.mahadasha.lord, lang)));
    if (sadeSati && sadeSati.is_in_sade_sati) extra.push(xt.sade(sadeSatiPhaseLabel(sadeSati.transit_phase, lang)));
    else extra.push(xt.noSade);
  } else {
    // en/ur (unchanged)
    if (dasha && dasha.mahadasha && dasha.mahadasha.lord) {
      extra.push(lang === 'ur'
        ? `آپ کی موجودہ مہادشا ${dasha.mahadasha.lord} کی ہے — یہ کئی سالوں پر محیط دور آپ کی مجموعی زندگی کی سمت طے کر رہا ہے۔`
        : `Your current Mahadasha is of ${dasha.mahadasha.lord} — this multi-year period is shaping the overall direction of your life.`);
    }
    if (sadeSati && sadeSati.is_in_sade_sati) {
      extra.push(lang === 'ur'
        ? `آپ اس وقت ساڑھ ساتی کے "${sadeSati.transit_phase || ''}" مرحلے میں بھی ہیں — یہ ذمہ داری، صبر اور نظم و ضبط سکھانے کا دور ہے، سال بھر اسی حساب سے منصوبہ بندی کریں۔`
        : `You are also currently in the "${sadeSatiPhaseLabel(sadeSati.transit_phase, 'en')}" phase of Sade Sati — this is a period that teaches responsibility, patience and discipline; plan your year accordingly.`);
    } else {
      extra.push(lang === 'ur'
        ? 'اچھی بات یہ ہے کہ اس وقت آپ ساڑھ ساتی میں نہیں ہیں، تو زحل کی طرف سے اضافی دباؤ کی فکر نہ کریں۔'
        : "The good news is that you are not in Sade Sati right now, so don't worry about extra pressure from Saturn.");
    }
  }

  return { lines, extra, note: YEARLY_NOTE[lang], themed: buildYearlyThemed(lines, extra, lang) };
}

// ---- Yearly Outlook — theme-wise grouping (Phase 3 ROADMAP item: "Annual
// prediction ka FORMAT Zanjani/Imamia Jantri jaisa"). Research (documented
// in ROADMAP.md) found Zanjani/Imamia jantris are NOT a separate
// calculation technique — just a FORMAT/STYLE: simple, life-area-wise,
// easy Urdu. A true month-by-month version would need each slow planet's
// exact sign-CHANGE (ingress) dates for the whole coming year, which this
// app does not currently compute (only current transit positions) — that
// would be new astronomical-calculation scope, not a formatting change,
// so it is NOT attempted here (an honest, disclosed limitation rather
// than fabricated month-by-month dates). Instead, the SAME already-
// generated, already-verified transit lines are re-grouped by life theme
// (career/health/relationships/finance/general) — matching the
// Jantri-style presentation without inventing new astronomical claims.
const YEARLY_THEMES = [
  { key: 'career', houses: [10, 6], labelUr: 'کیریئر و کاروبار', labelEn: 'Career & Work', labelHi: 'करियर और कामकाज', labelAr: 'المهنة والعمل', labelZh: '事业与工作' },
  { key: 'health', houses: [1, 6, 8], labelUr: 'صحت و توانائی', labelEn: 'Health & Energy', labelHi: 'स्वास्थ्य और ऊर्जा', labelAr: 'الصحة والطاقة', labelZh: '健康与精力' },
  { key: 'relationships', houses: [7, 5], labelUr: 'رشتے و ازدواجی زندگی', labelEn: 'Relationships & Family', labelHi: 'रिश्ते और पारिवारिक जीवन', labelAr: 'العلاقات والأسرة', labelZh: '人际关系与家庭' },
  { key: 'finance', houses: [2, 11], labelUr: 'مالی معاملات', labelEn: 'Finance', labelHi: 'आर्थिक मामले', labelAr: 'الشؤون المالية', labelZh: '财务' },
  { key: 'general', houses: [9, 12, 3, 4], labelUr: 'عمومی رجحان و روحانیت', labelEn: 'General & Spiritual', labelHi: 'सामान्य रुझान और आध्यात्मिकता', labelAr: 'الاتجاه العام والروحانية', labelZh: '总体趋势与灵性' },
];
const YEARLY_OVERALL_LABEL = { hi: 'समग्र स्थिति', ar: 'الصورة العامة', zh: '总体情况' };
const LANG_SUFFIX = { hi: 'Hi', ar: 'Ar', zh: 'Zh' };

function buildYearlyThemed(lines, extra, lang) {
  const themed = YEARLY_THEMES.map((t) => {
    const themeLines = lines.filter((l) => t.houses.includes(l.house));
    return {
      key: t.key,
      label: lang === 'ur' ? t.labelUr : (LANG_SUFFIX[lang] ? t['label' + LANG_SUFFIX[lang]] : t.labelEn),
      lines: themeLines.map((l) => l.text),
    };
  }).filter((t) => t.lines.length > 0);
  if (extra && extra.length) {
    themed.push({
      key: 'overall',
      label: lang === 'ur' ? 'مجموعی صورتحال' : (YEARLY_OVERALL_LABEL[lang] || 'Overall picture'),
      lines: extra,
    });
  }
  return themed;
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
// hi/ar/zh: wahi Islami sadaqa/azkar — Arabic dua ke alfaaz Arabic script mein
// (hi/zh mein saath transliteration/tarjuma), koi mantra/upaya nahi.
const PLANET_REMEDY_HI = {
  Sun: { day: 'रविवार', text: 'रविवार के दिन गेहूँ या गुड़ का सदक़ा करना, अल्लाह का शुक्र अदा करना, और घमंड व अहंकार से बचने की कोशिश करना लाभदायक माना जाता है।' },
  Moon: { day: 'सोमवार', text: 'सोमवार के दिन दूध, चावल या सफ़ेद चीज़ों का सदक़ा करना, और मन की शांति के लिए नमाज़ में ध्यान और ज़्यादा ज़िक्र-ए-इलाही (अल्लाह का ज़िक्र) का एहतमाम करना लाभदायक माना जाता है।' },
  Mars: { day: 'मंगलवार', text: 'मंगलवार के दिन मसूर की दाल या लाल चीज़ों का सदक़ा करना, और गुस्सा आने पर "أعوذ بالله من الشيطان الرجيم" (अऊज़ु बिल्लाहि मिनश-शैतानिर-रजीम) पढ़कर वुज़ू कर लेना (नबी करीम ﷺ की सिखाई हुई सुन्नत) लाभदायक माना जाता है।' },
  Mercury: { day: 'बुधवार', text: 'बुधवार के दिन हरी चीज़ों का सदक़ा करना, और ज़बान की हिफ़ाज़त, सच बोलने और सोच-समझकर बात करने का एहतमाम करना लाभदायक माना जाता है।' },
  Jupiter: { day: 'गुरुवार', text: 'गुरुवार (जुमेरात) के दिन पीली चीज़ें, चने की दाल या केले का सदक़ा करना, और बुज़ुर्गों, माता-पिता और शिक्षकों का सम्मान करना लाभदायक माना जाता है।' },
  Venus: { day: 'शुक्रवार', text: 'शुक्रवार (जुमा) के दिन सफ़ेद चीज़ों या चीनी का सदक़ा करना, और हलाल रोज़ी और निकाह जैसे मामलों में तक़वा (परहेज़गारी) का ख़याल रखना लाभदायक माना जाता है।' },
  Saturn: { day: 'शनिवार', text: 'शनिवार के दिन काले तिल या सरसों के तेल का सदक़ा करना, गरीबों और मज़दूरों की मदद करना, और ज़्यादा इस्तिग़फ़ार (अल्लाह से माफ़ी माँगना), सब्र और नमाज़ की पाबंदी का एहतमाम करना लाभदायक माना जाता है।' },
  Rahu: { day: 'शनिवार', text: 'कंबल या काली/नीली चीज़ों का सदक़ा करना, वहम और बेसब्री से बचना, और ज़्यादा इस्तिग़फ़ार करना लाभदायक माना जाता है।' },
  Ketu: { day: 'मंगलवार', text: 'कंबल या तिल का सदक़ा करना, और नफ़्ल नमाज़ों और क़ुरआन की तिलावत पर ध्यान देना लाभदायक माना जाता है।' },
};
const PLANET_REMEDY_AR = {
  Sun: { day: 'الأحد', text: 'التصدّق بالقمح أو بالسكر الخام (الجاغري) يوم الأحد، وشكر الله تعالى، والسعي إلى تجنّب الكِبر والغرور، يُعدّ من الأمور النافعة.' },
  Moon: { day: 'الاثنين', text: 'التصدّق بالحليب أو الأرز أو الأشياء البيضاء يوم الاثنين، والحرص على الخشوع في الصلاة والإكثار من ذكر الله لراحة البال، يُعدّ من الأمور النافعة.' },
  Mars: { day: 'الثلاثاء', text: 'التصدّق بالعدس أو الأشياء الحمراء يوم الثلاثاء، وعند الغضب قول "أعوذ بالله من الشيطان الرجيم" ثم الوضوء (وهي سنّة علّمنا إياها النبي ﷺ)، يُعدّ من الأمور النافعة.' },
  Mercury: { day: 'الأربعاء', text: 'التصدّق بالأشياء الخضراء يوم الأربعاء، وحفظ اللسان وقول الصدق والتفكّر قبل الكلام، يُعدّ من الأمور النافعة.' },
  Jupiter: { day: 'الخميس', text: 'التصدّق بالأشياء الصفراء أو الحمّص المجروش أو الموز يوم الخميس، وإكرام كبار السن والوالدين والمعلّمين، يُعدّ من الأمور النافعة.' },
  Venus: { day: 'الجمعة', text: 'التصدّق بالأشياء البيضاء أو السكر يوم الجمعة، ومراعاة التقوى في أمور مثل الرزق الحلال والنكاح، يُعدّ من الأمور النافعة.' },
  Saturn: { day: 'السبت', text: 'التصدّق بالسمسم الأسود أو زيت الخردل يوم السبت، ومساعدة الفقراء والعمّال، والإكثار من الاستغفار والصبر والمحافظة على الصلاة، يُعدّ من الأمور النافعة.' },
  Rahu: { day: 'السبت', text: 'التصدّق ببطانية أو بأشياء داكنة/زرقاء، وتجنّب الأوهام وقلّة الصبر، والإكثار من الاستغفار، يُعدّ من الأمور النافعة.' },
  Ketu: { day: 'الثلاثاء', text: 'التصدّق ببطانية أو بالسمسم، والاهتمام بصلاة النوافل وتلاوة القرآن الكريم، يُعدّ من الأمور النافعة.' },
};
const PLANET_REMEDY_ZH = {
  Sun: { day: '星期日', text: '在星期日施舍（Sadaqah）小麦或粗糖，感谢真主，并努力避免骄傲自大，被认为是有益的。' },
  Moon: { day: '星期一', text: '在星期一施舍牛奶、大米或白色物品，并为求内心安宁而在礼拜中专注、多多记念真主（Dhikr），被认为是有益的。' },
  Mars: { day: '星期二', text: '在星期二施舍红扁豆或红色物品；生气时念诵“أعوذ بالله من الشيطان الرجيم”（A’oodhu billahi minash-shaytanir-rajeem，意为“我求真主护佑，免遭被逐出的恶魔之害”）并做小净（Wudu，这是先知ﷺ教导的圣行），被认为是有益的。' },
  Mercury: { day: '星期三', text: '在星期三施舍绿色物品，并谨守口舌、诚实说话、三思而后言，被认为是有益的。' },
  Jupiter: { day: '星期四', text: '在星期四施舍黄色物品、鹰嘴豆瓣或香蕉，并尊敬长辈、父母和老师，被认为是有益的。' },
  Venus: { day: '星期五', text: '在星期五（聚礼日）施舍白色物品或糖，并在合法（Halal）收入和婚姻（Nikah）等事务上保持敬畏（Taqwa），被认为是有益的。' },
  Saturn: { day: '星期六', text: '在星期六施舍黑芝麻或芥子油，帮助穷人和劳动者，并多求恕饶（Istighfar）、保持忍耐、坚持礼拜，被认为是有益的。' },
  Rahu: { day: '星期六', text: '施舍毛毯或深色/蓝色物品，避免迷信和急躁，并多求恕饶（Istighfar），被认为是有益的。' },
  Ketu: { day: '星期二', text: '施舍毛毯或芝麻，并专注于副功拜（Nafl）和诵读《古兰经》，被认为是有益的。' },
};
const PLANET_REMEDY = {
  ur: PLANET_REMEDY_UR, en: PLANET_REMEDY_EN,
  hi: PLANET_REMEDY_HI, ar: PLANET_REMEDY_AR, zh: PLANET_REMEDY_ZH,
};

// hi/ar/zh titles/texts for buildRemedies (en/ur stay inline as before).
const REMEDY_TPL = {
  hi: {
    mangal: 'मंगल दोष',
    kaalsarpTitle: 'काल सर्प योग',
    kaalsarpText: 'कंबल या तिल का सदक़ा करना, ज़्यादा इस्तिग़फ़ार करना, और सब्र के साथ मामलों को समय देना लाभदायक माना जाता है — यह योग हर काम को नहीं रोकता, बस परिणाम थोड़ी देर से आता है।',
    sadesati: (ph) => `साढ़े साती${ph ? ' — ' + ph : ''}`,
    weak: (label) => `${label} कमज़ोर (नीच) अवस्था में`,
    noneTitle: 'कोई खास दोष नहीं',
    noneText: 'आपकी कुंडली में फ़िलहाल कोई गंभीर दोष या कमज़ोर ग्रह नज़र नहीं आ रहा — आम सदक़ा, नमाज़ और अच्छे आमाल की पाबंदी ही काफ़ी है।',
    noteTitle: 'नोट',
    noteText: 'ये पारंपरिक (शास्त्रीय) सिद्धांतों पर आधारित सामान्य सुझाव हैं, इन्हें पक्की गारंटी न समझें — अहम फ़ैसलों (ख़ासकर शादी या स्वास्थ्य से जुड़े) में किसी भरोसेमंद आलिम या विशेषज्ञ से सलाह ज़रूर लें।',
  },
  ar: {
    mangal: 'منغال دوشا',
    kaalsarpTitle: 'يوغا كال سارب',
    kaalsarpText: 'التصدّق ببطانية أو بالسمسم، والإكثار من الاستغفار، وإعطاء الأمور وقتها بالصبر، يُعدّ من الأمور النافعة — فهذه اليوغا لا تعطّل كل شيء، وإنما تعني أن النتائج تأتي متأخرة قليلًا.',
    sadesati: (ph) => `ساده ساتي${ph ? ' — ' + ph : ''}`,
    weak: (label) => `${label} في حالة ضعيفة (في الهبوط)`,
    noneTitle: 'لا يوجد عارض كبير',
    noneText: 'لا يظهر في خريطتك الفلكية حاليًا أي دوشا (عارض) خطير أو كوكب ضعيف — ويكفي المداومة على الصدقة المعتادة والصلاة والأعمال الصالحة.',
    noteTitle: 'ملاحظة',
    noteText: 'هذه نصائح عامة مبنية على المبادئ التقليدية (الكلاسيكية)، فلا تعدّها ضمانًا قاطعًا — وفي القرارات المهمة (لا سيما ما يتعلق بالزواج أو الصحة) استشر عالمًا أو مختصًا موثوقًا.',
  },
  zh: {
    mangal: '火星凶位（Mangal Dosha）',
    kaalsarpTitle: '卡尔萨帕瑜伽组合（Kaal Sarp Yoga）',
    kaalsarpText: '施舍毛毯或芝麻、多求恕饶（Istighfar），并耐心地给事情一些时间，被认为是有益的——这一组合并不会阻碍一切，只是意味着结果来得稍晚一些。',
    sadesati: (ph) => `土星七年半（Sade Sati）${ph ? ' — ' + ph : ''}`,
    weak: (label) => `${label}处于落陷（较弱）状态`,
    noneTitle: '无明显不利因素',
    noneText: '您的星盘目前没有显示严重的不利组合（Dosha）或弱势行星——坚持日常的施舍、礼拜和善行就足够了。',
    noteTitle: '备注',
    noteText: '以上是基于传统经典原则的一般性建议，请勿视为确定的保证——在重要决定（尤其是婚姻或健康方面）上，请务必咨询可信赖的学者或专业人士。',
  },
};

function buildRemedies(facts, lang) {
  lang = normLang(lang);
  if (REMEDY_TPL[lang]) return buildRemediesT(facts, lang);
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
        : `Sade Sati${facts.sadeSatiPhase ? ' — ' + sadeSatiPhaseLabel(facts.sadeSatiPhase, 'en') + ' phase' : ''}`,
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

// hi/ar/zh — same items, same keys, same order as buildRemedies() above.
function buildRemediesT(facts, lang) {
  const remedy = PLANET_REMEDY[lang];
  const T = REMEDY_TPL[lang];
  const items = [];

  if (facts.hasMangalDosha) {
    items.push({ key: 'mangal', title: T.mangal, text: remedy.Mars.text });
  }
  if (facts.hasKaalSarpDosha) {
    items.push({ key: 'kaalsarp', title: T.kaalsarpTitle, text: T.kaalsarpText });
  }
  if (facts.isInSadeSati) {
    items.push({ key: 'sadesati', title: T.sadesati(sadeSatiPhaseLabel(facts.sadeSatiPhase, lang)), text: remedy.Saturn.text });
  }
  for (const planet of facts.weakNatalPlanets || []) {
    const r = remedy[planet];
    if (!r) continue;
    items.push({ key: `weak-${planet}`, title: T.weak(planetLabel(planet, lang)), text: r.text });
  }
  if (items.length === 0) {
    items.push({ key: 'none', title: T.noneTitle, text: T.noneText });
  }
  items.push({ key: 'disclaimer', title: T.noteTitle, text: T.noteText });
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
// hi/ar/zh: `name` English hi rehta hai (frontend khud localize karta hai),
// sirf `color` translate hota hai.
const WEEKDAY_COLORS = {
  hi: ['नारंगी या लाल', 'सफ़ेद', 'लाल', 'हरा', 'पीला', 'सफ़ेद या गुलाबी', 'काला या नीला'],
  ar: ['البرتقالي أو الأحمر', 'الأبيض', 'الأحمر', 'الأخضر', 'الأصفر', 'الأبيض أو الوردي', 'الأسود أو الأزرق'],
  zh: ['橙色或红色', '白色', '红色', '绿色', '黄色', '白色或粉色', '黑色或蓝色'],
};
function weekdayTableFor(lang) {
  const colors = WEEKDAY_COLORS[lang];
  return WEEKDAY_LORD_EN.map((w, i) => ({ planet: w.planet, name: w.name, color: colors[i] }));
}
const WEEKDAY_LORD = {
  ur: WEEKDAY_LORD_UR, en: WEEKDAY_LORD_EN,
  hi: weekdayTableFor('hi'), ar: weekdayTableFor('ar'), zh: weekdayTableFor('zh'),
};

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
const HOUSE_LORD_OUTLOOK_HI = {
  exalted: 'बहुत मज़बूत अवस्था में है, आज परिणाम सामान्य से बेहतर रहने की उम्मीद है',
  own: 'अपनी स्वराशि में स्थिर है, आज मामले संभले हुए महसूस होंगे',
  debilitated: 'कमज़ोर अवस्था में है, आज इस क्षेत्र में अतिरिक्त धैर्य और सावधानी से काम लें',
  default: 'मध्यम अवस्था में है, आज का परिणाम आपकी अपनी कोशिश पर ज़्यादा निर्भर करेगा',
};
const HOUSE_LORD_OUTLOOK_AR = {
  exalted: 'في حالة قوية جدًا، ويُتوقّع أن تكون نتائج اليوم أفضل من المعتاد',
  own: 'مستقر في بيته، وينبغي أن تبدو الأمور اليوم تحت السيطرة',
  debilitated: 'في حالة ضعيفة، فيلزم اليوم مزيد من الصبر والحذر في هذا المجال',
  default: 'في حالة متوسطة، وستعتمد نتيجة اليوم أكثر على جهدك أنت',
};
const HOUSE_LORD_OUTLOOK_ZH = {
  exalted: '处于非常强的状态——今天的结果有望好于平时',
  own: '入庙而稳定——今天的事情应能掌控得当',
  debilitated: '处于较弱状态——今天在这方面需要多一分耐心和谨慎',
  default: '处于中等状态——今天的结果更多取决于您自己的努力',
};
const HOUSE_LORD_OUTLOOK = {
  ur: HOUSE_LORD_OUTLOOK_UR, en: HOUSE_LORD_OUTLOOK_EN,
  hi: HOUSE_LORD_OUTLOOK_HI, ar: HOUSE_LORD_OUTLOOK_AR, zh: HOUSE_LORD_OUTLOOK_ZH,
};

// hi/ar/zh daily category sentence. `lord` = localized planet name.
const DAILY_TPL = {
  hi: (label, ord, lord, outlook, moon) => `${label} के भाव (${ord} भाव) का स्वामी ${lord} ${outlook}।${moon ? ' आज चंद्र के हिसाब से समग्र माहौल: ' + moon : ''}`,
  ar: (label, ord, lord, outlook, moon) => `ربّ بيت ${label} (${ord})، وهو ${lord}، ${outlook}.${moon ? ' الأجواء العامة لليوم بحسب القمر: ' + moon : ''}`,
  zh: (label, ord, lord, outlook, moon) => `${label}宫（${ord}）的宫主星${lord}${outlook}。${moon ? '今日依据月亮的整体氛围：' + moon : ''}`,
};

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
      : DAILY_TPL[lang]
        ? DAILY_TPL[lang](label, ordinal(houseNum, lang),
          houseData.lordLatin ? planetLabel(houseData.lordLatin, lang) : houseData.lord, outlook, moonEffect)
        : `The lord of the ${label} house (${ordinal(houseNum, lang)}), ${houseData.lordLatin || houseData.lord}, ${outlook}.${moonEffect ? " Today's overall mood based on the Moon: " + moonEffect : ''}`;
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
