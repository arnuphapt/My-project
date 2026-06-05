import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OfficeStore } from './store';

// Set up window.claude complete handler
window.claude = {
  complete: async ({ messages }) => {
    const state = OfficeStore.getState();
    let apiKey = state.settings?.gemini_api_key || state.settings?.llm_api_key;

    // Fallback: Check Electron database if not found in FastAPI DB
    if (!apiKey && window.electronAPI) {
      apiKey = await window.electronAPI.getSetting('gemini_api_key') || await window.electronAPI.getSetting('llm_api_key');
    }

    if (!apiKey) {
      throw new Error('กรุณาตั้งค่า Gemini API Key ในหน้า Config ของระบบก่อนเริ่มต้นสนทนา');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = state.settings?.llm_model_name || "gemini-3.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });

      // Convert chat history to Gemini's expected structure
      // Gemini expects role: 'user' or 'model' (not 'assistant')
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const result = await model.generateContent({ contents });
      return result.response.text();
    } catch (error) {
      console.error("LLM Generation Error:", error);
      throw new Error(error.message || 'การประมวลผล AI ล้มเหลว');
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
