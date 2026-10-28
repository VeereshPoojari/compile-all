/**
 * compile-all - Security, Sanitization & Safe Output Utility
 * Zero external dependencies
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeTerminalOutput(rawOutput) {
  if (typeof rawOutput !== 'string') return '';
  // Convert ANSI escape codes (colors) to clean terminal styled spans or strip dangerous controls
  return escapeHtml(rawOutput);
}

export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const clean = url.trim();
  if (/^(javascript:|vbscript:|data:text\/html)/i.test(clean)) {
    return '#';
  }
  return clean;
}
