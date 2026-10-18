// Zeeshan Ahmad portfolio: small, dependency-free interactions.
(function () {
  var root = document.getElementById('top');
  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var fine = mq('(hover: hover) and (pointer: fine)');
  var calm = mq('(prefers-reduced-motion: reduce)');

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
