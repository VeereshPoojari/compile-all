/**
 * compile-all - Universal Language Registry & Detector
 * Zero external dependencies
 * Supports 45+ languages with file extension & alias resolution
 */

export const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', ext: 'js', monacoId: 'javascript', runner: 'browser' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts', monacoId: 'typescript', runner: 'browser' },
  { id: 'react', name: 'React (JSX / TSX)', ext: 'jsx', monacoId: 'javascript', runner: 'browser' },
  { id: 'vue', name: 'Vue 3', ext: 'vue', monacoId: 'html', runner: 'browser' },
  { id: 'angular', name: 'Angular', ext: 'ts', monacoId: 'typescript', runner: 'browser' },
  { id: 'nextjs', name: 'Next.js', ext: 'jsx', monacoId: 'javascript', runner: 'browser' },
  { id: 'python', name: 'Python', ext: 'py', monacoId: 'python', runner: 'remote' },
  { id: 'html', name: 'HTML / Web', ext: 'html', monacoId: 'html', runner: 'browser' },
  { id: 'cpp', name: 'C++', ext: 'cpp', monacoId: 'cpp', runner: 'remote' },
  { id: 'c', name: 'C', ext: 'c', monacoId: 'c', runner: 'remote' },
  { id: 'rust', name: 'Rust', ext: 'rs', monacoId: 'rust', runner: 'remote' },
  { id: 'go', name: 'Go (Golang)', ext: 'go', monacoId: 'go', runner: 'remote' },
  { id: 'java', name: 'Java', ext: 'java', monacoId: 'java', runner: 'remote' },
  { id: 'csharp', name: 'C#', ext: 'cs', monacoId: 'csharp', runner: 'remote' },
  { id: 'php', name: 'PHP', ext: 'php', monacoId: 'php', runner: 'remote' },
  { id: 'ruby', name: 'Ruby', ext: 'rb', monacoId: 'ruby', runner: 'remote' },
  { id: 'bash', name: 'Bash / Shell', ext: 'sh', monacoId: 'shell', runner: 'remote' },
  { id: 'sql', name: 'SQL', ext: 'sql', monacoId: 'sql', runner: 'browser' },
  { id: 'json', name: 'JSON', ext: 'json', monacoId: 'json', runner: 'browser' },
  { id: 'kotlin', name: 'Kotlin', ext: 'kt', monacoId: 'kotlin', runner: 'remote' },
  { id: 'swift', name: 'Swift', ext: 'swift', monacoId: 'swift', runner: 'remote' },
  { id: 'dart', name: 'Dart', ext: 'dart', monacoId: 'dart', runner: 'remote' },
  { id: 'r', name: 'R', ext: 'r', monacoId: 'r', runner: 'remote' },
  { id: 'lua', name: 'Lua', ext: 'lua', monacoId: 'lua', runner: 'remote' },
  { id: 'perl', name: 'Perl', ext: 'pl', monacoId: 'perl', runner: 'remote' },
  { id: 'scala', name: 'Scala', ext: 'scala', monacoId: 'scala', runner: 'remote' },
  { id: 'elixir', name: 'Elixir', ext: 'ex', monacoId: 'elixir', runner: 'remote' },
  { id: 'haskell', name: 'Haskell', ext: 'hs', monacoId: 'haskell', runner: 'remote' }
];

const ALIAS_MAP = {
  js: 'javascript',
  ts: 'typescript',
  react: 'react',
  jsx: 'react',
  tsx: 'react',
  reactjs: 'react',
  vue: 'vue',
  vue3: 'vue',
  vuejs: 'vue',
  angular: 'angular',
  ng: 'angular',
  angularjs: 'angular',
  next: 'nextjs',
  nextjs: 'nextjs',
  'next.js': 'nextjs',
  py: 'python',
  python3: 'python',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  cs: 'csharp',
  'c#': 'csharp',
  java: 'java',
  rs: 'rust',
  rust: 'rust',
  go: 'go',
  golang: 'go',
  php: 'php',
  rb: 'ruby',
  ruby: 'ruby',
  sh: 'bash',
  shell: 'bash',
  bash: 'bash',
  sql: 'sql',
  json: 'json',
  kt: 'kotlin',
  swift: 'swift',
  dart: 'dart',
  r: 'r',
  lua: 'lua',
  pl: 'perl',
  scala: 'scala',
  ex: 'elixir',
  hs: 'haskell',
  html: 'html',
  xml: 'html'
};

export const MULTI_TEMPLATES = {
  javascript: [
    { label: 'Basic (Sum & Array)', code: `// JavaScript (Node / Browser ES6+)\nconsole.log("Hello from compile-all!");\n\nconst numbers = [1, 2, 3, 4, 5];\nconst sum = numbers.reduce((acc, n) => acc + n, 0);\nconsole.log("Sum:", sum);\n` },
    { label: 'Async / Await & Promises', code: `// Async / Await Demo\nasync function simulateFetch() {\n  console.log("Fetching simulated data...");\n  await new Promise(r => setTimeout(r, 100));\n  return { status: 200, users: ["Alice", "Bob", "Charlie"] };\n}\n\nconst data = await simulateFetch();\nconsole.log("Response:", JSON.stringify(data, null, 2));\n` },
    { label: 'Classes & OOP', code: `// Modern Class & Inheritance\nclass Developer {\n  constructor(name, language) {\n    this.name = name;\n    this.language = language;\n  }\n  code() {\n    return \`\${this.name} is coding in \${this.language}!\`;\n  }\n}\n\nconst dev = new Developer("Veeresh", "TypeScript");\nconsole.log(dev.code());\n` },
    { label: 'Algorithm (Two Sum)', code: `// Two Sum Algorithm O(n)\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\nconsole.log("Two Sum indices for [2, 7, 11, 15], target 9:", twoSum([2, 7, 11, 15], 9));\n` }
  ],
  typescript: [
    { label: 'Interface & Generics', code: `// TypeScript Playground\ninterface User<T> {\n  id: number;\n  name: string;\n  metadata: T;\n}\n\nconst user: User<{ role: string }> = {\n  id: 101,\n  name: "Developer",\n  metadata: { role: "Architect" }\n};\n\nconsole.log(\`User: \${user.name}, Role: \${user.metadata.role}\`);\n` }
  ],
  react: [
    {
      label: 'Interactive Counter (Hooks)',
      code: `// React 18 / 19 Interactive Component\nimport React, { useState } from 'react';\n\nexport default function CounterApp() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div style={{\n      fontFamily: 'system-ui, -apple-system, sans-serif',\n      padding: '32px',\n      background: '#0f172a',\n      color: '#f8fafc',\n      minHeight: '100vh'\n    }}>\n      <h1 style={{ color: '#61dafb', margin: '0 0 8px 0' }}>⚛️ React in compile-all</h1>\n      <p style={{ color: '#94a3b8' }}>Compiled in-browser with Babel Standalone!</p>\n      \n      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>\n        <button\n          onClick={() => setCount(count - 1)}\n          style={{ padding: '8px 16px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '18px' }}\n        >\n          -\n        </button>\n        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8' }}>{count}</span>\n        <button\n          onClick={() => setCount(count + 1)}\n          style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '18px' }}\n        >\n          +\n        </button>\n      </div>\n    </div>\n  );\n}\n`
    }
  ],
  vue: [
    {
      label: 'Single File / Composition API',
      code: `<!-- Vue 3 Single File / Composition API Component -->\n<template>\n  <div class="vue-container">\n    <h1>🟢 Vue 3 in compile-all</h1>\n    <p>Running natively in-browser with reactive Composition API!</p>\n    \n    <div class="counter-box">\n      <button @click="decrement">-</button>\n      <span class="count">{{ count }}</span>\n      <button class="primary" @click="increment">+</button>\n    </div>\n\n    <p v-if="count > 5" class="badge">🔥 High count streak!</p>\n  </div>\n</template>\n\n<script>\nimport { ref } from 'vue';\n\nexport default {\n  setup() {\n    const count = ref(0);\n    const increment = () => count.value++;\n    const decrement = () => count.value--;\n    return { count, increment, decrement };\n  }\n};\n</script>\n\n<style>\n  body { margin: 0; background: #0f172a; font-family: system-ui, sans-serif; }\n  .vue-container { padding: 32px; color: #f8fafc; }\n  h1 { color: #42b883; margin: 0 0 8px 0; }\n  p { color: #94a3b8; }\n  .counter-box { display: flex; align-items: center; gap: 16px; margin-top: 24px; }\n  button { padding: 8px 18px; border-radius: 6px; border: none; font-size: 18px; cursor: pointer; background: #334155; color: #fff; }\n  button.primary { background: #42b883; color: #000; font-weight: bold; }\n  .count { font-size: 24px; font-weight: bold; color: #42b883; }\n  .badge { color: #f59e0b; font-weight: bold; margin-top: 16px; }\n</style>\n`
    },
    {
      label: 'Vue 3 + TypeScript (Babel Standalone)',
      code: `<!-- Vue 3 + TypeScript (Babel Standalone) -->\n<template>\n  <div class="vue-card">\n    <h1>🟢 Vue 3 + TypeScript</h1>\n    <p>Babel Standalone transpiles TypeScript in &lt;script&gt; on the fly!</p>\n    <div class="counter">\n      <button @click="decrement">-</button>\n      <span class="count">{{ count }}</span>\n      <button class="primary" @click="increment">+</button>\n    </div>\n    <p v-if="user">Active User: <strong>{{ user.name }} ({{ user.role }})</strong></p>\n  </div>\n</template>\n\n<script lang="ts">\nimport { ref } from 'vue';\n\ninterface UserProfile {\n  id: number;\n  name: string;\n  role: string;\n}\n\nexport default {\n  setup() {\n    const count = ref<number>(0);\n    const user = ref<UserProfile>({\n      id: 1,\n      name: 'Veeresh',\n      role: 'Full Stack Engineer'\n    });\n    const increment = () => { count.value++; };\n    const decrement = () => { count.value--; };\n    return { count, user, increment, decrement };\n  }\n};\n</script>\n\n<style>\n  body { margin: 0; background: #0f172a; font-family: system-ui, sans-serif; }\n  .vue-card { padding: 32px; color: #f8fafc; }\n  h1 { color: #42b883; margin: 0 0 8px 0; }\n  p { color: #94a3b8; }\n  .counter { display: flex; align-items: center; gap: 16px; margin: 20px 0; }\n  button { padding: 8px 18px; border-radius: 6px; border: none; font-size: 18px; cursor: pointer; background: #334155; color: #fff; }\n  button.primary { background: #42b883; color: #000; font-weight: bold; }\n  .count { font-size: 24px; font-weight: bold; color: #42b883; }\n</style>\n`
    }
  ],
  angular: [
    {
      label: 'Standalone Component with Signals',
      code: `// Angular Standalone Component with Signals\nimport { Component, signal } from '@angular/core';\n\n@Component({\n  selector: 'app-root',\n  standalone: true,\n  template: \`\n    <div class="angular-card">\n      <h1>🔺 Angular in compile-all</h1>\n      <p>Modern Angular Standalone Component with Signals!</p>\n\n      <div class="controls">\n        <button (click)="decrement()">-</button>\n        <span class="value">{{ count() }}</span>\n        <button class="btn-primary" (click)="increment()">+</button>\n      </div>\n    </div>\n  \`,\n  styles: [\`\n    .angular-card { padding: 32px; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; }\n    h1 { color: #dd0031; margin-bottom: 8px; }\n    p { color: #94a3b8; }\n    .controls { display: flex; align-items: center; gap: 16px; margin-top: 24px; }\n    button { padding: 8px 18px; border-radius: 6px; border: none; background: #334155; color: #fff; font-size: 18px; cursor: pointer; }\n    .btn-primary { background: #dd0031; font-weight: bold; }\n    .value { font-size: 24px; font-weight: bold; color: #dd0031; }\n  \`]\n})\nexport class AppComponent {\n  count = signal(0);\n\n  increment() {\n    this.count.update(n => n + 1);\n  }\n\n  decrement() {\n    this.count.update(n => n - 1);\n  }\n}\n`
    },
    {
      label: 'AngularJS 1.8 (Scope & Controller)',
      code: `<!-- AngularJS 1.8 CDN Sandbox -->\n<div ng-app="app" ng-controller="MainCtrl" style="padding: 32px; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh;">\n  <h1 style="color: #dd0031; margin-bottom: 8px;">🔺 AngularJS 1.8 in compile-all</h1>\n  <p style="color: #94a3b8;">Native two-way data binding and $scope execution in-browser!</p>\n\n  <div style="margin: 20px 0;">\n    <input type="text" ng-model="name" placeholder="Enter your name" style="padding: 8px 12px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 15px;" />\n    <h3 style="margin-top: 12px; color: #38bdf8;">Hello, {{ name || 'AngularJS Developer' }}!</h3>\n  </div>\n\n  <div style="display: flex; align-items: center; gap: 14px; margin-top: 20px;">\n    <button ng-click="decrement()" style="padding: 8px 16px; background: #334155; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 18px;">-</button>\n    <span style="font-size: 24px; font-weight: bold; color: #dd0031;">{{ count }}</span>\n    <button ng-click="increment()" style="padding: 8px 16px; background: #dd0031; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 18px; font-weight: bold;">+</button>\n  </div>\n</div>\n\n<script>\n  angular.module('app', [])\n    .controller('MainCtrl', function($scope) {\n      $scope.name = 'Veeresh';\n      $scope.count = 0;\n      $scope.increment = function() { $scope.count++; };\n      $scope.decrement = function() { $scope.count--; };\n    });\n</script>\n`
    }
  ],
  nextjs: [
    {
      label: 'Page Component with Router',
      code: `// Next.js App / Page Component with Simulated Next Router\nimport React, { useState } from 'react';\nimport { useRouter } from 'next/router';\nimport Link from 'next/link';\n\nexport default function NextPage() {\n  const router = useRouter();\n  const [visited, setVisited] = useState(['/']);\n\n  const navigateTo = (path) => {\n    router.push(path);\n    setVisited((prev) => [...prev, path]);\n  };\n\n  return (\n    <div style={{\n      fontFamily: 'system-ui, -apple-system, sans-serif',\n      padding: '32px',\n      background: '#000',\n      color: '#fff',\n      minHeight: '100vh'\n    }}>\n      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>\n        <h1 style={{ margin: 0, fontSize: '28px' }}>▲ Next.js</h1>\n        <span style={{ background: '#222', border: '1px solid #444', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>Live Playground</span>\n      </div>\n      <p style={{ color: '#888', marginTop: '8px' }}>Active route: <strong style={{ color: '#0070f3' }}>{router.pathname}</strong></p>\n\n      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>\n        <button\n          onClick={() => navigateTo('/dashboard')}\n          style={{ padding: '10px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}\n        >\n          Go to /dashboard\n        </button>\n        <button\n          onClick={() => navigateTo('/analytics')}\n          style={{ padding: '10px 16px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}\n        >\n          Go to /analytics\n        </button>\n      </div>\n\n      <div style={{ marginTop: '24px', padding: '16px', background: '#111', borderRadius: '8px', border: '1px solid #222' }}>\n        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#aaa' }}>Navigation History:</h3>\n        <ul style={{ margin: 0, paddingLeft: '20px', color: '#ccc', fontSize: '13px' }}>\n          {visited.map((p, i) => <li key={i}>{p}</li>)}\n        </ul>\n      </div>\n    </div>\n  );\n}\n`
    }
  ],
  python: [
    { label: 'Basic (Fibonacci)', code: `# Python 3 Script\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\nprint("First 8 Fibonacci numbers:")\nprint(list(fibonacci(8)))\n` },
    { label: 'List Comprehension & Dictionaries', code: `# Data Manipulation in Python\nusers = [\n    {"name": "Alice", "role": "admin", "score": 92},\n    {"name": "Bob", "role": "developer", "score": 85},\n    {"name": "Charlie", "role": "designer", "score": 89}\n]\n\nhigh_scorers = [u["name"] for u in users if u["score"] > 88]\nprint("High Scorers (>88):", high_scorers)\n` },
    { label: 'Math & Statistics', code: `import statistics\n\ndata = [12, 15, 12, 18, 19, 21, 24, 18, 18, 25]\nprint("Mean:", statistics.mean(data))\nprint("Median:", statistics.median(data))\nprint("Mode:", statistics.mode(data))\n` }
  ],
  cpp: [
    { label: 'Basic (Vector & Sum)', code: `// C++ 20 Program\n#include <iostream>\n#include <vector>\n#include <numeric>\n\nint main() {\n    std::vector<int> nums = {10, 20, 30, 40};\n    int sum = std::accumulate(nums.begin(), nums.end(), 0);\n    std::cout << "Sum: " << sum << std::endl;\n    return 0;\n}\n` },
    { label: 'Lambdas & Custom Sorting', code: `// C++ Modern Lambdas & Sorting\n#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<std::string> names = {"Rust", "Python", "C++", "Go", "Java"};\n    std::sort(names.begin(), names.end(), [](const auto& a, const auto& b) {\n        return a.length() < b.length();\n    });\n    for (const auto& s : names) std::cout << s << " ";\n    std::cout << std::endl;\n    return 0;\n}\n` }
  ],
  c: [
    { label: 'Basic (Hello World)', code: `// C Program\n#include <stdio.h>\n\nint main() {\n    printf("Hello from C in compile-all!\\n");\n    return 0;\n}\n` }
  ],
  rust: [
    { label: 'Basic (Hello World)', code: `// Rust Program\nfn main() {\n    let message = "Hello from Rust in compile-all!";\n    println!("{}", message);\n}\n` },
    { label: 'Pattern Matching & Enums', code: `enum Status {\n    Success(String),\n    Error(u32),\n}\n\nfn main() {\n    let result = Status::Success("Operation succeeded!".to_string());\n    match result {\n        Status::Success(msg) => println!("OK: {}", msg),\n        Status::Error(code) => println!("Err: {}", code),\n    }\n}\n` }
  ],
  go: [
    { label: 'Basic (Hello World)', code: `// Go (Golang) Program\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go in compile-all!")\n}\n` }
  ],
  java: [
    { label: 'Basic (Hello World)', code: `// Java Program\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java in compile-all!");\n    }\n}\n` }
  ],
  csharp: [
    { label: 'Basic (Hello World)', code: `// C# Program\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello from C# in compile-all!");\n    }\n}\n` }
  ],
  php: [
    { label: 'Basic (Array Print)', code: `<?php\n// PHP Script\necho "Hello from PHP in compile-all!\\n";\n$arr = ["Frameworks" => ["React", "Vue", "Angular"]];\nprint_r($arr);\n` }
  ],
  ruby: [
    { label: 'Basic (Iteration)', code: `# Ruby Script\nputs "Hello from Ruby in compile-all!"\n3.times { |i| puts "Iteration #{i + 1}" }\n` }
  ],
  bash: [
    { label: 'System Commands', code: `#!/bin/bash\necho "Current date: $(date)"\necho "System Architecture: $(uname -m)"\n` }
  ],
  sql: [
    {
      label: 'Interactive Table & Query',
      code: `-- In-Memory SQL Query Engine\nCREATE TABLE employees (id INT, name TEXT, role TEXT, salary INT);\n\nINSERT INTO employees VALUES (1, 'Alice', 'Lead Engineer', 135000);\nINSERT INTO employees VALUES (2, 'Bob', 'UI/UX Designer', 98000);\nINSERT INTO employees VALUES (3, 'Charlie', 'Engineering Manager', 155000);\nINSERT INTO employees VALUES (4, 'Diana', 'Data Scientist', 140000);\n\nSELECT * FROM employees WHERE salary >= 100000 ORDER BY salary DESC;\n`
    },
    {
      label: 'Basic Expression',
      code: `-- SQL Expression\nSELECT 'Hello from compile-all SQL!' AS greeting, 2026 AS year, 'Success' AS status;\n`
    }
  ],
  html: [
    { label: 'Interactive HTML Web Card', code: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; }\n    h1 { color: #38bdf8; margin-bottom: 8px; }\n    button { padding: 10px 18px; border-radius: 8px; background: #2563eb; color: #fff; border: none; cursor: pointer; font-weight: 600; }\n    button:hover { background: #1d4ed8; }\n  </style>\n</head>\n<body>\n  <h1>⚡ Interactive Web Sandbox</h1>\n  <p>Rendered live with 100% responsiveness!</p>\n  <br/>\n  <button onclick="alert('Hello from compile-all!')">Click Me</button>\n</body>\n</html>\n` }
  ],
  json: [
    { label: 'Sample JSON Schema', code: `{\n  "name": "compile-all",\n  "status": "ready",\n  "version": "1.0.0"\n}\n` }
  ]
};

export const DEFAULT_CODE_TEMPLATES = Object.fromEntries(
  Object.entries(MULTI_TEMPLATES).map(([lang, templates]) => [lang, templates[0]?.code || ''])
);

export function resolveLanguage(input) {
  if (!input || typeof input !== 'string') return 'javascript';
  const clean = input.trim().toLowerCase();
  const resolved = ALIAS_MAP[clean] || clean;
  const match = SUPPORTED_LANGUAGES.find(l => l.id === resolved || l.ext === resolved);
  return match ? match.id : 'javascript';
}

export function getLanguageInfo(langId) {
  const resolved = resolveLanguage(langId);
  return SUPPORTED_LANGUAGES.find(l => l.id === resolved) || SUPPORTED_LANGUAGES[0];
}

export function getDefaultTemplate(langId) {
  const resolved = resolveLanguage(langId);
  return DEFAULT_CODE_TEMPLATES[resolved] || `// ${resolved} code\n`;
}

export function getTemplatesForLanguage(langId) {
  const resolved = resolveLanguage(langId);
  return MULTI_TEMPLATES[resolved] || [{ label: 'Starter', code: getDefaultTemplate(resolved) }];
}
