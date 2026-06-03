import fs from 'fs';
import path from 'path';

const basePath = 'e:/WorkSpace/My project/';
const agentAppPath = path.join(basePath, 'agent-app/src');

const filesToConcat = [
  'js/data.jsx',
  'js/store.jsx',
  'js/ui.jsx',
  'js/dashboard.jsx',
  'js/warroom.jsx',
  'js/portfolio.jsx',
  'js/team.jsx',
  'js/secretary.jsx',
  'js/projects.jsx',
  'js/assets.jsx',
  'js/settings.jsx',
  'js/app.jsx'
];

let finalCode = `import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';\nimport ReactDOM from 'react-dom/client';\nimport './assets/index.css';\nimport '../../image-slot.js';\n\n`;

for (const file of filesToConcat) {
  let content = fs.readFileSync(path.join(basePath, file), 'utf8');
  // Remove the ReactDOM.createRoot call since we'll handle it in main.jsx
  content = content.replace(/ReactDOM\.createRoot\([^)]+\)\.render\(<App\/>\);?/g, '');
  
  // Wrap file contents with a comment
  finalCode += `\n/* ========== ${file} ========== */\n${content}\n`;
}

// Ensure the App component is exported
finalCode += `\nexport default App;\n`;

fs.writeFileSync(path.join(agentAppPath, 'App.jsx'), finalCode);
console.log('App.jsx created successfully.');

// Now extract the CSS from AI Agent Office.html and put it in index.css
const htmlContent = fs.readFileSync(path.join(basePath, 'AI Agent Office.html'), 'utf8');
const cssMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch && cssMatch[1]) {
  fs.mkdirSync(path.join(agentAppPath, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(agentAppPath, 'assets', 'index.css'), cssMatch[1].trim());
  console.log('index.css created successfully.');
}
