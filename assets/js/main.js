/* =========================================================
   IF Consultancy — site behavior
   Dynamic content loading + progressive enhancement
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------- */
  function esc(s) {
    if (!s) return '';
    var d = document.createElement('span');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ---------- reveal observer (reusable) ---------- */
  var io;
  if ('IntersectionObserver' in window && !reduced) {
    io = new IntersectionObserver(function (entries) {
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
  }

  function observeReveals(container) {
    var els = (container || document).querySelectorAll('.reveal:not(.is-in)');
    if (io) {
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- counter observer (reusable) ---------- */
  var co;
  if ('IntersectionObserver' in window) {
    co = new IntersectionObserver(function (entries) {
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
  }

  function observeCounters(container) {
    var els = (container || document).querySelectorAll('[data-count]:not([data-counted])');
    if (co) {
      els.forEach(function (el) { el.setAttribute('data-counted', ''); co.observe(el); });
    }
  }

  /* ========== 1. Client wall ========== */
  var wall = document.getElementById('wall');
  var rowsEl = document.getElementById('wallRows');

  function buildWall(data) {
    if (!rowsEl || !data || !data.length) return;
    rowsEl.innerHTML = '';
    data.forEach(function (row, i) {
      var line = document.createElement('div');
      line.className = 'wrow' + (i % 2 ? ' wrow--rev' : '');
      var track = document.createElement('div');
      track.className = 'wrow__track';
      track.style.setProperty('--dur', (row.length * 7 + 26) + 's');
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

  var staticLogos = window.IF_LOGOS || [];
  buildWall(staticLogos);

  fetch('/content/logos.json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      if (data && data.length) {
        buildWall(data);
        var total = data.reduce(function (s, row) { return s + row.length; }, 0);
        var wallCount = document.querySelector('.wall__meta [data-count]');
        if (wallCount && total > 0) {
          wallCount.setAttribute('data-count', String(total));
          wallCount.textContent = String(total);
        }
      }
    })
    .catch(function () {});

  /* ========== 2. Wall -> hero scroll transition ========== */
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

  /* ========== 3. Initial scroll reveals ========== */
  observeReveals();

  /* ========== 4. Initial counters ========== */
  observeCounters();

  /* ========== 5. Capabilities accordion (event delegation) ========== */
  var capContainer = document.getElementById('cap');
  if (capContainer) {
    capContainer.addEventListener('click', function (e) {
      var btn = e.target.closest('.cap__row');
      if (!btn) return;
      var item = btn.closest('.cap__item');
      var open = btn.getAttribute('aria-expanded') === 'true';
      capContainer.querySelectorAll('.cap__item.is-open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.cap__row').setAttribute('aria-expanded', 'false');
        }
      });
      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
    });
  }

  /* ========== 6. Dynamic content loading ========== */

  function renderCapabilities(data) {
    if (!capContainer || !data || !data.length) return;
    capContainer.innerHTML = data.map(function (cap) {
      var tags = cap.tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
      return '<article class="cap__item reveal">' +
        '<button class="cap__row" aria-expanded="false">' +
          '<span class="cap__name">' + esc(cap.name) + '</span>' +
          '<span class="cap__sum">' + esc(cap.summary) + '</span>' +
          '<span class="cap__sign" aria-hidden="true"></span>' +
        '</button>' +
        '<div class="cap__panel"><div class="cap__panel-in">' +
          '<p>' + esc(cap.description) + '</p>' +
          '<ul class="tags">' + tags + '</ul>' +
        '</div></div></article>';
    }).join('');
    observeReveals(capContainer);
    syncTopicDropdown(data);
  }

  function syncTopicDropdown(capabilities) {
    var select = document.getElementById('topic');
    if (!select) return;
    var options = capabilities.map(function (c) {
      return '<option>' + esc(c.name) + '</option>';
    });
    options.push('<option>IF Nexus</option>');
    select.innerHTML = options.join('');
  }

  function renderImpact(data) {
    var container = document.querySelector('.impact');
    if (!container || !data || !data.length) return;
    container.innerHTML = data.map(function (item) {
      return '<li class="impact__row reveal">' +
        '<span class="mono impact__sector">' + esc(item.sector) + '</span>' +
        '<p>' + esc(item.description) + '</p>' +
      '</li>';
    }).join('');
    observeReveals(container);
  }

  function renderGlobal(data) {
    if (!data) return;

    if (data.stats) {
      var statsEl = document.querySelector('.stats');
      if (statsEl) {
        statsEl.innerHTML = data.stats.map(function (s) {
          var plainAttr = s.plain ? ' data-plain="1"' : '';
          var suffix = s.suffix ? '<span class="stat__suffix">' + esc(s.suffix) + '</span>' : '';
          return '<div class="stat reveal">' +
            '<span class="stat__n" data-count="' + s.value + '"' + plainAttr + '>' + s.value + '</span>' +
            suffix +
            '<span class="mono stat__l">' + esc(s.label) + '</span></div>';
        }).join('');
        observeReveals(statsEl);
        observeCounters(statsEl);
      }
    }

    var globalEl = document.querySelector('.global');
    if (!globalEl) return;
    var cols = [];

    if (data.markets) {
      cols.push('<div class="global__col reveal"><p class="mono">Markets</p><ul class="rule-list">' +
        data.markets.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') +
        '</ul></div>');
    }
    if (data.clientTypes) {
      cols.push('<div class="global__col reveal"><p class="mono">Client types</p><ul class="rule-list">' +
        data.clientTypes.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') +
        '</ul></div>');
    }
    if (data.recognition) {
      cols.push('<div class="global__col reveal"><p class="mono">Recognition</p><ul class="rule-list">' +
        data.recognition.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') +
        '</ul></div>');
    }

    if (cols.length) {
      globalEl.innerHTML = cols.join('');
      observeReveals(globalEl);
    }
  }

  function renderNexus(data) {
    if (!data) return;

    if (data.features) {
      var listEl = document.querySelector('.nexus__list');
      if (listEl) {
        listEl.innerHTML = data.features.map(function (f) {
          return '<li>' + esc(f) + '</li>';
        }).join('');
      }
    }
  }

  fetch('/content/capabilities.json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(renderCapabilities)
    .catch(function () {});

  fetch('/content/impact.json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(renderImpact)
    .catch(function () {});

  fetch('/content/global.json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(renderGlobal)
    .catch(function () {});

  fetch('/content/nexus.json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(renderNexus)
    .catch(function () {});

  /* ========== 7. Mobile menu ========== */
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

  /* ========== 8. Contact form -> API with mailto fallback ========== */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;

      if (!f.name.value.trim() || !f.email.value.trim() || !f.message.value.trim()) {
        note.textContent = 'Add your name, email and a short note so we can reply properly.';
        note.className = 'form__note is-error';
        return;
      }

      note.className = 'form__note';
      note.textContent = 'Sending…';
      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      var payload = {
        name: f.name.value.trim(),
        org: f.org.value.trim(),
        email: f.email.value.trim(),
        topic: f.topic.value,
        message: f.message.value.trim()
      };

      var turnstileEl = f['cf-turnstile-response'];
      if (turnstileEl && turnstileEl.value) payload.token = turnstileEl.value;

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (d) { return Promise.reject(d); });
        return r.json();
      })
      .then(function () {
        note.textContent = 'Thank you. We’ll be in touch shortly.';
        note.className = 'form__note is-success';
        form.reset();
        if (window.turnstile) window.turnstile.reset();
      })
      .catch(function (err) {
        if (err && err.error) {
          note.textContent = err.error;
          note.className = 'form__note is-error';
        } else {
          fallbackMailto(payload);
        }
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  function fallbackMailto(p) {
    var subject = 'IF Consultancy enquiry — ' + p.topic;
    var body = [
      'Name: ' + p.name,
      'Organization: ' + (p.org || '—'),
      'Email: ' + p.email,
      'Topic: ' + p.topic, '',
      p.message
    ].join('\n');
    window.location.href = 'mailto:if@ifconsultancy-tr.com?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    note.textContent = 'Opened in your email client as a backup.';
    note.className = 'form__note';
  }

  /* ========== 9. Year ========== */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
