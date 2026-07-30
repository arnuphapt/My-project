const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db.cjs');
const pty = require('node-pty');

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    }
  });

  mainWindow = win;
  win.on('closed', () => { mainWindow = null; });

  // Load the Vite dev server URL
  win.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
  db.initDB();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handler for Gemini API
ipcMain.handle('generate-text', async (event, { apiKey, prompt }) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return { success: true, text: result.response.text() };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { success: false, error: error.message };
  }
});

// DB IPC handlers
ipcMain.handle('get-setting', (event, key) => {
  return db.getSetting(key);
});

ipcMain.handle('save-setting', (event, { key, value }) => {
  db.saveSetting(key, value);
  return true;
});

ipcMain.handle('get-chat-history', (event, agentId) => {
  return db.getChatHistory(agentId);
});

ipcMain.handle('save-chat-message', (event, { agentId, sender, message }) => {
  db.saveChatMessage(agentId, sender, message);
  return true;
});

ipcMain.handle('get-logs', async (event, limit) => {
  return await db.getLogs(limit);
});

ipcMain.handle('save-log', async (event, { level, message }) => {
  await db.saveLog(level, message);
  return true;
});

ipcMain.handle('save-asset-file', async (event, { id, dataUrl }) => {
  let folder = 'gallery';
  if (id.startsWith('sys-') || id.startsWith('player-')) folder = 'identity';
  else if (id.startsWith('proj-')) folder = 'projects';

  const assetsDir = path.join(__dirname, 'src', 'assets', folder);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // dataUrl format: data:image/webp;base64,UklGR...
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid input string');
  }

  const extension = matches[1].split('/')[1] || 'webp';
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${id}-${Date.now()}.${extension}`;
  const filepath = path.join(assetsDir, filename);

  fs.writeFileSync(filepath, buffer);
  // Return absolute file URL so browser can load it directly
  return `file:///${filepath.replace(/\\/g, '/')}`;
});

ipcMain.handle('save-image-slots', async (event, dataStr) => {
  await db.saveSetting('image_slots', dataStr);
  return true;
});

ipcMain.handle('get-image-slots', async (event) => {
  return await db.getSetting('image_slots');
});

ipcMain.handle('get-gallery-assets', async () => {
  const assetsDir = path.join(__dirname, 'src', 'assets');
  let allFiles = [];
  
  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (f.match(/\.(webp|png|jpe?g)$/i)) {
        allFiles.push(`file:///${fullPath.replace(/\\/g, '/')}`);
      }
    }
  };

  scanDir(assetsDir);
  return allFiles.sort().reverse();
});

// ===== Real terminal (WebLive) via node-pty =====
const ptySessions = new Map(); // sessionId -> pty process

ipcMain.handle('pty-spawn', (event, { sessionId, cols, rows }) => {
  // kill any existing session with the same id before spawning a new one
  const existing = ptySessions.get(sessionId);
  if (existing) {
    try { existing.kill(); } catch (_) { /* already dead */ }
    ptySessions.delete(sessionId);
  }

  const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash');

  const term = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: cols || 80,
    rows: rows || 24,
    cwd: os.homedir(),
    env: process.env,
  });

  term.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`pty-data-${sessionId}`, data);
    }
  });

  term.onExit(({ exitCode }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`pty-exit-${sessionId}`, exitCode);
    }
    ptySessions.delete(sessionId);
  });

  ptySessions.set(sessionId, term);
  return { success: true, pid: term.pid };
});

ipcMain.on('pty-write', (event, { sessionId, data }) => {
  const term = ptySessions.get(sessionId);
  if (term) term.write(data);
});

ipcMain.on('pty-resize', (event, { sessionId, cols, rows }) => {
  const term = ptySessions.get(sessionId);
  if (term && cols > 0 && rows > 0) {
    try { term.resize(cols, rows); } catch (_) { /* ignore resize race */ }
  }
});

ipcMain.handle('pty-kill', (event, { sessionId }) => {
  const term = ptySessions.get(sessionId);
  if (term) {
    try { term.kill(); } catch (_) { /* already dead */ }
    ptySessions.delete(sessionId);
  }
  return true;
});

ipcMain.handle('scan-sync-folder', async (event, folderPath) => {
  let allFiles = [];
  try {
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath);
        } else if (f.endsWith('.md') || f.endsWith('.json')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          allFiles.push({ path: path.relative(folderPath, fullPath).replace(/\\/g, '/'), name: f, text: content });
        }
      }
    };
    scanDir(folderPath);
  } catch (err) {
    console.error("Error scanning folder:", err);
  }
  return allFiles;
});
