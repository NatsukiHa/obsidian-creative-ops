import assert from 'node:assert/strict';
import test from 'node:test';
import {
	isPathInFolder,
	parseCreativeProject,
	parseIsoDate,
	parseProgress,
} from '../../src/parser/project';
import { EMPTY_RELATIONS } from '../helpers';

test('recognizes a creative project and normalizes metadata', () => {
	const project = parseCreativeProject(
		{
			path: 'Creative Projects/Launch.md',
			basename: 'Launch',
			modifiedAt: Date.UTC(2026, 7, 3),
			relations: EMPTY_RELATIONS,
		},
		{
			type: 'creative-project',
			status: 'Draft',
			category: 'article',
			priority: 'HIGH',
			'target-date': '2026-08-17',
			progress: '30',
		},
	);

	assert.ok(project);
	assert.equal(project.title, 'Launch');
	assert.equal(project.status, 'draft');
	assert.equal(project.priority, 'high');
	assert.equal(project.targetDate?.value, '2026-08-17');
	assert.equal(project.progress, 30);
});

test('does not treat ordinary notes as creative projects', () => {
	const project = parseCreativeProject(
		{
			path: 'Notes/Ordinary.md',
			basename: 'Ordinary',
			modifiedAt: Date.UTC(2026, 7, 3),
			relations: EMPTY_RELATIONS,
		},
		{ status: 'draft' },
	);

	assert.equal(project, null);
});

test('rejects invalid dates and progress without throwing', () => {
	assert.equal(parseIsoDate('2026-02-30'), undefined);
	assert.equal(parseIsoDate('08/17/2026'), undefined);
	assert.equal(parseProgress(-1), undefined);
	assert.equal(parseProgress(101), undefined);
	assert.equal(parseProgress('25.5'), undefined);
});

test('scopes notes to a configured vault-relative folder', () => {
	assert.equal(isPathInFolder('Creative Projects/Launch.md', 'Creative Projects'), true);
	assert.equal(isPathInFolder('Archive/Launch.md', 'Creative Projects'), false);
	assert.equal(isPathInFolder('Anything.md', ''), true);
});
