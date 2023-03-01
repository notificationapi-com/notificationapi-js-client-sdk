import commonjs from 'rollup-plugin-commonjs';
import babel from '@rollup/plugin-babel';
import filesize from 'rollup-plugin-filesize';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const entryPoint = 'src/index.ts';

const plugins = [
  typescript(),
  commonjs(),
  babel({
    exclude: 'node_modules/**'
  }),
  filesize()
];

const configs = [
  {
    input: entryPoint,
    output: {
      name: 'NotificationAPIClient',
      file: './dist/index.js',
      format: 'umd',
      sourcemap: true
    },
    plugins: plugins
  },
  {
    input: entryPoint,
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: plugins
  },
  {
    input: entryPoint,
    output: {
      file: 'dist/index.es.js',
      format: 'es',
      sourcemap: true
    },
    plugins: plugins
  },
  {
    input: './dist/dts/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
];

export default configs;
