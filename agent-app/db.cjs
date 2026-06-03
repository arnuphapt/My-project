const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db;

function initDB() {
  // Store database in the user data directory (e.g., AppData/Roaming/... on Windows)
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'database.sqlite');
  
  db = new Database(dbPath, { verbose: console.log });
  
  // Initialize tables
  db.exec(`
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
  `);
}

function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key);
  return row ? row.value : null;
}

function saveSetting(key, value) {
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  stmt.run(key, value);
}

function getChatHistory(agentId) {
  const stmt = db.prepare('SELECT sender, message, created_at FROM chat_messages WHERE agent_id = ? ORDER BY id ASC');
  return stmt.all(agentId);
}

function saveChatMessage(agentId, sender, message) {
  const stmt = db.prepare('INSERT INTO chat_messages (agent_id, sender, message) VALUES (?, ?, ?)');
  stmt.run(agentId, sender, message);
}

module.exports = {
  initDB,
  getSetting,
  saveSetting,
  getChatHistory,
  saveChatMessage
};
