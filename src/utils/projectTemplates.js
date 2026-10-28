/**
 * compile-all - Multi-File Project Starter Presets (StackBlitz Style)
 * Zero external dependencies
 */

export const PROJECT_TEMPLATES = {
  'react-project': {
    name: 'React 18 Multi-File Project',
    language: 'react',
    activeFile: 'src/App.jsx',
    files: {
      'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="stylesheet" href="src/styles.css">
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
      'src/App.jsx': `import React, { useState } from 'react';
import { Button } from './components/Button.jsx';
import { Card } from './components/Card.jsx';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <Card title="⚛️ Multi-File React Project">
      <p>Importing modular components across files just like StackBlitz!</p>
      <div style={{ marginTop: '20px' }}>
        <Button onClick={() => setCount(count + 1)}>
          Clicked: {count} times
        </Button>
      </div>
    </Card>
  );
}`,
      'src/components/Button.jsx': `import React from 'react';

export function Button({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 22px',
        background: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
      }}
    >
      {children}
    </button>
  );
}`,
      'src/components/Card.jsx': `import React from 'react';

export function Card({ title, children }) {
  return (
    <div style={{
      padding: '28px',
      background: '#1e293b',
      borderRadius: '12px',
      border: '1px solid #334155',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ color: '#61dafb', margin: '0 0 12px 0' }}>{title}</h2>
      {children}
    </div>
  );
}`,
      'src/styles.css': `body {
  margin: 0;
  padding: 32px;
  background: #0f172a;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}`
    }
  },

  'vue-project': {
    name: 'Vue 3 Multi-File Project',
    language: 'vue',
    activeFile: 'src/App.vue',
    files: {
      'index.html': `<div id="app"></div>`,
      'src/App.vue': `<template>
  <div class="card">
    <h1>🟢 Multi-File Vue 3 Project</h1>
    <p>Components imported and compiled across files!</p>
    <MyButton @trigger="count++">Clicked: {{ count }}</MyButton>
  </div>
</template>

<script>
import { ref } from 'vue';
import MyButton from './components/MyButton.vue';

export default {
  components: { MyButton },
  setup() {
    const count = ref(0);
    return { count };
  }
};
</script>

<style>
  body { margin: 0; padding: 32px; background: #0f172a; font-family: system-ui, sans-serif; }
  .card { padding: 28px; background: #1e293b; border-radius: 12px; color: #f8fafc; }
  h1 { color: #42b883; margin-top: 0; }
  p { color: #94a3b8; }
</style>`,
      'src/components/MyButton.vue': `<template>
  <button class="btn" @click="$emit('trigger')"><slot /></button>
</template>

<style>
  .btn {
    padding: 10px 20px;
    background: #42b883;
    color: #000;
    font-weight: bold;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
</style>`
    }
  },

  'web-project': {
    name: 'Modular HTML / JS / CSS Web Project',
    language: 'html',
    activeFile: 'index.html',
    files: {
      'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="box">
    <h1>⚡ Modular Web Project</h1>
    <p>Modular ES6 imports across JavaScript files:</p>
    <div id="display" class="display-box"></div>
    <br/>
    <button id="btn">Click to Update</button>
  </div>
  <script type="module" src="main.js"></script>
</body>
</html>`,
      'main.js': `import { getFormattedMessage } from './utils.js';

const display = document.getElementById('display');
const btn = document.getElementById('btn');

display.textContent = getFormattedMessage('Welcome to multi-file web development!');

let count = 0;
btn.onclick = () => {
  count++;
  display.textContent = getFormattedMessage(\`Action counter: \${count}\`);
};`,
      'utils.js': `export function getFormattedMessage(text) {
  const timestamp = new Date().toLocaleTimeString();
  return \`[\${timestamp}] \${text}\`;
}`,
      'styles.css': `body {
  margin: 0;
  padding: 32px;
  background: #0f172a;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.box {
  padding: 28px;
  background: #1e293b;
  border-radius: 12px;
  border: 1px solid #334155;
}
h1 { color: #38bdf8; margin-top: 0; }
.display-box {
  padding: 12px;
  background: #0f172a;
  border-radius: 6px;
  font-family: monospace;
  color: #5af78e;
}
button {
  padding: 10px 20px;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: 600;
}`
    }
  }
};
