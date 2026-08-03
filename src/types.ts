export const PROJECT_TYPE = 'creative-project';

export const DEFAULT_STATUS_IDS = [
	'idea',
	'research',
	'draft',
	'editing',
	'ready',
	'published',
	'paused',
	'archived',
] as const;

export const PRIORITY_VALUES = ['low', 'medium', 'high'] as const;

export const PROJECT_PROPERTY_KEYS = [
	'status',
	'category',
	'priority',
	'target-date',
	'progress',
] as const;

export type ProjectPropertyKey = (typeof PROJECT_PROPERTY_KEYS)[number];
export type ProjectPriority = (typeof PRIORITY_VALUES)[number];

export interface StatusDefinition {
	id: string;
	label: string;
}

export interface CreativeOpsSettings {
	projectFolder: string;
	outputFolder: string;
	templatePath: string;
	staleDays: number;
	statuses: StatusDefinition[];
	defaultStatus: string;
	defaultCategory: string;
	defaultPriority: ProjectPriority;
	requiredProperties: ProjectPropertyKey[];
}

export interface LocalDateValue {
	value: string;
	timestamp: number;
}

export interface ProjectRelations {
	outgoing: string[];
	incoming: string[];
	unresolved: string[];
}

export interface ProjectFileSnapshot {
	path: string;
	basename: string;
	modifiedAt: number;
	relations: ProjectRelations;
}

export interface CreativeProject {
	path: string;
	basename: string;
	title: string;
	status?: string;
	category?: string;
	priority?: string;
	targetDate?: LocalDateValue;
	publishedDate?: LocalDateValue;
	publishedUrl?: string;
	progress?: number;
	modifiedAt: number;
	relations: ProjectRelations;
	raw: Record<string, unknown>;
}

export type QualitySeverity = 'error' | 'warning';

export type QualityRuleId =
	| 'missing-property'
	| 'missing-title'
	| 'unknown-status'
	| 'invalid-priority'
	| 'invalid-date'
	| 'invalid-progress'
	| 'ready-without-published-date'
	| 'published-without-published-date'
	| 'published-without-published-url'
	| 'overdue'
	| 'stalled'
	| 'duplicate-title'
	| 'unresolved-related-link'
	| 'template-not-found'
	| 'template-missing-property'
	| 'template-invalid-type';

export interface QualityIssue {
	ruleId: QualityRuleId;
	severity: QualitySeverity;
	path: string;
	message: string;
}

export interface ProjectIndexSnapshot {
	projects: CreativeProject[];
	qualityIssues: QualityIssue[];
	refreshedAt: number;
}

export interface StatusCount {
	status: string;
	count: number;
}

export interface ProjectSummary {
	statusCounts: StatusCount[];
	overdueCount: number;
	stalledCount: number;
	updatedThisWeekCount: number;
	publishedCount: number;
}
