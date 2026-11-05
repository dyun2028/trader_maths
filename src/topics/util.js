// Shared helpers for topic generators.
const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[ri(0, arr.length - 1)];
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const comb = (n, k) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
};
const fmt = (n, dp = 6) =>
  Number(n.toFixed(dp)).toLocaleString('en-US', { maximumFractionDigits: dp });

// Exact probability n/d: answer plus a display like "5/36 ≈ 0.1389".
function prob(n, d) {
  const g = gcd(n, d);
  const nn = n / g, dd = d / g;
  const text = dd === 1 ? `${nn}` : `${nn}/${dd}`;
  return { answer: n / d, tol: 0.003, hint: 'decimal or fraction', display: `${text} ≈ ${(n / d).toFixed(4)}` };
}

// Distribution of the sum of `count` fair `sides`-sided dice, as {sum: ways}.
function diceSums(count, sides) {
  let dist = { 0: 1 };
  for (let i = 0; i < count; i++) {
    const next = {};
    for (const [s, w] of Object.entries(dist))
      for (let f = 1; f <= sides; f++) next[+s + f] = (next[+s + f] || 0) + w;
    dist = next;
  }
  return dist;
}

module.exports = { ri, pick, gcd, fact, comb, fmt, prob, diceSums };
