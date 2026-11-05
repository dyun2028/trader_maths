const { ri, pick, comb, prob } = require('./util');

module.exports = {
  id: 'bayes',
  name: 'Conditional & Bayes',
  glyph: '|',
  color: '#f778ba',
  style: 'word',
  sprint: false,
  desc: 'Update beliefs with new information. Conditional probability, test accuracy and classic traps.',
  levels: ['Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'],
  generate(level) {
    if (level <= 2) {
      // Two dice, condition on information.
      for (;;) {
        const k = ri(2, 6), t = ri(7, 11);
        const first = level === 1;
        let good = 0, total = 0;
        for (let a = 1; a <= 6; a++)
          for (let b = 1; b <= 6; b++) {
            const cond = first ? a === k : a === k || b === k;
            if (!cond) continue;
            total++;
            if (a + b >= t) good++;
          }
        if (!good) continue;
        const info = first ? `the first die shows ${k}` : `at least one die shows ${k}`;
        return { prompt: `Two fair dice are rolled. Given that ${info}, what is the probability the sum is at least ${t}?`, ...prob(good, total), explanation: `Condition on ${info}: ${total} equally likely outcomes remain, ${good} have sum ≥ ${t}.` };
      }
    }
    if (level === 3) {
      if (Math.random() < 0.5) {
        const a = ri(1, 9), b = ri(1, 9), c = ri(1, 9), d = ri(1, 9);
        const num = a * (c + d), den = a * (c + d) + c * (a + b);
        return { prompt: `Urn A has ${a} red and ${b} blue balls. Urn B has ${c} red and ${d} blue. You pick an urn at random and draw a ball: it is red. What is the probability it came from Urn A?`, ...prob(num, den), explanation: `P(A|red) = (½·${a}/${a + b}) / (½·${a}/${a + b} + ½·${c}/${c + d}) = ${num}/${den}.` };
      }
      const N = pick([100, 200, 500, 1000]), s = ri(90, 99), f = ri(1, 10);
      const pr = 1 / N;
      const post = (pr * s / 100) / (pr * s / 100 + (1 - pr) * f / 100);
      return { prompt: `A disease affects 1 in ${N} people. A test detects it ${s}% of the time but gives a false positive ${f}% of the time. You test positive. What is the chance you have it? Answer in percent.`, answer: post * 100, tol: 0.01, hint: 'percent, 1 decimal place is fine', display: `${(post * 100).toFixed(2)}%`, explanation: `True positives ${s}/${N} versus false positives ${f}×${N - 1}/${N} (per 100 people tested). Posterior = ${(post * 100).toFixed(2)}%.` };
    }
    if (level === 4) {
      const r = Math.random();
      if (r < 0.5) {
        const v = pick([['aces', 4], ['hearts', 13], ['kings or queens', 8]]);
        const both = comb(v[1], 2), atLeast = comb(52, 2) - comb(52 - v[1], 2);
        return { prompt: `Two cards are dealt from a standard deck. Given that at least one is among the ${v[0]}, what is the probability both are?`, ...prob(both, atLeast), explanation: `Both: C(${v[1]},2) = ${both}. At least one: C(52,2) − C(${52 - v[1]},2) = ${atLeast}. Ratio = ${both}/${atLeast}.` };
      }
      if (r < 0.75) {
        return { prompt: 'A family has two children. You are told at least one is a girl born on a Tuesday. What is the probability both are girls?', ...prob(13, 27), explanation: 'Count (sex, weekday) pairs: 27 of 196 ordered combinations include a Tuesday girl; 13 of those have two girls. 13/27.' };
      }
      const n = ri(3, 8), pi = pick([2, 3, 5]);
      const num = 2 ** n, den = 2 ** n + (pi - 1);
      return { prompt: `One coin in a bag of ${pi} is double-headed, the rest are fair. You pull one at random and flip it ${n} times, getting ${n} heads. What is the probability it is the double-headed coin?`, ...prob(num, den), explanation: `Prior 1:${pi - 1}. Likelihood ratio 2^${n}:1. Posterior = ${num}/(${num}+${pi - 1}) = ${num}/${den}.` };
    }
    const r = Math.random();
    if (r < 0.5) {
      const n = ri(4, 20), k = ri(1, Math.min(n - 3, 8)) ;
      const open = Math.min(k, n - 2);
      return { prompt: `Monty Hall with ${n} doors: you pick one, the host (who knows where the prize is) opens ${open} other doors with no prize, then offers a switch to one of the remaining unopened doors at random. What is your chance of winning if you switch?`, ...prob(n - 1, n * (n - open - 1)), explanation: `P(initial pick wrong) = ${n - 1}/${n}, then you land on the prize with chance 1/${n - open - 1}. Product = ${n - 1}/${n * (n - open - 1)}.` };
    }
    const h = ri(3, 8), t = ri(0, 3), pi = pick([1, 5, 10, 20]);
    const b = pick([0.6, 0.7, 0.75, 0.8]);
    const lb = Math.pow(b, h) * Math.pow(1 - b, t), lf = Math.pow(0.5, h + t);
    const prior = pi / 100;
    const post = (prior * lb) / (prior * lb + (1 - prior) * lf);
    return { prompt: `${pi}% of coins in a bin land heads with probability ${b}; the rest are fair. You pick one and flip it ${h + t} times: ${h} heads, ${t} tails. What is the probability it is a biased coin? Answer in percent.`, answer: post * 100, tol: 0.01, hint: 'percent, 1 decimal place is fine', display: `${(post * 100).toFixed(2)}%`, explanation: `Likelihoods: biased ${lb.toExponential(3)}, fair ${lf.toExponential(3)}. Posterior = ${(post * 100).toFixed(2)}%.` };
  },
};
