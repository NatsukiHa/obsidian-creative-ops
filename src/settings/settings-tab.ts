import { App, PluginSettingTab, Setting } from 'obsidian';
import type CreativeOpsPlugin from '../main';
import {
	formatRequiredProperties,
	formatStatusDefinitions,
	parseRequiredProperties,
	parseStatusDefinitions,
} from './settings-model';

export class CreativeOpsSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: CreativeOpsPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Project folder')
			.setDesc('Optional vault-relative folder to scan. Leave blank to scan the whole vault.')
			.addText((text) =>
				text
					.setPlaceholder('Creative projects')
					.setValue(this.plugin.settings.projectFolder)
					.onChange(async (value) => {
						await this.plugin.updateSettings({ projectFolder: value });
					}),
			);

		new Setting(containerEl)
			.setName('Default destination')
			.setDesc('Vault-relative folder used by the create command.')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.outputFolder)
					.onChange(async (value) => {
						await this.plugin.updateSettings({ outputFolder: value });
					}),
			);

		new Setting(containerEl)
			.setName('Template path')
			.setDesc('Optional vault-relative Markdown template. Its required properties are checked.')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.templatePath)
					.onChange(async (value) => {
						await this.plugin.updateSettings({ templatePath: value });
					}),
			);

		new Setting(containerEl)
			.setName('Stalled after days')
			.setDesc('Active projects older than this threshold appear in the quality report.')
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.staleDays))
					.onChange(async (value) => {
						await this.plugin.updateSettings({ staleDays: Number(value) });
					}),
			);

		new Setting(containerEl)
			.setName('Statuses')
			.setDesc('Comma-separated lowercase ids. Existing unknown statuses are reported, never changed automatically.')
			.addText((text) =>
				text
					.setValue(formatStatusDefinitions(this.plugin.settings.statuses))
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							statuses: parseStatusDefinitions(value),
						});
					}),
			);

		new Setting(containerEl)
			.setName('Default status')
			.setDesc('Applied only when creating or explicitly registering a note with no status.')
			.addDropdown((dropdown) => {
				for (const status of this.plugin.settings.statuses) {
					dropdown.addOption(status.id, status.label);
				}
				dropdown.setValue(this.plugin.settings.defaultStatus);
				dropdown.onChange(async (value) => {
					await this.plugin.updateSettings({ defaultStatus: value });
				});
			});

		new Setting(containerEl)
			.setName('Required properties')
			.setDesc('Comma-separated fields that quality inspection reports when absent.')
			.addText((text) =>
				text
					.setValue(formatRequiredProperties(this.plugin.settings.requiredProperties))
					.onChange(async (value) => {
						await this.plugin.updateSettings({
							requiredProperties: parseRequiredProperties(value),
						});
					}),
			);
	}
}
