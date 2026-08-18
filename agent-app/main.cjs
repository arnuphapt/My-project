const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execFile } = require('child_process');
const db = require('./db.cjs');
const pty = require('node-pty');

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
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

// Active subprocess tracking: runId -> { process, worker, status, startTime }
const activeRuns = new Map();

function cleanupActiveRuns() {
  for (const [runId, item] of activeRuns.entries()) {
    try {
      if (item && item.process) {
        item.process.kill('SIGTERM');
      }
    } catch (_) { /* ignore kill errors */ }
  }
  activeRuns.clear();
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

app.on('before-quit', () => {
  cleanupActiveRuns();
});

app.on('window-all-closed', () => {
  cleanupActiveRuns();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Helper to verify if CLI is present on PATH
function checkExecutable(cmd) {
  return new Promise((resolve) => {
    const checkCmd = process.platform === 'win32' ? 'where.exe' : 'which';
    execFile(checkCmd, [cmd], (err, stdout) => {
      resolve(!err && stdout && stdout.trim().length > 0);
    });
  });
}

// ── Process Killer (Windows Tree Kill Support) ──────────────────────────
function killProcessTree(child) {
  if (!child || !child.pid) return;
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      execSync(`taskkill /pid ${child.pid} /t /f`, { stdio: 'ignore' });
    } catch (_) {
      try { child.kill('SIGKILL'); } catch (__) {}
    }
  } else {
    try { child.kill('SIGTERM'); } catch (_) {}
  }
}

const TRUSTED_ROOTS = [
  'e:\\workspace\\my-project',
  'e:\\workspace\\joryui-agent',
  'e:\\workspace',
  process.cwd().toLowerCase()
];

function isTrustedCwd(targetPath) {
  if (!targetPath) return true;
  const resolved = path.resolve(targetPath).toLowerCase();
  return TRUSTED_ROOTS.some(root => resolved === root || resolved.startsWith(root + path.sep));
}

const knownClaudeSessions = new Set();

// ── Multi-Agent Vendor CLI Runner ───────────────────────────────────────
function runCLI(worker, { runId, prompt, agentName, permissionMode, cwd, allowedTools, sessionId, timeout = 180000, onEvent = () => {} }) {
  return new Promise((resolve, reject) => {
    let executable = worker;
    let args = [];
    let promptText = prompt || '';

    // If agentName is specified and not Yuri/default, format prompt context
    if (agentName && agentName.toLowerCase() !== 'joyuri' && agentName.toLowerCase() !== 'yuri' && worker === 'claude') {
      promptText = `Use the ${agentName} agent to complete the following task:\n\n${promptText}`;
    }

    if (worker === 'claude') {
      args = [
        '-p', promptText,
        '--output-format', 'stream-json',
        '--verbose',
        '--allowedTools', allowedTools || 'Read,Grep,Glob,Agent',
        '--forward-subagent-text',
        '--include-partial-messages'
      ];
      if (sessionId) {
        if (knownClaudeSessions.has(sessionId)) {
          args.push('--resume', sessionId);
        } else {
          args.push('--session-id', sessionId);
          knownClaudeSessions.add(sessionId);
        }
      }
      if (permissionMode && permissionMode !== 'default') {
        args.push('--permission-mode', permissionMode);
      }
    } else if (worker === 'codex') {
      args = ['exec', '--json', '--skip-git-repo-check', promptText];
    } else if (worker === 'agy') {
      args = ['--print', promptText];
    } else {
      return reject(new Error(`Unsupported worker: ${worker}`));
    }

    const workingDir = cwd || 'E:\\WorkSpace\\My-project';
    const isTrusted = isTrustedCwd(workingDir);

    let child;
    try {
      child = spawn(executable, args, {
        cwd: fs.existsSync(workingDir) ? workingDir : os.homedir(),
        stdio: ['ignore', 'pipe', 'pipe'], // stdin closed to prevent hanging
        windowsHide: true,
        env: {
          ...process.env,
          CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '600000',
        }
      });
    } catch (spawnErr) {
      return resolve({ success: false, error: spawnErr.message });
    }

    let timedOut = false;
    let userCanceled = false;

    activeRuns.set(runId, {
      process: child,
      worker,
      status: 'running',
      startTime: Date.now(),
      get canceled() { return userCanceled; },
      set canceled(val) { userCanceled = val; }
    });

    let stdoutBuf = '';
    let stderrBuf = '';
    let finalResult = '';
    const agyLines = [];

    // Timeout guard with explicit flag (Bug 2 fix)
    const timer = setTimeout(() => {
      timedOut = true;
      onEvent({
        runId,
        worker,
        kind: 'error',
        text: `Execution timed out after ${Math.round(timeout / 1000)}s`
      });
      killProcessTree(child); // Bug 4 fix
    }, timeout);

    // Initial event
    onEvent({
      runId,
      worker,
      kind: 'init',
      text: `Dispatched ${worker.toUpperCase()}${agentName ? ` [${agentName}]` : ''}...`,
      raw: { worker, args, cwd: workingDir, trusted: isTrusted }
    });

    // Security warning if cwd is outside trusted roots (Bug 3 fix)
    if (!isTrusted) {
      onEvent({
        runId,
        worker,
        kind: 'progress',
        text: `[SECURITY NOTICE] Running in external directory: ${workingDir}. Project hooks and configurations will be executed.`
      });
    }

    function processStreamLine(line) {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (worker === 'claude') {
        try {
          const obj = JSON.parse(trimmed);
          if (obj.type === 'system') {
            if (obj.subtype === 'init') {
              onEvent({ runId, worker: 'claude', kind: 'init', raw: obj });
            } else if (obj.subtype === 'api_retry') {
              onEvent({
                runId,
                worker: 'claude',
                kind: 'progress',
                text: `API Retry (${obj.attempt}/${obj.max_retries}): ${obj.error}`,
                raw: obj
              });
            }
          } else if (obj.type === 'assistant' || obj.type === 'user') {
            const parentId = obj.parent_tool_use_id || null;
            if (obj.message && Array.isArray(obj.message.content)) {
              for (const block of obj.message.content) {
                if (block.type === 'text') {
                  onEvent({
                    runId,
                    worker: 'claude',
                    kind: parentId ? 'subagent_text' : 'text',
                    parentId,
                    text: block.text,
                    raw: obj
                  });
                } else if (block.type === 'thinking') {
                  onEvent({
                    runId,
                    worker: 'claude',
                    kind: 'progress',
                    parentId,
                    text: block.thinking,
                    raw: obj
                  });
                } else if (block.type === 'tool_use') {
                  const isSubagent = block.name === 'Agent' || block.name === 'Task';
                  onEvent({
                    runId,
                    worker: 'claude',
                    kind: isSubagent ? 'subagent_start' : 'tool_use',
                    agentName: isSubagent ? (block.input?.subagent_name || block.input?.agent || block.name) : undefined,
                    parentId,
                    text: isSubagent ? `Starting subagent: ${block.input?.subagent_name || block.input?.agent || block.name}` : `Tool: ${block.name}`,
                    raw: block
                  });
                } else if (block.type === 'tool_result') {
                  onEvent({
                    runId,
                    worker: 'claude',
                    kind: 'tool_result',
                    parentId,
                    text: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
                    raw: block
                  });
                }
              }
            } else if (obj.text) {
              onEvent({
                runId,
                worker: 'claude',
                kind: parentId ? 'subagent_text' : 'text',
                parentId,
                text: obj.text,
                raw: obj
              });
            }
          } else if (obj.type === 'result') {
            finalResult = obj.result || '';
            onEvent({
              runId,
              worker: 'claude',
              kind: 'result',
              text: finalResult,
              raw: obj
            });
          } else if (obj.type === 'error') {
            onEvent({
              runId,
              worker: 'claude',
              kind: 'error',
              text: typeof obj.error === 'string' ? obj.error : JSON.stringify(obj.error),
              raw: obj
            });
          }
        } catch (_) {
          onEvent({ runId, worker: 'claude', kind: 'progress', text: trimmed });
        }
      } else if (worker === 'codex') {
        try {
          const obj = JSON.parse(trimmed);
          if (obj.type === 'thread.started') {
            onEvent({ runId, worker: 'codex', kind: 'init', raw: obj });
          } else if (obj.type === 'turn.started' || obj.type === 'turn.completed') {
            onEvent({ runId, worker: 'codex', kind: 'progress', text: obj.type, raw: obj });
          } else if (obj.type === 'item.started') {
            if (obj.item?.type === 'command_execution') {
              onEvent({ runId, worker: 'codex', kind: 'tool_use', text: obj.item.command, raw: obj.item });
            }
          } else if (obj.type === 'item.completed') {
            if (obj.item?.type === 'agent_message') {
              finalResult = obj.item.text || '';
              onEvent({ runId, worker: 'codex', kind: 'text', text: finalResult, raw: obj.item });
            } else if (obj.item?.type === 'command_execution') {
              onEvent({ runId, worker: 'codex', kind: 'tool_result', raw: obj.item });
            }
          } else if (obj.type === 'error' || obj.type === 'turn.failed') {
            onEvent({ runId, worker: 'codex', kind: 'error', text: obj.message || 'Turn failed', raw: obj });
          }
        } catch (_) {
          onEvent({ runId, worker: 'codex', kind: 'progress', text: trimmed });
        }
      } else if (worker === 'agy') {
        const clean = trimmed.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '').trim();
        if (clean) {
          agyLines.push(clean);
          onEvent({ runId, worker: 'agy', kind: 'text', text: clean });
        }
      }
    }

    child.stdout.on('data', (chunk) => {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split(/\r?\n/);
      stdoutBuf = lines.pop(); // keep remainder
      for (const line of lines) {
        processStreamLine(line);
      }
    });

    child.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      activeRuns.delete(runId);

      // Flush trailing stdout buffer before resolving (Bug 1 fix)
      if (stdoutBuf && stdoutBuf.trim()) {
        processStreamLine(stdoutBuf.trim());
        stdoutBuf = '';
      }

      // Explicitly distinguish timeout from user cancel (Bug 2 fix)
      if (timedOut) {
        const errMsg = `Execution timed out after ${Math.round(timeout / 1000)}s`;
        return resolve({ success: false, timedOut: true, error: errMsg });
      }

      if (userCanceled || code === 143) {
        onEvent({ runId, worker, kind: 'canceled', text: 'Run was canceled by user.' });
        return resolve({ success: true, canceled: true });
      }

      // Retain and stream stderr warning info even on exit 0 (Bug 5 fix)
      if (stderrBuf && stderrBuf.trim()) {
        onEvent({
          runId,
          worker,
          kind: 'progress',
          text: `[STDERR] ${stderrBuf.trim()}`,
          raw: { stderr: stderrBuf.trim() }
        });
      }

      if (code === 0) {
        if (worker === 'agy' && !finalResult) {
          finalResult = agyLines.join('\n');
          onEvent({ runId, worker: 'agy', kind: 'result', text: finalResult });
        }
        return resolve({ success: true, result: finalResult });
      } else {
        const errMsg = stderrBuf.trim() || `Process exited with code ${code}`;
        onEvent({ runId, worker, kind: 'error', text: errMsg });
        return resolve({ success: false, error: errMsg });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      activeRuns.delete(runId);
      onEvent({ runId, worker, kind: 'error', text: err.message });
      resolve({ success: false, error: err.message });
    });
  });
}

// ── IPC Handlers ────────────────────────────────────────────────────────
ipcMain.handle('generate-text', async (event, { prompt }) => {
  try {
    const runId = 'gen-' + Date.now();
    const res = await runCLI('claude', {
      prompt,
      runId,
      allowedTools: 'Read,Grep,Glob,Agent',
      onEvent: () => {}
    });
    if (res.success) {
      return { success: true, text: res.result || '' };
    } else {
      return { success: false, error: res.error || 'Execution failed' };
    }
  } catch (error) {
    console.error("Claude CLI generate-text error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('dispatch-agent', async (event, params) => {
  const { runId = 'run-' + Date.now(), worker = 'claude' } = params;
  const channel = `agent-event-${runId}`;

  const onEvent = (eventData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, eventData);
    }
    // Also record critical logs into DB
    if (eventData.kind === 'error' || eventData.kind === 'result') {
      db.saveLog(eventData.kind.toUpperCase(), `[${worker.toUpperCase()}] ${eventData.text || ''}`);
    }
  };

  return await runCLI(worker, { ...params, runId, onEvent });
});

ipcMain.handle('cancel-agent', (event, { runId }) => {
  const item = activeRuns.get(runId);
  if (item && item.process) {
    try {
      item.canceled = true;
      killProcessTree(item.process); // Bug 4 fix
      activeRuns.delete(runId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Run not found or already completed' };
});

ipcMain.handle('check-cli-status', async () => {
  const [hasClaude, hasCodex, hasAgy] = await Promise.all([
    checkExecutable('claude'),
    checkExecutable('codex'),
    checkExecutable('agy')
  ]);
  return { claude: hasClaude, codex: hasCodex, agy: hasAgy };
});

ipcMain.handle('reset-claude-session', (event, sessionId) => {
  if (sessionId) {
    knownClaudeSessions.delete(sessionId);
  } else {
    knownClaudeSessions.clear();
  }
  return true;
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

  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid input string');
  }

  const extension = matches[1].split('/')[1] || 'webp';
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${id}-${Date.now()}.${extension}`;
  const filepath = path.join(assetsDir, filename);

  fs.writeFileSync(filepath, buffer);
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
const ptySessions = new Map();

ipcMain.handle('pty-spawn', (event, { sessionId, cols, rows }) => {
  const existing = ptySessions.get(sessionId);
  if (existing) {
    try { existing.kill(); } catch (_) {}
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
    try { term.resize(cols, rows); } catch (_) {}
  }
});

ipcMain.handle('pty-kill', (event, { sessionId }) => {
  const term = ptySessions.get(sessionId);
  if (term) {
    try { term.kill(); } catch (_) {}
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
