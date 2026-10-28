/**
 * compile-all - Master Core Engine & State Machine
 * Prefix: .cpa-
 * Zero external runtime dependencies
 * 100% Width & Height Responsive with Multi-Layout & Starter Templates
 */
import {
  resolveLanguage,
  getLanguageInfo,
  getDefaultTemplate,
  getTemplatesForLanguage,
  SUPPORTED_LANGUAGES
} from '../utils/languageDetector.js';
import { highlightCode } from '../utils/syntaxHighlighter.js';
import { escapeHtml } from '../utils/security.js';
import { BrowserRunner } from '../engines/browserRunner.js';
import { RemoteRunner } from '../engines/remoteRunner.js';
import { PROJECT_TEMPLATES } from '../utils/projectTemplates.js';

export class CompileAll {
  constructor(targetElement, options = {}) {
    this.target = typeof targetElement === 'string'
      ? document.querySelector(targetElement)
      : targetElement;

    if (!this.target) {
      throw new Error(`[CompileAll] Target container element not found.`);
    }

    this.options = this.parseOptions(options);
    this.theme = this.options.theme || 'dark';
    this.language = resolveLanguage(this.options.language || 'javascript');
    this.layout = this.options.layout || 'split-h'; // split-h | split-v | editor-only | terminal-only
    this.prevSplitLayout = ['split-h', 'split-v'].includes(this.layout) ? this.layout : 'split-h';
    this.code = this.options.code !== undefined ? this.options.code : getDefaultTemplate(this.language);
    this.terminalTabPosition = this.options.terminalTabPosition || 'left';
    this.stdin = this.options.stdin || '';
    this.status = 'idle'; // idle | compiling | running | success | error | stopped
    this.telemetry = { durationMs: 0, memoryKb: 0, exitCode: 0 };
    this.visibility = new Map();
    this.listeners = new Map();
    this.eventCallbacks = new Map();

    // Virtual File System (VFS) & StackBlitz-style Multi-File state
    const langInfo = getLanguageInfo(this.language);
    const defaultFileName = `main.${langInfo.ext || 'js'}`;

    if (this.options.files && typeof this.options.files === 'object' && Object.keys(this.options.files).length > 0) {
      this.files = { ...this.options.files };
      const fileKeys = Object.keys(this.files);
      this.activeFile = this.options.activeFile && this.files[this.options.activeFile] !== undefined
        ? this.options.activeFile
        : fileKeys[0];
      this.code = this.files[this.activeFile] || '';
      this.openFiles = [...fileKeys];
      this.fileTreeVisible = this.options.fileTree !== false;
    } else {
      this.files = { [defaultFileName]: this.code };
      this.activeFile = defaultFileName;
      this.openFiles = [defaultFileName];
      this.fileTreeVisible = Boolean(this.options.fileTree);
    }

    // Instantiate execution runners
    this.browserRunner = new BrowserRunner({ timeoutMs: this.options.timeoutMs });
    this.remoteRunner = new RemoteRunner({
      endpoint: this.options.endpoint,
      timeoutMs: this.options.timeoutMs
    });

    this.root = null;
    this.init();
  }

  parseOptions(opts) {
    const isExplicitFalse = opts === false;
    const optObj = (typeof opts === 'object' && opts !== null) ? opts : {};
    return {
      enabled: isExplicitFalse ? false : (optObj.enabled !== false),
      theme: optObj.theme === 'light' ? 'light' : 'dark',
      language: optObj.language || 'javascript',
      layout: ['split-h', 'split-v', 'editor-only', 'terminal-only'].includes(optObj.layout) ? optObj.layout : 'split-h',
      terminalTabPosition: optObj.terminalTabPosition === 'right' ? 'right' : 'left',
      code: optObj.code,
      stdin: optObj.stdin || '',
      readOnly: Boolean(optObj.readOnly),
      toolbar: optObj.toolbar !== false,
      templateSelect: optObj.templateSelect !== false,
      layoutSwitch: optObj.layoutSwitch !== false,
      stdinDrawer: optObj.stdinDrawer !== false,
      telemetry: optObj.telemetry !== false,
      endpoint: optObj.endpoint || null,
      timeoutMs: optObj.timeoutMs || 10000,
      onRunStart: typeof optObj.onRunStart === 'function' ? optObj.onRunStart : null,
      onRunEnd: typeof optObj.onRunEnd === 'function' ? optObj.onRunEnd : null,
      onStateChange: typeof optObj.onStateChange === 'function' ? optObj.onStateChange : null,
      onError: typeof optObj.onError === 'function' ? optObj.onError : null,
      ...optObj
    };
  }

  init() {
    this.root = document.createElement('div');
    this.root.className = 'cpa-container';
    this.root.setAttribute('data-theme', this.theme);
    this.target.appendChild(this.root);

    this.render();
  }

  render() {
    if (!this.root) return;

    const langInfo = getLanguageInfo(this.language);
    const lineCount = (this.code.match(/\n/g) || []).length + 1;
    const lineNumbersHtml = Array.from({ length: lineCount }, (_, i) => `<div class="cpa-line-num">${i + 1}</div>`).join('');

    const langOptionsHtml = SUPPORTED_LANGUAGES.map(l => 
      `<option value="${l.id}" ${l.id === this.language ? 'selected' : ''}>${l.name}</option>`
    ).join('');

    this.root.innerHTML = `
      <!-- Header Toolbar -->
      <div class="cpa-toolbar" data-component="toolbar">
        <!-- Left Zone: Brand & Language Setup -->
        <div class="cpa-toolbar-left">
          <div class="cpa-brand">
            <span class="cpa-brand-icon">⚡</span>
            <span class="cpa-brand-text">compile-all</span>
          </div>

          <!-- Files Explorer Toggle -->
          <button class="cpa-btn ${this.fileTreeVisible ? 'active' : ''}" id="cpa-btn-files-toggle" title="Toggle File Explorer (Multi-File Project Mode)">📁 Files</button>

          <!-- Language Selector -->
          <select class="cpa-select" id="cpa-lang-select" aria-label="Select Programming Language" title="Change Language">
            ${langOptionsHtml}
          </select>
        </div>

        <!-- Center Zone: Execution Controls -->
        <div class="cpa-toolbar-center">
          <!-- Run / Stop / Clear Buttons -->
          <button class="cpa-btn cpa-btn-run" id="cpa-btn-run" title="Run Code (Ctrl + Enter)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            <span>Run</span>
            <kbd class="cpa-kbd">Ctrl+↵</kbd>
          </button>
          <button class="cpa-btn cpa-btn-stop" id="cpa-btn-stop" title="Stop Execution" style="display: none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>
            <span>Stop</span>
          </button>
          <button class="cpa-btn" id="cpa-btn-clear" title="Clear Console Output">Clear</button>
        </div>

        <!-- Right Zone: Layout & Tools -->
        <div class="cpa-toolbar-right">
          <!-- Restore Editor / Output Buttons in Top Toolbar with Icons -->
          <button class="cpa-btn cpa-btn-toolbar-restore" id="cpa-btn-toolbar-restore-editor" title="Restore Editor Split View" style="${this.layout === 'terminal-only' ? 'display: inline-flex;' : 'display: none;'}">
            <span class="cpa-btn-icon-symbol">▣</span>
            <span>Restore Editor</span>
          </button>
          <button class="cpa-btn cpa-btn-toolbar-restore" id="cpa-btn-toolbar-restore-terminal" title="Restore Output Split View" style="${this.layout === 'editor-only' ? 'display: inline-flex;' : 'display: none;'}">
            <span class="cpa-btn-icon-symbol">▤</span>
            <span>Restore Output</span>
          </button>

          <!-- Segmented Layout Switcher -->
          <div class="cpa-layout-group" role="group" aria-label="Layout Modes">
            <button class="cpa-btn-layout ${this.layout === 'split-h' ? 'active' : ''}" id="cpa-btn-layout-split-h" data-layout="split-h" title="Split Horizontal (Side-by-Side)">◫ Side</button>
            <button class="cpa-btn-layout ${this.layout === 'split-v' ? 'active' : ''}" id="cpa-btn-layout-split-v" data-layout="split-v" title="Split Vertical (Stacked)">⬒ Stack</button>
            <button class="cpa-btn-layout ${this.layout === 'editor-only' ? 'active' : ''}" id="cpa-btn-layout-editor-only" data-layout="editor-only" title="Editor Only (Focus Mode)">▣ Code</button>
            <button class="cpa-btn-layout ${this.layout === 'terminal-only' ? 'active' : ''}" id="cpa-btn-layout-terminal-only" data-layout="terminal-only" title="Output Only (Preview/Console Mode)">▤ Run</button>
          </div>

          <div class="cpa-divider"></div>

          <!-- Stdin Drawer Toggle -->
          <button class="cpa-btn" id="cpa-btn-stdin-toggle" title="Toggle Standard Input (stdin)">⌨ stdin</button>

          <!-- Theme Toggle -->
          <button class="cpa-btn" id="cpa-btn-theme" title="Toggle Theme">${this.theme === 'dark' ? '☀️' : '🌙'}</button>

          <!-- Fullscreen -->
          <button class="cpa-btn" id="cpa-btn-fullscreen" title="Fullscreen">⛶</button>
        </div>
      </div>

      <!-- Main Workspace with Dynamic Layout Mode -->
      <div class="cpa-workspace cpa-layout-${this.layout}" id="cpa-workspace">
        <!-- File Explorer Sidebar (StackBlitz Style) -->
        <div class="cpa-file-sidebar" id="cpa-file-sidebar" style="${this.fileTreeVisible ? '' : 'display: none;'}">
          <div class="cpa-file-sidebar-header">
            <span>📁 Explorer</span>
            <div class="cpa-file-sidebar-actions">
              <button class="cpa-btn-icon" id="cpa-btn-new-file" title="New File">➕</button>
              <button class="cpa-btn-icon" id="cpa-btn-collapse-explorer" title="Collapse Explorer">◀</button>
            </div>
          </div>
          <!-- Inline New File Creation Box (Downside of the New File Icon) -->
          <div class="cpa-new-file-box" id="cpa-new-file-box" style="display: none;">
            <div class="cpa-new-file-row">
              <span class="cpa-new-file-icon">📄</span>
              <input type="text" class="cpa-new-file-input" id="cpa-new-file-input" placeholder="filename.js (Enter)" spellcheck="false" autocomplete="off" />
              <button class="cpa-btn-icon cpa-new-file-confirm" id="cpa-btn-confirm-new-file" type="button" title="Create File (Enter)">✓</button>
              <button class="cpa-btn-icon cpa-new-file-cancel" id="cpa-btn-cancel-new-file" type="button" title="Cancel (Esc)">✕</button>
            </div>
            <div class="cpa-new-file-hint" id="cpa-new-file-hint" style="display: none;"></div>
          </div>
          <div class="cpa-file-tree" id="cpa-file-tree"></div>
        </div>

        <!-- Editor Pane -->
        <div class="cpa-editor-pane" data-component="editor" id="cpa-editor-pane">
          <!-- Multi-File Editor Tabs and Actions Header Bar -->
          <div class="cpa-editor-header" id="cpa-editor-header" title="Double click to Maximize / Restore">
            <div class="cpa-editor-tabs" id="cpa-editor-tabs"></div>
            <div class="cpa-editor-actions">
              <span id="cpa-editor-filename">${escapeHtml(this.activeFile)}</span>
              <span class="cpa-char-count" id="cpa-char-count">${this.code.length} chars</span>
              <button class="cpa-btn-pane-ctrl" id="cpa-btn-copy-code" title="Copy Code to Clipboard">📋</button>
              <button class="cpa-btn-pane-ctrl" id="cpa-btn-download-code" title="Download Source File">💾</button>
              <div class="cpa-divider-v"></div>
              <button class="cpa-btn-pane-ctrl" id="cpa-btn-collapse-editor" title="Collapse Editor (Minimize)">⎯</button>
              <button class="cpa-btn-pane-ctrl" id="cpa-btn-expand-editor" title="${this.layout === 'editor-only' ? 'Restore Split View' : 'Maximize Editor'}">${this.layout === 'editor-only' ? '◫' : '⤢'}</button>
            </div>
          </div>
          <div class="cpa-editor-body">
            <div class="cpa-line-numbers" id="cpa-line-numbers" data-component="lineNumbers">${lineNumbersHtml}</div>
            <div class="cpa-code-wrapper">
              <pre class="cpa-code-highlight" id="cpa-code-highlight" aria-hidden="true">${highlightCode(this.code, this.language)}</pre>
              <textarea class="cpa-code-input" id="cpa-code-input" spellcheck="false" ${this.options.readOnly ? 'readonly' : ''}>${escapeHtml(this.code)}</textarea>
            </div>
          </div>
          <!-- Collapsible Stdin Drawer -->
          <div class="cpa-stdin-drawer" id="cpa-stdin-drawer" data-component="stdin" style="display: none;">
            <div class="cpa-stdin-label">Program Input (stdin):</div>
            <textarea class="cpa-stdin-input" id="cpa-stdin-input" placeholder="Type input passed to your program here...">${escapeHtml(this.stdin)}</textarea>
          </div>
          <!-- Restore Output Strip (shown when Output/Terminal is collapsed) -->
          <div class="cpa-restore-strip" id="cpa-restore-terminal" style="${this.layout === 'editor-only' ? 'display: flex;' : 'display: none;'}" title="Restore Output Pane">
            <button class="cpa-restore-btn" id="cpa-btn-restore-terminal" type="button"><span class="cpa-btn-icon-symbol">▤</span> Restore Output</button>
          </div>
        </div>

        <!-- Draggable Resizer Gutter (Zero-dependency split divider) -->
        <div class="cpa-gutter" id="cpa-gutter" role="separator" aria-orientation="vertical" title="Drag to resize panes">
          <div class="cpa-gutter-handle"></div>
        </div>

        <!-- Terminal / Live Web Preview Pane -->
        <div class="cpa-terminal-pane" data-component="terminal" id="cpa-terminal-pane">
          <!-- Restore Editor Strip (shown when Editor is collapsed) -->
          <div class="cpa-restore-strip" id="cpa-restore-editor" style="${this.layout === 'terminal-only' ? 'display: flex;' : 'display: none;'}" title="Restore Editor Pane">
            <button class="cpa-restore-btn" id="cpa-btn-restore-editor" type="button"><span class="cpa-btn-icon-symbol">▣</span> Restore Editor</button>
          </div>
          <div class="cpa-terminal-header ${this.terminalTabPosition === 'right' ? 'cpa-tabs-right' : ''}" id="cpa-terminal-header" title="Double click to Maximize / Restore">
            ${this.terminalTabPosition === 'right' ? `
              <div class="cpa-terminal-status" id="cpa-terminal-status" title="Execution Status">
                <span class="cpa-status-dot" id="cpa-status-dot"></span>
                <span id="cpa-status-text">Ready</span>
              </div>
              <div class="cpa-terminal-actions">
                <div class="cpa-terminal-tabs" id="cpa-terminal-tabs">
                  <button class="cpa-tab-btn active" id="cpa-tab-console" type="button" title="View Console Output">💻 Console</button>
                  <button class="cpa-tab-btn" id="cpa-tab-preview" type="button" title="View Live Webpage Preview">🌐 Web Preview</button>
                </div>
                <div class="cpa-divider-v"></div>
                <button class="cpa-btn-pane-ctrl" id="cpa-btn-copy-output" title="Copy Console Output">📋</button>
                <button class="cpa-btn-pane-ctrl" id="cpa-btn-clear-term" title="Clear Console Output">🧹</button>
                <div class="cpa-divider-v"></div>
                <button class="cpa-btn-pane-ctrl" id="cpa-btn-collapse-terminal" title="Collapse Output (Minimize)">⎯</button>
                <button class="cpa-btn-pane-ctrl" id="cpa-btn-expand-terminal" title="${this.layout === 'terminal-only' ? 'Restore Split View' : 'Maximize Output'}">${this.layout === 'terminal-only' ? '◫' : '⤢'}</button>
              </div>
            ` : `
              <!-- Tabs docked cleanly on the Left (Matching Editor Tabs) -->
              <div class="cpa-terminal-tabs" id="cpa-terminal-tabs">
                <button class="cpa-tab-btn active" id="cpa-tab-console" type="button" title="View Console Output">💻 Console</button>
                <button class="cpa-tab-btn" id="cpa-tab-preview" type="button" title="View Live Webpage Preview">🌐 Web Preview</button>
              </div>
              <div class="cpa-terminal-actions">
                <div class="cpa-terminal-status" id="cpa-terminal-status" title="Execution Status">
                  <span class="cpa-status-dot" id="cpa-status-dot"></span>
                  <span id="cpa-status-text">Ready</span>
                </div>
                <div class="cpa-divider-v"></div>
                <button class="cpa-btn-pane-ctrl" id="cpa-btn-copy-output" title="Copy Console Output">📋</button>
                <button class="cpa-btn-pane-ctrl" id="cpa-btn-clear-term" title="Clear Console Output">🧹</button>
                <div class="cpa-divider-v"></div>
                <button class="cpa-btn-pane-ctrl" id="cpa-btn-collapse-terminal" title="Collapse Output (Minimize)">⎯</button>
                <button class="cpa-btn-pane-ctrl" id="cpa-btn-expand-terminal" title="${this.layout === 'terminal-only' ? 'Restore Split View' : 'Maximize Output'}">${this.layout === 'terminal-only' ? '◫' : '⤢'}</button>
              </div>
            `}
          </div>
          <div class="cpa-terminal-body" id="cpa-terminal-body">
            <span class="cpa-term-info">// Press 'Run' to compile and execute ${langInfo.name} code.</span>
          </div>
          <iframe class="cpa-preview-frame" id="cpa-preview-frame" style="display: none;"></iframe>
        </div>
      </div>

      <!-- Telemetry Footer Bar -->
      <div class="cpa-telemetry-bar" data-component="telemetry">
        <div class="cpa-telemetry-badge" id="cpa-badge-status">Status: Idle</div>
        <div style="display: flex; gap: 8px;">
          <div class="cpa-telemetry-badge" id="cpa-badge-time">⏱️ 0ms</div>
          <div class="cpa-telemetry-badge" id="cpa-badge-exit">Exit: 0</div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const codeInput = this.root.querySelector('#cpa-code-input');
    const codeHighlight = this.root.querySelector('#cpa-code-highlight');
    const lineNumbers = this.root.querySelector('#cpa-line-numbers');
    const charCount = this.root.querySelector('#cpa-char-count');
    const langSelect = this.root.querySelector('#cpa-lang-select');
    const btnRun = this.root.querySelector('#cpa-btn-run');
    const btnStop = this.root.querySelector('#cpa-btn-stop');
    const btnClear = this.root.querySelector('#cpa-btn-clear');
    const btnStdin = this.root.querySelector('#cpa-btn-stdin-toggle');
    const btnTheme = this.root.querySelector('#cpa-btn-theme');
    const btnFullscreen = this.root.querySelector('#cpa-btn-fullscreen');
    const stdinInput = this.root.querySelector('#cpa-stdin-input');

    // Code input typing & syntax sync
    if (codeInput) {
      codeInput.oninput = () => {
        this.code = codeInput.value;
        if (this.activeFile) {
          this.files[this.activeFile] = this.code;
        }
        if (codeHighlight) codeHighlight.innerHTML = highlightCode(this.code, this.language);
        if (charCount) charCount.textContent = `${this.code.length} chars`;

        const lines = (this.code.match(/\n/g) || []).length + 1;
        if (lineNumbers) {
          lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `<div class="cpa-line-num">${i + 1}</div>`).join('');
        }
        if (this.previewDebounceTimer) clearTimeout(this.previewDebounceTimer);
        const previewFrame = this.root?.querySelector('#cpa-preview-frame');
        if (previewFrame && previewFrame.style.display !== 'none') {
          this.previewDebounceTimer = setTimeout(() => {
            this.refreshPreview();
          }, 350);
        }
        this.emit('codeChange', this.code);
      };

      // Synchronize editor scroll between textarea and syntax highlight layer
      codeInput.onscroll = () => {
        if (codeHighlight) {
          codeHighlight.scrollTop = codeInput.scrollTop;
          codeHighlight.scrollLeft = codeInput.scrollLeft;
        }
        if (lineNumbers) {
          lineNumbers.scrollTop = codeInput.scrollTop;
        }
      };

      // Keyboard shortcuts: Tab key support, Auto-indent on Enter, Bracket pair auto-closing & Ctrl+Enter to Run
      codeInput.onkeydown = (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = codeInput.selectionStart;
          const end = codeInput.selectionEnd;
          codeInput.value = codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end);
          codeInput.selectionStart = codeInput.selectionEnd = start + 2;
          codeInput.oninput();
        } else if (e.key === 'Enter') {
          const start = codeInput.selectionStart;
          const val = codeInput.value;
          const lineStart = val.lastIndexOf('\n', start - 1) + 1;
          const currentLine = val.substring(lineStart, start);
          const match = currentLine.match(/^(\s+)/);
          let indent = match ? match[1] : '';
          if (/[{\[:(]\s*$/.test(currentLine)) {
            indent += '  ';
          }
          if (indent.length > 0) {
            e.preventDefault();
            const insert = '\n' + indent;
            codeInput.value = val.substring(0, start) + insert + val.substring(codeInput.selectionEnd);
            codeInput.selectionStart = codeInput.selectionEnd = start + insert.length;
            codeInput.oninput();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          this.run();
        } else {
          // Bracket & Quote Auto-Close Pair
          const pairs = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'", '`': '`' };
          if (pairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            const val = codeInput.value;
            if (start !== end) {
              e.preventDefault();
              const selected = val.substring(start, end);
              const wrapped = e.key + selected + pairs[e.key];
              codeInput.value = val.substring(0, start) + wrapped + val.substring(end);
              codeInput.selectionStart = start + 1;
              codeInput.selectionEnd = end + 1;
              codeInput.oninput();
            } else {
              const nextChar = val.charAt(start);
              if (!nextChar || /\s|[)\]},;]/.test(nextChar)) {
                e.preventDefault();
                const insert = e.key + pairs[e.key];
                codeInput.value = val.substring(0, start) + insert + val.substring(end);
                codeInput.selectionStart = codeInput.selectionEnd = start + 1;
                codeInput.oninput();
              }
            }
          }
        }
      };
    }

    if (langSelect) {
      langSelect.onchange = () => {
        this.setLanguage(langSelect.value);
      };
    }

    // Segmented Workspace Layout Buttons
    this.root.querySelectorAll('.cpa-btn-layout').forEach(btn => {
      btn.onclick = () => {
        const targetLayout = btn.getAttribute('data-layout');
        if (targetLayout) this.setLayout(targetLayout);
      };
    });

    // Draggable Splitter Implementation (Zero runtime dependencies)
    const gutter = this.root.querySelector('#cpa-gutter');
    const workspace = this.root.querySelector('#cpa-workspace');
    const editorPane = this.root.querySelector('.cpa-editor-pane');
    const terminalPane = this.root.querySelector('.cpa-terminal-pane');
    const previewFrame = this.root.querySelector('#cpa-preview-frame');

    if (gutter && workspace && editorPane && terminalPane) {
      let isDragging = false;

      const onDragStart = (e) => {
        if (this.layout === 'editor-only' || this.layout === 'terminal-only') return;
        isDragging = true;
        document.body.style.cursor = this.layout === 'split-v' ? 'row-resize' : 'col-resize';
        document.body.style.userSelect = 'none';
        gutter.classList.add('cpa-gutter-active');
        if (previewFrame) previewFrame.style.pointerEvents = 'none';
      };

      const onDragMove = (e) => {
        if (!isDragging) return;
        const rect = workspace.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (this.layout === 'split-h') {
          const offsetX = clientX - rect.left;
          let percent = (offsetX / rect.width) * 100;
          percent = Math.max(15, Math.min(85, percent));
          editorPane.style.flex = `0 0 ${percent}%`;
          terminalPane.style.flex = `0 0 ${100 - percent}%`;
        } else if (this.layout === 'split-v') {
          const offsetY = clientY - rect.top;
          let percent = (offsetY / rect.height) * 100;
          percent = Math.max(15, Math.min(85, percent));
          editorPane.style.flex = `0 0 ${percent}%`;
          terminalPane.style.flex = `0 0 ${100 - percent}%`;
        }
      };

      const onDragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        gutter.classList.remove('cpa-gutter-active');
        if (previewFrame) previewFrame.style.pointerEvents = '';
      };

      gutter.addEventListener('mousedown', onDragStart);
      gutter.addEventListener('touchstart', onDragStart, { passive: true });
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('touchmove', onDragMove, { passive: true });
      window.addEventListener('mouseup', onDragEnd);
      window.addEventListener('touchend', onDragEnd);
      window.addEventListener('touchcancel', onDragEnd);
    }

    if (btnRun) btnRun.onclick = () => this.run();
    if (btnStop) btnStop.onclick = () => this.stop();
    if (btnClear) btnClear.onclick = () => this.clearOutput();
    if (btnStdin) {
      btnStdin.onclick = () => {
        this.toggle('stdin');
      };
    }
    if (btnTheme) btnTheme.onclick = () => this.toggleTheme();
    if (btnFullscreen) btnFullscreen.onclick = () => this.toggleFullscreen();

    // Console vs Web Preview Tabs
    const tabConsole = this.root.querySelector('#cpa-tab-console');
    const tabPreview = this.root.querySelector('#cpa-tab-preview');
    if (tabConsole) tabConsole.onclick = () => this.showConsole();
    if (tabPreview) tabPreview.onclick = () => this.showPreview();

    // Editor Action Buttons: Copy Code & Download File
    const btnCopyCode = this.root.querySelector('#cpa-btn-copy-code');
    if (btnCopyCode) {
      btnCopyCode.onclick = () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(this.code);
          btnCopyCode.textContent = '✓';
          setTimeout(() => { btnCopyCode.textContent = '📋'; }, 1400);
        }
      };
    }

    const btnDownloadCode = this.root.querySelector('#cpa-btn-download-code');
    if (btnDownloadCode) {
      btnDownloadCode.onclick = () => this.downloadCode();
    }

    // Section Expand / Collapse / Restore Controls: Editor
    const btnCollapseEditor = this.root.querySelector('#cpa-btn-collapse-editor');
    if (btnCollapseEditor) {
      btnCollapseEditor.onclick = (e) => {
        e.stopPropagation();
        this.toggleCollapseEditor();
      };
    }

    const btnExpandEditor = this.root.querySelector('#cpa-btn-expand-editor');
    if (btnExpandEditor) {
      btnExpandEditor.onclick = (e) => {
        e.stopPropagation();
        this.toggleExpandEditor();
      };
    }

    const btnRestoreEditor = this.root.querySelector('#cpa-btn-restore-editor');
    if (btnRestoreEditor) {
      btnRestoreEditor.onclick = () => this.setLayout(this.prevSplitLayout || 'split-h');
    }

    const editorHeader = this.root.querySelector('#cpa-editor-header');
    if (editorHeader) {
      editorHeader.ondblclick = (e) => {
        if (e.target.closest('button') || e.target.closest('.cpa-editor-tab')) return;
        this.toggleExpandEditor();
      };
    }

    // Section Expand / Collapse / Restore Controls: Terminal / Preview
    const btnCollapseTerminal = this.root.querySelector('#cpa-btn-collapse-terminal');
    if (btnCollapseTerminal) {
      btnCollapseTerminal.onclick = (e) => {
        e.stopPropagation();
        this.toggleCollapseTerminal();
      };
    }

    const btnExpandTerminal = this.root.querySelector('#cpa-btn-expand-terminal');
    if (btnExpandTerminal) {
      btnExpandTerminal.onclick = (e) => {
        e.stopPropagation();
        this.toggleExpandTerminal();
      };
    }

    const btnRestoreTerminal = this.root.querySelector('#cpa-btn-restore-terminal');
    if (btnRestoreTerminal) {
      btnRestoreTerminal.onclick = () => this.setLayout(this.prevSplitLayout || 'split-h');
    }

    const termHeader = this.root.querySelector('#cpa-terminal-header');
    if (termHeader) {
      termHeader.ondblclick = (e) => {
        if (e.target.closest('button') || e.target.closest('.cpa-tab-btn')) return;
        this.toggleExpandTerminal();
      };
    }

    const btnClearTerm = this.root.querySelector('#cpa-btn-clear-term');
    if (btnClearTerm) {
      btnClearTerm.onclick = () => this.clearOutput();
    }

    const btnCollapseExplorer = this.root.querySelector('#cpa-btn-collapse-explorer');
    if (btnCollapseExplorer) {
      btnCollapseExplorer.onclick = () => this.toggleFileTree(false);
    }

    // Top Toolbar Restore Buttons: Editor & Terminal
    const btnTbRestoreEditor = this.root.querySelector('#cpa-btn-toolbar-restore-editor');
    if (btnTbRestoreEditor) {
      btnTbRestoreEditor.onclick = () => this.setLayout(this.prevSplitLayout || 'split-h');
    }

    const btnTbRestoreTerminal = this.root.querySelector('#cpa-btn-toolbar-restore-terminal');
    if (btnTbRestoreTerminal) {
      btnTbRestoreTerminal.onclick = () => this.setLayout(this.prevSplitLayout || 'split-h');
    }

    // Terminal Action Buttons: Copy Console Output
    const btnCopyOutput = this.root.querySelector('#cpa-btn-copy-output');
    if (btnCopyOutput) {
      btnCopyOutput.onclick = () => {
        const termBody = this.root.querySelector('#cpa-terminal-body');
        if (termBody && navigator.clipboard) {
          navigator.clipboard.writeText(termBody.innerText || termBody.textContent || '');
          btnCopyOutput.textContent = '✓';
          setTimeout(() => { btnCopyOutput.textContent = '📋'; }, 1400);
        }
      };
    }

    // Web Preview Real-time Console Message Listener & Interactive Bridge
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'cpa-preview-log') {
        this.appendOutput(e.data.msg, e.data.level || 'stdout');
      } else if (e.data && e.data.type === 'cpa-switch-lang') {
        this.setLanguage(e.data.lang);
      }
    });

    if (stdinInput) {
      stdinInput.oninput = () => {
        this.stdin = stdinInput.value;
      };
    }

    const btnFiles = this.root.querySelector('#cpa-btn-files-toggle');
    if (btnFiles) {
      btnFiles.onclick = () => this.toggleFileTree();
    }

    // Interactive Inline New File Creation (Downside of the New File Icon)
    const btnNewFile = this.root.querySelector('#cpa-btn-new-file');
    const newFileBox = this.root.querySelector('#cpa-new-file-box');
    const newFileInput = this.root.querySelector('#cpa-new-file-input');
    const btnConfirmNewFile = this.root.querySelector('#cpa-btn-confirm-new-file');
    const btnCancelNewFile = this.root.querySelector('#cpa-btn-cancel-new-file');
    const newFileHint = this.root.querySelector('#cpa-new-file-hint');

    const showNewFileInput = () => {
      this.toggleFileTree(true);
      if (!newFileBox) return;
      newFileBox.style.display = 'block';
      if (newFileInput) {
        newFileInput.value = '';
        setTimeout(() => newFileInput.focus(), 50);
      }
      if (newFileHint) {
        newFileHint.style.display = 'none';
        newFileHint.textContent = '';
      }
    };

    const hideNewFileInput = () => {
      if (!newFileBox) return;
      newFileBox.style.display = 'none';
      if (newFileInput) newFileInput.value = '';
      if (newFileHint) {
        newFileHint.style.display = 'none';
        newFileHint.textContent = '';
      }
    };

    const commitNewFile = () => {
      if (!newFileInput) return;
      const rawVal = newFileInput.value.trim();
      if (!rawVal) {
        hideNewFileInput();
        return;
      }
      if (/[*?"<>|:]/.test(rawVal)) {
        if (newFileHint) {
          newFileHint.textContent = 'Invalid characters: * ? " < > | :';
          newFileHint.style.display = 'block';
        }
        return;
      }

      this.addFile(rawVal);
      hideNewFileInput();
    };

    if (btnNewFile) {
      btnNewFile.onclick = (e) => {
        e.stopPropagation();
        if (newFileBox && newFileBox.style.display !== 'none') {
          hideNewFileInput();
        } else {
          showNewFileInput();
        }
      };
    }

    if (newFileInput) {
      newFileInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitNewFile();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          hideNewFileInput();
        }
      };
    }

    if (btnConfirmNewFile) {
      btnConfirmNewFile.onclick = (e) => {
        e.stopPropagation();
        commitNewFile();
      };
    }

    if (btnCancelNewFile) {
      btnCancelNewFile.onclick = (e) => {
        e.stopPropagation();
        hideNewFileInput();
      };
    }

    this.renderFileTree();
    this.renderEditorTabs();

    const isPreviewLang = ['html', 'react', 'nextjs', 'vue', 'angular'].includes(this.language);
    if (isPreviewLang) {
      this.showPreview();
    }
  }

  // --- StackBlitz-style Virtual File System (VFS) Methods ---
  renderFileTree() {
    const treeEl = this.root?.querySelector('#cpa-file-tree');
    if (!treeEl) return;

    const filePaths = Object.keys(this.files).sort();
    treeEl.innerHTML = filePaths.map(path => {
      const isActive = path === this.activeFile;
      const icon = path.endsWith('.html') ? '🌐'
                 : path.endsWith('.css') ? '🎨'
                 : (path.endsWith('.jsx') || path.endsWith('.tsx')) ? '⚛️'
                 : path.endsWith('.vue') ? '🟢'
                 : path.endsWith('.ts') ? '🔷'
                 : path.endsWith('.json') ? '📋'
                 : '📄';
      return `
        <div class="cpa-tree-item ${isActive ? 'active' : ''}" data-path="${escapeHtml(path)}">
          <div class="cpa-tree-item-title">
            <span>${icon}</span>
            <span>${escapeHtml(path)}</span>
          </div>
          ${filePaths.length > 1 ? `<button class="cpa-tree-item-delete" data-path="${escapeHtml(path)}" title="Delete file">🗑️</button>` : ''}
        </div>
      `;
    }).join('');

    // Bind click events on items
    treeEl.querySelectorAll('.cpa-tree-item').forEach(item => {
      item.onclick = (e) => {
        if (e.target.closest('.cpa-tree-item-delete')) return;
        const path = item.getAttribute('data-path');
        if (path) this.openFile(path);
      };
    });

    treeEl.querySelectorAll('.cpa-tree-item-delete').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const path = btn.getAttribute('data-path');
        if (path) this.deleteFile(path);
      };
    });
  }

  renderEditorTabs() {
    const tabsEl = this.root?.querySelector('#cpa-editor-tabs');
    if (!tabsEl) return;

    if (this.openFiles.length === 0) {
      this.openFiles = [this.activeFile];
    }

    tabsEl.innerHTML = this.openFiles.map(path => {
      const isActive = path === this.activeFile;
      const filename = path.split('/').pop();
      const icon = path.endsWith('.html') ? '🌐'
                 : path.endsWith('.css') ? '🎨'
                 : (path.endsWith('.jsx') || path.endsWith('.tsx')) ? '⚛️'
                 : path.endsWith('.vue') ? '🟢'
                 : path.endsWith('.ts') ? '🔷'
                 : '📄';
      return `
        <div class="cpa-editor-tab ${isActive ? 'active' : ''}" data-path="${escapeHtml(path)}">
          <span>${icon} ${escapeHtml(filename)}</span>
          ${this.openFiles.length > 1 ? `<span class="cpa-editor-tab-close" data-path="${escapeHtml(path)}" title="Close Tab">✕</span>` : ''}
        </div>
      `;
    }).join('');

    tabsEl.querySelectorAll('.cpa-editor-tab').forEach(tab => {
      tab.onclick = (e) => {
        if (e.target.closest('.cpa-editor-tab-close')) return;
        const path = tab.getAttribute('data-path');
        if (path) this.openFile(path);
      };
    });

    tabsEl.querySelectorAll('.cpa-editor-tab-close').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const path = btn.getAttribute('data-path');
        if (path) this.closeFile(path);
      };
    });

    const filenameEl = this.root?.querySelector('#cpa-editor-filename');
    if (filenameEl) {
      filenameEl.textContent = `${this.activeFile} (${getLanguageInfo(this.language).name})`;
    }
  }

  openFile(path) {
    if (!this.files[path] && this.files[path] !== '') return this;

    // Save current active file content
    if (this.activeFile && this.files[this.activeFile] !== undefined) {
      this.files[this.activeFile] = this.code;
    }

    this.activeFile = path;
    if (!this.openFiles.includes(path)) {
      this.openFiles.push(path);
    }

    this.code = this.files[path];

    // Detect language from file extension
    const ext = path.split('.').pop()?.toLowerCase();
    const detectedLang = resolveLanguage(ext || 'javascript');
    this.language = detectedLang;

    // Update editor textarea and highlighter
    const codeInput = this.root?.querySelector('#cpa-code-input');
    const codeHighlight = this.root?.querySelector('#cpa-code-highlight');
    const charCount = this.root?.querySelector('#cpa-char-count');
    const lineNumbers = this.root?.querySelector('#cpa-line-numbers');
    const langSelect = this.root?.querySelector('#cpa-lang-select');

    if (codeInput) codeInput.value = this.code;
    if (codeHighlight) codeHighlight.innerHTML = highlightCode(this.code, this.language);
    if (charCount) charCount.textContent = `${this.code.length} chars`;
    if (langSelect) langSelect.value = this.language;

    const lines = (this.code.match(/\n/g) || []).length + 1;
    if (lineNumbers) {
      lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `<div class="cpa-line-num">${i + 1}</div>`).join('');
    }

    this.renderFileTree();
    this.renderEditorTabs();
    this.emit('fileChange', { path: this.activeFile, code: this.code });
    return this;
  }

  closeFile(path) {
    const idx = this.openFiles.indexOf(path);
    if (idx !== -1) {
      this.openFiles.splice(idx, 1);
      if (this.activeFile === path) {
        const nextPath = this.openFiles[idx] || this.openFiles[idx - 1] || Object.keys(this.files)[0];
        if (nextPath) this.openFile(nextPath);
      } else {
        this.renderEditorTabs();
      }
    }
    return this;
  }

  addFile(path, content = '') {
    if (!path || typeof path !== 'string') return this;
    const cleanPath = path.trim().replace(/^[\/\\]+/, '');
    if (!cleanPath) return this;

    this.files[cleanPath] = content;
    this.openFile(cleanPath);
    return this;
  }

  deleteFile(path) {
    if (!this.files[path]) return this;
    if (Object.keys(this.files).length <= 1) {
      this.appendOutput('[compile-all] Cannot delete the only remaining file.', 'info');
      return this;
    }

    delete this.files[path];
    this.closeFile(path);
    this.renderFileTree();
    return this;
  }

  toggleFileTree(show) {
    const sidebar = this.root?.querySelector('#cpa-file-sidebar');
    if (!sidebar) return this;

    this.fileTreeVisible = typeof show === 'boolean' ? show : !this.fileTreeVisible;
    sidebar.style.display = this.fileTreeVisible ? 'flex' : 'none';
    const btnFiles = this.root?.querySelector('#cpa-btn-files-toggle');
    if (btnFiles) {
      btnFiles.classList.toggle('active', this.fileTreeVisible);
    }
    if (this.fileTreeVisible) {
      this.renderFileTree();
    }
    return this;
  }

  getFiles() {
    if (this.activeFile) {
      this.files[this.activeFile] = this.code;
    }
    return { ...this.files };
  }

  setFiles(filesObject, activeFile) {
    if (!filesObject || typeof filesObject !== 'object') return this;
    this.files = { ...filesObject };
    this.openFiles = Object.keys(this.files);
    const targetActive = activeFile && this.files[activeFile] !== undefined
      ? activeFile
      : this.openFiles[0];
    if (targetActive) {
      this.openFile(targetActive);
    }
    return this;
  }

  getActiveFile() {
    return this.activeFile;
  }

  loadProjectTemplate(templateKey) {
    const template = PROJECT_TEMPLATES[templateKey];
    if (!template) return this;
    this.setFiles(template.files, template.activeFile);
    this.setLanguage(template.language);
    this.toggleFileTree(true);
    this.appendOutput(`[compile-all] Loaded project: ${template.name}`, 'info');
    return this;
  }


  // --- Live Web Preview & Console View Controls ---
  showConsole() {
    const tabConsole = this.root?.querySelector('#cpa-tab-console');
    const tabPreview = this.root?.querySelector('#cpa-tab-preview');
    const termBody = this.root?.querySelector('#cpa-terminal-body');
    const previewFrame = this.root?.querySelector('#cpa-preview-frame');
    if (tabConsole) tabConsole.classList.add('active');
    if (tabPreview) tabPreview.classList.remove('active');
    if (termBody) termBody.style.display = 'block';
    if (previewFrame) previewFrame.style.display = 'none';
    return this;
  }

  showPreview() {
    const tabConsole = this.root?.querySelector('#cpa-tab-console');
    const tabPreview = this.root?.querySelector('#cpa-tab-preview');
    const termBody = this.root?.querySelector('#cpa-terminal-body');
    const previewFrame = this.root?.querySelector('#cpa-preview-frame');
    if (tabConsole) tabConsole.classList.remove('active');
    if (tabPreview) tabPreview.classList.add('active');
    if (termBody) termBody.style.display = 'none';
    if (previewFrame) {
      previewFrame.style.display = 'block';
      this.refreshPreview();
    }
    return this;
  }

  setTerminalTabPosition(position) {
    this.terminalTabPosition = position === 'right' ? 'right' : 'left';
    const header = this.root?.querySelector('#cpa-terminal-header');
    const tabs = this.root?.querySelector('#cpa-terminal-tabs');
    const status = this.root?.querySelector('#cpa-terminal-status');
    const actions = this.root?.querySelector('.cpa-terminal-actions');
    if (header && tabs && status && actions) {
      if (this.terminalTabPosition === 'right') {
        header.classList.add('cpa-tabs-right');
        header.insertBefore(status, actions);
        actions.insertBefore(tabs, actions.firstChild);
      } else {
        header.classList.remove('cpa-tabs-right');
        header.insertBefore(tabs, actions);
        actions.insertBefore(status, actions.firstChild);
      }
    }
    this.emit('terminalTabPositionChange', this.terminalTabPosition);
    return this;
  }

  getTerminalTabPosition() {
    return this.terminalTabPosition;
  }

  refreshPreview() {
    const previewFrame = this.root?.querySelector('#cpa-preview-frame');
    if (!previewFrame) return this;

    const lang = this.language;
    let html = '';

    // Inject real-time console log and error forwarder bridge into preview
    const bridgeScript = `
<script>
(function() {
  const origLog = console.log;
  const origErr = console.error;
  const origWarn = console.warn;
  function forward(level, args) {
    try {
      window.parent.postMessage({
        type: 'cpa-preview-log',
        level: level,
        msg: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')
      }, '*');
    } catch(e) {}
  }
  console.log = function(...args) { origLog.apply(console, args); forward('stdout', args); };
  console.error = function(...args) { origErr.apply(console, args); forward('stderr', args); };
  console.warn = function(...args) { origWarn.apply(console, args); forward('info', ['[WARN]', ...args]); };
  window.onerror = function(msg, url, line) {
    forward('stderr', [msg + (line ? ' (Line ' + line + ')' : '')]);
  };
})();
</script>
`;

    // Sync current active code into files map
    if (this.activeFile) {
      this.files[this.activeFile] = this.code;
    }

    try {
      const fileEntries = Object.entries(this.files);
      const hasMultipleFiles = fileEntries.length > 1;

      if (hasMultipleFiles) {
        let combinedCss = '';
        for (const [p, content] of fileEntries) {
          if (p.endsWith('.css')) {
            combinedCss += `/* ${p} */\n${content}\n`;
          }
        }

        const isReact = lang === 'react' || lang === 'nextjs' || fileEntries.some(([p]) => p.endsWith('.jsx') || p.endsWith('.tsx'));
        const isVue = lang === 'vue' || fileEntries.some(([p]) => p.endsWith('.vue'));

        if (isReact) {
          const mainEntry = this.files['src/App.jsx'] ? 'src/App.jsx'
                          : this.files['src/App.tsx'] ? 'src/App.tsx'
                          : this.files['App.jsx'] ? 'App.jsx'
                          : (fileEntries.find(([p]) => p.endsWith('.jsx') || p.endsWith('.tsx'))?.[0] || fileEntries[0][0]);

          html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  ${bridgeScript}
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script>if (!window.React) document.write('<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\\/script>');</script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script>if (!window.ReactDOM) document.write('<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\\/script>');</script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
  <script>if (!window.Babel) document.write('<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\\/script>');</script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; }
    @keyframes cpa-spin { to { transform: rotate(360deg); } }
    ${combinedCss}
  </style>
</head>
<body>
  <div id="root">
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;color:#94a3b8;gap:12px;">
      <div style="width:22px;height:22px;border:2.5px solid #334155;border-top-color:#38bdf8;border-radius:50%;animation:cpa-spin 0.8s linear infinite;"></div>
      <span>Rendering preview...</span>
    </div>
  </div>
  <script>
    var bootAttempts = 0;
    (function boot() {
      if (!window.React || !window.ReactDOM || !window.Babel) {
        bootAttempts++;
        if (bootAttempts > 50) {
          document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;">[CDN Load Error] Could not load React / Babel scripts.<br/>Please verify your internet connection.</div>';
          return;
        }
        return setTimeout(boot, 50);
      }
      try {
        const files = ${JSON.stringify(this.files)};
        const modules = {};

        for (const [filePath, content] of Object.entries(files)) {
          if (filePath.endsWith('.css') || filePath.endsWith('.html')) continue;
          let code = content;
          try {
            let cleaned = content
              .replace(/import\\s+([a-zA-Z0-9_$]+)\\s+from\\s+['"]([^'"]+)['"];?/g, 'const $1 = require("$2");')
              .replace(/import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s+['"]([^'"]+)['"];?/g, 'const {$1} = require("$2");')
              .replace(/import\\s+['"][^'"]+['"];?/g, '')
              .replace(/export\\s+default\\s+(function|class)\\s*([a-zA-Z0-9_$]*)/g, '$1 __DefaultComp__$2; module.exports = __DefaultComp__$2; module.exports.default = __DefaultComp__$2;')
              .replace(/export\\s+default\\s+([^;\\n]+);?/g, 'module.exports.default = $1; module.exports = $1;')
              .replace(/export\\s+(const|let|var|function|class)\\s+([a-zA-Z0-9_$]+)/g, '$1 $2; module.exports.$2 = $2;')
              .replace(/export\\s*\\{([\\s\\S]*?)\\};?/g, '');
            code = Babel.transform(cleaned, { presets: ['react', 'typescript'] }).code;
          } catch (tErr) {
            console.error('[Transpile Error in ' + filePath + ']:', tErr.message);
          }
          modules[filePath] = code;
          modules['./' + filePath] = code;
          const shortName = filePath.split('/').pop();
          modules['./' + shortName] = code;
          modules[shortName] = code;
          const noExt = shortName.replace(/\.[a-zA-Z0-9]+$/, '');
          modules['./' + noExt] = code;
          modules[noExt] = code;
        }

        if (window.React) {
          window.React.default = window.React;
          window.React.__esModule = true;
        }
        if (window.ReactDOM) {
          window.ReactDOM.default = window.ReactDOM;
          window.ReactDOM.__esModule = true;
        }

        const cache = {};
        function customRequire(path) {
          if (path === 'react') return window.React;
          if (path === 'react-dom' || path === 'react-dom/client') return window.ReactDOM;
          if (path === 'next/router') {
            const rObj = {
              pathname: window.__currentPath || '/',
              asPath: window.__currentPath || '/',
              query: {},
              push: (url) => { window.__currentPath = url; console.log('[next/router] push ->', url); }
            };
            return {
              __esModule: true,
              useRouter: () => rObj,
              default: { useRouter: () => rObj }
            };
          }
          if (path === 'next/link') {
            const LinkComp = ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children);
            return {
              __esModule: true,
              default: LinkComp,
              Link: LinkComp
            };
          }
          if (path === 'next/head') {
            const HeadComp = ({ children }) => React.createElement(React.Fragment, null, children);
            return {
              __esModule: true,
              default: HeadComp,
              Head: HeadComp
            };
          }

          const clean = path.replace(/^\\.\\//, '');
          const candidates = [
            path,
            clean,
            'src/' + clean,
            clean + '.jsx',
            clean + '.tsx',
            clean + '.js',
            'src/' + clean + '.jsx',
            'src/' + clean + '.tsx',
            'src/' + clean + '.js'
          ];
          let targetCode = null;
          for (const cand of candidates) {
            if (modules[cand]) {
              targetCode = modules[cand];
              break;
            }
          }
          if (!targetCode) {
            for (const key of Object.keys(modules)) {
              if (key.endsWith(clean) || key.endsWith(clean + '.jsx') || key.endsWith(clean + '.js') || key.endsWith(clean + '.tsx')) {
                targetCode = modules[key];
                break;
              }
            }
          }
          if (!targetCode) {
            console.warn('[compile-all resolver] Module not found:', path);
            return {};
          }
          if (cache[path]) return cache[path];

          const module = { exports: {} };
          cache[path] = module.exports;

          const fn = new Function('require', 'module', 'exports', 'React', 'ReactDOM', targetCode);
          fn(customRequire, module, module.exports, window.React, window.ReactDOM);
          cache[path] = module.exports;
          return module.exports;
        }

        const entryPath = ${JSON.stringify(mainEntry)};
        const entryModule = customRequire(entryPath);
        const App = entryModule.default || entryModule.App || Object.values(entryModule)[0];
        if (App && typeof App === 'function') {
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement(App));
        }
      } catch (err) {
        console.error('[Multi-File Project Error]', err.message);
        document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;">[Project Execution Error]<br/>' + err.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;
        } else if (isVue) {
          html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  ${bridgeScript}
  <script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"></script>
  <script>if (!window.Vue) document.write('<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"><\\/script>');</script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
  <script>if (!window.Babel) document.write('<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\\/script>');</script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; }
    ${combinedCss}
  </style>
</head>
<body>
  <div id="app">
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;color:#94a3b8;gap:12px;">
      <div style="width:22px;height:22px;border:2.5px solid #334155;border-top-color:#42b883;border-radius:50%;animation:cpa-spin 0.8s linear infinite;"></div>
      <span>Rendering preview...</span>
    </div>
  </div>
  <script>
    var bootAttempts = 0;
    (function boot() {
      if (!window.Vue || !window.Babel) {
        bootAttempts++;
        if (bootAttempts > 50) {
          document.getElementById('app').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;">[CDN Load Error] Could not load Vue 3 / Babel scripts.<br/>Please verify your internet connection.</div>';
          return;
        }
        return setTimeout(boot, 50);
      }
      try {
        const files = ${JSON.stringify(this.files)};
        const components = {};

        for (const [filePath, content] of Object.entries(files)) {
          if (!filePath.endsWith('.vue')) continue;
          const tmplMatch = content.match(/<template>([\\s\\S]*?)<\\/template>/i);
          const scriptMatch = content.match(/<script.*?>([\\s\\S]*?)<\\/script>/i);
          const styleMatch = content.match(/<style.*?>([\\s\\S]*?)<\\/style>/i);

          if (styleMatch) {
            const s = document.createElement('style');
            s.textContent = styleMatch[1];
            document.head.appendChild(s);
          }

          let scriptContent = scriptMatch ? scriptMatch[1] : '';
          scriptContent = scriptContent.replace(/import\\s+.*?from\\s+['"]vue['"];?\\s*/g, 'const { ref, reactive, computed, watch, onMounted, nextTick } = Vue;\\n');
          scriptContent = scriptContent.replace(/import\\s+([a-zA-Z0-9_$]+)\\s+from\\s+['"].*?['"];?\\s*/g, '/* import $1 */\\n');
          scriptContent = scriptContent.replace(/export\\s+default\\s+/g, 'const __Comp__ = ');

          let compiledScript = scriptContent;
          try {
            compiledScript = Babel.transform(scriptContent, {
              presets: ['typescript', 'react']
            }).code;
          } catch(bErr) {
            console.warn('[Babel Vue Transform Error in ' + filePath + ']:', bErr.message);
          }

          const vueFnCode = 'const { ref, reactive, computed, watch, onMounted, nextTick } = Vue;\\n' +
            compiledScript + '\\n' +
            'return typeof __Comp__ !== "undefined" ? __Comp__ : {};';

          const evalFn = new Function('Vue', vueFnCode);

          const compDef = evalFn(Vue);
          compDef.template = tmplMatch ? tmplMatch[1].trim() : '';

          const compName = filePath.split('/').pop().replace('.vue', '');
          components[compName] = compDef;
          components[filePath] = compDef;
        }

        const appComp = components['App'] || components['src/App.vue'] || Object.values(components)[0];
        if (appComp) {
          const app = Vue.createApp(appComp);
          for (const [name, def] of Object.entries(components)) {
            if (!name.includes('/')) {
              app.component(name, def);
            }
          }
          app.mount('#app');
        }
      } catch (err) {
        console.error('[Vue Project Error]', err.message);
        document.getElementById('app').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;">[Vue Project Execution Error]<br/>' + err.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;
        } else {
          const htmlFile = this.files['index.html'] || this.files['public/index.html'];
          let mainHtml = htmlFile || '<!DOCTYPE html><html><head></head><body><div id="output"></div></body></html>';

          for (const [p, content] of fileEntries) {
            if (p.endsWith('.css')) {
              const shortName = p.split('/').pop();
              const tagRegex = new RegExp(`<link[^>]+href=["'].*?(${shortName}|${p})["'][^>]*>`, 'gi');
              mainHtml = mainHtml.replace(tagRegex, `<style>/* ${p} */\n${content}</style>`);
            }
          }

          const jsEntries = fileEntries.filter(([p]) => p.endsWith('.js') || p.endsWith('.ts'));
          if (jsEntries.length > 0 && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
            const importMap = { imports: {} };
            for (const [p, content] of jsEntries) {
              try {
                const blob = new Blob([content], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                const shortName = p.split('/').pop();
                importMap.imports[p] = blobUrl;
                importMap.imports['./' + p] = blobUrl;
                importMap.imports[shortName] = blobUrl;
                importMap.imports['./' + shortName] = blobUrl;
                const srcRegex = new RegExp(`src=["'].*?(${shortName}|${p})["']`, 'gi');
                mainHtml = mainHtml.replace(srcRegex, `src="${blobUrl}"`);
              } catch(e) {}
            }
            const importMapTag = `<script type="importmap">${JSON.stringify(importMap)}</script>`;
            if (mainHtml.includes('<head>')) {
              mainHtml = mainHtml.replace('<head>', `<head>${bridgeScript}<style>${combinedCss}</style>${importMapTag}`);
            } else {
              mainHtml = bridgeScript + `<style>${combinedCss}</style>${importMapTag}` + mainHtml;
            }
          } else {
            if (mainHtml.includes('<head>')) {
              mainHtml = mainHtml.replace('<head>', `<head>${bridgeScript}<style>${combinedCss}</style>`);
            } else {
              mainHtml = bridgeScript + `<style>${combinedCss}</style>` + mainHtml;
            }
          }
          html = mainHtml;
        }
      } else if (lang === 'react') {
        // React 18 + Babel Standalone In-Browser Runner
        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  ${bridgeScript}
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script>if (!window.React) document.write('<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\\/script>');</script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script>if (!window.ReactDOM) document.write('<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\\/script>');</script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
  <script>if (!window.Babel) document.write('<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\\/script>');</script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; }
    @keyframes cpa-spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="root">
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;color:#94a3b8;gap:12px;">
      <div style="width:22px;height:22px;border:2.5px solid #334155;border-top-color:#38bdf8;border-radius:50%;animation:cpa-spin 0.8s linear infinite;"></div>
      <span>Rendering React component...</span>
    </div>
  </div>
  <script>
    var bootAttempts = 0;
    (function boot() {
      if (!window.React || !window.ReactDOM || !window.Babel) {
        bootAttempts++;
        if (bootAttempts > 50) {
          document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;">[CDN Load Error] Could not load React / Babel scripts.<br/>Please verify your internet connection.</div>';
          return;
        }
        return setTimeout(boot, 50);
      }
      try {
        const { useState, useEffect, useRef, useMemo, useCallback } = React;
        let preprocessed = ${JSON.stringify(this.code)};

        // 1. Strip import statements
        preprocessed = preprocessed.replace(/import\\s+[\\s\\S]*?from\\s+['"][^'"]+['"];?/g, '');
        preprocessed = preprocessed.replace(/import\\s+['"][^'"]+['"];?/g, '');
        preprocessed = preprocessed.replace(/^\\s*import\\s+.*?;?\\s*$/gm, '');

        // 2. Normalize export default
        preprocessed = preprocessed.replace(/export\\s+default\\s+function\\s*([a-zA-Z0-9_$]*)/g, 'function $1');
        preprocessed = preprocessed.replace(/export\\s+default\\s+class\\s*([a-zA-Z0-9_$]*)/g, 'class $1');
        preprocessed = preprocessed.replace(/export\\s+default\\s+([a-zA-Z0-9_$]+);?/g, 'const __DefaultComp__ = $1;');

        // 3. Normalize named exports
        preprocessed = preprocessed.replace(/export\\s+(const|let|var|function|class)\\s+/g, '$1 ');
        preprocessed = preprocessed.replace(/export\\s*\\{[^}]*\\};?/g, '');

        // 4. Compile JSX and TypeScript to JS with classic JSX runtime
        let compiledJs = '';
        try {
          compiledJs = Babel.transform(preprocessed, {
            presets: [
              ['react', { runtime: 'classic' }],
              'typescript'
            ]
          }).code;
        } catch (bErr) {
          compiledJs = Babel.transform(preprocessed, {
            presets: ['react', 'typescript']
          }).code;
        }

        // 5. Post-clean any Babel-injected imports (e.g. react/jsx-runtime)
        compiledJs = compiledJs.replace(/import\\s+[\\s\\S]*?from\\s+['"][^'"]+['"];?/g, '');
        compiledJs = compiledJs.replace(/import\\s+['"][^'"]+['"];?/g, '');
        compiledJs = compiledJs.replace(/^\\s*import\\s+.*?;?\\s*$/gm, '');

        // 6. JSX runtime shims
        const _jsx = (type, props, key) => React.createElement(type, key !== undefined ? Object.assign({}, props, { key }) : props);
        const _jsxs = _jsx;

        // 7. Assemble runtime code safely with string concatenation
        const runnerCode = compiledJs + '\\n' +
          'var RootComponent = (typeof CounterApp !== "undefined" ? CounterApp : null) || ' +
          '(typeof App !== "undefined" ? App : null) || ' +
          '(typeof __DefaultComp__ !== "undefined" ? __DefaultComp__ : null) || ' +
          '(typeof Page !== "undefined" ? Page : null);\\n' +
          'if (RootComponent) {\\n' +
          '  var root = ReactDOM.createRoot(document.getElementById("root"));\\n' +
          '  root.render(React.createElement(RootComponent));\\n' +
          '} else {\\n' +
          '  document.getElementById("root").innerHTML = "<div style=\\"padding:24px;color:#94a3b8;\\">Component mounted.</div>";\\n' +
          '}';

        const evalFn = new Function('React', 'ReactDOM', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', '_jsx', '_jsxs', runnerCode);
        evalFn(React, ReactDOM, useState, useEffect, useRef, useMemo, useCallback, _jsx, _jsxs);
      } catch (err) {
        console.error('[React Error]', err.message);
        document.getElementById('root').innerHTML = '<div style="padding:20px;color:#ef4444;font-family:monospace;white-space:pre-wrap;">[React Compiler Error]\\n' + err.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;
      } else if (lang === 'nextjs') {
        // Next.js with in-browser Router & Link simulation
        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  ${bridgeScript}
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script>if (!window.React) document.write('<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\\/script>');</script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script>if (!window.ReactDOM) document.write('<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\\/script>');</script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
  <script>if (!window.Babel) document.write('<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\\/script>');</script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #000; color: #fff; }
    @keyframes cpa-spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="root">
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;color:#888;gap:12px;">
      <div style="width:22px;height:22px;border:2.5px solid #333;border-top-color:#0070f3;border-radius:50%;animation:cpa-spin 0.8s linear infinite;"></div>
      <span>Rendering Next.js page...</span>
    </div>
  </div>
  <script>
    var bootAttempts = 0;
    (function boot() {
      if (!window.React || !window.ReactDOM || !window.Babel) {
        bootAttempts++;
        if (bootAttempts > 50) {
          document.getElementById('root').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;">[CDN Load Error] Could not load React / Babel scripts.<br/>Please verify your internet connection.</div>';
          return;
        }
        return setTimeout(boot, 50);
      }
      try {
        const { useState, useEffect, useRef, useMemo, useCallback } = React;
        window.__currentPath = window.__currentPath || '/';
        const useRouter = () => ({
          pathname: window.__currentPath,
          asPath: window.__currentPath,
          query: {},
          push: (url) => {
            window.__currentPath = url;
            console.log('[next/router] router.push ->', url);
            renderApp();
          }
        });

        const Link = ({ href, children, ...props }) => (
          React.createElement('a', {
            href,
            onClick: (e) => { e.preventDefault(); useRouter().push(href); },
            ...props
          }, children)
        );

        let preprocessed = ${JSON.stringify(this.code)};

        // 1. Strip import statements
        preprocessed = preprocessed.replace(/import\\s+[\\s\\S]*?from\\s+['"][^'"]+['"];?/g, '');
        preprocessed = preprocessed.replace(/import\\s+['"][^'"]+['"];?/g, '');

        // 2. Normalize export default
        preprocessed = preprocessed.replace(/export\\s+default\\s+function\\s*([a-zA-Z0-9_$]*)/g, 'function $1');
        preprocessed = preprocessed.replace(/export\\s+default\\s+class\\s*([a-zA-Z0-9_$]*)/g, 'class $1');
        preprocessed = preprocessed.replace(/export\\s+default\\s+([a-zA-Z0-9_$]+);?/g, 'const __DefaultComp__ = $1;');

        // 3. Normalize named exports
        preprocessed = preprocessed.replace(/export\\s+(const|let|var|function|class)\\s+/g, '$1 ');
        preprocessed = preprocessed.replace(/export\\s*\\{[^}]*\\};?/g, '');

        // 4. Compile JSX and TypeScript to JS
        const compiledJs = Babel.transform(preprocessed, {
          presets: ['react', 'typescript']
        }).code;

        var root;
        function renderApp() {
          const runnerCode = compiledJs + '\\n' +
            'var PageComponent = (typeof NextPage !== "undefined" ? NextPage : null) || ' +
            '(typeof Page !== "undefined" ? Page : null) || ' +
            '(typeof App !== "undefined" ? App : null) || ' +
            '(typeof CounterApp !== "undefined" ? CounterApp : null) || ' +
            '(typeof __DefaultComp__ !== "undefined" ? __DefaultComp__ : null);\\n' +
            'if (PageComponent) {\\n' +
            '  if (!root) root = ReactDOM.createRoot(document.getElementById("root"));\\n' +
            '  root.render(React.createElement(PageComponent));\\n' +
            '} else {\\n' +
            '  document.getElementById("root").innerHTML = "<div style=\\"padding:24px;color:#94a3b8;\\">Next.js Page mounted.</div>";\\n' +
            '}';

          const evalFn = new Function('React', 'ReactDOM', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useRouter', 'Link', runnerCode);
          evalFn(React, ReactDOM, useState, useEffect, useRef, useMemo, useCallback, useRouter, Link);
        }
        renderApp();
      } catch (err) {
        console.error('[Next.js Error]', err.message);
        document.getElementById('root').innerHTML = '<div style="padding:20px;color:#ef4444;font-family:monospace;white-space:pre-wrap;">[Next.js Compiler Error]\\n' + err.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;
      } else if (lang === 'vue') {
        // Vue 3 Single File / Composition API + Babel Standalone Runner
        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  ${bridgeScript}
  <script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"></script>
  <script>if (!window.Vue) document.write('<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"><\\/script>');</script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
  <script>if (!window.Babel) document.write('<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\\/script>');</script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; }
    @keyframes cpa-spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="app">
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;color:#94a3b8;gap:12px;">
      <div style="width:22px;height:22px;border:2.5px solid #334155;border-top-color:#42b883;border-radius:50%;animation:cpa-spin 0.8s linear infinite;"></div>
      <span>Rendering Vue component...</span>
    </div>
  </div>
  <script>
    var bootAttempts = 0;
    (function boot() {
      if (!window.Vue || !window.Babel) {
        bootAttempts++;
        if (bootAttempts > 50) {
          document.getElementById('app').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;">[CDN Load Error] Could not load Vue 3 / Babel scripts.<br/>Please verify your internet connection.</div>';
          return;
        }
        return setTimeout(boot, 50);
      }
      try {
        const raw = ${JSON.stringify(this.code)};
        const tmplMatch = raw.match(/<template>([\\s\\S]*?)<\\/template>/i);
        const scriptMatch = raw.match(/<script.*?>([\\s\\S]*?)<\\/script>/i);
        const styleMatch = raw.match(/<style.*?>([\\s\\S]*?)<\\/style>/i);

        if (styleMatch) {
          const styleEl = document.createElement('style');
          styleEl.textContent = styleMatch[1];
          document.head.appendChild(styleEl);
        }

        const templateHtml = tmplMatch ? tmplMatch[1].trim() : '<div style="padding:24px;">No &lt;template&gt; found</div>';
        document.getElementById('app').innerHTML = templateHtml;

        let scriptContent = scriptMatch ? scriptMatch[1] : '';
        scriptContent = scriptContent.replace(/import\\s+.*?from\\s+['"]vue['"];?\\s*/g, 'const { ref, reactive, computed, watch, onMounted, nextTick } = Vue;\\n');
        scriptContent = scriptContent.replace(/import\\s+[\\s\\S]*?from\\s+['"][^'"]+['"];?\\s*/g, '');
        scriptContent = scriptContent.replace(/export\\s+default\\s+/g, 'const __VueComponent__ = ');

        // In-Browser Babel compilation for TypeScript, JSX & modern ES in Vue
        let compiledScript = scriptContent;
        try {
          compiledScript = Babel.transform(scriptContent, {
            presets: ['typescript', 'react']
          }).code;
        } catch (bErr) {
          console.warn('[Babel Vue Transform Warning]', bErr.message);
        }

        const vueFnCode = 'const { ref, reactive, computed, watch, onMounted, nextTick } = Vue;\\n' +
          compiledScript + '\\n' +
          'return typeof __VueComponent__ !== "undefined" ? __VueComponent__ : {};';

        const evalScript = new Function('Vue', vueFnCode);

        const compOptions = evalScript(Vue);
        const app = Vue.createApp({
          ...compOptions,
          template: document.getElementById('app').innerHTML
        });
        app.mount('#app');
      } catch (err) {
        console.error('[Vue Error]', err.message);
        document.getElementById('app').innerHTML = '<div style="padding:20px;color:#ef4444;font-family:monospace;white-space:pre-wrap;">[Vue Compiler Error]\\n' + err.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;
      } else if (lang === 'angular') {
        // Angular Standalone Component & AngularJS 1.8 CDN Sandbox Runner
        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  ${bridgeScript}
  <script src="https://cdn.jsdelivr.net/npm/angular@1.8.3/angular.min.js"></script>
  <script>if (!window.angular) document.write('<script src="https://unpkg.com/angular@1.8.3/angular.min.js"><\\/script>');</script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
  <script>if (!window.Babel) document.write('<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\\/script>');</script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; }
    @keyframes cpa-spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="angular-container">
    <div id="angular-root"></div>
  </div>
  <script>
    var bootAttempts = 0;
    (function boot() {
      const raw = ${JSON.stringify(this.code)};
      const isAngularJs1 = raw.includes('angular.module') || raw.includes('ng-app') || raw.includes('ng-controller');

      if (isAngularJs1 && (!window.angular || !window.Babel)) {
        bootAttempts++;
        if (bootAttempts > 50) {
          document.getElementById('angular-container').innerHTML = '<div style="padding:24px;color:#ef4444;font-family:monospace;">[CDN Load Error] Could not load AngularJS / Babel scripts.<br/>Please verify your internet connection.</div>';
          return;
        }
        return setTimeout(boot, 50);
      }

        if (isAngularJs1) {
          // Extract HTML and script tags for AngularJS 1.8 Native Sandbox
          let htmlContent = raw.replace(/<script[\\s\\S]*?<\\/script>/gi, '').trim();
          const scriptMatches = [...raw.matchAll(/<script.*?>([\\s\\S]*?)<\\/script>/gi)];
          let scriptContent = scriptMatches.map(m => m[1]).join('\\n');

          if (!htmlContent) {
            htmlContent = '<div ng-app="app" ng-controller="MainCtrl" style="padding:24px;">{{ message || "AngularJS 1.8 Loaded" }}</div>';
          }

          document.getElementById('angular-container').innerHTML = htmlContent;

          if (scriptContent) {
            let compiledJs = scriptContent;
            try {
              compiledJs = Babel.transform(scriptContent, { presets: ['typescript', 'react'] }).code;
            } catch (e) {}
            const s = document.createElement('script');
            s.textContent = compiledJs;
            document.body.appendChild(s);
          }

          // Auto-bootstrap if ng-app not automatically initialized
          const appEl = document.querySelector('[ng-app]');
          if (appEl && !angular.element(appEl).injector()) {
            const moduleName = appEl.getAttribute('ng-app') || 'app';
            try { angular.bootstrap(appEl, [moduleName]); } catch(e) {}
          }
        } else {
          // Modern Angular Standalone Component with Signals & Decorators
          const tmplMatch = raw.match(/template:\\s*\`([\\s\\S]*?)\`/);
          const styleMatch = raw.match(/styles:\\s*\\[\\s*\`([\\s\\S]*?)\`\\s*\\]/);

          if (styleMatch) {
            const s = document.createElement('style');
            s.textContent = styleMatch[1];
            document.head.appendChild(s);
          }

          const template = tmplMatch ? tmplMatch[1].trim() : '<div>Angular Component</div>';

          function signal(initialVal) {
            let value = initialVal;
            const s = function() { return value; };
            s.set = (v) => { value = v; render(); };
            s.update = (fn) => { value = fn(value); render(); };
            return s;
          }

          const componentInstance = {
            count: signal(0),
            increment() { this.count.update(n => n + 1); },
            decrement() { this.count.update(n => n - 1); }
          };

          const rootEl = document.getElementById('angular-root');

          function render() {
            let html = template;
            html = html.replace(/\\{\\{\\s*count\\(\\)\\s*\\}\\}/g, componentInstance.count());
            html = html.replace(/\\{\\{\\s*([a-zA-Z0-9_$]+)\\(\\)\\s*\\}\\}/g, (m, name) => {
              return typeof componentInstance[name] === 'function' ? componentInstance[name]() : '';
            });
            rootEl.innerHTML = html;

            rootEl.querySelectorAll('[\\\\(click\\\\)]').forEach(el => {
              const action = el.getAttribute('(click)');
              el.onclick = () => {
                if (action.includes('increment()')) componentInstance.increment();
                else if (action.includes('decrement()')) componentInstance.decrement();
                else {
                  const fnName = action.replace('()', '').trim();
                  if (typeof componentInstance[fnName] === 'function') componentInstance[fnName]();
                }
              };
            });
          }

          render();
        }
      } catch (err) {
        console.error('[Angular Error]', err.message);
        document.getElementById('angular-container').innerHTML = '<div style="padding:20px;color:#ef4444;font-family:monospace;white-space:pre-wrap;">[Angular Compiler Error]\\n' + err.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;
      } else if (lang === 'html') {
        // Standard HTML / Web Sandbox
        if (!this.code.includes('<html') && !this.code.includes('<!DOCTYPE')) {
          html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  ${bridgeScript}
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; margin: 0; }
  </style>
</head>
<body>
  ${this.code}
</body>
</html>`;
        } else if (this.code.includes('<head>')) {
          html = this.code.replace('<head>', '<head>' + bridgeScript);
        } else {
          html = bridgeScript + this.code;
        }
      } else if (lang === 'javascript' || lang === 'typescript') {
        // Run JavaScript / TypeScript DOM manipulation in browser sandbox
        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  ${bridgeScript}
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
  <script>if (!window.Babel) document.write('<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\\/script>');</script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; margin: 0; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    try {
      var raw = ${JSON.stringify(this.code)};
      // Strip import/export syntax so browser doesn't throw module errors
      raw = raw.replace(/import\\s+[\\s\\S]*?from\\s+['"][^'"]+['"];?/g, '');
      raw = raw.replace(/import\\s+['"][^'"]+['"];?/g, '');
      raw = raw.replace(/export\\s+default\\s+/g, '');
      raw = raw.replace(/export\\s+(const|let|var|function|class)\\s+/g, '$1 ');
      var execCode = raw;
      if (window.Babel) {
        try {
          execCode = Babel.transform(raw, { presets: ['typescript'] }).code;
        } catch(bErr) {}
      }
      new Function(execCode)();
    } catch(err) {
      console.error(err);
      document.body.innerHTML += '<div style="color:#ef4444;font-family:monospace;padding:12px;background:#1e293b;border-radius:6px;margin-top:12px;">[Runtime Error]: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
      } else {
        // Informative guidance for Backend/CLI Languages (Python, C++, Java, Rust, SQL, etc.)
        const langInfo = getLanguageInfo(this.language);
        html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      margin: 0;
      padding: 32px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #1e293b;
      border: 1px solid #334155;
      color: #38bdf8;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    h2 { margin: 0 0 10px 0; font-size: 22px; color: #fff; }
    p { margin: 0 0 20px 0; color: #94a3b8; font-size: 14px; max-width: 440px; line-height: 1.6; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      transition: background 0.15s ease;
    }
    .btn:hover { background: #1d4ed8; }
    .hint { margin-top: 24px; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="badge">🌐 Web Preview View</div>
  <h2>Interactive Web Preview</h2>
  <p>The active language is <strong>${escapeHtml(langInfo.name)}</strong>. Terminal console execution is active on the <strong>💻 Console</strong> tab.</p>
  <p>To render live interactive web components, select a frontend language:</p>
  <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
    <button class="btn" onclick="window.parent.postMessage({ type: 'cpa-switch-lang', lang: 'react' }, '*')">⚛️ Switch to React</button>
    <button class="btn" style="background:#0284c7;" onclick="window.parent.postMessage({ type: 'cpa-switch-lang', lang: 'html' }, '*')">⚡ Switch to HTML</button>
    <button class="btn" style="background:#059669;" onclick="window.parent.postMessage({ type: 'cpa-switch-lang', lang: 'vue' }, '*')">🟢 Switch to Vue 3</button>
  </div>
  <div class="hint">Or click the <strong>💻 Console</strong> tab above to view ${escapeHtml(langInfo.name)} output.</div>
</body>
</html>`;
      }

      previewFrame.srcdoc = html;
    } catch (err) {
      console.error('[compile-all] Error rendering preview:', err);
      previewFrame.srcdoc = `<!DOCTYPE html><html><body style="font-family:monospace;padding:24px;color:#ef4444;background:#0f172a;"><h3>[Preview Build Error]</h3><pre>${escapeHtml(err.message || String(err))}</pre></body></html>`;
    }
    return this;
  }

  downloadCode() {
    const langInfo = getLanguageInfo(this.language);
    const filename = `main.${langInfo.ext || 'txt'}`;
    const blob = new Blob([this.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.appendOutput(`[compile-all] Downloaded source as ${filename}`, 'info');
    return this;
  }

  // --- Layout Switching API & Section Expand/Collapse ---
  setLayout(newLayout) {
    if (!['split-h', 'split-v', 'editor-only', 'terminal-only'].includes(newLayout)) return this;

    if (['split-h', 'split-v'].includes(newLayout)) {
      this.prevSplitLayout = newLayout;
    }
    this.layout = newLayout;

    const workspace = this.root?.querySelector('#cpa-workspace');
    if (workspace) {
      workspace.className = `cpa-workspace cpa-layout-${newLayout}`;
    }

    // Update segmented layout buttons active state
    this.root?.querySelectorAll('.cpa-btn-layout').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-layout') === newLayout);
    });

    // Update section expand/collapse button icons and titles
    const btnExpandEditor = this.root?.querySelector('#cpa-btn-expand-editor');
    if (btnExpandEditor) {
      btnExpandEditor.textContent = newLayout === 'editor-only' ? '◫' : '⤢';
      btnExpandEditor.title = newLayout === 'editor-only' ? 'Restore Split View' : 'Maximize Editor (Expand)';
    }

    const btnExpandTerminal = this.root?.querySelector('#cpa-btn-expand-terminal');
    if (btnExpandTerminal) {
      btnExpandTerminal.textContent = newLayout === 'terminal-only' ? '◫' : '⤢';
      btnExpandTerminal.title = newLayout === 'terminal-only' ? 'Restore Split View' : 'Maximize Output (Expand)';
    }

    // Toggle docked restore strips
    const restoreEditorStrip = this.root?.querySelector('#cpa-restore-editor');
    if (restoreEditorStrip) {
      restoreEditorStrip.style.display = newLayout === 'terminal-only' ? 'flex' : 'none';
    }

    const restoreTerminalStrip = this.root?.querySelector('#cpa-restore-terminal');
    if (restoreTerminalStrip) {
      restoreTerminalStrip.style.display = newLayout === 'editor-only' ? 'flex' : 'none';
    }

    // Toggle top toolbar restore buttons
    const tbRestoreEditor = this.root?.querySelector('#cpa-btn-toolbar-restore-editor');
    if (tbRestoreEditor) {
      tbRestoreEditor.style.display = newLayout === 'terminal-only' ? 'inline-flex' : 'none';
    }

    const tbRestoreTerminal = this.root?.querySelector('#cpa-btn-toolbar-restore-terminal');
    if (tbRestoreTerminal) {
      tbRestoreTerminal.style.display = newLayout === 'editor-only' ? 'inline-flex' : 'none';
    }

    // Reset custom inline drag sizing so layout resets cleanly
    const editorPane = this.root?.querySelector('.cpa-editor-pane');
    const terminalPane = this.root?.querySelector('.cpa-terminal-pane');
    if (editorPane) {
      editorPane.style.flex = '';
      editorPane.style.width = '';
      editorPane.style.height = '';
    }
    if (terminalPane) {
      terminalPane.style.flex = '';
      terminalPane.style.width = '';
      terminalPane.style.height = '';
    }

    this.emit('layoutChange', newLayout);
    return this;
  }

  toggleExpandEditor() {
    if (this.layout === 'editor-only') {
      this.setLayout(this.prevSplitLayout || 'split-h');
    } else {
      this.setLayout('editor-only');
    }
    return this;
  }

  toggleCollapseEditor() {
    if (this.layout === 'terminal-only') {
      this.setLayout(this.prevSplitLayout || 'split-h');
    } else {
      this.setLayout('terminal-only');
    }
    return this;
  }

  toggleExpandTerminal() {
    if (this.layout === 'terminal-only') {
      this.setLayout(this.prevSplitLayout || 'split-h');
    } else {
      this.setLayout('terminal-only');
    }
    return this;
  }

  toggleCollapseTerminal() {
    if (this.layout === 'editor-only') {
      this.setLayout(this.prevSplitLayout || 'split-h');
    } else {
      this.setLayout('editor-only');
    }
    return this;
  }

  getLayout() {
    return this.layout;
  }

  // --- Starter Template Loader ---
  getTemplates() {
    return getTemplatesForLanguage(this.language);
  }

  loadTemplate(indexOrLabel) {
    const templates = this.getTemplates();
    let template;
    if (typeof indexOrLabel === 'number') {
      template = templates[indexOrLabel];
    } else {
      template = templates.find(t => t.label === indexOrLabel);
    }

    if (template && template.code) {
      this.setCode(template.code);
      if (this.activeFile) {
        this.files[this.activeFile] = this.code;
      }
      const isPreviewLang = ['html', 'react', 'nextjs', 'vue', 'angular'].includes(this.language);
      if (isPreviewLang) {
        this.showPreview();
        this.refreshPreview();
      } else {
        this.showConsole();
      }
    }
    return this;
  }

  // --- Execution Engine ---
  async run() {
    if (this.status === 'running') return;
    this.setStatus('running');

    // If terminal is currently hidden (e.g. editor-only focus mode), temporarily switch or open it
    if (this.layout === 'editor-only') {
      this.setLayout(this.prevSplitLayout || 'split-h');
    }

    const isPreviewLang = ['html', 'react', 'vue', 'angular', 'nextjs'].includes(this.language);
    if (isPreviewLang) {
      this.showPreview();
    } else {
      this.showConsole();
    }

    const btnRun = this.root?.querySelector('#cpa-btn-run');
    const btnStop = this.root?.querySelector('#cpa-btn-stop');
    if (btnRun) btnRun.style.display = 'none';
    if (btnStop) btnStop.style.display = 'inline-flex';

    this.appendOutput(`\n[compile-all] Compiling and running ${this.language}...`, 'info');
    this.emit('runStart', { language: this.language, code: this.code, stdin: this.stdin });

    if (typeof this.options.onRunStart === 'function') {
      this.options.onRunStart({ language: this.language, code: this.code });
    }

    let result;
    const langInfo = getLanguageInfo(this.language);

    try {
      if (isPreviewLang) {
        this.refreshPreview();
        result = await this.browserRunner.run(this.code, this.language, this.stdin);
      } else if (langInfo.runner === 'browser' && ['javascript', 'typescript', 'json', 'sql'].includes(this.language)) {
        result = await this.browserRunner.run(this.code, this.language, this.stdin);
      } else if (this.language === 'python') {
        // Try remote runner first; fallback seamlessly to in-browser Python runner on 401 or failure
        try {
          result = await this.remoteRunner.run(this.code, this.language, this.stdin, this.options.endpoint);
          if (result.exitCode !== 0 && result.stderr && (result.stderr.includes('401') || result.stderr.includes('Remote execution failed'))) {
            this.appendOutput('[compile-all] Remote runner offline. Seamlessly executing in-browser WebAssembly Python...', 'info');
            result = await this.browserRunner.run(this.code, 'python', this.stdin);
          }
        } catch {
          this.appendOutput('[compile-all] Executing via in-browser Python engine...', 'info');
          result = await this.browserRunner.run(this.code, 'python', this.stdin);
        }
      } else {
        result = await this.remoteRunner.run(this.code, this.language, this.stdin, this.options.endpoint);
      }
    } catch (err) {
      result = {
        stdout: '',
        stderr: err.message || 'Execution error',
        exitCode: 1,
        durationMs: 0,
        memoryKb: 0
      };
    }

    if (btnRun) btnRun.style.display = 'inline-flex';
    if (btnStop) btnStop.style.display = 'none';

    this.telemetry = {
      durationMs: result.durationMs,
      memoryKb: result.memoryKb,
      exitCode: result.exitCode
    };

    if (result.stdout) {
      this.appendOutput(result.stdout, 'stdout');
      this.emit('stdout', result.stdout);
    }
    if (result.stderr) {
      this.appendOutput(result.stderr, 'stderr');
      this.emit('stderr', result.stderr);
    }

    const isSuccess = result.exitCode === 0;
    this.setStatus(isSuccess ? 'success' : 'error');
    this.updateTelemetryBadge();

    this.emit('runEnd', { ...result, language: this.language });
    if (typeof this.options.onRunEnd === 'function') {
      this.options.onRunEnd({ ...result, language: this.language });
    }

    return result;
  }

  stop() {
    this.browserRunner.stop();
    this.remoteRunner.stop();
    this.setStatus('stopped');

    const btnRun = this.root?.querySelector('#cpa-btn-run');
    const btnStop = this.root?.querySelector('#cpa-btn-stop');
    if (btnRun) btnRun.style.display = 'inline-flex';
    if (btnStop) btnStop.style.display = 'none';

    this.appendOutput('\n[compile-all] Execution stopped by user.', 'stderr');
    this.emit('runStop');
    return this;
  }

  setStatus(status) {
    this.status = status;
    const dot = this.root?.querySelector('#cpa-status-dot');
    const text = this.root?.querySelector('#cpa-status-text');
    const badge = this.root?.querySelector('#cpa-badge-status');

    if (dot) {
      dot.className = `cpa-status-dot cpa-${status}`;
    }
    if (text) {
      text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
    if (badge) {
      badge.textContent = `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    }
    this.emit('stateChange', { status, telemetry: this.telemetry });
  }

  updateTelemetryBadge() {
    const timeBadge = this.root?.querySelector('#cpa-badge-time');
    const exitBadge = this.root?.querySelector('#cpa-badge-exit');

    if (timeBadge) timeBadge.textContent = `⏱️ ${this.telemetry.durationMs}ms`;
    if (exitBadge) exitBadge.textContent = `Exit: ${this.telemetry.exitCode}`;
  }

  appendOutput(text, type = 'stdout') {
    const body = this.root?.querySelector('#cpa-terminal-body');
    if (!body) return;

    const span = document.createElement('span');
    span.className = `cpa-term-${type}`;
    span.textContent = text + '\n';
    body.appendChild(span);
    body.scrollTop = body.scrollHeight;
  }

  clearOutput() {
    const body = this.root?.querySelector('#cpa-terminal-body');
    if (body) {
      body.innerHTML = '<span class="cpa-term-info">// Console cleared.</span>';
    }
    this.emit('clearOutput');
    return this;
  }

  // --- Dynamic Getters & Setters ---
  getCode() {
    return this.code;
  }

  setCode(newCode) {
    this.code = String(newCode || '');
    const codeInput = this.root?.querySelector('#cpa-code-input');
    const codeHighlight = this.root?.querySelector('#cpa-code-highlight');
    if (codeInput) {
      codeInput.value = this.code;
      codeInput.oninput();
    }
    return this;
  }

  getLanguage() {
    return this.language;
  }

  setLanguage(newLang) {
    const resolved = resolveLanguage(newLang);
    if (resolved === this.language) return this;

    const oldLang = this.language;
    this.language = resolved;
    const langInfo = getLanguageInfo(this.language);

    // Compute canonical filename for the new language
    const filenameMap = {
      react: 'src/App.jsx',
      nextjs: 'pages/index.jsx',
      vue: 'src/App.vue',
      angular: 'src/app.component.ts',
      html: 'index.html',
      sql: 'query.sql'
    };
    const defaultFileName = filenameMap[this.language] || `main.${langInfo.ext || 'txt'}`;
    const defaultCode = getDefaultTemplate(this.language);

    // Update Virtual File System
    this.files = { [defaultFileName]: defaultCode };
    this.activeFile = defaultFileName;
    this.openFiles = [defaultFileName];
    this.code = defaultCode;

    // Update UI elements
    const codeInput = this.root?.querySelector('#cpa-code-input');
    const codeHighlight = this.root?.querySelector('#cpa-code-highlight');
    const charCount = this.root?.querySelector('#cpa-char-count');
    const lineNumbers = this.root?.querySelector('#cpa-line-numbers');
    const langSelect = this.root?.querySelector('#cpa-lang-select');
    const filenameEl = this.root?.querySelector('#cpa-editor-filename');

    if (codeInput) codeInput.value = this.code;
    if (codeHighlight) codeHighlight.innerHTML = highlightCode(this.code, this.language);
    if (charCount) charCount.textContent = `${this.code.length} chars`;
    if (langSelect) langSelect.value = this.language;
    if (filenameEl) filenameEl.textContent = `${this.activeFile} (${langInfo.name})`;

    const lines = (this.code.match(/\n/g) || []).length + 1;
    if (lineNumbers) {
      lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `<div class="cpa-line-num">${i + 1}</div>`).join('');
    }

    this.renderFileTree();
    this.renderEditorTabs();

    // Auto-switch between Web Preview vs Console Terminal based on language type
    const isPreviewLang = ['html', 'react', 'nextjs', 'vue', 'angular'].includes(this.language);
    if (isPreviewLang) {
      this.showPreview();
      this.refreshPreview();
    } else {
      this.showConsole();
      this.clearOutput();
      this.appendOutput(`// Switched to ${langInfo.name}. Click '▶ Run' to compile and execute.`, 'info');
    }

    this.emit('languageChange', { language: this.language, previous: oldLang });
    return this;
  }

  getTheme() {
    return this.theme;
  }

  setTheme(theme) {
    this.theme = theme === 'light' ? 'light' : 'dark';
    if (this.root) this.root.setAttribute('data-theme', this.theme);
    const btnTheme = this.root?.querySelector('#cpa-btn-theme');
    if (btnTheme) btnTheme.textContent = this.theme === 'dark' ? '☀️' : '🌙';
    this.emit('themeChange', this.theme);
    return this;
  }

  toggleTheme() {
    return this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  toggleFullscreen() {
    if (!this.root) return this;
    const isFs = this.root.classList.toggle('cpa-fullscreen');
    this.emit('fullscreenChange', isFs);
    return this;
  }

  // --- Dynamic Visibility Control ---
  show(componentName) {
    this.visibility.set(componentName, true);
    const el = this.root?.querySelector(`[data-component="${componentName}"]`);
    if (el) el.style.display = '';
    this.emit('visibilityChange', { component: componentName, visible: true });
    return this;
  }

  hide(componentName) {
    this.visibility.set(componentName, false);
    const el = this.root?.querySelector(`[data-component="${componentName}"]`);
    if (el) el.style.display = 'none';
    this.emit('visibilityChange', { component: componentName, visible: false });
    return this;
  }

  toggle(componentName) {
    const isVis = this.isVisible(componentName);
    return isVis ? this.hide(componentName) : this.show(componentName);
  }

  isVisible(componentName) {
    if (this.visibility.has(componentName)) {
      return this.visibility.get(componentName);
    }
    const el = this.root?.querySelector(`[data-component="${componentName}"]`);
    return el ? el.style.display !== 'none' : true;
  }

  getState() {
    return {
      language: this.language,
      layout: this.layout,
      code: this.code,
      stdin: this.stdin,
      status: this.status,
      theme: this.theme,
      telemetry: { ...this.telemetry }
    };
  }

  setState(partialState) {
    if (typeof partialState !== 'object' || partialState === null) return this;
    if (partialState.layout) this.setLayout(partialState.layout);
    if (partialState.language) this.setLanguage(partialState.language);
    if (partialState.code !== undefined) this.setCode(partialState.code);
    if (partialState.stdin !== undefined) this.stdin = partialState.stdin;
    if (partialState.theme) this.setTheme(partialState.theme);
    this.emit('stateChange', this.getState());
    return this;
  }

  // --- Event Bus ---
  on(event, fn) {
    if (!this.eventCallbacks.has(event)) this.eventCallbacks.set(event, new Set());
    this.eventCallbacks.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).delete(fn);
    }
  }

  emit(event, data) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).forEach(fn => {
        try { fn(data); } catch (err) { console.error(`[CompileAll] Error in ${event} listener:`, err); }
      });
    }
  }

  destroy() {
    this.stop();
    this.eventCallbacks.clear();
    this.listeners.clear();

    if (this.root && this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
    this.root = null;
  }
}
