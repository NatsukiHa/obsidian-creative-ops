import { parseIsoDate, parseProgress, readString } from '../parser/project';
import {
	PRIORITY_VALUES,
	PROJECT_TYPE,
	type CreativeOpsSettings,
	type CreativeProject,
	type ProjectPropertyKey,
	type QualityIssue,
} from '../types';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const TERMINAL_STATUSES = new Set(['published', 'archived']);
const STALE_EXEMPT_STATUSES = new Set(['published', 'archived', 'paused']);

export function validateProjects(
	projects: CreativeProject[],
	settings: CreativeOpsSettings,
	now: Date,
): QualityIssue[] {
	const issues = projects.flatMap((project) =>
		validateProject(project, settings, now),
	);
	issues.push(...findDuplicateTitleIssues(projects));
	return issues;
}

export function validateProject(
	project: CreativeProject,
	settings: CreativeOpsSettings,
	now: Date,
): QualityIssue[] {
	const issues: QualityIssue[] = [];

	if (!project.title) {
		issues.push(issue('missing-title', 'error', project.path, 'Project title is empty.'));
	}

	for (const property of settings.requiredProperties) {
		if (isPropertyMissing(project, property)) {
			issues.push(
				issue(
					'missing-property',
					'error',
					project.path,
					`Required Property '${property}' is missing.`,
				),
			);
		}
	}

	if (project.status && !settings.statuses.some((status) => status.id === project.status)) {
		issues.push(
			issue(
				'unknown-status',
				'error',
				project.path,
				`Status '${project.status}' is not configured.`,
			),
		);
	}

	if (
		project.priority &&
		!PRIORITY_VALUES.includes(project.priority as (typeof PRIORITY_VALUES)[number])
	) {
		issues.push(
			issue(
				'invalid-priority',
				'error',
				project.path,
				`Priority '${project.priority}' must be low, medium, or high.`,
			),
		);
	}

	if (hasValue(project.raw['target-date']) && !parseIsoDate(project.raw['target-date'])) {
		issues.push(
			issue('invalid-date', 'error', project.path, "Property 'target-date' must use YYYY-MM-DD."),
		);
	}

	if (
		hasValue(project.raw['published-date']) &&
		!parseIsoDate(project.raw['published-date'])
	) {
		issues.push(
			issue('invalid-date', 'error', project.path, "Property 'published-date' must use YYYY-MM-DD."),
		);
	}

	if (hasValue(project.raw.progress) && parseProgress(project.raw.progress) === undefined) {
		issues.push(
			issue('invalid-progress', 'error', project.path, "Property 'progress' must be an integer from 0 to 100."),
		);
	}

	if (project.status === 'ready' && !project.publishedDate) {
		issues.push(
			issue(
				'ready-without-published-date',
				'warning',
				project.path,
				"A ready project has no 'published-date'.",
			),
		);
	}

	if (project.status === 'published' && !project.publishedDate) {
		issues.push(
			issue(
				'published-without-published-date',
				'error',
				project.path,
				"A published project has no valid 'published-date'.",
			),
		);
	}

	if (project.status === 'published' && !project.publishedUrl) {
		issues.push(
			issue(
				'published-without-published-url',
				'error',
				project.path,
				"A published project has no 'published-url'.",
			),
		);
	}

	const today = startOfUtcDay(now);
	if (
		project.targetDate &&
		project.targetDate.timestamp < today &&
		!TERMINAL_STATUSES.has(project.status ?? '')
	) {
		issues.push(issue('overdue', 'warning', project.path, 'Target date has passed.'));
	}

	if (
		!STALE_EXEMPT_STATUSES.has(project.status ?? '') &&
		today - project.modifiedAt >= settings.staleDays * DAY_IN_MILLISECONDS
	) {
		issues.push(
			issue(
				'stalled',
				'warning',
				project.path,
				`Project has not been updated for ${settings.staleDays} days.`,
			),
		);
	}

	for (const unresolvedLink of project.relations.unresolved) {
		issues.push(
			issue(
				'unresolved-related-link',
				'warning',
				project.path,
				`Unresolved related link: ${unresolvedLink}`,
			),
		);
	}

	return issues;
}

export function validateTemplateFrontmatter(
	path: string,
	frontmatter: Record<string, unknown>,
	settings: CreativeOpsSettings,
): QualityIssue[] {
	const issues: QualityIssue[] = [];
	if (readString(frontmatter.type) !== PROJECT_TYPE) {
		issues.push(
			issue(
				'template-invalid-type',
				'error',
				path,
				`Template must include type: ${PROJECT_TYPE}.`,
			),
		);
	}

	for (const property of settings.requiredProperties) {
		if (hasValue(frontmatter[property])) {
			continue;
		}
		issues.push(
			issue(
				'template-missing-property',
				'warning',
				path,
				`Template is missing required Property '${property}'.`,
			),
		);
	}

	return issues;
}

function isPropertyMissing(
	project: CreativeProject,
	property: ProjectPropertyKey,
): boolean {
	switch (property) {
		case 'status':
			return !project.status;
		case 'category':
			return !project.category;
		case 'priority':
			return !project.priority;
		case 'target-date':
			return !project.targetDate;
		case 'progress':
			return project.progress === undefined;
	}
}

function findDuplicateTitleIssues(projects: CreativeProject[]): QualityIssue[] {
	const pathsByTitle = new Map<string, CreativeProject[]>();
	for (const project of projects) {
		const key = project.title.trim().toLocaleLowerCase();
		if (!key) {
			continue;
		}
		const matches = pathsByTitle.get(key);
		if (matches) {
			matches.push(project);
		} else {
			pathsByTitle.set(key, [project]);
		}
	}

	const issues: QualityIssue[] = [];
	for (const matches of pathsByTitle.values()) {
		if (matches.length < 2) {
			continue;
		}
		for (const project of matches) {
			issues.push(
				issue(
					'duplicate-title',
					'warning',
					project.path,
					`Another creative project also uses the title '${project.title}'.`,
				),
			);
		}
	}

	return issues;
}

function hasValue(value: unknown): boolean {
	return value !== undefined && value !== null && value !== '';
}

function startOfUtcDay(value: Date): number {
	return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function issue(
	ruleId: QualityIssue['ruleId'],
	severity: QualityIssue['severity'],
	path: string,
	message: string,
): QualityIssue {
	return { ruleId, severity, path, message };
}
