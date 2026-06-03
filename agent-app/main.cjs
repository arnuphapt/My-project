const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db.cjs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

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
