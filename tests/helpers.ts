import { parseCreativeProject } from '../src/parser/project';
import type { CreativeProject, ProjectRelations } from '../src/types';

export const EMPTY_RELATIONS: ProjectRelations = {
	outgoing: [],
	incoming: [],
	unresolved: [],
};

export function createProject(
	frontmatter: Record<string, unknown> = {},
	overrides: Partial<{
		path: string;
		basename: string;
		modifiedAt: number;
		relations: ProjectRelations;
	}> = {},
): CreativeProject {
	const project = parseCreativeProject(
		{
			path: overrides.path ?? 'Creative Projects/Example.md',
			basename: overrides.basename ?? 'Example',
			modifiedAt: overrides.modifiedAt ?? Date.UTC(2026, 7, 3),
			relations: overrides.relations ?? EMPTY_RELATIONS,
		},
		{
			type: 'creative-project',
			status: 'draft',
			category: 'article',
			priority: 'medium',
			'target-date': '2026-08-10',
			progress: 25,
			...frontmatter,
		},
	);
	if (!project) {
		throw new Error('Test project should be recognized.');
	}
	return project;
}
