const { ri, pick, fmt } = require('./util');

function mulExplain(a, b) {
  const t = Math.floor(b / 10) * 10, u = b % 10;
  if (!t || !u) return `${a} × ${b} = ${fmt(a * b)}`;
  return `${a} × ${b} = ${a}×${t} + ${a}×${u} = ${fmt(a * t)} + ${fmt(a * u)} = ${fmt(a * b)}`;
}

module.exports = {
  id: 'arithmetic',
  name: 'Mental Arithmetic',
  glyph: '+',
  color: '#3fb950',
  style: 'expr',
  sprint: true,
  desc: 'Speed calculation: add, multiply, divide, square. The core of every trading screen test.',
  levels: ['Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'],
  generate(level) {
    if (level === 1) {
      const a = ri(11, 99), b = ri(11, 99);
      if (Math.random() < 0.5) return { prompt: `${a} + ${b}`, answer: a + b, explanation: `Add tens then units: ${a} + ${b} = ${a + b}.` };
      const [x, y] = a >= b ? [a, b] : [b, a];
      return { prompt: `${x} − ${y}`, answer: x - y, explanation: `${x} − ${y} = ${x - y}.` };
    }
    if (level === 2) {
      const r = Math.random();
      if (r < 0.34) { const a = ri(101, 999), b = ri(101, 999); return { prompt: `${a} + ${b}`, answer: a + b, explanation: `${a} + ${b} = ${a + b}.` }; }
      if (r < 0.67) { const a = ri(500, 999), b = ri(101, 499); return { prompt: `${a} − ${b}`, answer: a - b, explanation: `${a} − ${b} = ${a - b}.` }; }
      const a = ri(12, 99), b = ri(3, 9);
      return { prompt: `${a} × ${b}`, answer: a * b, explanation: mulExplain(a, b) };
    }
    if (level === 3) {
      if (Math.random() < 0.65) {
        const a = ri(12, 49), b = ri(11, 29);
        return { prompt: `${a} × ${b}`, answer: a * b, explanation: mulExplain(a, b) };
      }
      const b = ri(6, 19), q = ri(12, 99);
      return { prompt: `${fmt(b * q)} ÷ ${b}`, answer: q, explanation: `${b} × ${q} = ${fmt(b * q)}, so the answer is ${q}.` };
    }
    if (level === 4) {
      const r = Math.random();
      if (r < 0.4) {
        const n = ri(31, 99);
        const near = Math.round(n / 10) * 10;
        const d = Math.abs(near - n);
        return {
          prompt: `${n}²`, answer: n * n,
          explanation: d === 0
            ? `${n}² = ${n * n}.`
            : `${n}² = (${n - d})(${n + d}) + ${d}² = ${(n - d) * (n + d)} + ${d * d} = ${n * n}.`,
        };
      }
      if (r < 0.75) { const a = ri(101, 499), b = ri(12, 49); return { prompt: `${a} × ${b}`, answer: a * b, explanation: mulExplain(a, b) }; }
      const b = ri(12, 49), q = ri(30, 199);
      return { prompt: `${fmt(b * q)} ÷ ${b}`, answer: q, explanation: `${b} × ${q} = ${fmt(b * q)}.` };
    }
    // Level 5: chains
    const kind = pick([0, 1, 2]);
    if (kind === 0) {
      const a = ri(12, 49), b = ri(11, 29), d = ri(3, 9), c = d * ri(20, 90);
      return { prompt: `${a} × ${b} − ${fmt(c)} ÷ ${d}`, answer: a * b - c / d, explanation: `${a}×${b} = ${a * b}; ${fmt(c)}÷${d} = ${c / d}; difference = ${a * b - c / d}.` };
    }
    if (kind === 1) {
      const a = ri(12, 60), b = ri(12, 60), c = ri(6, 19);
      return { prompt: `(${a} + ${b}) × ${c}`, answer: (a + b) * c, explanation: `${a}+${b} = ${a + b}; × ${c} = ${(a + b) * c}.` };
    }
    const a = ri(31, 89), b = ri(31, 89);
    return { prompt: `${a}² − ${b}²`, answer: a * a - b * b, explanation: `Difference of squares: (${a}−${b})(${a}+${b}) = ${a - b} × ${a + b} = ${a * a - b * b}.` };
  },
};
