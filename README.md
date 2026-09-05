# Zaicha — پہلا فُل اسٹیک ورژن (v0.1)

یہ Zaicha کا پہلا حقیقی معنوں میں کام کرنے والا ورژن ہے: ایک چھوٹا backend
سرور (Node.js/Express) جو براہِ راست Prokerala API کو کال کرتا ہے، اور ایک
frontend جو حقیقی پیدائشی تفصیلات لے کر اصل کنڈلی، خانوں کے حاکم، موجودہ
دشا اور ایک اردو پیشگوئی دکھاتا ہے۔

**اہم بات:** آپ کی اصل Prokerala Client ID/Secret نہ کبھی Claude نے دیکھی
ہے، نہ اس کوڈ میں کہیں لکھی گئی ہے۔ یہ صرف آپ کے اپنے ہاتھ سے `.env` فائل
میں جائیں گی۔

---

## چلانے کا طریقہ

1. یہ فولڈر اپنے کمپیوٹر پر کہیں rakhein (جہاں Node.js نصب ہو — نہ ہو تو
   nodejs.org سے install karein, version 18 ya us se naya).

2. Terminal/Command Prompt is folder mein khol kar:
   ```
   npm install
   ```

3. `.env.example` file ko copy kar ke `.env` naam se save karein, phir
   `.env` file ko kisi bhi text editor mein khol kar apni ASAL Prokerala
   Client ID aur Client Secret khud type/paste karein (jo aap ke pehle se
   maujood `.env` file mein hain, jo aap ne prokerala_test.py ke liye
   banayi thi).

4. Server chalayein:
   ```
   npm start
   ```

5. Browser mein kholein:
   ```
   http://localhost:3000
   ```

6. Form mein apni (ya kisi bhi) pedaishi tafseelat bharein aur "زائچہ
   بنائیں" dabayein — ye seedha aap ke Prokerala account se real data
   layega.

---

## "Saved kundliyan" (har user ki tafseelat save karna) — Supabase setup

Ye feature optional hai — agar `.env` mein `DATABASE_URL` nahi di jaye to
app pehle jaisa hi chalta hai, bas koi profile save nahi hoti. Feature on
karne ke liye:

1. [supabase.com](https://supabase.com) par mufat account banayein (credit
   card ki zaroorat nahi).
2. Naya project banayein (koi bhi naam, koi bhi region — Singapore/Mumbai
   Pakistan se sab se qareeb hai).
3. Project ke andar **Project Settings → Database → Connection string →
   URI** mein ja kar poori connection string copy karein.
4. Apni `.env` file mein `DATABASE_URL=` ke aage ye poori string paste kar
   dein (jahan `[YOUR-PASSWORD]` likha ho wahan apna project ka database
   password khud daalein — ye password aap ne project banate waqt khud
   chuna tha).
5. Server dobara chalayein (`npm start`) — pehli dafa chalte hi zaroori
   table (`profiles`) khud-ba-khud ban jayegi.
6. Render par deploy karte waqt, Render dashboard ke **Environment**
   section mein bhi yahi `DATABASE_URL` variable add karna hoga (bilkul
   `PROKERALA_CLIENT_ID`/`SECRET` ki tarah).

**Ye kya karta hai:** jab form mein phone number bhi diya jaye, to user ki
tafseelat (naam, DOB, waqt, shehar) save ho jati hain, aur wahi phone
number dobara dala jaye to pehle se saved kundliyan ki list mil jati hai —
dobara sab kuch type nahi karna parta. Iske sath ek badi cost-saving bhi
hai: kisi bhi shakhs ki pedaishi bunyaadi tafseelat (kundli/advanced,
natal planet-position, kaal-sarp, ashtakavarga, pedaish ka panchang) EK
DAFA fetch ho kar cache ho jati hain — agli baar wahi profile dobara
generate karne par sirf aaj ki gardish (gochar), Sade Sati status, aur
aaj ka panchang hi naye sirey se Prokerala se mangwaye jaate hain. Is se
ek "confirm" ho chuki profile ka har baad wala generate ~440-740 credits
ki bajaye taqreeban sirf ~70 credits leta hai.

**Zaroori:** phone number jaisi tafseelat jama karna ek zimmedari bhi hai
— agar app public/paid users ke liye launch karni hai to ek chhoti si
privacy note (data kis liye use hoga) add karna aur data ko mehfooz rakhna
zaroori hoga.

---

## Is version mein kya asli/live hai, aur kya abhi baaki hai

**Asli/Live (Prokerala se seedha):**
- Kundli (Lagna, Chandra Rashi, Nakshatra), Mangal Dosha
- Har planet ka sign aur is se nikala gaya har house ka number (Lagna se)
- Sade Sati status aur phase
- Kaal Sarp Dosha status
- Mahadasha/Antardasha/Pratyantardasha (Prokerala ke `dasha_periods` array
  se scan ho kar)
- Har khane ka hakim (lord) aur uski classical dignity (apna ghar / uch /
  neech) — ye khud calculate kiya gaya hai, Ashtakavarga ke intezar mein
  ek pehla qadam

**Abhi template-based (LLM nahi, lekin real facts par based):**
- Urdu narrative paragraph — structured facts (dasha, sade sati waghera)
  se banaya jata hai, lekin abhi hand-written templates se, Claude API
  call se nahi. `lib/narrative.js` mein `generateNarrativeViaLLM()` wahi
  jagah hai jahan asal LLM call add hogi.

**Abhi missing / agla kaam:**
- Ashtakavarga/Sarvashtakavarga scoring (Prokerala se 400/499 error mil
  raha tha — sahi parameters dhoondhna baaki hai)
- Roz-ba-roz/hafta-war/saal-bhar ka tafseeli calendar (abhi sirf "aaj ka
  paigham" aur "haaliya gardish" hai — jhoothi/farzi per-day entries
  jaan-boojh kar nahi banayi gayi, taake koi bhi cheez bina asal hisaab
  ke na dikhai jaye)
- Remedy/Upaya section (design doc mein 3 options diye gaye hain — aap ki
  decision baaki hai: universal, Islamic-compatible, ya dono)
- Android app (ye abhi ek web app hai jo browser mein chalta hai — native
  Android wrapper agla phase hai)
- `dasha_periods` ke andar Antardasha/Pratyantardasha ke asal JSON field
  naam 100% confirm nahi (`lib/astro-engine.js` mein "SHAPE TODO" comments
  dekhein) — pehli baar real data se test karte waqt agar Antardasha na
  dikhe to `/api/debug/kundli-raw` route se raw JSON dekh kar field naam
  confirm kar ke ek line fix karni hogi.

---

## Files ka structure

```
zaicha_app/
  server.js              - Express server, saare API routes
  lib/
    prokerala-client.js  - Prokerala OAuth + API calls (.env se credentials)
    astro-engine.js      - House formula, dasha walker, dignity calculation
    narrative.js         - Urdu narrative generator (template-based)
    db.js                - Saved kundliyan / natal-cache database layer (optional, Supabase)
  public/
    index.html           - Frontend (form + kundli chart + predictions)
  .env.example            - Copy kar ke .env banayein, apni credentials bharein
  package.json
```
