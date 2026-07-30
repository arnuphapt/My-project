const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateText: (apiKey, prompt) => ipcRenderer.invoke('generate-text', { apiKey, prompt }),
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  saveSetting: (key, value) => ipcRenderer.invoke('save-setting', { key, value }),
  getChatHistory: (agentId) => ipcRenderer.invoke('get-chat-history', agentId),
  saveChatMessage: (agentId, sender, message) => ipcRenderer.invoke('save-chat-message', { agentId, sender, message }),
  getLogs: (limit) => ipcRenderer.invoke('get-logs', limit),
  saveLog: (level, message) => ipcRenderer.invoke('save-log', { level, message }),
  saveAssetFile: (id, dataUrl) => ipcRenderer.invoke('save-asset-file', { id, dataUrl }),
  saveImageSlots: (dataStr) => ipcRenderer.invoke('save-image-slots', dataStr),
  getImageSlots: () => ipcRenderer.invoke('get-image-slots'),
  getGalleryAssets: () => ipcRenderer.invoke('get-gallery-assets'),
  scanSyncFolder: (folderPath) => ipcRenderer.invoke('scan-sync-folder', folderPath)
});
