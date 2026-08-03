import { App, Modal, Notice, Setting } from 'obsidian';
import type CreativeOpsPlugin from '../main';

export class CreateProjectModal extends Modal {
	private title = '';
	private category: string;
	private status: string;
	private priority: string;
	private targetDate = '';
	private folder: string;
	private templatePath: string;

	constructor(
		app: App,
		private readonly plugin: CreativeOpsPlugin,
	) {
		super(app);
		this.category = plugin.settings.defaultCategory;
		this.status = plugin.settings.defaultStatus;
		this.priority = plugin.settings.defaultPriority;
		this.folder = plugin.settings.outputFolder;
		this.templatePath = plugin.settings.templatePath;
	}

	onOpen(): void {
		this.contentEl.createEl('h2', { text: 'Create creative project' });

		new Setting(this.contentEl)
			.setName('Title')
			.setDesc('Creates a new Markdown note. Existing notes are never overwritten.')
			.addText((text) =>
				text.setPlaceholder('Project title').onChange((value) => {
					this.title = value;
				}),
			);

		new Setting(this.contentEl)
			.setName('Category')
			.addText((text) =>
				text.setValue(this.category).onChange((value) => {
					this.category = value;
				}),
			);

		new Setting(this.contentEl).setName('Status').addDropdown((dropdown) => {
			for (const status of this.plugin.settings.statuses) {
				dropdown.addOption(status.id, status.label);
			}
			dropdown.setValue(this.status);
			dropdown.onChange((value) => {
				this.status = value;
			});
		});

		new Setting(this.contentEl).setName('Priority').addDropdown((dropdown) => {
			dropdown.addOption('low', 'Low');
			dropdown.addOption('medium', 'Medium');
			dropdown.addOption('high', 'High');
			dropdown.setValue(this.priority);
			dropdown.onChange((value) => {
				this.priority = value;
			});
		});

		new Setting(this.contentEl)
			.setName('Target date')
			.setDesc('Optional. Use yyyy-mm-dd.')
			.addText((text) =>
				text.setPlaceholder('2026-08-17').onChange((value) => {
					this.targetDate = value;
				}),
			);

		new Setting(this.contentEl)
			.setName('Destination folder')
			.setDesc('Vault-relative path. Parent folders are created when missing.')
			.addText((text) =>
				text.setValue(this.folder).onChange((value) => {
					this.folder = value;
				}),
			);

		new Setting(this.contentEl)
			.setName('Template')
			.setDesc('Optional vault-relative Markdown template.')
			.addText((text) =>
				text.setValue(this.templatePath).onChange((value) => {
					this.templatePath = value;
				}),
			);

		new Setting(this.contentEl)
			.addButton((button) =>
				button
					.setButtonText('Create')
					.setCta()
					.onClick(async () => {
						await this.create();
					}),
			)
			.addExtraButton((button) =>
				button.setIcon('x').setTooltip('Cancel').onClick(() => this.close()),
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async create(): Promise<void> {
		try {
			const file = await this.plugin.createProject({
				title: this.title,
				category: this.category,
				status: this.status,
				priority: this.priority,
				targetDate: this.targetDate.trim(),
				folder: this.folder,
				templatePath: this.templatePath,
			});
			this.close();
			await this.app.workspace.getLeaf(true).openFile(file);
			new Notice(`Created ${file.basename}.`);
		} catch (error) {
			new Notice(error instanceof Error ? error.message : 'Could not create project note.');
		}
	}
}
