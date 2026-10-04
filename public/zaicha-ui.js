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
          if (ZUI.closeSheets) ZUI.closeSheets();
          if (typeof activateTab === 'function') activateTab(tab, true);   // v0.2: old ids are mapped (issue 6)
        }
      });
    }
  };

  /* ------------------------------------------------------------------
     LAL KITAB 3D SKY (Session 9) — /orrery.html in a same-origin iframe.
     Rule: the app's ephemeris is the single source of truth. We SEND the
     finished positions; the orrery never calculates, it only draws. The
     Lal Kitab SVG chart becomes a floating mini-map at the side.
     ------------------------------------------------------------------ */
  var LK_KEYS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  var LK_POLY = { 1: [[150, 0], [225, 75], [150, 150], [75, 75]], 2: [[0, 0], [150, 0], [75, 75]], 3: [[0, 0], [75, 75], [0, 150]], 4: [[0, 150], [75, 75], [150, 150], [75, 225]],
    5: [[0, 150], [75, 225], [0, 300]], 6: [[0, 300], [75, 225], [150, 300]], 7: [[150, 300], [75, 225], [150, 150], [225, 225]], 8: [[150, 300], [225, 225], [300, 300]],
    9: [[300, 300], [225, 225], [300, 150]], 10: [[300, 150], [225, 225], [150, 150], [225, 75]], 11: [[300, 150], [225, 75], [300, 0]], 12: [[300, 0], [225, 75], [150, 0]] };
  var LK3 = { data: null, frame: null, ready: false, built: false, failed: false, timer: null, collapsed: false, z: null, sel: null, selH: null, io: null };

  // App data → orrery zaicha. Best case: exact sidereal longitudes + ascendant
  // (whole-sign houses from the lagna = exactly how lib/lal-kitab.js counts).
  // Fallback: only houses → Lal Kitab fixed houses (house 1 = Aries).
  ZUI.toOrreryZaicha = function(data){
    if (!data) return null;
    var n = data.natal || {}, pl = n.planets || {}, planets = {}, full = true;
    LK_KEYS.forEach(function(p){
      var r = pl[p];
      if (r && r.rasiId != null && isFinite(r.degree)) planets[p.toLowerCase()] = { lon: +(Number(r.rasiId) * 30 + Number(r.degree)).toFixed(6) };
      else full = false;
    });
    var meta = { title: (data.person && data.person.name) || 'Zaicha', system: 'lalkitab', zodiac: 'sidereal',
      ayanamsa: (data.person && data.person.systemLatin) || null, nodeType: (data.nodeType && data.nodeType.applied) || null };
    if (full && n.ascendantRasiId != null && isFinite(n.ascendantDegree)) {
      meta.houseMode = 'ascendant'; meta.ascendant = +(Number(n.ascendantRasiId) * 30 + Number(n.ascendantDegree)).toFixed(6); meta.planets = planets;
      return meta;
    }
    var lk = data.lalKitab; if (!lk || !lk.houses) return null;
    var houses = {};
    lk.houses.forEach(function(h){ if (h.planets && h.planets.length) houses[h.house] = h.planets.map(function(p){ return String(p).toLowerCase(); }); });
    meta.houseMode = 'fixed'; meta.houses = houses;
    return meta;
  };
  function lkExpected(){ var m = {}; ((LK3.data && LK3.data.lalKitab || {}).planets || []).forEach(function(r){ m[String(r.planet).toLowerCase()] = r.house; }); return m; }
  function lkWebGL(){ try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  function lkPost(msg){ if (LK3.frame && LK3.frame.contentWindow) LK3.frame.contentWindow.postMessage(msg, location.origin); }
  function lkBox(){ return document.getElementById('lk3d'); }
  function lkStatus(html, cls){ var b = lkBox(); if (!b) return; var s = b.querySelector('.lk3d-status'); s.className = 'lk3d-status' + (cls ? ' ' + cls : ''); s.innerHTML = html; }
  function lkTexts(){
    var b = lkBox(); if (!b) return;
    b.querySelector('.lk3d-title').textContent = T('lk3dTitle');
    b.querySelector('.lk3d-open').textContent = T('lk3dOpen') + ' ↗';
    b.querySelector('.lk3d-map-t').textContent = T('lk3dMap');
    b.querySelector('.lk3d-toggle').textContent = LK3.collapsed ? T('lk3dShow') : T('lk3dHide');
    b.querySelector('.lk3d-loading').textContent = T('lk3dLoading');
    b.querySelector('.lk3d-hint').textContent = T('lk3dHint');
    b.querySelector('.lk3d-note').textContent = T('lk3dNote');
    if (LK3.frame) LK3.frame.title = T('lk3dTitle');
    if (LK3.failed) lkStatus(E(T('lk3dFallback')), 'warn'); else if (LK3.lastCheck) lkCheck(LK3.lastCheck);
  }
  function lkBuild(){
    if (LK3.built) return true;
    var phone = document.getElementById('phone-lalkitab'); if (!phone) return false;
    var wrap = phone.querySelector('.chart-wrap'); if (!wrap) return false;
    var box = document.createElement('div'); box.className = 'lk3d'; box.id = 'lk3d';
    box.innerHTML = '<div class="lk3d-head"><span class="lk3d-title"></span><a class="lk3d-open" target="_blank" rel="noopener" href="/orrery.html"></a></div>' +
      '<div class="lk3d-stage"><div class="lk3d-loading"></div>' +
      '<aside class="lk3d-mini"><div class="lk3d-mini-head"><span class="lk3d-map-t"></span><button type="button" class="lk3d-toggle"></button></div><div class="lk3d-mini-body"></div></aside></div>' +
      '<p class="lk3d-status" role="status" aria-live="polite"></p><p class="lk3d-hint src-note"></p><p class="lk3d-note src-note"></p>';
    wrap.parentNode.insertBefore(box, wrap);
    box.querySelector('.lk3d-mini-body').appendChild(wrap);
    var svg = wrap.querySelector('svg');
    if (svg) {
      var ns = 'http://www.w3.org/2000/svg', g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'lk3d-hit');
      for (var h = 1; h <= 12; h++) { var p = document.createElementNS(ns, 'polygon'); p.setAttribute('points', LK_POLY[h].map(function(q){ return q.join(','); }).join(' ')); p.setAttribute('data-h', h); g.appendChild(p); }
      svg.insertBefore(g, svg.firstChild);
      svg.addEventListener('click', function(e){
        var t = e.target.closest('[data-planet],[data-h]'); if (!t) return;
        if (t.getAttribute('data-planet')) { var id = t.getAttribute('data-planet').toLowerCase(); lkMark(id, null); lkPost({ type: 'orrery:select', id: id }); }
        else { var hh = +t.getAttribute('data-h'); lkMark(null, hh); lkPost({ type: 'orrery:selectHouse', house: hh }); }
      });
    }
    box.querySelector('.lk3d-toggle').addEventListener('click', function(){ LK3.collapsed = !LK3.collapsed; box.classList.toggle('lk3d-collapsed', LK3.collapsed); lkTexts(); });
    LK3.built = true; lkTexts();
    if ('IntersectionObserver' in window) {
      LK3.io = new IntersectionObserver(function(en){ en.forEach(function(x){ if (x.isIntersecting && LK3.data) lkMount(); }); }, { rootMargin: '200px' });
      LK3.io.observe(box);
    }
    return true;
  }
  function lkFail(){
    LK3.failed = true; clearTimeout(LK3.timer);
    var b = lkBox(); if (b) b.classList.add('lk3d-failed');
    if (LK3.frame) { LK3.frame.parentNode.removeChild(LK3.frame); LK3.frame = null; }
    lkStatus(E(T('lk3dFallback')), 'warn');
  }
  function lkMount(){
    if (LK3.frame || LK3.failed || !LK3.data) return;
    if (!lkBuild()) return;
    var b = lkBox(); if (!b || !b.offsetParent) return;          // tab hidden: wait
    if (!lkWebGL()) { lkFail(); return; }
    var f = document.createElement('iframe'); f.className = 'lk3d-frame'; f.title = T('lk3dTitle'); f.src = '/orrery.html?embed=1&mini=0';
    var st = b.querySelector('.lk3d-stage'); st.insertBefore(f, st.firstChild); LK3.frame = f;
    LK3.timer = setTimeout(function(){ if (!LK3.ready) lkFail(); }, 20000);
  }
  function lkSend(){
    if (!LK3.data) return;
    var z = ZUI.toOrreryZaicha(LK3.data); LK3.z = z; if (!z) return;
    var b = lkBox();
    if (b) { try { b.querySelector('.lk3d-open').href = '/orrery.html#zaicha=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(z))))); } catch (e) {} }
    if (LK3.ready) lkPost({ type: 'orrery:setZaicha', zaicha: z });
  }
  function lkCheck(d){
    LK3.lastCheck = d;
    if (!d || !d.ok) { lkStatus('⚠ ' + E((d && d.error) || 'error'), 'warn'); return; }
    var exp = lkExpected(), bad = [];
    Object.keys(exp).forEach(function(k){ if (d.houses && d.houses[k] !== exp[k]) bad.push(P(k.charAt(0).toUpperCase() + k.slice(1)) + ' (' + exp[k] + ' ≠ ' + (d.houses ? d.houses[k] : '—') + ')'); });
    var extra = LK3.z && LK3.z.houseMode === 'fixed' ? ' ' + E(T('lk3dHouseOnly')) : '';
    if (bad.length) lkStatus('⚠ ' + E(T('lk3dMismatch', { list: bad.join(', ') })) + extra, 'warn');
    else lkStatus('✓ ' + E(T('lk3dMatch')) + extra, 'ok');
  }
  function lkMark(id, house){
    var b = lkBox(); if (!b) return;
    if (id && !house) house = lkExpected()[id] || null;
    LK3.sel = id; LK3.selH = house;
    b.querySelectorAll('#lk-planet-chips text').forEach(function(t){ t.classList.toggle('lk-sel', !!id && String(t.getAttribute('data-planet')).toLowerCase() === id); });
    b.querySelectorAll('.lk3d-hit polygon').forEach(function(p){ p.classList.toggle('sel', +p.getAttribute('data-h') === house); });
  }
  window.addEventListener('message', function(e){
    if (!LK3.frame || e.source !== LK3.frame.contentWindow || e.origin !== location.origin) return;
    var m = e.data || {}, d = m.detail || {};
    if (m.type === 'orrery:ready') { LK3.ready = true; clearTimeout(LK3.timer); var b = lkBox(); if (b) b.classList.add('lk3d-ready'); lkSend(); }
    else if (m.type === 'orrery:zaicha') lkCheck(d);
    else if (m.type === 'orrery:select') lkMark(d.id, null);
    else if (m.type === 'orrery:houseselect') lkMark(null, d.house);
  });
  // Called on every new zaicha (renderAll) and when the Lal Kitab tab opens.
  ZUI.lk3dUpdate = function(data){
    LK3.data = data || LK3.data; LK3.lastCheck = null;
    if (!lkBuild()) return;
    lkStatus('', '');
    if (LK3.frame) lkSend(); else { lkSend(); setTimeout(lkMount, 30); }
    if (LK3.sel || LK3.selH) setTimeout(function(){ lkMark(LK3.sel, LK3.sel ? null : LK3.selH); }, 0);
  };
  ZUI.onTab = function(tabId){ if (tabId === 'expert' || tabId === 'lalkitab') setTimeout(lkMount, 60); };
  ZUI.lk3dMount = function(){ setTimeout(lkMount, 60); };   // v0.2: called when the Lal Kitab section opens
  ZUI._lk3d = LK3;

  /* ------------------------------------------------------------------
     Session 9c: ابتدائیہ (preface) + آیاتِ آسمان (3D cosmos iframe)
     ------------------------------------------------------------------ */
  var PREF_OPEN = false;
  ZUI.renderPreface = function(boxId){
    boxId = boxId || 'preface-sec'; var box = document.getElementById(boxId); var all = window.ZAICHA_PREFACE; if (!box || !all) return;
    var P = all[lang()] || all.en;
    var h = '<div class="pref-card' + (PREF_OPEN ? ' open' : '') + '"><div class="pref-head"><img class="tz-logo sm" src="/tehzeeb-logo.svg" alt="" width="64" height="64"><h3>' + E(P.title) + '</h3>' + (P.byline ? '<p class="pref-by">' + E(P.byline) + '</p>' : '') + '</div><div class="pref-body">';
    P.blocks.forEach(function(b){
      if (b.t === 'p') h += '<p>' + b.x + '</p>';
      else if (b.t === 'q') h += '<figure class="pref-q"><blockquote lang="ar" dir="rtl">' + E(b.ar).replace(/ ۞ /g, ' <span class="waqf">۞</span> ') + '</blockquote>' + (b.tr ? '<figcaption>' + E(b.tr) + '</figcaption>' : '') + '<cite>' + E(b.ref) + '</cite></figure>';
      else if (b.t === 'dua') h += '<p class="pref-dua" lang="ar" dir="rtl">' + E(b.ar) + '</p>';
    });
    if (P.trNote) h += '<p class="pref-note">' + E(P.trNote) + '</p>';
    h += '</div><button type="button" class="pill-btn pref-toggle">' + E(PREF_OPEN ? T('prefLess') : T('prefMore')) + '</button></div>';
    box.innerHTML = h;
    box.querySelector('.pref-toggle').addEventListener('click', function(){ PREF_OPEN = !PREF_OPEN; ZUI.renderPreface(boxId); if (!PREF_OPEN) box.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  };
  var COS = { frame: null, io: null, failed: false, lang: null };
  function cosWebGL(){ try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  function cosMount(){
    var st = document.getElementById('cosmos-stage'); if (!st || COS.frame || COS.failed) return;
    if (!cosWebGL()) { COS.failed = true; st.classList.add('failed'); var pp = document.getElementById('cosmos-poster'); if (pp) pp.textContent = T('cosmosFail'); return; }
    var f = document.createElement('iframe'); f.className = 'cosmos-frame'; f.title = T('cosmosTitle'); f.setAttribute('allow', 'fullscreen'); f.allowFullscreen = true;
    COS.lang = lang(); f.src = '/cosmos.html?lang=' + encodeURIComponent(COS.lang); st.appendChild(f); COS.frame = f;
  }
  function cosVisible(v){ if (COS.frame && COS.frame.contentWindow) COS.frame.contentWindow.postMessage({ type: 'cosmos:visible', visible: v }, location.origin); }
  window.addEventListener('message', function(e){
    if (!COS.frame || e.source !== COS.frame.contentWindow || e.origin !== location.origin) return;
    var m = e.data || {};
    if (m.type === 'cosmos:ready') { var st = document.getElementById('cosmos-stage'); if (st) st.classList.add('ready'); }
    if (m.type === 'cosmos:error') { COS.failed = true; var s2 = document.getElementById('cosmos-stage'); if (s2) s2.classList.add('failed'); var pp = document.getElementById('cosmos-poster'); if (pp) pp.textContent = T('cosmosFail'); if (COS.frame) { COS.frame.remove(); COS.frame = null; } }
  });
  ZUI.initCosmos = function(){
    var sec = document.getElementById('cosmos-sec'); if (!sec || COS.io) return;
    if (!('IntersectionObserver' in window)) { cosMount(); return; }
    COS.io = new IntersectionObserver(function(en){ en.forEach(function(x){ if (x.isIntersecting) cosMount(); cosVisible(x.isIntersecting); }); }, { rootMargin: '300px 0px' });
    COS.io.observe(sec);
  };
  ZUI.cosmosLang = function(){ if (COS.frame && COS.lang !== lang()) { COS.lang = lang(); COS.frame.src = '/cosmos.html?lang=' + encodeURIComponent(COS.lang); var st = document.getElementById('cosmos-stage'); if (st) st.classList.remove('ready'); } };

  /* ------------------------------------------------------------------
     Session 9c: فہرست (Index) — auto-built from the tabs + screen titles
     ------------------------------------------------------------------ */
  var IDX_Q = '';
  function idxText(el){ return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  ZUI.renderIndex = function(){
    var box = document.getElementById('index-content'); if (!box || typeof V2_TABS === 'undefined') return;
    var inApp = document.body.classList.contains('app-mode');
    var groups = [];
    groups.push({ id: 'front', name: T('indexFront'), items: [
      { go: 'cosmos', title: T('cosmosTitle'), desc: T('secd_cosmos3d'), free: true },
      { go: 'sky3d', title: T('idxSky3d'), desc: T('sky3d') + ' · ' + T('chart2d'), free: false },
      { go: 'preface', title: (window.ZAICHA_PREFACE && (ZAICHA_PREFACE[lang()] || ZAICHA_PREFACE.en).title) || 'Preface', desc: '', free: true },
      { go: 'learn', title: T('learnH3'), desc: T('learnSub'), free: true }
    ] });
    function secItem(tabId, sid, expert){ return { go: 'sec', sec: sid, tab: tabId, expert: !!expert, title: T('sec_' + sid), desc: T('secd_' + sid) }; }
    V2_TABS.forEach(function(t){
      if (t.sections) groups.push({ id: t.id, name: T('v2tab_' + t.id), items: t.sections.map(function(sid){ return secItem(t.id, sid, t.expert); }) });
      (t.groups || []).forEach(function(g){ groups.push({ id: g.id, name: T('v2tab_' + t.id) + ' · ' + T(g.id), items: g.sections.map(function(sid){ return secItem(t.id, sid, true); }) }); });
    });
    var h = '<div class="idx-search"><input type="search" id="idx-q" placeholder="' + E(T('indexSearch')) + '" value="' + E(IDX_Q) + '" aria-label="' + E(T('indexSearch')) + '"></div><div class="idx-grid">';
    groups.forEach(function(g){
      h += '<section class="idx-group" data-g="' + E(g.id) + '"><h4>' + E(g.name) + '</h4><ul>';
      g.items.forEach(function(it){
        var lock = !inApp && !it.free;
        h += '<li><button type="button" class="idx-item' + (lock ? ' lock' : '') + '" data-go="' + E(it.go) + '" data-sec="' + E(it.sec || '') + '" data-tab="' + E(it.tab || '') + '" data-expert="' + (it.expert ? '1' : '') + '" data-s="' + E((g.name + ' ' + it.title + ' ' + it.desc).toLowerCase()) + '"><b>' + E(it.title) + '</b>' + (it.desc ? '<small>' + E(it.desc) + '</small>' : '') + (lock ? '<i>' + E(T('indexNeeds')) + '</i>' : '') + '</button></li>';
      });
      h += '</ul></section>';
    });
    h += '</div><p class="idx-empty" hidden>—</p>';
    box.innerHTML = h;
    var q = box.querySelector('#idx-q');
    function filter(){ IDX_Q = q.value; var v = q.value.trim().toLowerCase(), any = false;
      box.querySelectorAll('.idx-group').forEach(function(sec){ var n = 0; sec.querySelectorAll('.idx-item').forEach(function(b){ var ok = !v || b.getAttribute('data-s').indexOf(v) >= 0; b.parentNode.hidden = !ok; if (ok) n++; }); sec.hidden = !n; if (n) any = true; });
      box.querySelector('.idx-empty').hidden = any; }
    q.addEventListener('input', filter); filter();
    if (box._v2wired) return;                       // one click handler only (issue 8)
    box._v2wired = 1;
    box.addEventListener('click', function(e){
      var b = e.target.closest('.idx-item'); if (!b) return;
      var go = b.getAttribute('data-go'), tab = b.getAttribute('data-tab'), sec = b.getAttribute('data-sec'), expert = b.getAttribute('data-expert') === '1';
      var inAppNow = document.body.classList.contains('app-mode');
      if (go === 'learn') { ZUI.openSheet('learn'); return; }
      if (go === 'sky3d') {   // v0.2 pass 2.2: the chart's own 3D sky
        if (!inAppNow) { if (typeof showEntryForm === 'function') showEntryForm({ focus: true }); ZUI.toast(T('needChartFirst')); return; }
        ZUI.closeSheets(); if (ZUI.setChartMode) ZUI.setChartMode('3d', true);
        var ch = document.querySelector('.v2-sum-chart'); if (ch) setTimeout(function(){ ch.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 30);
        return;
      }
      if (go === 'cosmos' || go === 'preface') {
        if (inAppNow) {   // the landing page is hidden inside the app
          if (go === 'cosmos') { ZUI.closeSheets(); if (typeof activateTab === 'function') activateTab('periods', false); if (typeof v2OpenSection === 'function') v2OpenSection('cosmos3d', true); return; }
          var ip = document.getElementById('idx-preface'); if (!ip) { ip = document.createElement('div'); ip.id = 'idx-preface'; ip.className = 'preface-sec'; box.appendChild(ip); }
          PREF_OPEN = true; ZUI.renderPreface('idx-preface'); ip.scrollIntoView({ behavior: 'smooth', block: 'start' }); return;
        }
        ZUI.closeSheets();
        if (go === 'cosmos') { setTimeout(function(){ window.scrollTo({ top: 0, behavior: 'smooth' }); }, 30); return; }   // the opening sky (hero)
        var tgt = document.getElementById('preface-sec'); if (tgt) setTimeout(function(){ tgt.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
        return;
      }
      if (!inAppNow) {
        try { window.v2PendingTab = { tab: tab, section: sec, expert: expert }; } catch (e2) {}
        if (typeof showEntryForm === 'function') showEntryForm({ focus: true });
        ZUI.toast(T('needChartFirst'));
        return;
      }
      ZUI.closeSheets();
      if (expert && !document.body.classList.contains('mode-expert')) ZUI.setExpert(true);
      if (typeof activateTab === 'function') activateTab(tab, false);
      if (typeof v2OpenSection === 'function') v2OpenSection(sec, true);
    });
  };

  /* ------------------------------------------------------------------
     Session 9e — Week 1: navigation (Home / Close / people switcher),
     recent zaichas (no re-typing), simpler birth form (advanced folded)
     ------------------------------------------------------------------ */
  var PEOPLE_KEY = 'zaicha.people.v1';
  function peopleLoad(){ try { var a = JSON.parse(localStorage.getItem(PEOPLE_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function peopleSave(a){ try { localStorage.setItem(PEOPLE_KEY, JSON.stringify(a.slice(0, 12))); } catch (e) {} }
  function val(id){ var el = document.getElementById(id); return el ? el.value : ''; }
  function currentForm(){ return { name: val('in-name').trim(), dob: val('in-dob'), time: val('in-time'), city: val('in-city'), lat: val('in-lat'), lon: val('in-lon'), tz: val('in-tz'), off: val('in-offset'), ay: val('in-ayanamsa'), node: val('in-node-type') }; }
  function pKey(p){ return [p.name, p.dob, p.time, (+p.lat).toFixed(3), (+p.lon).toFixed(3)].join('|'); }
  ZUI.rememberPerson = function(data){
    var p = currentForm(); if (!p.dob || !p.time || !p.lat || !p.lon) return;
    if (data && data.natal && typeof data.natal.ascendantRasiId === 'number') p.asc = data.natal.ascendantRasiId;
    var list = peopleLoad().filter(function(x){ return pKey(x) !== pKey(p); });
    list.unshift(p); peopleSave(list); ZUI.current = p; renderPeopleUI();
  };
  function setV(id, v){ var el = document.getElementById(id); if (el && v != null) el.value = v; }
  ZUI.openPerson = function(p){
    if (ZUI.closeSheets) ZUI.closeSheets();
    setV('in-name', p.name); setV('in-dob', p.dob); setV('in-time', p.time); setV('in-city', p.city); setV('in-lat', p.lat); setV('in-lon', p.lon); setV('in-tz', p.tz);
    if (typeof updateBirthOffset === 'function') updateBirthOffset();
    if (p.off) setV('in-offset', p.off); if (p.ay) setV('in-ayanamsa', p.ay); if (p.node) setV('in-node-type', p.node);
    if (typeof updateCoordHint === 'function') updateCoordHint();
    try { window.loadedProfileId = null; } catch (e) {}
    closeMenu();
    if (typeof runGenerate === 'function') runGenerate();
  };
  function removePerson(i){ var l = peopleLoad(); l.splice(i, 1); peopleSave(l); renderPeopleUI(); if (ZUI.renderMenu) ZUI.renderMenu(); }
  ZUI.newZaicha = function(){
    closeMenu();
    if (typeof showEntryForm === 'function') showEntryForm({ clear: true, focus: true, reset: true });   // the old chart stays in Recent charts
  };
  ZUI.closeApp = function(){
    closeMenu();
    if (typeof showEntryForm === 'function') showEntryForm({ clear: true, top: true, reset: true });
  };
  function closeMenu(){ var m = document.getElementById('zp-menu'); if (m) m.hidden = true; var b = document.getElementById('zp-btn'); if (b) b.setAttribute('aria-expanded', 'false'); }
  function personLine(p){ return E(p.name || '—') + '<small>' + E(p.dob) + ' · ' + E(p.time) + (p.city ? ' · ' + E(p.city.split(',')[0]) : '') + '</small>'; }
  function renderPeopleUI(){
    if (ZUI.renderHeroCard) setTimeout(ZUI.renderHeroCard, 0);
    var list = peopleLoad(), cur = ZUI.current;
    // header bar
    var bar = document.getElementById('zp-bar');
    if (bar) {
      var name = cur && cur.name ? cur.name : T('peopleRecent');
      bar.querySelector('#zp-btn .zp-name').textContent = name;
      var menu = document.getElementById('zp-menu');
      var h = '<button type="button" class="zp-new" data-act="new">＋ ' + E(T('peopleNew')) + '</button>';
      if (list.length) h += '<div class="zp-cap">' + E(T('peopleRecent')) + '</div>';
      list.forEach(function(p, i){ h += '<div class="zp-row"><button type="button" class="zp-open" data-i="' + i + '">' + personLine(p) + '</button><button type="button" class="zp-del" data-del="' + i + '" aria-label="' + E(T('peopleRemove')) + '" title="' + E(T('peopleRemove')) + '">×</button></div>'; });
      menu.innerHTML = h;
      bar.querySelector('#zp-home').title = T('navHome'); bar.querySelector('#zp-home').setAttribute('aria-label', T('navHome'));
      bar.querySelector('#zp-close').title = T('navClose'); bar.querySelector('#zp-close').setAttribute('aria-label', T('navClose'));
    }
    // recent chips above the form
    var rc = document.getElementById('zp-recent');
    if (rc) {
      if (!list.length) { rc.hidden = true; rc.innerHTML = ''; }
      else {
        rc.hidden = false;
        rc.innerHTML = '<div class="zp-cap">' + E(T('peopleRecent')) + '</div><div class="zp-chips zp-cards">' + list.slice(0, 8).map(function(p, i){
          var nm = p.name || '—', ini = String(nm).trim().charAt(0) || '✦';
          var asc = (typeof p.asc === 'number' && typeof SNfull === 'function') ? E(T('ascLabel')) + ': ' + E(SNfull(p.asc)) : '<span class="ltr">' + E(p.dob) + '</span>';
          return '<button type="button" class="zp-chip zp-card" data-i="' + i + '" style="--_h:' + ((i * 47) % 360) + '"><span class="zp-av" aria-hidden="true">' + E(ini) + '</span><span class="zp-card-t"><b>' + E(nm) + '</b><small>' + asc + '</small></span></button>';
        }).join('') + '</div>';
      }
    }
  }
  function buildNav(){
    var acts = document.querySelector('.topbar .topbar-actions'); if (!acts || document.getElementById('zp-bar')) return;
    var bar = document.createElement('div'); bar.id = 'zp-bar'; bar.className = 'zp-bar';
    bar.innerHTML = '<button type="button" class="zp-ic" id="zp-home"><svg viewBox="0 0 24 24"><path d="M3.5 11.2 12 4l8.5 7.2V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/></svg></button>' +
      '<div class="zp-people"><button type="button" class="zp-btn" id="zp-btn" aria-haspopup="true" aria-expanded="false"><svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-4 4-6 7.5-6s6.7 2 7.5 6"/></svg><span class="zp-name"></span><span aria-hidden="true">▾</span></button><div class="zp-menu" id="zp-menu" hidden></div></div>' +
      '<button type="button" class="zp-mode" id="zp-mode" aria-pressed="false"><span class="zp-mode-a"></span><span class="zp-mode-b"></span></button>' +
      '<button type="button" class="zp-ic" id="zp-close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
    acts.insertBefore(bar, acts.firstChild);
    bar.querySelector('#zp-home').addEventListener('click', function(){ closeMenu(); if (typeof activateTab === 'function') activateTab('home', true); });
    bar.querySelector('#zp-close').addEventListener('click', ZUI.closeApp);
    bar.querySelector('#zp-mode').addEventListener('click', function(){ ZUI.setExpert(!document.body.classList.contains('mode-expert')); });
    bar.querySelector('#zp-btn').addEventListener('click', function(e){ e.stopPropagation(); var m = document.getElementById('zp-menu'); m.hidden = !m.hidden; this.setAttribute('aria-expanded', m.hidden ? 'false' : 'true'); });
    bar.querySelector('#zp-menu').addEventListener('click', function(e){
      e.stopPropagation();
      var d = e.target.closest('[data-del]'); if (d) { removePerson(+d.getAttribute('data-del')); return; }
      var o = e.target.closest('.zp-open'); if (o) { ZUI.openPerson(peopleLoad()[+o.getAttribute('data-i')]); return; }
      if (e.target.closest('[data-act="new"]')) ZUI.newZaicha();
    });
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMenu(); });
  }
  function simplifyForm(){
    var entry = document.getElementById('phone-entry'); if (!entry || document.getElementById('zp-adv')) return;
    // recent chips on top of the form
    var rc = document.createElement('div'); rc.id = 'zp-recent'; rc.className = 'zp-recent'; rc.hidden = true;
    if (entry.parentNode) entry.parentNode.insertBefore(rc, entry.nextSibling);   // v0.2 pass 2: under the form
    rc.addEventListener('click', function(e){ var c = e.target.closest('.zp-chip'); if (c) ZUI.openPerson(peopleLoad()[+c.getAttribute('data-i')]); });
    // fold advanced options (system / Rahu type / UTC offset) — Lahiri stays the default
    var adv = document.createElement('details'); adv.id = 'zp-adv'; adv.className = 'zp-adv';
    adv.innerHTML = '<summary></summary><div class="zp-adv-body"></div>';
    var body = adv.querySelector('.zp-adv-body');
    var fOff = (document.getElementById('in-offset') || {}).closest ? document.getElementById('in-offset').closest('.field') : null;
    var fAy = document.getElementById('in-ayanamsa') ? document.getElementById('in-ayanamsa').closest('.field') : null;
    var fNode = document.getElementById('in-node-type') ? document.getElementById('in-node-type').closest('.field') : null;
    var gen = document.getElementById('generate-btn');
    if (!fAy || !gen) return;
    gen.parentNode.insertBefore(adv, gen);
    [fAy, fNode, fOff].forEach(function(f){ if (f) body.appendChild(f); });
    entry.querySelectorAll('.zp-adv-move').forEach(function(f){ body.appendChild(f); });   // v0.2
    advLabel();
  }
  function advLabel(){ var s = document.querySelector('#zp-adv > summary'); if (!s) return; var ay = document.getElementById('in-ayanamsa'); var sys = ay && ay.options[ay.selectedIndex] ? ay.options[ay.selectedIndex].textContent : ''; s.innerHTML = '<span class="adv-long">' + E(T('advSettings')) + '</span><span class="adv-short">' + E(T('advShort')) + ' ·</span> <b>' + E(sys) + '</b>'; }
  // عام / ماہرانہ — public mode hides the expert corner and the reasoning lines
  ZUI.setExpert = function(on, silent){
    document.body.classList.toggle('mode-expert', !!on);
    try { localStorage.setItem('zaicha.expert', on ? '1' : '0'); } catch (e) {}
    var b = document.getElementById('zp-mode'); if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    modeLabels();
    if (ZUI.renderMenu) ZUI.renderMenu();
    if (on && typeof activeTabId !== 'undefined' && activeTabId === 'expert' && typeof v2FireOpenSections === 'function') setTimeout(function(){ v2FireOpenSections('expert'); }, 40);
    if (silent) return;
    if (ZUI.toast) ZUI.toast(on ? T('modeExpertOn') : T('modePublicOn'));
  };
  function modeLabels(){ var b = document.getElementById('zp-mode'); if (!b) return; b.querySelector('.zp-mode-a').textContent = T('modePublic'); b.querySelector('.zp-mode-b').textContent = T('modeExpert'); b.title = T('modeHint'); }
  ZUI.initNav = function(){
    var ex = false; try { ex = localStorage.getItem('zaicha.expert') === '1'; } catch (e) {}
    simplifyForm(); renderPeopleUI(); ZUI.setExpert(ex, true);   // v0.2: the #zp-bar nav is replaced by the top bar + menu
    var ay = document.getElementById('in-ayanamsa'); if (ay) ay.addEventListener('change', advLabel);
  };
  ZUI.navLang = function(){ renderPeopleUI(); advLabel(); modeLabels(); };
  ZUI.renderPeople = renderPeopleUI;
  ZUI._people = { load: peopleLoad, remove: function(i){ removePerson(i); }, line: personLine };

  /* ------------------------------------------------------------------
     v0.2 (2026-10-01) — top bar, sheets (menu / Tehzeeb-ul-Ilm / Index /
     PDF / Profile / Subscription), summary buttons, Escape + outside tap
     ------------------------------------------------------------------ */
  var OPEN_SHEET = null, SHEET_FOCUS = null;
  function sheetEl(id){ return document.getElementById('sheet-' + id); }
  function inApp(){ return document.body.classList.contains('app-mode'); }
  function hasChart(){ return !!window.lastZaichaData; }   // a chart exists even while its form is open for editing
  ZUI.openSheet = function(id){
    var el = sheetEl(id); if (!el) return;
    if (OPEN_SHEET && OPEN_SHEET !== id) ZUI.closeSheets(true);
    if (!OPEN_SHEET) SHEET_FOCUS = document.activeElement;
    if (id === 'learn') ZUI.renderLearn();
    if (id === 'index') ZUI.renderIndex();
    if (id === 'menu') ZUI.renderMenu();
    if (id === 'subscribe' && typeof renderSubscribeScreen === 'function') renderSubscribeScreen();
    if (id === 'profile' && typeof updateProfileAccountUI === 'function') updateProfileAccountUI();
    el.hidden = false;
    OPEN_SHEET = id;
    document.body.classList.add('sheet-open');
    var body = el.querySelector('.v2-sheet-body'); if (body) body.scrollTop = 0;
    var x = el.querySelector('.v2-x'); if (x) setTimeout(function(){ try { x.focus({ preventScroll: true }); } catch (e) { x.focus(); } }, 30);
  };
  ZUI.closeSheets = function(keepFocus){
    document.querySelectorAll('.v2-sheet').forEach(function(s){ s.hidden = true; });
    document.body.classList.remove('sheet-open');
    OPEN_SHEET = null;
    if (!keepFocus && SHEET_FOCUS && SHEET_FOCUS.focus && document.contains(SHEET_FOCUS)) { try { SHEET_FOCUS.focus({ preventScroll: true }); } catch (e) {} }
    if (!keepFocus) SHEET_FOCUS = null;
  };

  function engineLine(){
    var b = document.getElementById('status-badge');
    var t = b && b.textContent ? b.textContent.trim() : '';
    var v = document.getElementById('v2-version');
    return (t ? E(T('menuEngine')) + ': ' + E(t) + ' · ' : '') + E(v ? v.textContent.trim() : '');
  }
  ZUI.renderMenu = function(){
    var box = document.getElementById('v2-menu-body'); if (!box) return;
    var PPL = ZUI._people, list = PPL ? PPL.load() : [], app = hasChart(), ex = document.body.classList.contains('mode-expert');
    var h = '<section class="v2-menu-sec"><h3 class="v2-menu-h">' + E(T('peopleRecent')) + '</h3>' +
      '<button type="button" class="zp-new" data-act="new">＋ ' + E(T('peopleNew')) + '</button>';
    list.forEach(function(p, i){ h += '<div class="zp-row"><button type="button" class="zp-open" data-i="' + i + '">' + PPL.line(p) + '</button><button type="button" class="zp-del" data-del="' + i + '" aria-label="' + E(T('peopleRemove')) + '" title="' + E(T('peopleRemove')) + '">×</button></div>'; });
    h += '</section>';
    if (app) {
      h += '<section class="v2-menu-sec">' +
        '<button type="button" class="v2-menu-item" data-act="close">' + E(T('menuClose')) + '</button>' +
        '<div class="v2-menu-mode"><span class="v2-menu-label">' + E(T('menuMode')) + '</span>' +
        '<div class="v2-seg" role="radiogroup" aria-label="' + E(T('menuMode')) + '">' +
        '<button type="button" role="radio" aria-checked="' + (!ex) + '" data-act="simple">' + E(T('modePublic')) + '</button>' +
        '<button type="button" role="radio" aria-checked="' + ex + '" data-act="expert">' + E(T('modeExpert')) + '</button></div></div>' +
        '<p class="v2-menu-hint">' + E(T('modeHint')) + '</p>' +
        '<button type="button" class="v2-menu-item" data-act="pdf">' + E(T('tabPdfReport')) + '</button>' +
        '</section>';
    }
    h += '<section class="v2-menu-sec">' +
      '<button type="button" class="v2-menu-item" data-act="profile">' + E(T('profileH3')) + '</button>' +
      '<button type="button" class="v2-menu-item" data-act="subscribe">' + E(T('subscribeH3')) + '</button>' +
      (ZUI.lockOn ? '<button type="button" class="v2-menu-item v2-menu-lock" data-act="lock">' + E(T('menuLock')) + '</button>' : '') +
      '</section><p class="v2-menu-small">' + engineLine() + '</p>';
    box.innerHTML = h;
  };
  function wireMenu(){
    var box = document.getElementById('v2-menu-body'); if (!box || box._w) return; box._w = 1;
    box.addEventListener('click', function(e){
      var d = e.target.closest('[data-del]'); if (d) { ZUI._people.remove(+d.getAttribute('data-del')); return; }
      var o = e.target.closest('.zp-open'); if (o) { ZUI.openPerson(ZUI._people.load()[+o.getAttribute('data-i')]); return; }
      var a = e.target.closest('[data-act]'); if (!a) return;
      var act = a.getAttribute('data-act');
      if (act === 'new') ZUI.newZaicha();
      else if (act === 'close') ZUI.closeApp();
      else if (act === 'simple' || act === 'expert') ZUI.setExpert(act === 'expert');
      else if (act === 'pdf' || act === 'profile' || act === 'subscribe') ZUI.openSheet(act);
      else if (act === 'lock') {   // v0.2 pass 2.2: clear the unlock cookie on the server, then show the lock page
        a.disabled = true;
        fetch('/api/lock', { method: 'POST', credentials: 'same-origin' }).catch(function(){}).then(function(){ location.replace('/'); });
      }
    });
  }

  function goHome(){
    ZUI.closeSheets();
    if (!inApp() && hasChart() && typeof v2ResumeApp === 'function') { v2ResumeApp(); return; }
    if (inApp()) {
      var sm = document.getElementById('v2-summary'), tb = document.getElementById('v2-topbar');
      var top = sm ? sm.getBoundingClientRect().top + window.pageYOffset - (tb ? tb.offsetHeight : 0) - 8 : 0;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else if (typeof showEntryForm === 'function') showEntryForm({});
  }
  function setTopVar(){
    var tb = document.getElementById('v2-topbar');
    if (tb) document.documentElement.style.setProperty('--v2-top', tb.offsetHeight + 'px');
  }
  ZUI.v2Lang = function(){
    var code = document.getElementById('lang-code'); if (code) code.textContent = lang().toUpperCase();
    [['v2-tb-home', 'navHome'], ['v2-tb-learn', 'learnH3'], ['v2-tb-index', 'indexH3'], ['v2-tb-menu', 'tbMenu']].forEach(function(x){
      var b = document.getElementById(x[0]); if (b) { b.setAttribute('aria-label', T(x[1])); b.title = T(x[1]); }
    });
    var brand = document.getElementById('v2-brand'); if (brand) brand.setAttribute('aria-label', T('navHome'));
    document.querySelectorAll('.v2-x').forEach(function(x){ x.setAttribute('aria-label', T('loadClose')); x.title = T('loadClose'); });
    var lp = document.getElementById('lang-picker-btn'); if (lp) lp.setAttribute('aria-label', T('langPickerAria'));
    if (OPEN_SHEET === 'menu') ZUI.renderMenu();
    setTimeout(setTopVar, 0);
  };
  /* ------------------------------------------------------------------
     v0.2 PASS 2.1 — section icons, emoji -> line icons, motion,
     long-text "Read more", chart planet pills, sliding tab pill
     ------------------------------------------------------------------ */
  var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var SEC_ICON = { today: ['sun', '#C3B4FF'], weekly: ['calendar', '#6EC8FF'], monthly: ['phase', '#8EC5FF'], yearly: ['star', '#F5B942'],
    dasha: ['clock', '#B8A9FF'], transits: ['orbit', '#6EC8FF'], sudarshan: ['wheel', '#FFA25F'], moonphases: ['moon', '#C3B4FF'], cosmos3d: ['planet', '#8EC5FF'],
    positions: ['table', '#8EC5FF'], planets: ['planet', '#FFA25F'], houses: ['home', '#6EC8FF'], aspects: ['eye', '#FF7EB6'], yogas: ['sparkle', '#F5B942'], divisional: ['layers', '#7BD389'], reading: ['book', '#C3B4FF'],
    remedies: ['shield', '#4FD1A5'], milan: ['rings', '#FF7EB6'], prasna: ['question', '#6EC8FF'], panchang: ['calendar', '#F5B942'],
    charadasha: ['clock', '#B8A9FF'], yoginidasha: ['clock', '#B8A9FF'], ashtottari: ['clock', '#B8A9FF'],
    grahabala: ['bars', '#4FD1A5'], bhavabala: ['bars', '#4FD1A5'], vimshopak: ['bars', '#4FD1A5'], ashtakavarga: ['table', '#4FD1A5'],
    jaimini: ['crown', '#F5B942'], charakaraka: ['crown', '#F5B942'], kp: ['compass', '#6EC8FF'], nadi: ['link', '#FFA25F'],
    lalkitab: ['book', '#FF8A5B'], unani: ['star', '#7BD389'], western: ['globe', '#8EC5FF'], arabianparts: ['sparkle', '#FF7EB6'] };
  function icon(n){ return (typeof v2Icon === 'function') ? v2Icon(n) : ''; }
  function decorateSections(){
    document.querySelectorAll('details.v2-sec').forEach(function(sec){
      var h = sec.querySelector('.v2-sec-head'); if (!h || h.querySelector('.v2-sec-ic')) return;
      var m = SEC_ICON[sec.getAttribute('data-sec')] || ['star', '#B8A9FF'];
      var sp = document.createElement('span'); sp.className = 'v2-sec-ic'; sp.setAttribute('aria-hidden', 'true');
      sp.style.setProperty('--ic', m[1]); sp.innerHTML = icon(m[0]); h.insertBefore(sp, h.firstChild);
    });
  }
  // emoji in the UI -> the same line-icon set
  var EMOJI_ICON = { '⚠️': 'alert', '⚠': 'alert', '🌐': 'globe', '🔮': 'sparkle', '⏳': 'hourglass', '⭐': 'star', '📍': 'pin', '🌙': 'moon', '🔒': 'lock',
    '💼': 'briefcase', '💰': 'coins', '🌿': 'leaf', '❤️': 'heart', '❤': 'heart', '🏠': 'home', '🗓️': 'calendar', '🗓': 'calendar', '📅': 'calendar',
    '🌗': 'phase', '🌑': 'moonNew', '🌕': 'moonFull', '🪐': 'planet', '🔭': 'telescope', '✨': 'sparkle', '💠': 'diamond', '📜': 'scroll', '🟡': 'dot',
    '🧭': 'compass', '🔬': 'target', '⚖️': 'scale', '⚖': 'scale', '🔺': 'triangle', '🧿': 'shield', '💞': 'heart', '❓': 'question', '🌀': 'orbit',
    '🏛️': 'columns', '🏛': 'columns', '🔟': 'bars', '📊': 'bars', '🪞': 'mirror', '💍': 'rings', '📋': 'list', '🎯': 'target', '🔑': 'key',
    '🌊': 'wave', '🔗': 'link', '📕': 'book', '🍀': 'leaf', '🖨️': 'printer', '🖨': 'printer', '👑': 'crown', '🧩': 'layers', '👤': 'user',
    '☀️': 'sun', '⚙️': 'gear', '⚙': 'gear', '🧘': 'user', '💡': 'sparkle', '📖': 'book' };
  var EMOJI_RE = new RegExp(Object.keys(EMOJI_ICON).sort(function(a, b){ return b.length - a.length; }).map(function(k){ return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'g');
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, SELECT: 1, TITLE: 1 };
  function iconize(root){
    if (!root || !root.nodeType) return;
    if (root.nodeType === 3) root = root.parentNode;
    if (!root || root.nodeType !== 1) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, todo = [];
    while ((n = w.nextNode())) {
      var par = n.parentNode;
      if (!par || SKIP[par.nodeName] || par.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue;
      if (par.closest && par.closest('.kitaba, .ayah-card, #pdf-print-sheet, .lk3d, [contenteditable]')) continue;
      EMOJI_RE.lastIndex = 0; if (EMOJI_RE.test(n.nodeValue)) todo.push(n);
    }
    todo.forEach(function(t){
      var frag = document.createDocumentFragment(), s = t.nodeValue, last = 0, m; EMOJI_RE.lastIndex = 0;
      while ((m = EMOJI_RE.exec(s))) {
        if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
        var sp = document.createElement('span'); sp.className = 'v2-ic v2-ic-' + EMOJI_ICON[m[0]]; sp.innerHTML = icon(EMOJI_ICON[m[0]]); frag.appendChild(sp);
        last = m.index + m[0].length;
      }
      if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      if (t.parentNode) t.parentNode.replaceChild(frag, t);
    });
  }
  // bars grow from 0 when they come into view
  var barIO = (!RM && 'IntersectionObserver' in window) ? new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('v2-in'); barIO.unobserve(e.target); } });
  }, { threshold: 0.15 }) : null;
  function growBars(root){
    if (!barIO || !root || !root.querySelectorAll) return;
    root.querySelectorAll('.bala-bar-fill:not(.v2-grow), .deg-bar-fill:not(.v2-grow), .pbar i:not(.v2-grow), .v2-prog i:not(.v2-grow)').forEach(function(b){ b.classList.add('v2-grow'); barIO.observe(b); });
  }
  // chart planets as small coloured pills (D1, D9, D2, transit, Lal Kitab, Western)
  function pillChips(){
    document.querySelectorAll('.chart-wrap svg g[id$="planet-chips"]').forEach(function(g){
      if (!g.firstChild || g.querySelector('rect.v2-chip-bg')) return;
      var texts = [].slice.call(g.querySelectorAll('text')); if (!texts.length) return;
      var b0; try { b0 = texts[0].getBBox(); } catch (e) { return; }
      if (!b0 || !b0.width) return;                                   // hidden: try again when it is shown
      texts.forEach(function(t){
        var b; try { b = t.getBBox(); } catch (e) { return; }
        var r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('class', 'v2-chip-bg');
        r.setAttribute('x', (b.x - 3).toFixed(1)); r.setAttribute('y', (b.y - 0.5).toFixed(1));
        r.setAttribute('width', (b.width + 6).toFixed(1)); r.setAttribute('height', (b.height + 1).toFixed(1));
        r.setAttribute('rx', ((b.height + 1) / 2).toFixed(1));
        var col = t.style.fill || t.getAttribute('fill') || '#fff'; r.style.fill = col; r.style.stroke = col;
        g.insertBefore(r, t);
      });
      g.classList.add('v2-pilled');
    });
  }
  // long texts: 3 lines + "Read more"
  var CLAMP_SKIP = '#daily-routine-list, table, .teaser-blurred-inner, .lesson, .v2-lessons, .keypoints, .disputes, .v2-sum-today, .field, .zp-adv, #pdf-print-sheet, .modal-overlay, .v2-sheet';
  function clampLong(root){
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.v2-sec-body p:not([data-v2c])').forEach(function(p){
      if (!p.offsetParent) return;                                    // measure only when visible
      p.setAttribute('data-v2c', '1');
      if (p.closest(CLAMP_SKIP) || (p.textContent || '').trim().length < 200) return;
      p.classList.add('v2-clamp3');
      if (p.scrollHeight <= p.clientHeight + 2) { p.classList.remove('v2-clamp3'); return; }
      var b = document.createElement('button'); b.type = 'button'; b.className = 'v2-more v2-more-long'; b.textContent = T('readMore'); b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function(){ var closed = p.classList.toggle('v2-clamp3'); b.textContent = T(closed ? 'readMore' : 'readLess'); b.setAttribute('aria-expanded', String(!closed)); });
      p.parentNode.insertBefore(b, p.nextSibling);
    });
  }
  // sliding active-tab pill
  function moveInd(){
    var nav = document.getElementById('v2-tabbar'); if (!nav) return;
    var ind = nav.querySelector('.v2-tab-ind');
    if (!ind) { ind = document.createElement('span'); ind.className = 'v2-tab-ind'; ind.setAttribute('aria-hidden', 'true'); nav.insertBefore(ind, nav.firstChild); }
    var a = nav.querySelector('.v2-tab.active');
    if (!a || !a.offsetWidth) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    ind.style.width = a.offsetWidth + 'px'; ind.style.height = a.offsetHeight + 'px';
    ind.style.transform = 'translate(' + a.offsetLeft + 'px,' + a.offsetTop + 'px)';
    if (!nav.classList.contains('v2-ind-ready')) requestAnimationFrame(function(){ nav.classList.add('v2-ind-ready'); });
  }
  ZUI.moveInd = moveInd;
  var passTimer = null, passRoots = [];
  function runPass(){
    passTimer = null; var roots = passRoots; passRoots = [];
    if (mo) mo.disconnect();
    try {
      decorateSections();
      roots.forEach(function(r){ iconize(r); growBars(r.nodeType === 1 ? r : r.parentNode); });
      pillChips();
      clampLong(document.querySelector('.v2-panels'));
    } catch (e) { console.error('v2 pass', e); }
    if (mo) mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function queuePass(root){ passRoots.push(root || document.body); if (!passTimer) passTimer = setTimeout(runPass, 40); }
  var mo = ('MutationObserver' in window) ? new MutationObserver(function(recs){
    recs.forEach(function(r){ queuePass(r.target); });
  }) : null;
  ZUI.initPass21 = function(){
    queuePass(document.body);
    // tab change: pill, entrance animation, measure what just became visible
    var prevOnTab = ZUI.onTab;
    ZUI.onTab = function(tabId){
      if (prevOnTab) prevOnTab(tabId);
      moveInd();
      var pn = document.getElementById('panel-' + tabId);
      if (pn && !RM) { pn.classList.remove('v2-enter'); void pn.offsetWidth; pn.classList.add('v2-enter'); setTimeout(function(){ pn.classList.remove('v2-enter'); }, 700); }
      queuePass(pn || document.body);
    };
    document.addEventListener('toggle', function(e){ if (e.target && e.target.matches && e.target.matches('details.v2-sec')) queuePass(e.target); }, true);
    window.addEventListener('resize', function(){ moveInd(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);
    var nav = document.getElementById('v2-tabbar');
    if (nav && 'MutationObserver' in window) new MutationObserver(function(){ if (!nav.querySelector('.v2-tab-ind')) moveInd(); }).observe(nav, { childList: true });
    // topic chips -> that card in "Today in detail"
    var trow = document.getElementById('v2-topic-row');
    if (trow) trow.addEventListener('click', function(e){
      var c = e.target.closest('.v2-topic'); if (!c || typeof activateTab !== 'function') return;
      activateTab('predictions', false); v2OpenSection('today', false);
      setTimeout(function(){
        var card = document.querySelector('#daily-routine-list [data-topic="' + c.getAttribute('data-topic') + '"]'); if (!card) return;
        card.classList.add('is-open');
        card.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center', inline: 'center' });
        card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
      }, 120);
    });
    // daily-routine cards: tap to expand (phones show one line per topic)
    var drl = document.getElementById('daily-routine-list');
    if (drl) drl.addEventListener('click', function(e){ var c = e.target.closest('.v2-topic-card'); if (c) c.classList.toggle('is-open'); });
    // header: parallax hills
    if (!RM) {
      var sky = document.querySelector('.v2-sky'), ticking = false;
      window.addEventListener('scroll', function(){
        if (ticking || !sky) return; ticking = true;
        requestAnimationFrame(function(){ ticking = false; sky.style.setProperty('--py', Math.min(240, window.pageYOffset || 0)); });
      }, { passive: true });
    }
  };
  ZUI.pass21Lang = function(){
    document.querySelectorAll('.v2-more-long').forEach(function(b){ b.textContent = T(b.getAttribute('aria-expanded') === 'true' ? 'readLess' : 'readMore'); });
    setTimeout(moveInd, 30);
  };

  /* ------------------------------------------------------------------
     v0.2 PASS 2.2 / 2.3 — 3D everywhere it was asked for, reusing the
     existing pages: /orrery.html for the chart, /cosmos.html for the sky.
     ------------------------------------------------------------------ */
  function hasWebGL(){ try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  function reduceMotion(){ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function slowNet(){ var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection; return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))); }
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
  function zHash(data){
    var z = data && ZUI.toOrreryZaicha ? ZUI.toOrreryZaicha(data) : null; if (!z) return '';
    try { return '#zaicha=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(z))))); } catch (e) { return ''; }
  }

  /* ---- A. summary chart: 2D chart | 3D sky ---- */
  var SKY3D = { frame: null, ready: false, timer: null, hash: '' };
  function sky3dBox(){ return document.getElementById('v2-sky3d'); }
  function sky3dFail(){
    if (SKY3D.frame) { SKY3D.frame.remove(); SKY3D.frame = null; }
    SKY3D.ready = false; clearTimeout(SKY3D.timer);
    var b = sky3dBox(); if (b) b.classList.remove('is-ready');
    ZUI.setChartMode('2d', true, true);
    ZUI.toast(T('sky3dFail'));
  }
  function sky3dLoad(){
    var b = sky3dBox(); if (!b || SKY3D.frame) return;
    if (!hasWebGL()) { sky3dFail(); return; }
    var data = window.lastZaichaData; SKY3D.hash = zHash(data);
    var f = document.createElement('iframe'); f.className = 'v2-sky3d-frame'; f.title = T('sky3d'); f.setAttribute('allow', 'fullscreen'); f.loading = 'lazy';
    f.src = '/orrery.html?embed=1&mini=0' + SKY3D.hash;          // same #zaicha= hand-off as the Lal Kitab "open" link
    b.appendChild(f); SKY3D.frame = f;
    SKY3D.timer = setTimeout(function(){ if (!SKY3D.ready) sky3dFail(); }, 20000);
  }
  function sky3dUpdate(){               // a new chart while 3D is loaded: same hash, page updates itself
    if (!SKY3D.frame) return;
    var h = zHash(window.lastZaichaData); if (!h || h === SKY3D.hash) return;
    SKY3D.hash = h;
    try { SKY3D.frame.contentWindow.location.replace('/orrery.html?embed=1&mini=0' + h); } catch (e) { SKY3D.frame.src = '/orrery.html?embed=1&mini=0' + h; }
  }
  window.addEventListener('message', function(e){
    if (!SKY3D.frame || e.source !== SKY3D.frame.contentWindow || e.origin !== location.origin) return;
    var m = e.data || {};
    if (m.type === 'orrery:ready') { SKY3D.ready = true; clearTimeout(SKY3D.timer); var b = sky3dBox(); if (b) b.classList.add('is-ready'); }
  });
  ZUI.setChartMode = function(mode, save, quiet){
    mode = mode === '3d' ? '3d' : '2d';
    if (mode === '3d' && !hasWebGL()) { if (!quiet) ZUI.toast(T('sky3dFail')); mode = '2d'; save = true; }   // no WebGL: stay on 2D
    var seg = document.getElementById('v2-seg3d'), box = sky3dBox(), wrap = document.querySelector('#phone-chart .chart-wrap'), full = document.getElementById('v2-full3d');
    if (!seg || !box || !wrap) return;
    seg.querySelectorAll('[data-mode]').forEach(function(b){ b.setAttribute('aria-checked', String(b.getAttribute('data-mode') === mode)); });
    var pc = document.getElementById('phone-chart'); if (pc) pc.classList.toggle('is-3d', mode === '3d');
    box.hidden = mode !== '3d'; if (full) full.hidden = mode !== '3d';
    ZUI.chartMode = mode;
    if (save !== false) lsSet('zaicha.chartMode', mode);
    if (mode === '3d') { sky3dLoad(); sky3dUpdate(); }
  };
  ZUI.sky3dRefresh = function(){            // called after each new chart
    var want = lsGet('zaicha.chartMode') === '3d' ? '3d' : '2d';
    ZUI.setChartMode(want, false);
    sky3dUpdate();
  };
  function wireChartSwitch(){
    var seg = document.getElementById('v2-seg3d'); if (!seg || seg._w) return; seg._w = 1;
    seg.addEventListener('click', function(e){ var b = e.target.closest('[data-mode]'); if (b) ZUI.setChartMode(b.getAttribute('data-mode'), true); });
    seg.addEventListener('keydown', function(e){ if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); ZUI.setChartMode(ZUI.chartMode === '3d' ? '2d' : '3d', true); var on = seg.querySelector('[aria-checked="true"]'); if (on) on.focus(); });
    var full = document.getElementById('v2-full3d');
    if (full) full.addEventListener('click', function(){ window.open('/orrery.html' + zHash(window.lastZaichaData), '_blank', 'noopener'); });
  }

  /* ---- B. آیاتِ آسمان inside the Periods tab (lazy, when the section opens) ---- */
  var C3D = { frame: null, lang: null };
  ZUI.cosmos3dMount = function(){
    var st = document.getElementById('cosmos3d-stage'); if (!st || !st.offsetParent) return;
    if (C3D.frame) { if (C3D.lang !== lang()) { C3D.lang = lang(); C3D.frame.src = '/cosmos.html?lang=' + encodeURIComponent(C3D.lang); st.classList.remove('is-ready'); } return; }
    if (!hasWebGL()) { st.classList.add('is-failed'); st.setAttribute('data-msg', T('cosmosFail')); return; }
    var f = document.createElement('iframe'); f.className = 'v2-3d-frame'; f.title = T('cosmosTitle'); f.setAttribute('allow', 'fullscreen'); f.allowFullscreen = true;
    C3D.lang = lang(); f.src = '/cosmos.html?lang=' + encodeURIComponent(C3D.lang); st.appendChild(f); C3D.frame = f;
  };

  /* ---- 2.3 opening screen: full-screen sky (poster first), "Create your Zaicha" card ---- */
  var HERO = { frame: null, ready: false, timer: null, lang: null, failed: false };
  function heroEl(id){ return document.getElementById(id); }
  function heroFallback(){            // poster stays, with a slow CSS twinkle — never an empty black box
    HERO.failed = true; clearTimeout(HERO.timer);
    if (HERO.frame) { HERO.frame.remove(); HERO.frame = null; }
    var sky = heroEl('v2-hero-sky'); if (sky) { sky.classList.remove('is-live'); sky.classList.add('is-still'); }
  }
  function heroLoad(){
    var sky = heroEl('v2-hero-sky'); if (!sky || HERO.frame) return;
    if (!hasWebGL()) { heroFallback(); return; }
    HERO.failed = false;
    var f = document.createElement('iframe'); f.className = 'v2-hero-frame'; f.title = T('cosmosTitle'); f.setAttribute('loading', 'eager'); f.setAttribute('tabindex', '-1');
    HERO.lang = lang(); f.src = '/cosmos.html?hero=1&lang=' + encodeURIComponent(HERO.lang);
    sky.appendChild(f); HERO.frame = f; HERO.ready = false;
    HERO.timer = setTimeout(function(){ if (!HERO.ready) heroFallback(); }, 8000);
  }
  window.addEventListener('message', function(e){
    if (e.origin !== location.origin) return;
    var m = e.data || {};
    if (HERO.frame && e.source === HERO.frame.contentWindow) {
      if (m.type === 'cosmos:ready') { HERO.ready = true; clearTimeout(HERO.timer); var sky = heroEl('v2-hero-sky'); if (sky) { sky.classList.add('is-live'); sky.classList.remove('is-still'); } }
      if (m.type === 'cosmos:error') heroFallback();
    }
    if (C3D.frame && e.source === C3D.frame.contentWindow) {
      var st = document.getElementById('cosmos3d-stage');
      if (m.type === 'cosmos:ready' && st) st.classList.add('is-ready');
      if (m.type === 'cosmos:error' && st) { st.classList.add('is-failed'); st.setAttribute('data-msg', T('cosmosFail')); C3D.frame.remove(); C3D.frame = null; }
    }
  });
  function toForm(){
    var entry = document.getElementById('phone-entry'), gate = document.getElementById('screen-welcome');
    var target = (entry && entry.offsetParent) ? entry : (gate && gate.offsetParent ? gate : entry);
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    var n = document.getElementById('in-name');
    if (n && target === entry) setTimeout(function(){ try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }, reduceMotion() ? 0 : 450);
  }
  ZUI.renderHeroCard = function(){
    var people = (ZUI._people ? ZUI._people.load() : []).slice(0, 3);
    var t = heroEl('v2-hero-t'), line = heroEl('v2-hero-line'), box = heroEl('v2-hero-people'), go = heroEl('v2-hero-go');
    if (!t || !box || !go) return;
    var back = people.length > 0;
    heroEl('v2-hero-card').classList.toggle('is-back', back);
    t.textContent = T(back ? 'heroWelcome' : 'heroTitle');
    line.textContent = T(back ? 'heroWelcomeLine' : 'heroLine');
    go.textContent = T(back ? 'heroNew' : 'heroBtn');
    box.hidden = !back;
    box.innerHTML = people.map(function(p, i){
      var nm = p.name || '—', ini = String(nm).trim().charAt(0) || '✦';
      var asc = (typeof p.asc === 'number' && typeof SNfull === 'function') ? E(SNfull(p.asc)) : '<span class="ltr">' + E(p.dob) + '</span>';
      return '<button type="button" class="v2-hero-person" data-i="' + i + '" style="--_h:' + ((i * 47) % 360) + '"><span class="zp-av" aria-hidden="true">' + E(ini) + '</span><span><b>' + E(nm) + '</b><small>' + asc + '</small></span></button>';
    }).join('');
  };
  ZUI.initHero = function(){
    var hero = heroEl('v2-hero'); if (!hero || hero._w) return; hero._w = 1;
    ZUI.renderHeroCard();
    heroEl('v2-hero-go').addEventListener('click', toForm);
    heroEl('v2-hero-learn').addEventListener('click', function(){ ZUI.openSheet('learn'); });
    heroEl('v2-hero-scroll').addEventListener('click', toForm);
    heroEl('v2-hero-people').addEventListener('click', function(e){ var b = e.target.closest('.v2-hero-person'); if (b) ZUI.openPerson(ZUI._people.load()[+b.getAttribute('data-i')]); });
    // the card: about 1.5 s after opening (at once with reduced motion); built without waiting for 3D
    var card = heroEl('v2-hero-card');
    setTimeout(function(){ card.classList.add('is-in'); }, reduceMotion() ? 0 : 1500);
    // the sky: poster now; 3D behind it unless reduced motion / slow connection
    var sky = heroEl('v2-hero-sky');
    if (reduceMotion()) { sky.classList.add('is-poster-only'); return; }
    if (slowNet()) {
      sky.classList.add('is-still');
      var mv = heroEl('v2-hero-move'); mv.hidden = false;
      mv.addEventListener('click', function(){ mv.hidden = true; heroLoad(); });
      return;
    }
    var start = function(){ heroLoad(); };
    if (document.readyState === 'complete') setTimeout(start, 50); else window.addEventListener('load', function(){ setTimeout(start, 50); });
    // pause the 3D when the hero is off screen
    if ('IntersectionObserver' in window) new IntersectionObserver(function(en){
      en.forEach(function(x){ if (HERO.frame && HERO.frame.contentWindow) HERO.frame.contentWindow.postMessage({ type: 'cosmos:visible', visible: x.isIntersecting }, location.origin); });
    }).observe(hero);
  };
  ZUI.heroLang = function(){
    ZUI.renderHeroCard();
    if (HERO.frame && HERO.lang !== lang()) { HERO.lang = lang(); HERO.frame.src = '/cosmos.html?hero=1&lang=' + encodeURIComponent(HERO.lang); }
    var sc = heroEl('v2-hero-scroll'); if (sc) sc.setAttribute('aria-label', T('heroScroll'));
    var seg = document.getElementById('v2-seg3d'); if (seg) seg.setAttribute('aria-label', T('chartModeAria'));
    if (C3D.frame) ZUI.cosmos3dMount();
  };
  ZUI.initPass22 = function(){ wireChartSwitch(); ZUI.initHero(); ZUI.heroLang(); };

  /* v0.2 pass 2: "Recommended lessons" rows (Tehzeeb-ul-Ilm area + end of Remedies) — 3 lessons from learn-content.js */
  var LESSON_ART = [
    ['#9A90EC', '#4A4FD0', '<circle cx="60" cy="40" r="15" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2"/><circle cx="60" cy="40" r="27" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/><circle cx="87" cy="40" r="4" fill="#F2C14E"/>'],
    ['#B8A9FF', '#2A30B8', '<path d="M66 22a18 18 0 1 0 14 30a15 15 0 1 1-14-30z" fill="#FFF6DD"/><circle cx="34" cy="26" r="1.6" fill="#fff"/><circle cx="92" cy="58" r="1.3" fill="#fff"/><circle cx="24" cy="56" r="1.1" fill="#fff"/>'],
    ['#7F86F0', '#171C8E', '<path d="M0 64C30 48 52 50 72 58S104 66 120 56V80H0Z" fill="#2A30B8"/><g fill="#fff"><circle cx="30" cy="22" r="1.6"/><circle cx="58" cy="14" r="1.2"/><circle cx="86" cy="28" r="1.8"/><circle cx="102" cy="16" r="1.1"/></g>']
  ];
  function findLesson(id){
    var book = window.ZAICHA_LEARN, out = null;
    (book && book.levels || []).forEach(function(lv){ (lv.chapters || []).forEach(function(ch){ (ch.lessons || []).forEach(function(ls){ if (ls.id === id) out = { level: lv.id, ls: ls }; }); }); });
    return out;
  }
  ZUI.renderLessons = function(){
    document.querySelectorAll('.v2-lessons[data-lessons]').forEach(function(box){
      var row = box.querySelector('.v2-lessons-row'); if (!row) return;
      var ids = box.getAttribute('data-lessons').split(',');
      row.innerHTML = ids.map(function(id, i){
        var f = findLesson(id); if (!f || f.ls.comingSoon) return '';
        var art = LESSON_ART[i % LESSON_ART.length];
        return '<button type="button" class="v2-lesson" data-lesson="' + E(id) + '">' +
          '<span class="v2-lesson-art" aria-hidden="true"><svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="lg-' + E(box.id) + '-' + i + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + art[0] + '"/><stop offset="1" stop-color="' + art[1] + '"/></linearGradient></defs><rect width="120" height="80" fill="url(#lg-' + E(box.id) + '-' + i + ')"/>' + art[2] + '</svg></span>' +
          '<span class="v2-lesson-t">' + E(L(f.ls.title)) + '</span>' +
          (f.ls.minutes ? '<span class="v2-pill">' + E(T('lessonPill', { n: f.ls.minutes })) + '</span>' : '') +
          '</button>';
      }).join('');
      if (!row._v2wired) {
        row._v2wired = true;
        row.addEventListener('click', function(e){
          var b = e.target.closest('.v2-lesson'); if (!b) return;
          var f = findLesson(b.getAttribute('data-lesson')); if (!f) return;
          ZUI.learn.level = f.level; ZUI.learn.lesson = f.ls.id;
          ZUI.renderLearn(); ZUI.openSheet('learn');
        });
      }
    });
  };

  ZUI.initV2 = function(){
    function on(id, fn){ var el = document.getElementById(id); if (el) el.addEventListener('click', fn); }
    on('v2-tb-home', goHome);
    on('v2-tb-learn', function(){ ZUI.openSheet('learn'); });
    on('v2-tb-index', function(){ ZUI.openSheet('index'); });
    on('v2-tb-menu', function(){ ZUI.openSheet('menu'); });
    on('v2-learn-card', function(){ ZUI.openSheet('learn'); });
    on('v2-edit-btn', function(){ if (typeof showEntryForm === 'function') showEntryForm({ focus: true }); });
    on('v2-pdf-btn', function(){ ZUI.openSheet('pdf'); });
    on('v2-mood', function(){ if (typeof activateTab === 'function') { activateTab('predictions', false); v2OpenSection('today', true); } });
    var wk = document.getElementById('v2-week-days');
    if (wk) wk.addEventListener('click', function(e){ var b = e.target.closest('.v2-day[data-i]'); if (b && typeof v2OpenDay === 'function') v2OpenDay(+b.getAttribute('data-i')); });
    // top bar: transparent at the top of the page, solid once the page is scrolled
    var onScroll = function(){ document.body.classList.toggle('v2-scrolled', (window.pageYOffset || 0) > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    ZUI.renderLessons();
    ZUI.initPass21();
    ZUI.initPass22();
    // app lock: show "Lock app" in the menu only when the server lock is on
    fetch('/api/lock/status', { credentials: 'same-origin', cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(j){ ZUI.lockOn = !!(j && j.enabled); if (ZUI.renderMenu) ZUI.renderMenu(); }).catch(function(){});
    on('v2-expert-on', function(){ ZUI.setExpert(true); });
    var brand = document.getElementById('v2-brand');
    if (brand) { brand.addEventListener('click', goHome); brand.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHome(); } }); }
    // sheets: ✕ and outside tap
    document.querySelectorAll('.v2-sheet').forEach(function(sh){
      sh.addEventListener('click', function(e){ if (e.target === sh || e.target.closest('[data-close]')) ZUI.closeSheets(); });
    });
    // upgrade popup: ✕ and outside tap (Escape below)
    var um = document.getElementById('upgrade-modal');
    if (um) um.addEventListener('click', function(e){ if (e.target === um || e.target.closest('#upgrade-modal-x')) um.hidden = true; });
    wireMenu();
    // Escape closes the top-most layer: planet menu → upgrade popup → loader error → sheet → language list
    document.addEventListener('keydown', function(e){
      if (e.key !== 'Escape') return;
      var pm = document.getElementById('planet-menu-modal'); if (pm && !pm.hidden) { pm.hidden = true; return; }
      if (um && !um.hidden) { um.hidden = true; return; }
      var ld = document.getElementById('v2-loader'); if (ld && !ld.hidden && ld.classList.contains('is-error')) { ld.hidden = true; return; }
      if (OPEN_SHEET) { ZUI.closeSheets(); return; }
      var lm = document.getElementById('lang-menu'); if (lm) lm.classList.remove('open');
    });
    // tab bar: arrow keys move between tabs (mirrored in RTL)
    var bar = document.getElementById('v2-tabbar');
    if (bar) bar.addEventListener('keydown', function(e){
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = Array.prototype.slice.call(bar.querySelectorAll('.v2-tab')); var i = tabs.indexOf(document.activeElement); if (i < 0) return;
      var fwd = (e.key === 'ArrowRight') !== (document.documentElement.dir === 'rtl');
      var n = tabs[(i + (fwd ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); n.click(); e.preventDefault();
    });
    window.addEventListener('resize', setTopVar);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setTopVar);
    ZUI.v2Lang();
    setTopVar();
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
    try { ZUI.lk3dUpdate(data); } catch (e) { console.error('lk3d', e); }
    try { ZUI.rememberPerson(data); } catch (e) { console.error('people', e); }
    try { ZUI.sky3dRefresh(); ZUI.renderHeroCard(); } catch (e) { console.error('3d', e); }
  };
  ZUI.onLanguage = function(){
    if (ZUI.v2Lang) ZUI.v2Lang();
    ZUI.renderLessons();
    if (ZUI.pass21Lang) ZUI.pass21Lang();
    if (ZUI.heroLang) ZUI.heroLang();
    ZUI.renderLearn();
    lkTexts();
    ZUI.renderPreface();
    ZUI.cosmosLang();
    ZUI.navLang();
    if (document.getElementById('phone-index') && document.getElementById('index-content').childElementCount) ZUI.renderIndex();
    var nav = document.getElementById('system-tabs');
    if (nav) ZUI.initDock(nav);
  };

  function boot(){
    initSky();
    wireHero();
    var nav = document.getElementById('system-tabs');
    if (typeof buildSystemTabs === 'function') buildSystemTabs();
    else if (nav) ZUI.initDock(nav);
    ZUI.renderLearn();
    ZUI.renderPreface();
    ZUI.initCosmos();
    ZUI.initNav();
    if (ZUI.initV2) ZUI.initV2();
    // v0.2: every hash link (#learn, #periods, #unani …) is routed by index.html v2RouteHash
    if (typeof v2RouteHash === 'function') setTimeout(v2RouteHash, 60);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
