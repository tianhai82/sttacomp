import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only';
import sveltePreprocess from 'svelte-preprocess';

import rollup_start_dev from './rollup_start_dev.js';

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/bundle.js'
	},
	plugins: [
		svelte({
			preprocess: sveltePreprocess({ postcss: true }),
			compilerOptions: {
				dev: !production,
			},
		}),

		// Extract CSS from Svelte components into a separate file
		css({ output: 'bundle.css' }),

		resolve({
			browser: true,
			dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
		}),
		commonjs(),

		!production && rollup_start_dev,
		!production && livereload('public'),
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
