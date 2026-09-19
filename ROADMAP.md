# Zaicha — Product Roadmap

Yeh file Zaicha project ki har hidayat/feature-request aur uska status track karne ke liye hai — taake har naye session mein sab kuch chat history se dobara nikalna na paray. Jo item complete ho jaye usay `[x]` mark kar dein.

Last updated: 2026-09-19

---

## Already decided (reference — dobara discuss karne ki zaroorat nahi)

- Vedic astrology (Western nahi), North Indian diamond/square chart style
- Calculation engine: Prokerala API (Lahiri ayanamsa), Ruby paid plan
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
- [ ] Yogini Dasha
- [ ] Chara Dasha (Jaimini) — pehle Chara Karaka calculate karna zaroori hai (neeche dekhein — shared building block)
- [ ] Varshaphal (annual/solar-return chart)

## Phase 3 — Requested features (not yet scheduled/started)

- [ ] **Multi-language reports [FOUNDATIONAL — pehle karne wala kaam]**: abhi prediction/narrative text sirf Urdu mein hardcoded hai (narrative.js + Yoga/Navamsa/Planet-Profile/Graha-Bala sab). Jab tak yeh fix nahi hota, "jo language select ho usi mein report download ho" wala requirement poora nahi ho sakta.
- [ ] Predictions ko zyada concrete/specific banana — abhi sirf "yeh graha is ghar ko affect karta hai" type abstract statement hai; asal, samajh aane wala asar likhna hai
- [ ] Planet Significations (Karakatva) list:
  - Naisargika Karaka (fixed — Sun=baap/rooh, Moon=maa/zehn, waghera)
  - Chara Karaka (Jaimini, degree-based, har kundli mein alag) — **yeh Chara Dasha (Phase 2) ke liye bhi zaroori hai, is liye dono sath ban sakte hain**
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

## Kaise use karein

Har baar jab koi item complete ho, is file mein `[ ]` ko `[x]` kar dein aur "Last updated" date update kar dein. Yeh file project repo mein (`ROADMAP.md`) rehti hai taake future session ise seedha parh sakay.
