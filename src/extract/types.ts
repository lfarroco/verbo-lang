/**
 * Extracted-spec schema — the structured model data the extraction LLM
 * produces from natural-language spec files, and the type generator consumes.
 *
 * @see docs/DESIGN.md §5.1 (what the LLM extracts), §7 (type generation)
 */

export type ConstraintKind =
  | "required"
  | "optional"
  | "enum"
  | "range"
  | "minimum"
  | "maximum"
  | "positive"
  | "format";

/**
 * A value-level constraint on a property. Which fields are meaningful depends
 * on the kind:
 * - `enum`: `values`
 * - `range`: `min`, `max` (inclusive)
 * - `minimum` / `maximum`: `value`
 * - `format`: `value` (e.g. "email", "url", "uuid", "date")
 * - `required` / `optional` / `positive`: no extra fields
 */
export interface Constraint {
  kind: ConstraintKind;
  values?: (string | number)[];
  min?: number;
  max?: number;
  value?: string | number;
}

/**
 * A property of a model.
 *
 * `type` is the type vocabulary: a primitive (`string`, `number`, `boolean`),
 * `date`, an array of a primitive (`string[]`, `number[]`, `boolean[]`), the
 * name of another model — a direct reference (`Teacher`) — or an array of
 * another model's name — many references (`Class[]`). A reference to another
 * model is exactly how relationships are expressed.
 */
export interface Property {
  name: string;
  type: string;
  /** Whether the property may be omitted. Defaults to false. */
  optional?: boolean;
  constraints?: Constraint[];
  /** Source hint, e.g. "models/student.md". */
  source?: string;
}

export interface Model {
  name: string;
  /** Source file, e.g. "models/student.md". */
  source?: string;
  properties: Property[];
}

/**
 * A parameter of a function. The shape mirrors `Property` (name, type,
 * optional, constraints) but the semantics are for function arguments, not
 * model fields.
 */
export interface FunctionParam {
  name: string;
  type: string;
  /** Whether the argument may be omitted. Defaults to false. */
  optional?: boolean;
  constraints?: Constraint[];
  /** Source hint, e.g. "functions.md". */
  source?: string;
}

/**
 * A function signature described in the specs — a helper or operation the
 * system provides. Extracted from prose ("a helper that formats a date"),
 * emitted as a TS function type contract in `types.verbo.ts`, and verified by
 * `deno check`. No implementation is generated — an AI coding tool reads the
 * contract and implements it (DESIGN §1).
 */
export interface SpecFunction {
  name: string;
  /** Source file, e.g. "functions.md". */
  source?: string;
  params: FunctionParam[];
  /** Return type from the same vocabulary as `Property.type`, or "void". */
  returnType: string;
}

/** The full extraction result — a JSON envelope of models and functions. */
export interface ExtractedSpec {
  models: Model[];
  functions?: SpecFunction[];
}
