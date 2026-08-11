import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

import {
  aggregateFilesForPrompt,
  createDirIfNotExists,
  runAiGeneration,
} from "../utils.ts";

/**
 * Analyzes project specifications to find ambiguities and generates a JSON file
 * with questions. This is the core logic for the `verbo clarify` command.
 *
 * All outputs (`clarifications.json`, prompt/response logs) are written under
 * `sourceDir` so the artifacts stay with the project they were derived from
 * (same convention as `types.verbo.ts` / `.verbo/` for `verbo check`).
 */
export default async function clarify({
  sourceDir = ".",
  outputFile = "clarifications.json",
  aiProvider,
  priority,
}: {
  sourceDir?: string;
  outputFile?: string;
  aiProvider: (prompt: string) => Promise<string>;
  priority?: string;
}): Promise<void> {
  const projectFiles = aggregateFilesForPrompt(sourceDir, ["md"]);

  // As per the spec, create a directory for logs and other artifacts.
  createDirIfNotExists(join(sourceDir, ".verbo/clarifications"));

  await runAiGeneration({
    aiProvider,
    promptTemplatePath: "prompts/clarify.md",
    promptData: projectFiles,
    outputPath: sourceDir,
    outputFile,
    promptLogFile: ".verbo/clarifications/clarify-prompt.md",
    responseLogFile: ".verbo/clarifications/clarify-response.md",
    startLogMessage: "Analyzing project for ambiguities...",
    extractJson: true, // We need the raw JSON from the AI's markdown response
  });

  console.log(
    `✅ Clarification questions saved to ${join(sourceDir, outputFile)}`,
  );
  if (priority) {
    console.log(
      `💡 Note: Filtering by priority ('${priority}') is a post-processing step that can be added next.`,
    );
  }
}
