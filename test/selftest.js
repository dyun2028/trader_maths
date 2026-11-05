// Run with: npm test
// Generates many questions from every topic and level and checks they are well formed,
// and that the stated answer is accepted by the answer checker.
const { topics } = require('../src/topics');
const { parseAnswer, isCorrect } = require('../src/answer');

let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL:', msg); };

// Answer parser checks
const cases = [
  ['12', 12], ['1,234', 1234], ['5/36', 5 / 36], ['0.5', 0.5], ['-3.5', -3.5], ['−3.5', -3.5], ['$5', 5], ['1e3', 1000],
];
for (const [inp, want] of cases) {
  const p = parseAnswer(inp);
  if (!p || Math.abs(p.value - want) > 1e-12) fail(`parse "${inp}"`);
}
for (const bad of ['', 'abc', '1/0', '--2', null]) if (parseAnswer(bad)) fail(`should reject "${bad}"`);
if (!isCorrect(parseAnswer('20%'), 20, 0.005) || !isCorrect(parseAnswer('20%'), 0.2, 0.005)) fail('percent handling');
if (isCorrect(parseAnswer('0.17'), 1 / 6, 0.003)) fail('tolerance too loose');
if (!isCorrect(parseAnswer('1/6'), 1 / 6, 0.003)) fail('fraction input');

const N = 400;
for (const t of topics) {
  if (!/^#[0-9a-f]{6}$/i.test(t.color)) fail(`${t.id}: bad colour`);
  if (!['expr', 'word'].includes(t.style)) fail(`${t.id}: bad style`);
  for (let level = 1; level <= t.levels.length; level++) {
    const seen = new Set();
    for (let i = 0; i < N; i++) {
      let q;
      try { q = t.generate(level); } catch (e) { fail(`${t.id} L${level}: threw ${e.message}`); break; }
      const where = `${t.id} L${level} "${q && q.prompt}"`;
      if (!q || typeof q.prompt !== 'string' || !q.prompt) { fail(`${where}: no prompt`); continue; }
      if (/undefined|NaN|Infinity/.test(q.prompt + (q.explanation || '') + (q.display || ''))) fail(`${where}: bad text`);
      if (!Number.isFinite(q.answer)) fail(`${where}: non-finite answer`);
      if (!q.explanation) fail(`${where}: no explanation`);
      if (!isCorrect({ value: q.answer, pct: false }, q.answer, q.tol || 0)) fail(`${where}: own answer rejected`);
      seen.add(q.prompt);
    }
    console.log(`${t.id.padEnd(12)} L${level} ${t.levels[level - 1].padEnd(8)} ${seen.size} distinct of ${N}`);
  }
}
if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nAll topic self-tests passed.');
