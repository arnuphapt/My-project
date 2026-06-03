const fs = require('fs');
const path = require('path');

const appPath = 'e:/WorkSpace/My project/agent-app/src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// The new directories
const srcPath = 'e:/WorkSpace/My project/agent-app/src';
fs.mkdirSync(path.join(srcPath, 'store'), { recursive: true });
fs.mkdirSync(path.join(srcPath, 'components'), { recursive: true });
fs.mkdirSync(path.join(srcPath, 'pages'), { recursive: true });

// Split by sections
const sections = content.split(/\/\* ========== ([\w/.]+) ========== \*\//);

const files = {};
// sections[0] is the top imports
let topImports = sections[0];

for (let i = 1; i < sections.length; i += 2) {
  files[sections[i]] = sections[i + 1];
}

const UI_EXPORTS = "export { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY };";
const STORE_EXPORTS = "export { OfficeStore, useOffice, fmt, SEED };";

const REACT_IMPORTS = `import React, { useState as useS, useEffect as useE, useRef as useR, useMemo, useCallback } from 'react';\nimport { OfficeStore, useOffice, fmt, SEED } from '../store/store.js';\nimport { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY } from '../components/UI.jsx';\nimport '../../image-slot.js';\n`;
const PAGE_IMPORTS = REACT_IMPORTS;

for (const [key, body] of Object.entries(files)) {
  let fileContent = body;
  let newPath = '';
  
  if (key === 'js/data.jsx' || key === 'js/store.jsx') {
    // skip, we will merge these two
    continue;
  } else if (key === 'js/ui.jsx') {
    fileContent = fileContent.replace(/Object\.assign\(window,\s*\{[^}]+\}\);/, UI_EXPORTS);
    fileContent = `import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';\nimport { OfficeStore, useOffice, fmt } from '../store/store.js';\n` + fileContent;
    newPath = 'components/UI.jsx';
  } else if (key === 'js/app.jsx') {
    fileContent = fileContent.replace(/window\.App\s*=\s*App;/, '');
    fileContent = fileContent.replace(/ReactDOM\.createRoot.*/, '');
    let pageImports = Object.keys(files).filter(k => k.startsWith('js/') && !['js/data.jsx','js/store.jsx','js/ui.jsx','js/app.jsx'].includes(k))
      .map(k => `import ${k.replace('js/', '').replace('.jsx', '')[0].toUpperCase() + k.replace('js/', '').replace('.jsx', '').slice(1)} from './pages/${k.replace('js/', '').replace('.jsx', '')[0].toUpperCase() + k.replace('js/', '').replace('.jsx', '').slice(1)}.jsx';`).join('\n');
    fileContent = `import React, { useEffect as useE } from 'react';\nimport { OfficeStore, useOffice } from './store/store.js';\nimport { NavBar } from './components/UI.jsx';\n${pageImports}\nimport SystemLogs from './SystemLogs.jsx';\n\n` + fileContent;
    newPath = 'App.jsx';
  } else {
    // Pages
    fileContent = fileContent.replace(/window\.[a-zA-Z]+\s*=\s*[a-zA-Z]+;/, ''); // remove window assignment
    const pageName = key.replace('js/', '').replace('.jsx', '');
    const pageComponentName = pageName[0].toUpperCase() + pageName.slice(1);
    fileContent = PAGE_IMPORTS + fileContent + `\nexport default ${pageComponentName};\n`;
    newPath = `pages/${pageComponentName}.jsx`;
  }
  
  fs.writeFileSync(path.join(srcPath, newPath), fileContent.trim() + '\n');
}

// Merge data and store
let dataContent = files['js/data.jsx'];
let storeContent = files['js/store.jsx'];
let combinedStore = dataContent + '\n' + storeContent;
combinedStore = combinedStore.replace(/^\(function\(\)\{/, '');
combinedStore = combinedStore.replace(/\}\)\(\);$/, '');
combinedStore = combinedStore.replace(/window\.OfficeStore\s*=\s*\{([^}]+)\};/, 'const OfficeStore = {$1};');
combinedStore = combinedStore.replace(/window\.useOffice\s*=\s*useOffice;/, '');
combinedStore = combinedStore.replace(/window\.fmt\s*=\s*\{/, 'const fmt = {');
combinedStore = combinedStore.replace(/window\.SEED\s*=\s*\{([^}]+)\};/, 'const SEED = {$1};');
combinedStore = `import { useState, useEffect } from 'react';\n\n` + combinedStore + '\n' + STORE_EXPORTS;
fs.writeFileSync(path.join(srcPath, 'store/store.js'), combinedStore.trim() + '\n');

// Clean up original source files requested by user
const originalSourcePath = 'e:/WorkSpace/My project/js';
if (fs.existsSync(originalSourcePath)) {
  fs.rmSync(originalSourcePath, { recursive: true, force: true });
}
const refactorScriptPath = 'e:/WorkSpace/My project/refactor.mjs';
if (fs.existsSync(refactorScriptPath)) {
  fs.rmSync(refactorScriptPath);
}

console.log('Refactoring complete!');
