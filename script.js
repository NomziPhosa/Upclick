(() => {
  'use strict';

  const COURSES = [
    { id: 'html-css-foundations', title: 'HTML & CSS Foundations', category: 'Web', level: 'Beginner', hours: 12, rating: 4.8, students: 5230, price: 349, instructor: 'Thandi Mokoena',
      short: 'Build and style your first responsive web pages.',
      description: 'Start from a blank file and finish with a live portfolio page. You will learn how the web is structured, how to style it with modern CSS, and how to make it look great on any screen.',
      modules: ['Your first HTML page', 'Semantic structure', 'Styling with CSS', 'Flexbox and Grid', 'Responsive design', 'Project: personal portfolio'] },
    { id: 'javascript-essentials', title: 'JavaScript Essentials', category: 'Web', level: 'Beginner', hours: 16, rating: 4.7, students: 4810, price: 449, instructor: 'Kabelo Dlamini',
      short: 'Make pages interactive with variables, functions and the DOM.',
      description: 'Learn the language of the web by building small interactive projects. Covers the core syntax, working with the DOM, events, and fetching data from APIs.',
      modules: ['Values and variables', 'Functions', 'Arrays and objects', 'The DOM', 'Events', 'Fetching data', 'Project: quiz app'] },
    { id: 'react-from-scratch', title: 'React from Scratch', category: 'Web', level: 'Intermediate', hours: 20, rating: 4.8, students: 3120, price: 649, instructor: 'Aisha Patel',
      short: 'Components, state and hooks — build a real single-page app.',
      description: 'Go from JavaScript to modern front-end development. You will think in components, manage state with hooks, and ship a complete app with routing.',
      modules: ['Thinking in components', 'Props and state', 'Hooks in depth', 'Forms', 'Routing', 'Data fetching', 'Project: task manager'] },
    { id: 'python-for-beginners', title: 'Python for Beginners', category: 'Data', level: 'Beginner', hours: 14, rating: 4.9, students: 6420, price: 399, instructor: 'Sipho Nkosi',
      short: 'The friendliest first language — logic, loops and little programs.',
      description: 'No experience needed. Write real Python from lesson one and finish by automating a boring task from your own life.',
      modules: ['Hello, Python', 'Decisions and loops', 'Lists and dictionaries', 'Functions', 'Files', 'Project: automate a task'] },
    { id: 'data-analysis-python', title: 'Data Analysis with Python', category: 'Data', level: 'Intermediate', hours: 18, rating: 4.6, students: 2740, price: 599, instructor: 'Lerato Khumalo',
      short: 'Clean, explore and chart real datasets with pandas.',
      description: 'Turn messy spreadsheets into insight. Load, clean and analyse data with pandas, then tell the story with clear charts.',
      modules: ['Notebooks and pandas', 'Cleaning data', 'Grouping and joining', 'Visualisation', 'Statistics basics', 'Project: analyse a dataset'] },
    { id: 'sql-databases', title: 'SQL & Databases', category: 'Data', level: 'Beginner', hours: 10, rating: 4.7, students: 3890, price: 349, instructor: 'Johan van Wyk',
      short: 'Query, join and design relational databases.',
      description: 'Every app needs data. Learn to write confident SQL queries and design tables that stay tidy as your project grows.',
      modules: ['Tables and rows', 'SELECT and WHERE', 'Joins', 'Aggregates', 'Designing schemas', 'Project: library database'] },
    { id: 'linear-algebra-programmers', title: 'Linear Algebra for Programmers', category: 'CS Fundamentals', level: 'Intermediate', hours: 15, rating: 4.5, students: 1980, price: 499, instructor: 'Dr. Naledi Mahlangu',
      short: 'Vectors, matrices and transformations — explained with code.',
      description: 'The maths behind graphics, games and machine learning, taught through code you can run. Every concept is paired with a visual and a small program.',
      modules: ['Vectors', 'Matrices', 'Transformations', 'Systems of equations', 'Eigenvectors', 'Project: 2D graphics engine'] },
    { id: 'data-structures-algorithms', title: 'Data Structures & Algorithms', category: 'CS Fundamentals', level: 'Advanced', hours: 24, rating: 4.7, students: 2410, price: 749, instructor: 'Prof. Ravi Govender',
      short: 'Lists, trees, graphs and the algorithms that power them.',
      description: 'Build the toolkit that technical interviews and real systems rely on. Implement each structure yourself and learn how to reason about performance.',
      modules: ['Big-O thinking', 'Arrays and linked lists', 'Stacks and queues', 'Trees', 'Graphs', 'Sorting and searching', 'Dynamic programming', 'Project: route planner'] },
    { id: 'intro-machine-learning', title: 'Intro to Machine Learning', category: 'AI', level: 'Intermediate', hours: 22, rating: 4.6, students: 2950, price: 699, instructor: 'Zanele Mthembu',
      short: 'Train your first models and learn how to evaluate them.',
      description: 'Understand what machine learning really is, train regression and classification models, and learn how to tell a good model from a lucky one.',
      modules: ['What is ML?', 'Regression', 'Classification', 'Evaluating models', 'Overfitting', 'Project: predict house prices'] },
    { id: 'building-with-llm-apis', title: 'Building with LLM APIs', category: 'AI', level: 'Advanced', hours: 12, rating: 4.8, students: 1760, price: 799, instructor: 'Michael Botha',
      short: 'Prompting, tool use and shipping AI features safely.',
      description: 'Add large-language-model features to real products. Covers prompt design, structured output, tool use, evaluation and responsible deployment.',
      modules: ['How LLMs work', 'Prompt design', 'Structured output', 'Tool use', 'Evaluation', 'Project: study-buddy chatbot'] },
    { id: 'flutter-mobile-apps', title: 'Flutter Mobile Apps', category: 'Mobile', level: 'Intermediate', hours: 19, rating: 4.6, students: 2130, price: 649, instructor: 'Busi Ndlovu',
      short: 'One codebase, beautiful apps on Android and iOS.',
      description: 'Learn Dart and Flutter by building a polished mobile app, from layout and navigation to state management and publishing.',
      modules: ['Dart basics', 'Widgets', 'Layouts', 'Navigation', 'State management', 'Project: habit tracker'] },
    { id: 'git-github-workflow', title: 'Git & GitHub Workflow', category: 'Tools', level: 'Beginner', hours: 6, rating: 4.9, students: 5670, price: 199, instructor: 'Kabelo Dlamini',
      short: 'Version control and teamwork without the panic.',
      description: 'Commit, branch, merge and collaborate like a professional team. Short, practical and the best first step for any group project.',
      modules: ['Why version control', 'Commits', 'Branches', 'Merging and conflicts', 'Pull requests'] }
  ];
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
    }
  };
  const state = {
    cart: store.get('cart', []),
    enrolled: store.get('enrolled', {}),
    user: store.get('user', null),
    session: { lessons: 0, enrolled: 0 },
    catalog: { q: '', category: 'All', level: 'All', sort: 'students', dir: 'desc' }
  };
  const save = () => { store.set('cart', state.cart); store.set('enrolled', state.enrolled); store.set('user', state.user); };

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
  const totals = items => {
    const subtotal = items.reduce((s, c) => s + c.price, 0);
    const discount = items.length >= 2 ? Math.round(subtotal * 0.1) : 0;
    return { subtotal, discount, total: subtotal - discount };
  };
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

  const levelHTML = l => `<span class="level l${LEVELS[l]}"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>${l}</span>`;
  const ratingHTML = c => `<span class="rating"><span class="star" aria-hidden="true">★</span> ${c.rating.toFixed(1)}</span>`;

  function cartButton(c, extra = '') {
    if (state.enrolled[c.id]) return `<a class="btn btn-outline ${extra}" href="#/learning">Continue</a>`;
    if (state.cart.includes(c.id)) return `<a class="btn added ${extra}" href="#/cart">✓ In cart</a>`;
    return `<button class="btn ${extra}" type="button" data-action="add" data-id="${c.id}">Add to cart</button>`;
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
      <div class="cell-action">${cartButton(c, 'btn-sm')}</div>
    </li>`;
  }

  function viewHome() {
    const popular = [...COURSES].sort((a, b) => b.students - a.students).slice(0, 4);
    const signedIn = !!state.user;
    return `
    <section class="split divided">
      <div>
        <p class="eyebrow">${signedIn ? `Welcome back, ${first(state.user.name)}` : 'Online coding school'}</p>
        <h1 class="display">Let’s<br>get<br><span class="shadow-text">coding</span></h1>
        <p class="lead">Short, hands-on courses that take you from your first line of code to real projects — with a certificate waiting at the finish line.</p>
        <div class="actions">
          <a class="btn" href="#/courses">Browse courses</a>
          <a class="btn btn-outline" href="${signedIn ? '#/learning' : '#/signup'}">${signedIn ? 'Continue learning' : 'Sign up free'}</a>
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
      <div class="stat reveal"><strong data-count="18400" data-suffix="+">0</strong><span>learners</span></div>
      <div class="stat reveal"><strong data-count="${COURSES.length}">0</strong><span>courses</span></div>
      <div class="stat reveal"><strong data-count="92" data-suffix="%">0</strong><span>finish what they start</span></div>
      <div class="stat reveal"><strong data-count="4.8" data-decimals="1">0</strong><span>average rating</span></div>
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
        <li class="reveal"><div><h3>Pick a course</h3><p>Search and sort the full catalogue to find exactly what you need.</p></div></li>
        <li class="reveal"><div><h3>Learn by doing</h3><p>Bite-sized lessons with real code. Tick them off and watch your progress grow.</p></div></li>
        <li class="reveal"><div><h3>Earn your certificate</h3><p>Finish the last lesson and claim a certificate with your name on it.</p></div></li>
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

  function viewCourse(id) {
    const c = byId(id);
    if (!c) return viewNotFound();
    const owned = !!state.enrolled[c.id];
    const inCart = state.cart.includes(c.id);
    const related = COURSES.filter(x => x.category === c.category && x.id !== c.id).slice(0, 3);
    return `
    <section class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/courses">← All courses</a></nav>
      <div class="detail">
        <div>
          <span class="tag">${esc(c.category)}</span>
          <h1 class="h1" style="margin-top:14px">${esc(c.title)}</h1>
          <p class="lead dark">${esc(c.description)}</p>
          <ul class="meta-row">
            <li>${levelHTML(c.level)}</li>
            <li>⏱ ${c.hours} hours</li>
            <li>${ratingHTML(c)} (${c.students.toLocaleString('en-US')} learners)</li>
            <li>Taught by <strong>${esc(c.instructor)}</strong></li>
          </ul>
          <h2 class="h3">Course outline</h2>
          <ol class="modules">
            ${c.modules.map((m, i) => `<li><span class="mod-num">${String(i + 1).padStart(2, '0')}</span><span>${esc(m)}</span><span class="mod-time">${20 + (i * 7) % 25} min</span></li>`).join('')}
          </ol>
          <div class="finish-note"><span class="big-emoji" aria-hidden="true">🏆</span><span>Finish all ${c.modules.length} lessons to earn your personalised UpClick certificate.</span></div>
        </div>
        <aside class="buy-box" aria-label="Enrol">
          <div class="price-lg">${money(c.price)}</div>
          <p class="hint">One payment · lifetime access</p>
          ${cartButton(c, 'btn-block')}
          ${!owned && !inCart ? `<button class="btn btn-outline btn-block" type="button" data-action="buy-now" data-id="${c.id}">Enrol now</button>` : ''}
          <ul class="perks">
            <li>${c.modules.length} hands-on lessons</li>
            <li>Certificate of completion</li>
            <li>Learn at your own pace</li>
            <li>Bundle 2+ courses for 10% off</li>
          </ul>
        </aside>
      </div>
    </section>
    ${related.length ? `<section class="container">
      <h2 class="h2">More in ${esc(c.category)}</h2>
      <div class="list">${listHead(false)}<ul class="course-list">${related.map(r => courseRow(r)).join('')}</ul></div>
    </section>` : ''}`;
  }

  function viewCart() {
    const items = state.cart.map(byId).filter(Boolean);
    if (!items.length) {
      return `<section class="container empty-state">
        <span class="big-emoji" aria-hidden="true">🛒</span>
        <h1 class="h2">Your cart is empty</h1>
        <p class="lead" style="margin-inline:auto">Every great developer started with one course. Find yours in under a minute.</p>
        <div class="actions"><a class="btn" href="#/courses">Browse courses</a></div>
      </section>`;
    }
    const { subtotal, discount, total } = totals(items);
    return `
    <section class="container">
      <h1 class="h1">Your <span class="shadow-text">cart</span></h1>
      <div class="cart-layout">
        <ul class="cart-list">
          ${items.map(c => `<li class="cart-item" data-id="${c.id}">
            <div><a href="#/course/${c.id}">${esc(c.title)}</a><div class="course-sub">${c.level} · ${c.hours} h · ${esc(c.instructor)}</div></div>
            <div class="cart-right"><span class="price">${money(c.price)}</span>
              <button class="icon-btn" type="button" data-action="remove" data-id="${c.id}" aria-label="Remove ${esc(c.title)}">✕</button></div>
          </li>`).join('')}
        </ul>
        <aside class="buy-box" aria-label="Order summary">
          <h2 class="h3">Order summary</h2>
          <div class="sum-row"><span>Subtotal (${plural(items.length, 'course')})</span><span>${money(subtotal)}</span></div>
          ${discount
            ? `<div class="sum-row accent"><span>🎁 Bundle discount (10%)</span><span>−${money(discount)}</span></div>`
            : `<div class="unlock">Add one more course to unlock <strong>10% off</strong> 🎁<div class="meter"><i></i></div></div>`}
          <div class="sum-row total"><span>Total</span><span>${money(total)}</span></div>
          <button class="btn btn-block" type="button" data-action="checkout">Checkout</button>
          <a class="btn btn-ghost btn-block" href="#/courses">Keep browsing</a>
        </aside>
      </div>
    </section>`;
  }

  function viewAuth(mode) {
    if (state.user) {
      return `<section class="container empty-state signed-in">
        <span class="big-emoji" aria-hidden="true">👋</span>
        <h1 class="h2">You’re signed in as ${esc(state.user.name)}</h1>
        <div class="actions"><a class="btn" href="#/learning">Go to My Learning</a><button class="btn btn-outline" type="button" data-action="logout">Log out</button></div>
      </section>`;
    }
    const signup = mode === 'signup';
    return `
    <section class="split divided">
      <div>
        <h1 class="display">Let’s<br>get<br><span class="shadow-text">coding</span></h1>
        <ul class="ticks">
          <li>Free account, no card needed</li>
          <li>Track your progress across courses</li>
          <li>Certificates with your name on them</li>
        </ul>
      </div>
      <div>
        <div class="auth-card">
          <div class="tabs" role="tablist" aria-label="Account">
            <a class="tab" role="tab" href="#/signup" aria-selected="${signup}">Sign up</a>
            <a class="tab" role="tab" href="#/login" aria-selected="${!signup}">Log in</a>
          </div>
          <h2 class="auth-title">${signup ? 'SIGNUP' : 'LOGIN'}</h2>
          <form id="authForm" data-mode="${mode}" novalidate>
            ${signup ? field({ id: 'name', label: 'Full name', ac: 'name', rule: 'name' }) : ''}
            ${field({ id: 'email', label: 'Email', type: 'email', ac: 'email', rule: 'email' })}
            <div class="field has-toggle" data-field="password">
              <label for="password">Password</label>
              <input class="input" id="password" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}"
                data-rule="${signup ? 'password' : 'loginPassword'}" aria-describedby="password-err${signup ? ' pw-strength' : ''}" required>
              <button class="toggle-pw" type="button" data-action="toggle-pw" aria-controls="password" aria-pressed="false">Show</button>
              ${signup ? `<div class="strength" id="pw-strength"><div class="meter"><i id="pwMeter"></i></div><span id="pwLabel">8+ characters</span></div>` : ''}
              <p class="error" id="password-err"></p>
            </div>
            ${signup ? '' : '<div class="form-row"><a class="small-link" href="#" data-action="forgot">Forgot password?</a></div>'}
            <button class="btn btn-block" type="submit">Continue</button>
          </form>
          <div class="divider">or continue with</div>
          <div class="social">
            <button class="btn btn-outline btn-sm" type="button" data-action="social" data-p="Google">Google</button>
            <button class="btn btn-outline btn-sm" type="button" data-action="social" data-p="GitHub">GitHub</button>
          </div>
          <p class="switch">${signup ? 'Already have an account? <a href="#/login">Log in</a>' : 'New to UpClick? <a href="#/signup">Create an account</a>'}</p>
        </div>
      </div>
    </section>`;
  }

  function viewAbout() {
    const loves = store.get('loves', 0);
    const values = [
      ['Learn by doing', 'Every lesson ends with code you wrote yourself. Reading is good; building is better.'],
      ['Clear, honest pricing', 'One price, lifetime access, and a bundle discount when you take more than one course.'],
      ['Celebrate progress', 'Small wins add up. We mark every milestone, and every finished course ends with your own certificate.'],
      ['Listen and improve', 'Your feedback shapes what we build next. Tell us what works and what doesn’t.']
    ];
    return `
    <section class="split">
      <div>
        <p class="eyebrow">About us</p>
        <h1 class="h1 big">The UpClick <span class="shadow-text">Promise</span></h1>
        <p class="lead dark">We aim to provide the best learning experience possible. If you think you can find better, tell us — so we can become the number <span class="accent strong">1</span> brand in your life again.</p>
        <div class="actions">
          <a class="btn" href="#/courses">Start learning</a>
          <button class="btn btn-outline" type="button" data-action="feedback">Tell us how we’re doing</button>
        </div>
      </div>
      <div class="heart-wrap">
        <button class="heart-btn" type="button" data-action="heart" aria-label="Send UpClick some love">${HEART_SVG}</button>
        <p class="hint" id="loveCount" aria-live="polite">${loves ? `${plural(loves, 'heart')} sent 💜` : 'Tap the heart 💜'}</p>
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
    </section>`;
  }

  function learnItem(c, startPct) {
    const e = state.enrolled[c.id];
    const pct = Math.round(e.done.length / c.modules.length * 100);
    const shown = startPct ?? pct;
    return `<article class="learn-item ${e.completedAt ? 'complete' : ''}" data-id="${c.id}">
      <div class="learn-head">
        <div><h2 class="h3">${esc(c.title)}</h2><p class="course-sub">${esc(c.instructor)} · ${plural(c.modules.length, 'lesson')}</p></div>
        <div class="pct" data-pct>${shown}%</div>
      </div>
      <div class="progress" role="progressbar" aria-label="${esc(c.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${shown}%"></i></div>
      <ol class="lessons">
        ${c.modules.map((m, i) => {
          const d = e.done.includes(i);
          return `<li class="lesson ${d ? 'done' : ''}">
            <button class="check" type="button" data-action="lesson" data-id="${c.id}" data-i="${i}" aria-pressed="${d}" aria-label="Lesson ${i + 1}: ${esc(m)} — ${d ? 'completed' : 'mark complete'}">${d ? '✓' : ''}</button>
            <span class="lesson-title">${esc(m)}</span></li>`;
        }).join('')}
      </ol>
      ${e.completedAt
        ? `<a class="btn" href="#/certificate/${c.id}">🏆 View certificate</a>`
        : `<button class="btn btn-outline btn-sm" type="button" data-action="next-lesson" data-id="${c.id}">Complete next lesson</button>`}
    </article>`;
  }

  function viewLearning() {
    const ids = Object.keys(state.enrolled).filter(byId);
    if (!ids.length) {
      return `<section class="container empty-state">
        <span class="big-emoji" aria-hidden="true">🚀</span>
        <h1 class="h2">Nothing here yet</h1>
        <p class="lead" style="margin-inline:auto">Enrol in a course and your lessons, progress and certificates will live here.</p>
        <div class="actions"><a class="btn" href="#/courses">Find a course</a></div>
      </section>`;
    }
    const done = ids.filter(id => state.enrolled[id].completedAt).length;
    return `<section class="container">
      <p class="eyebrow">${state.user ? `${first(state.user.name)}’s dashboard` : 'Dashboard'}</p>
      <h1 class="h1">My <span class="shadow-text">learning</span></h1>
      <p class="lead">${plural(ids.length, 'course')} · ${plural(done, 'certificate')} earned. Tick off lessons as you go — finishing a course unlocks your certificate.</p>
      ${ids.map(id => learnItem(byId(id))).join('')}
    </section>`;
  }

  function viewCertificate(id) {
    const c = byId(id);
    const e = state.enrolled[id];
    if (!c || !e || !e.completedAt) {
      return `<section class="container empty-state">
        <span class="big-emoji" aria-hidden="true">🔒</span>
        <h1 class="h2">Certificate locked</h1>
        <p class="lead" style="margin-inline:auto">Finish every lesson in this course to unlock your certificate.</p>
        <div class="actions"><a class="btn" href="#/learning">Go to My Learning</a></div>
      </section>`;
    }
    const name = state.user?.name || 'UpClick Learner';
    const date = new Date(e.completedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
    const certId = 'UC-' + (e.completedAt % 1e8).toString(36).toUpperCase() + '-' + c.id.slice(0, 3).toUpperCase();
    const next = COURSES.filter(x => !state.enrolled[x.id] && x.id !== id)
      .sort((a, b) => (b.category === c.category) - (a.category === c.category) || LEVELS[a.level] - LEVELS[b.level] || b.rating - a.rating)
      .slice(0, 3);
    return `<section class="container">
      <div class="certificate" id="certificate">
        <span class="logo logo-sm">UPClick</span>
        <p class="eyebrow" style="margin-top:18px">Certificate of completion</p>
        <p>This certifies that</p>
        <h1 class="cert-name">${esc(name)}</h1>
        <p>has successfully completed</p>
        <h2 class="cert-course">${esc(c.title)}</h2>
        <p class="hint">${c.hours} hours · ${plural(c.modules.length, 'lesson')} · ${date}</p>
        <div class="seal" aria-hidden="true">★</div>
        <div class="cert-sign"><span>${esc(c.instructor)}</span><small>Instructor</small></div>
        <p class="cert-id">Certificate ID: ${certId}</p>
      </div>
      <div class="cert-actions">
        <button class="btn" type="button" data-action="print">Download / print</button>
        <button class="btn btn-outline" type="button" data-action="share" data-id="${c.id}">Copy share message</button>
      </div>
    </section>
    ${next.length ? `<section class="container">
      <h2 class="h2">Keep the momentum going</h2>
      <div class="list">${listHead(false)}<ul class="course-list">${next.map(x => courseRow(x)).join('')}</ul></div>
    </section>` : ''}`;
  }

  function viewNotFound() {
    return `<section class="container empty-state">
      <span class="big-emoji" aria-hidden="true">🧭</span>
      <h1 class="h2">404 — page not found</h1>
      <p class="lead" style="margin-inline:auto">That link went somewhere we haven’t built yet.</p>
      <div class="actions"><a class="btn" href="#/">Back home</a><a class="btn btn-outline" href="#/courses">Browse courses</a></div>
    </section>`;
  }

  const routes = {
    '': viewHome, courses: viewCourses, course: viewCourse, about: viewAbout, cart: viewCart,
    signup: () => viewAuth('signup'), login: () => viewAuth('login'),
    learning: viewLearning, certificate: viewCertificate
  };
  let typingTimer = null;

  function render() {
    clearTimeout(typingTimer);
    closeModal(false);
    closeNav();
    const [page = '', param] = location.hash.replace(/^#\/?/, '').split('/');
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
    observeReveals();
  }

  function updateNav() {
    const page = currentPage();
    $$('.nav [data-route]').forEach(a => {
      const on = a.dataset.route === page || (a.dataset.route === 'signup' && page === 'login') || (a.dataset.route === 'courses' && page === 'course') || (a.dataset.route === 'learning' && page === 'certificate');
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $('#authSlot').innerHTML = state.user
      ? `<span class="user-chip"><span class="avatar" aria-hidden="true">${esc(state.user.name.trim()[0] || '?').toUpperCase()}</span><button class="link-btn" type="button" data-action="logout">Log out</button></span>`
      : `<a href="#/signup" data-route="signup" class="${page === 'signup' || page === 'login' ? 'active' : ''}">SignUp</a>`;
    updateBadge();
  }

  function updateBadge() {
    const b = $('#cartBadge');
    b.textContent = state.cart.length;
    b.hidden = state.cart.length === 0;
  }
  function bumpBadge() {
    updateBadge();
    const b = $('#cartBadge');
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
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
      .replace(/\b(const|function|return)\b/g, '<span class="tok-k">$1</span>')
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
    out.innerHTML = runs === 1 ? '&gt; you just learned JavaScript! 🎉' : `&gt; you just learned JavaScript! 🎉 <span style="opacity:.6">(×${runs})</span>`;
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

  function toast(html, { icon = '✨', action, timeout = 3400 } = {}) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-ic" aria-hidden="true">${icon}</span><span>${html}</span>${action ? `<a class="toast-act" href="${action.href}">${action.label}</a>` : ''}`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, timeout);
  }

  let lastFocus = null;
  function openModal(html, label) {
    lastFocus = document.activeElement;
    const card = $('#modalCard');
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

  function flyToCart(from, done) {
    let target = $('.cart-link');
    if (!target || target.offsetParent === null) target = $('.nav-toggle');
    if (reduceMotion || !target) return done();
    const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    const dot = document.createElement('div');
    dot.className = 'fly-dot';
    dot.style.left = (ax - 10) + 'px';
    dot.style.top = (ay - 10) + 'px';
    document.body.appendChild(dot);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      dot.style.transform = `translate(${b.left + b.width / 2 - ax}px, ${b.top + b.height / 2 - ay}px) scale(.5)`;
      dot.style.opacity = '.4';
    }));
    setTimeout(() => { dot.remove(); done(); }, 720);
  }

  function addToCart(id, btn) {
    const c = byId(id);
    if (!c || state.cart.includes(id) || state.enrolled[id]) return;
    state.cart.push(id);
    save();
    flyToCart(btn, bumpBadge);
    $$(`[data-action="add"][data-id="${id}"]`).forEach(b => {
      const link = document.createElement('a');
      link.className = b.className.replace(/\bpop\b/, '') + ' added pop';
      link.href = '#/cart';
      link.textContent = '✓ In cart';
      b.replaceWith(link);
    });
    $$(`[data-action="buy-now"][data-id="${id}"]`).forEach(b => b.remove());
    toast(`<strong>${esc(c.title)}</strong> added to your cart`, { icon: '🛒', action: { label: 'View cart', href: '#/cart' } });
    if (state.cart.length === 2) setTimeout(() => toast('Bundle unlocked — <strong>10% off</strong> your order!', { icon: '🎁' }), 500);
  }

  function removeFromCart(id, btn) {
    const li = btn.closest('.cart-item');
    const finish = () => {
      state.cart = state.cart.filter(x => x !== id);
      save(); updateBadge();
      $('#app').innerHTML = `<div class="view">${viewCart()}</div>`;
    };
    if (li && !reduceMotion) { li.classList.add('removing'); setTimeout(finish, 330); } else finish();
  }

  function openCheckout() {
    const items = state.cart.map(byId).filter(Boolean);
    if (!items.length) return;
    const { discount, total } = totals(items);
    openModal(`
      <p class="eyebrow">Checkout</p>
      <h2 class="h3">Almost there${state.user ? ', ' + first(state.user.name) : ''}!</h2>
      <ul class="mini-list">${items.map(c => `<li><span>${esc(c.title)}</span><span>${money(c.price)}</span></li>`).join('')}</ul>
      ${discount ? `<div class="sum-row accent"><span>🎁 Bundle discount</span><span>−${money(discount)}</span></div>` : ''}
      <div class="sum-row total"><span>Total</span><span>${money(total)}</span></div>
      <form id="checkoutForm" novalidate style="margin-top:18px">
        ${field({ id: 'co-name', label: 'Full name', ac: 'name', rule: 'name', value: state.user?.name || '' })}
        ${field({ id: 'co-email', label: 'Email for your receipt', type: 'email', ac: 'email', rule: 'email', value: state.user?.email || '' })}
        <p class="hint">Prototype checkout — no payment details are collected.</p>
        <button class="btn btn-block" type="submit">Pay ${money(total)} &amp; enrol</button>
      </form>`, 'Checkout');
  }

  const validators = {
    name: v => v.trim().length >= 2 || 'Please enter your name.',
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
    const inputs = $$('input[data-rule]', form);
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
    const map = [['8+ characters', '#e6dfeb'], ['Weak', '#cf2a4a'], ['Okay', '#e08a00'], ['Strong', '#1f9d63'], ['Excellent 💪', '#9a0da3']];
    meter.style.width = (pw ? Math.max(12, s * 25) : 0) + '%';
    meter.style.background = map[s][1];
    label.textContent = pw ? map[s][0] : map[0][0];
  }

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'q') { state.catalog.q = t.value; renderCourseList(); return; }
    if (t.matches('input[data-rule]') && t.closest('.field').classList.contains('invalid')) check(t);
    if (t.id === 'password') updateStrength(t.value);
  });
  document.addEventListener('focusout', e => {
    const t = e.target;
    if (t.matches && t.matches('input[data-rule]') && t.value) check(t);
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'level') { state.catalog.level = t.value; renderCourseList(); }
    if (t.id === 'sort') { const [s, d] = t.value.split(':'); state.catalog.sort = s; state.catalog.dir = d; renderCourseList(); }
  });

  document.addEventListener('submit', e => {
    const f = e.target;
    if (f.id === 'authForm') { e.preventDefault(); submitAuth(f); }
    if (f.id === 'checkoutForm') { e.preventDefault(); submitCheckout(f); }
    if (f.id === 'feedbackForm') { e.preventDefault(); submitFeedback(f); }
  });

  function submitAuth(f) {
    if (!validateForm(f)) return;
    const mode = f.dataset.mode;
    const btn = f.querySelector('[type=submit]');
    setLoading(btn, true, mode === 'signup' ? 'Creating your account…' : 'Logging in…');
    setTimeout(() => {
      const email = $('#email', f).value.trim();
      const key = email.toLowerCase();
      const accounts = store.get('accounts', {});
      let name;
      if (mode === 'signup') {
        name = $('#name', f).value.trim();
        accounts[key] = { name };
        store.set('accounts', accounts);
      } else {
        name = accounts[key]?.name || email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
      }
      state.user = { name, email };
      save();
      updateNav();
      setLoading(btn, false);
      const nextHref = state.cart.length ? '#/cart' : Object.keys(state.enrolled).length ? '#/learning' : '#/courses';
      const nextLabel = state.cart.length ? 'Back to my cart' : Object.keys(state.enrolled).length ? 'Continue learning' : 'Pick my first course';
      openModal(`<div class="success">${CHECK_SVG}
        <h2 class="h2">${mode === 'signup' ? 'Welcome aboard' : 'Welcome back'}, ${first(name)}! 🚀</h2>
        <p class="lead">${mode === 'signup' ? 'Your account is ready. Your first line of code is one click away.' : 'Good to see you again — let’s pick up where you left off.'}</p>
        <a class="btn btn-block" href="${nextHref}">${nextLabel}</a></div>`, 'Welcome');
      celebrate('medium');
    }, 900);
  }

  function submitCheckout(f) {
    if (!validateForm(f)) return;
    const btn = f.querySelector('[type=submit]');
    setLoading(btn, true, 'Processing…');
    setTimeout(() => {
      const name = $('#co-name', f).value.trim();
      const email = $('#co-email', f).value.trim();
      const items = state.cart.filter(byId);
      if (!state.user) state.user = { name, email };
      items.forEach(id => { if (!state.enrolled[id]) state.enrolled[id] = { done: [], completedAt: null, enrolledAt: Date.now() }; });
      state.cart = [];
      state.session.enrolled += items.length;
      save();
      updateNav();
      if (currentPage() === 'cart' || currentPage() === 'course') $('#app').innerHTML = `<div class="view">${(currentPage() === 'cart' ? viewCart : () => viewCourse(location.hash.split('/')[2]))()}</div>`;
      $('#modalCard').innerHTML = `<button class="modal-x" type="button" data-action="close-modal" aria-label="Close">✕</button>
        <div class="success">${CHECK_SVG}
          <p class="eyebrow">Order confirmed</p>
          <h2 class="h2">You’re in, ${first(name)}! 🎉</h2>
          <p>You’re now enrolled in <strong>${plural(items.length, 'course')}</strong>:</p>
          <ul class="enrolled-list">${items.map(id => `<li>✓ ${esc(byId(id).title)}</li>`).join('')}</ul>
          <a class="btn btn-block" href="#/learning">Start my first lesson →</a>
          <p class="hint">A receipt would be sent to ${esc(email)}.</p>
        </div>`;
      $('#modalCard .btn').focus();
      celebrate('big');
    }, 1400);
  }

  function submitFeedback(f) {
    const picked = f.querySelector('input[name=rate]:checked');
    if (!picked) { toast('Pick a face first — it takes one tap.', { icon: '👆' }); return; }
    const rating = +picked.value;
    const happy = rating >= 4;
    $('#modalCard').innerHTML = `<button class="modal-x" type="button" data-action="close-modal" aria-label="Close">✕</button>
      <div class="success"><div class="trophy">${happy ? '💜' : '🛠️'}</div>
        <h2 class="h2">${happy ? 'You just made our day!' : 'Thank you for being honest.'}</h2>
        <p class="lead">${happy ? 'We’ll keep raising the bar so UpClick stays your number 1.' : 'We read every response, and this one goes straight to the team to make UpClick better.'}</p>
        <button class="btn btn-block" type="button" data-action="close-modal">Back to UpClick</button></div>`;
    $('#modalCard .btn').focus();
    if (happy) celebrate('medium');
  }

  function toggleLesson(id, i) {
    const c = byId(id), e = state.enrolled[id];
    if (!c || !e) return;
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

    const art = $(`.learn-item[data-id="${id}"]`);
    if (art) {
      const tmp = document.createElement('div');
      tmp.innerHTML = learnItem(c, before).trim();
      const neu = tmp.firstElementChild;
      art.replaceWith(neu);
      requestAnimationFrame(() => requestAnimationFrame(() => { neu.querySelector('.progress i').style.width = after + '%'; }));
      countTo(neu.querySelector('[data-pct]'), before, after);
      const btn = neu.querySelector(`[data-i="${i}"]`);
      if (btn) {
        btn.focus({ preventScroll: true });
        if (completing) { btn.closest('.lesson').classList.add('fresh'); celebrate('small', btn); }
      }
    }
    if (completing && before < 50 && after >= 50 && !justFinished) toast('Halfway there — keep that streak going!', { icon: '💪' });
    if (justFinished) {
      setTimeout(() => {
        openModal(`<div class="success"><div class="trophy">🏆</div>
          <p class="eyebrow">Course complete</p>
          <h2 class="h2">You did it${state.user ? ', ' + first(state.user.name) : ''}!</h2>
          <p class="lead">You finished <strong>${esc(c.title)}</strong> — all ${total} lessons. Your certificate is ready.</p>
          <a class="btn btn-block" href="#/certificate/${id}">Claim my certificate</a></div>`, 'Course complete');
        celebrate('big');
      }, 550);
    }
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
        h.textContent = ['💜', '💖', '💗', '🤍'][i % 4];
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
    $('#loveCount').textContent = `${plural(loves, 'heart')} sent 💜`;
    if (loves % 10 === 0) { celebrate('medium'); toast(`${loves} hearts! You really love us.`, { icon: '💜' }); }
  }

  function openFeedback() {
    openModal(`<p class="eyebrow">Feedback</p><h2 class="h3">How are we doing?</h2>
      <form id="feedbackForm">
        <fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Rate UpClick from 1 to 5</legend>
        <div class="faces">
          ${['😞', '😕', '😐', '🙂', '🤩'].map((f, i) => `<label class="face"><input type="radio" name="rate" value="${i + 1}"><span aria-hidden="true">${f}</span><span class="sr-only">${i + 1} out of 5</span></label>`).join('')}
        </div></fieldset>
        <label class="lbl" for="fb">Anything we could do better? <span class="hint">(optional)</span></label>
        <textarea id="fb" class="input" rows="3"></textarea>
        <button class="btn btn-block" type="submit" style="margin-top:16px">Send feedback</button>
      </form>`, 'Feedback');
  }

  function logout() {
    const s = state.session;
    const certs = Object.values(state.enrolled).filter(e => e.completedAt).length;
    openModal(`<div class="success"><div class="trophy">👋</div>
      <h2 class="h2">See you soon, ${first(state.user?.name)}!</h2>
      <p>Here’s what you achieved this session:</p>
      <ul class="session-stats">
        <li><strong>${s.lessons}</strong><span>lessons done</span></li>
        <li><strong>${s.enrolled}</strong><span>courses joined</span></li>
        <li><strong>${certs}</strong><span>certificates</span></li>
      </ul>
      <p class="lead">${s.lessons ? 'Great work — every lesson counts. Your progress is saved.' : 'Next time, try one lesson — it only takes a few minutes.'}</p>
      <button class="btn btn-block" type="button" data-action="confirm-logout">Log out</button>
      <button class="btn btn-ghost btn-block" type="button" data-action="close-modal">Keep learning</button></div>`, 'Log out');
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const id = t.dataset.id;
    switch (t.dataset.action) {
      case 'add': addToCart(id, t); break;
      case 'remove': removeFromCart(id, t); break;
      case 'checkout': openCheckout(); break;
      case 'buy-now':
        if (!state.cart.includes(id)) { state.cart.push(id); save(); bumpBadge(); }
        openCheckout(); break;
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
        if (next > -1) toggleLesson(id, next);
        break;
      }
      case 'close-modal': closeModal(); break;
      case 'logout': logout(); break;
      case 'confirm-logout':
        state.user = null; save(); closeModal(false);
        toast('You’re logged out. Your progress is saved on this device.', { icon: '👋' });
        if (location.hash === '#/' || location.hash === '') render(); else location.hash = '#/';
        break;
      case 'run-code': runCode(t); break;
      case 'heart': heartBurst(e, t); break;
      case 'feedback': openFeedback(); break;
      case 'print': window.print(); break;
      case 'share': {
        const c = byId(id);
        const text = `I just earned my UpClick certificate for "${c.title}"! 🎉`;
        (navigator.clipboard?.writeText(text) || Promise.reject())
          .then(() => toast('Share message copied — go show it off!', { icon: '📋' }))
          .catch(() => toast(esc(text), { icon: '📋', timeout: 6000 }));
        break;
      }
      case 'social': toast(`${esc(t.dataset.p)} sign-in isn’t connected in this prototype — use email for now.`, { icon: 'ℹ️' }); break;
      case 'forgot': e.preventDefault(); toast('Password reset isn’t available in this prototype.', { icon: 'ℹ️' }); break;
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
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName) && $('#q')) { e.preventDefault(); $('#q').focus(); }
    if (e.key === 'Tab' && !$('#modal').hidden) {
      const f = $$('#modalCard a, #modalCard button, #modalCard input, #modalCard textarea').filter(el => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const firstEl = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  });

  window.addEventListener('hashchange', render);
  render();
})();
