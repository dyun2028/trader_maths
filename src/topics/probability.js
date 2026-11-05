const { ri, pick, fact, comb, prob, diceSums } = require('./util');

const WORDS = ['BANANA', 'LETTER', 'PEPPER', 'MARKET', 'ARBITRAGE', 'SPREAD', 'BALLOON', 'MISSISSIPPI'];
function arrangements(word) {
  const counts = {};
  for (const c of word) counts[c] = (counts[c] || 0) + 1;
  let denom = 1;
  for (const v of Object.values(counts)) denom *= fact(v);
  return fact(word.length) / denom;
}

module.exports = {
  id: 'probability',
  name: 'Probability & Counting',
  glyph: 'P',
  color: '#58a6ff',
  style: 'word',
  sprint: false,
  desc: 'Dice, coins, cards and counting. Exact answers: type a decimal or a fraction like 5/36.',
  levels: ['Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'],
  generate(level) {
    if (level === 1) {
      if (Math.random() < 0.5) {
        const n = ri(2, 4), k = ri(0, n);
        return { prompt: `A fair coin is flipped ${n} times. What is the probability of exactly ${k} heads?`, ...prob(comb(n, k), 2 ** n), explanation: `C(${n},${k}) / 2^${n} = ${comb(n, k)}/${2 ** n}.` };
      }
      const s = pick([6, 8, 10, 12]), k = ri(2, s);
      return { prompt: `A fair ${s}-sided die is rolled. What is the probability the result is at least ${k}?`, ...prob(s - k + 1, s), explanation: `Faces ${k} to ${s}: ${s - k + 1} outcomes out of ${s}.` };
    }
    if (level === 2) {
      if (Math.random() < 0.55) {
        const t = ri(3, 11), ways = diceSums(2, 6)[t];
        return { prompt: `Two fair six-sided dice are rolled. What is the probability the sum is ${t}?`, ...prob(ways, 36), explanation: `${ways} of the 36 ordered outcomes sum to ${t}.` };
      }
      const n = ri(2, 4);
      return { prompt: `A fair die is rolled ${n} times. What is the probability of at least one 6?`, ...prob(6 ** n - 5 ** n, 6 ** n), explanation: `1 − (5/6)^${n} = (6^${n} − 5^${n}) / 6^${n}.` };
    }
    if (level === 3) {
      const r = Math.random();
      if (r < 0.34) return { prompt: 'Two cards are dealt from a standard 52-card deck. What is the probability both are the same suit?', ...prob(12, 51), explanation: 'The first card is free. The second must match its suit: 12 of the 51 remaining cards.' };
      if (r < 0.67) {
        const kind = pick([['aces', 4, 4], ['red cards', 26, 26], ['hearts', 13, 13], ['face cards (J, Q, K)', 12, 12]]);
        return { prompt: `Two cards are dealt from a standard deck. What is the probability both are ${kind[0]}?`, ...prob(comb(kind[1], 2), comb(52, 2)), explanation: `C(${kind[1]},2) / C(52,2).` };
      }
      const n = ri(8, 14), k = ri(3, 5);
      return { prompt: `How many ways can a team of ${k} be chosen from ${n} people?`, answer: comb(n, k), tol: 0, hint: 'whole number', explanation: `C(${n},${k}) = ${comb(n, k)}.` };
    }
    if (level === 4) {
      const r = Math.random();
      if (r < 0.34) {
        const t = ri(6, 15), ways = diceSums(3, 6)[t];
        return { prompt: `Three fair dice are rolled. What is the probability the sum is ${t}?`, ...prob(ways, 216), explanation: `${ways} of the 216 outcomes sum to ${t}.` };
      }
      if (r < 0.67) {
        const w = pick(WORDS);
        return { prompt: `How many distinct arrangements are there of the letters in ${w}?`, answer: arrangements(w), tol: 0, hint: 'whole number', explanation: `${w.length}! divided by the factorial of each repeated letter count = ${arrangements(w)}.` };
      }
      const n = ri(6, 10), k = ri(Math.floor(n / 2) - 1, Math.floor(n / 2) + 1);
      return { prompt: `A fair coin is flipped ${n} times. What is the probability of exactly ${k} heads?`, ...prob(comb(n, k), 2 ** n), explanation: `C(${n},${k}) / 2^${n} = ${comb(n, k)}/${2 ** n}.` };
    }
    const r = Math.random();
    if (r < 0.34) {
      const j = ri(1, 3);
      return { prompt: `You are dealt 5 cards from a standard deck. What is the probability of exactly ${j} ace${j > 1 ? 's' : ''}?`, ...prob(comb(4, j) * comb(48, 5 - j), comb(52, 5)), explanation: `C(4,${j}) × C(48,${5 - j}) / C(52,5).` };
    }
    if (r < 0.67) {
      const n = ri(10, 40);
      let none = 1;
      for (let i = 0; i < n; i++) none *= (365 - i) / 365;
      const p = 1 - none;
      return { prompt: `${n} people are in a room. What is the probability at least two share a birthday? (365 days, uniform)`, answer: p, tol: 0.01, hint: 'decimal', display: p.toFixed(4), explanation: `1 − (365/365)(364/365)…(${365 - n + 1}/365) = ${p.toFixed(4)}.` };
    }
    const k = pick([2, 4, 6, 8, 10, 12, 20]);
    return { prompt: `Alice and Bob alternate rolling a fair ${k}-sided die, Alice first. The first to roll a ${k} wins. What is Alice's chance of winning?`, ...prob(k, 2 * k - 1), explanation: `Let p = 1/${k}. P(A) = p / (1 − (1−p)²) = ${k}/${2 * k - 1}.` };
  },
};
