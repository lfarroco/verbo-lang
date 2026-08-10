/**
 * Manifest schema — the structured IR extracted from Verbo markdown specs.
 * This is the authoritative shape defined in docs/DESIGN.md §5.
 */

export const SCHEMA_VERSION = 1 as const;

export const TYPE_KINDS = [
	"string",
	"number",
	"boolean",
	"date",
	"array",
	"object",
	"enum",
	"ref",
] as const;

export const PORT_KINDS = [
	"http",
	"db",
	"readDirectory",
	"render",
	"console",
] as const;

export type TypeKind = typeof TYPE_KINDS[number];
export type PortKind = typeof PORT_KINDS[number];

/** Points back to the spec prose an element was extracted from. */
export interface SourceRef {
	sourceFile: string;
	sourceLine: number;
}

export interface ProjectInfo extends SourceRef {
	name: string;
	description: string;
}

export interface PropertyDef extends SourceRef {
	name: string;
	/** Primitive name or a manifest type name. */
	type: string;
	constraints?: string[];
	optional?: boolean;
}

export interface TypeDef extends SourceRef {
	name: string;
	kind: TypeKind;
	constraints?: string[];
	/** Name of the referenced type; present when kind === "ref". */
	ref?: string;
	/** Element type; present when kind === "array". */
	items?: TypeDef;
	/** Present when kind === "enum". */
	enumValues?: string[];
	/** Present when kind === "object". */
	properties?: PropertyDef[];
}

export interface ParameterDef extends SourceRef {
	name: string;
	/** Primitive name or a manifest type name. */
	type: string;
	optional?: boolean;
	/** CLI flag annotation, e.g. "-l" or "--long". */
	flag?: string;
}

export interface PortDef {
	kind: PortKind;
	name?: string;
	description?: string;
}

export interface FunctionDef extends SourceRef {
	/** "ls", "GET /heroes", "/heroes/{id}/items/{itemId}", ... */
	name: string;
	parameters: ParameterDef[];
	ports: PortDef[];
	behaviorRules: string[];
	errors: string[];
}

export interface CliSection extends SourceRef {
	/** Binary name, e.g. "ls". */
	name: string;
	flags: ParameterDef[];
	consolePort: PortDef;
}

export interface Manifest {
	schemaVersion: typeof SCHEMA_VERSION;
	project: ProjectInfo;
	types: TypeDef[];
	functions: FunctionDef[];
	cli?: CliSection;
}
