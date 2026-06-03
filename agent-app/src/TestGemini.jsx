import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function TestGemini() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('สวัสดี แนะนำตัวสั้นๆ หน่อย');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Load saved API key on mount
  React.useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSetting('gemini_api_key').then(savedKey => {
        if (savedKey) setApiKey(savedKey);
      });
    }
  }, []);

  const testGemini = async () => {
    if (!apiKey) {
      alert('กรุณาใส่ API Key');
      return;
    }

    // Save the API key securely
    if (window.electronAPI) {
      window.electronAPI.saveSetting('gemini_api_key', apiKey);
    }

    setLoading(true);
    setResponse('');
    try {
      if (window.electronAPI) {
        // Run securely via Electron backend
        const res = await window.electronAPI.generateText(apiKey, prompt);
        if (res.success) {
          setResponse(res.text);
        } else {
          setResponse('Error: ' + res.error);
        }
      } else {
        // Fallback for browser (Vite dev server)
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        setResponse(result.response.text());
      }
    } catch (err) {
      setResponse('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', background: 'rgba(20,24,36,.9)', border: '1px solid #3a6bff', borderRadius: '10px', marginTop: '20px', color: '#fff', fontFamily: 'var(--thai)' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#46b6ff' }}>🧪 ทดสอบ Gemini API</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="password"
          placeholder="ใส่ Gemini API Key ที่นี่..."
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #33406a', background: '#0c0f18', color: '#fff' }}
        />
        <input
          type="text"
          placeholder="ข้อความ Prompt"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #33406a', background: '#0c0f18', color: '#fff' }}
        />
        <button
          onClick={testGemini}
          disabled={loading}
          style={{ padding: '10px', background: '#3a6bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'กำลังคิด...' : 'ส่งข้อความหา Gemini'}
        </button>
      </div>
      {response && (
        <div style={{ marginTop: '15px', padding: '15px', background: '#111521', borderRadius: '5px', border: '1px solid #23304a', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
          <strong>Gemini:</strong><br />
          {response}
        </div>
      )}
    </div>
  );
}
