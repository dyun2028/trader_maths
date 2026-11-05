// Topic registry. To add a topic, drop a new file in this folder that exports:
//   { id, name, glyph, color, style: 'expr' | 'word', sprint: boolean, desc, levels: [...],
//     generate(level) -> { prompt, answer, explanation, tol?, hint?, display? } }
// It is picked up automatically on the next launch. See README.md.
const fs = require('fs');
const path = require('path');

const SKIP = new Set(['index.js', 'util.js']);
const topics = [];

for (const file of fs.readdirSync(__dirname).sort()) {
  if (!file.endsWith('.js') || SKIP.has(file)) continue;
  const t = require(path.join(__dirname, file));
  for (const key of ['id', 'name', 'glyph', 'color', 'style', 'levels', 'generate'])
    if (t[key] === undefined) throw new Error(`Topic ${file} is missing "${key}"`);
  topics.push(t);
}

// Display order: speed topics first, then reasoning topics.
const ORDER = ['arithmetic', 'fractions', 'estimation', 'probability', 'ev', 'bayes', 'market'];
topics.sort((a, b) => {
  const ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
});

const byId = Object.fromEntries(topics.map((t) => [t.id, t]));

function meta(t) {
  const { id, name, glyph, color, style, sprint, desc, levels } = t;
  return { id, name, glyph, color, style, sprint: !!sprint, desc, levels };
}

module.exports = { topics, byId, meta };
