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
    <div className="h-full flex flex-col p-6 box-border">
      <div className="flex items-end justify-between mb-[18px]">
        <div>
          <h1 className="title-xl text-[20px] tracking-[1px]">SYSTEM LOGS</h1>
          <div className="text-text-dim text-[14px] mt-2 font-thai">
            ประวัติการทำงานและข้อความระบบ
          </div>
        </div>
      </div>
      
      {/* Test Log Input */}
      <div className="flex gap-2.5 mb-4">
        <input 
          className="fld flex-1 px-3.5 py-2.5 font-thai"
          placeholder="พิมพ์ข้อความทดสอบ log..." 
          value={testMessage}
          onChange={e => setTestMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddLog()}
        />
        <button className="btn ghost" onClick={handleAddLog}>เพิ่ม Log ทดสอบ</button>
        <button className="btn ghost" onClick={fetchLogs}>รีเฟรช 🔄</button>
      </div>

      {/* Logs View */}
      <div className="flex-1 bg-[#0a0e18]/80 border border-line rounded-xl p-4 overflow-auto font-mono text-[13px]">
        {logs.length === 0 ? (
          <div className="text-text-mute text-center mt-10 font-thai">
            ยังไม่มีบันทึก Log
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-text-dim border-b border-line">
                <th className="px-1 py-2 w-[180px]">เวลา (Created At)</th>
                <th className="px-1 py-2 w-[80px]">Level</th>
                <th className="px-1 py-2">ข้อความ (Message)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-white/5">
                  <td className="px-1 py-2 text-text-mute">{log.created_at}</td>
                  <td 
                    className="px-1 py-2" 
                    style={{ color: log.level === 'ERROR' ? 'var(--red)' : 'var(--cyan)' }}
                  >
                    {log.level}
                  </td>
                  <td className="px-1 py-2 text-white font-thai">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
