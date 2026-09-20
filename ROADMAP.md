# Zaicha — Product Roadmap

Yeh file Zaicha project ki har hidayat/feature-request aur uska status track karne ke liye hai — taake har naye session mein sab kuch chat history se dobara nikalna na paray. Jo item complete ho jaye usay `[x]` mark kar dein.

Last updated: 2026-09-19 (session 2, cont'd)

---

## Already decided (reference — dobara discuss karne ki zaroorat nahi)

- Vedic astrology (Western nahi), North Indian diamond/square chart style
- Calculation engine: `ASTRO_PROVIDER` env se control hota hai — default ab **VedAstro** hai (`lib/vedastro-client.js`), Prokerala (`lib/prokerala-client.js`) sirf `ASTRO_PROVIDER=prokerala` set karne par. **NOTE (is session mein pehli baar live discover hua):** VedAstro ka free tier sirf 5 calls/minute allow karta hai, aur ek hi `/api/kundli` request ke andar khud kai sub-calls lagti hain (natal + gochar + panchang + ashtakavarga waghera) — is liye real traffic mein rate-limit errors aa sakti hain. Ye premium key ($1/month) se fix ho sakta hai — abhi tak nahi liya gaya, aage discuss karna hoga.
- Freemium model: free = daily prediction, basic chart, dasha, remedies, panchang; paid = weekly calendar, monthly/yearly outlook, Ashtakavarga
- Pricing: PKR 1000/month, PKR 11000/year, + USD option for international users
- Payments: card-based (JazzCash/Easypaisa personal wallets nahi); Android app ke liye Google Play Billing
- Ship path: pehle web app (live: zaicha-app.onrender.com) → phir Capacitor se Android app wrap
- Default language: English (Urdu/Hindi baad mein secondary; long-term goal = visitor ke mulk ki language auto-detect ho)
- AI Astrologer chat feature: **deferred** — abhi priority nahi

---

## Phase 1 — Core Deep-Dive Features ✅ DONE (deployed + live-tested)

- [x] Yoga Detection engine
- [x] Navamsa (D9) divisional chart
- [x] Per-planet deep profile screen (sign, house, degree, nakshatra+pada+lord, dignity, retrograde/combust, navamsa placement)

## Phase 2 — Strength & Dasha Systems (in progress)

- [x] Graha Bala (simplified Shad Bala planet-strength score, 5 classical components + disclaimer) — deployed & live-verified
- [x] **Yogini Dasha — CODE COMPLETE, deploy pending (2026-09-19 session 2 cont'd)**: classical 36-year, 8-Yogini system (`lib/yogini-dasha.js`, brand-new — koi API ye dasha provide nahi karti, poori tarah is app ke andar khud calculate hoti hai, do independent classical sources se formula verify karne ke baad). `server.js` mein `/api/kundli` response ke andar `yoginiDasha` field wire ho chuka hai (Mahadasha/Antardasha, current + full tree — Vimshottari jaisi hi shape). `index.html` mein naya subscreen "یوگنی دشا" (shortcut icon + Dasha tab jaisa hi drill-down tree, upar wala buildDashaTreeRow/dashaRangeText reuse kiya gaya) add ho chuka hai, teeno languages (en/ur/hi-fallback) mein. Node se syntax-check + Rohini reference-example + 200-trial stress test + chronological-continuity checks pehle hi ho chuke the; is round mein server.js wiring bhi syntax-check ho chuki hai. **Baaqi:** live redeploy + browser mein visual test (naya shortcut button, subscreen, tree drill-down).
- [ ] Chara Dasha (Jaimini) — building block ban chuka hai (neeche dekhein), asal dasha-sequence logic agla step hai
  - [x] **Chara Karaka (Jaimini) shared building block — CODE COMPLETE, deploy pending (2026-09-20)**: `lib/jaimini-karaka.js` (brand-new) — har graha ki apni raashi mein degree (0-30) ke hisab se 8 karaka ranks (Atmakaraka..Darakaraka) nikalta hai; Rahu ka hisaab classical ulta rule se (30 - degree), Ketu dono schemes se bahar (3 independent sources — Jagannatha Hora, Paramarsh, Shubham Alock — se cross-verify kiya). **Honestly disclosed open item:** 8-Karaka (Rahu shamil) aur 7-Karaka (Rahu ke bagair) dono classical hain, koi ek "sahih" nahi — module dono return karta hai (`karakas` = 8-scheme default, `karakas7` = alternate), taake baad mein user ko scheme choose karne ka option diya ja sake. `server.js` mein `charaKarakas` field wire ho chuka hai. `index.html` mein naya subscreen "چر کارک" (icon-card list, Graha Bala jaisa layout reuse) add ho chuka hai, teeno languages mein. 500-trial random stress test + hath se worked example verify ho chuka hai (0 fails)। **Baaqi:** live redeploy + visual test; iske baad hi Chara Dasha ki asal sign-sequence algorithm par kaam shuru hoga (alag, zyada mushkil formula — apni tehqeeq abhi baaqi hai).
- [ ] Varshaphal (annual/solar-return chart) — **Muntha hissa CODE COMPLETE, deploy pending (2026-09-20)**: `lib/varshaphal.js` (naya) — Muntha (progressed ascendant, har saal 1 raashi aagay) 2 independent sources se verify kiya, formula bila-tazad mila (`(Lagna + completed age) mod 12`), worked example se match ho gaya. `server.js` mein `muntha` field wire, `index.html` mein "اس سال کا رجحان" (Yearly) screen ke sar par chhota card add ho chuka hai. **Jaan-boojh kar abhi shamil nahi:** asal solar-return MOMENT (nayi API call chahiye, VedAstro rate-limit masle se juda hua) aur Varshesh/year-lord (Panchadhikari method) — dono par sources aapas mein muttafiq nahi (Chara Dasha jaisa hi masla), is liye alag research chahiye hogi.

## Phase 3 — Requested features (not yet scheduled/started)

- [x] **Multi-language reports [FOUNDATIONAL] — CODE COMPLETE, deploy pending device reconnect (2026-09-19 session 2)**: `lib/narrative.js`, `lib/yoga-engine.js` ab poori tarah EN/UR (HI abhi EN fallback) mein content generate karte hain, `lang` param `/api/kundli` request se leke server.js poora thread karta hai, frontend `currentLang` bhejta hai. `lib/navamsa.js`, `lib/planet-profile.js`, `lib/graha-bala.js`, `lib/astro-engine.js` (houses.lord/ascendant/system) sab mein ab bilingual fields (`XLatin`/`XEn`) add ho chuke hain. `index.html` ke saare render functions (chart subhead, navamsa, planet profiles, graha bala, house list, predictions, daily routine, panchang labels, yogas, ashtakavarga, dasha panel + tree, hero strip) currentLang ke mutabiq sahi field/label chunte hain. Node se syntax-check + functional smoke-test (500 random natal charts × 3 languages, 0 crash) ho chuka hai — live deploy sirf isliye baaqi hai kyunke user ka computer session ke dauran do baar disconnect ho gaya. **Baaqi:** live redeploy + har language mein visual re-test; Hindi ka asal translation (abhi EN fallback) alag se scheduled hai.
- [x] **Predictions ko concrete/specific banana — dobara jaanch kar CONFIRMED DONE (2026-09-20)**: is session ke shuru mein `TRANSIT_PREDICTIONS_EN`/`_UR` ke poore 108/108 entries verify ho chuke thay — content check karne par pata chala ye ab generic "graha X ghar Y ko affect karta hai" nahi, balke specific asar likhe hain (misal: Sun 4th house — "gharelu zindagi mein halchal, walida ki sehat aur apna sukoon dekhein"). Ye item is note likhe jaane ke baad already improve ho chuka tha, is liye ab mukammal mana ja raha hai.
- [x] **Planet Significations (Karakatva) list — CODE COMPLETE, deploy pending (2026-09-20)**: dono hisse ab "چر کارک" screen mein sath dikhte hain — (1) Naisargika Karaka (fixed table, 7 classical graha, 2 independent sources — Steer + Phaladeepika — se cross-verify kiya, koi tazad nahi mila) `lib/jaimini-karaka.js` ke `buildNaisargikaKarakas()` se; (2) Chara Karaka (upar dekhein) same screen ke upar wale hisse mein. Rahu/Ketu ka naisargika karakatva ALAG-ALAG texts mein mukhtalif bataya jata hai (koi ek mustanad list nahi mili), is liye — Graha Bala ki tarah — sirf 7 classical graha shamil kiye gaye.
- [ ] Branded downloadable PDF kundli report (jaisa "Dhruv Astro Software" sample PDF dikhaya gaya) — customer/astrologer ka apna naam+contact har page par
- [ ] "Learning Astrology" section — YouTube teaching videos (Asman Ki Saltanat project se link) — app ke do main hisse: "Zaicha" (chart) + "Learning"
- [ ] Annual prediction ka FORMAT Zanjani Jantri/Imamia Jantri jaisa (neeche research note dekhein)
- [ ] Interactive click-a-planet chart menu (Signs/Vargas/Owns — OMNIS 7 jaisa)
- [ ] OMNIS-7 Feature Buttons se baaqi items: Bhava Bala, Vimshopak, multi-dasha merge views, Panchang Calendar/List, New/Full Moons & Eclipses, Aspects view, KP Info, Western Chart, Arabian Parts, Prasna (horary), Compatibility/matching, report/output generation
- [ ] Lal Kitab, KP system options (AstroSage jaisa menu)
- [ ] AI Astrologer chat feature (deferred, priority nahi abhi)

---

## Research note — Zanjani Jantri / Imamia Jantri (checked online: Aiena-e-Qismat/Zanjani Store, AQ TV / "Zanjani TV", syedalizanjani.com)

Yeh dono ek "alag calculation system" (jaisa Vimshottari ya KP hai) NAHI hain — yeh salana Urdu almanac/jantri publications hain jo teen cheezein mix karti hain:
1. Burj-wise (zodiac sign) monthly narrative predictions (general Vedic/transit-style commentary)
2. Islamic spiritual amaliyat/wazaif (rituals, taweez, dua)
3. Islamic calendar dates/tareekhein

Inki asal khoobi ek unique mathematical technique nahi, balke **format aur style** hai — simple, aam Urdu-speaking reader ke liye asaan zaban mein mahwar (monthly) tarteeb. Sifarish: Zaicha ke Yearly Outlook ko isi FORMAT/STYLE mein likhein (Burj-wise, mahwar, asaan Urdu), na ke kisi "khaas Zanjani/Imamia technique" ko reverse-engineer karne ki koshish karein — kyunke aisi koi published technique mojood nahi.

---

## Research note — Chara Dasha (Jaimini) — abhi tak SIRF research hui hai, koi code nahi likha (2026-09-20)

AKSRA usool ke mutabiq: implement karne se pehle formula ko cross-verify karna zaroori hai, aur is dasha mein — Yogini Dasha/Chara Karaka ke bar-aks — sources aapas mein poori tarah muttafiq NAHI hain. Isi liye is item par abhi code nahi likha gaya, sirf research documented hai taake agla session shuru se na kare:

**Confirmed (bila-tazad, 2+ sources se match hua):**
- Har raashi ki apni Mahadasha ki duration: us raashi se uske lord ki raashi tak ginti karo (dono sirey shamil), phir 1 minus karo. Odd raashi (Aries/Gemini/Leo/Libra/Sagittarius/Aquarius) = forward ginti, Even raashi = backward ginti.
- Agar lord usi raashi mein baitha ho (0 aata), to jawab 12 saal liya jata hai (poora chakar mukammal).
- Poori dasha-sequence ki DIRECTION (kaunsi raashi ke baad kaunsi aayegi) Lagna ki odd/even qismat se tay hoti hai — Lagna odd ho to zodiac ke forward tarteeb mein, even ho to backward.
- Antardasha: har Mahadasha 12 raashi ki Antardashas mein barabar (Mahadasha/12) hisson mein baant di jati hai.

**Open/contested (mukhtalif lineages mukhtalif jawab detay hain — is liye abhi tak koi ek "sahih" nahi chuna gaya):**
- Poori dasha-sequence ka STARTING sign hamesha Lagna nahi hota — Sanjay Rath (srath.com) ke mutabiq "dasha stronger sign se shuru hoti hai — Lagna ya 7th house, jo bhi 'zyada mazboot' ho" — magar "sign strength" nikalne ka apna formula alag se verify karna hoga (abhi tak nahi kiya).
- Ek exception rule ki baat kai jagah milti hai (agar lord raashi se 7th mein ho to ginti ulti ho jati hai) — magar is exact rule ko kisi bhi source se mukammal confirm nahi kar saka; ye missing hai.
- Exalted/debilitated planet ki wajah se saal mein +1/-1 ka adjustment — Parashara ka tareeqa aur K.N. Rao ka tareeqa alag hain (dono "classical" mane jate hain, koi consensus nahi).
- Antardasha ki tarteeb mein khud Mahadasha wali raashi PEHLI antardasha hai ya AAKHRI — "kuch lineages pehli rakhte hain, ziyada tar Jaimini teachers aakhri rakhte hain" (kisi ek published source ne bhi seedha confirm nahi kiya).

**Faisla:** jab tak in 4 open sawalon mein se kam az kam "starting sign" aur "7th-lord exception" ka jawab kisi mustanad classical text (jaise khud Jaimini Sutras ka tarjuma, ya Sanjay Rath ki kitab "Narayana Dasha") se seedha na mil jaye, tab tak code nahi likha jayega — warna app mein aisi dates dikhengi jo "confidently wrong" ho sakti hain, jo AKSRA usool ke seedha khilaf hai. Agla qadam: in specific sawalon ke liye targeted research (kitaab/PDF access ya kisi Jaimini-focused forum se).

---

## Kaise use karein

Har baar jab koi item complete ho, is file mein `[ ]` ko `[x]` kar dein aur "Last updated" date update kar dein. Yeh file project repo mein (`ROADMAP.md`) rehti hai taake future session ise seedha parh sakay.
