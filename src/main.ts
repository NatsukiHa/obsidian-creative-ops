import { Notice, Plugin } from 'obsidian';
import { registerCommands } from './commands/register-commands';
import { CreateProjectModal } from './modals/create-project-modal';
import {
	createProjectNote,
	registerCurrentProject,
	updateProjectStatus,
	type CreateProjectInput,
} from './services/project-writer';
import { ProjectIndex } from './services/project-index';
import { CreativeOpsSettingTab } from './settings/settings-tab';
import { DEFAULT_SETTINGS, normalizeSettings } from './settings/settings-model';
import type { CreativeOpsSettings } from './types';
import {
	CREATIVE_OPS_VIEW_TYPE,
	CreativeOpsView,
	type CreativeOpsViewMode,
} from './views/creative-ops-view';

export default class CreativeOpsPlugin extends Plugin {
	settings!: CreativeOpsSettings;
	index!: ProjectIndex;
	private refreshTimer: number | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.index = new ProjectIndex(this.app, () => this.settings);

		this.registerView(
			CREATIVE_OPS_VIEW_TYPE,
			(leaf) => new CreativeOpsView(leaf, this),
		);
		this.addRibbonIcon('layout-dashboard', 'Open creative ops', () => {
			void this.activateView();
		});
		this.addSettingTab(new CreativeOpsSettingTab(this.app, this));
		registerCommands(this);

		this.app.workspace.onLayoutReady(() => {
			this.refreshData();
			this.registerEvent(this.app.vault.on('create', () => this.scheduleRefresh()));
			this.registerEvent(this.app.vault.on('modify', () => this.scheduleRefresh()));
			this.registerEvent(this.app.vault.on('delete', () => this.scheduleRefresh()));
			this.registerEvent(this.app.vault.on('rename', () => this.scheduleRefresh()));
			this.registerEvent(
				this.app.metadataCache.on('changed', () => this.scheduleRefresh()),
			);
			this.registerEvent(
				this.app.metadataCache.on('resolved', () => this.scheduleRefresh()),
			);
		});
	}

	onunload(): void {
		if (this.refreshTimer !== null) {
			window.clearTimeout(this.refreshTimer);
		}
	}

	async loadSettings(): Promise<void> {
		const savedSettings = (await this.loadData()) as Partial<CreativeOpsSettings> | null;
		this.settings = normalizeSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
	}

	async updateSettings(patch: Partial<CreativeOpsSettings>): Promise<void> {
		this.settings = normalizeSettings({ ...this.settings, ...patch });
		await this.saveData(this.settings);
		this.refreshData();
	}

	refreshData(): void {
		this.index.refresh();
		this.refreshOpenViews();
	}

	async activateView(mode: CreativeOpsViewMode = 'list'): Promise<void> {
		const existingLeaf = this.app.workspace.getLeavesOfType(CREATIVE_OPS_VIEW_TYPE)[0];
		const leaf = existingLeaf ?? this.app.workspace.getLeaf('tab');
		await leaf.setViewState({ type: CREATIVE_OPS_VIEW_TYPE, active: true });
		await this.app.workspace.revealLeaf(leaf);
		if (leaf.view instanceof CreativeOpsView) {
			leaf.view.setMode(mode);
		}
	}

	async createProject(input: CreateProjectInput) {
		const file = await createProjectNote(this.app, input, this.settings);
		this.refreshData();
		return file;
	}

	async registerCurrentNote(): Promise<void> {
		try {
			const file = await registerCurrentProject(this.app, this.settings);
			this.refreshData();
			new Notice(`Registered ${file.basename} as a creative project.`);
		} catch (error) {
			new Notice(messageFor(error));
		}
	}

	async setProjectStatus(path: string, status: string): Promise<void> {
		try {
			await updateProjectStatus(this.app, path, status, this.settings);
			this.refreshData();
		} catch (error) {
			new Notice(messageFor(error));
		}
	}

	async runQualityInspection(): Promise<void> {
		this.refreshData();
		await this.activateView('summary');
		new Notice(
			`Quality inspection found ${this.index.getSnapshot().qualityIssues.length} issue(s).`,
		);
	}

	openCreateProjectModal(): void {
		new CreateProjectModal(this.app, this).open();
	}

	private scheduleRefresh(): void {
		if (this.refreshTimer !== null) {
			window.clearTimeout(this.refreshTimer);
		}
		this.refreshTimer = window.setTimeout(() => {
			this.refreshTimer = null;
			this.refreshData();
		}, 150);
	}

	private refreshOpenViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(CREATIVE_OPS_VIEW_TYPE)) {
			if (leaf.view instanceof CreativeOpsView) {
				leaf.view.render();
			}
		}
	}
}

function messageFor(error: unknown): string {
	return error instanceof Error ? error.message : 'An unexpected error occurred.';
}
