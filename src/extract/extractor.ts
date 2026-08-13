import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

import { createDirIfNotExists } from "../utils.ts";
import type {
  Constraint,
  ExtractedSpec,
  FunctionParam,
  Model,
  Property,
  SpecFunction,
} from "./types.ts";

export type AiProvider = (prompt: string) => Promise<string>;

const PROMPT_PATH = "../prompts/extract.md";
const LOG_DIR = ".verbo/extract";

/**
 * Ask the LLM to extract structured model data from a spec corpus.
 *
 * One LLM call. If `repairErrors` is given (previous `deno check` failures),
 * the errors are appended as a repair round per DESIGN §6.2 and the model is
 * asked to re-extract and fix them.
 *
 * Prompt and raw response are logged under `.verbo/extract/`.
 */
export async function extract(
  corpus: string,
  aiProvider: AiProvider,
  repairErrors: string[] = [],
): Promise<ExtractedSpec> {
  const moduleDir = dirname(fromFileUrl(import.meta.url));
  const promptTemplate = await Deno.readTextFile(join(moduleDir, PROMPT_PATH));

  const repairSection = repairErrors.length > 0
    ? [
        "",
        "== REPAIR ROUND ==",
        "Your previous extraction produced types that fail type-checking:",
        ...repairErrors.map((e) => `- ${e}`),
        "Please re-extract and fix these errors.",
        "",
      ].join("\n")
    : "";

  const prompt = `${promptTemplate}\n\n== SPEC FILES ==\n${corpus}\n${repairSection}`;

  createDirIfNotExists(LOG_DIR);
  Deno.writeTextFileSync(join(LOG_DIR, "extract-prompt.md"), prompt);

  const responseText = await aiProvider(prompt);
  Deno.writeTextFileSync(join(LOG_DIR, "extract-response.md"), responseText);

  return parseExtraction(responseText);
}

/**
 * Defensively parse and normalize an LLM response into an `ExtractedSpec`.
 * Pure and testable: strips markdown fences or finds the raw JSON object,
 * drops malformed entries, and defaults missing fields.
 */
export function parseExtraction(text: string): ExtractedSpec {
  const jsonText = extractJson(text);
  if (!jsonText) {
    throw new Error(
      "Extraction produced no JSON object. Raw response:\n" + text,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Extraction JSON could not be parsed: ${message}\nRaw response:\n${text}`,
    );
  }

  return normalizeSpec(parsed);
}

// --- JSON extraction ---

/** Find the JSON payload in a model response: first code block, else raw JSON. */
function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Raw JSON fallback — find the outermost `{...}` or `[...]`.
  const opens = [text.indexOf("{"), text.indexOf("[")].filter((i) => i >= 0);
  const closes = [text.lastIndexOf("}"), text.lastIndexOf("]")].filter((i) => i >= 0);
  if (opens.length === 0 || closes.length === 0) return null;

  const start = Math.min(...opens);
  const end = Math.max(...closes);
  if (end <= start) return null;
  return text.slice(start, end + 1).trim();
}
// --- Normalization ---

function normalizeSpec(parsed: unknown): ExtractedSpec {
  const modelsRaw = Array.isArray(parsed)
    ? parsed // tolerate a bare array
    : (parsed as { models?: unknown } | null)?.models;

  if (!Array.isArray(modelsRaw)) {
    throw new Error(
      `Extraction JSON must contain a "models" array. Got: ${JSON.stringify(parsed)}`,
    );
  }

  const models: Model[] = [];
  for (const item of modelsRaw) {
    const model = normalizeModel(item);
    if (model) models.push(model);
  }

  // Functions are optional in the envelope — old extractions (and fixtures)
  // may omit the key entirely.
  const functions: SpecFunction[] = [];
  const functionsRaw = Array.isArray(parsed)
    ? null
    : (parsed as { functions?: unknown } | null)?.functions;
  if (Array.isArray(functionsRaw)) {
    for (const item of functionsRaw) {
      const fn = normalizeFunction(item);
      if (fn) functions.push(fn);
    }
  }

  return { models, functions };
}

function normalizeModel(item: unknown): Model | null {
  if (!item || typeof item !== "object") return null;
  const m = item as Record<string, unknown>;
  if (typeof m.name !== "string" || m.name.trim() === "") return null;

  const properties: Property[] = [];
  if (Array.isArray(m.properties)) {
    for (const p of m.properties) {
      const property = normalizeProperty(p);
      if (property) properties.push(property);
    }
  }

  const model: Model = { name: m.name.trim(), properties };
  if (typeof m.source === "string" && m.source.trim() !== "") {
    model.source = m.source.trim();
  }
  return model;
}

function normalizeFunction(item: unknown): SpecFunction | null {
  if (!item || typeof item !== "object") return null;
  const f = item as Record<string, unknown>;
  if (typeof f.name !== "string" || f.name.trim() === "") return null;

  // Params share the property shape, so reuse the same normalizer.
  const params: FunctionParam[] = [];
  if (Array.isArray(f.params)) {
    for (const p of f.params) {
      const param = normalizeProperty(p);
      if (param) params.push(param);
    }
  }

  const fn: SpecFunction = {
    name: f.name.trim(),
    params,
    returnType: typeof f.returnType === "string" && f.returnType.trim() !== ""
      ? f.returnType.trim()
      : "void",
  };
  if (typeof f.source === "string" && f.source.trim() !== "") {
    fn.source = f.source.trim();
  }
  return fn;
}

function normalizeProperty(item: unknown): Property | null {
  if (!item || typeof item !== "object") return null;
  const p = item as Record<string, unknown>;
  if (typeof p.name !== "string" || p.name.trim() === "") return null;

  const constraints: Constraint[] = [];
  if (Array.isArray(p.constraints)) {
    for (const c of p.constraints) {
      const constraint = normalizeConstraint(c);
      if (constraint) constraints.push(constraint);
    }
  }

  // "required" wins over "optional"; the `optional` constraint kind is folded
  // into the boolean and dropped from the list to avoid redundancy.
  let optional = p.optional === true ||
    constraints.some((c) => c.kind === "optional");
  if (constraints.some((c) => c.kind === "required")) optional = false;
  const keptConstraints = constraints.filter((c) => c.kind !== "optional");

  const property: Property = {
    name: p.name.trim(),
    type: typeof p.type === "string" && p.type.trim() !== ""
      ? p.type.trim()
      : "string",
    optional,
    constraints: keptConstraints,
  };
  if (typeof p.source === "string" && p.source.trim() !== "") {
    property.source = p.source.trim();
  }
  return property;
}

function normalizeConstraint(item: unknown): Constraint | null {
  if (!item || typeof item !== "object") return null;
  const c = item as Record<string, unknown>;
  if (typeof c.kind !== "string" || c.kind.trim() === "") return null;

  const constraint: Constraint = { kind: c.kind.trim() as Constraint["kind"] };
  if (Array.isArray(c.values)) {
    const values = c.values.filter(
      (v): v is string | number => typeof v === "string" || typeof v === "number",
    );
    if (values.length > 0) constraint.values = values;
  }
  if (typeof c.min === "number") constraint.min = c.min;
  if (typeof c.max === "number") constraint.max = c.max;
  if (typeof c.value === "string" || typeof c.value === "number") {
    constraint.value = c.value;
  }
  return constraint;
}

