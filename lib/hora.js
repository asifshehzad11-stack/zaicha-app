// lib/hora.js
//
// Hora (D2) divisional chart — poora, alag chart-diagram (Navamsa/D9 jaisa),
// astrology TEACHER ke feedback (session 6, 2026-09-25) par banaya gaya.
// Pehle D2 ki calculation sirf Vimshopak Bala ke andar (planet-click popup
// mein sign ki shakl mein) istemal hoti thi — koi mukammal 12-ghar wala
// chart diagram nahi tha. Teacher isi mukammal chart ko dhoond rahe thay.
//
// D2 Hora daulat/wealth dekhne ka classical chart hai. Formula (lib/vargas.js
// ka horaSignId — is session mein pehle se hi 2 independent sources se
// verify kiya ja chuka hai, header comment dekhein): har planet/Ascendant ki
// natal rasi sirf odd/even hone aur apne 30° mein pehle/doosre aadhe hisse
// mein hone se, DO hi mumkin Hora-rasiyan milti hain — Sun ka Hora (Leo) ya
// Moon ka Hora (Cancer). Ye khud koi bug nahi, classical D2 ka asal tabiyat
// hai (jagannathhora.com/astroavastha.com dono isi tarah dikhate hain) — is
// liye is chart mein zyada tar planets sirf 2 (aapas mein mutasil) gharon
// mein hi jama honge, baaqi 10 ghar khaali rahenge — ye EXPECTED hai.
//
// Baaqi structure bilkul lib/navamsa.js ke buildNavamsaChart() jaisa hai
// (houses array, whole-sign counting Hora-Lagna se) — taake frontend ka
// wahi diamond-chart renderer (renderNavamsaChart jaisa) is par bhi reuse
// ho sake.
'use strict';

const {
  RASI_NAMES_URDU,
  RASI_NAMES_LATIN,
  SIGN_LORDS,
  PLANET_ABBR,
  PLANET_COLOR_VAR,
  PLANET_NAME_URDU,
  planetDignity,
  houseFromReference,
} = require('./astro-engine');
const { horaSignId } = require('./vargas');

/**
 * `data` woh poora object hai jo buildZaichaData() return karta hai — koi
 * nayi API call nahi, sirf pehle se maujood natal degrees par formula.
 */
function buildHoraChart(data) {
  const natalMap = (data.natal && data.natal.planets) || {};
  const ascendantRasiId = data.natal && data.natal.ascendantRasiId;
  const ascendantDegree = (data.natal && data.natal.ascendantDegree) || 0;

  if (typeof ascendantRasiId !== 'number') return null;

  const horaAscSignId = horaSignId(ascendantRasiId, ascendantDegree);
  if (horaAscSignId === null) return null;

  const houses = [];
  for (let h = 1; h <= 12; h++) {
    const signId = (horaAscSignId + (h - 1)) % 12;
    const lordPlanet = SIGN_LORDS[signId];
    houses.push({
      n: h,
      signId,
      sign: RASI_NAMES_URDU[signId],
      signLatin: RASI_NAMES_LATIN[signId],
      lord: PLANET_NAME_URDU[lordPlanet] || lordPlanet,
      lordLatin: lordPlanet,
      planets: [],
    });
  }

  const planetHoraSign = {};
  for (const name of Object.keys(natalMap)) {
    const p = natalMap[name];
    if (typeof p.rasiId !== 'number') continue;
    const hSign = horaSignId(p.rasiId, p.degree);
    if (hSign === null) continue;
    planetHoraSign[name] = hSign;
    const houseNum = houseFromReference(hSign, horaAscSignId);
    houses[houseNum - 1].planets.push({
      abbr: PLANET_ABBR[name] || name.slice(0, 2),
      name,
      color: PLANET_COLOR_VAR[name] || 'var(--text-muted)',
      dignity: planetDignity(name, hSign),
      isRetrograde: !!p.isRetrograde,
    });
  }
  houses[0].planets.unshift({
    abbr: 'Lg',
    name: 'Ascendant',
    color: PLANET_COLOR_VAR.Ascendant,
    isRetrograde: false,
  });

  return {
    ascendantSignId: horaAscSignId,
    ascendantSignName: RASI_NAMES_URDU[horaAscSignId],
    ascendantSignLatin: RASI_NAMES_LATIN[horaAscSignId],
    houses,
    planetSigns: planetHoraSign,
  };
}

module.exports = { buildHoraChart };
