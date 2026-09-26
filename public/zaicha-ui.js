/* =====================================================================
   zaicha-ui.js — Session 8 (2026-09-26) · "Astrology ka Maha Sagar"
   ---------------------------------------------------------------------
   1) DOCK: Phixen Studios "Sylva" website wala animated top-dock —
      mouse qareeb aaye to pill spring-physics se phailti hai, cream
      "active" pill, pointer ke sath ghoomti specular roshni.
   2) Aasman (sky) canvas + hero ka ghoomta hua burj-wheel.
   3) PLANET STUDIO: sitaron (Mars, Jupiter...) ka bayan ab TABS mein —
      har sayyare ki apni pill; ek click par us ka poora profile.
   4) Naye tabs ke renderers: Unani, Ashtottari, Sudarshan, Learn.
   Index.html ke global helpers (tr, esc, PN, SN, SNfull, NKN, GLYPH,
   planetColorVar, planetRowsFromData, functionalRow, fmtDeg ...) istemal
   hotay hain — ye file main script ke BAAD load hoti hai.
   ===================================================================== */
(function(){
  'use strict';
  var ZUI = window.ZUI = window.ZUI || {};
  var mq = function(q){ try { return window.matchMedia(q).matches; } catch (e) { return false; } };
  var REDUCE = mq('(prefers-reduced-motion: reduce)');
  var FINE = mq('(hover: hover) and (pointer: fine)');
  var PLANETS9 = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  var SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  var NAK_CODES = ['ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra', 'punarvasu', 'pushya', 'ashlesha', 'magha', 'purva_phalguni', 'uttara_phalguni', 'hasta', 'chitra', 'swati', 'vishakha', 'anuradha', 'jyeshtha', 'mula', 'purva_ashadha', 'uttara_ashadha', 'shravana', 'dhanishta', 'shatabhisha', 'purva_bhadrapada', 'uttara_bhadrapada', 'revati'];

  function T(k, v){ return (typeof tr === 'function') ? tr(k, v) : k; }
  function E(s){ return (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s); }
  function P(p){ if (p === 'NorthNode') p = 'Rahu'; if (p === 'SouthNode') p = 'Ketu'; return (typeof PN === 'function') ? PN(p) : p; }
  function G(p){ if (p === 'NorthNode') p = 'Rahu'; if (p === 'SouthNode') p = 'Ketu'; return (typeof GLYPH !== 'undefined' && GLYPH[p]) || '•'; }
  function C(p){ if (p === 'NorthNode') p = 'Rahu'; if (p === 'SouthNode') p = 'Ketu'; return (typeof planetColorVar === 'function') ? planetColorVar(p) : 'var(--gold)'; }
  function S(id){ return (typeof SN === 'function') ? SN(id) : String(id); }
  function lang(){ return (typeof currentLang !== 'undefined' && currentLang) || 'en'; }
  function dm(d){ d = Number(d) || 0; var D = Math.floor(d), M = Math.floor((d - D) * 60 + 1e-9); return D + '°' + (M < 10 ? '0' : '') + M + '′'; }
  function ltr(s){ return '<span class="num" dir="ltr">' + E(s) + '</span>'; }
  function fmtDate(iso){
    if (!iso) return '—';
    try { return new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : '')).toLocaleDateString(lang() === 'zh' ? 'zh-CN' : lang() === 'ar' ? 'ar' : lang() === 'hi' ? 'hi-IN' : lang() === 'ur' ? 'ur-PK' : 'en-GB', { year: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return iso; }
  }
  function yearOf(iso){ return iso ? iso.slice(0, 4) : '—'; }
  function nakName(code){ var i = NAK_CODES.indexOf(code); if (i >= 0 && typeof NKN === 'function') return NKN(i); return code === 'abhijit' ? T('abhijit') : code; }
  function pad(n){ return n < 10 ? '0' + n : String(n); }

  /* ------------------------------------------------------------------
     TOAST
     ------------------------------------------------------------------ */
  ZUI.toast = function(msg){
    var t = document.getElementById('zui-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'zui-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:calc(5.6rem + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(10px);z-index:120;padding:.7rem 1.1rem;border-radius:10px;background:#f2f3ef;color:#18201c;font-size:.86rem;box-shadow:0 14px 34px rgba(0,0,0,.5);opacity:0;transition:opacity .25s, transform .25s;max-width:min(92vw,520px);text-align:center;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(function(){ t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(t._h);
    t._h = setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(10px)'; }, 2600);
  };

  /* ------------------------------------------------------------------
     1) DOCK PHYSICS (Sylva "AnimatedTopDock": proximity 122, spring .19,
        damping .7, width +17, height +16, drop 3.5)
     ------------------------------------------------------------------ */
  var DOCK_CFG = { proximity: 122, spring: 0.19, damping: 0.7, widthGrowth: 17, heightGrowth: 16, drop: 3.5 };
  var docks = [];
  var pointer = { x: -9999, y: -9999, inside: false };
  var loopOn = false;

  function measureDock(st){
    st.items.forEach(function(it){ it.el.style.width = ''; it.el.style.height = ''; it.el.style.transform = ''; });
    st.nav.style.height = '';
    st.nav.classList.remove('dock-fits', 'dock-compact');
    var isMain = st.nav.id === 'system-tabs';
    var fits = st.nav.scrollWidth <= st.nav.clientWidth + 2;
    st.compact = false;
    // Poori patti na samaye (1366px jaisi screens): icon-mode — label sirf
    // active/hover par khulta hai, taake "ubharne" wali harkat har jagah chale.
    if (!fits && isMain && FINE) {
      st.nav.classList.add('dock-compact');
      fits = st.nav.scrollWidth <= st.nav.clientWidth + 2;
      st.compact = fits;
      if (!fits) st.nav.classList.remove('dock-compact');
    }
    st.fits = fits && FINE && !REDUCE;
    st.items.forEach(function(it){ it.baseW = it.el.offsetWidth; it.baseH = it.el.offsetHeight; });
    if (st.fits) {
      st.nav.classList.add('dock-fits');
      st.nav.style.height = st.nav.offsetHeight + 'px';
    }
  }

  ZUI.initDock = function(nav){
    if (!nav) return;
    docks = docks.filter(function(d){ return d.nav !== nav && d.nav.isConnected; });
    var els = Array.prototype.slice.call(nav.querySelectorAll('.sys-tab, .zdock-item'));
    var st = { nav: nav, items: els.map(function(el){ return { el: el, v: 0, vel: 0, target: 0, baseW: 0, baseH: 0 }; }), fits: false };
    docks.push(st);
    var remeasure = function(){ if (nav.isConnected) measureDock(st); };
    requestAnimationFrame(remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    if (window.ResizeObserver && !nav._zro) { nav._zro = new ResizeObserver(function(){ var s2 = docks.filter(function(d){ return d.nav === nav; })[0]; if (s2) measureDock(s2); }); nav._zro.observe(nav.parentElement || nav); }
    nav.addEventListener('scroll', function(){ pointer.dirty = true; }, { passive: true });
    startLoop();
  };

  function startLoop(){
    if (loopOn) return;
    loopOn = true;
    requestAnimationFrame(tick);
  }
  function tick(){
    var moving = false;
    docks = docks.filter(function(d){ return d.nav.isConnected; });
    docks.forEach(function(st){
      var r = st.nav.getBoundingClientRect();
      var near = pointer.x >= r.left - 20 && pointer.x <= r.right + 20 && pointer.y >= r.top - 26 && pointer.y <= r.bottom + 30;
      st.nav.style.setProperty('--spec-bright', near ? '0.55' : '0');
      if (near) st.nav.style.setProperty('--spec-angle', (Math.atan2(pointer.y - (r.top + r.height / 2), pointer.x - (r.left + r.width / 2)) * 180 / Math.PI + 90).toFixed(1) + 'deg');
      st.items.forEach(function(it){
        var ir = it.el.getBoundingClientRect();
        var cx = ir.left + ir.width / 2, cy = ir.top + ir.height / 2;
        var d = Math.abs(pointer.x - cx);
        it.target = near ? Math.max(0, 1 - d / DOCK_CFG.proximity) : 0;
        it.vel += (it.target - it.v) * DOCK_CFG.spring;
        it.vel *= DOCK_CFG.damping;
        it.v += it.vel;
        if (Math.abs(it.target - it.v) < 0.001 && Math.abs(it.vel) < 0.001) { it.v = it.target; it.vel = 0; } else moving = true;
        var val = Math.max(0, Math.min(1.08, it.v));
        it.el.setAttribute('data-near', val > 0.45 ? 'true' : 'false');
        it.el.style.setProperty('--spec-bright', (val * 0.95).toFixed(3));
        if (val > 0.01) it.el.style.setProperty('--spec-angle', (Math.atan2(pointer.y - cy, pointer.x - cx) * 180 / Math.PI + 90).toFixed(1) + 'deg');
        if (st.fits && st.compact && it.baseH) {
          // compact: chaurai CSS label khol kar deta hai; yahan sirf ubharna (height + drop)
          it.el.style.height = (it.baseH + DOCK_CFG.heightGrowth * val).toFixed(2) + 'px';
          it.el.style.transform = 'translateY(' + (val * DOCK_CFG.drop).toFixed(2) + 'px)';
        } else if (st.fits && it.baseW) {
          var isLogo = it.el.classList.contains('dock-logo');
          var wg = isLogo ? DOCK_CFG.widthGrowth * (14 / 17) : Math.min(DOCK_CFG.widthGrowth, it.baseW * 0.24);
          var hg = isLogo ? DOCK_CFG.heightGrowth * (14 / 16) : DOCK_CFG.heightGrowth;
          it.el.style.width = (it.baseW + wg * val).toFixed(2) + 'px';
          it.el.style.height = (it.baseH + hg * val).toFixed(2) + 'px';
          it.el.style.transform = 'translateY(' + (val * DOCK_CFG.drop).toFixed(2) + 'px)';
        }
      });
    });
    if (moving || pointer.inside) requestAnimationFrame(tick); else loopOn = false;
  }
  window.addEventListener('pointermove', function(e){
    if (e.pointerType && e.pointerType !== 'mouse') return;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.inside = true; startLoop();
  }, { passive: true });
  document.addEventListener('pointerleave', function(){ pointer.x = pointer.y = -9999; pointer.inside = false; startLoop(); });
  window.addEventListener('blur', function(){ pointer.x = pointer.y = -9999; pointer.inside = false; startLoop(); });

  /* Generic in-page dock (planet tabs etc.) */
  ZUI.dockHtml = function(items, activeId, extraClass){
    return '<div class="zdock scroll ' + (extraClass || '') + '" role="tablist">' + items.map(function(it){
      var on = it.id === activeId;
      return '<button type="button" class="zdock-item" role="tab" data-id="' + E(it.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '"' + (it.color ? ' style="--_c:' + it.color + '"' : '') + (it.title ? ' title="' + E(it.title) + '"' : '') + '>' +
        (it.glyph ? '<span class="glyph" aria-hidden="true">' + it.glyph + '</span>' : '') +
        (it.dot ? '<span class="pdot" aria-hidden="true"></span>' : '') +
        '<span>' + E(it.label) + '</span>' + (it.sub ? '<span class="deg-mini">' + E(it.sub) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };
  ZUI.wireDock = function(root, onPick){
    var nav = root.querySelector('.zdock');
    if (!nav) return;
    nav.addEventListener('click', function(e){
      var b = e.target.closest('.zdock-item');
      if (!b) return;
      nav.querySelectorAll('.zdock-item').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      onPick(b.getAttribute('data-id'));
    });
    ZUI.initDock(nav);
  };

  /* ------------------------------------------------------------------
     2) SKY CANVAS + HERO WHEEL
     ------------------------------------------------------------------ */
  function initSky(){
    if (document.getElementById('sky-canvas')) return;
    var c = document.createElement('canvas');
    c.id = 'sky-canvas'; c.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(c, document.body.firstChild);
    var ctx = c.getContext('2d');
    if (!ctx) return;
    var stars = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5), t0 = performance.now();
    function resize(){
      W = window.innerWidth; H = window.innerHeight;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(260, W * H / 5200));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() < 0.08 ? 1.4 + Math.random() * 0.8 : 0.4 + Math.random() * 0.8, a: 0.25 + Math.random() * 0.6, s: 0.4 + Math.random() * 1.6, p: Math.random() * 6.28, warm: Math.random() < 0.18, z: 0.2 + Math.random() * 0.8 });
      }
      draw(performance.now());
    }
    function draw(now){
      var t = (now - t0) / 1000;
      var sy = window.scrollY || 0;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = REDUCE ? 1 : 0.65 + 0.35 * Math.sin(t * s.s + s.p);
        var y = ((s.y - sy * 0.04 * s.z) % H + H) % H;
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = s.warm ? '#f1d89c' : '#eef1e7';
        ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, 6.2832); ctx.fill();
        if (s.r > 1.5) { ctx.globalAlpha = s.a * tw * 0.18; ctx.beginPath(); ctx.arc(s.x, y, s.r * 3.2, 0, 6.2832); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    }
    var raf = 0, last = 0;
    function loop(now){
      raf = requestAnimationFrame(loop);
      if (document.hidden || now - last < 48) return; // ~20fps kaafi hai
      last = now; draw(now);
    }
    window.addEventListener('resize', resize);
    resize();
    if (!REDUCE) raf = requestAnimationFrame(loop);
    else window.addEventListener('scroll', function(){ draw(performance.now()); }, { passive: true });
  }

  function buildHeroWheel(){
    var host = document.getElementById('hero-wheel');
    if (!host || host.firstChild) return;
    var cx = 200, cy = 200, h = '';
    h += '<svg viewBox="0 0 400 400" role="presentation">';
    h += '<defs><radialGradient id="zwg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(230,196,122,.16)"/><stop offset=".6" stop-color="rgba(230,196,122,.03)"/><stop offset="1" stop-color="rgba(230,196,122,0)"/></radialGradient></defs>';
    h += '<circle cx="200" cy="200" r="198" fill="url(#zwg)"/>';
    // outer ring + degree ticks (rotating)
    h += '<g class="rot" fill="none" stroke="rgba(242,243,239,.38)">';
    h += '<circle cx="200" cy="200" r="190" stroke-width=".8"/><circle cx="200" cy="200" r="150" stroke-width=".8"/>';
    for (var d = 0; d < 360; d += 5) {
      var a = d * Math.PI / 180, big = d % 30 === 0;
      var r1 = 190, r2 = big ? 150 : (d % 10 === 0 ? 182 : 185);
      h += '<line x1="' + (cx + r1 * Math.cos(a)).toFixed(2) + '" y1="' + (cy + r1 * Math.sin(a)).toFixed(2) + '" x2="' + (cx + r2 * Math.cos(a)).toFixed(2) + '" y2="' + (cy + r2 * Math.sin(a)).toFixed(2) + '" stroke-width="' + (big ? '.9' : '.6') + '" stroke-opacity="' + (big ? '.8' : '.5') + '"/>';
    }
    for (var s = 0; s < 12; s++) {
      var am = (s * 30 + 15 - 90) * Math.PI / 180;
      h += '<text x="' + (cx + 168 * Math.cos(am)).toFixed(2) + '" y="' + (cy + 168 * Math.sin(am)).toFixed(2) + '" fill="#e6c47a" stroke="none" font-size="17" text-anchor="middle" dominant-baseline="central" style="font-family:\'Noto Sans Symbols 2\',\'Segoe UI Symbol\',sans-serif">' + SIGN_GLYPHS[s] + '︎</text>';
    }
    h += '</g>';
    // nakshatra ring (counter-rotating)
    h += '<g class="rot-rev" fill="none" stroke="rgba(242,243,239,.26)"><circle cx="200" cy="200" r="122" stroke-width=".7" stroke-dasharray="2 5"/>';
    for (var n = 0; n < 27; n++) {
      var an = (n * 360 / 27) * Math.PI / 180;
      h += '<line x1="' + (cx + 122 * Math.cos(an)).toFixed(2) + '" y1="' + (cy + 122 * Math.sin(an)).toFixed(2) + '" x2="' + (cx + 132 * Math.cos(an)).toFixed(2) + '" y2="' + (cy + 132 * Math.sin(an)).toFixed(2) + '" stroke-width=".8"/>';
    }
    h += '</g>';
    // North-Indian diamond chart in the centre
    h += '<g fill="none" stroke="rgba(242,243,239,.55)" stroke-width=".9"><rect x="138" y="138" width="124" height="124"/><polygon points="200,138 262,200 200,262 138,200"/><line x1="138" y1="138" x2="262" y2="262" stroke-opacity=".5"/><line x1="262" y1="138" x2="138" y2="262" stroke-opacity=".5"/></g>';
    // planets orbiting on a slow ring
    var pcol = { Sun: '#ffa94d', Moon: '#dfe6ff', Mars: '#ff5f5f', Mercury: '#3fd08a', Jupiter: '#ffd24d', Venus: '#ff8fcf', Saturn: '#7fb2ff', Rahu: '#b793ff', Ketu: '#d7a36f' };
    var pos = [18, 57, 101, 132, 170, 214, 256, 290, 330];
    h += '<g class="rot-rev">';
    PLANETS9.forEach(function(p, i){
      var ap = (pos[i] - 90) * Math.PI / 180, rr = 141;
      var x = cx + rr * Math.cos(ap), y = cy + rr * Math.sin(ap);
      h += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="3.2" fill="' + pcol[p] + '"/><circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="8" fill="' + pcol[p] + '" fill-opacity=".14"/>';
    });
    h += '</g><circle cx="200" cy="200" r="4" fill="#e6c47a"/></svg>';
    host.innerHTML = h;
  }

  function wireHero(){
    var start = document.getElementById('hero-start');
    var learn = document.getElementById('hero-learn');
    if (start && !start._w) { start._w = 1; start.addEventListener('click', function(){
      document.body.classList.remove('learn-open');
      var entry = document.getElementById('phone-entry');
      var welcome = document.getElementById('screen-welcome');
      var guest = document.getElementById('guest-continue-btn');
      if (welcome && welcome.classList.contains('screen-active') && guest && guest.style.display !== 'none') guest.click();
      else if (typeof showScreen === 'function' && entry && !entry.classList.contains('screen-active')) showScreen('phone-entry');
      var tgt = document.getElementById('phone-entry');
      if (tgt && tgt.classList.contains('screen-active')) tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (welcome) welcome.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }); }
    if (learn && !learn._w) { learn._w = 1; learn.addEventListener('click', function(){ if (typeof activateTab === 'function') activateTab('learn', false); }); }
  }

  /* ------------------------------------------------------------------
     3) PLANET STUDIO + reading tabs
     ------------------------------------------------------------------ */
  ZUI.selPlanet = 'Sun';
  function ringSvg(deg, color, glyph){
    var pct = Math.max(0, Math.min(1, (Number(deg) || 0) / 30));
    var R = 88, C2 = 2 * Math.PI * R;
    var ang = (pct * 360 - 90) * Math.PI / 180;
    var x = 110 + R * Math.cos(ang), y = 110 + R * Math.sin(ang);
    var ticks = '';
    for (var i = 0; i <= 30; i += 1) {
      var a = (i / 30 * 360 - 90) * Math.PI / 180, big = i % 10 === 0, r1 = 100, r2 = big ? 93 : 97;
      ticks += '<line x1="' + (110 + r1 * Math.cos(a)).toFixed(1) + '" y1="' + (110 + r1 * Math.sin(a)).toFixed(1) + '" x2="' + (110 + r2 * Math.cos(a)).toFixed(1) + '" y2="' + (110 + r2 * Math.sin(a)).toFixed(1) + '" stroke="rgba(242,243,239,' + (big ? '.6' : '.25') + ')" stroke-width="' + (big ? '1.2' : '.8') + '"/>';
    }
    return '<svg class="pstudio-ring" viewBox="-30 -16 280 252" aria-hidden="true">' + ticks +
      '<circle cx="110" cy="110" r="' + R + '" fill="none" stroke="rgba(242,243,239,.09)" stroke-width="6"/>' +
      '<circle cx="110" cy="110" r="' + R + '" fill="none" stroke="' + color + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (pct * C2).toFixed(1) + ' ' + C2.toFixed(1) + '" transform="rotate(-90 110 110)"/>' +
      '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7" fill="#f2f3ef" stroke="' + color + '" stroke-width="3"/>' +
      '<circle cx="110" cy="110" r="58" fill="' + color + '" fill-opacity=".1" stroke="' + color + '" stroke-opacity=".35"/>' +
      '<text x="110" y="112" text-anchor="middle" dominant-baseline="central" font-size="54" fill="' + color + '" style="font-family:\'Noto Sans Symbols 2\',\'Segoe UI Symbol\',sans-serif">' + glyph + '︎</text>' +
      '<text x="110" y="-3" text-anchor="middle" font-size="9" fill="rgba(242,243,239,.55)">0° / 30°</text><text x="230" y="113" text-anchor="middle" font-size="9" fill="rgba(242,243,239,.55)">7°30′</text><text x="110" y="228" text-anchor="middle" font-size="9" fill="rgba(242,243,239,.55)">15°</text><text x="-10" y="113" text-anchor="middle" font-size="9" fill="rgba(242,243,239,.55)">22°30′</text>' +
      '</svg>';
  }

  // ---- Session 8b: "yeh sayyara kis ghar mein hai aur us ghar mein us ke
  // asraat kya hain" — classical planet-in-house nataij (public/planet-house.js)
  // + is zaiche ke hisab se modifiers (dignity, functional nature, bal, nazar).
  var BENEFICS = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
  var MALEFICS = ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'];
  function houseEffectBlock(data, row, f, gb, asp){
    var PH = window.ZAICHA_PH;
    var p = row.planet, n = row.house;
    if (!PH || !PH.text || !n) return '';
    var L = lang();
    var tx = (PH.text[L] || PH.text.en)[p];
    var th = (PH.theme[L] || PH.theme.en);
    if (!tx) return '';
    var mods = [];
    var dg = row.dignity;
    if (dg === 'exalted') mods.push(T('phMod_exalted'));
    else if (dg === 'own' || dg === 'moolatrikona') mods.push(T('phMod_own'));
    else if (dg === 'debilitated') mods.push(T('phMod_debilitated'));
    if (row.combust) mods.push(T('phMod_combust'));
    if (row.retro && p !== 'Rahu' && p !== 'Ketu') mods.push(T('phMod_retro'));
    if (f && f.verdict) {
      var vk = f.verdictSource === 'nodes' || f.verdict === 'placement' ? 'placement' : f.verdict;
      var mk = 'phMod_' + vk;
      if (T(mk) !== mk) mods.push(T(mk));
      if (f.owns && f.owns.length && vk !== 'baseline') mods.push(T('phMod_lordOf', { houses: houseList(f.owns) }));
    }
    if (gb && gb.strength === 'strong') mods.push(T('phMod_strong'));
    else if (gb && gb.strength === 'weak') mods.push(T('phMod_weak'));
    if (asp && asp.aspectedByPlanets && asp.aspectedByPlanets.length) {
      var ben = asp.aspectedByPlanets.filter(function(x){ return x === 'Jupiter' || x === 'Venus'; });
      var mal = asp.aspectedByPlanets.filter(function(x){ return x === 'Saturn' || x === 'Mars' || x === 'Rahu' || x === 'Ketu'; });
      if (ben.length) mods.push(T('phMod_benAspect', { planets: ben.map(P).join((L === 'ur' || L === 'ar') ? '، ' : ', ') }));
      if (mal.length) mods.push(T('phMod_malAspect', { planets: mal.map(P).join((L === 'ur' || L === 'ar') ? '، ' : ', ') }));
    }
    var col = C(p);
    return '<div class="phouse" style="--_c:' + col + '">' +
      '<div class="phouse-head"><span class="phouse-num">' + n + '</span><div><div class="phouse-title">' + E(T('phTitle', { planet: P(p), n: n })) + '</div>' +
      '<div class="phouse-theme">' + E(T('phTheme', { n: n, theme: th[n - 1] })) + '</div></div></div>' +
      '<h5>' + E(T('phClassical')) + '</h5><p class="phouse-text">' + E(tx[n - 1]) + '</p>' +
      (mods.length ? '<h5>' + E(T('phInChart')) + '</h5><ul class="phouse-mods">' + mods.map(function(m){ return '<li>' + E(m) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="src-note">' + E(T('phNote')) + ' ' + (PH.sources || []).map(function(s2, i){ return '<a href="' + E(s2.url) + '" target="_blank" rel="noopener" style="color:var(--gold-soft)">[' + (i + 1) + ']</a>'; }).join(' ') + '</p>' +
      '</div>';
  }

  function fact(k, v, wide){ return '<div class="pfact' + (wide ? ' wide' : '') + '"><span class="k">' + E(k) + '</span><div class="v">' + v + '</div></div>'; }

  function planetPanel(data, row){
    var p = row.planet, col = C(p);
    var f = (typeof functionalRow === 'function') ? functionalRow(data, p) : null;
    var bad = (typeof isBadPlanet === 'function') ? isBadPlanet(data, row) : false;
    var prof = (data.planetProfiles || []).filter(function(x){ return x.name === p; })[0] || {};
    var gb = (data.grahaBala || []).filter(function(x){ return x.planet === p; })[0];
    var vb = (data.vimshopakBala || []).filter(function(x){ return x.planet === p; })[0];
    var asp = (data.natalAspects || []).filter(function(x){ return x.planet === p; })[0];
    var kp = ((data.kpInfo && data.kpInfo.points) || []).filter(function(x){ return x.point === p; })[0];
    var nadiLinks = (data.nadi && data.nadi.links && data.nadi.links[p]) || [];
    var pills = [];
    if (row.dignity && row.dignity !== 'neutral' && typeof dignityPill === 'function') pills.push(dignityPill(row.dignity));
    if (row.retro && p !== 'Rahu' && p !== 'Ketu') pills.push('<span class="status-pill info">⟲ ' + E(T('retrograde')) + '</span>');
    if (row.combust) pills.push('<span class="status-pill weak">' + E(T('combust')) + '</span>');
    if (f && typeof verdictPill === 'function') pills.push(verdictPill(f.verdict));
    if (prof.isVargottama) pills.push('<span class="status-pill gold">✦ ' + E(T('vargottama')) + '</span>');

    var left = '<div class="pstudio-hero ptab-panel" style="--_c:' + col + '">' + ringSvg(row.degree, col, G(p)) +
      '<div class="pstudio-name">' + E(P(p)) + '</div>' +
      '<div class="pstudio-deg ' + (bad ? 'bad' : 'good') + '">' + E(typeof fmtDeg === 'function' ? fmtDeg(row.degree) : dm(row.degree)) + '</div>' +
      '<div class="pstudio-sign">' + E(typeof SNfull === 'function' ? SNfull(row.rasiId) : S(row.rasiId)) + ' · ' + E(typeof NKN === 'function' ? NKN(row.nak.index) : '') + ' ' + ltr(row.nak.pada) + '</div>' +
      (pills.length ? '<div class="pstudio-pills">' + pills.join('') + '</div>' : '') + '</div>';

    var facts = '';
    facts += fact(T('psHouse'), E(T('houseN', { n: row.house })));
    facts += fact(T('psRules'), f && f.owns && f.owns.length ? E(T('rulesHouses', { houses: houseList(f.owns) })) : E(T('rulesNone')));
    facts += fact(T('psNakLord'), E(P(row.nak.lord)) + (kp && kp.subLord ? ' <span class="muted">· ' + E(T('psSubLord')) + ': ' + E(P(kp.subLord)) + '</span>' : ''));
    if (prof.navamsaSignLatin && typeof NAMES !== 'undefined') {
      var navId = NAMES.signSanskrit.indexOf(prof.navamsaSignLatin);
      facts += fact(T('psNavamsa'), navId >= 0 ? E(S(navId)) + (prof.isVargottama ? ' ✦' : '') : '—');
    } else facts += fact(T('psNavamsa'), '—');
    if (gb) facts += fact(T('psShadbala'), E(T('strength_' + gb.strength)) + ' <span class="muted num">' + gb.percent + '%</span><div class="pbar" style="--_c:' + col + '"><i style="width:' + Math.max(3, Math.min(100, gb.percent)) + '%"></i></div>');
    if (vb) facts += fact(T('psVimshopak'), E(T('strength_' + vb.strength)) + ' <span class="muted num">' + vb.percent + '%</span><div class="pbar" style="--_c:' + col + '"><i style="width:' + Math.max(3, Math.min(100, vb.percent)) + '%"></i></div>');
    if (asp) {
      var cast = (asp.aspectsHouses || []).length ? E(T('psAspectsHouses', { houses: houseList(asp.aspectsHouses) })) : E(T('noneWord'));
      var by = (asp.aspectedByPlanets || []).length ? (asp.aspectedByPlanets || []).map(function(x){ return '<span style="color:' + C(x) + '">' + G(x) + '</span> ' + E(P(x)); }).join(' · ') : E(T('noneWord'));
      facts += fact(T('psAspectsCast'), cast);
      facts += fact(T('psAspectedBy'), by);
    }
    if (nadiLinks.length) {
      facts += fact(T('psNadiLinks'), nadiLinks.map(function(l){ return '<span class="status-pill ' + (l.strength === 'strongest' ? 'gold' : l.strength === 'strong' ? 'strong' : 'neutral') + '" style="margin:.1rem .15rem .1rem 0">' + G(l['with']) + ' ' + E(P(l['with'])) + ' · ' + E(T('rel_' + l.relation)) + '</span>'; }).join(''), true);
    }
    if (f) {
      var outcome = f.placementOutcome ? (' — ' + T('out_' + f.placementOutcome)) : '';
      facts += fact(T('psFunctional'), E(T('sitsIn', { house: f.placedHouse || '—', zone: zoneLabel(f.placement) }) + outcome), true);
    }
    var karaka = '<div class="pkaraka"><h5>' + E(T('psKarakaTitle', { planet: P(p) })) + '</h5><p>' + E(T('karakaLong_' + p)) + '</p></div>';
    var right = '<div class="ptab-panel">' + houseEffectBlock(data, row, f, gb, asp) + '<div class="pfacts">' + facts + '</div>' + karaka + '</div>';
    return '<div class="pstudio">' + left + right + '</div>';
  }

  ZUI.renderPlanetStudio = function(data){
    var list = document.getElementById('planets-list');
    if (!list || typeof planetRowsFromData !== 'function') return;
    var rows = planetRowsFromData(data).filter(function(r){ return r.planet !== 'Ascendant'; });
    if (!rows.length) return;
    if (PLANETS9.indexOf(ZUI.selPlanet) === -1) ZUI.selPlanet = 'Sun';
    var items = rows.map(function(r){ return { id: r.planet, label: P(r.planet), glyph: G(r.planet), color: C(r.planet), sub: dm(r.degree) }; });
    list.innerHTML = ZUI.dockHtml(items, ZUI.selPlanet) + '<div class="pstudio-body"></div><p class="src-note">' + E(T('degLegend')) + '</p>';
    var body = list.querySelector('.pstudio-body');
    function show(p){
      ZUI.selPlanet = p;
      var r = rows.filter(function(x){ return x.planet === p; })[0] || rows[0];
      body.innerHTML = planetPanel(data, r);
      syncReadingTabs();
    }
    ZUI.wireDock(list, show);
    show(ZUI.selPlanet);
    ZUI._studioShow = show;
  };

  function syncReadingTabs(){
    var box = document.getElementById('reading-content');
    if (!box) return;
    var nav = box.querySelector('.zdock.reading-dock');
    if (!nav) return;
    var sel = ZUI.readingSel || ZUI.selPlanet;
    nav.querySelectorAll('.zdock-item').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-id') === sel ? 'true' : 'false'); });
    box.querySelectorAll('.diag-row[data-planet]').forEach(function(r){ r.classList.toggle('ptab-hidden', sel !== 'all' && r.getAttribute('data-planet') !== sel); });
  }

  ZUI.enhanceReading = function(data){
    var box = document.getElementById('reading-content');
    if (!box) return;
    var rowsEl = box.querySelectorAll('.diag-row[data-planet]');
    if (!rowsEl.length) return;
    var fn = data.functionalNature || {};
    var vcol = { champion: 'var(--gold)', antagonist: 'var(--weak)', neutral: 'var(--text-muted)', placement: 'var(--info)', baseline: 'var(--strong)' };
    var items = [{ id: 'all', label: T('psAll') }].concat((fn.planets || []).map(function(r){ return { id: r.planet, label: P(r.planet), glyph: G(r.planet), color: vcol[r.verdict] || C(r.planet), title: T('verdict_' + r.verdict) }; }));
    var wrap = document.createElement('div');
    wrap.innerHTML = ZUI.dockHtml(items, ZUI.selPlanet, 'reading-dock');
    rowsEl[0].parentNode.insertBefore(wrap.firstChild, rowsEl[0]);
    ZUI.readingSel = ZUI.selPlanet;
    var nav = box.querySelector('.zdock.reading-dock');
    nav.addEventListener('click', function(e){
      var b = e.target.closest('.zdock-item'); if (!b) return;
      var id = b.getAttribute('data-id');
      ZUI.readingSel = id;
      if (id !== 'all') { ZUI.selPlanet = id; if (ZUI._studioShow && document.querySelector('#planets-list .zdock')) { document.querySelectorAll('#planets-list .zdock-item').forEach(function(x){ x.setAttribute('aria-pressed', x.getAttribute('data-id') === id ? 'true' : 'false'); }); ZUI._studioShow(id); } }
      syncReadingTabs();
      var vis = box.querySelector('.diag-row[data-planet]:not(.ptab-hidden)');
      if (vis) { vis.style.animation = 'none'; void vis.offsetWidth; vis.style.animation = 'zfade .35s ease'; }
    });
    ZUI.initDock(nav);
    syncReadingTabs();
  };

  /* ------------------------------------------------------------------
     4a) UNANI
     ------------------------------------------------------------------ */
  function kcell(k, v){ return '<div><span class="k">' + E(k) + '</span><span class="v">' + v + '</span></div>'; }
  function dot(on, lbl, neg){ return '<span class="dig-dot' + (on ? (neg ? ' neg' : ' on') : '') + '" title="' + E(lbl) + '">' + E(lbl) + '</span>'; }
  function disputesBlock(codes, prefix){
    if (!codes || !codes.length) return '';
    return '<div class="disputes"><h5>' + E(T('disputesTitle')) + '</h5><ul>' + codes.map(function(c){ var t = T(prefix + c); return '<li>' + E(t === prefix + c ? c.replace(/_/g, ' ') : t) + '</li>'; }).join('') + '</ul></div>';
  }
  function sourcesBlock(src){
    if (!src || !src.length) return '';
    return '<ul class="sources-list">' + src.map(function(s){ return '<li>↗ <a href="' + E(s.url) + '" target="_blank" rel="noopener">' + E(s.title) + '</a></li>'; }).join('') + '</ul>';
  }

  ZUI.renderUnani = function(data){
    var box = document.getElementById('unani-content');
    if (!box) return;
    var u = data && data.unani;
    if (!u) { box.innerHTML = '<div class="placeholder">' + E(T('waitingData')) + '</div>'; return; }
    var h = '';
    var fir = u.firdaria || {};
    var hr = u.hourRuler;
    h += '<div class="kstrip">' +
      kcell(T('unSect'), E(T('unSect_' + u.sect)) + ' <small>· ' + E(T('unSectLight', { p: P(u.sectLight) })) + '</small>') +
      kcell(T('unAsc'), SIGN_GLYPHS[u.ascendant.signId] + ' ' + E(S(u.ascendant.signId)) + ' ' + ltr(dm(u.ascendant.deg))) +
      kcell(T('unAlmuten'), (u.almutenAsc ? '<span style="color:' + C(u.almutenAsc.planet) + '">' + G(u.almutenAsc.planet) + '</span> ' + E(P(u.almutenAsc.planet)) : '—')) +
      kcell(T('unDayHour'), (u.dayRuler ? E(P(u.dayRuler)) : '—') + (hr ? ' <small>· ' + E(T('unHourN', { n: hr.hourNumber, p: P(hr.planet) })) + '</small>' : '')) +
      kcell(T('unYearLord'), u.profection ? E(P(u.profection.lordOfYear)) + ' <small>· ' + E(T('unProfection', { age: u.profection.age, house: u.profection.house })) + '</small>' : '—') +
      kcell(T('unFirdarNow'), fir.current ? E(P(fir.current.lord)) + (fir.current.sub ? ' <small>/ ' + E(P(fir.current.sub)) + '</small>' : '') : '—') +
      '</div>';

    // dignities table
    h += '<div class="section-title">' + E(T('unDignities')) + '</div>';
    h += '<div class="table-scroll"><table class="dig-table"><thead><tr><th>' + E(T('thPlanet')) + '</th><th>' + E(T('unTropPos')) + '</th><th>' + E(T('thHouse')) + '</th><th>' + E(T('unEssential')) + '</th><th>' + E(T('unScore')) + '</th><th>' + E(T('unInSect')) + '</th></tr></thead><tbody>';
    (u.planets || []).forEach(function(r){
      var d = r.dignities || {};
      var sc = Number(r.score) || 0;
      var w = Math.min(50, Math.abs(sc) / 15 * 50);
      h += '<tr><td style="white-space:nowrap"><span style="color:' + C(r.planet) + '">' + G(r.planet) + '</span> ' + E(P(r.planet)) + (r.retro ? ' <span class="muted">⟲</span>' : '') + '</td>' +
        '<td style="white-space:nowrap">' + SIGN_GLYPHS[r.signId] + ' ' + E(S(r.signId)) + ' ' + ltr(dm(r.deg)) + '</td>' +
        '<td class="num">' + r.house + '</td>' +
        '<td style="white-space:nowrap">' + dot(d.domicile, T('unD_dom')) + ' ' + dot(d.exaltation, T('unD_exa')) + ' ' + dot(d.triplicity, T('unD_tri')) + ' ' + dot(d.term, T('unD_ter')) + ' ' + dot(d.face, T('unD_fac')) + ' ' + dot(d.detriment, T('unD_det'), true) + ' ' + dot(d.fall, T('unD_fal'), true) + (r.peregrine ? ' <span class="status-pill neutral">' + E(T('unPeregrine')) + '</span>' : '') + '</td>' +
        '<td><div class="score-bar"><div class="t"><i class="' + (sc < 0 ? 'neg' : '') + '" style="' + (sc < 0 ? 'right:50%;left:auto;width:' + w + '%' : 'width:' + w + '%') + '"></i></div><b>' + (sc > 0 ? '+' : '') + sc + '</b></div></td>' +
        '<td>' + (r.inSect ? '✓' : '<span class="muted">—</span>') + '</td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<p class="src-note">' + E(T('unDigLegend')) + '</p>';

    // lots
    if (u.lots) {
      h += '<div class="section-title">' + E(T('unLots')) + '</div><div class="kstrip">';
      ['fortune', 'spirit'].forEach(function(k){
        var l = u.lots[k]; if (!l) return;
        h += kcell(T('unLot_' + k), SIGN_GLYPHS[l.signId] + ' ' + E(S(l.signId)) + ' ' + ltr(dm(l.deg)) + ' <small>· ' + E(T('houseN', { n: l.house })) + (l.lord ? ' · ' + E(T('unLordIs', { p: P(l.lord) })) : '') + '</small>');
      });
      h += '</div><p class="src-note">' + E(T('unLotsNote')) + '</p>';
    }

    // firdaria timeline
    if (fir.periods && fir.periods.length) {
      h += '<div class="section-title">' + E(T('unFirdaria')) + '</div><p class="sub">' + E(T('unFirdariaSub')) + '</p>';
      var now = Date.now(), total = 0;
      fir.periods.forEach(function(p){ total += p.years; });
      h += '<div class="tline">';
      fir.periods.forEach(function(p){
        var s = Date.parse(p.startISO), e = Date.parse(p.endISO), cur = now >= s && now < e;
        var prog = cur ? ((now - s) / (e - s) * 100).toFixed(1) : 0;
        h += '<div class="' + (cur ? 'cur' : '') + '" style="flex:' + p.years + ';--_c:' + C(p.lord) + ';--_p:' + prog + '%" title="' + E(P(p.lord) + ' ' + yearOf(p.startISO) + '–' + yearOf(p.endISO)) + '">' + G(p.lord) + '</div>';
      });
      h += '</div><div class="tline-legend"><span>' + yearOf(fir.periods[0].startISO) + '</span><span>' + total + 'y</span><span>' + yearOf(fir.periods[fir.periods.length - 1].endISO) + '</span></div>';
      h += '<div class="period-list" style="margin-top:.8rem">';
      fir.periods.forEach(function(p){
        var s = Date.parse(p.startISO), e = Date.parse(p.endISO), cur = now >= s && now < e;
        var subs = (p.subs || []).map(function(sb){ var ss = Date.parse(sb.startISO), se = Date.parse(sb.endISO); return '<span class="' + (now >= ss && now < se ? 'cur' : '') + '">' + G(sb.lord) + ' ' + E(P(sb.lord)) + ' · ' + yearOf(sb.startISO) + '</span>'; }).join('');
        h += '<div class="period-row' + (cur ? ' cur' : '') + '"><div class="pl"><span style="color:' + C(p.lord) + '">' + G(p.lord) + '</span>' + E(P(p.lord)) + (p.lord === 'NorthNode' || p.lord === 'SouthNode' ? ' <span class="muted" style="font-size:.74rem">(' + E(T('unNode_' + p.lord)) + ')</span>' : '') + '</div><div></div><div class="rng">' + E(fmtDate(p.startISO)) + ' → ' + E(fmtDate(p.endISO)) + ' · ' + p.years + 'y</div>' + (subs ? '<div class="subs">' + subs + '</div>' : '') + '</div>';
      });
      h += '</div>';
      if (fir.isEstimate) h += '<p class="src-note">' + E(T('estimateNote365')) + '</p>';
    }
    h += '<p class="src-note">' + E(T('unFrameNote', { ay: (u.ayanamsa || 0).toFixed(2) })) + '</p>';
    h += disputesBlock(u.disputes, 'dsp_');
    h += sourcesBlock(u.sources);
    box.innerHTML = h;
  };

  /* ------------------------------------------------------------------
     4b) ASHTOTTARI
     ------------------------------------------------------------------ */
  ZUI.renderAshtottari = function(data){
    var box = document.getElementById('ashtottari-content');
    if (!box) return;
    var a = data && data.ashtottariDasha;
    if (!a) { box.innerHTML = '<div class="placeholder">' + E(T('waitingData')) + '</div>'; return; }
    var cm = a.current && a.current.mahadasha, ca = a.current && a.current.antardasha;
    var ap = a.applicability || {}, pk = ap.pakshaRule || {};
    var h = '<div class="kstrip">' +
      kcell(T('ashtNow'), cm ? '<span style="color:' + C(cm.lord) + '">' + G(cm.lord) + '</span> ' + E(P(cm.lord)) + (ca ? ' <small>/ ' + E(P(ca.lord)) + '</small>' : '') : '—') +
      kcell(T('ashtMoon'), E(nakName(a.moon.nakshatra)) + ' <small>· ' + E(T('ashtGroup', { p: P(a.moon.groupLord) })) + '</small>') +
      kcell(T('ashtBalance'), ltr(a.moon.balanceYears.toFixed(2) + 'y') + ' <small>· ' + E(P(a.moon.groupLord)) + '</small>') +
      '</div>';
    h += '<div class="pred-card" style="margin-bottom:.9rem"><span class="tag">' + E(T('ashtApplicTitle')) + '</span>' +
      '<p style="margin:.3rem 0 0;font-size:.86rem">' + (ap.rahuRuleMet ? '✓ ' : '✗ ') + E(T('ashtRahuRule', { h: ap.rahuFromLagnaLord || '—', lord: P(ap.lagnaLord || '') })) + '</p>' +
      '<p style="margin:.2rem 0 0;font-size:.86rem">' + (pk.met ? '✓ ' : '✗ ') + E(T('ashtPakshaRule', { paksha: T('paksha_' + (pk.paksha || 'shukla')), time: pk.isDayBirth ? T('dayBirth') : T('nightBirth') })) + '</p>' +
      '<p class="muted" style="margin:.35rem 0 0;font-size:.78rem">' + E(T('ashtApplicNote')) + '</p></div>';
    h += '<div class="period-list">';
    var now = Date.now();
    (a.mahadashas || []).forEach(function(m){
      var subs = (m.antardashas || []).map(function(sb){ return '<span class="' + (sb.isCurrent ? 'cur' : '') + '">' + G(sb.lord) + ' ' + E(P(sb.lord)) + ' · ' + E(fmtDate(sb.startISO)) + '</span>'; }).join('');
      h += '<div class="period-row' + (m.isCurrent ? ' cur' : '') + '"><div class="pl"><span style="color:' + C(m.lord) + '">' + G(m.lord) + '</span>' + E(P(m.lord)) + (m.isBalance ? ' <span class="muted" style="font-size:.72rem">(' + E(T('balanceWord')) + ')</span>' : '') + '</div><div></div><div class="rng">' + E(fmtDate(m.startISO)) + ' → ' + E(fmtDate(m.endISO)) + ' · ' + (Math.round(m.years * 10) / 10) + 'y</div>' + (m.isCurrent ? '<div class="subs">' + subs + '</div>' : '') + '</div>';
    });
    h += '</div><p class="src-note">' + E(T('estimateNote365')) + '</p>';
    h += disputesBlock(a.disputes, 'dspA_');
    h += sourcesBlock(a.sources);
    box.innerHTML = h;
  };

  /* ------------------------------------------------------------------
     4c) SUDARSHAN CHAKRA — 3 rings SVG
     ------------------------------------------------------------------ */
  ZUI.renderSudarshan = function(data){
    var box = document.getElementById('sudarshan-content');
    if (!box) return;
    var s = data && data.sudarshanChakra;
    if (!s) { box.innerHTML = '<div class="placeholder">' + E(T('waitingData')) + '</div>'; return; }
    var cy = s.currentYear, act = cy ? cy.houseFromEach : 0;
    var cx = 210, cc = 210, rings = [['lagna', 70, 118], ['moon', 118, 164], ['sun', 164, 206]];
    var svg = '<svg viewBox="0 0 420 420" aria-label="Sudarshan chakra">';
    function pt(r, degA){ var a = degA * Math.PI / 180; return [cx + r * Math.cos(a), cc - r * Math.sin(a)]; }
    // house 1 at the left (east), counter-clockwise
    function arcPath(r0, r1, a0, a1){
      var p1 = pt(r1, a0), p2 = pt(r1, a1), p3 = pt(r0, a1), p4 = pt(r0, a0);
      return 'M' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + ' A' + r1 + ' ' + r1 + ' 0 0 0 ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1) + ' L' + p3[0].toFixed(1) + ' ' + p3[1].toFixed(1) + ' A' + r0 + ' ' + r0 + ' 0 0 1 ' + p4[0].toFixed(1) + ' ' + p4[1].toFixed(1) + 'Z';
    }
    rings.forEach(function(rg, ri){
      var arr = s.rings[rg[0]] || [];
      arr.forEach(function(cell){
        // khana 1 bayen (mashriq/ufuq), phir ulti ghari ki simt
        var a0 = 165 + (cell.house - 1) * 30, a1 = a0 + 30;
        var on = cell.house === act;
        svg += '<path d="' + arcPath(rg[1], rg[2], a0, a1) + '" fill="' + (on ? 'rgba(242,243,239,.9)' : (ri % 2 ? 'rgba(236,242,232,.035)' : 'rgba(236,242,232,.06)')) + '" stroke="rgba(242,243,239,.18)" stroke-width=".8"/>';
        var mid = pt((rg[1] + rg[2]) / 2, a0 + 15);
        var txt = (cell.planets || []).map(function(p){ return (typeof NAMES !== 'undefined' && NAMES.abbr[p]) || p.slice(0, 2); }).join(' ');
        svg += '<text x="' + mid[0].toFixed(1) + '" y="' + (mid[1] - (txt ? 6 : 0)).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="10" fill="' + (on ? '#18201c' : 'rgba(242,243,239,.55)') + '">' + (cell.signId + 1) + '</text>';
        if (txt) svg += '<text x="' + mid[0].toFixed(1) + '" y="' + (mid[1] + 7).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="' + (txt.length > 8 ? 8 : 9.5) + '" font-weight="600" fill="' + (on ? '#18201c' : '#e6c47a') + '">' + E(txt) + '</text>';
      });
    });
    svg += '<circle cx="210" cy="210" r="70" fill="rgba(3,11,10,.8)" stroke="rgba(242,243,239,.25)"/>';
    svg += '<text x="210" y="200" text-anchor="middle" font-size="11" fill="rgba(242,243,239,.6)">' + E(T('sudAge')) + '</text>';
    svg += '<text x="210" y="226" text-anchor="middle" font-size="26" fill="#f2f3ef">' + (cy ? cy.age + 1 : '—') + '</text>';
    svg += '</svg>';
    var info = '';
    if (cy) {
      info += '<div class="kstrip" style="grid-template-columns:1fr">' +
        kcell(T('sudYearNow', { n: cy.age + 1 }), E(T('sudHouseActive', { h: cy.houseFromEach })) + ' <small>· ' + E(fmtDate(cy.startISO)) + ' → ' + E(fmtDate(cy.endISO)) + '</small>') +
        ['lagna', 'moon', 'sun'].map(function(k){
          var pl = (cy.planetsInActivated && cy.planetsInActivated[k]) || [];
          return kcell(T('sudFrom_' + k), SIGN_GLYPHS[cy.signs[k]] + ' ' + E(S(cy.signs[k])) + ' <small>· ' + (pl.length ? pl.map(function(p){ return G(p) + ' ' + E(P(p)); }).join(', ') : E(T('sudEmpty'))) + '</small>');
        }).join('') + '</div>';
      var next = (s.years || []).filter(function(y){ return y.age > cy.age; }).slice(0, 3);
      info += '<div class="period-list">' + next.map(function(y){ return '<div class="period-row"><div class="pl">' + E(T('sudYearNow', { n: y.age + 1 })) + '</div><div></div><div class="rng">' + E(T('houseN', { n: y.house })) + ' · ' + yearOf(y.startISO) + '</div></div>'; }).join('') + '</div>';
    }
    box.innerHTML = '<div class="sud-wrap"><div>' + svg + '<p class="src-note" style="text-align:center">' + E(T('sudLegend')) + '</p></div><div>' + info + '<p class="src-note">' + E(T('sudNote')) + '</p>' + disputesBlock(s.disputes, 'dspS_') + sourcesBlock(s.sources) + '</div></div>';
  };

  /* ------------------------------------------------------------------
     4d) LEARN (master book)
     ------------------------------------------------------------------ */
  ZUI.learn = { level: 'beginner', lesson: null };
  function L(obj){ if (!obj) return ''; var l = lang(); return obj[l] || obj.en || ''; }
  function allLessons(level){
    var out = [];
    (level.chapters || []).forEach(function(ch){ (ch.lessons || []).forEach(function(ls){ out.push({ ch: ch, ls: ls }); }); });
    return out;
  }
  ZUI.renderLearn = function(){
    var box = document.getElementById('learn-content');
    if (!box) return;
    var book = window.ZAICHA_LEARN;
    if (!book || !book.levels) { box.innerHTML = '<div class="placeholder">' + E(T('learnLoading')) + '</div>'; return; }
    var st = ZUI.learn;
    var level = book.levels.filter(function(l){ return l.id === st.level; })[0] || book.levels[0];
    var items = book.levels.map(function(l){ return { id: l.id, label: L(l.title) }; });
    var h = '<div class="learn-levels">' + ZUI.dockHtml(items, level.id) + '</div>';
    var list = allLessons(level);
    if (st.lesson) {
      var idx = -1;
      list.forEach(function(x, i){ if (x.ls.id === st.lesson) idx = i; });
      if (idx === -1) st.lesson = null;
      else {
        var cur = list[idx].ls;
        var paras = (cur.body && (cur.body[lang()] || cur.body.en)) || [];
        var kps = (cur.keyPoints && (cur.keyPoints[lang()] || cur.keyPoints.en)) || [];
        h += '<article class="lesson ptab-panel">';
        h += '<button type="button" class="back-btn" data-learn="back">' + (document.documentElement.dir === 'rtl' ? '→ ' : '← ') + E(T('learnBack')) + '</button>';
        h += '<div class="scr-idx" style="margin-top:1rem">' + E(L(level.title)) + ' · ' + pad(idx + 1) + ' / ' + pad(list.length) + (cur.minutes ? ' · ' + E(T('learnMinutes', { n: cur.minutes })) : '') + '</div>';
        h += '<h2>' + E(L(cur.title)) + '</h2>';
        paras.forEach(function(p){ h += '<p>' + E(p) + '</p>'; });
        if (kps.length) h += '<div class="keypoints"><h5>' + E(T('learnKeyPoints')) + '</h5><ul>' + kps.map(function(k){ return '<li>' + E(k) + '</li>'; }).join('') + '</ul></div>';
        if (cur.tryInApp && cur.tryInApp.tab) h += '<button type="button" class="cta-btn" data-learn="try" data-tab="' + E(cur.tryInApp.tab) + '" style="max-width:420px">' + E(L(cur.tryInApp.label) || T('learnTry')) + '</button>';
        if (cur.sources && cur.sources.length) h += '<div class="disputes" style="border-style:solid"><h5>' + E(T('learnSources')) + '</h5>' + sourcesBlock(cur.sources) + '</div>';
        h += '<div class="lesson-nav">' +
          (idx > 0 && !list[idx - 1].ls.comingSoon ? '<button type="button" class="back-btn" data-learn="go" data-id="' + E(list[idx - 1].ls.id) + '">' + E(T('learnPrev')) + ' · ' + E(L(list[idx - 1].ls.title)) + '</button>' : '<span></span>') +
          (idx < list.length - 1 && !list[idx + 1].ls.comingSoon ? '<button type="button" class="back-btn" data-learn="go" data-id="' + E(list[idx + 1].ls.id) + '">' + E(T('learnNext')) + ' · ' + E(L(list[idx + 1].ls.title)) + '</button>' : '') +
          '</div></article>';
      }
    }
    if (!st.lesson) {
      h += '<p class="sub">' + E(L(level.blurb)) + '</p><div class="learn-grid">';
      list.forEach(function(x, i){
        var soon = !!x.ls.comingSoon;
        h += '<button type="button" class="learn-card' + (soon ? ' soon' : '') + '" ' + (soon ? 'disabled' : 'data-learn="go" data-id="' + E(x.ls.id) + '"') + '>' +
          '<span class="n">' + pad(i + 1) + ' — ' + E(L(x.ch.title)) + '</span><h4>' + E(L(x.ls.title)) + '</h4>' +
          '<span class="meta">' + (soon ? E(T('learnSoon')) : E(T('learnMinutes', { n: x.ls.minutes || 4 }))) + '</span></button>';
      });
      h += '</div>';
    }
    box.innerHTML = h;
    ZUI.wireDock(box.querySelector('.learn-levels'), function(id){ st.level = id; st.lesson = null; ZUI.renderLearn(); });
    if (!box._wired) {
      box._wired = 1;
      box.addEventListener('click', function(e){
        var b = e.target.closest('[data-learn]'); if (!b) return;
        var act = b.getAttribute('data-learn');
        if (act === 'go') { ZUI.learn.lesson = b.getAttribute('data-id'); ZUI.renderLearn(); var ph = document.getElementById('phone-learn'); if (ph) ph.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        else if (act === 'back') { ZUI.learn.lesson = null; ZUI.renderLearn(); }
        else if (act === 'try') {
          var tab = b.getAttribute('data-tab');
          if (document.body.classList.contains('app-mode')) activateTab(tab, true);
          else { ZUI.toast(T('needChartFirst')); var hs = document.getElementById('hero-start'); if (hs) hs.click(); }
        }
      });
    }
  };

  /* ------------------------------------------------------------------
     HOOKS
     ------------------------------------------------------------------ */
  ZUI.renderAll = function(data){
    ZUI.renderPlanetStudio(data);
    ZUI.enhanceReading(data);
    ZUI.renderUnani(data);
    ZUI.renderAshtottari(data);
    ZUI.renderSudarshan(data);
    ZUI.renderLearn();
  };
  ZUI.onLanguage = function(){
    ZUI.renderLearn();
    var nav = document.getElementById('system-tabs');
    if (nav) ZUI.initDock(nav);
  };

  function boot(){
    initSky();
    buildHeroWheel();
    wireHero();
    var nav = document.getElementById('system-tabs');
    if (typeof buildSystemTabs === 'function') buildSystemTabs();
    else if (nav) ZUI.initDock(nav);
    ZUI.renderLearn();
    // PWA shortcut / share link: /#learn seedha Learn kholta hai
    if (location.hash === '#learn' && typeof activateTab === 'function') setTimeout(function(){ activateTab('learn', false); }, 60);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
