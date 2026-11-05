const { ri, fmt, fact } = require('./util');

module.exports = {
  id: 'estimation',
  name: 'Estimation',
  glyph: '≈',
  color: '#a371f7',
  style: 'expr',
  sprint: true,
  desc: 'Get close, fast. Approximate products, roots, growth and powers within a tolerance.',
  levels: ['Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'],
  generate(level) {
    const make = (prompt, answer, tol, explanation) => ({
      prompt: `≈ ${prompt}`, answer, tol, hint: `within ±${Math.round(tol * 100)}%`,
      explanation: `${explanation} Exact: ${fmt(answer, 4)}.`,
    });
    if (level === 1) {
      const a = ri(18, 52), b = ri(18, 52);
      return make(`${a} × ${b}`, a * b, 0.03, `Round to ${Math.round(a / 5) * 5} × ${Math.round(b / 5) * 5}.`);
    }
    if (level === 2) {
      const a = ri(101, 999), b = ri(101, 999);
      return make(`${a} × ${b}`, a * b, 0.03, `Round to ${Math.round(a / 10) * 10} × ${Math.round(b / 10) * 10}.`);
    }
    if (level === 3) {
      if (Math.random() < 0.5) {
        const a = ri(1000, 9999), b = ri(11, 49);
        return make(`${fmt(a)} ÷ ${b}`, a / b, 0.03, `Round to ${fmt(Math.round(a / 100) * 100)} ÷ ${Math.round(b / 5) * 5}.`);
      }
      const n = ri(200, 9000);
      return make(`√${fmt(n)}`, Math.sqrt(n), 0.02, `Find the nearest perfect squares around ${n}.`);
    }
    if (level === 4) {
      const r = Math.random();
      if (r < 0.34) { const x = ri(11, 99) / 1000; return make(`1 ÷ ${x}`, 1 / x, 0.03, `1/${x} is close to 1/${(Math.round(x * 100) / 100).toFixed(2)}.`); }
      if (r < 0.67) { const g = ri(3, 9), n = ri(5, 20); return make(`1.0${g}^${n}`, Math.pow(1 + g / 100, n), 0.03, `Use e^(${g / 100}×${n}) as a guide.`); }
      const p = ri(110, 390) / 10, n = ri(2000, 9999);
      return make(`${p}% of ${fmt(n)}`, (p * n) / 100, 0.03, `${Math.round(p)}% of ${fmt(Math.round(n / 100) * 100)}.`);
    }
    const r = Math.random();
    if (r < 0.34) { const k = ri(12, 40); return make(`2^${k}`, Math.pow(2, k), 0.05, `2^10 is about 1000, so split ${k} into tens plus a remainder.`); }
    if (r < 0.67) { const x = ri(10, 60) / 10; return make(`e^${x}`, Math.exp(x), 0.05, `e is about 2.718, e² about 7.39, e³ about 20.1.`); }
    const n = ri(6, 10);
    return make(`${n}!`, fact(n), 0.05, `Multiply up from ${n}.`);
  },
};
