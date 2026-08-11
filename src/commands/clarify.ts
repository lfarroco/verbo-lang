import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

import {
  aggregateFilesForPrompt,
  createDirIfNotExists,
  runAiGeneration,
} from "../utils.ts";
import { parseClarifications } from "../interview/engine.ts";
import type { Severity } from "../interview/types.ts";
import { severityAtLeast } from "../interview/types.ts";
import { countNewVsRepeat, normalizeContext } from "../cli/messages.ts";

/** One previously-resolved clarification, read from the audit trail. */
export interface PreviousResolution {
  file: string;
  context: string;
  question: string;
  answer: string;
}

/**
 * Analyzes project specifications to find ambiguities and generates a JSON file
 * with questions. This is the core logic for the `verbo clarify` command.
 *
 * All outputs (`clarifications.json`, prompt/response logs) are written under
 * `sourceDir` so the artifacts stay with the project they were derived from
 * (same convention as `types.verbo.ts` / `.verbo/` for `verbo check`).
 *
 * Returns an exit code: 0 normally, 1 when `failOn` is set and questions at or
 * above that severity remain.
 */
export default async function clarify({
  sourceDir = ".",
  outputFile = "clarifications.json",
  aiProvider,
  minSeverity,
  failOn,
}: {
  sourceDir?: string;
  outputFile?: string;
  aiProvider: (prompt: string) => Promise<string>;
  minSeverity?: Severity;
  failOn?: Severity;
}): Promise<number> {
  const projectFiles = aggregateFilesForPrompt(sourceDir, ["md"]);

  // As per the spec, create a directory for logs and other artifacts.
  createDirIfNotExists(join(sourceDir, ".verbo/clarifications"));

  // (T6) Question lineage: feed previously-resolved questions back into the
  // prompt so clarify stops re-asking the same points.
  const previous = loadPreviousResolutions(sourceDir);
  const promptData = previous.length > 0
    ? projectFiles + "\n" + buildPreviousResolutionsSection(previous)
    : projectFiles;

  await runAiGeneration({
    aiProvider,
    promptTemplatePath: "prompts/clarify.md",
    promptData,
    outputPath: sourceDir,
    outputFile,
    promptLogFile: ".verbo/clarifications/clarify-prompt.md",
    responseLogFile: ".verbo/clarifications/clarify-response.md",
    startLogMessage: "Analyzing project for ambiguities...",
    extractJson: true, // We need the raw JSON from the AI's markdown response
  });

  // Post-process clarifications.json: severity filter + new/repeat report.
  const filePath = join(sourceDir, outputFile);
  let questions;
  try {
    questions = parseClarifications(Deno.readTextFileSync(filePath));
  } catch (err) {
    console.error(
      `⚠️ Could not parse ${filePath} — check the AI response log.`,
    );
    console.error(err instanceof Error ? err.message : String(err));
    return failOn ? 1 : 0;
  }

  // (T7) --min-severity filter.
  let filtered = questions;
  if (minSeverity) {
    filtered = questions.filter((q) =>
      severityAtLeast(q.severity, minSeverity)
    );
    if (filtered.length !== questions.length) {
      Deno.writeTextFileSync(filePath, JSON.stringify(filtered, null, 2));
      console.log(
        `Dropped ${
          questions.length - filtered.length
        } question(s) below --min-severity ${minSeverity}.`,
      );
    }
  }

  // (T6) New vs repeat report.
  const previousContexts = new Set(
    previous.map((p) => normalizeContext(p.context)),
  );
  const { newCount, repeatCount } = countNewVsRepeat(
    filtered,
    previousContexts,
  );
  console.log(`Question lineage: ${newCount} new, ${repeatCount} repeat.`);

  console.log(
    `✅ Clarification questions saved to ${join(sourceDir, outputFile)}`,
  );

  // (T9) CI gate.
  if (failOn) {
    const blocking = filtered.filter((q) =>
      severityAtLeast(q.severity, failOn)
    );
    if (blocking.length > 0) {
      console.error(
        `❌ Fail-on ${failOn}: ${blocking.length} question(s) at or above this severity remain.`,
      );
      return 1;
    }
  }
  return 0;
}

/** Load `{file, context, question, answer}` for every resolved question from
 * the audit trail under `<sourceDir>/.verbo/clarifications/interview-*.jsonl`. */
export function loadPreviousResolutions(
  sourceDir: string,
): PreviousResolution[] {
  const auditDir = join(sourceDir, ".verbo", "clarifications");
  let entries: Deno.DirEntry[];
  try {
    entries = [...Deno.readDirSync(auditDir)];
  } catch {
    return [];
  }

  const resolutions: PreviousResolution[] = [];
  for (const entry of entries) {
    if (!entry.isFile || !/^interview-.*\.jsonl$/.test(entry.name)) continue;
    const lines = Deno.readTextFileSync(join(auditDir, entry.name)).split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const decision = JSON.parse(line);
        if (
          decision && typeof decision.answer === "string" &&
          decision.source !== "skipped"
        ) {
          resolutions.push({
            file: decision.file ?? "",
            context: decision.context ?? "",
            question: decision.question ?? "",
            answer: decision.answer,
          });
        }
      } catch {
        // Malformed audit line — skip it, the trail is append-only.
      }
    }
  }
  return resolutions;
}

/** Render the "== PREVIOUSLY RESOLVED QUESTIONS ==" prompt section. */
export function buildPreviousResolutionsSection(
  resolutions: PreviousResolution[],
): string {
  const lines = [
    "== PREVIOUSLY RESOLVED QUESTIONS ==",
    "The following points were already resolved in earlier interviews. Do NOT",
    "re-flag them again unless the current spec text now contradicts the",
    "recorded resolution:",
  ];
  for (const r of resolutions) {
    lines.push(`- [${r.file}] ${r.question} → ${r.answer}`);
  }
  return lines.join("\n");
}
