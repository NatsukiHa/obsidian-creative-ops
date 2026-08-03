import { Notice } from 'obsidian';
import type CreativeOpsPlugin from '../main';

export function registerCommands(plugin: CreativeOpsPlugin): void {
	plugin.addCommand({
		id: 'create-creative-project',
		name: 'Create new creative project',
		callback: () => plugin.openCreateProjectModal(),
	});

	plugin.addCommand({
		id: 'open-management-view',
		name: 'Open creative management view',
		callback: () => {
			void plugin.activateView();
		},
	});

	plugin.addCommand({
		id: 'register-current-note',
		name: 'Register current note as a creative project',
		callback: () => {
			void plugin.registerCurrentNote();
		},
	});

	plugin.addCommand({
		id: 'reload-creative-data',
		name: 'Reload creative data',
		callback: () => {
			plugin.refreshData();
			new Notice('Creative project data reloaded.');
		},
	});

	plugin.addCommand({
		id: 'run-quality-inspection',
		name: 'Run quality inspection',
		callback: () => {
			void plugin.runQualityInspection();
		},
	});
}
