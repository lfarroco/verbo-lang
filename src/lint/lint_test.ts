import { assert, assertEquals } from "@std/assert";
import { guildFiles, guildManifest } from "../manifest/fixtures.ts";
import { lintManifest, type LintIssue } from "./lint.ts";

function issuesByRule(issues: LintIssue[]): Record<string, LintIssue[]> {
	const grouped: Record<string, LintIssue[]> = {};
	for (const issue of issues) {
		(grouped[issue.rule] ??= []).push(issue);
	}
	return grouped;
}

Deno.test("lint accepts a clean manifest", () => {
	const issues = lintManifest(guildManifest(), guildFiles());
	assertEquals(issues, []);
});

Deno.test("lint flags a missing required file", () => {
	const issues = lintManifest(
		guildManifest(),
		guildFiles().filter((f) => f !== "main.md"),
	);
	const byRule = issuesByRule(issues);
	assertEquals(byRule["required-files"]?.length, 1);
	assertEquals(byRule["required-files"][0].severity, "CRITICAL");
	assert(byRule["required-files"][0].message.includes("main.md"));
});

Deno.test("lint honors custom required files", () => {
	const issues = lintManifest(guildManifest(), guildFiles(), { requiredFiles: ["ports.md"] });
	const byRule = issuesByRule(issues);
	assertEquals(byRule["required-files"]?.length, 1);
	assert(byRule["required-files"][0].message.includes("ports.md"));
});

Deno.test("lint flags duplicate type names", () => {
	const m = guildManifest();
	m.types.push({ ...m.types[0] });
	const issues = lintManifest(m, guildFiles());
	const byRule = issuesByRule(issues);
	assertEquals(byRule["unique-names"]?.length, 1);
	assert(byRule["unique-names"][0].message.includes("Hero"));
});

Deno.test("lint flags duplicate property names within a type", () => {
	const m = guildManifest();
	const props = m.types[0].properties ?? [];
	props.push({ ...props[0] });
	const issues = lintManifest(m, guildFiles());
	const byRule = issuesByRule(issues);
	assert(
		byRule["unique-names"]?.some((i) => i.message.includes('Property "name"')),
	);
});

Deno.test("lint flags duplicate function names", () => {
	const m = guildManifest();
	m.functions.push({ ...m.functions[0] });
	const issues = lintManifest(m, guildFiles());
	const byRule = issuesByRule(issues);
	assert(
		byRule["unique-names"]?.some((i) => i.message.includes('Function "GET /heroes"')),
	);
});

Deno.test("lint flags an unresolved function parameter type", () => {
	const m = guildManifest();
	m.functions[0].parameters.push({
		name: "guild",
		type: "Guild",
		sourceFile: "routes.md",
		sourceLine: 2,
	});
	const issues = lintManifest(m, guildFiles());
	const byRule = issuesByRule(issues);
	assertEquals(byRule["resolvable-refs"]?.length, 1);
	assert(byRule["resolvable-refs"][0].message.includes("Guild"));
});

Deno.test("lint flags a relationship to an undefined type", () => {
	const m = guildManifest();
	m.types[0].properties?.push({
		name: "guild",
		type: "Guild",
		sourceFile: "models/hero.md",
		sourceLine: 9,
	});
	const issues = lintManifest(m, guildFiles());
	const byRule = issuesByRule(issues);
	assertEquals(byRule["resolvable-relationships"]?.length, 1);
	assert(byRule["resolvable-relationships"][0].message.includes("Guild"));
});

Deno.test("lint flags a ref type that does not resolve", () => {
	const m = guildManifest();
	m.types.push({
		name: "FavoriteItem",
		kind: "ref",
		ref: "Missing",
		sourceFile: "models/item.md",
		sourceLine: 1,
	});
	const issues = lintManifest(m, guildFiles());
	const byRule = issuesByRule(issues);
	assertEquals(byRule["resolvable-relationships"]?.length, 1);
	assert(byRule["resolvable-relationships"][0].message.includes("Missing"));
});

Deno.test("lint flags duplicate routes with the same method and path", () => {
	const m = guildManifest();
	m.functions.push({
		...m.functions[0],
		name: "GET /heroes",
		sourceFile: "routes.md",
		sourceLine: 5,
	});
	const issues = lintManifest(m, guildFiles());
	const byRule = issuesByRule(issues);
	assertEquals(byRule["no-ambiguous-routes"]?.length, 1);
	assert(byRule["no-ambiguous-routes"][0].message.includes("Duplicate route"));
});

Deno.test("lint flags ambiguous methodless routes (test/guild regression)", () => {
	const m = guildManifest();
	// Old test/guild/routes.md listed this path twice with no HTTP method.
	m.functions = [
		{
			name: "/heroes/{id}/items/{itemId}",
			sourceFile: "routes.md",
			sourceLine: 10,
			parameters: [],
			ports: [{ kind: "http" }],
			behaviorRules: ["Add an item to a hero."],
			errors: [],
		},
		{
			name: "/heroes/{id}/items/{itemId}",
			sourceFile: "routes.md",
			sourceLine: 11,
			parameters: [],
			ports: [{ kind: "http" }],
			behaviorRules: ["Remove an item from a hero."],
			errors: [],
		},
	];
	const issues = lintManifest(m, guildFiles());
	const byRule = issuesByRule(issues);
	assertEquals(byRule["no-ambiguous-routes"]?.length, 1);
	assert(byRule["no-ambiguous-routes"][0].message.includes("Ambiguous route"));
});

Deno.test("lint accepts distinct methods on the same path", () => {
	const m = guildManifest();
	m.functions = [
		{ ...m.functions[0], name: "PUT /heroes" },
		{ ...m.functions[0], name: "DELETE /heroes" },
	];
	const issues = lintManifest(m, guildFiles());
	assertEquals(issues, []);
});

Deno.test("lint ignores non-route function names for route checks", () => {
	const m = guildManifest();
	m.functions = [{
		...m.functions[0],
		name: "calculateSum",
		parameters: [
			{ name: "a", type: "number", sourceFile: "main.md", sourceLine: 4 },
			{ name: "b", type: "number", sourceFile: "main.md", sourceLine: 4 },
		],
		ports: [],
	}];
	const issues = lintManifest(m, guildFiles());
	assertEquals(issues, []);
});
