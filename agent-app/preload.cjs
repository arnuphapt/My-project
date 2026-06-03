const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateText: (apiKey, prompt) => ipcRenderer.invoke('generate-text', { apiKey, prompt }),
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  saveSetting: (key, value) => ipcRenderer.invoke('save-setting', { key, value }),
  getChatHistory: (agentId) => ipcRenderer.invoke('get-chat-history', agentId),
  saveChatMessage: (agentId, sender, message) => ipcRenderer.invoke('save-chat-message', { agentId, sender, message })
});
