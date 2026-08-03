import { App, TFile } from 'obsidian';
import { isPathInFolder, parseCreativeProject } from '../parser/project';
import type {
	CreativeOpsSettings,
	ProjectIndexSnapshot,
	ProjectRelations,
	QualityIssue,
} from '../types';
import { validateProjects, validateTemplateFrontmatter } from '../validation/rules';

export class ProjectIndex {
	private snapshot: ProjectIndexSnapshot = {
		projects: [],
		qualityIssues: [],
		refreshedAt: 0,
	};

	constructor(
		private readonly app: App,
		private readonly getSettings: () => CreativeOpsSettings,
	) {}

	refresh(): ProjectIndexSnapshot {
		const settings = this.getSettings();
		const projects = this.app.vault
			.getMarkdownFiles()
			.filter((file) => isPathInFolder(file.path, settings.projectFolder))
			.map((file) => {
				const cache = this.app.metadataCache.getFileCache(file);
				return parseCreativeProject(
					{
						path: file.path,
						basename: file.basename,
						modifiedAt: file.stat.mtime,
						relations: this.collectRelations(file),
					},
					cache?.frontmatter ?? {},
				);
			})
			.filter((project): project is NonNullable<typeof project> => project !== null)
			.sort((left, right) => left.title.localeCompare(right.title));

		const qualityIssues = validateProjects(projects, settings, new Date());
		qualityIssues.push(...this.validateConfiguredTemplate(settings));
		this.snapshot = {
			projects,
			qualityIssues,
			refreshedAt: Date.now(),
		};

		return this.getSnapshot();
	}

	getSnapshot(): ProjectIndexSnapshot {
		return {
			projects: [...this.snapshot.projects],
			qualityIssues: [...this.snapshot.qualityIssues],
			refreshedAt: this.snapshot.refreshedAt,
		};
	}

	private collectRelations(file: TFile): ProjectRelations {
		const resolved = this.app.metadataCache.resolvedLinks[file.path] ?? {};
		const unresolved = this.app.metadataCache.unresolvedLinks[file.path] ?? {};
		const incoming = Object.entries(this.app.metadataCache.resolvedLinks)
			.filter(([, targets]) => Object.prototype.hasOwnProperty.call(targets, file.path))
			.map(([source]) => source)
			.sort();

		return {
			outgoing: Object.keys(resolved).sort(),
			incoming,
			unresolved: Object.keys(unresolved).sort(),
		};
	}

	private validateConfiguredTemplate(settings: CreativeOpsSettings): QualityIssue[] {
		if (!settings.templatePath) {
			return [];
		}

		const template = this.app.vault.getAbstractFileByPath(settings.templatePath);
		if (!(template instanceof TFile) || template.extension !== 'md') {
			return [
				{
					ruleId: 'template-not-found',
					severity: 'error',
					path: settings.templatePath,
					message: 'Configured template was not found as a Markdown note.',
				},
			];
		}

		const frontmatter = this.app.metadataCache.getFileCache(template)?.frontmatter ?? {};
		return validateTemplateFrontmatter(template.path, frontmatter, settings);
	}
}
