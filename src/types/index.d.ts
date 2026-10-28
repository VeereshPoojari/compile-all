export type ExecutionStatus = 'idle' | 'compiling' | 'running' | 'success' | 'error' | 'stopped';
export type SupportedTheme = 'dark' | 'light';
export type WorkspaceLayout = 'split-h' | 'split-v' | 'editor-only' | 'terminal-only';

export interface TelemetryInfo {
  durationMs: number;
  memoryKb: number;
  exitCode: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  memoryKb: number;
  language?: string;
  isHtml?: boolean;
  framework?: string;
}

export interface LanguageInfo {
  id: string;
  name: string;
  ext: string;
  monacoId: string;
  runner: 'browser' | 'remote';
}

export interface TemplateInfo {
  label: string;
  code: string;
}

export interface CompileAllOptions {
  enabled?: boolean;
  theme?: SupportedTheme;
  language?: string;
  layout?: WorkspaceLayout;
  code?: string;
  files?: Record<string, string>;
  activeFile?: string;
  fileTree?: boolean;
  stdin?: string;
  readOnly?: boolean;
  toolbar?: boolean;
  templateSelect?: boolean;
  layoutSwitch?: boolean;
  stdinDrawer?: boolean;
  telemetry?: boolean;
  endpoint?: string | null;
  timeoutMs?: number;
  onRunStart?: (data: { language: string; code: string }) => void;
  onRunEnd?: (result: ExecutionResult) => void;
  onStateChange?: (state: any) => void;
  onError?: (error: Error) => void;
}

export interface CompileAllInstance {
  run(): Promise<ExecutionResult>;
  stop(): this;
  getCode(): string;
  setCode(code: string): this;
  getLanguage(): string;
  setLanguage(language: string): this;
  getLayout(): WorkspaceLayout;
  setLayout(layout: WorkspaceLayout): this;
  getTemplates(): TemplateInfo[];
  loadTemplate(indexOrLabel: number | string): this;
  getTheme(): SupportedTheme;
  setTheme(theme: SupportedTheme): this;
  toggleTheme(): this;
  toggleFullscreen(): this;
  clearOutput(): this;
  downloadCode(): this;
  getFiles(): Record<string, string>;
  setFiles(files: Record<string, string>, activeFile?: string): this;
  addFile(path: string, content?: string): this;
  deleteFile(path: string): this;
  openFile(path: string): this;
  closeFile(path: string): this;
  toggleFileTree(show?: boolean): this;
  getActiveFile(): string;
  loadProjectTemplate(templateKey: string): this;
  show(componentName: string): this;
  hide(componentName: string): this;
  toggle(componentName: string): this;
  isVisible(componentName: string): boolean;
  getState(): {
    language: string;
    layout: WorkspaceLayout;
    code: string;
    stdin: string;
    status: ExecutionStatus;
    theme: SupportedTheme;
    telemetry: TelemetryInfo;
  };
  setState(partialState: Record<string, any>): this;
  on(event: string, fn: (data: any) => void): () => void;
  off(event: string, fn: (data: any) => void): void;
  destroy(): void;
}

export declare class CompileAll implements CompileAllInstance {
  constructor(targetElement: HTMLElement | string, options?: CompileAllOptions);
  run(): Promise<ExecutionResult>;
  stop(): this;
  getCode(): string;
  setCode(code: string): this;
  getLanguage(): string;
  setLanguage(language: string): this;
  getLayout(): WorkspaceLayout;
  setLayout(layout: WorkspaceLayout): this;
  getTemplates(): TemplateInfo[];
  loadTemplate(indexOrLabel: number | string): this;
  getTheme(): SupportedTheme;
  setTheme(theme: SupportedTheme): this;
  toggleTheme(): this;
  toggleFullscreen(): this;
  clearOutput(): this;
  downloadCode(): this;
  getFiles(): Record<string, string>;
  setFiles(files: Record<string, string>, activeFile?: string): this;
  addFile(path: string, content?: string): this;
  deleteFile(path: string): this;
  openFile(path: string): this;
  closeFile(path: string): this;
  toggleFileTree(show?: boolean): this;
  getActiveFile(): string;
  loadProjectTemplate(templateKey: string): this;
  show(componentName: string): this;
  hide(componentName: string): this;
  toggle(componentName: string): this;
  isVisible(componentName: string): boolean;
  showPreview(): this;
  showConsole(): this;
  refreshPreview(): this;
  getState(): {
    language: string;
    layout: WorkspaceLayout;
    code: string;
    stdin: string;
    status: ExecutionStatus;
    theme: SupportedTheme;
    telemetry: TelemetryInfo;
  };
  setState(partialState: Record<string, any>): this;
  on(event: string, fn: (data: any) => void): () => void;
  off(event: string, fn: (data: any) => void): void;
  destroy(): void;
}

// Standalone Functional Tree-Shakeable API
export declare function run(instance: CompileAllInstance): Promise<ExecutionResult> | undefined;
export declare function stop(instance: CompileAllInstance): CompileAllInstance | undefined;
export declare function getCode(instance: CompileAllInstance): string;
export declare function setCode(instance: CompileAllInstance, code: string): CompileAllInstance | undefined;
export declare function getLanguage(instance: CompileAllInstance): string;
export declare function setLanguage(instance: CompileAllInstance, language: string): CompileAllInstance | undefined;
export declare function getLayout(instance: CompileAllInstance): WorkspaceLayout;
export declare function setLayout(instance: CompileAllInstance, layout: WorkspaceLayout): CompileAllInstance | undefined;
export declare function getTemplates(instance: CompileAllInstance): TemplateInfo[];
export declare function loadTemplate(instance: CompileAllInstance, indexOrLabel: number | string): CompileAllInstance | undefined;
export declare function getTheme(instance: CompileAllInstance): SupportedTheme;
export declare function setTheme(instance: CompileAllInstance, theme: SupportedTheme): CompileAllInstance | undefined;
export declare function show(instance: CompileAllInstance, componentName: string): CompileAllInstance | undefined;
export declare function hide(instance: CompileAllInstance, componentName: string): CompileAllInstance | undefined;
export declare function toggle(instance: CompileAllInstance, componentName: string): CompileAllInstance | undefined;
export declare function isVisible(instance: CompileAllInstance, componentName: string): boolean;
export declare function showPreview(instance: CompileAllInstance): CompileAllInstance | undefined;
export declare function showConsole(instance: CompileAllInstance): CompileAllInstance | undefined;
export declare function refreshPreview(instance: CompileAllInstance): CompileAllInstance | undefined;
export declare function downloadCode(instance: CompileAllInstance): CompileAllInstance | undefined;
export declare function getFiles(instance: CompileAllInstance): Record<string, string>;
export declare function setFiles(instance: CompileAllInstance, files: Record<string, string>, activeFile?: string): CompileAllInstance | undefined;
export declare function addFile(instance: CompileAllInstance, path: string, content?: string): CompileAllInstance | undefined;
export declare function deleteFile(instance: CompileAllInstance, path: string): CompileAllInstance | undefined;
export declare function openFile(instance: CompileAllInstance, path: string): CompileAllInstance | undefined;
export declare function closeFile(instance: CompileAllInstance, path: string): CompileAllInstance | undefined;
export declare function toggleFileTree(instance: CompileAllInstance, show?: boolean): CompileAllInstance | undefined;
export declare function getActiveFile(instance: CompileAllInstance): string;
export declare function loadProjectTemplate(instance: CompileAllInstance, templateKey: string): CompileAllInstance | undefined;
export declare function clearOutput(instance: CompileAllInstance): CompileAllInstance | undefined;
export declare function getState(instance: CompileAllInstance): Record<string, any>;
export declare function setState(instance: CompileAllInstance, partialState: Record<string, any>): CompileAllInstance | undefined;

export declare function resolveLanguage(input: string): string;
export declare function getLanguageInfo(langId: string): LanguageInfo;
export declare function getDefaultTemplate(langId: string): string;
export declare function getTemplatesForLanguage(langId: string): TemplateInfo[];
export declare function highlightCode(code: string, lang?: string): string;
export declare function escapeHtml(str: string): string;
