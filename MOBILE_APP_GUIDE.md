# Zaicha ko Android App Banane Ka Tareeqa (Capacitor)

Pehla step (web link banwana, DEPLOY_GUIDE.md wala) sirf browser se ho gaya
tha. Ye agla step — asal Android app (APK) banana — us se thora zyada
technical hai, kyunke Android app banane ke liye **Android Studio** (Google
ki official app-banane wali software) computer par install honi zaroori
hai. Koi shortcut nahi — lekin ek dafa setup ho jaye to baar baar aasan
rehta hai, aur hum ye step-by-step milkar karenge.

## Ye tareeqa kaam kaise karta hai (2 line mein)

Hum poora Zaicha app dobara nahi likh rahe. "Capacitor" naam ka ek tool
aapke live web app (wohi jo Render par chal raha hai) ko ek halke se
Android "khol" (shell) mein band kar deta hai — jab koi user app kholega,
andar wahi Zaicha dikhega jo browser mein dikhta hai, bas ab wo Play Store
se install honay wali asal app lagegi, apne icon aur naam ke sath.
**Iska matlab: jab bhi hum web app update karenge (naya feature, UI fix),
Play Store wali app khud-ba-khud updated version dikhayegi — dobara app
build karne ki zarurat nahi paray gi**, jab tak koi native cheez (icon,
naam, permissions) na badalni ho.

## Zaroori cheezain (ek dafa install karni hain)

1. **Node.js** — agar pehle se test ke liye install hai to theek hai.
2. **Android Studio** — https://developer.android.com/studio se free
   download karein aur install karein (Windows/Mac dono ke liye hai).
   Pehli dafa kholne par ye khud kuch extra components download karega —
   Wi-Fi par chhor dein, 15-20 minute lag sakte hain.
3. Apna Render wala live link ready rakhein (jaise
   `https://zaicha-app-xxxx.onrender.com`) — DEPLOY_GUIDE.md wale step se.

## Steps

### 1. `mobile` folder mein packages install karein

Terminal/Command Prompt kholein, `zaicha_app/mobile` folder mein jayein,
aur:
```
npm install
```

### 2. Apna Render link `capacitor.config.json` mein daalein

`mobile/capacitor.config.json` file kholein, is line ko dhoondein:
```
"url": "https://YOUR-RENDER-URL.onrender.com",
```
aur `YOUR-RENDER-URL.onrender.com` ki jagah apna asal Render link likh dein.

### 3. Android project generate karein (sirf pehli dafa)

Isi `mobile` folder mein:
```
npx cap add android
npx cap sync
```
Ye ek `android/` folder bana dega — ye asal Android Studio project hai.

### 4. Android Studio mein kholein

```
npx cap open android
```
Ye khud Android Studio khol dega, `android/` project ke sath.

### 5. Test karein (emulator ya apna phone)

Android Studio mein upar "Run" (▶) button dabayein — ya to computer par
hi ek virtual phone (emulator) chalega, ya agar aapka Android phone USB se
juda hai (aur "USB debugging" on hai) to seedha usi par app khul jayegi.
Isme aap wahi Zaicha dekhein ge jo web par hai — bas ab app ki tarah.

### 6. Icon aur naam set karein

Filhal app ka naam "Zaicha" aur ek generic icon hai. Jab aap chahein, hum
milkar:
- Apna asal Zaicha logo (X-cross wala jo humne pehle design kiya tha) app
  icon ki tamam sizes mein daal denge (Android Studio ka "Image Asset"
  tool ye khud sab sizes bana deta hai — bas ek 1024×1024 PNG chahiye).
- Splash screen (app khulte waqt ka pehla screen) bhi isi tarz mein bana
  denge.

### 7. Play Store par bhejna (jab app poori tarah test ho jaye)

Ye alag, thora lamba process hai (Google Play Developer account — one-time
$25 fee — chahiye hota hai, phir app ki listing, screenshots, privacy
policy waghera). Jab hum yahan tak pohanch jayein, main aapko yehi tarz mein
step-by-step guide kar doon ga — abhi is stage par focus karna zaroori
nahi.

---

## Ek zaroori baat (permissions/settings)

Chunke app sirf aapke live Render link ko khol rahi hai, agar Render wala
link kabhi badal jaye (naya domain, custom domain waghera) to sirf
`capacitor.config.json` mein wo naya link daal kar dobara
`npx cap sync` chalana hoga — poori app dobara banane ki zarurat nahi.

## Agli baar jab milein

Jab aap Android Studio install kar lein aur upar wale steps 1-5 try kar
lein, mujhe bata dein kahan tak pohanche ya kaunsa error aaya — main
saath saath madad karta rahoon ga, jaisa hum web wale hisse mein karte
rahay hain.
