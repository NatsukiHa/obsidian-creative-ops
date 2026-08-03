import {
	DEFAULT_STATUS_IDS,
	PRIORITY_VALUES,
	PROJECT_PROPERTY_KEYS,
	type CreativeOpsSettings,
	type ProjectPriority,
	type ProjectPropertyKey,
	type StatusDefinition,
} from '../types';

export const DEFAULT_SETTINGS: CreativeOpsSettings = {
	projectFolder: '',
	outputFolder: 'Creative projects',
	templatePath: '',
	staleDays: 14,
	statuses: DEFAULT_STATUS_IDS.map((id) => ({
		id,
		label: toDisplayLabel(id),
	})),
	defaultStatus: 'idea',
	defaultCategory: 'article',
	defaultPriority: 'medium',
	requiredProperties: ['status', 'category', 'priority', 'progress'],
};

const STATUS_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function toDisplayLabel(statusId: string): string {
	return statusId
		.split('-')
		.filter((segment) => segment.length > 0)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ');
}

export function parseStatusDefinitions(value: string): StatusDefinition[] {
	const seen = new Set<string>();
	const statuses: StatusDefinition[] = [];

	for (const valuePart of value.split(',')) {
		const id = valuePart.trim().toLowerCase();
		if (!STATUS_ID_PATTERN.test(id) || seen.has(id)) {
			continue;
		}
		seen.add(id);
		statuses.push({ id, label: toDisplayLabel(id) });
	}

	return statuses;
}

export function formatStatusDefinitions(statuses: StatusDefinition[]): string {
	return statuses.map((status) => status.id).join(', ');
}

export function parseRequiredProperties(value: string): ProjectPropertyKey[] {
	const allowed = new Set<string>(PROJECT_PROPERTY_KEYS);
	const seen = new Set<ProjectPropertyKey>();

	for (const valuePart of value.split(',')) {
		const property = valuePart.trim() as ProjectPropertyKey;
		if (allowed.has(property)) {
			seen.add(property);
		}
	}

	return PROJECT_PROPERTY_KEYS.filter((property) => seen.has(property));
}

export function formatRequiredProperties(
	properties: ProjectPropertyKey[],
): string {
	return properties.join(', ');
}

export function sanitizeVaultPath(value: string): string {
	const candidate = value.trim().replaceAll('\\', '/').replace(/\/{2,}/g, '/');
	if (
		candidate.length === 0 ||
		candidate === '.' ||
		candidate.startsWith('/') ||
		/^[a-zA-Z]:/.test(candidate) ||
		candidate.split('/').some((segment) => segment === '..')
	) {
		return '';
	}

	return candidate.replace(/^\.\//, '').replace(/\/$/, '');
}

export function normalizeSettings(
	settings: Partial<CreativeOpsSettings>,
): CreativeOpsSettings {
	const statuses = normalizeStatuses(settings.statuses);
	const defaultStatus = statuses.some(
		(status) => status.id === settings.defaultStatus,
	)
		? (settings.defaultStatus as string)
		: statuses[0]?.id ?? DEFAULT_SETTINGS.defaultStatus;
	const defaultPriority = isPriority(settings.defaultPriority)
		? settings.defaultPriority
		: DEFAULT_SETTINGS.defaultPriority;
	const staleDays = normalizeStaleDays(settings.staleDays);
	const requiredProperties = normalizeRequiredProperties(settings.requiredProperties);

	return {
		projectFolder: sanitizeVaultPath(settings.projectFolder ?? ''),
		outputFolder: sanitizeVaultPath(
			settings.outputFolder ?? DEFAULT_SETTINGS.outputFolder,
		),
		templatePath: sanitizeVaultPath(settings.templatePath ?? ''),
		staleDays,
		statuses,
		defaultStatus,
		defaultCategory:
			typeof settings.defaultCategory === 'string' &&
			settings.defaultCategory.trim().length > 0
				? settings.defaultCategory.trim()
				: DEFAULT_SETTINGS.defaultCategory,
		defaultPriority,
		requiredProperties,
	};
}

function normalizeStatuses(value: unknown): StatusDefinition[] {
	if (!Array.isArray(value)) {
		return DEFAULT_SETTINGS.statuses.map((status) => ({ ...status }));
	}

	const seen = new Set<string>();
	const normalized: StatusDefinition[] = [];
	for (const candidate of value) {
		if (!isRecord(candidate) || typeof candidate.id !== 'string') {
			continue;
		}

		const id = candidate.id.trim().toLowerCase();
		if (!STATUS_ID_PATTERN.test(id) || seen.has(id)) {
			continue;
		}

		const label =
			'label' in candidate && typeof candidate.label === 'string'
				? candidate.label.trim()
				: '';
		seen.add(id);
		normalized.push({ id, label: label || toDisplayLabel(id) });
	}

	return normalized.length > 0
		? normalized
		: DEFAULT_SETTINGS.statuses.map((status) => ({ ...status }));
}

function normalizeRequiredProperties(value: unknown): ProjectPropertyKey[] {
	if (!Array.isArray(value)) {
		return [...DEFAULT_SETTINGS.requiredProperties];
	}

	const allowed = new Set<string>(PROJECT_PROPERTY_KEYS);
	const seen = new Set<ProjectPropertyKey>();
	for (const candidate of value) {
		if (typeof candidate === 'string' && allowed.has(candidate)) {
			seen.add(candidate as ProjectPropertyKey);
		}
	}

	return PROJECT_PROPERTY_KEYS.filter((property) => seen.has(property));
}

function normalizeStaleDays(value: unknown): number {
	if (typeof value !== 'number' || !Number.isInteger(value)) {
		return DEFAULT_SETTINGS.staleDays;
	}

	return Math.min(Math.max(value, 1), 3650);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPriority(value: unknown): value is ProjectPriority {
	return typeof value === 'string' && PRIORITY_VALUES.includes(value as ProjectPriority);
}
