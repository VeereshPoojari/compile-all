# compile-all

<p align="center">
  <img src="https://img.shields.io/npm/v/compile-all.svg?style=flat-square&color=2ea043" alt="npm version" />
  <img src="https://img.shields.io/badge/dependencies-0-success?style=flat-square&color=238636" alt="zero dependencies" />
  <img src="https://img.shields.io/badge/frameworks-React%20%7C%20Vue%20%7C%20Angular%20%7C%20Vanilla-blue?style=flat-square" alt="frameworks" />
  <img src="https://img.shields.io/badge/languages-45%2B%20supported-orange?style=flat-square" alt="languages" />
  <img src="https://img.shields.io/npm/l/compile-all.svg?style=flat-square" alt="license" />
</p>

Universal, high-performance, zero-dependency online code compiler, sandboxed execution engine, and interactive code playground for **React**, **Next.js**, **Vue 3**, **Angular**, **React Native**, and **Vanilla JS**.

Supports **45+ programming languages** with dual execution capabilities: **instant in-browser client execution** (via sandboxed Web Workers) and **pluggable remote compilation backends** (Piston, Judge0, or custom enterprise servers).

---

## ⚡ Highlights

- 🚀 **Zero Runtime Dependencies**: Ultra-lightweight footprint ($< 250\text{ KB}$ uncompressed, $< 65\text{ KB}$ gzipped).
- 💻 **45+ Languages Supported**: JavaScript, TypeScript, Python, C, C++, Java, Rust, Go, C#, PHP, Ruby, Bash, SQL, Kotlin, Swift, Dart, and more.
- 🛡️ **Dual Execution Architecture**:
  - **In-Browser Sandboxed Runner**: Zero-latency isolated execution for JavaScript, TypeScript, in-memory SQL, and client-side Python.
  - **Pluggable Remote Runner**: Out-of-the-box compatibility with Piston / Judge0 APIs and custom backend endpoints.
- ⚛️ **In-Browser Frontend Compilers**: Live compilation for **React 18/19 (JSX/TSX via Babel Standalone)**, **Vue 3 (Composition API & SFC)**, **Angular (Standalone with Signals)**, and **Next.js (Pages with Router shims)**.
- 🗂️ **StackBlitz-Style Multi-File Project Explorer**: Virtual File System (`VFS`) supporting files and folders, multi-file editor tabs, and in-browser module resolver linking components across files (`import Button from './Button'`).
- 🗄️ **In-Browser SQL Query Engine**: Run `CREATE TABLE`, `INSERT`, and `SELECT` with `WHERE`/`ORDER BY` instantly in-memory, formatted with clean ASCII table output.
- 🌐 **Live Web & HTML Preview**: Sandboxed HTML/CSS/JS rendering with live bidirectional console log forwarding.
- ◫ **Interactive Flexible Layouts & Resizer**: Switch between `Side-by-Side`, `Stacked`, `Editor Only`, and `Output Only` layouts with a zero-dependency draggable divider gutter.
- ⌨️ **Smart Editor Ergonomics**: Auto-indent on Enter, bracket/quote auto-closing pairs (`()`, `{}`, `[]`, `""`, `''`, ````), and line numbering.
- 📋 **Export & Sharing**: One-click Copy Code, Copy Output, and file download (`downloadCode()`).
- 🎨 **Scoped CSS & Themes**: Native Dark and Light themes with zero global style contamination.
- ⏱️ **Real-Time Telemetry**: Execution duration in milliseconds, memory consumption, and exit status codes.
- 🧩 **Multi-Framework Ecosystem**: Native first-class adapters for **React**, **Vue 3**, **Angular (Standalone)**, **React Native**, and **Vanilla JS**.
- 🛠️ **Universal Dynamic Get/Set API**: Complete programmatic control over code, language, theme, and component visibility at runtime.

---

## 📦 Installation

```bash
# npm
npm install compile-all

# pnpm
pnpm add compile-all

# yarn
yarn add compile-all
```

---

## 🚀 Quick Start

### 1. Vanilla JavaScript
```html
<!-- Load CSS -->
<link rel="stylesheet" href="node_modules/compile-all/dist/compile-all.css">

<div id="compiler" style="width: 100%; height: 550px;"></div>

<script type="module">
  import { CompileAll } from 'compile-all';

  const compiler = new CompileAll('#compiler', {
    language: 'python',
    theme: 'dark',
    onRunEnd: (result) => {
      console.log('Finished with exit code:', result.exitCode);
    }
  });

  // Programmatic execution
  // compiler.run();
</script>
```

### 2. React / Next.js
```tsx
import React, { useRef } from 'react';
import { CompileAllComponent } from 'compile-all/react';
import 'compile-all/css';

export function Playground() {
  const compilerRef = useRef(null);

  const handleRun = async () => {
    const result = await compilerRef.current?.run();
    console.log('Execution output:', result?.stdout);
  };

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <CompileAllComponent
        ref={compilerRef}
        language="rust"
        theme="dark"
        onRunEnd={(res) => console.log('Run duration:', res.durationMs)}
      />
    </div>
  );
}
```

### 3. Vue 3
```vue
<template>
  <div style="height: 600px; width: 100%;">
    <CompileAllVue
      ref="compilerRef"
      language="javascript"
      theme="dark"
      @runEnd="onRunEnd"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { CompileAllVue } from 'compile-all/vue';
import 'compile-all/css';

const compilerRef = ref(null);

const onRunEnd = (result) => {
  console.log('Result:', result.stdout);
};
</script>
```

### 4. Angular (Standalone)
```typescript
import { Component } from '@angular/core';
import { CompileAllAngular } from 'compile-all/angular';

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [CompileAllAngular],
  template: `
    <div style="height: 600px; width: 100%;">
      <compile-all
        [language]="'python'"
        [theme]="'dark'"
        (runEnd)="handleRunEnd($event)">
      </compile-all>
    </div>
  `
})
export class PlaygroundComponent {
  handleRunEnd(result: any) {
    console.log('Program output:', result.stdout);
  }
}
```

---

## ⚙️ Configuration Options (`CompileAllOptions`)

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `language` | `string` | `'javascript'` | Initial programming language (e.g. `'python'`, `'cpp'`, `'rust'`, `'go'`). |
| `code` | `string` | *Template* | Initial source code string. Defaults to language starter template. |
| `stdin` | `string` | `''` | Initial standard input passed to program. |
| `theme` | `'dark' \| 'light'` | `'dark'` | Visual color theme. |
| `readOnly` | `boolean` | `false` | Locks editor to prevent user modifications. |
| `toolbar` | `boolean` | `true` | Show or hide top header toolbar. |
| `stdinDrawer` | `boolean` | `true` | Enable standard input (`stdin`) drawer toggle. |
| `telemetry` | `boolean` | `true` | Show execution duration and exit code footer badge. |
| `endpoint` | `string \| null` | `null` | Custom remote compiler API endpoint URL (e.g., Piston or Judge0). |
| `timeoutMs` | `number` | `10000` | Max execution timeout in ms before terminating (defaults to 10s). |
| `onRunStart` | `function` | `null` | Callback fired when execution begins. |
| `onRunEnd` | `function` | `null` | Callback fired when execution finishes with output and telemetry. |
| `onStateChange` | `function` | `null` | Callback fired on any state, language, or code change. |

---

## 🛠️ Programmatic Instance Methods

```javascript
// Execution
await compiler.run();             // Run code
compiler.stop();                  // Stop active execution immediately
compiler.clearOutput();           // Clear console terminal

// Getters & Setters
compiler.getCode();               // Get current code
compiler.setCode(newCode);        // Set code programmatically
compiler.getLanguage();           // Get active language
compiler.setLanguage('rust');     // Switch active language
compiler.getLayout();             // Get layout ('split-h' | 'split-v' | 'editor-only' | 'terminal-only')
compiler.setLayout('split-v');    // Switch layout dynamically
compiler.getTheme();              // Get current theme ('dark' | 'light')
compiler.setTheme('light');       // Set theme programmatically
compiler.toggleTheme();           // Toggle between dark and light
compiler.downloadCode();          // Trigger download of current source file

// Dynamic Visibility & Panels
compiler.show('stdin');           // Show stdin drawer
compiler.hide('stdin');           // Hide stdin drawer
compiler.toggle('toolbar');       // Toggle toolbar visibility
compiler.isVisible('toolbar');    // Returns boolean
compiler.showPreview();           // Switch terminal pane to HTML preview iframe
compiler.showConsole();           // Switch terminal pane to console log terminal

// State & Lifecycle
compiler.getState();              // Returns { language, layout, code, stdin, status, theme, telemetry }
compiler.setState({ theme: 'dark' });
compiler.destroy();               // Clean teardown (workers, listeners, DOM)
```

---

## 🌳 Standalone Functional Tree-Shakeable API

```javascript
import {
  run, stop,
  getCode, setCode,
  getLanguage, setLanguage,
  getLayout, setLayout,
  downloadCode,
  show, hide, toggle,
  showPreview, showConsole
} from 'compile-all';

// Programmatic control with functional style
await run(myCompiler);
setLanguage(myCompiler, 'sql');
setLayout(myCompiler, 'split-v');
downloadCode(myCompiler);
```

---

## 🌐 Supported Languages (45+ Aliases)

| Category | Languages |
| :--- | :--- |
| **Frontend Frameworks** | React (`react`, `jsx`, `tsx`), Vue 3 (`vue`, `vue3`), Angular (`angular`, `ng`), Next.js (`nextjs`, `next`) |
| **Web & Scripting** | JavaScript (`js`), TypeScript (`ts`), Python (`py`, `python3`), HTML/CSS, JSON, Bash/Shell (`sh`), PHP, Ruby (`rb`), Perl (`pl`), Lua |
| **Systems & Native** | C, C++ (`cpp`, `c++`), Rust (`rs`), Go (`golang`), Swift, Kotlin (`kt`) |
| **Enterprise & JVM** | Java, C# (`cs`, `csharp`), Scala |
| **Functional & Math**| Haskell (`hs`), Elixir (`ex`), R, Dart |
| **Data & Databases** | SQL (`sqlite3`) |

---

## 📄 License

MIT © 2026 [Veeresh](https://github.com/VeereshMaps)
