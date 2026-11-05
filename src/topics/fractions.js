const { ri, pick, fmt, gcd } = require('./util');

module.exports = {
  id: 'fractions',
  name: 'Fractions, Decimals & %',
  glyph: '%',
  color: '#d29922',
  style: 'expr',
  sprint: true,
  desc: 'Convert between fractions, decimals and percentages. Percentage changes and compounding.',
  levels: ['Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'],
  generate(level) {
    if (level === 1) {
      if (Math.random() < 0.5) {
        const den = pick([2, 4, 5, 8, 10, 20, 25]), num = ri(1, den - 1);
        return { prompt: `${num}/${den} as a decimal`, answer: num / den, tol: 1e-9, hint: 'decimal', explanation: `${num} ÷ ${den} = ${num / den}.` };
      }
      const p = pick([5, 10, 20, 25, 50, 75]), n = ri(2, 30) * 20;
      return { prompt: `${p}% of ${n}`, answer: (p * n) / 100, explanation: `${p}% of ${n} = ${n} × ${p}/100 = ${(p * n) / 100}.` };
    }
    if (level === 2) {
      if (Math.random() < 0.5) {
        const p = ri(3, 39), n = ri(4, 60) * 10;
        return { prompt: `${p}% of ${n}`, answer: (p * n) / 100, explanation: `10% of ${n} is ${n / 10}. Build ${p}% from 10%s and 1%s: ${(p * n) / 100}.` };
      }
      const den = pick([3, 6, 7, 9, 11, 12]), num = ri(1, den - 1);
      return { prompt: `${num}/${den} as a percent`, answer: (num / den) * 100, tol: 0.005, hint: 'percent, 1 decimal place is fine', explanation: `${num}/${den} = ${(num / den).toFixed(5)} = ${((num / den) * 100).toFixed(2)}%.` };
    }
    if (level === 3) {
      if (Math.random() < 0.5) {
        const a = ri(4, 40) * 5, pct = pick([10, 15, 20, 25, 30, 40, 60, -10, -15, -20, -25, -30]);
        const b = (a * (100 + pct)) / 100;
        return { prompt: `Percent change from ${a} to ${fmt(b)}`, answer: pct, tol: 0.005, hint: 'percent, sign matters', explanation: `(${fmt(b)} − ${a}) / ${a} = ${pct}%.` };
      }
      const x = pick([10, 20, 25, 30, 40, 50]), y = pick([10, 20, 25, 30, 40, 50]);
      const net = ((1 + x / 100) * (1 - y / 100) - 1) * 100;
      return { prompt: `Price rises ${x}%, then falls ${y}%. Net change`, answer: net, tol: 0.005, hint: 'percent, sign matters', explanation: `${(1 + x / 100).toFixed(2)} × ${(1 - y / 100).toFixed(2)} = ${(1 + net / 100).toFixed(4)}, so net ${net.toFixed(2)}%.` };
    }
    if (level === 4) {
      if (Math.random() < 0.5) {
        const a = ri(3, 12);
        let b = ri(3, 12);
        if (b === a) b = a === 12 ? 11 : a + 1;
        const v = 1 / a + 1 / b;
        return { prompt: `1/${a} + 1/${b} as a decimal`, answer: v, tol: 0.003, hint: 'decimal, 3 places is fine', explanation: `1/${a} = ${(1 / a).toFixed(4)}, 1/${b} = ${(1 / b).toFixed(4)}, sum = ${v.toFixed(4)}.` };
      }
      const den = pick([8, 12, 16, 20, 40]);
      const num = pick([3, 5, 7, 9, 11, 13].filter((n) => n < den && gcd(n, den) === 1));
      const n = den * ri(3, 30);
      return { prompt: `${num}/${den} of ${fmt(n)}`, answer: (num * n) / den, explanation: `${fmt(n)} ÷ ${den} = ${n / den}; × ${num} = ${(num * n) / den}.` };
    }
    const kind = pick([0, 1, 2]);
    if (kind === 0) {
      const d = pick([10, 15, 20, 25, 30, 35]), p = ri(5, 60) * 10;
      const orig = p / (1 - d / 100);
      return { prompt: `After a ${d}% discount an item costs ${p}. Original price`, answer: orig, tol: 0.005, hint: '2 decimal places is fine', explanation: `${p} ÷ ${(1 - d / 100).toFixed(2)} = ${orig.toFixed(2)}. (Not ${p} + ${d}%.)` };
    }
    if (kind === 1) {
      const r = ri(3, 12), n = ri(5, 15);
      const v = 1000 * Math.pow(1 + r / 100, n);
      return { prompt: `1,000 grows at ${r}% a year for ${n} years. Final value`, answer: v, tol: 0.01, hint: 'within 1%', explanation: `1000 × ${(1 + r / 100).toFixed(2)}^${n} = ${v.toFixed(2)}.` };
    }
    const r = pick([2, 3, 4, 6, 8, 9, 12]);
    const yrs = Math.log(2) / Math.log(1 + r / 100);
    return { prompt: `Years to double at ${r}% a year compound`, answer: yrs, tol: 0.04, hint: 'within 4%', explanation: `Exactly ln2 / ln(${(1 + r / 100).toFixed(2)}) = ${yrs.toFixed(2)}. Rule of 72 gives ${(72 / r).toFixed(2)}.` };
  },
};
