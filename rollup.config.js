import commonjs from '@rollup/plugin-commonjs';
import html from 'rollup-plugin-html2';
import livereload from 'rollup-plugin-livereload';
import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import preprocess from 'svelte-preprocess';
import { transformSync } from '@swc/core';
import scss from "rollup-plugin-scss";

const isDev = process.env.NODE_ENV === 'development';
const buildDir = 'dist';
const port = 3000;

// define all our plugins
const plugins = [
	svelte({
		dev: isDev,
		// extract all styles to an external file
		css: css => {
			css.write(`style.css`); // ${buildDir}/
		},
		preprocess: preprocess({
			typescript({ content }) {
				// use SWC to transpile TS scripts in Svelte files
				const { code } = transformSync(content, {
					jsc: {
						parser: { syntax: 'typescript' }
					}
				});
				return { code };
			}
		}),
		extensions: ['.svelte'],
	}),
	scss(),
	typescript({ sourceMap: isDev }),
	resolve({
		browser: true,
		dedupe: ['svelte'],
	}),
	commonjs(),
	// injects your bundles into index page
	html({
		template: 'public/index.html',
		fileName: 'index.html',
	}),
];

if (isDev) {
	plugins.push(
		// like a webpack-dev-server
		serve({
			contentBase: buildDir,
			historyApiFallback: true, // for SPAs
			port,
		}),
		livereload({ watch: buildDir })
	);
} else {
	// plugins.push(terser({ sourcemap: isDev }));
	plugins.push(terser());
}

module.exports = {
	input: 'src/main.ts',
	output: {
		name: 'app',
		file: `${buildDir}/app.js`,
		sourcemap: isDev,
		format: 'iife',
	},
	plugins,
};