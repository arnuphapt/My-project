const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateText: (apiKey, prompt) => ipcRenderer.invoke('generate-text', { apiKey, prompt }),
  dispatchAgent: (params) => ipcRenderer.invoke('dispatch-agent', params),
  cancelAgent: (runId) => ipcRenderer.invoke('cancel-agent', { runId }),
  onAgentEvent: (runId, callback) => {
    const channel = `agent-event-${runId}`;
    const listener = (event, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  checkCliStatus: () => ipcRenderer.invoke('check-cli-status'),
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
  scanSyncFolder: (folderPath) => ipcRenderer.invoke('scan-sync-folder', folderPath),
  ptySpawn: (sessionId, cols, rows) => ipcRenderer.invoke('pty-spawn', { sessionId, cols, rows }),
  ptyWrite: (sessionId, data) => ipcRenderer.send('pty-write', { sessionId, data }),
  ptyResize: (sessionId, cols, rows) => ipcRenderer.send('pty-resize', { sessionId, cols, rows }),
  ptyKill: (sessionId) => ipcRenderer.invoke('pty-kill', { sessionId }),
  onPtyData: (sessionId, callback) => {
    const channel = `pty-data-${sessionId}`;
    const listener = (event, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  onPtyExit: (sessionId, callback) => {
    const channel = `pty-exit-${sessionId}`;
    const listener = (event, code) => callback(code);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
