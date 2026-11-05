// Parsing and checking of typed answers.
// Accepts: 12, -3.5, 1,234, $5, 5/36, 33.3%, 1e3.
function parseAnswer(input) {
  if (typeof input !== 'string') return null;
  let s = input.trim().replace(/[,$\s]/g, '').replace(/[−–]/g, '-');
  if (!s) return null;
  let pct = false;
  if (s.endsWith('%')) { pct = true; s = s.slice(0, -1); }
  let v;
  const m = s.match(/^(-?\d*\.?\d+(?:e-?\d+)?)\/(-?\d*\.?\d+)$/i);
  if (m) {
    const d = parseFloat(m[2]);
    if (d === 0) return null;
    v = parseFloat(m[1]) / d;
  } else if (/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) {
    v = parseFloat(s);
  } else return null;
  if (!Number.isFinite(v)) return null;
  return { value: v, pct };
}

function isCorrect(parsed, answer, tol = 0) {
  const allow = Math.max(tol * Math.abs(answer), 1e-9 * (1 + Math.abs(answer)));
  const candidates = parsed.pct ? [parsed.value / 100, parsed.value] : [parsed.value];
  return candidates.some((c) => Math.abs(c - answer) <= allow);
}

module.exports = { parseAnswer, isCorrect };
