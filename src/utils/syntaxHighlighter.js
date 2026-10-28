/**
 * compile-all - Ultra-Fast Zero-Dependency Syntax Highlighter
 * Tokenizes keywords, strings, comments, numbers, types, functions, and operators
 */
import { escapeHtml } from './security.js';

const KEYWORDS = new Set([
  'abstract', 'arguments', 'as', 'async', 'await', 'boolean', 'break', 'byte',
  'case', 'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends', 'false',
  'final', 'finally', 'float', 'for', 'from', 'function', 'get', 'goto', 'if',
  'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let', 'long',
  'native', 'new', 'null', 'of', 'package', 'private', 'protected', 'public',
  'return', 'set', 'short', 'static', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void',
  'volatile', 'while', 'with', 'yield', 'def', 'elif', 'lambda', 'pass',
  'print', 'raise', 'nonlocal', 'global', 'del', 'fn', 'mut', 'impl', 'pub',
  'struct', 'trait', 'where', 'use', 'mod', 'crate', 'type', 'namespace',
  'using', 'cout', 'cin', 'endl', 'include', 'define',
  'Component', 'signal', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback',
  'useRouter', 'ref', 'reactive', 'computed', 'template', 'setup'
]);

export function highlightCode(code, lang = 'javascript') {
  if (!code) return '';

  const lines = code.split('\n');
  return lines.map(line => highlightLine(line, lang)).join('\n');
}

function highlightLine(line, lang) {
  if (!line) return '';

  // Regex token scanner
  const tokenRegex = /(".*?"|'.*?'|`.*?`|\/\/.*$|#.*$|\/\*[\s\S]*?\*\/|\b\d+(\.\d+)?\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b|[+\-*/%=<>!&|^~?:;,.()\[\]{}])/g;

  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(line)) !== null) {
    // Append non-matching whitespace/characters
    if (match.index > lastIndex) {
      result += escapeHtml(line.substring(lastIndex, match.index));
    }

    const token = match[0];

    // String literals
    if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      result += `<span class="cpa-tok-string">${escapeHtml(token)}</span>`;
    }
    // Comments
    else if (token.startsWith('//') || token.startsWith('#') || token.startsWith('/*')) {
      result += `<span class="cpa-tok-comment">${escapeHtml(token)}</span>`;
    }
    // Numbers
    else if (/^\d/.test(token)) {
      result += `<span class="cpa-tok-number">${escapeHtml(token)}</span>`;
    }
    // Keywords & Identifiers
    else if (KEYWORDS.has(token)) {
      result += `<span class="cpa-tok-keyword">${escapeHtml(token)}</span>`;
    }
    // Function calls (word followed by open paren)
    else if (/^[a-zA-Z_$]/.test(token)) {
      const rest = line.substring(match.index + token.length).trim();
      if (rest.startsWith('(')) {
        result += `<span class="cpa-tok-function">${escapeHtml(token)}</span>`;
      } else {
        result += escapeHtml(token);
      }
    }
    // Operators and punctuation
    else {
      result += escapeHtml(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    result += escapeHtml(line.substring(lastIndex));
  }

  return result;
}
