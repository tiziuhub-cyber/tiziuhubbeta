// ===== JOGOS EM OFERTA — carrossel automático em loop infinito =====
// Usa os produtos que JÁ existem em js/products.js (capa, nome, preço e link Cakto).
// Para trocar os jogos do carrossel, edite apenas a lista abaixo (nome exato do produto).
(function () {
  'use strict';
  var NAMES = ['Forza Horizon 5', "Assassin's Creed Odyssey GOLD", 'Battlefield 4', 'Dragon Ball FighterZ'];
  var SPEED = 48;          // px por segundo (movimento da direita para a esquerda)
  var GLIDE_MS = 520;      // duração ao clicar nas setas

  var root = document.getElementById('dealsCarousel');
  if (!root || !window.PRODUCTS) return;
  var vp = root.querySelector('.deal-viewport');
  var track = root.querySelector('.deal-track');
  var prevBtn = root.querySelector('.deal-prev');
  var nextBtn = root.querySelector('.deal-next');

  var games = NAMES.map(function (n) {
    return PRODUCTS.filter(function (p) { return p.name.toLowerCase() === n.toLowerCase(); })[0];
  }).filter(Boolean);
  if (!games.length) { var s = root.closest('section'); if (s) s.hidden = true; return; }

  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var autoSpeed = reduced ? 0 : SPEED;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function price(p) {
    var v = (typeof p.price === 'number' && p.price > 0) ? (p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price) : 0;
    return v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Preço a definir';
  }
  function cardHTML(p, clone) {
    var ok = p.available !== false;
    return '<article class="deal-card"' + (clone ? ' aria-hidden="true"' : '') + '>' +
      '<div class="deal-cover"><img src="' + esc(p.image) + '" alt="' + (clone ? '' : esc(p.name)) + '" draggable="false">' +
      '<span class="deal-seal">OFERTA</span></div>' +
      '<div class="deal-body"><h3>' + esc(p.name) + '</h3><div class="deal-price">' + price(p) + '</div>' +
      '<a class="btn btn-gold deal-buy' + (ok ? '' : ' off') + '" href="' + esc(p.checkoutUrl) + '" target="_blank" rel="noopener" draggable="false"' +
      (clone ? ' tabindex="-1"' : '') + '>' + (ok ? 'COMPRAR' : 'INDISPONÍVEL') + '</a></div></article>';
  }

  var setW = 0, cardW = 0, gap = 20, x = 0, vel = 0;
  var hover = false, focusPause = false, inView = true, dragging = false, glide = null;

  function wrap(v) { return ((v % setW) + setW) % setW; }
  function apply() { track.style.transform = 'translate3d(' + (-x) + 'px,0,0)'; }
  function perView(w) { return w < 560 ? 2 : (w < 900 ? 3 : 4); }

  function layout() {
    var w = vp.clientWidth; if (!w) return;
    var ratio = setW ? x / setW : 0;
    var n = perView(w);
    gap = w < 560 ? 12 : 20;
    cardW = (w - gap * (n - 1)) / n;
    setW = games.length * (cardW + gap);
    // cópias suficientes para nunca aparecer espaço vazio: o "fim" emenda direto no "começo"
    var reps = Math.ceil(w / setW) + 1, html = '';
    for (var r = 0; r < reps; r++) games.forEach(function (g) { html += cardHTML(g, r > 0); });
    root.style.setProperty('--deal-w', cardW + 'px');
    root.style.setProperty('--deal-gap', gap + 'px');
    track.innerHTML = html;
    x = wrap(ratio * setW); glide = null; apply();
  }

  // ----- animação contínua -----
  var last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    var dt = Math.min((t - last) / 1000, 0.1); last = t;
    if (!setW) return;
    if (glide) {
      var k = Math.min((t - glide.t0) / glide.dur, 1);
      var e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      glide.cur = glide.from + (glide.to - glide.from) * e;   // posição contínua (sem "enrolar")
      x = wrap(glide.cur); apply();
      if (k >= 1) { glide = null; vel = 0; }
      return;
    }
    if (dragging) return;
    var paused = hover || focusPause || !inView || document.hidden;
    var target = paused ? 0 : autoSpeed;
    vel += (target - vel) * (1 - Math.exp(-dt * (target ? 3 : 7)));   // acelera/freia suavemente
    if (Math.abs(vel) > 0.02) { x = wrap(x + vel * dt); apply(); }
  }

  // ----- pausa com o mouse / teclado -----
  root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
  root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hover = false; });
  root.addEventListener('focusin', function (e) { try { focusPause = e.target.matches(':focus-visible'); } catch (_) { focusPause = false; } });
  root.addEventListener('focusout', function () { focusPause = false; });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }).observe(root);

  // ----- setas -----
  function step(dir) {
    var from = glide ? glide.cur : x, base = glide ? glide.to : x;
    glide = { from: from, cur: from, to: base + dir * (cardW + gap), t0: performance.now(), dur: GLIDE_MS };
  }
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });

  // ----- arrastar com o dedo / mouse -----
  var ptr = null, suppress = false;
  vp.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ptr = { id: e.pointerId, x0: e.clientX, xs: x, lx: e.clientX, lt: performance.now(), v: 0, on: false };
  });
  vp.addEventListener('pointermove', function (e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    var dx = e.clientX - ptr.x0;
    if (!ptr.on) {
      if (Math.abs(dx) < 6) return;
      ptr.on = true; dragging = true; glide = null; vel = 0;
      ptr.xs = x; ptr.x0 = e.clientX; dx = 0;
      try { vp.setPointerCapture(e.pointerId); } catch (_) {}
      vp.classList.add('is-dragging');
    }
    var now = performance.now(), dt = Math.max(now - ptr.lt, 1) / 1000;
    ptr.v = ptr.v * 0.6 + (-(e.clientX - ptr.lx) / dt) * 0.4;
    ptr.lx = e.clientX; ptr.lt = now;
    x = wrap(ptr.xs - dx); apply();
  });
  function endDrag(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (ptr.on) {
      suppress = true; setTimeout(function () { suppress = false; }, 0);
      var stale = performance.now() - ptr.lt > 90;
      vel = stale ? 0 : Math.max(-1800, Math.min(1800, ptr.v));   // pequena inércia, depois volta ao automático
      dragging = false; vp.classList.remove('is-dragging');
    }
    ptr = null;
  }
  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', endDrag);
  vp.addEventListener('click', function (e) { if (suppress) { e.preventDefault(); e.stopPropagation(); } }, true);
  vp.addEventListener('dragstart', function (e) { e.preventDefault(); });

  // ----- redimensionamento -----
  var rt, lastW = 0;
  function onResize() {
    clearTimeout(rt);
    rt = setTimeout(function () { var w = vp.clientWidth; if (w !== lastW) { lastW = w; layout(); } }, 120);
  }
  window.addEventListener('resize', onResize);

  layout(); lastW = vp.clientWidth;
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();
