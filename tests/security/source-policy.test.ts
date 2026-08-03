import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const sourceDirectory = resolve(testDirectory, '..', '..', 'src');

test('production source does not use network, Node filesystem, Electron, or adapter APIs', () => {
	const source = collectTypeScript(sourceDirectory)
		.map((file) => readFileSync(file, 'utf8'))
		.join('\n');

	for (const pattern of [
		/\b(?:node:)?fs\b/,
		/\belectron\b/,
		/\bchild_process\b/,
		/\b(?:http|https|net|tls|dgram)\b/,
		/\b(?:fetch|requestUrl|XMLHttpRequest|WebSocket)\s*\(/,
		/\.adapter\b/,
		/\bprocess\./,
	]) {
		assert.doesNotMatch(source, pattern);
	}
});

function collectTypeScript(directory: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectTypeScript(path));
		} else if (entry.isFile() && extname(entry.name) === '.ts') {
			files.push(path);
		}
	}
	return files;
}
