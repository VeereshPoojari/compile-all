/**
 * compile-all - Universal Zero-Dependency Online Compiler & Code Execution Engine
 * Main Entry Point & Tree-Shakeable Standalone Functional API
 */

import { CompileAll } from './core/CompileAll.js';
export { CompileAll };
export { BrowserRunner } from './engines/browserRunner.js';
export { RemoteRunner } from './engines/remoteRunner.js';
export { resolveLanguage, getLanguageInfo, getDefaultTemplate, getTemplatesForLanguage, SUPPORTED_LANGUAGES } from './utils/languageDetector.js';
export { highlightCode } from './utils/syntaxHighlighter.js';
export { escapeHtml, sanitizeTerminalOutput, sanitizeUrl } from './utils/security.js';
export { PROJECT_TEMPLATES } from './utils/projectTemplates.js';

// --- Universal Tree-Shakeable Functional Helpers (Get/Set & Visibility) ---
export function run(instance) {
  return instance?.run?.();
}

export function stop(instance) {
  return instance?.stop?.();
}

export function getCode(instance) {
  return instance?.getCode?.() ?? '';
}

export function setCode(instance, code) {
  return instance?.setCode?.(code);
}

export function getLanguage(instance) {
  return instance?.getLanguage?.() ?? 'javascript';
}

export function setLanguage(instance, language) {
  return instance?.setLanguage?.(language);
}

export function getTheme(instance) {
  return instance?.getTheme?.() ?? 'dark';
}

export function setTheme(instance, theme) {
  return instance?.setTheme?.(theme);
}

export function getLayout(instance) {
  return instance?.getLayout?.() ?? 'split-h';
}

export function setLayout(instance, layout) {
  return instance?.setLayout?.(layout);
}

export function getTemplates(instance) {
  return instance?.getTemplates?.() ?? [];
}

export function loadTemplate(instance, indexOrLabel) {
  return instance?.loadTemplate?.(indexOrLabel);
}

export function show(instance, componentName) {
  return instance?.show?.(componentName);
}

export function hide(instance, componentName) {
  return instance?.hide?.(componentName);
}

export function toggle(instance, componentName) {
  return instance?.toggle?.(componentName);
}

export function isVisible(instance, componentName) {
  return instance?.isVisible?.(componentName) ?? false;
}

export function clearOutput(instance) {
  return instance?.clearOutput?.();
}

export function getState(instance) {
  return instance?.getState?.() ?? {};
}

export function setState(instance, partialState) {
  return instance?.setState?.(partialState);
}

export function showPreview(instance) {
  return instance?.showPreview?.();
}

export function showConsole(instance) {
  return instance?.showConsole?.();
}

export function getTerminalTabPosition(instance) {
  return instance?.getTerminalTabPosition?.() ?? 'left';
}

export function setTerminalTabPosition(instance, position) {
  return instance?.setTerminalTabPosition?.(position);
}

export function refreshPreview(instance) {
  return instance?.refreshPreview?.();
}

export function downloadCode(instance) {
  return instance?.downloadCode?.();
}

// --- Virtual File System (VFS) & StackBlitz-Style Multi-File Helpers ---
export function getFiles(instance) {
  return instance?.getFiles?.() ?? {};
}

export function setFiles(instance, files, activeFile) {
  return instance?.setFiles?.(files, activeFile);
}

export function addFile(instance, path, content) {
  return instance?.addFile?.(path, content);
}

export function deleteFile(instance, path) {
  return instance?.deleteFile?.(path);
}

export function openFile(instance, path) {
  return instance?.openFile?.(path);
}

export function closeFile(instance, path) {
  return instance?.closeFile?.(path);
}

export function toggleFileTree(instance, show) {
  return instance?.toggleFileTree?.(show);
}

export function getActiveFile(instance) {
  return instance?.getActiveFile?.() ?? '';
}

export function loadProjectTemplate(instance, templateKey) {
  return instance?.loadProjectTemplate?.(templateKey);
}

export default CompileAll;
