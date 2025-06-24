import { createDirIfNotExists } from "../utils.ts";
import { gatherFiles } from "./gatherFiles.ts";
import { runAiGeneration } from "./generator.ts";

export default async function compile({
  outputPath,
  sourceDir,
  aiProvider,
}: {
  outputPath: string;
  sourceDir: string;
  aiProvider: (prompt: string) => Promise<string>;
}) {
  const compiledFiles = gatherFiles(sourceDir);

  createDirIfNotExists(outputPath);

  await runAiGeneration({
    aiProvider,
    promptTemplatePath: "../prompts/compile-class.md",
    promptData: compiledFiles,
    outputPath: outputPath,
    outputFile: "index.ts",
    promptLogFile: "prompt.md",
    responseLogFile: "ai-response.md",
    startLogMessage: "Compiling source files to class...",
  });

}
