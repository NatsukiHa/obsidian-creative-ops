import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SETTINGS, normalizeSettings } from '../../src/settings/settings-model';
import { validateProject, validateProjects, validateTemplateFrontmatter } from '../../src/validation/rules';
import { createProject, EMPTY_RELATIONS } from '../helpers';

const now = new Date(Date.UTC(2026, 7, 3));
const settings = normalizeSettings(DEFAULT_SETTINGS);

test('reports missing required Properties without breaking project recognition', () => {
	const project = createProject({ category: '', priority: '', progress: undefined });
	const issues = validateProject(project, settings, now);

	assert.deepEqual(
		issues.filter((item) => item.ruleId === 'missing-property').map((item) => item.message),
		[
			"Required Property 'category' is missing.",
			"Required Property 'priority' is missing.",
			"Required Property 'progress' is missing.",
		],
	);
});

test('reports unknown statuses, invalid dates, invalid progress, and publishing gaps', () => {
	const project = createProject({
		status: 'blocked',
		'target-date': '2026-02-30',
		progress: 101,
		'published-date': 'bad-date',
	});
	const issues = validateProject(project, settings, now);

	assert.ok(issues.some((item) => item.ruleId === 'unknown-status'));
	assert.ok(issues.some((item) => item.ruleId === 'invalid-date'));
	assert.ok(issues.some((item) => item.ruleId === 'invalid-progress'));
});

test('reports missing publication details for published projects', () => {
	const project = createProject({
		status: 'published',
		'published-date': '',
		'published-url': '',
	});
	const issues = validateProject(project, settings, now);

	assert.ok(issues.some((item) => item.ruleId === 'published-without-published-date'));
	assert.ok(issues.some((item) => item.ruleId === 'published-without-published-url'));
});

test('detects overdue and stalled active projects but exempts paused projects', () => {
	const stalledProject = createProject(
		{ 'target-date': '2026-08-02' },
		{ modifiedAt: Date.UTC(2026, 6, 1) },
	);
	const pausedProject = createProject(
		{ status: 'paused', 'target-date': '2026-08-02' },
		{ modifiedAt: Date.UTC(2026, 6, 1), path: 'Creative Projects/Paused.md' },
	);

	const stalledIssues = validateProject(stalledProject, settings, now);
	const pausedIssues = validateProject(pausedProject, settings, now);
	assert.ok(stalledIssues.some((item) => item.ruleId === 'overdue'));
	assert.ok(stalledIssues.some((item) => item.ruleId === 'stalled'));
	assert.ok(pausedIssues.some((item) => item.ruleId === 'overdue'));
	assert.ok(!pausedIssues.some((item) => item.ruleId === 'stalled'));
});

test('detects duplicate project titles and unresolved related links', () => {
	const first = createProject({}, { path: 'Creative Projects/First.md', basename: 'Shared' });
	const second = createProject(
		{},
		{
			path: 'Creative Projects/Second.md',
			basename: 'Shared',
			relations: { ...EMPTY_RELATIONS, unresolved: ['Missing note'] },
		},
	);
	const issues = validateProjects([first, second], settings, now);

	assert.equal(issues.filter((item) => item.ruleId === 'duplicate-title').length, 2);
	assert.ok(issues.some((item) => item.ruleId === 'unresolved-related-link'));
});

test('checks selected templates for the project type and required Properties', () => {
	const issues = validateTemplateFrontmatter('Templates/Project.md', { status: 'idea' }, settings);

	assert.ok(issues.some((item) => item.ruleId === 'template-invalid-type'));
	assert.equal(issues.filter((item) => item.ruleId === 'template-missing-property').length, 3);
});
