const { ri, pick, fmt } = require('./util');

const money = (answer, tolerance = 0.003) => ({ answer, tol: tolerance, hint: 'number (sign matters)', display: fmt(answer, 4) });

module.exports = {
  id: 'market',
  name: 'Market Making',
  glyph: '$',
  color: '#39c5cf',
  style: 'word',
  sprint: false,
  desc: 'Fair value, edge, spreads, P&L and adverse selection: the maths of quoting a two-sided market.',
  levels: ['Warm-up', 'Easy', 'Medium', 'Hard', 'Brutal'],
  generate(level) {
    if (level === 1) {
      if (Math.random() < 0.5) {
        const bid = ri(80, 120), sp = ri(1, 4), q = ri(5, 40);
        return { prompt: `The market is ${bid} bid, ${bid + sp} offered. You buy ${q} at the offer and immediately sell ${q} at the bid. What is your P&L?`, ...money(-sp * q), explanation: `You pay the full spread each unit: −${sp} × ${q} = ${-sp * q}.` };
      }
      const fair = ri(40, 90), w = ri(1, 4);
      const lifted = Math.random() < 0.5;
      if (lifted) return { prompt: `You believe fair value is ${fair}. You quote ${fair - w} @ ${fair + w} and someone buys your offer. What is your edge per unit?`, ...money(w), explanation: `You sold at ${fair + w} against fair ${fair}: edge = ${w}.` };
      return { prompt: `You believe fair value is ${fair}. You quote ${fair - w} @ ${fair + w} and someone sells into your bid. What is your edge per unit?`, ...money(w), explanation: `You bought at ${fair - w} against fair ${fair}: edge = ${w}.` };
    }
    if (level === 2) {
      const n = ri(2, 5), fair = 3.5 * n;
      const buy = Math.random() < 0.5, q = ri(2, 20);
      const price = Math.round((fair + (ri(-30, 30) / 10)) * 2) / 2;
      const ev = buy ? (fair - price) * q : (price - fair) * q;
      return { prompt: `A contract settles at the sum of ${n} fair six-sided dice. You ${buy ? 'buy' : 'sell'} ${q} lots at ${price}. What is your expected P&L?`, ...money(ev), explanation: `Fair value = ${n} × 3.5 = ${fair}. ${buy ? `(${fair} − ${price})` : `(${price} − ${fair})`} × ${q} = ${ev}.` };
    }
    if (level === 3) {
      if (Math.random() < 0.5) {
        const q1 = ri(5, 20), p1 = ri(95, 105), q2 = ri(5, 20), p2 = ri(95, 105), q3 = ri(2, q1 + q2 - 1), p3 = ri(95, 105), m = ri(95, 105);
        const pnl = q1 * (m - p1) + q2 * (m - p2) + q3 * (p3 - m);
        return { prompt: `You buy ${q1} at ${p1}, buy ${q2} at ${p2}, then sell ${q3} at ${p3}. The market is now marked at ${m}. What is your total P&L (realised plus unrealised)?`, ...money(pnl), explanation: `Mark every trade to ${m}: ${q1}×(${m}−${p1}) + ${q2}×(${m}−${p2}) + ${q3}×(${p3}−${m}) = ${pnl}.` };
      }
      const q1 = ri(5, 30), p1 = ri(90, 110), q2 = ri(5, 30), p2 = ri(90, 110);
      const avg = (q1 * p1 + q2 * p2) / (q1 + q2);
      return { prompt: `You buy ${q1} at ${p1} and then ${q2} at ${p2}. What is your average entry price?`, ...money(avg), explanation: `(${q1}×${p1} + ${q2}×${p2}) / ${q1 + q2} = ${avg.toFixed(4)}.` };
    }
    if (level === 4) {
      if (Math.random() < 0.5) {
        const v = ri(1, 13);
        const e = v + (364 - v) / 51;
        return { prompt: `A contract settles at the sum of two cards drawn without replacement from a deck (Ace = 1, ..., King = 13). You see the first card: a ${v}. What is the fair value of the contract?`, ...money(e), explanation: `The other card is one of 51 left; ranks of all 52 sum to 4×91 = 364, so the remaining average is (364 − ${v})/51 = ${((364 - v) / 51).toFixed(4)}. Total ${e.toFixed(4)}.` };
      }
      const h = ri(1, 3), m = ri(4, 10), p = ri(10, 40);
      const ev = h - (p / 100) * m;
      return { prompt: `You quote with a half-spread of ${h}. ${p}% of the flow that trades with you is informed, and moves the price ${m} against you afterwards. The rest is uninformed and earns the full half-spread. What is your expected P&L per trade?`, ...money(ev), explanation: `Uninformed: ${(100 - p)}% × ${h}. Informed: ${p}% × (${h} − ${m}). Total = ${h} − ${p / 100}×${m} = ${ev.toFixed(4)}.` };
    }
    const r = Math.random();
    if (r < 0.4) {
      const s = ri(80, 120), k = pick([90, 95, 100, 105, 110]), c = ri(5, 20), putP = Math.max(0.5, c - (s - k));
      const askPut = Math.round(putP * 10) / 10;
      const askCall = c;
      const spotImplied = askCall - askPut + k;
      return { prompt: `European options (no interest, no dividends) on the same stock with strike ${k}: the call is worth ${askCall} and the put is worth ${askPut}. What spot price does put-call parity imply?`, ...money(spotImplied), explanation: `C − P = S − K, so S = C − P + K = ${askCall} − ${askPut} + ${k} = ${fmt(spotImplied, 4)}.` };
    }
    if (r < 0.7) {
      const profit = ri(1, 6), a = ri(30, 60), b = 100 - profit - a;
      return { prompt: `A binary contract X pays 100 if an event happens; its complement NOT-X pays 100 otherwise. X is offered at ${a} and NOT-X is offered at ${b}. What guaranteed profit do you lock in by buying both?`, ...money(profit), explanation: `Exactly one pays 100. You pay ${a} + ${b} = ${a + b} for a sure 100: profit ${profit}.` };
    }
    const profit = ri(1, 6), a = ri(30, 60), b = 100 + profit - a;
    return { prompt: `A binary contract X pays 100 if an event happens; its complement NOT-X pays 100 otherwise. X is bid at ${a} and NOT-X is bid at ${b}. What guaranteed profit do you lock in by selling both?`, ...money(profit), explanation: `You receive ${a} + ${b} = ${a + b} and owe exactly 100 in total: profit ${profit}.` };
  },
};
