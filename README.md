# Trader Maths Trainer

A desktop app for practising the maths behind quant and trading interviews: mental arithmetic,
percentages, estimation, probability, expected value, Bayes and market making.
Built with Electron, so the same code runs on Windows, macOS and Linux.

## Run it

Requires [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm start
```

## Features

- **7 topics, 5 levels each.** Speed drills (arithmetic, fractions, estimation) and reasoning topics
  (probability, expected value, Bayes, market making) look and feel different.
- **Procedural questions.** Every answer is computed, so it is correct by construction and never runs out.
- **Sprint mode.** Timed tests with presets inspired by Optiver, Jane Street and SIG style screens.
  Correct +1, wrong −1, skip 0.
- **Review queue.** Missed questions return until you get them right twice in a row.
- **Stats.** Accuracy, speed and adaptive level per topic, plus recent sessions. Stored in a local SQLite file.
- Answers can be typed as `0.5`, `1/2`, `1,234`, `$5` or `20%`.

## Tests

```bash
npm test                      # generates questions for every topic and level and checks them
```

End-to-end UI smoke test (drives the real window and saves screenshots):

```powershell
$env:TRAINER_SMOKE=1; $env:TRAINER_SHOTS="shots"; $env:TRAINER_DATA_DIR="$env:TEMP\trainer-test"; npx electron .
```

## Adding a topic

Drop a new file in `src/topics/`. It is picked up automatically on the next launch: no other code changes.

```js
module.exports = {
  id: 'options',                 // unique, lowercase
  name: 'Options Basics',
  glyph: 'Δ',                    // one character shown on the card
  color: '#ff7b72',              // accent colour for the topic
  style: 'word',                 // 'expr' = big expression, 'word' = paragraph question
  sprint: false,
  desc: 'One line shown on the topic card.',
  levels: ['Easy', 'Medium', 'Hard'],   // any number of levels
  generate(level) {
    return {
      prompt: 'What is ...?',
      answer: 42,                // a number
      tol: 0.003,                // optional relative tolerance (0 = exact)
      hint: 'decimal or fraction',   // optional format hint
      display: '42',             // optional text shown as the correct answer
      explanation: 'Why it is 42.',
    };
  },
};
```

Run `npm test` and your topic is checked automatically. To control where it appears on the home screen,
add its id to `ORDER` in `src/topics/index.js`.

## Build installers

```bash
npm run dist
```

`electron-builder` builds for the OS you run it on (Windows: installer and portable exe, macOS: dmg,
Linux: AppImage and deb). Build on each OS, or use CI with a matrix of the three.

## Layout

```
main.js            Electron main process, IPC
preload.js         Secure bridge to the UI
src/db.js          SQLite schema and queries (node:sqlite)
src/answer.js      Answer parsing and checking
src/topics/        One file per topic plus the registry
renderer/          UI (HTML, CSS, vanilla JS), flat design with no gradients
test/              Self-test and UI smoke test
```
