import fs from 'node:fs';
import path from 'node:path';

const copyPairs = [
  { src: 'src/types/index.d.ts', dest: 'dist/types/index.d.ts' },
  { src: 'src/react/index.d.ts', dest: 'dist/react/index.d.ts' },
  { src: 'src/vue/index.d.ts', dest: 'dist/vue/index.d.ts' },
  { src: 'src/angular/index.d.ts', dest: 'dist/angular/index.d.ts' },
  { src: 'src/react-native/index.d.ts', dest: 'dist/react-native/index.d.ts' }
];

for (const pair of copyPairs) {
  if (fs.existsSync(pair.src)) {
    fs.mkdirSync(path.dirname(pair.dest), { recursive: true });
    fs.copyFileSync(pair.src, pair.dest);
  }
}
console.log('✓ TypeScript declaration files copied to dist/');
