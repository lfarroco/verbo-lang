import type { Manifest } from "./types.ts";

/**
 * A minimal, valid web-app (guild-style) manifest used across unit tests.
 * Returns a fresh deep copy on every call so tests can mutate it freely.
 */
export function guildManifest(): Manifest {
	return {
		schemaVersion: 1,
		project: {
			name: "Guild Simulator API",
			description: "An RPG guild simulator web API.",
			sourceFile: "main.md",
			sourceLine: 1,
		},
		types: [
			{
				name: "Hero",
				kind: "object",
				sourceFile: "models/hero.md",
				sourceLine: 1,
				properties: [
					{ name: "name", type: "string", sourceFile: "models/hero.md", sourceLine: 3 },
					{
						name: "level",
						type: "number",
						sourceFile: "models/hero.md",
						sourceLine: 4,
						constraints: ["1..100"],
					},
					{ name: "items", type: "Item", sourceFile: "models/hero.md", sourceLine: 12 },
				],
			},
			{
				name: "Item",
				kind: "object",
				sourceFile: "models/item.md",
				sourceLine: 1,
				properties: [
					{ name: "name", type: "string", sourceFile: "models/item.md", sourceLine: 3 },
					{
						name: "value",
						type: "number",
						sourceFile: "models/item.md",
						sourceLine: 4,
						constraints: ["must be positive"],
					},
				],
			},
		],
		functions: [
			{
				name: "GET /heroes",
				sourceFile: "routes.md",
				sourceLine: 2,
				parameters: [],
				ports: [{ kind: "http" }, { kind: "db" }],
				behaviorRules: ["Return all heroes."],
				errors: [],
			},
			{
				name: "GET /heroes/{id}",
				sourceFile: "routes.md",
				sourceLine: 3,
				parameters: [{ name: "id", type: "number", sourceFile: "routes.md", sourceLine: 3 }],
				ports: [{ kind: "http" }, { kind: "db" }],
				behaviorRules: ["Return the hero with the given id."],
				errors: ["404 when the hero does not exist"],
			},
		],
	};
}

/** The spec files that correspond to guildManifest(). */
export function guildFiles(): string[] {
	return ["main.md", "routes.md", "models/hero.md", "models/item.md"];
}
