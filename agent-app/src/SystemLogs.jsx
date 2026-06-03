import React, { useState, useEffect } from 'react';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [testMessage, setTestMessage] = useState('ระบบทำงานปกติ...');
  
  const fetchLogs = async () => {
    if (window.electronAPI) {
      const data = await window.electronAPI.getLogs(50);
      setLogs(data || []);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleAddLog = async () => {
    if (!testMessage.trim()) return;
    if (window.electronAPI) {
      await window.electronAPI.saveLog('INFO', testMessage);
      setTestMessage('');
      fetchLogs();
    } else {
      alert("ไม่สามารถบันทึก Log ได้ กรุณารันผ่าน Electron");
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 className="title-xl" style={{ fontSize: 20, letterSpacing: 1 }}>SYSTEM LOGS</h1>
          <div style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 8, fontFamily: 'var(--thai)' }}>
            ประวัติการทำงานและข้อความระบบ
          </div>
        </div>
      </div>
      
      {/* Test Log Input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input 
          className="fld"
          style={{ flex: 1, padding: '10px 14px', fontFamily: 'var(--thai)' }}
          placeholder="พิมพ์ข้อความทดสอบ log..." 
          value={testMessage}
          onChange={e => setTestMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddLog()}
        />
        <button className="btn ghost" onClick={handleAddLog}>เพิ่ม Log ทดสอบ</button>
        <button className="btn ghost" onClick={fetchLogs}>รีเฟรช 🔄</button>
      </div>

      {/* Logs View */}
      <div style={{ flex: 1, background: 'rgba(10,14,24,.8)', border: '1px solid var(--line)', borderRadius: 12, padding: 16, overflow: 'auto', fontFamily: 'var(--mono)', fontSize: 13 }}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-mute)', textAlign: 'center', marginTop: 40, fontFamily: 'var(--thai)' }}>
            ยังไม่มีบันทึก Log
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-dim)', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '8px 4px', width: '180px' }}>เวลา (Created At)</th>
                <th style={{ padding: '8px 4px', width: '80px' }}>Level</th>
                <th style={{ padding: '8px 4px' }}>ข้อความ (Message)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px 4px', color: 'var(--text-mute)' }}>{log.created_at}</td>
                  <td style={{ padding: '8px 4px', color: log.level === 'ERROR' ? 'var(--red)' : 'var(--cyan)' }}>
                    {log.level}
                  </td>
                  <td style={{ padding: '8px 4px', color: 'var(--white)', fontFamily: 'var(--thai)' }}>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
