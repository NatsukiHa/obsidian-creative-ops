import type {
	CreativeOpsSettings,
	ProjectIndexSnapshot,
	ProjectSummary,
} from '../types';

export function buildProjectSummary(
	snapshot: ProjectIndexSnapshot,
	settings: CreativeOpsSettings,
	now: Date,
): ProjectSummary {
	const counts = new Map<string, number>();
	for (const status of settings.statuses) {
		counts.set(status.id, 0);
	}
	counts.set('missing', 0);
	counts.set('unknown', 0);

	for (const project of snapshot.projects) {
		const known = settings.statuses.some((status) => status.id === project.status);
		const status = project.status ? (known ? project.status : 'unknown') : 'missing';
		counts.set(status, (counts.get(status) ?? 0) + 1);
	}

	const weekStart = getMondayStart(now);
	const issuePaths = (ruleId: string): Set<string> =>
		new Set(
			snapshot.qualityIssues
				.filter((qualityIssue) => qualityIssue.ruleId === ruleId)
				.map((qualityIssue) => qualityIssue.path),
		);

	return {
		statusCounts: [...counts.entries()].map(([status, count]) => ({ status, count })),
		overdueCount: issuePaths('overdue').size,
		stalledCount: issuePaths('stalled').size,
		updatedThisWeekCount: snapshot.projects.filter(
			(project) => project.modifiedAt >= weekStart,
		).length,
		publishedCount: snapshot.projects.filter(
			(project) => project.status === 'published',
		).length,
	};
}

function getMondayStart(now: Date): number {
	const value = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const offset = (value.getDay() + 6) % 7;
	value.setDate(value.getDate() - offset);
	value.setHours(0, 0, 0, 0);
	return value.getTime();
}
