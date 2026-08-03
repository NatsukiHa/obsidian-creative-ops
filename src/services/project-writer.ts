import { App, normalizePath, TFile, TFolder } from 'obsidian';
import { parseIsoDate, readString } from '../parser/project';
import { sanitizeVaultPath } from '../settings/settings-model';
import { PROJECT_TYPE, type CreativeOpsSettings } from '../types';

export interface CreateProjectInput {
	title: string;
	category: string;
	status: string;
	priority: string;
	targetDate: string;
	folder: string;
	templatePath: string;
}

type MutableFrontmatter = Record<string, unknown>;

export async function createProjectNote(
	app: App,
	input: CreateProjectInput,
	settings: CreativeOpsSettings,
): Promise<TFile> {
	if (!settings.statuses.some((status) => status.id === input.status)) {
		throw new Error('Choose a configured status.');
	}

	if (input.targetDate && !parseIsoDate(input.targetDate)) {
		throw new Error('Target date must use YYYY-MM-DD.');
	}

	const folder = normalizeFolder(input.folder || settings.outputFolder);
	const fileName = makeSafeFileName(input.title);
	const path = normalizePath(folder ? `${folder}/${fileName}.md` : `${fileName}.md`);
	if (app.vault.getAbstractFileByPath(path)) {
		throw new Error('A note with that filename already exists. Nothing was overwritten.');
	}

	await ensureFolder(app, folder);
	const content = await loadTemplateContent(app, input.templatePath || settings.templatePath);
	const file = await app.vault.create(path, content || `# ${input.title.trim()}\n`);

	try {
		await app.fileManager.processFrontMatter(file, (value: unknown) => {
			const frontmatter = asMutableFrontmatter(value);
			frontmatter.type = PROJECT_TYPE;
			frontmatter.status = input.status;
			frontmatter.category = input.category.trim() || settings.defaultCategory;
			frontmatter.priority = input.priority;
			frontmatter.created = todayIsoDate();
			frontmatter.progress = 0;
			if (input.targetDate) {
				frontmatter['target-date'] = input.targetDate;
			}
		});
	} catch (error) {
		throw new Error(
			`The note was created, but its Properties could not be initialized: ${messageFor(error)}`,
		);
	}

	return file;
}

export async function registerCurrentProject(
	app: App,
	settings: CreativeOpsSettings,
): Promise<TFile> {
	const file = app.workspace.getActiveFile();
	if (!file) {
		throw new Error('Open a Markdown note before registering it as a creative project.');
	}

	await app.fileManager.processFrontMatter(file, (value: unknown) => {
		const frontmatter = asMutableFrontmatter(value);
		const existingType = readString(frontmatter.type);
		if (existingType && existingType !== PROJECT_TYPE) {
			throw new Error(
				`This note already uses type: ${existingType}. Its Properties were not changed.`,
			);
		}

		frontmatter.type = PROJECT_TYPE;
		setIfMissing(frontmatter, 'status', settings.defaultStatus);
		setIfMissing(frontmatter, 'category', settings.defaultCategory);
		setIfMissing(frontmatter, 'priority', settings.defaultPriority);
		setIfMissing(frontmatter, 'progress', 0);
		setIfMissing(frontmatter, 'created', todayIsoDate());
	});

	return file;
}

export async function updateProjectStatus(
	app: App,
	path: string,
	status: string,
	settings: CreativeOpsSettings,
): Promise<void> {
	if (!settings.statuses.some((definition) => definition.id === status)) {
		throw new Error('That status is not configured.');
	}

	const file = app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) {
		throw new Error('The project note no longer exists.');
	}

	await app.fileManager.processFrontMatter(file, (value: unknown) => {
		const frontmatter = asMutableFrontmatter(value);
		frontmatter.status = status;
	});
}

async function ensureFolder(app: App, folder: string): Promise<void> {
	if (!folder) {
		return;
	}

	let currentPath = '';
	for (const segment of folder.split('/')) {
		currentPath = currentPath ? `${currentPath}/${segment}` : segment;
		const current = app.vault.getAbstractFileByPath(currentPath);
		if (!current) {
			await app.vault.createFolder(currentPath);
			continue;
		}
		if (!(current instanceof TFolder)) {
			throw new Error(`Cannot create folder because '${currentPath}' is a file.`);
		}
	}
}

async function loadTemplateContent(app: App, path: string): Promise<string> {
	if (!path) {
		return '';
	}

	const template = app.vault.getAbstractFileByPath(normalizeFolder(path));
	if (!(template instanceof TFile) || template.extension !== 'md') {
		throw new Error('Configured template was not found as a Markdown note.');
	}

	return app.vault.cachedRead(template);
}

function normalizeFolder(value: string): string {
	const normalized = sanitizeVaultPath(value);
	if (value.trim() && !normalized) {
		throw new Error('Folders and template paths must stay inside the vault.');
	}
	return normalized ? normalizePath(normalized) : '';
}

function makeSafeFileName(title: string): string {
	const candidate = title
		.trim()
		.replace(/\.md$/i, '')
		.replace(/[\\/:*?"<>|]/g, '-')
		.replace(/\s+/g, ' ')
		.trim();
	if (!candidate || candidate === '.' || candidate === '..') {
		throw new Error('A non-empty title is required.');
	}

	return candidate;
}

function setIfMissing(frontmatter: Record<string, unknown>, key: string, value: unknown): void {
	if (!readString(frontmatter[key]) && frontmatter[key] !== 0) {
		frontmatter[key] = value;
	}
}

function asMutableFrontmatter(value: unknown): MutableFrontmatter {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error('The note Properties could not be read safely.');
	}

	return value as MutableFrontmatter;
}

function todayIsoDate(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function messageFor(error: unknown): string {
	return error instanceof Error ? error.message : 'Unknown error';
}
