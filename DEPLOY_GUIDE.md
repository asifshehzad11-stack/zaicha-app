# Zaicha ko "Final" Banane Ka Tareeqa — Free Cloud Link

Is guide mein koi terminal, koi command, koi npm install nahi hai — sab kuch
sirf click aur type karke, browser mein hota hai. Ande se ande tak, teen
website steps hain.

Jab ye ho jaye, aap ko ek permanent link milega (jaisे `zaicha-asif.onrender.com`)
jo mobile aur desktop, kisi bhi browser mein, hamesha khulega — laptop band
ho tab bhi.

---

## Step 1 — Code ko GitHub par upload karein (5 minute)

1. https://github.com par jayein aur ek free account banayein (agar pehle
   se nahi hai) — sirf email aur password chahiye.
2. Upar daayen taraf "+" icon → **"New repository"** dabayein.
3. Naam dein: `zaicha-app` (ya kuch bhi), aur **"Create repository"** dabayein.
4. Agle page par **"uploading an existing file"** wala link dikhega —
   usay dabayein.
5. Apne computer se `zaicha_app` folder ki SAARI files (server.js,
   package.json, render.yaml, lib folder, public folder — poora kuch)
   is upload box mein drag-and-drop kar dein.
   *(.env file agar aap ne pehle se banai hai to WOH UPLOAD NA KAREIN —
   ye kisi ke sath share nahi honi chahiye.)*
6. Neeche "Commit changes" wala button dabayein.

Ab aap ka code GitHub par hai — koi terminal, koi git command nahi lagi.

---

## Step 2 — Render.com par account banayein aur app connect karein (5 minute)

1. https://render.com par jayein, **"Get Started"** dabayein, aur
   **"Sign up with GitHub"** wala option chunein (yaani GitHub se hi login
   karein — koi alag password yaad rakhne ki zarurat nahi).
2. Login hone ke baad, upar **"New +"** button dabayein → **"Blueprint"**
   chunein.
3. Wahan apni `zaicha-app` GitHub repository chunein (Render ko GitHub
   access dene ki ijazat dein agar maange).
4. Render khud `render.yaml` file parh lega aur pehchan lega ke ye ek
   Node.js app hai.

---

## Step 3 — Apni Prokerala credentials daalein (2 minute — SIRF AAP kar saktay hain)

1. Isi setup screen par, Render do boxes dikhaega:
   `PROKERALA_CLIENT_ID` aur `PROKERALA_CLIENT_SECRET`
2. Inme apni WOHI asal values type/paste karein jo aap ke laptop ki
   `.env` file mein hain (jo aap ne prokerala_test.py ke liye banayi thi).
3. **"Apply"** ya **"Create Web Service"** dabayein.

Render ab khud-ba-khud app ko install aur start kar dega (2-3 minute
lagenge, progress screen par dikhega).

---

## Step 4 — Apna link le lein

Deploy hone ke baad, screen par upar ek link dikhega, jaisा:
```
https://zaicha-app-xxxx.onrender.com
```
Ye link kisi bhi mobile ya desktop browser mein khol kar Zaicha chala
saktay hain. Isay save/bookmark kar lein.

---

## Ek chhoti si baat (honest note)

Free plan par agar app 15 minute tak koi use na kare to "so" jata hai —
agli baar kholne par pehli baar thoda (~30-60 second) time lagega jab tak
wo dobara "jaag" jaye. Ye sirf free plan ki baat hai, aur pehle test/demo
phase ke liye bilkul theek hai. Jab app zyada log use karne lagein to ise
paid plan ($ per month) par upgrade karna aasan hai — sirf ek button, koi
dobara setup nahi.

---

## Agar kabhi code update karna ho

Jab bhi main aapko updated code doon (jaise Ashtakavarga fix ho jaye, ya
naya feature aaye), aap sirf GitHub par jaakar wohi purani files nayi files
se replace kar denge (upload karke) — Render khud-ba-khud dobara deploy kar
dega, kuch aur karne ki zarurat nahi.
