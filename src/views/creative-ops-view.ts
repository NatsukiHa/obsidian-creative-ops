import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import type CreativeOpsPlugin from '../main';
import { buildProjectSummary } from '../services/summary';
import type { CreativeProject, ProjectIndexSnapshot, QualityIssue } from '../types';

export type CreativeOpsViewMode = 'list' | 'board' | 'summary';

export const CREATIVE_OPS_VIEW_TYPE = 'creative-ops-view';

export class CreativeOpsView extends ItemView {
	private mode: CreativeOpsViewMode = 'list';

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: CreativeOpsPlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return CREATIVE_OPS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Creative ops';
	}

	getIcon(): string {
		return 'layout-dashboard';
	}

	async onOpen(): Promise<void> {
		this.render();
	}

	setMode(mode: CreativeOpsViewMode): void {
		this.mode = mode;
		this.render();
	}

	render(): void {
		const snapshot = this.plugin.index.getSnapshot();
		const root = this.contentEl;
		root.empty();
		root.addClass('creative-ops');

		const header = root.createDiv({ cls: 'creative-ops__header' });
		header.createEl('h2', { text: 'Creative ops' });
		const refreshButton = header.createEl('button', { text: 'Refresh' });
		refreshButton.type = 'button';
		refreshButton.addEventListener('click', () => this.plugin.refreshData());

		const toolbar = root.createDiv({ cls: 'creative-ops__toolbar' });
		for (const option of [
			{ mode: 'list' as const, label: 'List' },
			{ mode: 'board' as const, label: 'Board' },
			{ mode: 'summary' as const, label: 'Summary' },
		]) {
			const button = toolbar.createEl('button', { text: option.label });
			button.type = 'button';
			button.toggleClass('is-active', this.mode === option.mode);
			button.addEventListener('click', () => this.setMode(option.mode));
		}

		if (this.mode === 'list') {
			this.renderList(root, snapshot);
		} else if (this.mode === 'board') {
			this.renderBoard(root, snapshot);
		} else {
			this.renderSummary(root, snapshot);
		}
	}

	private renderList(parent: HTMLElement, snapshot: ProjectIndexSnapshot): void {
		if (snapshot.projects.length === 0) {
			parent.createEl('p', {
				text: "No creative projects found. Create one or register a note with type: creative-project.",
				cls: 'creative-ops__muted',
			});
			return;
		}

		const table = parent.createEl('table', { cls: 'creative-ops__table' });
		const headingRow = table.createEl('thead').createEl('tr');
		for (const heading of [
			'Title',
			'Status',
			'Category',
			'Priority',
			'Due',
			'Progress',
			'Updated',
		]) {
			headingRow.createEl('th', { text: heading });
		}

		const body = table.createEl('tbody');
		for (const project of snapshot.projects) {
			const row = body.createEl('tr');
			const titleCell = row.createEl('td');
			this.createOpenButton(titleCell, project);
			const statusCell = row.createEl('td');
			this.createStatusSelect(statusCell, project);
			row.createEl('td', { text: project.category ?? '—' });
			row.createEl('td', { text: project.priority ?? '—' });
			row.createEl('td', { text: project.targetDate?.value ?? '—' });
			row.createEl('td', {
				text: project.progress === undefined ? '—' : `${project.progress}%`,
			});
			row.createEl('td', { text: formatModifiedDate(project.modifiedAt) });
		}
	}

	private renderBoard(parent: HTMLElement, snapshot: ProjectIndexSnapshot): void {
		const knownStatuses = new Set(this.plugin.settings.statuses.map((status) => status.id));
		const columns = this.plugin.settings.statuses.map((status) => ({
			id: status.id,
			label: status.label,
		}));
		if (snapshot.projects.some((project) => !project.status)) {
			columns.push({ id: 'missing', label: 'Missing status' });
		}
		if (
			snapshot.projects.some(
				(project) => project.status && !knownStatuses.has(project.status),
			)
		) {
			columns.push({ id: 'unknown', label: 'Unknown status' });
		}

		const projectsByStatus = new Map<string, CreativeProject[]>();
		for (const column of columns) {
			projectsByStatus.set(column.id, []);
		}
		for (const project of snapshot.projects) {
			const key = project.status
				? knownStatuses.has(project.status)
					? project.status
					: 'unknown'
				: 'missing';
			projectsByStatus.get(key)?.push(project);
		}

		const board = parent.createDiv({ cls: 'creative-ops__board' });
		for (const column of columns) {
			const columnElement = board.createDiv({ cls: 'creative-ops__column' });
			const projects = projectsByStatus.get(column.id) ?? [];
			columnElement.createEl('h3', {
				text: `${column.label} (${projects.length})`,
			});
			for (const project of projects) {
				this.renderProjectCard(columnElement, project);
			}
		}
	}

	private renderSummary(parent: HTMLElement, snapshot: ProjectIndexSnapshot): void {
		const summary = buildProjectSummary(snapshot, this.plugin.settings, new Date());
		const grid = parent.createDiv({ cls: 'creative-ops__summary-grid' });
		this.renderSummaryCard(grid, 'Overdue', summary.overdueCount);
		this.renderSummaryCard(grid, 'Stalled', summary.stalledCount);
		this.renderSummaryCard(grid, 'Updated this week', summary.updatedThisWeekCount);
		this.renderSummaryCard(grid, 'Published', summary.publishedCount);
		for (const status of summary.statusCounts) {
			if (status.count > 0) {
				this.renderSummaryCard(grid, this.getStatusLabel(status.status), status.count);
			}
		}

		parent.createEl('h3', { text: `Quality inspection (${snapshot.qualityIssues.length})` });
		if (snapshot.qualityIssues.length === 0) {
			parent.createEl('p', { text: 'No quality issues found.', cls: 'creative-ops__muted' });
			return;
		}

		for (const qualityIssue of snapshot.qualityIssues) {
			this.renderQualityIssue(parent, qualityIssue);
		}
	}

	private renderProjectCard(parent: HTMLElement, project: CreativeProject): void {
		const card = parent.createDiv({ cls: 'creative-ops__card' });
		this.createOpenButton(card, project);
		card.createEl('p', { text: project.category ?? 'No category', cls: 'creative-ops__muted' });
		this.createStatusSelect(card, project);
		card.createEl('p', {
			text: `Due: ${project.targetDate?.value ?? '—'} · Progress: ${project.progress ?? '—'}${
				project.progress === undefined ? '' : '%'
			}`,
		});
		card.createEl('p', {
			text: `Related: ${project.relations.outgoing.length} links, ${project.relations.incoming.length} backlinks`,
			cls: 'creative-ops__muted',
		});
	}

	private renderSummaryCard(parent: HTMLElement, label: string, count: number): void {
		const card = parent.createDiv({ cls: 'creative-ops__summary-card' });
		card.createDiv({ text: String(count) });
		card.createDiv({ text: label, cls: 'creative-ops__muted' });
	}

	private renderQualityIssue(parent: HTMLElement, qualityIssue: QualityIssue): void {
		const item = parent.createDiv({
			cls: `creative-ops__quality-item creative-ops__quality-${qualityIssue.severity}`,
		});
		item.createEl('strong', { text: qualityIssue.ruleId });
		item.createDiv({ text: qualityIssue.message });
		item.createEl('small', { text: qualityIssue.path, cls: 'creative-ops__muted' });
	}

	private createOpenButton(parent: HTMLElement, project: CreativeProject): void {
		const button = parent.createEl('button', { text: project.title });
		button.type = 'button';
		button.addEventListener('click', () => this.openProject(project.path));
	}

	private createStatusSelect(parent: HTMLElement, project: CreativeProject): void {
		const select = parent.createEl('select');
		select.createEl('option', { text: 'Select status', value: '' });
		for (const status of this.plugin.settings.statuses) {
			select.createEl('option', { text: status.label, value: status.id });
		}
		if (
			project.status &&
			!this.plugin.settings.statuses.some((status) => status.id === project.status)
		) {
			select.createEl('option', { text: `Unknown: ${project.status}`, value: project.status });
		}
		select.value = project.status ?? '';
		select.addEventListener('change', () => {
			if (select.value) {
				void this.plugin.setProjectStatus(project.path, select.value);
			}
		});
	}

	private openProject(path: string): void {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) {
			new Notice('The project note no longer exists. Refresh the view.');
			return;
		}
		void this.app.workspace.getLeaf(true).openFile(file);
	}

	private getStatusLabel(status: string): string {
		if (status === 'missing') {
			return 'Missing status';
		}
		if (status === 'unknown') {
			return 'Unknown status';
		}
		return this.plugin.settings.statuses.find((item) => item.id === status)?.label ?? status;
	}
}

function formatModifiedDate(timestamp: number): string {
	return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(timestamp);
}
