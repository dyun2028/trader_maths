// Local SQLite storage (Node's built-in node:sqlite, no native add-ons to compile).
const { DatabaseSync } = require('node:sqlite');

const MAX_LEVEL_FALLBACK = 5;

function open(file) {
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS topic_stats (
      topic TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      total_ms INTEGER NOT NULL DEFAULT 0,
      level_est REAL NOT NULL DEFAULT 1.0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL,
      topic TEXT,
      started INTEGER NOT NULL,
      ended INTEGER,
      score REAL NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      topic TEXT NOT NULL,
      level INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      answer REAL NOT NULL,
      user_input TEXT,
      correct INTEGER NOT NULL,
      skipped INTEGER NOT NULL DEFAULT 0,
      ms INTEGER NOT NULL,
      ts INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_attempts_topic ON attempts(topic, ts);
    CREATE TABLE IF NOT EXISTS review_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      level INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      answer REAL NOT NULL,
      tol REAL NOT NULL DEFAULT 0,
      hint TEXT,
      display TEXT,
      explanation TEXT,
      streak INTEGER NOT NULL DEFAULT 0,
      added INTEGER NOT NULL,
      UNIQUE(topic, prompt)
    );
  `);
  return db;
}

function makeStore(db) {
  const q = {
    stats: db.prepare('SELECT * FROM topic_stats WHERE topic = ?'),
    insStats: db.prepare('INSERT OR IGNORE INTO topic_stats(topic) VALUES (?)'),
    updStats: db.prepare('UPDATE topic_stats SET attempts = attempts + 1, correct = correct + ?, total_ms = total_ms + ?, level_est = ? WHERE topic = ?'),
    allStats: db.prepare('SELECT * FROM topic_stats'),
    insAttempt: db.prepare('INSERT INTO attempts(session_id, topic, level, prompt, answer, user_input, correct, skipped, ms, ts) VALUES (?,?,?,?,?,?,?,?,?,?)'),
    insSession: db.prepare('INSERT INTO sessions(mode, topic, started) VALUES (?,?,?)'),
    endSession: db.prepare('UPDATE sessions SET ended = ?, score = ?, total = ?, correct = ? WHERE id = ?'),
    recentSessions: db.prepare('SELECT * FROM sessions WHERE ended IS NOT NULL ORDER BY id DESC LIMIT 12'),
    upsertReview: db.prepare(`INSERT INTO review_queue(topic, level, prompt, answer, tol, hint, display, explanation, streak, added)
      VALUES (?,?,?,?,?,?,?,?,0,?)
      ON CONFLICT(topic, prompt) DO UPDATE SET streak = 0`),
    reviewCount: db.prepare('SELECT COUNT(*) AS n FROM review_queue'),
    reviewByTopic: db.prepare('SELECT topic, COUNT(*) AS n FROM review_queue GROUP BY topic'),
    reviewPick: db.prepare('SELECT * FROM review_queue ORDER BY streak ASC, RANDOM() LIMIT 1'),
    reviewPickTopic: db.prepare('SELECT * FROM review_queue WHERE topic = ? ORDER BY streak ASC, RANDOM() LIMIT 1'),
    reviewGet: db.prepare('SELECT * FROM review_queue WHERE id = ?'),
    reviewStreak: db.prepare('UPDATE review_queue SET streak = streak + 1 WHERE id = ?'),
    reviewReset: db.prepare('UPDATE review_queue SET streak = 0 WHERE id = ?'),
    reviewDel: db.prepare('DELETE FROM review_queue WHERE id = ?'),
    byDay: db.prepare(`SELECT strftime('%Y-%m-%d', ts / 1000, 'unixepoch', 'localtime') AS day,
        COUNT(*) AS n, SUM(correct) AS ok FROM attempts WHERE ts > ? GROUP BY day ORDER BY day`),
  };

  return {
    levelFor(topic, maxLevel = MAX_LEVEL_FALLBACK) {
      q.insStats.run(topic);
      const s = q.stats.get(topic);
      return Math.max(1, Math.min(maxLevel, Math.round(s.level_est)));
    },
    levelEst(topic) { q.insStats.run(topic); return q.stats.get(topic).level_est; },
    startSession(mode, topic) { return Number(q.insSession.run(mode, topic || null, Date.now()).lastInsertRowid); },
    endSession(id, score, total, correct) { q.endSession.run(Date.now(), score, total, correct, id); },
    record(qn, { sessionId, input, correct, skipped, ms }, maxLevel) {
      q.insStats.run(qn.topic);
      const s = q.stats.get(qn.topic);
      let est = s.level_est;
      // Adaptive difficulty: nudge the estimate up on a correct answer and down on a miss.
      if (!skipped) est = Math.max(1, Math.min(maxLevel, est + (correct ? 0.12 : -0.2)));
      q.updStats.run(correct ? 1 : 0, ms, est, qn.topic);
      q.insAttempt.run(sessionId || null, qn.topic, qn.level, qn.prompt, qn.answer, input ?? null, correct ? 1 : 0, skipped ? 1 : 0, ms, Date.now());
      if (!correct && !skipped) q.upsertReview.run(qn.topic, qn.level, qn.prompt, qn.answer, qn.tol || 0, qn.hint || null, qn.display || null, qn.explanation || null, Date.now());
    },
    reviewResult(id, correct) {
      if (!correct) return q.reviewReset.run(id);
      const row = q.reviewGet.get(id);
      if (!row) return;
      if (row.streak + 1 >= 2) q.reviewDel.run(id); else q.reviewStreak.run(id);
    },
    reviewNext(topic) { return topic ? q.reviewPickTopic.get(topic) : q.reviewPick.get(); },
    reviewCount() { return { total: q.reviewCount.get().n, byTopic: Object.fromEntries(q.reviewByTopic.all().map((r) => [r.topic, r.n])) }; },
    stats() {
      return {
        topics: q.allStats.all(),
        sessions: q.recentSessions.all(),
        days: q.byDay.all(Date.now() - 14 * 86400000),
      };
    },
  };
}

module.exports = { open, makeStore };
