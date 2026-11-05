'use strict';
/* Trader Maths Trainer: renderer. Plain JS, no framework. */

const view = document.getElementById('view');
let topics = [];
let cleanup = null;

// Tiny DOM helper: h('div', {class: 'x', onclick: fn}, child, child...)
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}
const topicById = (id) => topics.find((t) => t.id === id);
const accent = (el, t) => el.style.setProperty('--accent', t.color);
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const secs = (ms) => (ms / 1000).toFixed(1) + 's';

function go(fn, ...args) {
  if (cleanup) { cleanup(); cleanup = null; }
  view.replaceChildren();
  view.style.removeProperty('--accent');
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.nav === fn.nav));
  fn(...args);
  refreshBadge();
}

async function refreshBadge() {
  const rc = await api.reviewCount();
  const b = document.getElementById('review-badge');
  b.textContent = rc.total;
  b.hidden = rc.total === 0;
}

/* ---------- Shared: ask one question and show feedback ---------- */
function ask(box, t, q, { sessionId, onResult, nextLabel = 'Next', tag = '' }) {
  return new Promise((resolve) => {
    box.replaceChildren();
    box.className = 'qbox ' + t.style;
    accent(box, t);
    const t0 = performance.now();

    const input = h('input', { id: 'ans', type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'Your answer', 'aria-label': 'Your answer' });
    const submit = h('button', { class: 'btn primary', id: 'submit', type: 'submit' }, 'Submit');
    const skip = h('button', { class: 'btn', id: 'skip', type: 'button' }, 'Skip');
    const msg = h('div', { class: 'msg' }, q.hint ? `Format: ${q.hint}` : '');
    const form = h('form', { class: 'answer-row' }, input, submit, skip);
    const fb = h('div');

    box.append(
      h('div', { class: 'qtag' }, `${t.name} · Level ${q.level} ${t.levels[q.level - 1] || ''}${tag ? ' · ' + tag : ''}`),
      h('div', { class: 'prompt ' + t.style }, q.prompt),
      form, msg, fb,
    );

    async function send(value) {
      const ms = performance.now() - t0;
      const r = await api.answer({ qid: q.qid, input: value, ms, sessionId });
      if (r.invalid) {
        msg.textContent = 'Enter a number, a fraction like 5/36, or a percent like 20%.';
        msg.className = 'msg warn';
        input.focus();
        return;
      }
      input.disabled = true; submit.hidden = true; skip.hidden = true; msg.textContent = '';
      if (onResult) onResult(r, ms, q);
      const good = r.correct;
      const next = h('button', { class: 'btn primary', id: 'next' }, nextLabel);
      next.addEventListener('click', () => resolve({ r, ms }));
      fb.replaceChildren(h('div', { class: 'feedback ' + (good ? 'good' : 'bad') },
        h('div', { class: 'verdict' }, r.skipped ? 'Skipped' : good ? 'Correct' : 'Not quite'),
        h('div', { class: 'ans' }, `Answer: ${r.display}`),
        r.explanation ? h('div', { class: 'why' }, r.explanation) : null,
        h('div', { class: 'time' }, `Time: ${secs(ms)}`),
      ), h('div', { class: 'next-row' }, next, h('span', { class: 'hint-key' }, 'or press Enter')));
      next.focus();
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); if (input.value.trim()) send(input.value); });
    skip.addEventListener('click', () => send(null));
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') send(null); });
    input.focus();
  });
}

/* ---------- Home ---------- */
async function viewHome() {
  const [ts, st, rc] = await Promise.all([api.topics(), api.stats(), api.reviewCount()]);
  topics = ts;
  const byTopic = Object.fromEntries(st.topics.map((s) => [s.topic, s]));
  view.append(
    h('h1', { class: 'page-title' }, 'Choose a topic'),
    h('div', { class: 'page-sub' }, 'Each topic has five levels. Auto level adapts to how you are doing.'),
  );
  const group = (label, list) => {
    if (!list.length) return;
    view.append(h('div', { class: 'section-label' }, label));
    view.append(h('div', { class: 'grid' }, list.map((t) => {
      const s = byTopic[t.id];
      const card = h('button', { class: 'card ' + t.style, 'data-topic': t.id, onclick: () => go(viewPractice, t.id, 0) },
        h('div', { class: 'card-head' },
          h('div', { class: 'glyph ' + t.style }, t.glyph),
          h('div', {}, h('h3', {}, t.name), h('div', { class: 'kind' }, t.style === 'expr' ? 'Speed drill' : 'Reasoning'))),
        h('p', {}, t.desc),
        h('div', { class: 'bar' }, h('i')),
        h('div', { class: 'card-foot' },
          h('span', {}, `Level ${t.levelEst.toFixed(1)} of ${t.levels.length}`),
          h('span', {}, s && s.attempts ? `${pct(s.correct, s.attempts)}% · ${s.attempts} answered` : 'Not started')),
      );
      accent(card, t);
      card.querySelector('.bar > i').style.width = `${Math.min(100, ((t.levelEst - 1) / (t.levels.length - 1)) * 100 || 4)}%`;
      return card;
    })));
  };
  group('Speed drills', topics.filter((t) => t.style === 'expr'));
  group('Reasoning', topics.filter((t) => t.style !== 'expr'));
  if (rc.total) view.append(h('div', { class: 'section-label' }, 'Review'),
    h('div', { class: 'panel' }, `${rc.total} missed question${rc.total === 1 ? '' : 's'} waiting. `, h('button', { class: 'btn link', onclick: () => go(viewReview) }, 'Start review →')));
}
viewHome.nav = 'home';

/* ---------- Practice ---------- */
async function viewPractice(topicId, level) {
  if (!topics.length) topics = await api.topics();
  const t = topicById(topicId);
  accent(view, t);
  const sessionId = await api.startSession({ mode: 'practice', topic: t.id });
  const counts = { total: 0, correct: 0, streak: 0, ms: 0 };
  let alive = true;
  cleanup = () => {
    alive = false;
    if (counts.total) api.endSession({ id: sessionId, score: counts.correct, total: counts.total, correct: counts.correct });
  };

  const stat = (label) => { const b = h('b', {}, '0'); return [h('div', {}, label, b), b]; };
  const [aBox, aVal] = stat('Answered');
  const [cBox, cVal] = stat('Accuracy');
  const [sBox, sVal] = stat('Streak');
  const [tBox, tVal] = stat('Avg time');

  const pills = h('div', { class: 'pills' },
    [0, ...t.levels.map((_, i) => i + 1)].map((l) =>
      h('button', { class: 'pill' + (l === level ? ' on' : ''), onclick: () => go(viewPractice, t.id, l) },
        l === 0 ? 'Auto' : `${l} ${t.levels[l - 1]}`)));
  const box = h('div');
  view.append(
    h('div', { class: 'topic-head' },
      h('button', { class: 'btn link', onclick: () => go(viewHome) }, '← Topics'),
      h('div', { class: 'glyph ' + t.style }, t.glyph),
      h('div', { class: 'grow' }, h('h1', { class: 'page-title' }, t.name), h('div', { class: 'page-sub' }, 'Practice · explanations after every answer'))),
    pills, h('div', { class: 'scoreboard' }, aBox, cBox, sBox, tBox), box,
  );

  while (alive) {
    const q = await api.next({ topic: t.id, level });
    if (!alive) break;
    await ask(box, t, q, {
      sessionId,
      onResult: (r, ms) => {
        if (r.skipped) return;
        counts.total++; counts.ms += ms;
        if (r.correct) { counts.correct++; counts.streak++; } else counts.streak = 0;
        aVal.textContent = counts.total; cVal.textContent = pct(counts.correct, counts.total) + '%';
        sVal.textContent = counts.streak; tVal.textContent = secs(counts.ms / counts.total);
      },
    });
  }
}
viewPractice.nav = 'home';

/* ---------- Review ---------- */
async function viewReview(topicFilter) {
  if (!topics.length) topics = await api.topics();
  const rc = await api.reviewCount();
  view.append(h('h1', { class: 'page-title' }, 'Review'),
    h('div', { class: 'page-sub' }, 'Questions you missed come back here. Get one right twice in a row and it leaves the queue.'));
  if (!rc.total) {
    view.append(h('div', { class: 'panel empty' }, 'Nothing to review yet. Miss a question in Practice or Sprint and it will appear here.'));
    return;
  }
  const pills = h('div', { class: 'pills' },
    h('button', { class: 'pill' + (!topicFilter ? ' on' : ''), onclick: () => go(viewReview, null) }, `All (${rc.total})`),
    topics.filter((t) => rc.byTopic[t.id]).map((t) =>
      h('button', { class: 'pill' + (topicFilter === t.id ? ' on' : ''), onclick: () => go(viewReview, t.id) }, `${t.name} (${rc.byTopic[t.id]})`)));
  const box = h('div');
  view.append(pills, box);
  let alive = true;
  cleanup = () => { alive = false; };
  while (alive) {
    const q = await api.reviewNext({ topic: topicFilter || undefined });
    if (!alive) break;
    if (!q) { box.replaceChildren(h('div', { class: 'panel empty' }, 'Review queue cleared. Nice work.')); break; }
    const t = topicById(q.topic);
    await ask(box, t, q, { tag: 'Review' });
    refreshBadge();
  }
}
viewReview.nav = 'review';

/* ---------- Sprint ---------- */
const PRESETS = [
  { id: 'optiver', name: 'Optiver style', note: '80 questions, 8 min. Pure speed.', count: 80, minutes: 8, level: 3, topics: ['arithmetic', 'fractions', 'estimation'] },
  { id: 'jane', name: 'Jane Street style', note: '10 questions, 20 min. Reasoning.', count: 10, minutes: 20, level: 3, topics: ['probability', 'ev', 'bayes'] },
  { id: 'sig', name: 'SIG style', note: '30 questions, 20 min. Mixed.', count: 30, minutes: 20, level: 3, topics: ['arithmetic', 'probability', 'ev', 'market'] },
  { id: 'custom', name: 'Custom', note: 'Choose everything yourself.', count: 20, minutes: 5, level: 0, topics: null },
];

async function viewSprint() {
  if (!topics.length) topics = await api.topics();
  let preset = PRESETS[0];
  const sel = { count: preset.count, minutes: preset.minutes, level: preset.level, topics: new Set(preset.topics) };

  const presetBox = h('div', { class: 'presets' });
  const form = h('div', { class: 'panel' });
  const err = h('div', { class: 'msg warn' });

  function drawForm() {
    const count = h('input', { type: 'number', min: 1, max: 200, value: sel.count, id: 'count', onchange: (e) => { sel.count = Math.max(1, Math.min(200, +e.target.value || 1)); } });
    const minutes = h('input', { type: 'number', min: 1, max: 60, value: sel.minutes, id: 'minutes', onchange: (e) => { sel.minutes = Math.max(1, Math.min(60, +e.target.value || 1)); } });
    const level = h('div', { class: 'pills' }, [0, 1, 2, 3, 4, 5].map((l) =>
      h('button', { class: 'pill' + (sel.level === l ? ' on' : ''), onclick: () => { sel.level = l; drawForm(); } }, l === 0 ? 'Auto' : `Level ${l}`)));
    const checks = h('div', { class: 'checks' }, topics.map((t) => {
      const cb = h('input', { type: 'checkbox', 'data-topic': t.id, ...(sel.topics.has(t.id) ? { checked: true } : {}) });
      cb.addEventListener('change', () => { cb.checked ? sel.topics.add(t.id) : sel.topics.delete(t.id); });
      const dot = h('span', { class: 'dot' });
      const lab = h('label', { class: 'check' }, cb, dot, t.name);
      accent(lab, t);
      return lab;
    }));
    form.replaceChildren(
      h('div', { class: 'form-row' }, h('label', {}, 'Questions', count), h('label', {}, 'Minutes', minutes)),
      h('div', { class: 'section-label' }, 'Difficulty'), level,
      h('div', { class: 'section-label' }, 'Topics'), checks,
      h('div', { class: 'section-label' }, 'Scoring'),
      h('div', { class: 'page-sub' }, 'Correct +1, wrong −1, skip 0. Guessing is punished, like on the real screens. Misses go to Review.'),
      h('button', { class: 'btn primary big', id: 'start', onclick: start }, 'Start sprint'), err,
    );
  }
  function drawPresets() {
    presetBox.replaceChildren(PRESETS.map((p) => h('button', {
      class: 'preset' + (p === preset ? ' on' : ''), 'data-preset': p.id,
      onclick: () => {
        preset = p;
        if (p.topics) Object.assign(sel, { count: p.count, minutes: p.minutes, level: p.level, topics: new Set(p.topics) });
        drawPresets(); drawForm();
      },
    }, h('b', {}, p.name), h('span', {}, p.note))));
  }
  function start() {
    if (!sel.topics.size) { err.textContent = 'Pick at least one topic.'; return; }
    go(runSprint, { count: sel.count, seconds: sel.minutes * 60, level: sel.level, topics: [...sel.topics] });
  }
  view.append(h('h1', { class: 'page-title' }, 'Sprint'),
    h('div', { class: 'page-sub' }, 'A timed test across several topics. Presets are inspired by the style of each firm\'s screening test.'),
    presetBox, h('div', { class: 'section-label' }, 'Settings'), form);
  drawPresets(); drawForm();
}
viewSprint.nav = 'sprint';

async function runSprint(cfg) {
  if (!topics.length) topics = await api.topics();
  const sessionId = await api.startSession({ mode: 'sprint', topic: cfg.topics.join(',') });
  const res = { score: 0, correct: 0, wrong: 0, skipped: 0, ms: 0, answered: 0, missed: [], per: {} };
  let alive = true, finished = false;
  const deadline = performance.now() + cfg.seconds * 1000;

  const clock = h('span', { class: 'clock' }, '');
  const prog = h('span', {}, '');
  const bar = h('i');
  const barWrap = h('div', { class: 'timer-bar' }, bar);
  const last = h('div', { class: 'lastres' }, '');
  const box = h('div');
  view.append(h('div', { class: 'sprint-top' }, prog, clock), barWrap, box, last);

  const tick = setInterval(() => {
    const left = Math.max(0, deadline - performance.now());
    const s = Math.ceil(left / 1000);
    clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    bar.style.width = `${(left / (cfg.seconds * 1000)) * 100}%`;
    barWrap.classList.toggle('low', left < 30000 || left / (cfg.seconds * 1000) < 0.15);
    if (left <= 0) finish();
  }, 200);
  cleanup = () => { alive = false; clearInterval(tick); if (!finished) { finished = true; endSession(); } };
  function endSession() { api.endSession({ id: sessionId, score: res.score, total: res.answered, correct: res.correct }); }
  function finish() {
    if (finished) return;
    finished = true; alive = false; clearInterval(tick); endSession();
    cleanup = null;
    showResults(cfg, res);
  }

  let n = 0;
  while (alive && n < cfg.count) {
    const topicId = cfg.topics[Math.floor(Math.random() * cfg.topics.length)];
    const q = await api.next({ topic: topicId, level: cfg.level });
    if (!alive) break;
    n++;
    prog.textContent = `Question ${n} of ${cfg.count} · Score ${res.score}`;
    const t = topicById(topicId);
    // Sprint: no explanation panel. Answer, then straight on.
    const outcome = await sprintAsk(box, t, q, sessionId);
    if (!alive) break;
    if (outcome === null) continue; // timer ended mid-question
    res.answered += outcome.skipped ? 0 : 1;
    res.ms += outcome.ms;
    const per = (res.per[topicId] ||= { n: 0, ok: 0, ms: 0 });
    if (outcome.skipped) { res.skipped++; last.className = 'lastres'; last.replaceChildren('Skipped'); }
    else {
      per.n++; per.ms += outcome.ms;
      if (outcome.r.correct) { res.score += 1; res.correct++; per.ok++; last.className = 'lastres good'; last.replaceChildren(h('b', {}, '✓ Correct'), `  ${q.prompt} = ${outcome.r.display}`); }
      else { res.score -= 1; res.wrong++; res.missed.push({ prompt: q.prompt, display: outcome.r.display, explanation: outcome.r.explanation, topic: topicId }); last.className = 'lastres bad'; last.replaceChildren(h('b', {}, '✗ Wrong'), `  ${q.prompt} = ${outcome.r.display}`); }
    }
    prog.textContent = `Question ${Math.min(n, cfg.count)} of ${cfg.count} · Score ${res.score}`;
  }
  if (alive) finish();

  function sprintAsk(box, t, q) {
    return new Promise((resolve) => {
      box.replaceChildren();
      box.className = 'qbox ' + t.style;
      accent(box, t);
      const t0 = performance.now();
      const input = h('input', { id: 'ans', type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: 'Your answer', 'aria-label': 'Your answer' });
      const submit = h('button', { class: 'btn primary', type: 'submit' }, 'Answer');
      const skip = h('button', { class: 'btn', type: 'button', id: 'skip' }, 'Skip (Esc)');
      const msg = h('div', { class: 'msg' }, q.hint ? `Format: ${q.hint}` : '');
      const form = h('form', { class: 'answer-row' }, input, submit, skip);
      box.append(h('div', { class: 'qtag' }, t.name), h('div', { class: 'prompt ' + t.style }, q.prompt), form, msg);
      let busy = false;
      async function send(v) {
        if (busy) return; busy = true;
        const ms = performance.now() - t0;
        const r = await api.answer({ qid: q.qid, input: v, ms, sessionId });
        if (r.invalid) { busy = false; msg.textContent = 'Not a number. Try again, or Esc to skip.'; msg.className = 'msg warn'; return; }
        resolve({ r, ms, skipped: r.skipped });
      }
      form.addEventListener('submit', (e) => { e.preventDefault(); if (input.value.trim()) send(input.value); });
      skip.addEventListener('click', () => send(null));
      input.addEventListener('keydown', (e) => { if (e.key === 'Escape') send(null); });
      input.focus();
    });
  }
}
runSprint.nav = 'sprint';

function showResults(cfg, res) {
  view.replaceChildren();
  const avg = res.answered ? res.ms / res.answered : 0;
  view.append(
    h('h1', { class: 'page-title' }, 'Sprint complete'),
    h('div', { class: 'page-sub' }, `${cfg.count} questions, ${cfg.seconds / 60} minutes`),
    h('div', { class: 'panel' },
      h('div', { class: 'big-score', id: 'final-score' }, `${res.score}`),
      h('div', { class: 'page-sub' }, 'final score'),
      h('div', { class: 'result-grid' },
        h('div', {}, 'Correct', h('b', {}, res.correct)), h('div', {}, 'Wrong', h('b', {}, res.wrong)),
        h('div', {}, 'Skipped', h('b', {}, res.skipped)), h('div', {}, 'Accuracy', h('b', {}, pct(res.correct, res.answered) + '%')),
        h('div', {}, 'Avg time', h('b', {}, secs(avg)))),
      h('div', { class: 'form-row' },
        h('button', { class: 'btn primary', onclick: () => go(runSprint, cfg) }, 'Go again'),
        h('button', { class: 'btn', onclick: () => go(viewSprint) }, 'Change settings'),
        res.missed.length ? h('button', { class: 'btn', onclick: () => go(viewReview, null) }, 'Review misses') : null)),
    h('div', { class: 'section-label' }, 'By topic'),
    h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Topic'), h('th', { class: 'num' }, 'Answered'), h('th', { class: 'num' }, 'Accuracy'), h('th', { class: 'num' }, 'Avg time'))),
      h('tbody', {}, Object.entries(res.per).map(([id, p]) => {
        const t = topicById(id);
        const name = h('span', { class: 'dotname' }, h('i'), t.name);
        accent(name, t);
        return h('tr', {}, h('td', {}, name), h('td', { class: 'num' }, p.n), h('td', { class: 'num' }, pct(p.ok, p.n) + '%'), h('td', { class: 'num' }, secs(p.n ? p.ms / p.n : 0)));
      }))),
  );
  if (res.missed.length) {
    view.append(h('div', { class: 'section-label' }, `Missed (${res.missed.length})`),
      h('div', { class: 'missed' }, res.missed.map((m) => h('div', { class: 'item' },
        h('div', { class: 'p' }, m.prompt), h('div', { class: 'a' }, `Answer: ${m.display}. ${m.explanation}`)))));
  }
  refreshBadge();
}

/* ---------- Stats ---------- */
async function viewStats() {
  const [ts, st] = await Promise.all([api.topics(), api.stats()]);
  topics = ts;
  const by = Object.fromEntries(st.topics.map((s) => [s.topic, s]));
  view.append(h('h1', { class: 'page-title' }, 'Stats'), h('div', { class: 'page-sub' }, 'Accuracy and speed per topic, saved on this computer.'));

  view.append(h('div', { class: 'section-label' }, 'Topics'),
    h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Topic'), h('th', { class: 'num' }, 'Answered'), h('th', { class: 'num' }, 'Accuracy'), h('th', { class: 'num' }, 'Avg time'), h('th', { class: 'num' }, 'Level'))),
      h('tbody', {}, topics.map((t) => {
        const s = by[t.id];
        const name = h('span', { class: 'dotname' }, h('i'), t.name);
        accent(name, t);
        return h('tr', {}, h('td', {}, name),
          h('td', { class: 'num' }, s ? s.attempts : 0),
          h('td', { class: 'num' }, s && s.attempts ? pct(s.correct, s.attempts) + '%' : '–'),
          h('td', { class: 'num' }, s && s.attempts ? secs(s.total_ms / s.attempts) : '–'),
          h('td', { class: 'num' }, t.levelEst.toFixed(1)));
      }))));

  view.append(h('div', { class: 'section-label' }, 'Questions answered, last 14 days'));
  const days = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000); days.push(d.toLocaleDateString('en-CA')); }
  const map = Object.fromEntries(st.days.map((d) => [d.day, d]));
  const max = Math.max(1, ...st.days.map((d) => d.n));
  view.append(h('div', { class: 'chart' }, days.map((d) => {
    const row = map[d];
    const col = h('div', { class: 'col', title: row ? `${d}: ${row.n} answered, ${pct(row.ok, row.n)}%` : d }, h('i'), h('span', {}, d.slice(8)));
    col.querySelector('i').style.height = row ? `${Math.max(2, (row.n / max) * 100)}%` : '2px';
    return col;
  })));

  view.append(h('div', { class: 'section-label' }, 'Recent sessions'));
  if (!st.sessions.length) view.append(h('div', { class: 'empty' }, 'No finished sessions yet.'));
  else view.append(h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'When'), h('th', {}, 'Mode'), h('th', { class: 'num' }, 'Answered'), h('th', { class: 'num' }, 'Correct'), h('th', { class: 'num' }, 'Score'))),
    h('tbody', {}, st.sessions.map((s) => h('tr', {}, h('td', {}, new Date(s.started).toLocaleString()), h('td', {}, s.mode === 'sprint' ? 'Sprint' : (topicById(s.topic) || { name: 'Practice' }).name),
      h('td', { class: 'num' }, s.total), h('td', { class: 'num' }, s.correct), h('td', { class: 'num' }, s.score))))));
}
viewStats.nav = 'stats';

/* ---------- Boot ---------- */
document.querySelectorAll('.nav-btn').forEach((b) => b.addEventListener('click', () => {
  const dest = { home: viewHome, sprint: viewSprint, review: viewReview, stats: viewStats }[b.dataset.nav];
  go(dest);
}));
api.topics().then((ts) => { topics = ts; go(viewHome); });
