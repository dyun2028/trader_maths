const { ri, pick, fmt, prob } = require('./util');

// Expected value of the best strategy for rolling an n-sided die with r re-rolls allowed.
function rerollEV(n, r) {
  let ev = (n + 1) / 2;
  for (let i = 0; i < r; i++) {
    let sum = 0;
    for (let f = 1; f <= n; f++) sum += Math.max(f, ev);
    ev = sum / n;
  }
  return ev;
}

const dec = (answer, tolerance = 0.003) => ({ answer, tol: tolerance, hint: 'decimal, 3 places is fine', display: answer.toFixed(4) });

module.exports = {
  id: 'ev',
  name: 'Expected Value',
  glyph: 'E',
  color: '#f0883e',
  style: 'word',
  sprint: false,
  desc: 'Fair prices of games and bets, optimal stopping, waiting times and bet sizing.',
  levels: ['Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'],
  generate(level) {
    if (level === 1) {
      const n = pick([6, 8, 10, 12, 20]);
      const games = [
        ['the face value', (f) => f],
        ['the square of the face value', (f) => f * f],
        ['the face value if it is even, otherwise 0', (f) => (f % 2 === 0 ? f : 0)],
        ['the larger of the face value and 3', (f) => Math.max(f, 3)],
      ];
      const [text, fn] = pick(games);
      let s = 0;
      for (let f = 1; f <= n; f++) s += fn(f);
      return { prompt: `You roll a fair ${n}-sided die and are paid ${text}. What is the expected payout?`, ...dec(s / n), explanation: `Average the payout over all ${n} faces: ${fmt(s)} / ${n} = ${(s / n).toFixed(4)}.` };
    }
    if (level === 2) {
      if (Math.random() < 0.5) {
        const d = ri(2, 6), w = ri(1, d - 1), a = ri(2, 20), b = ri(1, 20);
        const ev = (w / d) * a - ((d - w) / d) * b;
        return { prompt: `You win $${a} with probability ${w}/${d}, otherwise you lose $${b}. What is the expected profit per play?`, ...dec(ev), explanation: `(${w}/${d})×${a} − (${d - w}/${d})×${b} = ${ev.toFixed(4)}.` };
      }
      const m = ri(2, 5), t = ri(2, 4);
      let s = 0;
      for (let f = 1; f <= 6; f++) if (f > t) s += m * f;
      const ev = s / 6;
      return { prompt: `You roll a die and win $${m} times the face value, but only if it is greater than ${t}. What is the fair price to play?`, ...dec(ev), explanation: `Sum over faces ${t + 1}..6 of ${m}×face, divided by 6: ${s}/6 = ${ev.toFixed(4)}.` };
    }
    if (level === 3) {
      const r = Math.random();
      if (r < 0.34) {
        const n = pick([4, 6, 8, 10, 12, 20]);
        let sum = 0;
        for (let a = 1; a <= n; a++) for (let b = 1; b <= n; b++) sum += Math.max(a, b);
        return { prompt: `Two fair ${n}-sided dice are rolled. What is the expected value of the larger result?`, ...dec(sum / (n * n)), explanation: `Sum of max(a,b) over ${n * n} equally likely pairs = ${sum}, so ${sum}/${n * n} = ${(sum / (n * n)).toFixed(4)}.` };
      }
      if (r < 0.67) {
        const k = ri(2, 12);
        return { prompt: `A coin lands heads with probability 1/${k}. What is the expected number of flips until the first head (counting that flip)?`, answer: k, tol: 0, hint: 'number', explanation: `Geometric distribution: expected flips = 1/p = ${k}.` };
      }
      const a = pick([1, 2, 3, 4, 13]);
      const ev = 53 / (a + 1);
      return { prompt: `You draw cards from a shuffled 52-card deck one at a time. There are ${a} special card${a > 1 ? 's' : ''} in it. What is the expected position of the first special card?`, ...dec(ev), explanation: `The ${a} specials split the other ${52 - a} cards into ${a + 1} gaps with average ${(52 - a) / (a + 1)} cards each. Position = 1 + ${(52 - a) / (a + 1)} = (52+1)/(${a}+1) = ${ev.toFixed(4)}.` };
    }
    if (level === 4) {
      const r = Math.random();
      if (r < 0.4) {
        const p = ri(52, 70) / 100, b = pick([1, 2, 3]);
        const f = p - (1 - p) / b;
        if (f <= 0) return module.exports.generate(4);
        return { prompt: `A bet wins ${b}:1 with probability ${p.toFixed(2)} (you lose your stake otherwise). What fraction of your bankroll does the Kelly criterion say to bet? Answer in percent.`, answer: f * 100, tol: 0.005, hint: 'percent', display: `${(f * 100).toFixed(2)}%`, explanation: `Kelly f = p − q/b = ${p.toFixed(2)} − ${(1 - p).toFixed(2)}/${b} = ${f.toFixed(4)}.` };
      }
      if (r < 0.75) {
        const n = ri(4, 12);
        return { prompt: `Flip a fair coin up to ${n} times. If the first head comes on flip k (k ≤ ${n}) you win $2^k. If there is no head in ${n} flips you win nothing. What is the fair price to play?`, answer: n, tol: 0, hint: 'dollars', explanation: `Each k contributes (1/2^k) × 2^k = 1, and there are ${n} values of k, so ${n}.` };
      }
      const n = pick([6, 8, 10, 12]);
      return { prompt: `You roll a fair ${n}-sided die and may re-roll once, keeping the second result. Playing optimally, what is the expected final result?`, ...dec(rerollEV(n, 1)), explanation: `Keep the first roll only if it beats the average ${(n + 1) / 2}. EV = ${rerollEV(n, 1).toFixed(4)}.` };
    }
    const r = Math.random();
    if (r < 0.34) {
      const n = pick([6, 8, 10, 20]), k = ri(2, 3);
      return { prompt: `You roll a fair ${n}-sided die and may re-roll up to ${k} times, keeping the last result you choose to stop on. Playing optimally, what is the expected final result?`, ...dec(rerollEV(n, k)), explanation: `Work backwards: with 0 re-rolls left EV = ${(n + 1) / 2}; with each extra re-roll keep a roll only if it beats the EV of the shorter game. Result ${rerollEV(n, k).toFixed(4)}.` };
    }
    if (r < 0.67) {
      const [pat, ev] = pick([['HH', 6], ['HT', 4], ['HHH', 14], ['HTH', 10], ['HTT', 8]]);
      return { prompt: `A fair coin is flipped repeatedly. What is the expected number of flips until the pattern ${pat} first appears?`, answer: ev, tol: 0, hint: 'number', explanation: `Standard martingale / overlap argument: E = ${ev}.` };
    }
    const n = ri(4, 12);
    let h = 0;
    for (let i = 1; i <= n; i++) h += 1 / i;
    return { prompt: `A fair ${n}-sided die is rolled repeatedly. What is the expected number of rolls until every face has appeared at least once?`, ...dec(n * h), explanation: `Coupon collector: n × (1 + 1/2 + … + 1/n) = ${n} × ${h.toFixed(4)} = ${(n * h).toFixed(4)}.` };
  },
};
