import type { Manifest } from "./types.ts";
import { validateManifest, type ValidationError } from "./validate.ts";

export class ManifestExtractionError extends Error {
	readonly attempts: number;
	readonly errors: ValidationError[][];

	constructor(attempts: number, errors: ValidationError[][]) {
		super(`Manifest extraction failed after ${attempts} attempt(s).`);
		this.name = "ManifestExtractionError";
		this.attempts = attempts;
		this.errors = errors;
	}
}

export interface ExtractOptions {
	/** Full prompt template text. Defaults to src/prompts/extract-manifest.md. */
	promptTemplate?: string;
	/** Maximum number of LLM attempts (default 3). */
	maxRetries?: number;
}

export interface ExtractResult {
	manifest: Manifest;
	/** Number of LLM attempts that were made. */
	attempts: number;
}

const DEFAULT_MAX_RETRIES = 3;
const CORPUS_HEADER = "== SPECIFICATION FILES ==";

/**
 * Parses a manifest JSON object out of an LLM response. Handles raw JSON as
 * well as JSON wrapped in a single markdown code fence.
 */
export function parseManifestJson(text: string): unknown {
	const trimmed = text.trim();
	const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (fenceMatch) {
		return JSON.parse(fenceMatch[1]);
	}
	const start = trimmed.indexOf("{");
	const end = trimmed.lastIndexOf("}");
	if (start === -1 || end <= start) {
		throw new SyntaxError("no JSON object found in the response");
	}
	return JSON.parse(trimmed.slice(start, end + 1));
}

/**
 * Extracts a validated manifest from the aggregated markdown corpus.
 *
 * This is the "Extract" stage of the pipeline (docs/DESIGN.md §6.1–6.2):
 * one LLM call produces a JSON manifest; deterministic schema validation
 * checks it; on failure the exact errors are fed back to the model and the
 * call is retried up to `maxRetries` times.
 */
export async function extractManifest(
	markdownCorpus: string,
	aiProvider: (prompt: string) => Promise<string>,
	options: ExtractOptions = {},
): Promise<ExtractResult> {
	const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
	const promptTemplate = options.promptTemplate ?? await readDefaultExtractionPrompt();

	const failedAttemptErrors: ValidationError[][] = [];

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		const prompt = buildExtractionPrompt(promptTemplate, markdownCorpus, failedAttemptErrors);
		const response = await aiProvider(prompt);

		let parsed: unknown;
		try {
			parsed = parseManifestJson(response);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			failedAttemptErrors.push([{ path: "$", message: `response is not valid JSON: ${message}` }]);
			continue;
		}

		const result = validateManifest(parsed);
		if (result.ok) {
			return { manifest: result.manifest, attempts: attempt };
		}
		failedAttemptErrors.push(result.errors);
	}

	throw new ManifestExtractionError(maxRetries, failedAttemptErrors);
}

function buildExtractionPrompt(
	template: string,
	corpus: string,
	previousErrors: ValidationError[][],
): string {
	let prompt = `${template}\n\n${CORPUS_HEADER}\n\n${corpus}`;
	if (previousErrors.length > 0) {
		const flat = previousErrors.flat().map((e) => `- ${e.path}: ${e.message}`).join("\n");
		prompt +=
			`\n\nYour previous responses failed validation with these errors:\n${flat}\n` +
			`Respond again with a single corrected JSON manifest that fixes ALL of the errors above.`;
	}
	return prompt;
}

async function readDefaultExtractionPrompt(): Promise<string> {
	const promptUrl = new URL("../prompts/extract-manifest.md", import.meta.url);
	return await Deno.readTextFile(promptUrl);
}
