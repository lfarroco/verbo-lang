import type { Manifest } from "./types.ts";
import { PORT_KINDS, SCHEMA_VERSION, TYPE_KINDS } from "./types.ts";

export interface ValidationError {
	/** JSON-path style location, e.g. "$.types[0].kind". */
	path: string;
	message: string;
}

export type ValidationResult =
	| { ok: true; manifest: Manifest }
	| { ok: false; errors: ValidationError[] };

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
	return typeof v === "string";
}

function isNonEmptyString(v: unknown): v is string {
	return isString(v) && v.trim().length > 0;
}

function isPositiveInt(v: unknown): v is number {
	return typeof v === "number" && Number.isInteger(v) && v > 0;
}

function isStringArray(v: unknown): v is string[] {
	return Array.isArray(v) && v.every(isNonEmptyString);
}

function validateSourceRef(
	v: Record<string, unknown>,
	path: string,
	errors: ValidationError[],
): void {
	if (!isNonEmptyString(v.sourceFile)) {
		errors.push({ path: `${path}.sourceFile`, message: "expected a non-empty string" });
	}
	if (!isPositiveInt(v.sourceLine)) {
		errors.push({ path: `${path}.sourceLine`, message: "expected a positive integer" });
	}
}

function validateTypeDef(v: unknown, path: string, errors: ValidationError[]): void {
	if (!isRecord(v)) {
		errors.push({ path, message: "expected an object" });
		return;
	}
	if (!isNonEmptyString(v.name)) {
		errors.push({ path: `${path}.name`, message: "expected a non-empty string" });
	} else if (!IDENTIFIER_RE.test(v.name)) {
		errors.push({ path: `${path}.name`, message: `"${v.name}" is not a valid type name` });
	}
	if (!isString(v.kind) || !(TYPE_KINDS as readonly string[]).includes(v.kind)) {
		errors.push({ path: `${path}.kind`, message: `expected one of: ${TYPE_KINDS.join(", ")}` });
	}
	validateSourceRef(v, path, errors);
	if (v.constraints !== undefined && !isStringArray(v.constraints)) {
		errors.push({ path: `${path}.constraints`, message: "expected an array of non-empty strings" });
	}

	const kind = v.kind;
	if (kind === "ref" && !isNonEmptyString(v.ref)) {
		errors.push({ path: `${path}.ref`, message: 'expected a non-empty "ref" for kind "ref"' });
	}
	if (kind === "enum") {
		if (!Array.isArray(v.enumValues) || v.enumValues.length === 0 || !v.enumValues.every(isNonEmptyString)) {
			errors.push({ path: `${path}.enumValues`, message: "expected a non-empty array of non-empty strings" });
		}
	}
	if (kind === "array") {
		if (v.items === undefined) {
			errors.push({ path: `${path}.items`, message: 'expected "items" for kind "array"' });
		} else {
			validateTypeDef(v.items, `${path}.items`, errors);
		}
	}
	if (kind === "object") {
		if (!Array.isArray(v.properties)) {
			errors.push({ path: `${path}.properties`, message: 'expected "properties" for kind "object"' });
		} else {
			v.properties.forEach((p, i) => validatePropertyDef(p, `${path}.properties[${i}]`, errors));
		}
	}
}

function validatePropertyDef(v: unknown, path: string, errors: ValidationError[]): void {
	if (!isRecord(v)) {
		errors.push({ path, message: "expected an object" });
		return;
	}
	if (!isNonEmptyString(v.name)) {
		errors.push({ path: `${path}.name`, message: "expected a non-empty string" });
	}
	if (!isNonEmptyString(v.type)) {
		errors.push({ path: `${path}.type`, message: "expected a non-empty string" });
	}
	validateSourceRef(v, path, errors);
	if (v.constraints !== undefined && !isStringArray(v.constraints)) {
		errors.push({ path: `${path}.constraints`, message: "expected an array of non-empty strings" });
	}
}

function validateParameterDef(v: unknown, path: string, errors: ValidationError[]): void {
	if (!isRecord(v)) {
		errors.push({ path, message: "expected an object" });
		return;
	}
	if (!isNonEmptyString(v.name)) {
		errors.push({ path: `${path}.name`, message: "expected a non-empty string" });
	}
	if (!isNonEmptyString(v.type)) {
		errors.push({ path: `${path}.type`, message: "expected a non-empty string" });
	}
	validateSourceRef(v, path, errors);
	if (v.flag !== undefined && !isNonEmptyString(v.flag)) {
		errors.push({ path: `${path}.flag`, message: "expected a non-empty string" });
	}
}

function validatePortDef(v: unknown, path: string, errors: ValidationError[]): void {
	if (!isRecord(v)) {
		errors.push({ path, message: "expected an object" });
		return;
	}
	if (!isString(v.kind) || !(PORT_KINDS as readonly string[]).includes(v.kind)) {
		errors.push({ path: `${path}.kind`, message: `expected one of: ${PORT_KINDS.join(", ")}` });
	}
}

function validateFunctionDef(v: unknown, path: string, errors: ValidationError[]): void {
	if (!isRecord(v)) {
		errors.push({ path, message: "expected an object" });
		return;
	}
	if (!isNonEmptyString(v.name)) {
		errors.push({ path: `${path}.name`, message: "expected a non-empty string" });
	}
	validateSourceRef(v, path, errors);
	if (!Array.isArray(v.parameters)) {
		errors.push({ path: `${path}.parameters`, message: "expected an array" });
	} else {
		v.parameters.forEach((p, i) => validateParameterDef(p, `${path}.parameters[${i}]`, errors));
	}
	if (!Array.isArray(v.ports)) {
		errors.push({ path: `${path}.ports`, message: "expected an array" });
	} else {
		v.ports.forEach((p, i) => validatePortDef(p, `${path}.ports[${i}]`, errors));
	}
	if (!Array.isArray(v.behaviorRules) || !v.behaviorRules.every(isNonEmptyString)) {
		errors.push({ path: `${path}.behaviorRules`, message: "expected an array of non-empty strings" });
	}
	if (!Array.isArray(v.errors) || !v.errors.every(isNonEmptyString)) {
		errors.push({ path: `${path}.errors`, message: "expected an array of non-empty strings" });
	}
}

function validateProject(v: unknown, path: string, errors: ValidationError[]): void {
	if (!isRecord(v)) {
		errors.push({ path, message: "expected an object" });
		return;
	}
	if (!isNonEmptyString(v.name)) {
		errors.push({ path: `${path}.name`, message: "expected a non-empty string" });
	}
	if (!isString(v.description)) {
		errors.push({ path: `${path}.description`, message: "expected a string" });
	}
	validateSourceRef(v, path, errors);
}

function validateCliSection(v: unknown, path: string, errors: ValidationError[]): void {
	if (!isRecord(v)) {
		errors.push({ path, message: "expected an object" });
		return;
	}
	if (!isNonEmptyString(v.name)) {
		errors.push({ path: `${path}.name`, message: "expected a non-empty string" });
	}
	validateSourceRef(v, path, errors);
	if (!Array.isArray(v.flags)) {
		errors.push({ path: `${path}.flags`, message: "expected an array" });
	} else {
		v.flags.forEach((f, i) => validateParameterDef(f, `${path}.flags[${i}]`, errors));
	}
	if (v.consolePort !== undefined) {
		validatePortDef(v.consolePort, `${path}.consolePort`, errors);
	}
}

/**
 * Deterministic schema validation of a parsed manifest (docs/DESIGN.md §6.2).
 * Collects every error it can find instead of stopping at the first one, so
 * the repair loop can feed the complete list back to the extraction model.
 */
export function validateManifest(data: unknown): ValidationResult {
	const errors: ValidationError[] = [];

	if (!isRecord(data)) {
		errors.push({ path: "$", message: "expected the manifest to be a JSON object" });
		return { ok: false, errors };
	}

	if (data.schemaVersion !== SCHEMA_VERSION) {
		errors.push({ path: "$.schemaVersion", message: `expected ${SCHEMA_VERSION}` });
	}

	validateProject(data.project, "$.project", errors);

	if (!Array.isArray(data.types)) {
		errors.push({ path: "$.types", message: "expected an array" });
	} else {
		data.types.forEach((t, i) => validateTypeDef(t, `$.types[${i}]`, errors));
	}

	if (!Array.isArray(data.functions)) {
		errors.push({ path: "$.functions", message: "expected an array" });
	} else {
		data.functions.forEach((f, i) => validateFunctionDef(f, `$.functions[${i}]`, errors));
	}

	if (data.cli !== undefined) {
		validateCliSection(data.cli, "$.cli", errors);
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}
	return { ok: true, manifest: data as unknown as Manifest };
}
