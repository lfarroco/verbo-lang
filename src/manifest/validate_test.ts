import { assert, assertEquals } from "@std/assert";
import { guildManifest } from "./fixtures.ts";
import { validateManifest } from "./validate.ts";
import type { Manifest } from "./types.ts";

/** Deep-copies the guild fixture into an untyped record so tests can break it. */
function raw(m: Manifest): Record<string, unknown> {
	return JSON.parse(JSON.stringify(m)) as Record<string, unknown>;
}

function typesOf(m: Record<string, unknown>): Record<string, unknown>[] {
	return m.types as Record<string, unknown>[];
}

function functionsOf(m: Record<string, unknown>): Record<string, unknown>[] {
	return m.functions as Record<string, unknown>[];
}

Deno.test("accepts a valid manifest", () => {
	const result = validateManifest(guildManifest());
	assert(result.ok);
	assertEquals(result.manifest.project.name, "Guild Simulator API");
});

Deno.test("rejects non-object manifests", () => {
	for (const bad of [null, "hello", 42, [1, 2]]) {
		const result = validateManifest(bad);
		assert(!result.ok);
		assertEquals(result.errors, [{
			path: "$",
			message: "expected the manifest to be a JSON object",
		}]);
	}
});

Deno.test("rejects a wrong schemaVersion", () => {
	const m = raw(guildManifest());
	m.schemaVersion = 2;
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.schemaVersion"));
});

Deno.test("rejects a manifest without a project name", () => {
	const m = raw(guildManifest());
	(m.project as Record<string, unknown>).name = "";
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.project.name"));
});

Deno.test("rejects an invalid type kind", () => {
	const m = raw(guildManifest());
	typesOf(m)[0].kind = "list";
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.types[0].kind"));
});

Deno.test("rejects a type name that is not a valid identifier", () => {
	const m = raw(guildManifest());
	typesOf(m)[0].name = "hero 1";
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.types[0].name"));
});

Deno.test("rejects an enum type without enumValues", () => {
	const m = raw(guildManifest());
	typesOf(m).push({ name: "Status", kind: "enum", sourceFile: "models/todo.md", sourceLine: 3 });
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.types[2].enumValues"));
});

Deno.test("rejects an array type without items", () => {
	const m = raw(guildManifest());
	typesOf(m).push({ name: "ItemList", kind: "array", sourceFile: "models/item.md", sourceLine: 1 });
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.types[2].items"));
});

Deno.test("validates nested array item types", () => {
	const m = raw(guildManifest());
	typesOf(m).push({
		name: "HeroList",
		kind: "array",
		sourceFile: "main.md",
		sourceLine: 2,
		items: { name: "Hero", kind: "nope", sourceFile: "x.md", sourceLine: 1 },
	});
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.types[2].items.kind"));
});

Deno.test("rejects a ref type without ref", () => {
	const m = raw(guildManifest());
	typesOf(m).push({ name: "FavoriteItem", kind: "ref", sourceFile: "models/item.md", sourceLine: 1 });
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.types[2].ref"));
});

Deno.test("rejects an object type without properties", () => {
	const m = raw(guildManifest());
	typesOf(m).push({ name: "EmptyObject", kind: "object", sourceFile: "main.md", sourceLine: 5 });
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.types[2].properties"));
});

Deno.test("rejects a property without a type", () => {
	const m = raw(guildManifest());
	(typesOf(m)[0].properties as Record<string, unknown>[])[0].type = "";
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.types[0].properties[0].type"));
});

Deno.test("rejects a function without parameters", () => {
	const m = raw(guildManifest());
	functionsOf(m)[0].parameters = undefined;
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.functions[0].parameters"));
});

Deno.test("rejects an unknown port kind", () => {
	const m = raw(guildManifest());
	(functionsOf(m)[0].ports as Record<string, unknown>[])[0].kind = "websocket";
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.functions[0].ports[0].kind"));
});

Deno.test("collects multiple errors in one pass", () => {
	const m = raw(guildManifest());
	typesOf(m)[0].kind = "nope";
	functionsOf(m)[0].name = "";
	const result = validateManifest(m);
	assert(!result.ok);
	assert(result.errors.some((e) => e.path === "$.types[0].kind"));
	assert(result.errors.some((e) => e.path === "$.functions[0].name"));
});

Deno.test("accepts an optional cli section", () => {
	const m = guildManifest();
	m.cli = {
		name: "ls",
		flags: [{ name: "all", type: "boolean", flag: "-a", sourceFile: "main.md", sourceLine: 2 }],
		consolePort: { kind: "console" },
		sourceFile: "main.md",
		sourceLine: 2,
	};
	const result = validateManifest(m);
	assert(result.ok);
});
