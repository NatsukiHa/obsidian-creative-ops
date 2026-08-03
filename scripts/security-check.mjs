import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = resolve(rootDirectory, 'src');
const sourceFiles = collectFiles(sourceDirectory, new Set(['.ts']));
const findings = [];

for (const file of sourceFiles) {
	const content = readFileSync(file, 'utf8');
	for (const [label, pattern] of [
		['Node filesystem API', /\b(?:node:)?fs\b/],
		['Electron API', /\belectron\b/],
		['Child process API', /\bchild_process\b/],
		['Network API', /\b(?:fetch|requestUrl|XMLHttpRequest|WebSocket)\s*\(/],
		['Network module', /\b(?:http|https|net|tls|dgram)\b/],
		['Vault adapter API', /\.adapter\b/],
		['Node process API', /\bprocess\./],
	]) {
		if (pattern.test(content)) {
			findings.push(`${relativePath(file)}: ${label}`);
		}
	}
}

const packageJson = readJson('package.json');
if (!packageJson.private) {
	findings.push('package.json: package must be private to prevent npm publication');
}
if (Object.keys(packageJson.dependencies ?? {}).length > 0) {
	findings.push('package.json: runtime dependencies are not allowed');
}

const manifest = readJson('manifest.json');
if (!/^[a-z]+(?:-[a-z0-9]+)*$/.test(manifest.id ?? '')) {
	findings.push('manifest.json: id must contain lowercase letters and hyphens only');
}
if ((manifest.id ?? '').includes('obsidian') || (manifest.id ?? '').endsWith('plugin')) {
	findings.push('manifest.json: id violates Community Plugin naming restrictions');
}
if (manifest.isDesktopOnly !== false) {
	findings.push('manifest.json: mobile-safe build must set isDesktopOnly to false');
}

for (const file of collectProjectTextFiles()) {
	const content = readFileSync(file, 'utf8');
	if (/\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,})\b/.test(content)) {
		findings.push(`${relativePath(file)}: possible secret token`);
	}
}

if (findings.length > 0) {
	throw new Error(`Security source policy failed:\n${findings.join('\n')}`);
}

console.log(`Security source policy passed for ${sourceFiles.length} production source files.`);

function collectProjectTextFiles() {
	const paths = [
		resolve(rootDirectory, 'README.md'),
		resolve(rootDirectory, 'README.ja.md'),
		resolve(rootDirectory, 'SECURITY.md'),
		resolve(rootDirectory, 'CHANGELOG.md'),
		resolve(rootDirectory, 'LICENSE'),
		...collectFiles(sourceDirectory, new Set(['.ts'])),
		...collectFiles(resolve(rootDirectory, 'docs'), new Set(['.md'])),
		...collectFiles(resolve(rootDirectory, 'examples'), new Set(['.md'])),
		...collectFiles(resolve(rootDirectory, 'tests'), new Set(['.ts', '.md'])),
	];
	return paths;
}

function collectFiles(directory, extensions) {
	const files = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectFiles(path, extensions));
		} else if (entry.isFile() && extensions.has(extname(entry.name))) {
			files.push(path);
		}
	}
	return files;
}

function readJson(name) {
	return JSON.parse(readFileSync(resolve(rootDirectory, name), 'utf8'));
}

function relativePath(path) {
	return path.slice(rootDirectory.length + 1).replaceAll('\\', '/');
}
