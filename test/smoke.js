// End-to-end smoke test. Run with:  set TRAINER_SMOKE=1 && npx electron .
// Drives the real UI inside Electron, saves screenshots to TRAINER_SHOTS, prints a JSON report, exits.
const fs = require('fs');
const path = require('path');

module.exports = (win, app) => {
  const wc = win.webContents;
  const shots = process.env.TRAINER_SHOTS;
  const js = (code) => wc.executeJavaScript(code);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const report = { checks: [], errors: [] };
  const check = (name, ok, extra) => { report.checks.push({ name, ok: !!ok, ...(extra !== undefined ? { extra } : {}) }); };
  const shot = async (name) => {
    if (!shots) return;
    fs.mkdirSync(shots, { recursive: true });
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const img = await wc.capturePage();
        fs.writeFileSync(path.join(shots, name + '.png'), img.toPNG());
        return;
      } catch (e) { await sleep(400); } // first frame of a fresh window can fail to capture
    }
  };
  const waitFor = async (sel, ms = 4000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (await js(`!!document.querySelector(${JSON.stringify(sel)})`)) return true; await sleep(60); }
    return false;
  };
  wc.on('console-message', (e) => { if (e.level === 'error') report.errors.push(e.message); });
  win.show();

  wc.once('did-finish-load', async () => {
    try {
      await sleep(400);
      await waitFor('.card');
      check('home shows 7 topic cards', (await js(`document.querySelectorAll('.card').length`)) === 7);
      check('speed and reasoning cards differ', (await js(`document.querySelectorAll('.card.expr').length`)) === 3 && (await js(`document.querySelectorAll('.card.word').length`)) === 4);
      await shot('01-home');

      // Practice: arithmetic level 1, one correct and one wrong answer.
      await js(`document.querySelector('[data-topic=arithmetic]').click()`);
      await waitFor('#ans');
      await js(`[...document.querySelectorAll('.pill')].find(p=>p.textContent.startsWith('1 ')).click()`);
      await waitFor('#ans');
      await sleep(200);
      const submitAnswer = async (value) => {
        await js(`(()=>{const i=document.getElementById('ans'); i.value=${JSON.stringify(value)}; document.querySelector('form').requestSubmit();})()`);
        await sleep(250);
      };
      const prompt1 = await js(`document.querySelector('.prompt').textContent`);
      const expected = Function(`return (${prompt1.replace('−', '-')})`)();
      await submitAnswer(String(expected));
      check('correct answer accepted', await js(`!!document.querySelector('.feedback.good')`), prompt1);
      await shot('02-practice-arithmetic');
      await js(`document.getElementById('next').click()`);
      await waitFor('#ans'); await sleep(200);
      await submitAnswer('banana');
      check('invalid input is rejected without scoring', await js(`document.querySelector('.msg.warn') !== null && !document.querySelector('.feedback')`));
      await submitAnswer('-12345');
      check('wrong answer marked wrong', await js(`!!document.querySelector('.feedback.bad')`));
      await js(`document.getElementById('next').click()`);
      await waitFor('#ans');

      // Every topic renders and accepts an answer (wrong on purpose, to fill Review).
      const ids = await js(`[...document.querySelectorAll('.nav-btn')].length && ['arithmetic','fractions','estimation','probability','ev','bayes','market']`);
      for (const id of ids) {
        await js(`document.querySelector('[data-nav=home]').click()`);
        await waitFor('.card');
        await js(`document.querySelector('[data-topic=${id}]').click()`);
        const ok = await waitFor('#ans');
        await sleep(150);
        check(`topic ${id} renders a question`, ok && (await js(`document.querySelector('.prompt').textContent.length > 3`)));
        await submitAnswer('-98765');
        check(`topic ${id} gives feedback`, await js(`!!document.querySelector('.feedback .why')`));
        if (id === 'probability' || id === 'arithmetic') await shot(`03-${id}`);
        if (id === 'market') await shot('03-market');
      }

      // Sprint: 3 questions, skip all, check results page.
      await js(`document.querySelector('[data-nav=sprint]').click()`);
      await waitFor('#start');
      await shot('04-sprint-setup');
      await js(`(()=>{const c=document.getElementById('count'); c.value=3; c.dispatchEvent(new Event('change'));})()`);
      await js(`document.getElementById('start').click()`);
      await waitFor('#ans');
      await sleep(200);
      await shot('05-sprint-running');
      for (let i = 0; i < 3; i++) {
        await waitFor('#ans'); await sleep(120);
        if (i === 0) await js(`(()=>{const i=document.getElementById('ans'); i.value='-1'; document.querySelector('form').requestSubmit();})()`);
        else await js(`document.getElementById('skip').click()`);
        await sleep(300);
      }
      check('sprint shows results', await waitFor('#final-score', 3000));
      check('sprint score is -1 (one wrong, two skipped)', (await js(`document.getElementById('final-score').textContent`)) === '-1' || (await js(`document.getElementById('final-score').textContent`)) === '−1');
      await shot('06-sprint-results');

      // Review has the misses, stats render.
      await js(`document.querySelector('[data-nav=review]').click()`);
      check('review serves a missed question', await waitFor('#ans'));
      await shot('07-review');
      await js(`document.querySelector('[data-nav=stats]').click()`);
      await waitFor('table');
      check('stats shows answered counts', (await js(`document.body.innerText`)).toLowerCase().includes('answered'));
      await shot('08-stats');
    } catch (e) {
      report.errors.push(String(e && e.stack || e));
    }
    const failed = report.checks.filter((c) => !c.ok);
    console.log('SMOKE_REPORT ' + JSON.stringify({ passed: report.checks.length - failed.length, failed, errors: report.errors }, null, 1));
    app.exit(failed.length || report.errors.length ? 1 : 0);
  });
};
