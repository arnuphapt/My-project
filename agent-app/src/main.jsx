import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Set up window.claude complete handler
window.claude = {
  complete: async ({ messages }) => {
    if (!window.electronAPI || !window.electronAPI.generateText) {
      throw new Error('ระบบ AI ต้องการการทำงานผ่าน Electron');
    }

    // Format prompt from messages array
    const prompt = messages.map(m => {
      const role = m.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${m.content}`;
    }).join('\n\n');

    try {
      const res = await window.electronAPI.generateText('', prompt);
      if (res && res.success) {
        return res.text;
      }
      throw new Error(res?.error || 'การประมวลผลข้อความล้มเหลว');
    } catch (error) {
      console.error("Claude Complete Error:", error);
      throw new Error(error.message || 'การประมวลผล AI ล้มเหลว');
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
