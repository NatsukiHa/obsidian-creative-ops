import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SETTINGS, normalizeSettings } from '../../src/settings/settings-model';
import { buildProjectSummary } from '../../src/services/summary';
import { createProject } from '../helpers';

test('summarizes statuses, recent updates, stale projects, and published projects', () => {
	const settings = normalizeSettings(DEFAULT_SETTINGS);
	const draft = createProject({}, { path: 'Creative Projects/Draft.md', modifiedAt: Date.UTC(2026, 7, 3) });
	const published = createProject(
		{ status: 'published', 'published-date': '2026-08-01', 'published-url': 'https://example.test' },
		{ path: 'Creative Projects/Published.md', modifiedAt: Date.UTC(2026, 6, 1) },
	);
	const summary = buildProjectSummary(
		{
			projects: [draft, published],
			qualityIssues: [
				{ ruleId: 'stalled', severity: 'warning', path: draft.path, message: 'Stalled' },
				{ ruleId: 'overdue', severity: 'warning', path: draft.path, message: 'Overdue' },
			],
			refreshedAt: Date.UTC(2026, 7, 3),
		},
		settings,
		new Date(2026, 7, 3),
	);

	assert.equal(summary.publishedCount, 1);
	assert.equal(summary.updatedThisWeekCount, 1);
	assert.equal(summary.stalledCount, 1);
	assert.equal(summary.overdueCount, 1);
	assert.equal(summary.statusCounts.find((item) => item.status === 'draft')?.count, 1);
});
