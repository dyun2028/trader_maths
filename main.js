const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');
const { topics, byId, meta } = require('./src/topics');
const { parseAnswer, isCorrect } = require('./src/answer');
const dbmod = require('./src/db');

let store;
const live = new Map(); // question id -> question (answers stay in the main process)
const recent = new Map(); // topic -> last prompts, to avoid immediate repeats
const REPEAT_WINDOW = 12;

function makeQuestion(topicId, levelWanted) {
  const t = byId[topicId];
  if (!t) throw new Error(`Unknown topic ${topicId}`);
  const max = t.levels.length;
  const level = levelWanted > 0 ? Math.min(levelWanted, max) : store.levelFor(topicId, max);
  const seen = recent.get(topicId) || [];
  let q;
  for (let i = 0; i < 25; i++) {
    q = t.generate(level);
    if (!seen.includes(q.prompt)) break;
  }
  seen.push(q.prompt);
  if (seen.length > REPEAT_WINDOW) seen.shift();
  recent.set(topicId, seen);
  return { ...q, topic: topicId, level };
}

function publish(q) {
  const qid = crypto.randomUUID();
  live.set(qid, q);
  if (live.size > 500) live.delete(live.keys().next().value);
  return { qid, topic: q.topic, level: q.level, prompt: q.prompt, hint: q.hint || '', review: !!q.reviewId };
}

function registerIpc() {
  ipcMain.handle('topics', () => topics.map((t) => ({
    ...meta(t),
    levelEst: store.levelEst(t.id),
  })));

  ipcMain.handle('next', (_e, { topic, level }) => publish(makeQuestion(topic, level || 0)));

  ipcMain.handle('answer', (_e, { qid, input, ms, sessionId }) => {
    const q = live.get(qid);
    if (!q) return { error: 'expired' };
    const skipped = input === null;
    let correct = false;
    if (!skipped) {
      const parsed = parseAnswer(input);
      if (!parsed) return { invalid: true };
      correct = isCorrect(parsed, q.answer, q.tol || 0);
    }
    live.delete(qid);
    const timeMs = Math.max(0, Math.min(Math.round(ms) || 0, 3600000));
    store.record(q, { sessionId, input: skipped ? null : String(input).slice(0, 60), correct, skipped, ms: timeMs }, byId[q.topic].levels.length);
    if (q.reviewId) store.reviewResult(q.reviewId, correct);
    return {
      correct, skipped,
      display: q.display || String(Number(q.answer.toPrecision(12))),
      explanation: q.explanation || '',
    };
  });

  ipcMain.handle('startSession', (_e, { mode, topic }) => store.startSession(mode, topic));
  ipcMain.handle('endSession', (_e, { id, score, total, correct }) => { store.endSession(id, score, total, correct); return true; });

  ipcMain.handle('reviewCount', () => store.reviewCount());
  ipcMain.handle('reviewNext', (_e, { topic } = {}) => {
    const row = store.reviewNext(topic);
    if (!row) return null;
    return publish({
      topic: row.topic, level: row.level, prompt: row.prompt, answer: row.answer, tol: row.tol,
      hint: row.hint || '', display: row.display || undefined, explanation: row.explanation || '', reviewId: row.id,
    });
  });

  ipcMain.handle('stats', () => store.stats());
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 760, minWidth: 820, minHeight: 600,
    backgroundColor: '#0d1117',
    title: 'Trader Maths Trainer',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  return win;
}

if (process.env.TRAINER_SMOKE) app.disableHardwareAcceleration(); // reliable screenshots in test runs

app.whenReady().then(() => {
  const dir = process.env.TRAINER_DATA_DIR || app.getPath('userData');
  store = dbmod.makeStore(dbmod.open(path.join(dir, 'trainer.db')));
  registerIpc();
  const win = createWindow();
  if (process.env.TRAINER_SMOKE) require('./test/smoke')(win, app);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
