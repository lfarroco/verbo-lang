import type { FunctionDef, Manifest, PropertyDef, TypeDef } from "../manifest/types.ts";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM";

export interface LintIssue {
	severity: Severity;
	/** Linter rule that produced the issue. */
	rule: string;
	message: string;
	file?: string;
	line?: number;
	name?: string;
}

export interface LintOptions {
	/** Files that must exist in the project (default ["main.md"]). */
	requiredFiles?: string[];
}

const PRIMITIVE_TYPES = new Set(["string", "number", "boolean", "date"]);
const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const DEFAULT_REQUIRED_FILES = ["main.md"];

interface ParsedRoute {
	method?: string;
	path: string;
}

function parseRouteName(name: string): ParsedRoute | null {
	const parts = name.split(/\s+/).filter((p) => p.length > 0);
	if (parts.length >= 2 && HTTP_METHODS.has(parts[0].toUpperCase())) {
		return { method: parts[0].toUpperCase(), path: parts.slice(1).join("") };
	}
	if (parts.length === 1 && parts[0].startsWith("/")) {
		return { method: undefined, path: parts[0] };
	}
	return null;
}

/**
 * Deterministic linter over a manifest and the project's spec files
 * (docs/DESIGN.md §6.3). Runs with zero LLM cost.
 *
 * Rules:
 *  - required-files:           every required spec file exists (CRITICAL)
 *  - unique-names:             type/property/function names are unique (CRITICAL)
 *  - resolvable-refs:          function parameters reference defined types (CRITICAL)
 *  - resolvable-relationships: refs/properties reference defined types (CRITICAL)
 *  - no-ambiguous-routes:      no duplicate or method-less ambiguous routes (CRITICAL)
 */
export function lintManifest(
	manifest: Manifest,
	files: string[],
	options: LintOptions = {},
): LintIssue[] {
	const issues: LintIssue[] = [];
	const requiredFiles = options.requiredFiles ?? DEFAULT_REQUIRED_FILES;

	// 1. Required files exist.
	for (const required of requiredFiles) {
		if (!files.includes(required)) {
			issues.push({
				severity: "CRITICAL",
				rule: "required-files",
				message: `Required file "${required}" is missing from the project`,
				file: required,
			});
		}
	}

	// 2. Type/property/function names are unique within scope.
	const seenTypes = new Map<string, TypeDef>();
	for (const type of manifest.types) {
		if (seenTypes.has(type.name)) {
			issues.push({
				severity: "CRITICAL",
				rule: "unique-names",
				message: `Type "${type.name}" is defined more than once`,
				file: type.sourceFile,
				line: type.sourceLine,
				name: type.name,
			});
		} else {
			seenTypes.set(type.name, type);
		}
		const seenProperties = new Map<string, PropertyDef>();
		for (const prop of type.properties ?? []) {
			if (seenProperties.has(prop.name)) {
				issues.push({
					severity: "CRITICAL",
					rule: "unique-names",
					message: `Property "${prop.name}" is defined more than once in type "${type.name}"`,
					file: prop.sourceFile,
					line: prop.sourceLine,
					name: prop.name,
				});
			} else {
				seenProperties.set(prop.name, prop);
			}
		}
	}

	const seenFunctions = new Map<string, FunctionDef>();
	for (const fn of manifest.functions) {
		if (seenFunctions.has(fn.name)) {
			issues.push({
				severity: "CRITICAL",
				rule: "unique-names",
				message: `Function "${fn.name}" is defined more than once`,
				file: fn.sourceFile,
				line: fn.sourceLine,
				name: fn.name,
			});
		} else {
			seenFunctions.set(fn.name, fn);
		}
	}

	// 3. Functions reference existing types through their parameters.
	const typeNames = new Set(manifest.types.map((t) => t.name));
	for (const fn of manifest.functions) {
		for (const param of fn.parameters) {
			if (!PRIMITIVE_TYPES.has(param.type) && !typeNames.has(param.type)) {
				issues.push({
					severity: "CRITICAL",
					rule: "resolvable-refs",
					message: `Parameter "${param.name}" of function "${fn.name}" references undefined type "${param.type}"`,
					file: param.sourceFile,
					line: param.sourceLine,
					name: param.type,
				});
			}
		}
	}

	// 4. Relationships resolve to defined types.
	for (const type of manifest.types) {
		collectRelationshipIssues(type, issues, typeNames);
	}

	// 5. No duplicate or ambiguous routes. Regression: the old
	//    test/guild/routes.md listed "/heroes/{id}/items/{itemId}" twice with
	//    no HTTP method, which is ambiguous.
	const routes = new Map<string, FunctionDef>();
	for (const fn of manifest.functions) {
		const route = parseRouteName(fn.name);
		if (!route) continue;
		const key = `${route.method ?? "*"}|${route.path}`;
		const existing = routes.get(key);
		if (existing) {
			issues.push({
				severity: "CRITICAL",
				rule: "no-ambiguous-routes",
				message: route.method
					? `Duplicate route "${route.method} ${route.path}" is defined by both "${existing.name}" and "${fn.name}"`
					: `Ambiguous route "${route.path}" is listed more than once without an HTTP method`,
				file: fn.sourceFile,
				line: fn.sourceLine,
				name: fn.name,
			});
		} else {
			routes.set(key, fn);
		}
	}

	return issues;
}

function collectRelationshipIssues(
	type: TypeDef,
	issues: LintIssue[],
	typeNames: Set<string>,
): void {
	if (type.kind === "ref") {
		if (type.ref && !typeNames.has(type.ref)) {
			issues.push({
				severity: "CRITICAL",
				rule: "resolvable-relationships",
				message: `Type "${type.name}" references undefined type "${type.ref}"`,
				file: type.sourceFile,
				line: type.sourceLine,
				name: type.ref,
			});
		}
	} else if (type.kind === "array" && type.items) {
		collectRelationshipIssues(type.items, issues, typeNames);
	} else if (type.kind === "object") {
		for (const prop of type.properties ?? []) {
			if (!PRIMITIVE_TYPES.has(prop.type) && !typeNames.has(prop.type)) {
				issues.push({
					severity: "CRITICAL",
					rule: "resolvable-relationships",
					message: `Property "${prop.name}" of type "${type.name}" references undefined type "${prop.type}"`,
					file: prop.sourceFile,
					line: prop.sourceLine,
					name: prop.type,
				});
			}
		}
	}
}

