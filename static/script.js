(() => {
  'use strict';

  let COURSES = [];
  const LEVELS = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  const SORTS = [
    ['students:desc', 'Most popular'], ['rating:desc', 'Highest rated'], ['rating:asc', 'Lowest rated'],
    ['price:asc', 'Price: low to high'], ['price:desc', 'Price: high to low'],
    ['hours:asc', 'Shortest first'], ['hours:desc', 'Longest first'],
    ['level:asc', 'Level: beginner first'], ['level:desc', 'Level: advanced first'],
    ['title:asc', 'Title: A–Z'], ['title:desc', 'Title: Z–A']
  ];

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('upclick:' + key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('upclick:' + key, JSON.stringify(value)); } catch { }
    },
    del(key) {
      try { localStorage.removeItem('upclick:' + key); } catch { }
    }
  };
  const session = {
    get(key, fallback) {
      try { const v = sessionStorage.getItem('upclick:' + key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { sessionStorage.setItem('upclick:' + key, JSON.stringify(value)); } catch { }
    },
    del(key) {
      try { sessionStorage.removeItem('upclick:' + key); } catch { }
    }
  };
  const state = {
    enrolled: {},
    myReviews: {},
    user: null,
    token: store.get('token', null),
    session: session.get('session', { lessons: 0, enrolled: 0 }),
    catalog: { q: '', category: 'All', level: 'All', sort: 'students', dir: 'desc' },
    profile: { filter: 'all', sort: 'recent' }
  };
  const save = () => { session.set('session', state.session); };

  class ApiError extends Error {
    constructor(message, status) { super(message); this.status = status; }
  }
  const errMsg = data => {
    const d = data && data.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d.length) return d.map(e => String(e.msg || '').replace(/^Value error, /, '')).join(' ');
    return 'Something went wrong. Please try again.';
  };
  async function api(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    let res;
    try {
      res = await fetch('/api' + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new ApiError('Can’t reach the UpClick server. Check that it is running.', 0);
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && state.token) endSession(true);
      throw new ApiError(errMsg(data), res.status);
    }
    return data;
  }
  const fromApi = e => ({
    done: [...e.done],
    enrolledAt: Date.parse(e.enrolled_at),
    completedAt: e.completed_at ? Date.parse(e.completed_at) : null
  });
  async function loadEnrolments() {
    const [list, reviews] = await Promise.all([api('/me/enrolments'), api('/me/reviews')]);
    state.enrolled = Object.fromEntries(list.map(e => [e.course_id, fromApi(e)]));
    state.myReviews = Object.fromEntries(reviews.map(r => [r.course_id, r]));
  }
  function startSession(res) {
    state.token = res.token;
    state.user = res.user;
    store.set('token', res.token);
    loadWatched();
  }
  function endSession(expired) {
    if (state.user) {
      store.del(`watch:${state.user.id}`);
      store.del(`last:${state.user.id}`);
    }
    state.token = null;
    state.user = null;
    state.enrolled = {};
    state.myReviews = {};
    state.session = { lessons: 0, enrolled: 0 };
    watched = {};
    session.del('session');
    session.del('intent');
    store.del('token');
    updateNav();
    if (expired) toast('Your session has expired — please log in again.');
  }

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => 'R' + n.toLocaleString('en-US');
  const byId = id => COURSES.find(c => c.id === id);
  const first = name => esc(String(name || '').trim().split(/\s+/)[0]);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const currentPage = () => location.hash.replace(/^#\/?/, '').split('/')[0];
  const hl = (text, needle) => {
    const safe = esc(text);
    if (!needle) return safe;
    const n = esc(needle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(`(${n})`, 'gi'), '<mark>$1</mark>');
  };
  const RETURNING_RATE = 0.1;
  const quote = c => {
    const returning = Object.keys(state.enrolled).length > 0;
    const discount = returning ? Math.round(c.price * RETURNING_RATE) : 0;
    return { price: c.price, discount, total: c.price - discount, returning };
  };
  const pctOf = (c, e) => Math.round(e.done.length / c.modules.length * 100);
  const nextLessonOf = (c, e) => c.modules.findIndex((_, i) => !e.done.includes(i));
  const fmtDate = ms => new Date(ms).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  const stars = n => `<span class="stars" aria-label="${n} out of 5 stars"><span aria-hidden="true">${'★'.repeat(n)}<span class="stars-off">${'★'.repeat(5 - n)}</span></span></span>`;
  const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  const CHECK_SVG = '<svg class="success-check" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46"/><path d="M30 52l13 13 27-29"/></svg>';
  const HEART_SVG = `<svg viewBox="0 0 100 92" aria-hidden="true">
      <defs>
        <radialGradient id="hg1" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stop-color="#ffe3f3"/><stop offset="35%" stop-color="#f6a0d4"/>
          <stop offset="70%" stop-color="#d36ad8"/><stop offset="100%" stop-color="#8d4fd8"/>
        </radialGradient>
        <linearGradient id="hg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity=".85"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="M50 86C22 66 4 48 8 27 11 11 33 4 50 21 67 4 89 11 92 27 96 48 78 66 50 86Z" fill="url(#hg1)" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>
      <path d="M50 78C30 63 16 50 18 34c2-10 13-15 23-8" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="30" cy="26" rx="11" ry="6" transform="rotate(-30 30 26)" fill="url(#hg2)"/>
      <ellipse cx="72" cy="24" rx="6" ry="3" transform="rotate(25 72 24)" fill="#fff" opacity=".6"/>
      <circle cx="62" cy="58" r="3" fill="#fff" opacity=".35"/>
    </svg>`;

  const initials = name => String(name).replace(/^(Dr|Prof)\.\s*/, '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  const levelHTML = l => `<span class="level l${LEVELS[l]}"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>${l}</span>`;
  const ratingHTML = c => c.rating > 0
    ? `<span class="rating"><span class="star" aria-hidden="true">★</span> ${c.rating.toFixed(1)}</span>`
    : '<span class="tag tag-new">New</span>';

  function enrolButton(c, extra = '', label = 'Enrol') {
    if (state.enrolled[c.id]) return `<a class="btn btn-outline ${extra}" href="#/learn/${c.id}">Continue</a>`;
    return `<button class="btn ${extra}" type="button" data-action="enrol" data-id="${c.id}">${label}</button>`;
  }

  function field({ id, label, type = 'text', ac = 'off', value = '', rule, extra = '' }) {
    return `<div class="field" data-field="${id}">
      <label for="${id}">${label}</label>
      <input class="input" id="${id}" name="${id}" type="${type}" autocomplete="${ac}" value="${esc(value)}"
        data-rule="${rule}" aria-describedby="${id}-err" required>
      ${extra}
      <p class="error" id="${id}-err"></p>
    </div>`;
  }

  function listHead(sortable) {
    const cols = [['title', 'Course'], ['', 'Category'], ['level', 'Level'], ['hours', 'Duration'], ['rating', 'Rating'], ['price', 'Price'], ['', '']];
    return `<div class="list-head" ${sortable ? '' : 'aria-hidden="true"'}>${cols.map(([k, l]) =>
      sortable && k
        ? `<button class="sort-btn" type="button" data-action="sort" data-sort="${k}">${l} <span class="arrow" aria-hidden="true">↕</span></button>`
        : `<span>${l}</span>`).join('')}</div>`;
  }

  function courseRow(c, needle = '') {
    return `<li class="course-row">
      <div class="cell-main">
        <a class="course-title" href="#/course/${c.id}">${hl(c.title, needle)}</a>
        <div class="course-sub">${hl(c.short, needle)} · ${hl(c.instructor, needle)}</div>
      </div>
      <div class="cell" data-label="Category"><span class="tag">${esc(c.category)}</span></div>
      <div class="cell" data-label="Level">${levelHTML(c.level)}</div>
      <div class="cell" data-label="Duration">${c.hours} h</div>
      <div class="cell" data-label="Rating">${ratingHTML(c)}</div>
      <div class="cell price" data-label="Price">${money(c.price)}</div>
      <div class="cell-action">${enrolButton(c, 'btn-sm')}</div>
    </li>`;
  }

  function viewHome() {
    const popular = [...COURSES].sort((a, b) => b.students - a.students).slice(0, 4);
    const signedIn = !!state.user;
    const learners = COURSES.reduce((s, c) => s + c.students, 0);
    const categories = new Set(COURSES.map(c => c.category)).size;
    const rated = COURSES.filter(c => c.rating > 0);
    const avgRating = rated.length ? (rated.reduce((s, c) => s + c.rating, 0) / rated.length).toFixed(1) : 0;
    return `
    <section class="split divided">
      <div>
        <p class="eyebrow">${signedIn ? `Welcome back, ${first(state.user.name)}` : 'Online coding school'}</p>
        <h1 class="display">Let’s<br>get<br><span class="shadow-text">coding</span></h1>
        <p class="lead">Short, hands-on courses that take you from your first line of code to real projects — with a certificate waiting at the finish line.</p>
        <div class="actions">
          <a class="btn" href="#/courses">Browse courses</a>
          <a class="btn btn-outline" href="${signedIn ? '#/profile' : '#/signup'}">${signedIn ? 'Continue learning' : 'Sign up free'}</a>
        </div>
      </div>
      <div>
        <div class="code-card">
          <div class="dots"><i></i><i></i><i></i><span class="file">first-lesson.js</span></div>
          <pre id="typed" aria-label="Example JavaScript code"></pre>
          <div class="code-out" id="codeOut" hidden></div>
          <div class="run-row">
            <p class="hint">Go on — press it.</p>
            <button class="btn btn-sm" type="button" data-action="run-code" id="runBtn" disabled>▶ Run</button>
          </div>
        </div>
      </div>
    </section>

    <section class="container stats" aria-label="UpClick in numbers">
      <div class="stat reveal"><strong data-count="${learners}">0</strong><span>enrolments</span></div>
      <div class="stat reveal"><strong data-count="${COURSES.length}">0</strong><span>courses</span></div>
      <div class="stat reveal"><strong data-count="${categories}">0</strong><span>topic areas</span></div>
      <div class="stat reveal"><strong data-count="${avgRating}" data-decimals="1">0</strong><span>average rating</span></div>
    </section>

    <section class="container">
      <div class="section-head">
        <h2 class="h2">Popular right now</h2>
        <a class="btn btn-ghost" href="#/courses">See all courses →</a>
      </div>
      <div class="list reveal">${listHead(false)}<ul class="course-list">${popular.map(c => courseRow(c)).join('')}</ul></div>
    </section>

    <section class="container">
      <h2 class="h2">How it works</h2>
      <ol class="steps">
        <li class="reveal"><div><h3>Pick a course and enrol</h3><p>Search the catalogue, watch a free preview lesson, then enrol with one button.</p></div></li>
        <li class="reveal"><div><h3>Watch and code along</h3><p>Short video lessons with real code. Your progress per course is always visible in your Profile.</p></div></li>
        <li class="reveal"><div><h3>Earn your certificate</h3><p>Finish the last lesson to earn a certificate with your name on it, kept in your Profile for good.</p></div></li>
      </ol>
    </section>

    <section class="cta-band reveal">
      <h2>Your first certificate is <span class="accent">closer than you think.</span></h2>
      <a class="btn btn-white" href="${signedIn ? '#/courses' : '#/signup'}">${signedIn ? 'Find your next course' : 'Start for free'}</a>
    </section>`;
  }

  function viewCourses() {
    const c = state.catalog;
    const cats = ['All', ...new Set(COURSES.map(x => x.category))];
    return `
    <section class="container">
      <p class="eyebrow">Catalogue</p>
      <h1 class="h1">All <span class="shadow-text">courses</span></h1>
      <p class="lead">Search, filter and sort every course in one clear list. Click any course to read the full description.</p>

      <div class="toolbar">
        <label class="search">
          <span class="sr-only">Search courses</span>${ICON_SEARCH}
          <input id="q" type="search" placeholder="Search courses, topics or instructors" value="${esc(c.q)}" autocomplete="off">
          <kbd aria-hidden="true">/</kbd>
        </label>
        <label class="sr-only" for="level">Level</label>
        <select id="level" class="select">
          ${['All', 'Beginner', 'Intermediate', 'Advanced'].map(l => `<option value="${l}" ${l === c.level ? 'selected' : ''}>${l === 'All' ? 'All levels' : l}</option>`).join('')}
        </select>
        <label class="sr-only" for="sort">Sort by</label>
        <select id="sort" class="select">
          ${SORTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
        </select>
      </div>

      <div class="chips" role="group" aria-label="Filter by category">
        ${cats.map(x => `<button class="chip" type="button" data-action="cat" data-cat="${x}" aria-pressed="${x === c.category}">${x}</button>`).join('')}
      </div>

      <p class="result-count" id="count" aria-live="polite"></p>
      <div class="list">${listHead(true)}<ul class="course-list" id="courseList"></ul></div>
    </section>`;
  }

  function filteredCourses() {
    const { q, category, level, sort, dir } = state.catalog;
    const needle = q.trim().toLowerCase();
    const list = COURSES.filter(c =>
      (category === 'All' || c.category === category) &&
      (level === 'All' || c.level === level) &&
      (!needle || [c.title, c.short, c.category, c.level, c.instructor, ...c.modules].join(' ').toLowerCase().includes(needle)));
    const val = c => sort === 'level' ? LEVELS[c.level] : c[sort];
    list.sort((a, b) => {
      const A = val(a), B = val(b);
      const r = typeof A === 'string' ? A.localeCompare(B) : A - B;
      return dir === 'asc' ? r : -r;
    });
    return list;
  }

  function renderCourseList() {
    const ul = $('#courseList');
    if (!ul) return;
    const list = filteredCourses();
    const needle = state.catalog.q.trim();
    ul.innerHTML = list.length
      ? list.map(c => courseRow(c, needle)).join('')
      : `<li class="empty"><p>No courses match ${needle ? `“<strong>${esc(needle)}</strong>”` : 'these filters'}.</p>
           <button class="btn btn-outline btn-sm" type="button" data-action="clear-filters">Clear search & filters</button></li>`;
    $('#count').textContent = `Showing ${plural(list.length, 'course')}`;
    const { sort, dir } = state.catalog;
    $$('.sort-btn').forEach(b => {
      const on = b.dataset.sort === sort;
      b.dataset.active = String(on);
      b.querySelector('.arrow').textContent = on ? (dir === 'asc' ? '↑' : '↓') : '↕';
      b.setAttribute('aria-label', `Sort by ${b.textContent.replace(/[↑↓↕]/g, '').trim()}${on ? (dir === 'asc' ? ', ascending' : ', descending') : ''}`);
    });
    const sel = $('#sort');
    if (sel) sel.value = `${sort}:${dir}`;
  }

  function previewCard(c) {
    return `<button class="preview-card" type="button" data-action="play-lesson" data-id="${c.id}" data-i="0" aria-label="Watch the free preview: lesson 1, ${esc(c.modules[0])}">
      <span class="pc-screen"><span class="pc-file">${esc(lessonCode(c, 0).file)}</span>
        <span class="pc-play">${PLAY_SVG}</span>
        <span class="pc-cam" aria-hidden="true">${esc(initials(c.instructor))}</span></span>
      <span class="pc-cap"><strong>${state.enrolled[c.id] ? 'Lesson 1' : 'Free preview'}</strong> · ${esc(c.modules[0])} · ${fmtTime(lessonSecs(c, 0))}</span>
    </button>`;
  }

  function viewCourse(id) {
    const c = byId(id);
    if (!c) return viewNotFound();
    const e = state.enrolled[c.id];
    const owned = !!e;
    const q = quote(c);
    const totalSecs = c.modules.reduce((s, _, i) => s + lessonSecs(c, i), 0);
    const related = COURSES.filter(x => x.category === c.category && x.id !== c.id).slice(0, 3);
    const forWho = { Beginner: 'No experience needed — perfect if this is your first time with the topic.', Intermediate: 'You know the basics and want to build real projects with confidence.', Advanced: 'You are comfortable coding and want deep, practical skills.' }[c.level];
    return `
    <section class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/courses">← All courses</a></nav>
      <div class="detail">
        <div>
          <span class="tag">${esc(c.category)}</span>
          <h1 class="h1" style="margin-top:10px">${esc(c.title)}</h1>
          <p class="lead dark">${esc(c.description)}</p>
          <ul class="meta-row">
            <li>${levelHTML(c.level)}</li>
            <li>${c.hours} hours · ${plural(c.modules.length, 'video lesson')}</li>
            <li>${ratingHTML(c)} (${c.students.toLocaleString('en-US')} learners)</li>
            <li>Taught by <strong>${esc(c.instructor)}</strong></li>
          </ul>
          <nav class="section-tabs" aria-label="On this page">
            <button type="button" data-action="jump" data-target="sec-overview">Overview</button>
            <button type="button" data-action="jump" data-target="sec-curriculum">Curriculum</button>
            <button type="button" data-action="jump" data-target="sec-reviews">Reviews</button>
          </nav>

          <section id="sec-overview" class="course-sec">
            <h2 class="h3">Overview</h2>
            <div class="overview-grid">
              <div><h3 class="mini-h">What you’ll learn</h3><ul class="perks">${c.modules.slice(0, 4).map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>
              <div><h3 class="mini-h">Who it’s for</h3><p>${forWho}</p></div>
            </div>
          </section>

          <section id="sec-curriculum" class="course-sec">
            <h2 class="h3">Curriculum <span class="hint">${plural(c.modules.length, 'lesson')} · ${fmtTime(totalSecs)} of video</span></h2>
            <ol class="modules">
              ${c.modules.map((m, i) => {
                const playable = owned || i === 0;
                const done = owned && e.done.includes(i);
                return `<li class="${done ? 'mod-done' : ''}"><span class="mod-num">${String(i + 1).padStart(2, '0')}</span><span>${esc(m)}${done ? ' <span class="mod-tick" aria-label="completed">✓</span>' : ''}</span><span class="mod-time">${playable
                  ? `<button class="mod-play" type="button" data-action="play-lesson" data-id="${c.id}" data-i="${i}" aria-label="${owned ? 'Play' : 'Preview'} lesson ${i + 1}: ${esc(m)}">${PLAY_SVG}${owned ? 'Play' : 'Preview'}</button>`
                  : `<span class="mod-lock" title="Enrol to unlock">${LOCK_SVG}<span class="sr-only">Locked</span></span>`}<span class="mod-len">${fmtTime(lessonSecs(c, i))}</span></span></li>`;
              }).join('')}
            </ol>
            <div class="finish-note"><span>${owned && e.completedAt ? 'You completed this course. Your certificate is saved in Profile → Certificates.' : `Finish all ${c.modules.length} lessons to earn your personalised certificate. It stays in your Profile under Certificates.`}</span></div>
          </section>

          <section id="sec-reviews" class="course-sec">
            <h2 class="h3">Reviews</h2>
            <div id="reviews" data-id="${c.id}"><p class="hint">Loading reviews…</p></div>
          </section>
        </div>
        <aside class="buy-box" aria-label="${owned ? 'Your progress' : 'Enrol'}">
          ${previewCard(c)}
          ${owned
            ? `<p class="eyebrow" style="margin-top:14px">${e.completedAt ? 'Completed' : 'You’re enrolled'}</p>
               <div class="progress" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pctOf(c, e)}"><i style="width:${pctOf(c, e)}%"></i></div>
               <p class="hint">${e.done.length} of ${plural(c.modules.length, 'lesson')} done</p>
               <a class="btn btn-block" href="#/learn/${c.id}">${e.completedAt ? 'Open course' : 'Continue learning'}</a>
               ${e.completedAt ? `<a class="btn btn-ghost btn-block" href="#/certificate/${c.id}">View certificate</a>` : ''}`
            : `<div class="price-lg">${q.discount ? `<s class="was">${money(q.price)}</s> ` : ''}${money(q.total)}</div>
               <p class="hint">${q.discount ? 'Returning learner: 10% off · ' : ''}One payment · lifetime access</p>
               ${enrolButton(c, 'btn-block', `Enrol now · ${money(q.total)}`)}`}
          <ul class="perks">
            <li>${c.modules.length} video lessons with code-along exercises</li>
            <li>Certificate of completion, kept in your Profile</li>
            <li>Learn at your own pace</li>
            <li>10% off every course after your first</li>
          </ul>
        </aside>
      </div>
    </section>
    ${related.length ? `<section class="container">
      <h2 class="h2">More in ${esc(c.category)}</h2>
      <div class="list">${listHead(false)}<ul class="course-list">${related.map(r => courseRow(r)).join('')}</ul></div>
    </section>` : ''}`;
  }

  function reviewsHTML(c, data) {
    const e = state.enrolled[c.id];
    const mine = state.myReviews[c.id];
    const counts = [5, 4, 3, 2, 1].map(n => [n, data.reviews.filter(r => r.rating === n).length]);
    const summary = data.count
      ? `<div class="rv-summary"><div class="rv-avg"><strong>${data.average.toFixed(1)}</strong>${stars(Math.round(data.average))}<span class="hint">${plural(data.count, 'learner review')}</span></div>
          <ul class="rv-bars">${counts.map(([n, k]) => `<li><span>${n}</span><span class="rv-bar"><i style="width:${data.count ? k / data.count * 100 : 0}%"></i></span><span class="hint">${k}</span></li>`).join('')}</ul></div>`
      : '<p class="hint">No learner reviews yet.</p>';
    const form = e ? reviewForm(c, mine)
      : `<p class="rv-cta">${state.user ? 'Enrol in this course to rate it.' : '<a href="#/login">Log in</a> and enrol to rate this course.'}</p>`;
    const list = data.reviews.length ? `<ul class="rv-list">${data.reviews.map(r => `<li>
        <div class="rv-head"><strong>${esc(r.name)}${r.mine ? ' <span class="tag">You</span>' : ''}</strong>${stars(r.rating)}<span class="hint">${fmtDate(Date.parse(r.updated_at))}</span></div>
        ${r.comment ? `<p>${esc(r.comment)}</p>` : ''}</li>`).join('')}</ul>` : '';
    return summary + form + list;
  }

  function reviewForm(c, mine) {
    return `<form class="rv-form" id="reviewForm" data-id="${c.id}">
      <fieldset><legend class="mini-h">${mine ? 'Update your rating' : 'Rate this course'}</legend>
        <div class="star-pick">${[5, 4, 3, 2, 1].map(n => `<input type="radio" id="rv${n}" name="rating" value="${n}" ${mine && mine.rating === n ? 'checked' : ''}><label for="rv${n}" title="${n} star${n > 1 ? 's' : ''}"><span class="sr-only">${n} out of 5</span>★</label>`).join('')}</div>
      </fieldset>
      <label class="lbl" for="rvText">What should other learners know? <span class="hint">(optional)</span></label>
      <textarea class="input" id="rvText" maxlength="1000" rows="3">${mine ? esc(mine.comment) : ''}</textarea>
      <p class="error" id="rvErr" role="alert"></p>
      <button class="btn btn-sm" type="submit">${mine ? 'Update review' : 'Post review'}</button>
    </form>`;
  }

  function viewAuth(mode) {
    if (state.user) {
      return `<section class="container empty-state signed-in">
        <h1 class="h2">You’re signed in as ${esc(state.user.name)}</h1>
        <div class="actions"><a class="btn" href="#/profile">Go to my Profile</a><button class="btn btn-outline" type="button" data-action="logout">Log out</button></div>
      </section>`;
    }
    const signup = mode === 'signup';
    const intent = session.get('intent', null);
    const intentCourse = intent && byId(intent.enrol);
    return `
    <section class="split divided auth-split">
      <div class="auth-side">
        <h1 class="display auth-display">Let’s<br>get<br><span class="shadow-text">coding</span></h1>
        <ul class="ticks">
          <li>Free account, no card needed</li>
          <li>Progress saved for every course</li>
          <li>Certificates kept in your Profile</li>
        </ul>
      </div>
      <div>
        <div class="auth-card">
          ${intentCourse ? `<p class="auth-intent">${signup ? 'Create an account' : 'Log in'} to enrol in <strong>${esc(intentCourse.title)}</strong>.</p>` : ''}
          <div class="tabs" role="tablist" aria-label="Account">
            <a class="tab" role="tab" href="#/signup" aria-selected="${signup}">Sign up</a>
            <a class="tab" role="tab" href="#/login" aria-selected="${!signup}">Log in</a>
          </div>
          <div class="social">
            <button class="btn btn-outline btn-sm" type="button" data-action="social" data-p="Google">Continue with Google</button>
            <button class="btn btn-outline btn-sm" type="button" data-action="social" data-p="GitHub">Continue with GitHub</button>
          </div>
          <div class="divider">or use your email</div>
          <form id="authForm" data-mode="${mode}" novalidate>
            <h2 class="sr-only">${signup ? 'Sign up' : 'Log in'}</h2>
            ${signup ? field({ id: 'name', label: 'Full name', ac: 'name', rule: 'name' }) : ''}
            ${field({ id: 'email', label: 'Email', type: 'email', ac: 'email', rule: 'email' })}
            <div class="field has-toggle" data-field="password">
              <label for="password">Password ${signup ? '<span class="hint">(8+ characters)</span>' : ''}</label>
              <input class="input" id="password" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}"
                data-rule="${signup ? 'password' : 'loginPassword'}" aria-describedby="password-err${signup ? ' pw-strength' : ''}" required>
              <button class="toggle-pw" type="button" data-action="toggle-pw" aria-controls="password" aria-pressed="false">Show</button>
              ${signup ? `<div class="strength" id="pw-strength"><div class="meter"><i id="pwMeter"></i></div><span id="pwLabel">Strength</span></div>` : ''}
              <p class="error" id="password-err"></p>
            </div>
            ${signup ? '' : '<div class="form-row"><a class="small-link" href="#" data-action="forgot">Forgot password?</a></div>'}
            <button class="btn btn-block" type="submit">${signup ? 'Create account' : 'Log in'}</button>
          </form>
          <p class="switch">${signup ? 'Already have an account? <a href="#/login">Log in</a>' : 'New to UpClick? <a href="#/signup">Create an account</a>'}</p>
        </div>
      </div>
    </section>`;
  }

  function viewAbout() {
    const loves = store.get('loves', 0);
    const values = [
      ['Learn by doing', 'Every lesson ends with code you wrote yourself. Reading is good; building is better.'],
      ['Clear, honest pricing', 'One price, lifetime access, and 10% off every course after your first.'],
      ['Celebrate progress', 'Small wins add up. We mark every milestone, and every finished course ends with your own certificate.'],
      ['Listen and improve', 'Your feedback shapes what we build next. Tell us what works and what doesn’t.']
    ];
    return `<div class="about-page">
    <section class="split">
      <div>
        <p class="eyebrow">About us</p>
        <h1 class="h1 big">The UpClick <span class="shadow-text">Promise</span></h1>
        <p class="lead dark">We aim to provide the best learning experience possible. If you think you can find better, tell us — so we can become the number <span class="accent strong">1</span> brand in your life again.</p>
        <div class="actions">
          <a class="btn" href="#/courses">Start learning</a>
          <a class="btn btn-outline" href="#/help">Get help or contact us</a>
        </div>
      </div>
      <div class="heart-wrap">
        <button class="heart-btn" type="button" data-action="heart" aria-label="Send UpClick some love">${HEART_SVG}</button>
        <p class="hint" id="loveCount" aria-live="polite">${loves ? `${plural(loves, 'heart')} sent` : 'Tap the heart'}</p>
      </div>
    </section>
    <section class="container">
      <h2 class="h2">What we stand for</h2>
      <ol class="values">
        ${values.map(([t, d], i) => `<li class="reveal"><span class="v-num" aria-hidden="true">0${i + 1}</span><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}
      </ol>
    </section>
    <section class="cta-band reveal">
      <h2>Ready to write your <span class="accent">first line?</span></h2>
      <a class="btn btn-white" href="#/courses">Explore courses</a>
    </section>
    </div>`;
  }

  function learnItem(c, startPct) {
    const e = state.enrolled[c.id];
    const pct = Math.round(e.done.length / c.modules.length * 100);
    const shown = startPct ?? pct;
    return `<article class="learn-item ${e.completedAt ? 'complete' : ''}" data-id="${c.id}">
      <div class="learn-head">
        <div><p class="eyebrow">My course</p><h1 class="h2 learn-title">${esc(c.title)}</h1><p class="course-sub">${esc(c.instructor)} · ${plural(c.modules.length, 'video lesson')} · <a href="#/course/${c.id}">Course page and reviews</a></p></div>
        <div class="pct" data-pct>${shown}%</div>
      </div>
      <div class="progress" role="progressbar" aria-label="${esc(c.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${shown}%"></i></div>
      <ol class="lessons">
        ${c.modules.map((m, i) => {
          const d = e.done.includes(i);
          const secs = lessonSecs(c, i);
          const part = !d && watched[watchKey(c.id, i)] ? Math.round(watched[watchKey(c.id, i)] / secs * 100) : 0;
          return `<li class="lesson ${d ? 'done' : ''}">
            <button class="check" type="button" data-action="lesson" data-id="${c.id}" data-i="${i}" aria-pressed="${d}" aria-label="Lesson ${i + 1}: ${esc(m)} — ${d ? 'completed' : 'mark complete'}">${d ? '✓' : ''}</button>
            <button class="lesson-play" type="button" data-action="play-lesson" data-id="${c.id}" data-i="${i}" aria-label="Play video for lesson ${i + 1}: ${esc(m)}, ${fmtTime(secs)}${part ? `, ${part}% watched` : ''}">
              <span class="play-dot">${PLAY_SVG}</span><span class="lesson-title">${esc(m)}</span><span class="lesson-len">${part ? `${part}% · ` : ''}${fmtTime(secs)}</span>
              ${part ? `<span class="lesson-watch"><i style="width:${part}%"></i></span>` : ''}
            </button></li>`;
        }).join('')}
      </ol>
      ${e.completedAt
        ? `<a class="btn" href="#/certificate/${c.id}">View certificate</a>`
        : `<button class="btn btn-sm" type="button" data-action="next-lesson" data-id="${c.id}"><span class="btn-ic">${PLAY_SVG}</span>Play next lesson</button>`}
    </article>`;
  }

  function viewLoginNeeded(title) {
    return `<section class="container empty-state">
      <h1 class="h2">${title}</h1>
      <p class="lead" style="margin-inline:auto">Your courses, progress and certificates are saved to your account, so you can pick up on any device.</p>
      <div class="actions"><a class="btn" href="#/login">Log in</a><a class="btn btn-outline" href="#/signup">Create a free account</a></div>
    </section>`;
  }

  function myCourses() {
    return Object.keys(state.enrolled).map(byId).filter(Boolean);
  }

  function lastActive() {
    const last = state.user ? store.get(`last:${state.user.id}`, null) : null;
    const list = myCourses().filter(c => !state.enrolled[c.id].completedAt);
    if (last && list.some(c => c.id === last.id)) return byId(last.id);
    return list.sort((a, b) => state.enrolled[b.id].enrolledAt - state.enrolled[a.id].enrolledAt)[0] || null;
  }

  function continueCard(c) {
    const e = state.enrolled[c.id];
    const n = nextLessonOf(c, e);
    const pct = pctOf(c, e);
    return `<section class="continue-card" aria-label="Continue where you left off">
      <div class="cc-text">
        <p class="eyebrow">Continue where you left off</p>
        <h2 class="h3"><a href="#/learn/${c.id}">${esc(c.title)}</a></h2>
        <div class="progress" role="progressbar" aria-label="${esc(c.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
        <p class="hint">${pct}% · ${e.done.length} of ${plural(c.modules.length, 'lesson')} done</p>
      </div>
      <div class="cc-next">
        <p class="mini-h">Next lesson</p>
        <p class="cc-lesson">${n + 1}. ${esc(c.modules[n])} <span class="hint">${fmtTime(lessonSecs(c, n))}</span></p>
        <button class="btn" type="button" data-action="play-lesson" data-id="${c.id}" data-i="${n}"><span class="btn-ic">${PLAY_SVG}</span>Play next lesson</button>
      </div>
    </section>`;
  }

  function courseCard(c) {
    const e = state.enrolled[c.id];
    const pct = pctOf(c, e);
    const n = nextLessonOf(c, e);
    const status = e.completedAt ? 'Completed' : e.done.length ? 'In progress' : 'Not started';
    return `<li class="pc-card ${e.completedAt ? 'complete' : ''}">
      <div class="pc-top"><span class="tag">${esc(c.category)}</span><span class="pc-status">${status}</span></div>
      <h3 class="pc-title"><a href="#/learn/${c.id}">${esc(c.title)}</a></h3>
      <p class="course-sub">${esc(c.instructor)} · enrolled ${fmtDate(e.enrolledAt)}</p>
      <div class="progress" role="progressbar" aria-label="${esc(c.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
      <p class="pc-meta"><strong>${pct}%</strong><span class="hint">${e.done.length} of ${plural(c.modules.length, 'lesson')}</span></p>
      <p class="pc-next hint">${e.completedAt ? `Finished ${fmtDate(e.completedAt)}` : `Next: ${esc(c.modules[n])}`}</p>
      <div class="actions">
        <a class="btn btn-sm" href="#/learn/${c.id}">${e.completedAt ? 'Open course' : 'Continue'}</a>
        ${e.completedAt ? `<a class="btn btn-outline btn-sm" href="#/certificate/${c.id}">Certificate</a>` : ''}
      </div>
    </li>`;
  }

  function sortedMyCourses() {
    const { filter, sort } = state.profile;
    const list = myCourses().filter(c => {
      const e = state.enrolled[c.id];
      if (filter === 'progress') return !e.completedAt && e.done.length > 0;
      if (filter === 'done') return !!e.completedAt;
      if (filter === 'new') return e.done.length === 0;
      return true;
    });
    const by = {
      recent: (a, b) => state.enrolled[b.id].enrolledAt - state.enrolled[a.id].enrolledAt,
      most: (a, b) => pctOf(b, state.enrolled[b.id]) - pctOf(a, state.enrolled[a.id]),
      least: (a, b) => pctOf(a, state.enrolled[a.id]) - pctOf(b, state.enrolled[b.id]),
      title: (a, b) => a.title.localeCompare(b.title)
    }[sort];
    return list.sort(by);
  }

  function milestones() {
    const items = [];
    myCourses().forEach(c => {
      const e = state.enrolled[c.id];
      items.push({ at: e.enrolledAt, text: `Enrolled in <strong>${esc(c.title)}</strong>` });
      if (e.completedAt) items.push({ at: e.completedAt, text: `Completed <strong>${esc(c.title)}</strong> and earned a certificate`, big: true });
    });
    Object.values(state.myReviews).forEach(r => {
      const c = byId(r.course_id);
      if (c) items.push({ at: Date.parse(r.updated_at), text: `Rated <strong>${esc(c.title)}</strong> ${r.rating}/5` });
    });
    return items.sort((a, b) => b.at - a.at).slice(0, 8);
  }

  function profileCourses() {
    const all = myCourses();
    if (!all.length) {
      return `<div class="empty-state slim"><h2 class="h3">No courses yet</h2>
        <p class="hint">Enrol in a course and your progress, next lesson and certificates will appear here.</p>
        <a class="btn" href="#/courses">Find a course</a></div>`;
    }
    const f = state.profile;
    const ms = milestones();
    return `<div class="profile-grid">
      <div>
        <div class="toolbar slim">
          <div class="chips" role="group" aria-label="Show courses">
            ${[['all', 'All'], ['progress', 'In progress'], ['done', 'Completed'], ['new', 'Not started']].map(([k, l]) => `<button class="chip" type="button" data-action="pf-filter" data-k="${k}" aria-pressed="${f.filter === k}">${l}</button>`).join('')}
          </div>
          <label class="sr-only" for="pfSort">Sort courses</label>
          <select class="select select-sm" id="pfSort">
            ${[['recent', 'Recently enrolled'], ['most', 'Most progress'], ['least', 'Least progress'], ['title', 'Title A–Z']].map(([k, l]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <ul class="pc-grid" id="pcGrid">${sortedMyCourses().map(courseCard).join('') || '<li class="hint">No courses match this filter.</li>'}</ul>
      </div>
      <aside class="milestones" aria-label="Milestone history">
        <h2 class="mini-h">Milestones</h2>
        <ol>${ms.map(m => `<li class="${m.big ? 'ms-big' : ''}"><span class="ms-date">${fmtDate(m.at)}</span><span>${m.text}</span></li>`).join('')}</ol>
      </aside>
    </div>`;
  }

  function profileCertificates() {
    const done = myCourses().filter(c => state.enrolled[c.id].completedAt)
      .sort((a, b) => state.enrolled[b.id].completedAt - state.enrolled[a.id].completedAt);
    if (!done.length) {
      const near = lastActive();
      return `<div class="empty-state slim"><h2 class="h3">No certificates yet</h2>
        <p class="hint">Finish every lesson in a course and its certificate is saved here permanently.</p>
        ${near ? `<a class="btn" href="#/learn/${near.id}">Continue ${esc(near.title)}</a>` : '<a class="btn" href="#/courses">Find a course</a>'}</div>`;
    }
    return `<ul class="cert-list">${done.map(c => {
      const e = state.enrolled[c.id];
      return `<li><span class="cert-mini" aria-hidden="true">★</span>
        <div><h3 class="pc-title">${esc(c.title)}</h3><p class="hint">Completed ${fmtDate(e.completedAt)} · ID ${certId(c, e)}</p></div>
        <div class="actions"><a class="btn btn-sm" href="#/certificate/${c.id}">View</a>
        <a class="btn btn-outline btn-sm" href="#/certificate/${c.id}" data-print="1">Download</a></div></li>`;
    }).join('')}</ul>`;
  }

  function profileReviews() {
    const list = Object.values(state.myReviews).filter(r => byId(r.course_id));
    if (!list.length) {
      return `<div class="empty-state slim"><h2 class="h3">No reviews yet</h2>
        <p class="hint">Rate a course from its page or from the bottom of the course’s lesson list.</p></div>`;
    }
    return `<ul class="rv-list mine">${list.map(r => `<li>
      <div class="rv-head"><strong><a href="#/course/${r.course_id}">${esc(byId(r.course_id).title)}</a></strong>${stars(r.rating)}<span class="hint">${fmtDate(Date.parse(r.updated_at))}</span></div>
      ${r.comment ? `<p>${esc(r.comment)}</p>` : '<p class="hint">No comment</p>'}
      <a class="small-link" href="#/learn/${r.course_id}" data-jump="rate">Edit review</a></li>`).join('')}</ul>`;
  }

  function profileAccount() {
    return `<div class="account-grid">
      <form id="accountForm" class="account-card" novalidate>
        <h2 class="h3">Your details</h2>
        ${field({ id: 'acName', label: 'Full name', ac: 'name', rule: 'name', value: state.user.name })}
        <div class="field"><label for="acEmail">Email</label><input class="input" id="acEmail" value="${esc(state.user.email)}" readonly aria-describedby="acEmailHint"><p class="hint" id="acEmailHint">Your email is your login and can’t be changed in this prototype.</p></div>
        <button class="btn btn-sm" type="submit">Save changes</button>
      </form>
      <div class="account-card">
        <h2 class="h3">Log out</h2>
        <p>Logging out clears your data from this device: your login, saved video positions and this session’s activity.</p>
        <p class="hint">Your courses, progress, certificates and reviews stay safe in your account for next time.</p>
        <button class="btn btn-outline btn-sm" type="button" data-action="logout">Log out of UpClick</button>
      </div>
    </div>`;
  }

  function viewProfile(tab = 'courses') {
    if (!state.user) return viewLoginNeeded('Log in to see your Profile');
    const tabs = [['courses', 'My courses'], ['certificates', 'Certificates'], ['reviews', 'My reviews'], ['account', 'Account']];
    if (!tabs.some(([k]) => k === tab)) tab = 'courses';
    const all = myCourses();
    const lessons = all.reduce((n, c) => n + state.enrolled[c.id].done.length, 0);
    const certs = all.filter(c => state.enrolled[c.id].completedAt).length;
    const current = lastActive();
    const body = { courses: profileCourses, certificates: profileCertificates, reviews: profileReviews, account: profileAccount }[tab]();
    return `<section class="container">
      <header class="profile-head">
        <span class="avatar avatar-lg" aria-hidden="true">${esc(initials(state.user.name))}</span>
        <div><p class="eyebrow">Profile</p><h1 class="h2">${esc(state.user.name)}</h1><p class="hint">${esc(state.user.email)}</p></div>
        <ul class="profile-stats">
          <li><strong>${all.length}</strong><span>${all.length === 1 ? 'course' : 'courses'}</span></li>
          <li><strong>${lessons}</strong><span>${lessons === 1 ? 'lesson done' : 'lessons done'}</span></li>
          <li><strong>${certs}</strong><span>${certs === 1 ? 'certificate' : 'certificates'}</span></li>
        </ul>
      </header>
      ${tab === 'courses' && current ? continueCard(current) : ''}
      <div class="ptabs" role="tablist" aria-label="Profile sections">
        ${tabs.map(([k, l]) => `<a class="ptab" role="tab" href="#/profile/${k}" aria-selected="${k === tab}">${l}${k === 'certificates' && certs ? ` <span class="count">${certs}</span>` : ''}</a>`).join('')}
      </div>
      <div class="ptab-panel" role="tabpanel">${body}</div>
    </section>`;
  }

  function viewLearn(id) {
    const c = byId(id);
    if (!c) return viewNotFound();
    if (!state.user) return viewLoginNeeded('Log in to continue this course');
    const e = state.enrolled[id];
    if (!e) { setTimeout(() => { location.replace(`#/course/${id}`); }, 0); return ''; }
    const n = nextLessonOf(c, e);
    return `<section class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/profile">← Profile</a> <span class="hint">/ My courses</span></nav>
      ${learnItem(c)}
      ${n > -1 ? '' : `<div class="finish-note done-note"><span>You finished every lesson. Your certificate is saved under Profile → Certificates.</span><a class="btn btn-sm" href="#/certificate/${c.id}">View certificate</a></div>`}
      <section class="rate-box" id="rate">
        <h2 class="h3">Rate this course</h2>
        <p class="hint">Something unclear or great in this course? Tell us here — it goes straight to the course team and helps other learners.</p>
        ${reviewForm(c, state.myReviews[c.id])}
        <p class="hint">Problem with your account or the site? <a href="#/help">Visit Help</a>.</p>
      </section>
    </section>`;
  }

  function faqItems() {
    return [
      ['How do I enrol in a course?', 'Open any course and press <strong>Enrol now</strong>. If you are not logged in, you will be asked to create a free account first, then you come straight back to finish enrolling. After enrolling you land on the course’s first lesson.'],
      ['Is there a discount if I take more than one course?', 'Yes. Your first course is full price, and every course after that is <strong>10% off</strong>. The discount is shown on the course page before you enrol.'],
      ['Where can I see my progress?', 'Go to <strong>Profile</strong> in the menu. “My courses” shows every course you are enrolled in with its progress, and the top card takes you straight to your next lesson.'],
      ['How do the video lessons work?', 'Press play on any lesson. When the video ends, the lesson is ticked off automatically and the next lesson starts after a short countdown. You can also tick a lesson yourself, change the speed or turn captions off.'],
      ['Where are my certificates?', 'Every certificate you earn is kept in <strong>Profile → Certificates</strong>, where you can view or download it at any time.'],
      ['How do I rate a course?', 'Open the course from your Profile and scroll to <strong>Rate this course</strong>, or use the Reviews section on the course page. You can update your rating later.'],
      ['What happens when I log out?', 'Logging out clears your data from this device. Your courses, progress, certificates and reviews stay saved in your account.'],
      ['Is this a real shop?', 'UpClick is a university prototype. No payment details are collected and no money is taken.']
    ];
  }

  function viewHelp() {
    const u = state.user;
    return `<section class="container">
      <p class="eyebrow">Help</p>
      <h1 class="h1">How can we <span class="shadow-text">help?</span></h1>
      <div class="help-grid">
        <section aria-labelledby="faqH">
          <h2 class="h3" id="faqH">Frequently asked questions</h2>
          <div class="faq">${faqItems().map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
        </section>
        <section class="contact-card" aria-labelledby="contactH" id="contact">
          <h2 class="h3" id="contactH">Contact us</h2>
          <p class="hint">We reply within 2 working days.</p>
          <form id="contactForm" novalidate>
            ${field({ id: 'ctName', label: 'Your name', ac: 'name', rule: 'name', value: u ? u.name : '' })}
            ${field({ id: 'ctEmail', label: 'Email', type: 'email', ac: 'email', rule: 'email', value: u ? u.email : '' })}
            <div class="field"><label for="ctTopic">Topic</label>
              <select class="input" id="ctTopic">${['Courses and enrolment', 'My account', 'Certificates', 'Technical problem', 'Something else'].map(t => `<option>${t}</option>`).join('')}</select></div>
            <div class="field"><label for="ctMsg">Message</label>
              <textarea class="input" id="ctMsg" rows="4" maxlength="2000" data-rule="message" aria-describedby="ctMsg-err"></textarea>
              <p class="error" id="ctMsg-err"></p></div>
            <button class="btn btn-block" type="submit">Send message</button>
          </form>
        </section>
      </div>
    </section>`;
  }

  function certId(c, e) {
    return 'UC-' + (e.completedAt % 1e8).toString(36).toUpperCase() + '-' + c.id.slice(0, 3).toUpperCase();
  }

  function viewCertificate(id) {
    const c = byId(id);
    const e = state.enrolled[id];
    if (!c || !e || !e.completedAt) {
      return `<section class="container empty-state">
        <h1 class="h2">Certificate locked</h1>
        <p class="lead" style="margin-inline:auto">Finish every lesson in this course to unlock your certificate.</p>
        <div class="actions"><a class="btn" href="#/profile">Go to my Profile</a></div>
      </section>`;
    }
    const name = state.user?.name || 'UpClick Learner';
    const date = new Date(e.completedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
    const next = COURSES.filter(x => !state.enrolled[x.id] && x.id !== id)
      .sort((a, b) => (b.category === c.category) - (a.category === c.category) || LEVELS[a.level] - LEVELS[b.level] || b.rating - a.rating)
      .slice(0, 3);
    return `<section class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/profile/certificates">← All my certificates</a></nav>
      <div class="certificate" id="certificate">
        <span class="logo logo-sm">UPClick</span>
        <p class="eyebrow" style="margin-top:14px">Certificate of completion</p>
        <p>This certifies that</p>
        <h1 class="cert-name">${esc(name)}</h1>
        <p>has successfully completed</p>
        <h2 class="cert-course">${esc(c.title)}</h2>
        <p class="hint">${c.hours} hours · ${plural(c.modules.length, 'lesson')} · ${date}</p>
        <div class="seal" aria-hidden="true">★</div>
        <div class="cert-sign"><span>${esc(c.instructor)}</span><small>Instructor</small></div>
        <p class="cert-id">Certificate ID: ${certId(c, e)}</p>
      </div>
      <div class="cert-actions">
        <button class="btn" type="button" data-action="print">Download / print</button>
        <button class="btn btn-outline" type="button" data-action="share" data-id="${c.id}">Copy share message</button>
      </div>
      <p class="hint center-text">This certificate is saved permanently in Profile → Certificates.</p>
    </section>
    ${next.length ? `<section class="container">
      <h2 class="h2">Keep the momentum going</h2>
      <p class="hint">Returning learners get 10% off every new course.</p>
      <div class="list">${listHead(false)}<ul class="course-list">${next.map(x => courseRow(x)).join('')}</ul></div>
    </section>` : ''}`;
  }

  function viewNotFound() {
    return `<section class="container empty-state">
      <h1 class="h2">404 — page not found</h1>
      <p class="lead" style="margin-inline:auto">That link went somewhere we haven’t built yet.</p>
      <div class="actions"><a class="btn" href="#/">Back home</a><a class="btn btn-outline" href="#/courses">Browse courses</a></div>
    </section>`;
  }

  function adminRow(c) {
    return `<li class="admin-row">
      <div>
        <a class="course-title-sm" href="#/course/${c.id}">${esc(c.title)}</a>
        <div class="course-sub">${esc(c.category)} · ${c.level} · ${c.hours} h · ${money(c.price)} · ${plural(c.students, 'enrolment')}</div>
      </div>
      <div class="actions">
        <button class="btn btn-outline btn-sm" type="button" data-action="course-edit" data-id="${c.id}">Edit</button>
        <button class="btn btn-ghost btn-sm danger" type="button" data-action="course-delete" data-id="${c.id}" aria-label="Delete ${esc(c.title)}">Delete</button>
      </div>
    </li>`;
  }

  function viewAdmin() {
    if (!state.user) return viewLoginNeeded('Log in as an admin');
    if (!state.user.is_admin) {
      return `<section class="container empty-state">
        <h1 class="h2">Admins only</h1>
        <p class="lead" style="margin-inline:auto">This page is for the UpClick team to manage courses.</p>
        <div class="actions"><a class="btn" href="#/courses">Browse courses</a></div>
      </section>`;
    }
    const list = [...COURSES].sort((a, b) => a.title.localeCompare(b.title));
    return `<section class="container">
      <p class="eyebrow">Admin</p>
      <h1 class="h1">Course <span class="shadow-text">manager</span></h1>
      <div class="admin-stats" id="adminStats"><p class="hint">Loading stats…</p></div>
      <div class="section-head">
        <h2 class="h2">Courses (${COURSES.length})</h2>
        <button class="btn" type="button" data-action="course-new">+ Add course</button>
      </div>
      <div class="list"><ul class="course-list">${list.map(adminRow).join('')}</ul></div>
      <div class="admin-cols">
        <section><h2 class="h2">Latest course reviews</h2><div id="adminReviews"><p class="hint">Loading reviews…</p></div></section>
        <section><h2 class="h2">Contact messages</h2><div id="adminMessages"><p class="hint">Loading messages…</p></div></section>
      </div>
    </section>`;
  }

  async function loadAdminSummary() {
    const stats = $('#adminStats');
    if (!stats) return;
    try {
      const s = await api('/admin/summary');
      const tiles = [
        [s.learners, 'learners'], [s.enrolments, 'enrolments'], [s.completions, 'courses completed'],
        [money(s.revenue), 'revenue (demo)'], [s.average_rating ?? '–', `avg review (${s.review_count})`]
      ];
      const when = d => new Date(d).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
      stats.innerHTML = tiles.map(([v, l]) => `<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join('');
      $('#adminReviews').innerHTML = s.recent_reviews.length
        ? `<ul class="feedback-list">${s.recent_reviews.map(r => `<li>
            <div class="fb-head"><strong>${esc(r.name)}</strong>${stars(r.rating)}<span class="hint">${esc(r.course)} · ${when(r.updated_at)}</span></div>
            ${r.comment ? `<p>${esc(r.comment)}</p>` : ''}</li>`).join('')}</ul>`
        : '<p class="hint">No reviews yet. Learners rate courses from the course page or their lesson list.</p>';
      $('#adminMessages').innerHTML = s.recent_messages.length
        ? `<ul class="feedback-list">${s.recent_messages.map(m => `<li>
            <div class="fb-head"><strong>${esc(m.name)}</strong><span class="tag">${esc(m.topic)}</span><span class="hint">${esc(m.email)} · ${when(m.created_at)}</span></div>
            <p>${esc(m.message)}</p></li>`).join('')}</ul>`
        : '<p class="hint">No messages yet. They arrive from the contact form on the Help page.</p>';
    } catch (err) {
      stats.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  }

  function openCourseForm(c) {
    const editing = !!c;
    const v = c || { title: '', category: '', level: 'Beginner', hours: '', price: '', instructor: '', short: '', description: '', modules: [] };
    const cats = [...new Set(COURSES.map(x => x.category))];
    openModal(`<p class="eyebrow">${editing ? 'Edit course' : 'New course'}</p>
      <h2 class="h3">${editing ? esc(c.title) : 'Add a course'}</h2>
      <form id="courseForm" data-id="${editing ? c.id : ''}" class="course-form">
        <div class="field"><label for="cf-title">Title</label><input class="input" id="cf-title" name="title" required minlength="3" maxlength="120" value="${esc(v.title)}"></div>
        <div class="form-grid">
          <div class="field"><label for="cf-category">Category</label><input class="input" id="cf-category" name="category" list="cf-cats" required minlength="2" maxlength="40" value="${esc(v.category)}">
            <datalist id="cf-cats">${cats.map(x => `<option value="${esc(x)}">`).join('')}</datalist></div>
          <div class="field"><label for="cf-level">Level</label><select class="input" id="cf-level" name="level">
            ${Object.keys(LEVELS).map(l => `<option ${l === v.level ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field"><label for="cf-hours">Hours</label><input class="input" id="cf-hours" name="hours" type="number" min="1" max="500" required value="${v.hours}"></div>
          <div class="field"><label for="cf-price">Price (R)</label><input class="input" id="cf-price" name="price" type="number" min="0" max="100000" required value="${v.price}"></div>
        </div>
        <div class="field"><label for="cf-instructor">Instructor</label><input class="input" id="cf-instructor" name="instructor" required minlength="2" maxlength="80" value="${esc(v.instructor)}"></div>
        <div class="field"><label for="cf-short">One-line summary <span class="hint">(shown in the list)</span></label><input class="input" id="cf-short" name="short" required minlength="5" maxlength="160" value="${esc(v.short)}"></div>
        <div class="field"><label for="cf-description">Full description</label><textarea class="input" id="cf-description" name="description" rows="4" required minlength="10" maxlength="2000">${esc(v.description)}</textarea></div>
        <div class="field"><label for="cf-modules">Lessons <span class="hint">(one per line)</span></label><textarea class="input" id="cf-modules" name="modules" rows="6" required>${esc(v.modules.join('\n'))}</textarea></div>
        <p class="error" id="courseErr" role="alert"></p>
        <button class="btn btn-block" type="submit">${editing ? 'Save changes' : 'Publish course'}</button>
      </form>`, editing ? 'Edit course' : 'Add course');
  }

  async function submitCourse(f) {
    const id = f.dataset.id;
    const val = n => f.elements[n].value;
    const body = {
      title: val('title'), category: val('category'), level: val('level'),
      hours: parseInt(val('hours'), 10), price: parseInt(val('price'), 10),
      instructor: val('instructor'), short: val('short'), description: val('description'),
      modules: val('modules').split('\n').map(s => s.trim()).filter(Boolean)
    };
    const btn = f.querySelector('[type=submit]');
    setLoading(btn, true, id ? 'Saving…' : 'Publishing…');
    try {
      const saved = await api(id ? `/courses/${encodeURIComponent(id)}` : '/courses', { method: id ? 'PUT' : 'POST', body });
      COURSES = await api('/courses');
      render();
      toast(id ? `Saved changes to <strong>${esc(saved.title)}</strong>` : `<strong>${esc(saved.title)}</strong> is live in the catalogue`, { action: { label: 'View', href: `#/course/${saved.id}` } });
      if (!id) celebrate('small', $('[data-action="course-new"]'));
    } catch (err) {
      setLoading(btn, false);
      $('#courseErr').textContent = err.message;
    }
  }

  function confirmDeleteCourse(id) {
    const c = byId(id);
    if (!c) return;
    openModal(`<div class="success"><h2 class="h3">Delete “${esc(c.title)}”?</h2>
      <p class="lead">It will disappear from the catalogue. This can’t be undone.</p>
      <button class="btn btn-block btn-danger" type="button" data-action="course-delete-confirm" data-id="${c.id}">Delete course</button>
      <button class="btn btn-ghost btn-block" type="button" data-action="close-modal">Keep it</button></div>`, 'Delete course');
  }

  async function deleteCourse(id, btn) {
    setLoading(btn, true, 'Deleting…');
    try {
      await api(`/courses/${encodeURIComponent(id)}`, { method: 'DELETE' });
      COURSES = await api('/courses');
      render();
      toast('Course deleted.');
    } catch (err) {
      setLoading(btn, false);
      closeModal();
      toast(esc(err.message), { timeout: 5000 });
    }
  }

  const routes = {
    '': viewHome, courses: viewCourses, course: viewCourse, about: viewAbout, help: viewHelp,
    signup: () => viewAuth('signup'), login: () => viewAuth('login'),
    profile: viewProfile, learn: viewLearn, certificate: viewCertificate, admin: viewAdmin
  };
  const REDIRECTS = { learning: '#/profile', cart: '#/courses' };
  let typingTimer = null;

  function render() {
    clearTimeout(typingTimer);
    closeModal(false);
    closeNav();
    const [page = '', param] = location.hash.replace(/^#\/?/, '').split('/');
    if (REDIRECTS[page]) { location.replace(REDIRECTS[page]); return; }
    const view = routes[page] || viewNotFound;
    const app = $('#app');
    app.innerHTML = `<div class="view">${view(param ? decodeURIComponent(param) : undefined)}</div>`;
    updateNav();
    afterRender(page);
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
    const h1 = $('h1', app);
    document.title = (page ? `${h1 ? h1.textContent.trim() : 'UpClick'} · ` : '') + 'UpClick — Learn to code';
  }

  function afterRender(page) {
    if (page === '') startTyping();
    if (page === 'courses') renderCourseList();
    if (page === 'certificate' && $('#certificate')) setTimeout(() => celebrate('medium'), 450);
    if (page === 'admin') loadAdminSummary();
    if (page === 'course' && $('#reviews')) loadReviews($('#reviews').dataset.id);
    if (page === 'courses' && $('#q') && state.catalog.q) $('#q').focus();
    if (page === 'certificate' && session.get('print', false)) { session.del('print'); setTimeout(() => window.print(), 700); }
    if (page === 'learn' && session.get('jump', '') === 'rate') {
      session.del('jump');
      setTimeout(() => $('#rate')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }), 60);
    }
    observeReveals();
  }

  function updateNav() {
    const page = currentPage();
    $('#authSlot').innerHTML = state.user
      ? `${state.user.is_admin ? '<a href="#/admin" data-route="admin">Admin</a>' : ''}
         <a href="#/profile" data-route="profile" class="profile-link"><span class="avatar" aria-hidden="true">${esc(initials(state.user.name))}</span>Profile</a>
         <button class="link-btn" type="button" data-action="logout">Log out</button>`
      : '<a href="#/login" data-route="login">Log in</a><a href="#/signup" data-route="signup" class="btn btn-sm nav-cta">Sign up</a>';
    const group = { course: 'courses', learn: 'profile', certificate: 'profile' }[page] || page;
    $$('.nav [data-route]').forEach(a => {
      const on = a.dataset.route === group;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const nq = $('#navQ');
    if (nq && document.activeElement !== nq) nq.value = page === 'courses' ? state.catalog.q : '';
  }

  function closeNav() {
    $('#nav').classList.remove('open');
    $('.nav-toggle').setAttribute('aria-expanded', 'false');
  }

  const CODE = [
    'const learner = "you";',
    '',
    'function levelUp(skill) {',
    '  return learner + " just learned " + skill + "!";',
    '}',
    '',
    'console.log(levelUp("JavaScript"));'
  ].join('\n');

  function highlight(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/("[^"\n]*"?)/g, '<span class="tok-s">$1</span>')
      .replace(/\b(const|function|return|def|final|void)\b/g, '<span class="tok-k">$1</span>')
      .replace(/\b(levelUp|log)\b(?=\()/g, '<span class="tok-f">$1</span>');
  }

  function startTyping() {
    const pre = $('#typed');
    if (!pre) return;
    const done = () => { pre.innerHTML = highlight(CODE); $('#runBtn').disabled = false; };
    if (reduceMotion) return done();
    let i = 0;
    const step = () => {
      i += 1;
      pre.innerHTML = highlight(CODE.slice(0, i)) + '<span class="caret"></span>';
      if (i < CODE.length) typingTimer = setTimeout(step, CODE[i - 1] === '\n' ? 140 : 26);
      else { done(); pre.innerHTML += '<span class="caret"></span>'; }
    };
    typingTimer = setTimeout(step, 500);
  }

  let runs = 0;
  function runCode(btn) {
    const out = $('#codeOut');
    runs += 1;
    out.hidden = true; void out.offsetWidth;
    out.innerHTML = runs === 1 ? '&gt; you just learned JavaScript!' : `&gt; you just learned JavaScript! <span style="opacity:.6">(×${runs})</span>`;
    out.hidden = false;
    btn.textContent = '▶ Run again';
    celebrate('small', btn);
  }

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = +(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || '';
    const fmt = v => (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US')) + suffix;
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const start = performance.now(), dur = 1400;
    const tick = now => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  let io = null;
  function observeReveals() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); $$('[data-count]').forEach(countUp); return; }
    io?.disconnect();
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    els.forEach(el => io.observe(el));
  }

  function countTo(el, from, to, dur = 700) {
    if (!el) return;
    if (reduceMotion || from === to) { el.textContent = to + '%'; return; }
    const start = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(from + (to - from) * t) + '%';
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const confetti = (() => {
    const cv = $('#confetti');
    const ctx = cv.getContext('2d');
    const colors = ['#9a0da3', '#f06fb8', '#4b3f8f', '#ffcf3f', '#0e0c12', '#7be0c3'];
    let parts = [], raf = null;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', resize);
    resize();
    function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(p => p.life < p.max && p.y < innerHeight + 40);
      for (const p of parts) {
        p.life++; p.vy += 0.26; p.vx *= 0.985; p.vy *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life * 0.12)) + 1);
        ctx.restore();
      }
      raf = parts.length ? requestAnimationFrame(tick) : null;
    }
    function burst({ x = innerWidth / 2, y = innerHeight / 3, count = 100, spread = Math.PI * 2, power = 12, angle = -Math.PI / 2 } = {}) {
      if (reduceMotion) return;
      for (let i = 0; i < count; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const v = power * (0.45 + Math.random() * 0.75);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 6, h: 9 + Math.random() * 8,
          r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, c: colors[i % colors.length],
          life: 0, max: 100 + Math.random() * 70, round: Math.random() < 0.3 });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }
    return { burst };
  })();

  function celebrate(size = 'big', el) {
    if (el) {
      const r = el.getBoundingClientRect();
      confetti.burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: size === 'small' ? 30 : 60, power: size === 'small' ? 7 : 10 });
      return;
    }
    if (size === 'big') {
      confetti.burst({ x: innerWidth * 0.15, y: innerHeight * 0.85, count: 110, angle: -Math.PI / 3, spread: Math.PI / 3, power: 22 });
      confetti.burst({ x: innerWidth * 0.85, y: innerHeight * 0.85, count: 110, angle: -2 * Math.PI / 3, spread: Math.PI / 3, power: 22 });
      setTimeout(() => confetti.burst({ count: 120, power: 13 }), 350);
    } else {
      confetti.burst({ count: 90, power: 12 });
    }
  }

  function toast(html, { action, timeout = 3400 } = {}) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${html}</span>${action ? `<a class="toast-act" href="${action.href}">${action.label}</a>` : ''}`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, timeout);
  }

  let lastFocus = null;
  function openModal(html, label, { wide = false } = {}) {
    stopPlayer();
    if ($('#modal').hidden) lastFocus = document.activeElement;
    const card = $('#modalCard');
    card.classList.toggle('modal-wide', wide);
    card.innerHTML = `<button class="modal-x" type="button" data-action="close-modal" aria-label="Close">✕</button>${html}`;
    card.setAttribute('aria-label', label);
    $('#modal').hidden = false;
    document.body.classList.add('no-scroll');
    const target = card.querySelector('input:not([type=radio]), .btn, input');
    (target || card).focus();
  }
  function closeModal(restoreFocus = true) {
    const m = $('#modal');
    if (m.hidden) return;
    stopPlayer();
    m.hidden = true;
    document.body.classList.remove('no-scroll');
    if (restoreFocus && lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  document.addEventListener('pointerdown', e => {
    const btn = e.target.closest('.btn');
    if (!btn || reduceMotion) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    btn.appendChild(s);
    setTimeout(() => s.remove(), 650);
  });

  function startEnrol(id) {
    const c = byId(id);
    if (!c) return;
    if (state.enrolled[id]) { location.hash = `#/learn/${id}`; return; }
    if (!state.user) {
      session.set('intent', { enrol: id });
      openModal(`<div class="success"><p class="eyebrow">One quick step</p>
        <h2 class="h2">Create a free account to enrol</h2>
        <p class="lead">Your courses, progress and certificates are saved to your account. You’ll come straight back to finish enrolling in <strong>${esc(c.title)}</strong>.</p>
        <a class="btn btn-block" href="#/signup">Sign up — it’s free</a>
        <a class="btn btn-ghost btn-block" href="#/login">I already have an account</a></div>`, 'Account needed');
      return;
    }
    openEnrolConfirm(id);
  }

  function openEnrolConfirm(id) {
    const c = byId(id);
    const q = quote(c);
    openModal(`<p class="eyebrow">Enrol</p>
      <h2 class="h3">${esc(c.title)}</h2>
      <p class="hint">${plural(c.modules.length, 'video lesson')} · ${c.hours} hours · certificate on completion</p>
      <div class="sum-row"><span>Course price</span><span>${money(q.price)}</span></div>
      ${q.discount ? `<div class="sum-row accent"><span>Returning learner (10% off)</span><span>−${money(q.discount)}</span></div>` : ''}
      <div class="sum-row total"><span>Total</span><span>${money(q.total)}</span></div>
      <p class="hint" style="margin-top:12px">Enrolling as <strong>${esc(state.user.email)}</strong>. Prototype — no payment details are collected.</p>
      <button class="btn btn-block" type="button" data-action="confirm-enrol" data-id="${c.id}">Enrol in this course · ${money(q.total)}</button>
      <button class="btn btn-ghost btn-block" type="button" data-action="close-modal">Not now</button>`, 'Enrol');
  }

  async function submitEnrol(btn, id) {
    setLoading(btn, true, 'Enrolling…');
    const started = Date.now();
    let res;
    try {
      res = await api('/enrol', { method: 'POST', body: { course_id: id } });
    } catch (err) {
      setLoading(btn, false);
      if (err.status === 401) closeModal();
      if (err.status === 409) { await loadEnrolments().catch(() => {}); closeModal(false); location.hash = `#/learn/${id}`; return; }
      toast(esc(err.message), { timeout: 5000 });
      return;
    }
    await new Promise(r => setTimeout(r, Math.max(0, 900 - (Date.now() - started))));
    state.enrolled[id] = fromApi(res.enrolment);
    const c = byId(id);
    c.students += 1;
    state.session.enrolled += 1;
    save();
    session.del('intent');
    closeModal(false);
    if (location.hash === `#/learn/${id}`) render(); else location.hash = `#/learn/${id}`;
    setTimeout(() => {
      openModal(`<div class="success">${CHECK_SVG}
        <p class="eyebrow">Enrolled · ${money(res.total)}${res.discount ? ` (saved ${money(res.discount)})` : ''}</p>
        <h2 class="h2">You’re in, ${first(state.user.name)}!</h2>
        <p class="lead">This is your course page for <strong>${esc(c.title)}</strong>. Your progress is saved automatically and always visible in your Profile.</p>
        <button class="btn btn-block" type="button" data-action="play-lesson" data-id="${id}" data-i="0"><span class="btn-ic">${PLAY_SVG}</span>Start lesson 1</button>
        <button class="btn btn-ghost btn-block" type="button" data-action="close-modal">Look around first</button>
      </div>`, 'Enrolled');
      celebrate(res.first_enrolment ? 'big' : 'medium');
    }, 60);
  }

  async function loadReviews(id) {
    const box = $('#reviews');
    if (!box) return;
    try {
      const data = await api(`/courses/${encodeURIComponent(id)}/reviews`);
      if ($('#reviews')?.dataset.id === id) $('#reviews').innerHTML = reviewsHTML(byId(id), data);
    } catch (err) {
      box.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  }

  async function submitReview(f) {
    const id = f.dataset.id;
    const picked = f.querySelector('input[name=rating]:checked');
    const err = $('#rvErr', f);
    if (!picked) { err.textContent = 'Choose a star rating first.'; f.querySelector('.star-pick input')?.focus(); return; }
    err.textContent = '';
    const btn = f.querySelector('[type=submit]');
    setLoading(btn, true, 'Saving…');
    try {
      const r = await api(`/courses/${encodeURIComponent(id)}/reviews`, { method: 'PUT', body: { rating: +picked.value, comment: $('#rvText', f).value } });
      state.myReviews[id] = r;
      const legend = f.querySelector('legend');
      if (legend) legend.textContent = 'Update your rating';
      setLoading(btn, false);
      btn.textContent = 'Update review';
      toast(r.first ? 'Thanks — your review is live on the course page.' : 'Your review has been updated.', { action: { label: 'See it', href: `#/course/${id}` } });
      if (r.first) celebrate('small', btn);
      if ($('#reviews')) loadReviews(id);
    } catch (e2) {
      setLoading(btn, false);
      err.textContent = e2.message;
    }
  }

  async function submitContact(f) {
    const msg = $('#ctMsg', f);
    if (!validateForm(f)) return;
    const btn = f.querySelector('[type=submit]');
    setLoading(btn, true, 'Sending…');
    try {
      await api('/contact', { method: 'POST', body: { name: $('#ctName', f).value, email: $('#ctEmail', f).value, topic: $('#ctTopic', f).value, message: msg.value } });
      const name = first($('#ctName', f).value), email = esc($('#ctEmail', f).value.trim());
      f.outerHTML = `<div class="success contact-done" tabindex="-1">${CHECK_SVG}<h3 class="h3">Message sent — thanks, ${name}!</h3>
        <p class="hint">We’ll reply to ${email} within 2 working days.</p>
        <a class="btn btn-outline btn-sm" href="#/courses">Back to courses</a></div>`;
      $('.contact-done').focus();
    } catch (e2) {
      setLoading(btn, false);
      toast(esc(e2.message), { timeout: 5000 });
    }
  }

  async function submitAccount(f) {
    if (!validateForm(f)) return;
    const btn = f.querySelector('[type=submit]');
    setLoading(btn, true, 'Saving…');
    try {
      state.user = await api('/auth/me', { method: 'PATCH', body: { name: $('#acName', f).value } });
      setLoading(btn, false);
      updateNav();
      $('.profile-head h1').textContent = state.user.name;
      $('.profile-head .avatar').textContent = initials(state.user.name);
      toast('Your details are saved.');
    } catch (e2) {
      setLoading(btn, false);
      showFieldError($('#acName', f), e2.message);
    }
  }

  const validators = {
    name: v => v.trim().length >= 2 || 'Please enter your name.',
    message: v => v.trim().length >= 10 || 'Tell us a little more (at least 10 characters).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter a valid email, like you@example.com.',
    password: v => v.length >= 8 || 'Use at least 8 characters.',
    loginPassword: v => v.length > 0 || 'Enter your password.'
  };
  function check(input) {
    const res = validators[input.dataset.rule](input.value);
    const ok = res === true;
    const wrap = input.closest('.field');
    if (!ok) { wrap.classList.remove('invalid'); void wrap.offsetWidth; }
    wrap.classList.toggle('invalid', !ok);
    wrap.classList.toggle('valid', ok);
    input.setAttribute('aria-invalid', String(!ok));
    wrap.querySelector('.error').textContent = ok ? '' : res;
    return ok;
  }
  function validateForm(form) {
    const inputs = $$('[data-rule]', form);
    const results = inputs.map(check);
    const bad = inputs[results.indexOf(false)];
    if (bad) { bad.focus(); return false; }
    return true;
  }
  function setLoading(btn, on, text = 'Working…') {
    if (on) { btn.dataset.label = btn.innerHTML; btn.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${text}`; btn.disabled = true; }
    else { btn.innerHTML = btn.dataset.label; btn.disabled = false; }
  }
  function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++;
    return s;
  }
  function updateStrength(pw) {
    const meter = $('#pwMeter'), label = $('#pwLabel');
    if (!meter) return;
    const s = pw ? strength(pw) : 0;
    const map = [['8+ characters', '#e6dfeb'], ['Weak', '#cf2a4a'], ['Okay', '#e08a00'], ['Strong', '#1f9d63'], ['Excellent', '#9a0da3']];
    meter.style.width = (pw ? Math.max(12, s * 25) : 0) + '%';
    meter.style.background = map[s][1];
    label.textContent = pw ? map[s][0] : map[0][0];
  }

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'q') { state.catalog.q = t.value; renderCourseList(); return; }
    if (t.matches('[data-rule]') && t.closest('.field')?.classList.contains('invalid')) check(t);
    if (t.id === 'password') updateStrength(t.value);
  });
  document.addEventListener('focusout', e => {
    const t = e.target;
    if (t.matches && t.matches('[data-rule]') && t.value) check(t);
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'level') { state.catalog.level = t.value; renderCourseList(); }
    if (t.id === 'sort') { const [s, d] = t.value.split(':'); state.catalog.sort = s; state.catalog.dir = d; renderCourseList(); }
    if (t.id === 'pfSort') { state.profile.sort = t.value; $('#pcGrid').innerHTML = sortedMyCourses().map(courseCard).join('') || '<li class="hint">No courses match this filter.</li>'; }
  });

  document.addEventListener('submit', e => {
    const f = e.target;
    if (f.id === 'authForm') { e.preventDefault(); submitAuth(f); }
    if (f.id === 'courseForm') { e.preventDefault(); submitCourse(f); }
    if (f.id === 'reviewForm') { e.preventDefault(); submitReview(f); }
    if (f.id === 'contactForm') { e.preventDefault(); submitContact(f); }
    if (f.id === 'accountForm') { e.preventDefault(); submitAccount(f); }
    if (f.id === 'navSearch') {
      e.preventDefault();
      state.catalog.q = $('#navQ').value.trim();
      Object.assign(state.catalog, { category: 'All', level: 'All' });
      $('#navQ').blur();
      if (currentPage() === 'courses') { render(); } else location.hash = '#/courses';
    }
  });

  function showFieldError(input, message) {
    const wrap = input.closest('.field');
    wrap.classList.remove('valid', 'invalid'); void wrap.offsetWidth;
    wrap.classList.add('invalid');
    input.setAttribute('aria-invalid', 'true');
    wrap.querySelector('.error').textContent = message;
    input.focus();
  }

  async function submitAuth(f) {
    if (!validateForm(f)) return;
    const mode = f.dataset.mode;
    const btn = f.querySelector('[type=submit]');
    setLoading(btn, true, mode === 'signup' ? 'Creating your account…' : 'Logging in…');
    const email = $('#email', f).value.trim();
    const password = $('#password', f).value;
    try {
      const body = mode === 'signup' ? { name: $('#name', f).value.trim(), email, password } : { email, password };
      startSession(await api(mode === 'signup' ? '/auth/register' : '/auth/login', { method: 'POST', body }));
      await loadEnrolments();
    } catch (err) {
      setLoading(btn, false);
      if (err.status === 409) showFieldError($('#email', f), err.message);
      else if (err.status === 401) showFieldError($('#password', f), err.message);
      else toast(esc(err.message), { timeout: 5000 });
      return;
    }
    setLoading(btn, false);
    updateNav();
    const name = state.user.name;
    const intent = session.get('intent', null);
    const target = intent && byId(intent.enrol);
    if (target && state.enrolled[target.id]) session.del('intent');
    if (target && !state.enrolled[target.id]) {
      location.hash = `#/course/${target.id}`;
      setTimeout(() => {
        openEnrolConfirm(target.id);
        toast(`${mode === 'signup' ? 'Account created' : 'Logged in'} — now confirm your enrolment.`);
      }, 50);
      if (mode === 'signup') celebrate('medium');
      return;
    }
    const hasCourses = Object.keys(state.enrolled).length > 0;
    openModal(`<div class="success">${CHECK_SVG}
      <h2 class="h2">${mode === 'signup' ? 'Welcome aboard' : 'Welcome back'}, ${first(name)}!</h2>
      <p class="lead">${mode === 'signup' ? 'Your account is ready. Your first line of code is one click away.' : 'Good to see you again — let’s pick up where you left off.'}</p>
      <a class="btn btn-block" href="${hasCourses ? '#/profile' : '#/courses'}">${hasCourses ? 'Go to my Profile' : 'Pick my first course'}</a></div>`, 'Welcome');
    if (mode === 'signup') celebrate('medium');
  }

  function saveLesson(id, i, done, snapshot) {
    api(`/me/enrolments/${encodeURIComponent(id)}/lessons/${i}`, { method: 'PUT', body: { done } })
      .then(res => {
        const e = state.enrolled[id];
        if (e && res.completed_at && e.completedAt) e.completedAt = Date.parse(res.completed_at);
      })
      .catch(err => {
        if (err.status === 401) return;
        state.enrolled[id] = snapshot;
        const art = $(`.learn-item[data-id="${id}"]`);
        const c = byId(id);
        if (art && c) art.outerHTML = learnItem(c);
        toast('That lesson couldn’t be saved: ' + esc(err.message), { timeout: 5000 });
      });
  }

  function isFirstLesson() {
    return Object.values(state.enrolled).reduce((n, e) => n + e.done.length, 0) === 1;
  }

  function toggleLesson(id, i, { quiet = false } = {}) {
    const c = byId(id), e = state.enrolled[id];
    if (!c || !e) return;
    const snapshot = { ...e, done: [...e.done] };
    const total = c.modules.length;
    const before = Math.round(e.done.length / total * 100);
    const idx = e.done.indexOf(i);
    const completing = idx === -1;
    if (completing) { e.done.push(i); state.session.lessons++; }
    else { e.done.splice(idx, 1); e.completedAt = null; }
    const after = Math.round(e.done.length / total * 100);
    const justFinished = completing && e.done.length === total;
    if (justFinished) e.completedAt = Date.now();
    save();
    saveLesson(id, i, completing, snapshot);

    const art = $(`.learn-item[data-id="${id}"]`);
    if (art) {
      const tmp = document.createElement('div');
      tmp.innerHTML = learnItem(c, before).trim();
      const neu = tmp.firstElementChild;
      art.replaceWith(neu);
      requestAnimationFrame(() => requestAnimationFrame(() => { neu.querySelector('.progress i').style.width = after + '%'; }));
      countTo(neu.querySelector('[data-pct]'), before, after);
      const btn = neu.querySelector(`[data-i="${i}"]`);
      if (btn && !quiet) {
        btn.focus({ preventScroll: true });
        if (completing) { btn.closest('.lesson').classList.add('fresh'); celebrate(isFirstLesson() ? 'medium' : 'small', btn); }
      }
    }
    if (completing && before < 50 && after >= 50 && !justFinished) toast('Halfway there — keep that streak going!');
    if (justFinished) {
      const firstCert = Object.values(state.enrolled).filter(x => x.completedAt).length === 1;
      setTimeout(() => {
        openModal(`<div class="success"><div class="seal" aria-hidden="true">★</div>
          <p class="eyebrow">${firstCert ? 'Your first certificate' : 'Course complete'}</p>
          <h2 class="h2">You did it${state.user ? ', ' + first(state.user.name) : ''}!</h2>
          <p class="lead">You finished <strong>${esc(c.title)}</strong> — all ${total} lessons. Your certificate is saved in Profile → Certificates.</p>
          <a class="btn btn-block" href="#/certificate/${id}">View my certificate</a>
          <a class="btn btn-ghost btn-block" href="#/learn/${id}" data-jump="rate">Rate this course</a></div>`, 'Course complete');
        celebrate(firstCert ? 'big' : 'medium');
      }, 550);
    }
    return justFinished;
  }

  const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>';
  const PAUSE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor"/></svg>';
  const LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
  const lessonSecs = (c, i) => 45 + ((i * 37 + c.id.length * 11) % 75);
  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  let watched = {};
  function loadWatched() {
    watched = state.user ? store.get(`watch:${state.user.id}`, {}) : {};
  }
  const watchKey = (id, i) => `${id}:${i}`;
  let P = null;

  function lessonCode(c, i) {
    const t = c.modules[i].replace(/"/g, "'");
    const n = i + 1;
    if (c.category === 'Tools') return { file: 'terminal', lines: [`git checkout -b lesson-${n}`, 'git add .', `git commit -m "${t}"`, `git push origin lesson-${n}`], out: `Branch lesson-${n} pushed` };
    if (c.category === 'Mobile') return { file: 'main.dart', lines: [`final lesson = "${t}";`, '', 'void main() {', '  print("Practising $lesson");', '}'], out: `Practising ${t}` };
    if (c.category === 'Web') return { file: `lesson-${n}.js`, lines: [`const lesson = "${t}";`, '', 'function practise(topic) {', '  return "Practising " + topic;', '}', '', 'console.log(practise(lesson));'], out: `Practising ${t}` };
    return { file: `lesson_${n}.py`, lines: [`lesson = "${t}"`, '', 'def practise(topic):', '    return "Practising " + topic', '', 'print(practise(lesson))'], out: `Practising ${t}` };
  }

  function lessonCaptions(c, i) {
    const t = c.modules[i];
    return [
      `Welcome to lesson ${i + 1}: ${t}.`,
      `I'm ${c.instructor}, and we'll build this step by step.`,
      'Let’s open the editor and write some code together.',
      'Watch how each line builds on the one before it.',
      'Run it — this is exactly what you should see.',
      'Try it yourself before moving on to the next lesson.'
    ];
  }

  function openPlayer(id, i) {
    const c = byId(id);
    if (!c || !c.modules[i]) return;
    const e = state.enrolled[id];
    const preview = !e;
    if (preview && i !== 0) return;
    const dur = lessonSecs(c, i);
    const saved = watched[watchKey(id, i)] || 0;
    const startAt = !preview && saved > 2 && saved < dur - 2 ? saved : 0;
    const done = !preview && e.done.includes(i);
    openModal(`<div class="player">
      <p class="eyebrow">${preview ? 'Free preview' : `Lesson ${i + 1} of ${c.modules.length}`} · ${esc(c.title)}</p>
      <h2 class="h3 player-title">${esc(c.modules[i])}</h2>
      <div class="vp" id="vp" tabindex="0" role="region" aria-label="Lesson video: ${esc(c.modules[i])}. Space to play or pause, arrow keys to skip.">
        <div class="vp-screen" id="vpScreen"></div>
        <div class="vp-caption" id="vpCap" aria-live="off"></div>
        <button class="vp-big" type="button" data-action="vp-toggle" aria-label="Play video">${PLAY_SVG}</button>
        <span class="vp-resume" id="vpResume" ${startAt ? '' : 'hidden'}>Resume from ${fmtTime(startAt)}</span>
        <div class="vp-end" id="vpEnd" hidden></div>
        <div class="vp-controls">
          <button class="vp-btn" type="button" data-action="vp-toggle" id="vpPlayBtn" aria-label="Play">${PLAY_SVG}</button>
          <button class="vp-btn" type="button" data-action="vp-back" aria-label="Back 10 seconds">−10</button>
          <div class="vp-bar" id="vpBar" data-action="vp-seek" role="slider" tabindex="0" aria-label="Video position" aria-valuemin="0" aria-valuemax="${dur}" aria-valuenow="0"><i id="vpFill"></i></div>
          <span class="vp-time" id="vpTime">0:00 / ${fmtTime(dur)}</span>
          <button class="vp-btn vp-txt" type="button" data-action="vp-speed" aria-label="Playback speed">1×</button>
          <button class="vp-btn vp-txt" type="button" data-action="vp-cc" aria-pressed="true" aria-label="Captions">CC</button>
        </div>
      </div>
      <div class="player-foot">
        ${preview
          ? `<p class="hint">Enrol to unlock all ${c.modules.length} video lessons and your certificate.</p>${enrolButton(c, 'btn-sm', 'Enrol now')}`
          : `<div class="pf-nav">
               <button class="btn btn-ghost btn-sm" type="button" data-action="vp-go" data-i="${i - 1}" ${i === 0 ? 'disabled' : ''} aria-label="Previous lesson${i > 0 ? ': ' + esc(c.modules[i - 1]) : ''}">‹ Previous</button>
               <span class="hint">Lesson ${i + 1} of ${c.modules.length}</span>
               <button class="btn btn-ghost btn-sm" type="button" data-action="vp-go" data-i="${i + 1}" ${i === c.modules.length - 1 ? 'disabled' : ''} aria-label="Next lesson${i < c.modules.length - 1 ? ': ' + esc(c.modules[i + 1]) : ''}">Next ›</button>
             </div>
             <button class="btn btn-outline btn-sm" type="button" data-action="vp-mark" id="vpMark">${done ? '✓ Completed' : 'Mark as complete'}</button>`}
      </div>
    </div>`, 'Lesson video', { wide: true });
    P = { id, i, c, preview, dur, t: startAt, playing: false, speed: 1, cc: true, raf: 0, last: 0, ended: false, timer: 0, scene: '' };
    if (!preview && state.user) store.set(`last:${state.user.id}`, { id, i });
    paintPlayer();
    $('.vp-big').focus();
  }

  function sceneHTML(f) {
    const { c, i } = P;
    if (f < 0.16) {
      return { key: 'title', html: `<div class="vs vs-title"><span class="logo">UPClick</span>
        <span class="vs-num">Lesson ${String(i + 1).padStart(2, '0')}</span>
        <p class="vs-h">${esc(c.modules[i])}</p><span class="vs-by">with ${esc(c.instructor)}</span></div>` };
    }
    if (f < 0.84) {
      const code = lessonCode(c, i);
      const text = code.lines.join('\n');
      const typed = Math.min(1, (f - 0.18) / 0.5);
      const n = Math.max(0, Math.floor(text.length * typed));
      const showOut = f > 0.7;
      return { key: 'code', pre: `${highlight(text.slice(0, n))}${n < text.length ? '<span class="caret"></span>' : ''}`,
        out: showOut ? `&gt; ${esc(code.out)}` : '', html: `<div class="vs vs-code">
        <div class="vs-file"><i></i><i></i><i></i><span>${esc(code.file)}</span></div>
        <pre class="vs-pre"></pre><div class="vs-out" hidden></div>
        <span class="vs-cam" aria-hidden="true">${esc(initials(c.instructor))}</span></div>` };
    }
    const next = c.modules[i + 1];
    return { key: 'sum', html: `<div class="vs vs-sum"><span class="vs-num">Key takeaway</span>
      <p class="vs-h">You can now apply “${esc(c.modules[i])}” in your own code.</p>
      <span class="vs-by">${next ? `Up next: ${esc(next)}` : 'That was the final lesson of this course'}</span></div>` };
  }

  function paintPlayer() {
    if (!P) return;
    const vp = $('#vp');
    if (!vp) return;
    const f = P.t / P.dur;
    const s = sceneHTML(f);
    if (s.key !== P.scene) { $('#vpScreen').innerHTML = s.html; P.scene = s.key; P.pre = null; }
    if (s.key === 'code') {
      if (s.pre !== P.pre) { $('#vpScreen .vs-pre').innerHTML = s.pre; P.pre = s.pre; }
      const out = $('#vpScreen .vs-out');
      if (out.hidden === !!s.out) { out.innerHTML = s.out; out.hidden = !s.out; }
    }
    const caps = lessonCaptions(P.c, P.i);
    $('#vpCap').textContent = P.cc ? caps[Math.min(caps.length - 1, Math.floor(f * caps.length))] : '';
    $('#vpFill').style.width = (f * 100) + '%';
    $('#vpBar').setAttribute('aria-valuenow', String(Math.floor(P.t)));
    $('#vpBar').setAttribute('aria-valuetext', `${fmtTime(P.t)} of ${fmtTime(P.dur)}`);
    $('#vpTime').textContent = `${fmtTime(P.t)} / ${fmtTime(P.dur)}`;
    vp.classList.toggle('playing', P.playing);
    vp.classList.toggle('no-cc', !P.cc);
    const pb = $('#vpPlayBtn');
    pb.innerHTML = P.playing ? PAUSE_SVG : PLAY_SVG;
    pb.setAttribute('aria-label', P.playing ? 'Pause' : 'Play');
    $('#vpResume').hidden = P.playing || P.t < 1 || P.ended;
  }

  function playerTick(now) {
    if (!P || !P.playing) return;
    P.t = Math.min(P.dur, P.t + (now - P.last) / 1000 * P.speed);
    P.last = now;
    paintPlayer();
    if (P.t >= P.dur) { endPlayer(); return; }
    P.raf = requestAnimationFrame(playerTick);
  }

  function setPlaying(on) {
    if (!P) return;
    if (on && P.ended) { P.t = 0; P.ended = false; $('#vpEnd').hidden = true; clearInterval(P.timer); }
    P.playing = on;
    if (on) { P.last = performance.now(); P.raf = requestAnimationFrame(playerTick); }
    else { cancelAnimationFrame(P.raf); rememberPosition(); }
    paintPlayer();
  }

  function seekPlayer(t) {
    if (!P) return;
    if (P.ended) { P.ended = false; $('#vpEnd').hidden = true; clearInterval(P.timer); }
    P.t = Math.max(0, Math.min(P.dur - 0.05, t));
    paintPlayer();
  }

  function rememberPosition() {
    if (!P || P.preview) return;
    if (!state.user) return;
    const k = watchKey(P.id, P.i);
    if (P.ended || P.t < 2) delete watched[k]; else watched[k] = Math.floor(P.t);
    store.set(`watch:${state.user.id}`, watched);
  }

  function stopPlayer() {
    if (!P) return;
    cancelAnimationFrame(P.raf);
    clearInterval(P.timer);
    rememberPosition();
    P = null;
  }

  function endPlayer() {
    P.playing = false;
    P.ended = true;
    rememberPosition();
    paintPlayer();
    const { id, i, c } = P;
    const end = $('#vpEnd');
    if (P.preview) {
      end.innerHTML = `<h3>Enjoyed the preview?</h3>
        <p>Enrol to unlock all ${c.modules.length} lessons of ${esc(c.title)}.</p>
        <div class="actions">${enrolButton(c, 'btn-sm', 'Enrol now')}<button class="btn btn-outline btn-sm vp-on-dark" type="button" data-action="vp-replay">Replay</button></div>`;
      end.hidden = false;
      return;
    }
    const e = state.enrolled[id];
    let finished = false;
    if (!e.done.includes(i)) finished = toggleLesson(id, i, { quiet: true });
    if (finished) { stopPlayer(); return; }
    const mark = $('#vpMark');
    if (mark) mark.textContent = '✓ Completed';
    const next = c.modules.findIndex((_, k) => k > i && !state.enrolled[id].done.includes(k));
    const nextAny = next > -1 ? next : c.modules.findIndex((_, k) => !state.enrolled[id].done.includes(k));
    end.innerHTML = `${CHECK_SVG}<h3>Lesson complete</h3>
      ${nextAny > -1
        ? `<p>Up next: <strong>${esc(c.modules[nextAny])}</strong>${nextAny === i + 1 ? ' — starting in <span id="vpCount">5</span>s' : ''}</p>
           <div class="actions"><button class="btn btn-sm" type="button" data-action="vp-next" data-i="${nextAny}">Play next lesson</button>
           <button class="btn btn-outline btn-sm vp-on-dark" type="button" data-action="vp-replay">Replay</button></div>`
        : `<p>Every lesson in this course is done.</p><div class="actions"><a class="btn btn-sm" href="#/certificate/${id}">View certificate</a></div>`}`;
    end.hidden = false;
    celebrate(isFirstLesson() ? 'medium' : 'small', $('#vp'));
    if (nextAny === i + 1) {
      let left = 5;
      P.timer = setInterval(() => {
        left -= 1;
        const el = $('#vpCount');
        if (el) el.textContent = String(left);
        if (left <= 0) { clearInterval(P.timer); openPlayer(id, nextAny); setPlaying(true); }
      }, 1000);
    }
    end.querySelector('.btn')?.focus();
  }

  function heartBurst(e, btn) {
    const loves = store.get('loves', 0) + 1;
    store.set('loves', loves);
    const r = btn.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2;
    const y = e.clientY || r.top + r.height / 2;
    if (!reduceMotion) {
      for (let i = 0; i < 7; i++) {
        const h = document.createElement('span');
        h.className = 'float-heart';
        h.innerHTML = `<svg viewBox="0 0 24 22" width="26" height="24" aria-hidden="true"><path d="M12 21 C5 15 1 11 1 6.5 1 3.4 3.4 1 6.5 1 8.6 1 10.6 2.1 12 4 13.4 2.1 15.4 1 17.5 1 20.6 1 23 3.4 23 6.5 23 11 19 15 12 21Z" fill="${['#9a0da3', '#f06fb8', '#d36ad8', '#4b3f8f'][i % 4]}"/></svg>`;
        h.style.left = x + 'px';
        h.style.top = y + 'px';
        h.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
        h.style.setProperty('--rot', (Math.random() * 60 - 30) + 'deg');
        h.style.animationDelay = i * 45 + 'ms';
        document.body.appendChild(h);
        setTimeout(() => h.remove(), 1700);
      }
    }
    btn.classList.remove('beat'); void btn.offsetWidth; btn.classList.add('beat');
    $('#loveCount').textContent = `${plural(loves, 'heart')} sent`;
    if (loves % 10 === 0) { celebrate('medium'); toast(`${loves} hearts! You really love us.`); }
  }

  function logout() {
    const s = state.session;
    const certs = Object.values(state.enrolled).filter(e => e.completedAt).length;
    openModal(`<div class="success"><h2 class="h2">Log out, ${first(state.user?.name)}?</h2>
      <p>Here’s what you achieved this session:</p>
      <ul class="session-stats">
        <li><strong>${s.lessons}</strong><span>${s.lessons === 1 ? 'lesson done' : 'lessons done'}</span></li>
        <li><strong>${s.enrolled}</strong><span>${s.enrolled === 1 ? 'course joined' : 'courses joined'}</span></li>
        <li><strong>${certs}</strong><span>certificates</span></li>
      </ul>
      <p class="logout-note">Logging out <strong>clears your data from this device</strong>. Your courses, progress and certificates stay saved in your account.</p>
      <button class="btn btn-block" type="button" data-action="confirm-logout">Log out</button>
      <button class="btn btn-ghost btn-block" type="button" data-action="close-modal">Stay logged in</button></div>`, 'Log out');
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-jump], a[data-print]');
    if (link) {
      if (link.dataset.jump) session.set('jump', link.dataset.jump);
      if (link.dataset.print) session.set('print', true);
      if (link.getAttribute('href') === location.hash) { e.preventDefault(); render(); }
    }
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const id = t.dataset.id;
    switch (t.dataset.action) {
      case 'enrol': startEnrol(id); break;
      case 'confirm-enrol': submitEnrol(t, id); break;
      case 'jump': $('#' + t.dataset.target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); break;
      case 'pf-filter':
        state.profile.filter = t.dataset.k;
        $$('[data-action="pf-filter"]').forEach(b => b.setAttribute('aria-pressed', String(b === t)));
        $('#pcGrid').innerHTML = sortedMyCourses().map(courseCard).join('') || '<li class="hint">No courses match this filter.</li>';
        break;
      case 'cat':
        state.catalog.category = t.dataset.cat;
        $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === t)));
        renderCourseList(); break;
      case 'sort': {
        const k = t.dataset.sort, c = state.catalog;
        if (c.sort === k) c.dir = c.dir === 'asc' ? 'desc' : 'asc';
        else { c.sort = k; c.dir = k === 'rating' ? 'desc' : 'asc'; }
        renderCourseList(); break;
      }
      case 'clear-filters':
        Object.assign(state.catalog, { q: '', category: 'All', level: 'All' });
        render(); break;
      case 'lesson': toggleLesson(id, +t.dataset.i); break;
      case 'next-lesson': {
        const c = byId(id), done = state.enrolled[id]?.done || [];
        const next = c.modules.findIndex((_, i) => !done.includes(i));
        if (next > -1) openPlayer(id, next);
        break;
      }
      case 'play-lesson': openPlayer(id, +t.dataset.i); break;
      case 'vp-toggle': setPlaying(!(P && P.playing)); break;
      case 'vp-back': if (P) seekPlayer(P.t - 10); break;
      case 'vp-seek': if (P) { const r = t.getBoundingClientRect(); seekPlayer((e.clientX - r.left) / r.width * P.dur); } break;
      case 'vp-speed': if (P) { P.speed = P.speed === 1 ? 1.5 : P.speed === 1.5 ? 2 : 1; t.textContent = `${P.speed}×`; } break;
      case 'vp-cc': if (P) { P.cc = !P.cc; t.setAttribute('aria-pressed', String(P.cc)); paintPlayer(); } break;
      case 'vp-replay': if (P) { P.t = 0; P.ended = false; $('#vpEnd').hidden = true; clearInterval(P.timer); setPlaying(true); } break;
      case 'vp-next': if (P) { const pid = P.id; openPlayer(pid, +t.dataset.i); setPlaying(true); } break;
      case 'vp-go': if (P) { const pid = P.id; openPlayer(pid, +t.dataset.i); } break;
      case 'vp-mark': if (P && state.enrolled[P.id]) {
        const { id: pid, i: pi } = P;
        const wasDone = state.enrolled[pid].done.includes(pi);
        const finished = toggleLesson(pid, pi, { quiet: true });
        if (finished) { closeModal(false); break; }
        t.textContent = wasDone ? 'Mark as complete' : '✓ Completed';
        if (!wasDone) celebrate('small', t);
        break;
      }
      case 'close-modal': closeModal(); break;
      case 'logout': logout(); break;
      case 'confirm-logout':
        endSession(false); closeModal(false);
        toast('You’re logged out and nothing is left on this device. Your progress is safe in your account.', { timeout: 4500 });
        if (location.hash === '#/' || location.hash === '') render(); else location.hash = '#/';
        break;
      case 'course-new': openCourseForm(); break;
      case 'course-edit': openCourseForm(byId(id)); break;
      case 'course-delete': confirmDeleteCourse(id); break;
      case 'course-delete-confirm': deleteCourse(id, t); break;
      case 'retry': init(); break;
      case 'run-code': runCode(t); break;
      case 'heart': heartBurst(e, t); break;
      case 'print': window.print(); break;
      case 'share': {
        const c = byId(id);
        const text = `I just earned my UpClick certificate for "${c.title}"!`;
        (navigator.clipboard?.writeText(text) || Promise.reject())
          .then(() => toast('Share message copied — go show it off!'))
          .catch(() => toast(esc(text), { timeout: 6000 }));
        break;
      }
      case 'social': toast(`${esc(t.dataset.p)} sign-in isn’t connected in this prototype — use email for now.`); break;
      case 'forgot': e.preventDefault(); toast('Password reset isn’t available in this prototype.'); break;
      case 'toggle-pw': {
        const input = $('#password');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        t.textContent = show ? 'Hide' : 'Show';
        t.setAttribute('aria-pressed', String(show));
        break;
      }
      case 'toggle-nav': {
        const open = !$('#nav').classList.contains('open');
        $('#nav').classList.toggle('open', open);
        t.setAttribute('aria-expanded', String(open));
        break;
      }
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeNav(); }
    if (P && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      const k = e.key;
      if (k === ' ' || k === 'k') {
        const tag = document.activeElement.tagName;
        if (k === ' ' && tag === 'BUTTON' && !document.activeElement.closest('.vp')) return;
        e.preventDefault(); setPlaying(!P.playing); return;
      }
      if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); seekPlayer(P.t + (k === 'ArrowRight' ? 5 : -5)); return; }
    }
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName) && !P) { e.preventDefault(); ($('#q') || $('#navQ')).focus(); }
    if (e.key === 'Tab' && !$('#modal').hidden) {
      const f = $$('#modalCard a, #modalCard button, #modalCard input, #modalCard textarea').filter(el => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const firstEl = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  });

  function viewOffline(message) {
    return `<section class="container empty-state">
      <h1 class="h2">Can’t reach the UpClick server</h1>
      <p class="lead" style="margin-inline:auto">${esc(message)} Start it from the project folder with
        <code>uvicorn main:app --reload</code>, then open <a href="http://localhost:8000">http://localhost:8000</a>.</p>
      <div class="actions"><button class="btn" type="button" data-action="retry">Try again</button></div>
    </section>`;
  }

  let loaded = false;
  async function init() {
    loaded = false;
    $('#app').innerHTML = `<div class="view"><section class="container empty-state"><span class="spinner spinner-dark" aria-hidden="true"></span><p class="hint">Loading UpClick…</p></section></div>`;
    try {
      COURSES = await api('/courses');
    } catch (err) {
      $('#app').innerHTML = `<div class="view">${viewOffline(err.message)}</div>`;
      updateNav();
      return;
    }
    store.del('cart');
    store.del('watch');
    if (state.token) {
      try {
        state.user = await api('/auth/me');
        loadWatched();
        await loadEnrolments();
      } catch {
        endSession(false);
      }
    }
    loaded = true;
    render();
  }

  window.addEventListener('hashchange', () => { if (loaded) render(); });
  init();
})();
