import assert from 'node:assert/strict';
import test from 'node:test';
import {
	DEFAULT_SETTINGS,
	normalizeSettings,
	parseRequiredProperties,
	parseStatusDefinitions,
	sanitizeVaultPath,
} from '../../src/settings/settings-model';

test('rejects paths that could leave the vault', () => {
	assert.equal(sanitizeVaultPath('../outside'), '');
	assert.equal(sanitizeVaultPath('C:/Users/private'), '');
	assert.equal(sanitizeVaultPath('/absolute/path'), '');
	assert.equal(sanitizeVaultPath('Creative\\Projects'), 'Creative/Projects');
});

test('normalizes statuses and defaults to a valid configured status', () => {
	const settings = normalizeSettings({
		...DEFAULT_SETTINGS,
		statuses: parseStatusDefinitions('idea, draft, launch, invalid value, draft'),
		defaultStatus: 'missing',
	});

	assert.deepEqual(settings.statuses.map((status) => status.id), ['idea', 'draft', 'launch']);
	assert.equal(settings.defaultStatus, 'idea');
});

test('parses only supported required Property names', () => {
	assert.deepEqual(
		parseRequiredProperties('status, target-date, outside, progress'),
		['status', 'target-date', 'progress'],
	);
});
