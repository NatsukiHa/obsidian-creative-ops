import {
	PROJECT_TYPE,
	type CreativeProject,
	type LocalDateValue,
	type ProjectFileSnapshot,
} from '../types';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCreativeProject(
	file: ProjectFileSnapshot,
	frontmatter: Record<string, unknown>,
): CreativeProject | null {
	if (readString(frontmatter.type) !== PROJECT_TYPE) {
		return null;
	}

	return {
		path: file.path,
		basename: file.basename,
		title: readString(frontmatter.title) ?? file.basename.trim(),
		status: normalizeStatus(frontmatter.status),
		category: readString(frontmatter.category),
		priority: readString(frontmatter.priority)?.toLowerCase(),
		targetDate: parseIsoDate(frontmatter['target-date']),
		publishedDate: parseIsoDate(frontmatter['published-date']),
		publishedUrl: readString(frontmatter['published-url']),
		progress: parseProgress(frontmatter.progress),
		modifiedAt: file.modifiedAt,
		relations: file.relations,
		raw: { ...frontmatter },
	};
}

export function readString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0
		? value.trim()
		: undefined;
}

export function parseIsoDate(value: unknown): LocalDateValue | undefined {
	const rawValue = readString(value);
	if (!rawValue) {
		return undefined;
	}

	const match = ISO_DATE_PATTERN.exec(rawValue);
	if (!match) {
		return undefined;
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const timestamp = Date.UTC(year, month - 1, day);
	const date = new Date(timestamp);
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return undefined;
	}

	return { value: rawValue, timestamp };
}

export function parseProgress(value: unknown): number | undefined {
	const normalized =
		typeof value === 'number'
			? value
			: typeof value === 'string' && /^\d+$/.test(value.trim())
				? Number(value.trim())
				: Number.NaN;

	return Number.isInteger(normalized) && normalized >= 0 && normalized <= 100
		? normalized
		: undefined;
}

export function isPathInFolder(path: string, folder: string): boolean {
	return folder.length === 0 || path === folder || path.startsWith(`${folder}/`);
}

function normalizeStatus(value: unknown): string | undefined {
	return readString(value)?.toLowerCase();
}
