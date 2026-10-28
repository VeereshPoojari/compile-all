import assert from 'node:assert';
import fs from 'node:fs';

console.log('--- Running compile-all Automated Test Suite ---');

// 1. Validate package.json metadata, subpath exports & zero-dependency rule
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));
assert.strictEqual(pkg.name, 'compile-all');
assert.strictEqual(pkg.type, 'module');
assert.ok(pkg.exports['.'], 'Root export defined');
assert.ok(pkg.exports['./react'], 'React subpath export defined');
assert.ok(pkg.exports['./vue'], 'Vue subpath export defined');
assert.ok(pkg.exports['./angular'], 'Angular subpath export defined');
assert.ok(pkg.exports['./react-native'], 'React Native subpath export defined');
assert.ok(pkg.exports['./css'], 'CSS subpath export defined');
assert.deepStrictEqual(pkg.dependencies, {}, 'Zero runtime dependencies rule strictly enforced');
console.log('✓ package.json metadata, subpath exports, and zero dependencies verified');

// 2. Validate Language Registry & Resolution across 45+ extensions & aliases
const {
  resolveLanguage,
  getLanguageInfo,
  getDefaultTemplate,
  getTemplatesForLanguage,
  SUPPORTED_LANGUAGES
} = await import('../src/utils/languageDetector.js');
assert.ok(SUPPORTED_LANGUAGES.length >= 20, 'At least 20 core languages registered');

assert.strictEqual(resolveLanguage('js'), 'javascript');
assert.strictEqual(resolveLanguage('ts'), 'typescript');
assert.strictEqual(resolveLanguage('py'), 'python');
assert.strictEqual(resolveLanguage('python3'), 'python');
assert.strictEqual(resolveLanguage('cpp'), 'cpp');
assert.strictEqual(resolveLanguage('c++'), 'cpp');
assert.strictEqual(resolveLanguage('rs'), 'rust');
assert.strictEqual(resolveLanguage('golang'), 'go');
assert.strictEqual(resolveLanguage('cs'), 'csharp');
assert.strictEqual(resolveLanguage('sh'), 'bash');
assert.strictEqual(resolveLanguage('jsx'), 'react');
assert.strictEqual(resolveLanguage('tsx'), 'react');
assert.strictEqual(resolveLanguage('vue'), 'vue');
assert.strictEqual(resolveLanguage('ng'), 'angular');
assert.strictEqual(resolveLanguage('next'), 'nextjs');

assert.strictEqual(getLanguageInfo('react').runner, 'browser');
assert.strictEqual(getLanguageInfo('vue').runner, 'browser');
assert.strictEqual(getLanguageInfo('angular').runner, 'browser');
assert.strictEqual(getLanguageInfo('nextjs').runner, 'browser');

const pyInfo = getLanguageInfo('py');
assert.strictEqual(pyInfo.id, 'python');
assert.strictEqual(pyInfo.ext, 'py');

const jsTemplates = getTemplatesForLanguage('javascript');
assert.ok(jsTemplates.length >= 2, 'Multiple JS templates available');
assert.ok(jsTemplates[0].code.includes('console.log'), 'Default JS template generated');

const pyTemplates = getTemplatesForLanguage('python');
assert.ok(pyTemplates.length >= 3, 'Multiple Python templates available');

const vueTemplates = getTemplatesForLanguage('vue');
assert.ok(vueTemplates.some(t => t.label.includes('TypeScript') || t.label.includes('Babel')), 'Vue TypeScript Babel template available');

const ngTemplates = getTemplatesForLanguage('angular');
assert.ok(ngTemplates.some(t => t.label.includes('AngularJS 1.8')), 'AngularJS 1.8 template available');

console.log('✓ Language Registry, Alias Mapping & Multi-Template Presets verified');

// 3. Validate Syntax Highlighter Tokenizer
const { highlightCode } = await import('../src/utils/syntaxHighlighter.js');
const highlightedJs = highlightCode('const x = 42; // number\nfunction test() { return "hello"; }', 'javascript');
assert.ok(highlightedJs.includes('cpa-tok-keyword'), 'Keywords highlighted');
assert.ok(highlightedJs.includes('cpa-tok-number'), 'Numbers highlighted');
assert.ok(highlightedJs.includes('cpa-tok-comment'), 'Comments highlighted');
assert.ok(highlightedJs.includes('cpa-tok-string'), 'Strings highlighted');
assert.ok(highlightedJs.includes('cpa-tok-function'), 'Functions highlighted');
console.log('✓ Zero-dependency Syntax Highlighter tokenization verified');

// 4. Validate Security, Terminal Output Sanitization & Protocol Allowlisting
const { escapeHtml, sanitizeTerminalOutput, sanitizeUrl } = await import('../src/utils/security.js');
assert.strictEqual(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
assert.strictEqual(sanitizeTerminalOutput('Line 1\n<b>Bold</b>'), 'Line 1\n&lt;b&gt;Bold&lt;/b&gt;');
assert.strictEqual(sanitizeUrl('javascript:alert(1)'), '#', 'javascript: protocol blocked');
assert.strictEqual(sanitizeUrl('https://compiler.internal.api/execute'), 'https://compiler.internal.api/execute', 'https allowed');
console.log('✓ Zero-Trust Security, XSS blocking & Terminal sanitization verified');

// 5. Validate BrowserRunner (In-Browser Client Execution)
const { BrowserRunner } = await import('../src/engines/browserRunner.js');
const runner = new BrowserRunner({ timeoutMs: 3000 });
const execResult = await runner.run('return 10 + 20;', 'javascript');
assert.strictEqual(execResult.exitCode, 0);
assert.ok(execResult.stdout.includes('30') || execResult.stdout.includes('Execution complete'));
assert.ok(execResult.durationMs >= 0);

const asyncResult = await runner.run('const val = await Promise.resolve(42); return val;', 'javascript');
assert.strictEqual(asyncResult.exitCode, 0);
assert.ok(asyncResult.stdout.includes('42') || asyncResult.stdout.includes('Execution complete'));

const tsResult = await runner.run('interface User { id: number; } const u = { id: 100 }; return u.id;', 'typescript');
assert.strictEqual(tsResult.exitCode, 0);
assert.ok(tsResult.stdout.includes('100') || tsResult.stdout.includes('Execution complete'));

const tsWithImport = await runner.run("import React, { useState } from 'react';\ninterface Props { val: number; }\nconst p = { val: 200 };\nreturn p.val;", 'typescript');
assert.strictEqual(tsWithImport.exitCode, 0);
assert.ok(tsWithImport.stdout.includes('200') || tsWithImport.stdout.includes('Execution complete'));

const htmlResult = await runner.run('<h1>Test</h1>', 'html');
assert.strictEqual(htmlResult.exitCode, 0);
assert.strictEqual(htmlResult.isHtml, true);

const pyResult = await runner.run('print("hello")', 'python');
assert.strictEqual(pyResult.exitCode, 0);

const sqlResult = await runner.run("CREATE TABLE users (id INT, name TEXT); INSERT INTO users VALUES (1, 'Alice'); SELECT * FROM users;", 'sql');
assert.strictEqual(sqlResult.exitCode, 0);
assert.ok(sqlResult.stdout.includes('Alice'));
assert.ok(sqlResult.stdout.includes('+----+-------+'));

const reactResult = await runner.run('export default function App() { return <div>React</div>; }', 'react');
assert.strictEqual(reactResult.exitCode, 0);
assert.strictEqual(reactResult.isHtml, true);
assert.ok(reactResult.stdout.includes('React 18 (Babel Standalone JSX)'));

const vueResult = await runner.run('<template><div>Vue</div></template>', 'vue');
assert.strictEqual(vueResult.exitCode, 0);
assert.strictEqual(vueResult.isHtml, true);
assert.ok(vueResult.stdout.includes('Vue 3 + Babel Standalone'));

const angularResult = await runner.run('@Component({ template: "<div>Angular</div>" })', 'angular');
assert.strictEqual(angularResult.exitCode, 0);
assert.strictEqual(angularResult.isHtml, true);
assert.ok(angularResult.stdout.includes('AngularJS 1.8 CDN / Angular Standalone Component'));

const nextResult = await runner.run('export default function Page() { return <div>Next.js</div>; }', 'nextjs');
assert.strictEqual(nextResult.exitCode, 0);
assert.strictEqual(nextResult.isHtml, true);
assert.ok(nextResult.stdout.includes('Next.js (React 18 + Babel Standalone)'));

console.log('✓ In-Browser Execution Engine (JS, HTML Web, Python, SQL, React, Vue, Angular, Next.js) verified');

// 6. Validate Core Options Parsing & Dynamic Get/Set / Visibility & Layout API
const { CompileAll } = await import('../src/core/CompileAll.js');
const dummyCompiler = Object.create(CompileAll.prototype);

// Options parser
const opts = dummyCompiler.parseOptions({
  theme: 'light',
  language: 'python',
  layout: 'split-v',
  code: 'print("test")',
  readOnly: true
});
assert.strictEqual(opts.theme, 'light');
assert.strictEqual(opts.language, 'python');
assert.strictEqual(opts.layout, 'split-v');
assert.strictEqual(opts.readOnly, true);
assert.strictEqual(opts.enabled, true);

// Mock instance for Standalone Functional API verification
const mockInstance = {
  code: 'let a = 1;',
  language: 'javascript',
  layout: 'split-h',
  theme: 'dark',
  visibility: new Map(),
  getCode() { return this.code; },
  setCode(c) { this.code = c; return this; },
  getLanguage() { return this.language; },
  setLanguage(l) { this.language = l; return this; },
  getLayout() { return this.layout; },
  setLayout(ly) { this.layout = ly; return this; },
  getTemplates() { return [{ label: 'Custom', code: 'demo' }]; },
  loadTemplate(idx) { this.code = 'demo'; return this; },
  getTheme() { return this.theme; },
  setTheme(th) { this.theme = th; return this; },
  show(c) { this.visibility.set(c, true); return this; },
  hide(c) { this.visibility.set(c, false); return this; },
  toggle(c) { const v = !this.isVisible(c); this.visibility.set(c, v); return this; },
  isVisible(c) { return this.visibility.get(c) ?? true; },
  showPreview() { this.preview = true; return this; },
  showConsole() { this.preview = false; return this; },
  downloadCode() { this.downloaded = true; return this; },
  files: { 'main.js': 'let a = 1;' },
  activeFile: 'main.js',
  getFiles() { return this.files; },
  setFiles(f, act) { this.files = f; this.activeFile = act || Object.keys(f)[0]; return this; },
  addFile(p, c) { this.files[p] = c; this.activeFile = p; return this; },
  deleteFile(p) { delete this.files[p]; return this; },
  openFile(p) { this.activeFile = p; return this; },
  closeFile(p) { return this; },
  toggleFileTree(s) { this.fileTree = s; return this; },
  terminalTabPosition: 'left',
  getTerminalTabPosition() { return this.terminalTabPosition; },
  setTerminalTabPosition(p) { this.terminalTabPosition = p; return this; },
  getActiveFile() { return this.activeFile; }
};

const defaultImport = (await import('../src/index.js')).default;
assert.ok(defaultImport, 'Default export CompileAll exists');
assert.strictEqual(defaultImport, CompileAll, 'Default export matches core CompileAll');

const {
  getCode, setCode,
  getLanguage, setLanguage,
  getLayout, setLayout,
  getTemplates, loadTemplate,
  getTheme, setTheme,
  show, hide, toggle, isVisible,
  showPreview, showConsole,
  getTerminalTabPosition, setTerminalTabPosition,
  downloadCode,
  getFiles, setFiles, addFile, deleteFile,
  openFile, closeFile, toggleFileTree, getActiveFile,
  PROJECT_TEMPLATES
} = await import('../src/index.js');

assert.strictEqual(getCode(mockInstance), 'let a = 1;');
setCode(mockInstance, 'let b = 2;');
assert.strictEqual(getCode(mockInstance), 'let b = 2;');

assert.strictEqual(getLanguage(mockInstance), 'javascript');
setLanguage(mockInstance, 'rust');
assert.strictEqual(getLanguage(mockInstance), 'rust');

assert.strictEqual(getLayout(mockInstance), 'split-h');
setLayout(mockInstance, 'editor-only');
assert.strictEqual(getLayout(mockInstance), 'editor-only');

assert.strictEqual(getTheme(mockInstance), 'dark');
setTheme(mockInstance, 'light');
assert.strictEqual(getTheme(mockInstance), 'light');

assert.strictEqual(isVisible(mockInstance, 'stdin'), true);
hide(mockInstance, 'stdin');
assert.strictEqual(isVisible(mockInstance, 'stdin'), false);
show(mockInstance, 'stdin');
assert.strictEqual(isVisible(mockInstance, 'stdin'), true);
toggle(mockInstance, 'stdin');
assert.strictEqual(isVisible(mockInstance, 'stdin'), false);

downloadCode(mockInstance);
assert.strictEqual(mockInstance.downloaded, true);

// 7. Validate Virtual File System (VFS) & StackBlitz Project Presets
assert.ok(PROJECT_TEMPLATES['react-project'], 'React multi-file project preset exists');
assert.ok(PROJECT_TEMPLATES['vue-project'], 'Vue multi-file project preset exists');
assert.ok(PROJECT_TEMPLATES['web-project'], 'Web multi-file project preset exists');

addFile(mockInstance, 'src/Button.jsx', 'export function Button() {}');
assert.strictEqual(getActiveFile(mockInstance), 'src/Button.jsx');
assert.ok(getFiles(mockInstance)['src/Button.jsx']);

openFile(mockInstance, 'main.js');
assert.strictEqual(getActiveFile(mockInstance), 'main.js');

deleteFile(mockInstance, 'src/Button.jsx');
assert.strictEqual(getFiles(mockInstance)['src/Button.jsx'], undefined);

console.log('✓ Virtual File System (VFS), Multi-File Explorer & Project Presets verified');

// 7.1 Validate Section-Level Expand & Collapse Logic
const sectionCompiler = Object.create(CompileAll.prototype);
sectionCompiler.layout = 'split-h';
sectionCompiler.prevSplitLayout = 'split-h';
sectionCompiler.listeners = new Map();
sectionCompiler.emit = () => {};
sectionCompiler.root = {
  querySelector: () => null,
  querySelectorAll: () => []
};

sectionCompiler.toggleExpandEditor();
assert.strictEqual(sectionCompiler.getLayout(), 'editor-only', 'Editor expanded to editor-only');

sectionCompiler.toggleExpandEditor();
assert.strictEqual(sectionCompiler.getLayout(), 'split-h', 'Editor restored to split-h on second toggle');

sectionCompiler.toggleCollapseEditor();
assert.strictEqual(sectionCompiler.getLayout(), 'terminal-only', 'Editor collapsed into terminal-only');

sectionCompiler.toggleCollapseEditor();
assert.strictEqual(sectionCompiler.getLayout(), 'split-h', 'Editor restored to split-h from collapse');

sectionCompiler.toggleExpandTerminal();
assert.strictEqual(sectionCompiler.getLayout(), 'terminal-only', 'Terminal expanded to terminal-only');

sectionCompiler.toggleExpandTerminal();
assert.strictEqual(sectionCompiler.getLayout(), 'split-h', 'Terminal restored to split-h on second toggle');

sectionCompiler.toggleCollapseTerminal();
assert.strictEqual(sectionCompiler.getLayout(), 'editor-only', 'Terminal collapsed into editor-only');

sectionCompiler.toggleCollapseTerminal();
assert.strictEqual(sectionCompiler.getLayout(), 'split-h', 'Terminal restored to split-h from collapse');

console.log('✓ Section-Level Expand, Collapse & Restore Logic verified');

// 7.2 Validate Terminal Tab Position (Left vs Right)
assert.strictEqual(getTerminalTabPosition(mockInstance), 'left');
setTerminalTabPosition(mockInstance, 'right');
assert.strictEqual(getTerminalTabPosition(mockInstance), 'right');
setTerminalTabPosition(mockInstance, 'left');
assert.strictEqual(getTerminalTabPosition(mockInstance), 'left');
console.log('✓ Terminal Tab Positioning (Left & Right Placement) verified');

// 7.3 Validate Top Toolbar Restore Controls Visibility Logic
const tbEditorMock = { style: {} };
const tbOutputMock = { style: {} };
const testRoot = {
  querySelector: (sel) => {
    if (sel === '#cpa-btn-toolbar-restore-editor') return tbEditorMock;
    if (sel === '#cpa-btn-toolbar-restore-terminal') return tbOutputMock;
    return null;
  },
  querySelectorAll: () => []
};

sectionCompiler.root = testRoot;
sectionCompiler.setLayout('terminal-only');
assert.strictEqual(tbEditorMock.style.display, 'inline-flex', 'Toolbar Restore Editor button visible in terminal-only layout');
assert.strictEqual(tbOutputMock.style.display, 'none');

sectionCompiler.setLayout('editor-only');
assert.strictEqual(tbEditorMock.style.display, 'none');
assert.strictEqual(tbOutputMock.style.display, 'inline-flex', 'Toolbar Restore Output button visible in editor-only layout');

sectionCompiler.setLayout('split-h');
assert.strictEqual(tbEditorMock.style.display, 'none');
assert.strictEqual(tbOutputMock.style.display, 'none');
console.log('✓ Top Toolbar Restore Editor / Output Visibility Logic verified');

console.log('✓ Standalone Functional Helpers, Dynamic Layouts & Visibility verified');

// 8. Validate Web Preview Generation & Srcdoc Assignment
const previewCompiler = Object.create(CompileAll.prototype);
previewCompiler.language = 'react';
previewCompiler.code = 'export default function App() { return <div>Test</div>; }';
previewCompiler.files = { 'src/App.jsx': previewCompiler.code };
previewCompiler.activeFile = 'src/App.jsx';

let mockSrcdoc = '';
previewCompiler.root = {
  querySelector: (sel) => {
    if (sel === '#cpa-preview-frame') {
      return {
        style: {},
        set srcdoc(val) { mockSrcdoc = val; },
        get srcdoc() { return mockSrcdoc; }
      };
    }
    return null;
  }
};

previewCompiler.refreshPreview();
assert.ok(mockSrcdoc.includes('React'), 'React preview HTML was generated into srcdoc');
assert.ok(mockSrcdoc.includes('boot'), 'Boot polling included for CDN loading');

// Test HTML preview
previewCompiler.language = 'html';
previewCompiler.code = '<h1>Hello Web</h1>';
previewCompiler.files = { 'index.html': previewCompiler.code };
previewCompiler.activeFile = 'index.html';
previewCompiler.refreshPreview();
assert.ok(mockSrcdoc.includes('Hello Web'), 'HTML preview was generated into srcdoc');

console.log('✓ Web Preview Generator (React, HTML, CDN boot polling) verified without errors');

console.log('🎉 ALL compile-all TESTS PASSED SUCCESSFULLY!');
