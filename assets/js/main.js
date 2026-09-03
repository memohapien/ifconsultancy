/* =========================================================
   IF Consultancy — site behavior
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Client wall ---------- */
  var wall = document.getElementById('wall');
  var rowsEl = document.getElementById('wallRows');
  var data = window.IF_LOGOS || [];

  if (rowsEl && data.length) {
    data.forEach(function (row, i) {
      var line = document.createElement('div');
      line.className = 'wrow' + (i % 2 ? ' wrow--rev' : '');

      var track = document.createElement('div');
      track.className = 'wrow__track';
      // duration scales with item count so all rows move at a similar speed
      track.style.setProperty('--dur', (row.length * 7 + 26) + 's');

      // duplicated once for a seamless -50% loop
      for (var pass = 0; pass < 2; pass++) {
        row.forEach(function (item) {
          var box = document.createElement('span');
          var img = document.createElement('img');
          img.src = 'assets/logos/' + item.f;
          img.alt = pass === 0 ? item.n : '';
          img.decoding = 'async';
          if (pass === 1) box.setAttribute('aria-hidden', 'true');
          box.appendChild(img);
          track.appendChild(box);
        });
      }
      line.appendChild(track);
      rowsEl.appendChild(line);
    });
    requestAnimationFrame(function () { wall.classList.add('is-in'); });
  }

  /* ---------- 2. Wall → hero scroll transition ---------- */
  var stage = document.querySelector('.stage');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;

    if (wall && stage && !reduced) {
      var travel = stage.offsetHeight - window.innerHeight;
      var p = Math.min(1, Math.max(0, y / (travel || 1)));
      var fade = Math.max(0, 1 - p * p * 1.04);
      wall.style.opacity = fade.toFixed(3);
      wall.style.transform = 'scale(' + (1 + p * 0.05).toFixed(4) + ') translateY(' + (-p * 5).toFixed(2) + 'vh)';
    }

    var nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('is-on', y > window.innerHeight * 1.05);

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- 3. Scroll reveals ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var siblings = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
          return n.classList && n.classList.contains('reveal');
        });
        var idx = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(idx * 70, 350) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 4. Counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        var plain = el.hasAttribute('data-plain');
        co.unobserve(el);
        if (reduced) { el.textContent = target; return; }
        var start = plain ? target - 40 : 0;
        var t0 = performance.now();
        var dur = 1100;
        (function step(now) {
          var k = Math.min(1, (now - t0) / dur);
          var eased = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(start + (target - start) * eased);
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- 5. Capabilities accordion ---------- */
  document.querySelectorAll('.cap__row').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.cap__item');
      var open = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.cap__item.is-open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.cap__row').setAttribute('aria-expanded', 'false');
        }
      });
      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
    });
  });

  /* ---------- 6. Mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      menu.hidden = open;
      document.body.style.overflow = open ? '' : 'hidden';
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName !== 'A') return;
      toggle.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      document.body.style.overflow = '';
    });
  }

  /* ---------- 7. Contact form → email ---------- */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      if (!f.name.value.trim() || !f.email.value.trim() || !f.message.value.trim()) {
        note.textContent = 'Add your name, email and a short note so we can reply properly.';
        note.classList.add('is-error');
        return;
      }
      note.classList.remove('is-error');
      note.textContent = 'Opening your email client…';
      var subject = 'IF Consultancy enquiry — ' + f.topic.value;
      var body = [
        'Name: ' + f.name.value,
        'Organization: ' + (f.org.value || '—'),
        'Email: ' + f.email.value,
        'Topic: ' + f.topic.value,
        '',
        f.message.value
      ].join('\n');
      window.location.href = 'mailto:if@ifconsultancy-tr.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  /* ---------- 8. Year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
