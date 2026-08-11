import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

import { type AiProvider, extract } from "../extract/extractor.ts";
import type { ExtractedSpec } from "../extract/types.ts";
import { generateAssertions } from "../generator/assertions.ts";
import { generateTypes } from "../generator/types.ts";
import { aggregateFilesForPrompt, createDirIfNotExists } from "../utils.ts";

export const MAX_REPAIR_ROUNDS = 3;

export interface DenoCheckResult {
  ok: boolean;
  stderr: string;
}

export type RunDenoCheck = (filePath: string) => Promise<DenoCheckResult>;

export interface RunCheckOptions {
  sourceDir: string;
  aiProvider: AiProvider;
  /** Injectable for tests; defaults to a real `deno check` subprocess. */
  runDenoCheck?: RunDenoCheck;
}

export interface CheckResult {
  ok: boolean;
  /** Total extraction attempts (1 initial + repair rounds). */
  attempts: number;
  /** Final type-check errors when `ok` is false. */
  errors: string[];
}

/**
 * The `verbo check` pipeline: extract → generate types → write
 * `types.verbo.ts` → `deno check`, with a repair loop that feeds failures
 * back to the LLM (DESIGN §6.2, max `MAX_REPAIR_ROUNDS` retries).
 */
export async function runCheck(options: RunCheckOptions): Promise<CheckResult> {
  const { sourceDir, aiProvider } = options;
  const checkFile = options.runDenoCheck ?? runDenoCheck;

  console.log(`🔍 Running spec check on ${sourceDir}`);
  const corpus = aggregateFilesForPrompt(sourceDir, ["md"]);

  let spec = await extract(corpus, aiProvider);
  let check = await generateAndCheck(spec, sourceDir, checkFile);
  if (check.ok) return { ok: true, attempts: 1, errors: [] };

  // Repair loop: accumulate `deno check` errors and feed them back.
  const repairErrors: string[] = [];
  for (let round = 1; round <= MAX_REPAIR_ROUNDS; round++) {
    repairErrors.push(...extractErrors(check.stderr));
    console.log(
      `\n⚠️  deno check failed. Feeding errors back to the LLM (repair round ${round}/${MAX_REPAIR_ROUNDS})...`,
    );
    spec = await extract(corpus, aiProvider, repairErrors);
    check = await generateAndCheck(spec, sourceDir, checkFile);
    if (check.ok) return { ok: true, attempts: round + 1, errors: [] };
  }

  const errors = extractErrors(check.stderr);
  console.error(
    "\n❌ All extraction attempts failed. Final deno check errors:",
  );
  for (const error of errors) console.error(`   - ${error}`);
  return { ok: false, attempts: MAX_REPAIR_ROUNDS + 1, errors };
}

async function generateAndCheck(
  spec: ExtractedSpec,
  sourceDir: string,
  checkFile: RunDenoCheck,
): Promise<DenoCheckResult> {
  // 1. Types — if these fail, the repair loop feeds the errors back to the LLM.
  const outputPath = join(sourceDir, "types.verbo.ts");
  Deno.writeTextFileSync(outputPath, generateTypes(spec));
  console.log(`Generated ${outputPath}`);
  const typesCheck = await checkFile(outputPath);
  if (!typesCheck.ok) return typesCheck;

  // 2. Value-level assertions — deterministic from the extracted constraints;
  //    a failure here is a generator bug, not something the LLM can repair.
  const verifyDir = join(sourceDir, ".verbo");
  createDirIfNotExists(verifyDir);
  const validatePath = join(verifyDir, "validate.ts");
  Deno.writeTextFileSync(validatePath, generateAssertions(spec));
  console.log(`Generated ${validatePath}`);
  return checkFile(validatePath);
}

/** Real `deno check` subprocess on the generated types file. */
export async function runDenoCheck(filePath: string): Promise<DenoCheckResult> {
  console.log(`Running deno check on ${filePath}...`);
  const command = new Deno.Command("deno", {
    args: ["check", filePath],
    stdout: "piped",
    stderr: "piped",
  });
  const output = await command.output();
  const stderr = new TextDecoder().decode(output.stderr);
  return { ok: output.success, stderr };
}

/** Pull individual TS error messages out of `deno check` stderr. */
export function extractErrors(stderr: string): string[] {
  const errors: string[] = [];
  for (const line of stderr.split("\n")) {
    const match = line.match(/^\s*(?:error:\s*)?TS\d+\s*\[ERROR\]:\s*(.+)$/);
    if (match) errors.push(match[1].trim());
  }
  if (errors.length === 0) {
    const cleaned = stderr.trim();
    if (cleaned) errors.push(cleaned.slice(0, 500));
  }
  return errors;
}
