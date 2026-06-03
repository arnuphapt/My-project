const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const { app } = require('electron');

let dbPromise;

function initDB() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'database.sqlite');
  
  dbPromise = open({
    filename: dbPath,
    driver: sqlite3.Database
  }).then(async (db) => {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT,
        sender TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized at", dbPath);
    return db;
  });
}

async function getSetting(key) {
  const db = await dbPromise;
  const row = await db.get('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

async function saveSetting(key, value) {
  const db = await dbPromise;
  await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
}

async function getChatHistory(agentId) {
  const db = await dbPromise;
  return await db.all('SELECT sender, message, created_at FROM chat_messages WHERE agent_id = ? ORDER BY id ASC', [agentId]);
}

async function saveChatMessage(agentId, sender, message) {
  const db = await dbPromise;
  await db.run('INSERT INTO chat_messages (agent_id, sender, message) VALUES (?, ?, ?)', [agentId, sender, message]);
}

async function getLogs(limit = 100) {
  const db = await dbPromise;
  return await db.all('SELECT * FROM system_logs ORDER BY id DESC LIMIT ?', [limit]);
}

async function saveLog(level, message) {
  const db = await dbPromise;
  await db.run('INSERT INTO system_logs (level, message) VALUES (?, ?)', [level, message]);
}

module.exports = {
  initDB,
  getSetting,
  saveSetting,
  getChatHistory,
  saveChatMessage,
  getLogs,
  saveLog
};
