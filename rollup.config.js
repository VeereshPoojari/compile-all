import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';

const pkgName = 'compile-all';
const globalVarName = 'CompileAll';

export default [
  // 1. Core Vanilla Library (ESM, CJS, UMD)
  {
    input: 'src/index.js',
    output: [
      { file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
      { file: 'dist/index.js', format: 'cjs', exports: 'named', sourcemap: true },
      { file: 'dist/index.umd.js', format: 'umd', name: globalVarName, exports: 'named', sourcemap: true }
    ],
    plugins: [
      resolve({ browser: true }),
      commonjs()
    ]
  },
  // 2. React Adapter
  {
    input: 'src/react/index.js',
    external: ['react', 'react-dom'],
    output: [
      { file: 'dist/react/index.js', format: 'cjs', exports: 'named', sourcemap: true },
      { file: 'dist/react/index.esm.js', format: 'esm', sourcemap: true }
    ],
    plugins: [resolve(), commonjs()]
  },
  // 3. Vue 3 Adapter
  {
    input: 'src/vue/index.js',
    external: ['vue'],
    output: [
      { file: 'dist/vue/index.js', format: 'cjs', exports: 'named', sourcemap: true },
      { file: 'dist/vue/index.esm.js', format: 'esm', sourcemap: true }
    ],
    plugins: [resolve(), commonjs()]
  },
  // 4. Angular Adapter
  {
    input: 'src/angular/index.js',
    external: [/^@angular\//, 'rxjs'],
    output: [
      { file: 'dist/angular/index.js', format: 'cjs', exports: 'named', sourcemap: true },
      { file: 'dist/angular/index.esm.js', format: 'esm', sourcemap: true }
    ],
    plugins: [resolve(), commonjs()]
  },
  // 5. React Native Adapter
  {
    input: 'src/react-native/index.js',
    external: ['react', 'react-native'],
    output: [
      { file: 'dist/react-native/index.js', format: 'cjs', exports: 'named', sourcemap: true },
      { file: 'dist/react-native/index.esm.js', format: 'esm', sourcemap: true }
    ],
    plugins: [resolve(), commonjs()]
  },
  // 6. Scoped CSS Extraction
  {
    input: `src/styles/${pkgName}.css`,
    output: { file: `dist/${pkgName}.css` },
    plugins: [
      postcss({
        extract: true,
        minimize: true
      })
    ]
  }
];
