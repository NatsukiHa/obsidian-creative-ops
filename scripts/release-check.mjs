import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];

for (const required of ['main.js', 'manifest.json', 'styles.css', 'README.md', 'SECURITY.md', 'LICENSE']) {
	if (!existsSync(resolve(rootDirectory, required))) {
		findings.push(`Missing required release file: ${required}`);
	}
}

const manifest = readJson('manifest.json');
const packageJson = readJson('package.json');
const versions = readJson('versions.json');
if (manifest.version !== packageJson.version) {
	findings.push('manifest.json and package.json versions differ');
}
if (versions[manifest.version] !== manifest.minAppVersion) {
	findings.push('versions.json does not match manifest version and minAppVersion');
}
if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? '')) {
	findings.push('manifest version must be semantic x.y.z');
}

const bundlePath = resolve(rootDirectory, 'main.js');
if (existsSync(bundlePath)) {
	const bundle = readFileSync(bundlePath, 'utf8');
	if (bundle.includes('sourceMappingURL')) {
		findings.push('production main.js must not include a source map');
	}
	if (statSync(bundlePath).size > 1024 * 1024) {
		findings.push('main.js exceeds the 1 MiB release budget');
	}
}

const license = readFileSync(resolve(rootDirectory, 'LICENSE'), 'utf8');
if (!license.startsWith('MIT License\n') || !license.includes('Permission is hereby granted')) {
	findings.push('LICENSE must contain the approved MIT license text');
}
if (packageJson.license !== 'MIT') {
	findings.push('package.json license must be MIT');
}

if (findings.length > 0) {
	throw new Error(`Release check failed:\n${findings.join('\n')}`);
}

console.log('Release checks passed.');

function readJson(name) {
	return JSON.parse(readFileSync(resolve(rootDirectory, name), 'utf8'));
}
