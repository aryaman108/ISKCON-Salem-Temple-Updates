/* ============================================================
   ISKCON Salem · Stone Temple — Shared application JS
   Each module checks for its required element(s) before running,
   so a single file works across all pages.
   ============================================================ */
(function () {
  'use strict';

  const $  = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

  // ---------- Toast ----------
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- Year stamp ----------
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Days of devotion (anchor: 2023-01-01) ----------
  const daysEl = $('#counterDays');
  if (daysEl) {
    const start = new Date('2023-01-01').getTime();
    const days = Math.floor((Date.now() - start) / 86400000);
    daysEl.textContent = days.toLocaleString();
  }

  // ---------- Theme toggle ----------
  (function () {
    const root = document.documentElement;
    if (localStorage.getItem('iskcon-theme') === 'dark') root.setAttribute('data-theme', 'dark');
    const btn = $('#theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const dark = root.getAttribute('data-theme') === 'dark';
      root.setAttribute('data-theme', dark ? 'light' : 'dark');
      localStorage.setItem('iskcon-theme', dark ? 'light' : 'dark');
    });
  })();

  // ---------- Mobile menu ----------
  (function () {
    const nav = $('#nav');
    const btn = $('#mobile-toggle');
    if (!nav || !btn) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    $$('#nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  })();

  // ---------- Scroll: nav shrink + progress + back-to-top ----------
  (function () {
    const nav = $('#nav');
    const prog = $('#progress');
    const top = $('#topBtn');
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (nav)  nav.classList.toggle('scrolled', y > 16);
        if (top)  top.classList.toggle('show', y > 500);
        if (prog) {
          const h = document.documentElement;
          const max = (h.scrollHeight - h.clientHeight) || 1;
          prog.style.width = Math.min(100, (y / max) * 100) + '%';
        }
        raf = 0;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  // ---------- Reveal on scroll ----------
  (function () {
    const items = $$('.reveal');
    if (!items.length || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    items.forEach(el => io.observe(el));
  })();

  // ---------- Animated count-up (donation meter) ----------
  (function () {
    const card = $('#meter');
    if (!card) return;
    let fired = false;
    const fire = () => {
      if (fired) return; fired = true;
      $$('.count').forEach(el => {
        const target = +el.dataset.target;
        const start = performance.now();
        const dur = 1500;
        (function step(now) {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased).toLocaleString();
          if (t < 1) requestAnimationFrame(step);
        })(start);
      });
      const fill = $('#progFill');
      if (fill) fill.style.width = '68%';
    };
    new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) fire(); });
    }, { threshold: 0.3 }).observe(card);
  })();

  // ---------- Hero spotlight ----------
  (function () {
    const hero = $('.hero');
    const sp = $('#spotlight');
    if (!hero || !sp) return;
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      sp.style.left = (e.clientX - r.left) + 'px';
      sp.style.top  = (e.clientY - r.top)  + 'px';
    });
  })();

  // ---------- Aarti schedule ----------
  (function () {
    const list = $('#schedule-list');
    if (!list) return;
    const aartis = [
      { time: '04:30', name: 'Mangala Aarti',  desc: 'The first awakening of the Lord — the most auspicious moment.' },
      { time: '05:00', name: 'Tulasi Aarti',   desc: 'Offering to the sacred Tulasi plant, the dearest devotee.' },
      { time: '07:30', name: 'Sringar Aarti',  desc: 'The deities are adorned and welcomed for the day.' },
      { time: '12:30', name: 'Raj Bhog Aarti', desc: 'The royal feast — Krishna is offered an opulent meal.' },
      { time: '16:15', name: 'Dhupa Aarti',    desc: 'A gentle afternoon arati with incense.' },
      { time: '19:00', name: 'Sandhya Aarti',  desc: 'Evening arati — the day’s service is offered.' },
      { time: '20:30', name: 'Shayana Aarti',  desc: 'The Lord is gently put to rest until dawn.' }
    ];
    const toMin = (s) => { const [h,m] = s.split(':').map(Number); return h*60+m; };
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();

    let currentIdx = -1;
    for (let i = 0; i < aartis.length; i++) {
      const s = toMin(aartis[i].time);
      const e = i < aartis.length - 1 ? toMin(aartis[i+1].time) : 24*60;
      if (nowMin >= s && nowMin < e) { currentIdx = i; break; }
    }
    if (currentIdx === -1) currentIdx = 0;

    aartis.forEach((a, i) => {
      const row = document.createElement('div');
      row.className = 'schedule-row' + (i === currentIdx ? ' now' : '');
      row.innerHTML = `
        <div class="row-time">${a.time}</div>
        <div class="row-name"><b>${a.name}</b><small>${a.desc}</small></div>
        <div class="row-tag">Now</div>
      `;
      list.appendChild(row);
    });

    const cur = aartis[currentIdx];
    const nameEl = $('#now-name'); if (nameEl) nameEl.textContent = cur.name;
    const descEl = $('#now-desc'); if (descEl) descEl.textContent = cur.desc;
    const timeEl = $('#now-time'); if (timeEl) timeEl.textContent = cur.time;

    const clock = $('#now-clock');
    if (clock) {
      const tick = () => {
        const d = new Date();
        clock.textContent = 'Local Time · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      };
      tick(); setInterval(tick, 1000);
    }
  })();

  // ---------- Japa counter ----------
  (function () {
    const beadBtn = $('#beadBtn');
    if (!beadBtn) return;
    const KEY = 'iskcon-japa';
    const state = JSON.parse(localStorage.getItem(KEY) || '{}');
    state.count = state.count || 0;
    state.totalRounds = state.totalRounds || 0;
    state.today = state.today || { date: '', rounds: 0 };
    state.lastChantDate = state.lastChantDate || '';
    state.streak = state.streak || 0;

    const today = new Date().toDateString();
    if (state.today.date !== today) state.today = { date: today, rounds: 0 };

    const beadCount = $('#beadCount');
    const roundsToday = $('#roundsToday');
    const roundsTotal = $('#roundsTotal');
    const streakDays = $('#streakDays');
    const pulse = $('#chantPulse');

    function render() {
      if (beadCount)   beadCount.textContent   = state.count;
      if (roundsToday) roundsToday.textContent = state.today.rounds;
      if (roundsTotal) roundsTotal.textContent = state.totalRounds;
      if (streakDays)  streakDays.textContent  = state.streak;
    }
    function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
    function bump() {
      state.count++;
      const t = new Date().toDateString();
      if (state.lastChantDate !== t) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        state.streak = state.lastChantDate === y.toDateString() ? state.streak + 1 : 1;
        state.lastChantDate = t;
      }
      if (state.count >= 108) {
        state.count = 0;
        state.totalRounds++;
        state.today.rounds++;
        toast('🪷 Round complete — Hare Krishna!');
      }
      if (pulse) {
        pulse.classList.remove('go');
        void pulse.offsetWidth;
        pulse.classList.add('go');
      }
      render(); save();
    }

    beadBtn.addEventListener('click', bump);
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && document.activeElement === beadBtn) { e.preventDefault(); bump(); }
    });
    const reset = $('#chantReset');
    if (reset) reset.addEventListener('click', () => { state.count = 0; render(); save(); toast('Round reset'); });
    const clear = $('#chantClear');
    if (clear) clear.addEventListener('click', () => {
      if (!confirm('Clear all japa counts?')) return;
      localStorage.removeItem(KEY);
      state.count = 0; state.totalRounds = 0; state.today.rounds = 0; state.streak = 0;
      render(); toast('All counts cleared');
    });
    render();
  })();

  // ---------- Verse of the day ----------
  (function () {
    const q = $('#verseQuote');
    if (!q) return;
    const verses = [
      { q: 'Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion — at that time I descend Myself.', r: 'Bhagavad-gītā 4.7' },
      { q: 'Set thy heart upon thy work, but never on its reward. Work not for a reward; but never cease to do thy work.', r: 'Bhagavad-gītā 2.47' },
      { q: 'The soul is neither born, nor does it ever die; nor having once existed, does it ever cease to be.', r: 'Bhagavad-gītā 2.20' },
      { q: 'For one who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, his very mind will be the greatest enemy.', r: 'Bhagavad-gītā 6.6' },
      { q: 'I am the source of all spiritual and material worlds. Everything emanates from Me.', r: 'Bhagavad-gītā 10.8' },
      { q: 'Always think of Me, become My devotee, worship Me and offer your homage unto Me. Thus you will come to Me without fail.', r: 'Bhagavad-gītā 9.34' },
      { q: 'There is nothing higher than Me, O conqueror of wealth. All this is strung on Me, like clusters of jewels on a thread.', r: 'Bhagavad-gītā 7.7' }
    ];
    let idx = Math.floor(Date.now() / 86400000) % verses.length;
    const r = $('#verseRef');
    const dots = $('#verseDots');
    const card = $('.verse-card');

    verses.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Verse ' + (i + 1));
      b.addEventListener('click', () => show(i));
      dots.appendChild(b);
    });

    function show(i) {
      idx = i;
      q.style.opacity = 0;
      setTimeout(() => {
        q.textContent = '“' + verses[i].q + '”';
        r.textContent = verses[i].r;
        q.style.opacity = 1;
        $$('#verseDots button').forEach((b, j) => b.classList.toggle('active', j === i));
      }, 250);
    }
    show(idx);
    let timer = setInterval(() => show((idx + 1) % verses.length), 9000);
    if (card) {
      card.addEventListener('pointerenter', () => clearInterval(timer));
      card.addEventListener('pointerleave', () => { timer = setInterval(() => show((idx + 1) % verses.length), 9000); });
    }
  })();

  // ---------- Happiness slide deck ----------
  (function () {
    const stage = $('#deckStage');
    if (!stage) return;
    const slides = $$('.slide', stage);
    const dots = $('#deckDots');
    const prev = $('#deckPrev');
    const next = $('#deckNext');
    if (!slides.length) return;
    let idx = 0;

    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.addEventListener('click', () => show(i));
      dots.appendChild(b);
    });

    function show(i) {
      idx = Math.max(0, Math.min(slides.length - 1, i));
      slides.forEach((s, j) => s.classList.toggle('active', j === idx));
      $$('#deckDots button').forEach((b, j) => b.classList.toggle('active', j === idx));
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === slides.length - 1;
    }
    if (prev) prev.addEventListener('click', () => show(idx - 1));
    if (next) next.addEventListener('click', () => show(idx + 1));

    document.addEventListener('keydown', (e) => {
      const r = $('#deck').getBoundingClientRect();
      if (r.top > window.innerHeight || r.bottom < 0) return;
      if (e.key === 'ArrowLeft')  show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });

    let startX = 0;
    stage.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      const dx = (e.changedTouches[0].clientX - startX);
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });

    show(0);
  })();

  // ---------- Lightbox ----------
  (function () {
    const box = $('#lightbox');
    if (!box) return;
    const img = box.querySelector('img');
    const open = (src) => { img.src = src; box.classList.add('show'); box.setAttribute('aria-hidden', 'false'); };
    const close = () => { box.classList.remove('show'); box.setAttribute('aria-hidden', 'true'); };

    $$('[data-lightbox]').forEach(el => {
      el.addEventListener('click', () => {
        const i = el.querySelector('img');
        if (i) open(i.src);
      });
    });
    box.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  })();

  // ---------- Share ----------
  (function () {
    const btn = $('#shareBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const data = { title: 'ISKCON Salem Stone Temple', text: 'A timeless offering in stone.', url: location.href };
      if (navigator.share) { try { await navigator.share(data); } catch {} }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(location.href); toast('Link copied to clipboard'); }
      else { prompt('Copy this link:', location.href); }
    });
  })();

  // ---------- Back to top ----------
  (function () {
    const btn = $('#topBtn');
    if (!btn) return;
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();

  // ---------- Newsletter ----------
  (function () {
    const f = $('#newsForm');
    if (!f) return;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      f.reset();
      toast('🙏 Hare Krishna — thank you for subscribing!');
    });
  })();

  // ---------- Bilingual EN ↔ TA ----------
  (function () {
    const dict = {
      'A timeless offering': 'காலத்தைக் கடந்த ஒரு காணிக்கை',
      'in stone.': 'கல்லில்.',
      'Sri Sri Radha Madhava · Salem': 'ஸ்ரீ ஸ்ரீ ராதா மாதவ · சேலம்',
      'Be part of building the Sri Sri Radha Madhava Stone Temple at ISKCON Salem — your name etched into a sanctuary that will breathe bhakti for centuries.':
        'சேலம் இஸ்கான் ஸ்ரீ ஸ்ரீ ராதா மாதவ கற்கோயில் கட்டுமானத்தில் பங்கேற்கவும் — பக்தியை நூற்றாண்டுகளாக சுவாசிக்கும் ஆலயத்தில் உங்கள் பெயர் பொறிக்கப்படும்.',
      'Sponsor a Sacred Stone': 'புனிதக் கல் ஸ்பான்சர் செய்க',
      'Discover the Vision': 'நோக்கத்தைக் காண',
      'days of devotion': 'பக்தி நாட்கள்',
      'sacred pillars': 'புனித தூண்கள்',
      'blessings shared': 'ஆசிகள் பகிரப்பட்டன',
      'Donate': 'நன்கொடை',
      'The Vision': 'நோக்கம்',
      'Sponsor a Stone': 'ஒரு கல்லை ஸ்பான்சர் செய்க',
      'Sponsor': 'ஸ்பான்சர்',
      'Construction': 'கட்டுமானம்',
      'Construction Updates': 'கட்டுமான புதுப்பிப்புகள்',
      'Chant': 'ஜபம்',
      'How to Chant': 'எப்படி ஜபம் செய்வது',
      'Happiness': 'மகிழ்ச்சி',
      'How to be Happy': 'எப்படி மகிழ்ச்சியாய் இருப்பது',
      'Blessings': 'ஆசிகள்',
      'Spiritual Blessings': 'ஆன்மீக ஆசிகள்',
      'Contact': 'தொடர்பு',
      'Daily Aarti': 'தினசரி ஆரத்தி',
      'Programs': 'நிகழ்ச்சிகள்',
      'Connect': 'தொடர்பு',
      'Home': 'முகப்பு',
      'Last opportunity': 'கடைசி வாய்ப்பு',
      'to take part in this Divine Service.': 'இந்த தெய்வீக சேவையில் பங்கேற்க.',
      'Sponsor Now': 'இப்போது ஸ்பான்சர் செய்க',
      'Talk to a Devotee': 'பக்தருடன் பேசு',
      'A timeless offering in stone — your name etched into a sanctuary that will breathe bhakti for centuries.':
        'கல்லில் ஒரு காலத்தைக் கடந்த காணிக்கை — பக்தியை நூற்றாண்டுகளாக சுவாசிக்கும் ஆலயத்தில் உங்கள் பெயர் பொறிக்கப்படும்.',
      'Hare Krishna · Hare Rāma': 'ஹரே கிருஷ்ணா · ஹரே ராம',
      'A stone laid today will outlive us by centuries. The deity will know your name.':
        'இன்று வைக்கப்படும் ஒரு கல் நம்மை விட நூற்றாண்டுகள் வாழும். தெய்வம் உங்கள் பெயரை அறியும்.',
      'Visit Main Site': 'முதன்மை தளம்'
    };
    let lang = localStorage.getItem('iskcon-lang') || 'en';

    function apply() {
      const ta = lang === 'ta';
      $$('[data-tr]').forEach(el => {
        const src = el.dataset.tr;
        el.textContent = ta && dict[src] ? dict[src] : src;
      });
      $$('[data-tr-lang]').forEach(el => { el.textContent = ta ? 'English' : 'தமிழ்'; });
      document.documentElement.lang = ta ? 'ta' : 'en';
    }
    function toggle() {
      lang = lang === 'en' ? 'ta' : 'en';
      localStorage.setItem('iskcon-lang', lang);
      apply();
      toast(lang === 'ta' ? 'மொழி: தமிழ்' : 'Language: English');
    }
    $$('#lang-toggle, #lang-toggle-2').forEach(b => b.addEventListener('click', toggle));
    apply();
  })();
})();
