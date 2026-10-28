# Changelog

All notable changes to the `compile-all` library will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-19

### 🚀 Initial Release
- **Universal Zero-Dependency Architecture**: Pure Vanilla JavaScript core engine with zero runtime dependencies.
- **Support for 45+ Programming Languages**:
  - Web & Scripting: JavaScript, TypeScript, Python, HTML/CSS, JSON, Bash/Shell, PHP, Ruby, Perl, Lua.
  - Systems & Native: C, C++, Rust, Go, Swift, Kotlin.
  - Enterprise: Java, C#, Scala.
  - Functional & Scientific: Haskell, Elixir, R, Dart, SQL.
- **Dual Execution Engine Architecture**:
  - In-Browser Client Runner: Sandboxed Web Worker isolated execution for JavaScript and TypeScript with infinite loop and memory protection.
  - Pluggable Remote Execution Adapter: Out-of-the-box compatibility with Piston / Judge0 APIs and custom enterprise backends.
- **Interactive Code Playground & Console**:
  - Real-time syntax highlighting tokenizer for keywords, strings, comments, numbers, and functions.
  - Line numbers gutter with automatic row count recalculation.
  - Interactive Layout Selector (`Side-by-Side`, `Stacked`, `Editor Only`, `Output Only`).
  - Draggable Resizer Gutter with zero-dependency mouse and touch drag handles.
  - Live Web / HTML Preview iframe tab with bidirectional console log interception.
  - In-Browser Frontend Framework Compilers: Run React (JSX/TSX via Babel Standalone), Vue 3 (Composition API & SFC), Angular (Standalone Components with Signals), and Next.js (with simulated Next router & Link).
  - StackBlitz-Style Virtual File System (`VFS`): Multi-file project explorer sidebar, open file tabs, and in-browser module resolver linking components across files (`import Button from './Button'`).
  - Native Top-Level `await` Support: AsyncFunction execution in isolated Web Workers for asynchronous code and simulated network calls.
  - Instant In-Browser SQL Engine supporting `CREATE TABLE`, `INSERT`, and `SELECT` with formatted ASCII tables.
  - Smart Editor Ergonomics: Auto-indent on Enter, automatic bracket & quote pair completion (`()`, `{}`, `[]`, `""`, `''`, ````).
  - One-click Copy Code, Copy Output, and file download (`downloadCode()`).
  - Collapsible Standard Input (`stdin`) drawer.
  - Live terminal console capturing `stdout` and `stderr` streams with color coding.
- **Real-Time Execution Telemetry**:
  - Live duration counter in milliseconds (`⏱️ 42ms`).
  - Execution memory consumption estimation.
  - Process exit status code indicator (`Exit: 0`).
- **Scoped Design System & Theming**:
  - Fully scoped `.cpa-` CSS class naming with zero global style leakage.
  - Built-in Dark and Light themes with dynamic switching.
  - Fullscreen toggle mode.
- **Multi-Framework Official Adapters**:
  - React & Next.js: `<CompileAllComponent />` with `forwardRef` and SSR-safe execution.
  - Vue 3: `<CompileAllVue />` with Composition API and reactive watchers.
  - Angular: `<compile-all>` standalone component with inputs, outputs, and lifecycle teardown.
  - React Native: Mobile WebView bridge adapter.
- **Universal Dynamic Control & Get/Set API**:
  - Runtime methods: `run()`, `stop()`, `getCode()`, `setCode()`, `getLanguage()`, `setLanguage()`, `getLayout()`, `setLayout()`, `downloadCode()`, `show()`, `hide()`, `toggle()`.
  - Standalone tree-shakeable functional helper exports in root package.
  - Complete TypeScript declarations (`.d.ts`) across all subpaths.
- **Automated Native Test Suite**:
  - Built-in zero-dependency tests (`tests/engines.test.js`) verifying package exports, language detection, syntax highlighting, security, and get/set APIs.
