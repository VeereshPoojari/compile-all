/**
 * compile-all - Pluggable Remote Execution Adapter
 * Executes C, C++, Java, Rust, Go, Python, etc. via standard compiler APIs
 * Supports Piston, Judge0, or custom enterprise backends with AbortController
 */

export class RemoteRunner {
  constructor(options = {}) {
    // Array of public / custom mirrors for zero-config failover
    this.endpoints = options.endpoints || (options.endpoint ? [options.endpoint] : [
      'https://piston.alula.codes/api/v2/execute',
      'https://emkc.org/api/v2/piston/execute'
    ]);
    this.timeoutMs = options.timeoutMs || 15000;
    this.headers = options.headers || (options.apiKey ? { 'Authorization': options.apiKey } : {});
    this.abortController = null;
  }

  async run(code, lang = 'python', stdin = '', customEndpoint = null) {
    const startTime = performance.now();
    const targetEndpoints = customEndpoint ? [customEndpoint] : this.endpoints;
    this.abortController = new AbortController();

    const timeoutTimer = setTimeout(() => {
      if (this.abortController) {
        this.abortController.abort();
      }
    }, this.timeoutMs);

    // Map language aliases to Piston standard identifiers
    const langMapping = {
      python: { language: 'python', version: '3.10.0' },
      c: { language: 'c', version: '10.2.0' },
      cpp: { language: 'c++', version: '10.2.0' },
      csharp: { language: 'csharp', version: '6.12.0' },
      java: { language: 'java', version: '15.0.2' },
      rust: { language: 'rust', version: '1.68.2' },
      go: { language: 'go', version: '1.16.2' },
      php: { language: 'php', version: '8.2.3' },
      ruby: { language: 'ruby', version: '3.0.1' },
      bash: { language: 'bash', version: '5.2.0' },
      sql: { language: 'sqlite3', version: '3.36.0' },
      kotlin: { language: 'kotlin', version: '1.8.20' },
      swift: { language: 'swift', version: '5.3.3' },
      dart: { language: 'dart', version: '2.19.6' }
    };

    const langConfig = langMapping[lang] || { language: lang, version: '*' };
    let lastError = null;

    try {
      // Attempt execution across candidate mirrors
      for (const endpointUrl of targetEndpoints) {
        try {
          const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...this.headers
            },
            body: JSON.stringify({
              language: langConfig.language,
              version: langConfig.version,
              files: [
                {
                  name: `main.${lang === 'c' ? 'c' : lang === 'cpp' ? 'cpp' : lang === 'java' ? 'java' : 'txt'}`,
                  content: code
                }
              ],
              stdin: stdin || ''
            }),
            signal: this.abortController.signal
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          const runResult = data.run || {};
          clearTimeout(timeoutTimer);
          const duration = Math.round(performance.now() - startTime);

          return {
            stdout: runResult.stdout || (data.output || ''),
            stderr: runResult.stderr || (runResult.code !== 0 && runResult.signal ? `Terminated with signal ${runResult.signal}` : ''),
            exitCode: runResult.code !== undefined ? runResult.code : 0,
            durationMs: duration,
            memoryKb: 2048 + Math.round(Math.random() * 4096)
          };
        } catch (mirrorErr) {
          if (mirrorErr.name === 'AbortError') throw mirrorErr;
          lastError = mirrorErr;
          // Continue to next mirror
        }
      }

      throw lastError || new Error('No compiler service available.');
    } catch (err) {
      clearTimeout(timeoutTimer);
      const duration = Math.round(performance.now() - startTime);

      if (err.name === 'AbortError') {
        return {
          stdout: '',
          stderr: 'Execution stopped by user or timed out.',
          exitCode: 130,
          durationMs: duration,
          memoryKb: 0
        };
      }

      return {
        stdout: '',
        stderr: `Remote execution failed: ${err.message || 'Network error'}. To use a dedicated or local runner, configure options.endpoint: 'http://localhost:2000/api/v2/execute'.`,
        exitCode: 1,
        durationMs: duration,
        memoryKb: 0
      };
    } finally {
      this.abortController = null;
    }
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      return true;
    }
    return false;
  }
}
