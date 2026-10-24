// Zeeshan Ahmad portfolio: small, dependency-free interactions.
(function () {
  var root = document.getElementById('top');
  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var fine = mq('(hover: hover) and (pointer: fine)');
  var calm = mq('(prefers-reduced-motion: reduce)');
  // Before/after slider: the range input drives the divider position
  document.querySelectorAll('.ba-slider').forEach(function (el) {
    var r = el.querySelector('.ba-range'); if (!r || r._ba) return; r._ba = 1;
    var u = function () { el.style.setProperty('--pos', r.value + '%'); };
    r.addEventListener('input', u); u();
  });

  // Cursor glow + dot reveal (CSS reads --gx / --gy)
  if (root) {
    root.addEventListener('mousemove', function (e) {
      var r = root.getBoundingClientRect();
      root.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      root.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      root.classList.add('glow-on');
    }, { passive: true });
  }

  // Nav: no shadow at the top, a subtle one after scrolling
  var nav = document.querySelector('header.nav');
  var onScroll = function () { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Magnetic buttons, cover tilt, View cursor
  if (fine && !calm) {
    var lastMag = null, lastTilt = null;
    document.addEventListener('pointermove', function (e) {
      var t = e.target && e.target.closest ? e.target : null;
      var mag = t && t.closest('.btn-primary');
      if (lastMag && lastMag !== mag) lastMag.style.transform = '';
      if (mag) {
        var r = mag.getBoundingClientRect();
        mag.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
      }
      lastMag = mag;
      var card = t && t.closest('.feature, .pcard, .mini');
      var ph = card && card.querySelector('.ph');
      if (lastTilt && lastTilt !== ph) lastTilt.style.transform = '';
      if (ph) {
        var b = ph.getBoundingClientRect();
        var cl = function (v) { return Math.max(-0.5, Math.min(0.5, v)); };
        var px = cl((e.clientX - b.left) / b.width - 0.5), py = cl((e.clientY - b.top) / b.height - 0.5);
        ph.style.transform = 'perspective(900px) rotateX(' + (-py * 6).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg)';
      }
      lastTilt = ph;
      if (root) {
        var view = t && t.closest('.feature, .mini, .row');
        root.classList.toggle('view-on', !!view);
        var rr = root.getBoundingClientRect();
        root.style.setProperty('--vx', (e.clientX - rr.left) + 'px');
        root.style.setProperty('--vy', (e.clientY - rr.top) + 'px');
      }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { if (root) root.classList.remove('view-on'); });
  }

  // Stat count-up
  if (!calm && 'IntersectionObserver' in window) {
    var fmt = function (n, src) {
      var d = (src.split('.')[1] || '').length, s = n.toFixed(d);
      return src.indexOf(',') > -1 ? Number(s).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : s;
    };
    var count = function (el) {
      var nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) nodes.push([n, n.nodeValue]);
      var t0 = performance.now(), dur = 1100;
      var step = function (now) {
        var k = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
        nodes.forEach(function (p) {
          p[0].nodeValue = k >= 1 ? p[1] : p[1].replace(/\d[\d,]*(?:\.\d+)?/g, function (m) { return fmt(parseFloat(m.replace(/,/g, '')) * ease, m); });
        });
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var cio = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { cio.unobserve(en.target); count(en.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll('.stat-num').forEach(function (el) { cio.observe(el); });
  }

  // Case study: chapter index follows the reader
  var links = document.querySelectorAll('.cs-index a[href^="#"]');
  if (links.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        a.setAttribute('aria-current', on ? 'location' : 'false');
      });
    };
    var sio = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    links.forEach(function (a) { var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) sio.observe(el); });
  }

  // Case study: High fidelity / Wireframes tabs
  document.querySelectorAll('[data-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-tab');
      document.querySelectorAll('[data-tab]').forEach(function (b) {
        var on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== key; });
    });
  });

  // Home: load more projects
  document.querySelectorAll('[data-toggle-more]').forEach(function (btn) {
    var extra = document.querySelector('[data-more-extra]');
    var label = btn.querySelector('[data-more-label]');
    var arr = btn.querySelector('.arr');
    btn.addEventListener('click', function () {
      if (!extra) return;
      var open = extra.hidden;
      extra.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Show less' : 'Load more projects (4)';
      if (arr) { arr.textContent = open ? '↑' : '↓'; arr.className = 'arr ' + (open ? 'arr-u' : 'arr-d'); }
      if (!open) { var sec = document.getElementById('more'); if (sec) sec.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' }); }
    });
  });

  // Home: experience journey
  document.querySelectorAll('[data-toggle-exp]').forEach(function (btn) {
    var extra = document.querySelector('[data-exp-extra]');
    var label = btn.querySelector('[data-exp-label]');
    var arr = btn.querySelector('.arr');
    btn.addEventListener('click', function () {
      if (!extra) return;
      var open = extra.hidden;
      extra.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Show less' : 'Show full journey (3 more)';
      if (arr) { arr.textContent = open ? '\u2191' : '\u2193'; arr.className = 'arr ' + (open ? 'arr-u' : 'arr-d'); }
    });
  });


  // Home: design-thinking journey fallback when scroll-driven animation isn't supported
  var dtl = document.querySelector('.dt-steps');
  if (dtl && !calm && !(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'))) {
    dtl.classList.add('js-dt');
    var dsteps = dtl.querySelectorAll('.dt-step');
    var dtick = function () {
      var vh = window.innerHeight;
      var trk = dtl.closest('.dt-track'), stg = trk && trk.querySelector('.dt-stage');
      if (stg && getComputedStyle(stg).position === 'sticky') {
        var tr = trk.getBoundingClientRect(), span = tr.height - vh, p = span > 0 ? -tr.top / span : 0;
        var on = [-1, 0.16, 0.34, 0.52, 0.70], ln = [0.08, 0.26, 0.44, 0.62];
        dsteps.forEach(function (el, i) {
          el.classList.toggle('is-on', i === 0 ? tr.top < vh * 0.4 : p >= on[i]);
          el.classList.toggle('is-linked', i < 4 && p >= ln[i]);
        });
        return;
      }
      var row = dsteps.length > 1 && Math.abs(dsteps[0].getBoundingClientRect().top - dsteps[1].getBoundingClientRect().top) < 4;
      var lt = dtl.getBoundingClientRect().top;
      dsteps.forEach(function (el, i) {
        var t = row ? lt + i * vh * 0.13 : el.getBoundingClientRect().top;
        el.classList.toggle('is-on', t < vh * 0.85);
        el.classList.toggle('is-linked', row ? lt + (i + 0.6) * vh * 0.13 < vh * 0.85 : t < vh * 0.45);
      });
    };
    window.addEventListener('scroll', dtick, { passive: true }); window.addEventListener('resize', dtick); dtick();
  }

  // Section titles turn blue while their section is in view (fallback for browsers without scroll timelines)
  if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')) && 'IntersectionObserver' in window) {
    var sio2 = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { var l = en.target.querySelector('.sec-label'); if (l) l.classList.toggle('is-current', en.isIntersecting); });
    }, { rootMargin: '-35% 0px -45% 0px' });
    document.querySelectorAll('section').forEach(function (sec) { if (sec.querySelector('.sec-label')) sio2.observe(sec); });
  }

  // Copy email
  document.querySelectorAll('[data-copy-email]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var done = function () { btn.textContent = 'Copied ✓'; setTimeout(function () { btn.textContent = 'Copy email'; }, 1800); };
      if (navigator.clipboard) { navigator.clipboard.writeText('z.khanzk7@gmail.com').then(done, done); } else { done(); }
    });
  });
})();

/* More projects rail + pixel sticker game (ported from the canvas) */
(function () {
    // More projects rail: arrow buttons scroll one card at a time and switch off at each end.
    (function () {
      var rail = document.getElementById('p-rail'); if (!rail || rail._pr) return; rail._pr = 1;
      var btns = Array.prototype.slice.call(document.querySelectorAll('.p-rail-btn'));
      var step = function () { var c = rail.firstElementChild; var g = parseFloat(getComputedStyle(rail).columnGap) || 0; return c ? c.getBoundingClientRect().width + g : rail.clientWidth * 0.8; };
      var sync = function () { var max = rail.scrollWidth - rail.clientWidth - 2; btns.forEach(function (b) { var d = +b.getAttribute('data-dir'); b.disabled = d < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max; }); };
      btns.forEach(function (b) { b.addEventListener('click', function () { rail.scrollBy({ left: step() * (+b.getAttribute('data-dir')), behavior: 'smooth' }); }); });
      rail.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync); sync();
    })();
    // Kind words: the bars under the quotes are buttons. Click one to jump to that quote; it moves on every 6s and pauses on hover.
    (function () {
      var stage = document.querySelector('.q-stage'); if (!stage || stage._q) return; stage._q = 1;
      var slides = Array.prototype.slice.call(stage.querySelectorAll('.q-slide'));
      var dots = Array.prototype.slice.call(stage.querySelectorAll('.q-dot'));
      if (!slides.length || slides.length !== dots.length) return;
      var cur = 0;
      var show = function (n) {
        cur = (n + slides.length) % slides.length;
        slides.forEach(function (sl, k) { sl.classList.toggle('is-on', k === cur); });
        dots.forEach(function (d, k) { d.classList.toggle('is-on', k === cur); if (k === cur) { d.setAttribute('aria-current', 'true'); } else { d.removeAttribute('aria-current'); } });
      };
      dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); }); });
      stage.addEventListener('animationend', function (e) { var b = e.target && e.target.parentNode; if (b && b.classList && b.classList.contains('q-dot') && b.classList.contains('is-on')) show(cur + 1); });
      stage.classList.add('q-js'); show(0);
    })();
    function initPixelPaint(root, startOpen) {
      var noop = function () {};
      if (!root) return noop;
      var grid = root.querySelector('.pp-grid'), cv = root.querySelector('.pp-canvas');
      if (!grid || !cv || !cv.getContext) return noop;
      var N = 12, TOTAL = N * N;
      var cells = Array.prototype.slice.call(grid.querySelectorAll('.pp-cell'));
      var sws = Array.prototype.slice.call(root.querySelectorAll('.pp-sw'));
      var custom = root.querySelector('.pp-custom'), customIn = custom ? custom.querySelector('input') : null;
      var eraser = root.querySelector('[data-pp="eraser"]'), clr = root.querySelector('[data-pp="clear"]');
      var dl = root.querySelector('[data-pp="download"]'), status = root.querySelector('.pp-status');
      var cx = cv.getContext('2d');
      var tog = root.querySelector('.pp-toggle'), board = root.querySelector('.pp-board');
      var setOpen = function (o) {
        root.classList.toggle('is-collapsed', !o);
        if (board) board.hidden = !o;
        if (!tog) return;
        tog.setAttribute('aria-expanded', o ? 'true' : 'false');
        var l = tog.querySelector('.pp-toggle-label'), a = tog.querySelector('.pp-toggle-arr');
        if (l) l.textContent = o ? 'Hide sticker maker' : 'Create a free sticker';
        if (a) { a.textContent = o ? '↑' : '→'; a.className = 'arr pp-toggle-arr ' + (o ? 'arr-u' : 'arr-r'); }
      };
      if (tog) tog.addEventListener('click', function () { setOpen(!!(board && board.hidden)); });
      setOpen(!!startOpen);
      var PAL = {"k": "#111827", "g": "#6B7280", "s": "#D1D5DB", "w": "#FFFFFF", "b": "#2563EB", "l": "#60A5FA", "p": "#BFDBFE", "v": "#8B5CF6", "m": "#F472B6", "r": "#EF4444", "o": "#F97316", "y": "#FACC15", "n": "#22C55E", "d": "#15803D", "t": "#92400E", "f": "#FDBA74"};
      var PRESETS = [["............", "..rrr..rrr..", ".rrrrrrrrrr.", ".rwrrrrrrrr.", ".rrrrrrrrrr.", ".rrrrrrrrrr.", "..rrrrrrrr..", "...rrrrrr...", "....rrrr....", ".....rr.....", "............", "............"], ["....kkkk....", "..kkyyyykk..", ".kyyyyyyyyk.", ".kyykyykyyk.", "kyyykyykyyyk", "kyyyyyyyyyyk", "kyyyyyyyyyyk", "kykyyyyyykyk", "kyykyyyykyyk", ".kyykkkkyyk.", "..kkyyyykk..", "....kkkk...."], [".....yy.....", "....yyyy....", "....yyyy....", "yyyyyyyyyyyy", ".yyyyyyyyyy.", "..yyyyyyyy..", "...yyyyyy...", "..yyyyyyyy..", "..yyyyyyyy..", ".yyyy..yyyy.", ".yyy....yyy.", "yy........yy"], ["..s..s......", ".s..s.......", "..s..s......", "............", "kkkkkkkkk...", "ktttttttkkk.", "kpppppppk.k.", "kpppppppk.k.", "kpppppppkkk.", ".kpppppk....", "..kkkkk.....", "sssssssssss."], ["....vvvv....", "..vvvvvvvv..", ".vvvvvvvvvv.", ".vvwwvvwwvv.", "vvvwkvvwkvvv", "vvvwkvvwkvvv", "vvvvvvvvvvvv", "vvvvvvvvvvvv", "vvvvvvvvvvvv", "vvvvvvvvvvvv", "vvv.vvvv.vvv", "vv...vv...vv"], ["....rrrr....", "..rrrrrrrr..", ".rrwwrrrwwr.", ".rwwrrrrwwr.", "rrrrrrrrrrrr", "rwrrrwwrrrwr", "rrrrrrrrrrrr", "...ffffff...", "...fkffkf...", "...ffffff...", "...ffffff...", "....ffff...."], [".o........o.", ".oo......oo.", ".ooo....ooo.", ".oooooooooo.", "oooooooooooo", "ookkooookkoo", "oooooooooooo", "ooooommooooo", "oooookkooooo", ".oooooooooo.", "..oooooooo..", "....oooo...."], [".......yyy..", "......yyy...", ".....yyy....", "....yyy.....", "...yyyyyyy..", "..yyyyyyy...", ".....yyy....", "....yyy.....", "...yyy......", "..yyy.......", ".yy.........", "y..........."], ["...mm..mm...", "..mmmmmmmm..", "..mmmyymmm..", "..mmyyyymm..", "..mmmyymmm..", "..mmmmmmmm..", "...mm..mm...", ".....nn.....", "..nn.nn.....", "...nnnn.....", ".....nn.....", ".....nn....."], ["....kkkk....", "....kbbk....", "...kkkkkk...", "..kbbbbbbk..", ".kbbbbbbbbk.", ".kbbbwwbbbk.", ".kbbbwwbbbk.", "..kbbkkbbk..", "...kbkkbk...", "....kkkk....", ".....kk.....", "............"], [".........l..", "........lll.", "....bb...l..", "....bb......", "....bb......", "...bbbb.....", "bbbbbbbbbb..", "bbbbbbbbbb..", "...bbbb.....", "....bb......", "....bb......", "....bb......"], ["............", "............", "...b.....b..", "....b...b...", "...bbbbbbb..", "..bb.bbb.bb.", ".bbbbbbbbbbb", ".b.bbbbbbb.b", ".b.b.....b.b", "....bb.bb...", "............", "............"]];
      var NAMES = ["Heart", "Smiley", "Star", "Coffee", "Ghost", "Mushroom", "Cat", "Bolt", "Flower", "Pen tool", "AI sparkle", "Invader"];
      var data = []; for (var n = 0; n < TOTAL; n++) data.push('');
      var color = '#111827', erasing = false, down = false, bag = [], raf = 0;
      var say = function (t) { if (status) status.textContent = t; };
      var draw = function (ctx, S) {
        ctx.clearRect(0, 0, S, S);
        var u = S / 512;
        var rr = function (x0, y0, w, h, r) { ctx.beginPath(); ctx.moveTo(x0 + r, y0); ctx.arcTo(x0 + w, y0, x0 + w, y0 + h, r); ctx.arcTo(x0 + w, y0 + h, x0, y0 + h, r); ctx.arcTo(x0, y0 + h, x0, y0, r); ctx.arcTo(x0, y0, x0 + w, y0, r); ctx.closePath(); };
        ctx.save(); ctx.shadowColor = 'rgba(17,24,39,0.18)'; ctx.shadowBlur = 20 * u; ctx.shadowOffsetY = 6 * u;
        rr(20 * u, 16 * u, 472 * u, 472 * u, 64 * u); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
        var c = 30 * u, x0 = 76 * u, y0 = 50 * u;
        data.forEach(function (col, i) { if (!col) return; ctx.fillStyle = col; ctx.fillRect(x0 + (i % N) * c, y0 + Math.floor(i / N) * c, Math.ceil(c), Math.ceil(c)); });
        // Small grey ZA mark (the navbar logo) in the bottom-right corner of the sticker.
        var LOGO = [50,61.6, 50,166.1, 302.1,166.1, 50,607.6, 409.3,607.6, 602.9,269.2, 739.4,510.1, 583.4,510.1, 527.7,607.6, 913.5,607.6, 602.9,61.6, 345.2,511.5, 226.9,511.5, 487.3,61.6];
        var ls = 44 * u / 863.5, lx = 408 * u, ly = 454 * u - 546 * ls;
        ctx.beginPath();
        for (var p = 0; p < LOGO.length; p += 2) { var px = lx + (LOGO[p] - 50) * ls, py = ly + (LOGO[p + 1] - 61.6) * ls; if (p) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath(); ctx.fillStyle = '#9CA3AF'; ctx.fill();
      };
      var refresh = function () {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0; draw(cx, 512);
          var has = data.some(Boolean);
          if (dl) dl.disabled = !has;
          if (clr) clr.disabled = !has;
        });
      };
      var set = function (i, c) { if (i < 0 || i >= TOTAL || !cells[i]) return; data[i] = c; cells[i].style.background = c || ''; refresh(); };
      var paintFrom = function (el) { var c = el && el.closest ? el.closest('.pp-cell') : null; if (!c || !grid.contains(c)) return; set(+c.getAttribute('data-i'), erasing ? '' : color); };
      var onDown = function (e) { var c = e.target && e.target.closest ? e.target.closest('.pp-cell') : null; if (!c) return; down = true; e.preventDefault(); paintFrom(c); };
      var onMove = function (e) { if (down) paintFrom(document.elementFromPoint(e.clientX, e.clientY)); };
      var onUp = function () { down = false; };
      grid.addEventListener('pointerdown', onDown);
      grid.addEventListener('click', function (e) { if (e.detail === 0) paintFrom(e.target); });
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      var pick = function (c, which) {
        color = c; erasing = false; grid.classList.remove('is-erasing');
        if (eraser) eraser.setAttribute('aria-pressed', 'false');
        sws.forEach(function (o) { o.setAttribute('aria-pressed', o === which ? 'true' : 'false'); });
        if (custom) custom.classList.toggle('is-on', which === custom);
      };
      sws.forEach(function (b) { b.addEventListener('click', function () { pick(b.getAttribute('data-color'), b); }); });
      // Custom colour: the swatch above the picker shows the picked colour and updates live as it changes.
      var slot = root.querySelector('.pp-sw.is-slot');
      var setCustom = function () {
        var c = customIn.value; if (!c) return;
        if (!slot) { pick(c, custom); return; }
        slot.setAttribute('data-color', c); slot.style.background = c; slot.title = c;
        pick(c, slot);
      };
      if (customIn) {
        customIn.addEventListener('input', setCustom);
        customIn.addEventListener('change', setCustom);
      }
      if (eraser) eraser.addEventListener('click', function () {
        erasing = eraser.getAttribute('aria-pressed') !== 'true';
        eraser.setAttribute('aria-pressed', erasing ? 'true' : 'false'); grid.classList.toggle('is-erasing', erasing);
        say(erasing ? 'Eraser on.' : 'Eraser off.');
      });
      if (clr) clr.addEventListener('click', function () { for (var i = 0; i < TOTAL; i++) set(i, ''); say('Cleared. Start again.'); });
      var sur = root.querySelector('[data-pp="surprise"]');
      if (sur) sur.addEventListener('click', function () {
        if (!bag.length) { for (var j = 0; j < PRESETS.length; j++) bag.push(j); for (var a = bag.length - 1; a > 0; a--) { var b = Math.floor(Math.random() * (a + 1)), t = bag[a]; bag[a] = bag[b]; bag[b] = t; } }
        var k = bag.pop();
        PRESETS[k].forEach(function (row, r) { for (var c = 0; c < N; c++) set(r * N + c, PAL[row.charAt(c)] || ''); });
        say(NAMES[k] + ' loaded. Make it yours.');
      });
      if (dl) dl.addEventListener('click', function () {
        if (!data.some(Boolean)) return;
        var out = document.createElement('canvas'); out.width = 512; out.height = 512; draw(out.getContext('2d'), 512);
        var a = document.createElement('a'); a.href = out.toDataURL('image/png'); a.download = 'zeeshan-sticker.png';
        document.body.appendChild(a); a.click(); a.remove();
        say('Sticker downloaded. Nice work.');
      });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      refresh();
      return function () {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };
    }
    initPixelPaint(document.getElementById('play'), false);
})();
