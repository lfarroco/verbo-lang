export const getEnv = (
  dotEnvFilePath: string,
  key: string,
): string => {
  console.log("Reading .env file from: ", Deno.cwd());

  const dotenv = Deno.readTextFileSync(dotEnvFilePath);
  const lines = dotenv.split("\n");

  const row = lines.find((line) => line.startsWith(key));

  if (!row) {
    throw new Error(`Key ${key} not found in .env file`);
  }

  const value = row.split("=")[1];

  if (!value) {
    throw new Error(`Value for key ${key} not found in .env file`);
  }

  return value;
};

export const listFilesAt = (dir: string, extensions: string[]): string[] => {
  const files: string[] = [];

  for (const entry of Deno.readDirSync(dir)) {
    // Skip hidden/generated directories (e.g. .verbo, .git) so Verbo never
    // aggregates its own artifacts — the clarify audit trail is Markdown and
    // would otherwise pollute the extraction/clarify corpus (T14).
    if (entry.isDirectory && entry.name.startsWith(".")) continue;

    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      files.push(...listFilesAt(path, extensions));
    } else if (
      entry.isFile && extensions.some((ext) => entry.name.endsWith(`.${ext}`))
    ) {
      files.push(path);
    }
  }
  return files;
};

export function readFile(file: string) {
  return Deno.readTextFileSync(file);
}
export function createDirIfNotExists(outputPath: string) {
  console.log(`Preparing output folder at ${outputPath}`);
  // Use { recursive: true } to avoid errors if the directory exists
  // and to create parent directories if needed.
  Deno.mkdirSync(outputPath, { recursive: true });
}
export function writefile(destination: string, text: string) {
  console.log(`Writing to ${destination}...`);
  Deno.writeTextFileSync(destination, text);
}

export function aggregateFilesForPrompt(
  sourceDir: string,
  extensions: string[] = ["md"],
): string {
  console.log("Aggregating source files for prompt...");

  const files = listFilesAt(sourceDir, extensions).sort();
  let compiledFiles = "";

  for (const file of files) {
    const filteredFileName = file.replace(`${sourceDir}/`, "");
    const content = readFile(file);
    compiledFiles += `== ${filteredFileName} ==\n\n${content}\n\n`;
  }

  return compiledFiles;
}

// ---- AI generation helper (shared by clarify / interview) ----

import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";

/** Extracts a code block or JSON from an AI markdown response. */
function extractCode(text: string, extractJson = false): string {
  const parts = text.split("```");
  if (parts.length < 2) {
    if (extractJson) {
      // Try to find raw JSON in the response
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end > start) return text.slice(start, end + 1).trim();
    }
    console.warn(
      "Could not find a markdown code block. Returning the full response as-is.",
    );
    return text;
  }

  let code = parts[1];
  const firstLineEnd = code.indexOf("\n");
  if (firstLineEnd !== -1) {
    const firstLine = code.substring(0, firstLineEnd).trim();
    if (
      firstLine.length > 0 && firstLine.length < 15 && !firstLine.includes(" ")
    ) {
      code = code.substring(firstLineEnd + 1);
    }
  }
  return code.trim();
}

export interface AiGenerationOptions {
  aiProvider: (prompt: string) => Promise<string>;
  promptTemplatePath: string;
  promptData: string;
  outputPath: string;
  outputFile: string;
  promptLogFile: string;
  responseLogFile: string;
  startLogMessage: string;
  extractJson?: boolean;
}

/** Call the AI provider with a prompt template + data, log everything, write output. */
export async function runAiGeneration(options: AiGenerationOptions) {
  const {
    aiProvider,
    promptTemplatePath,
    promptData,
    outputPath,
    outputFile,
    promptLogFile,
    responseLogFile,
    startLogMessage,
    extractJson,
  } = options;

  console.log(startLogMessage);

  const moduleDir = dirname(fromFileUrl(import.meta.url));
  const promptTemplate = await Deno.readTextFile(
    join(moduleDir, promptTemplatePath),
  );
  const submitPrompt = `${promptTemplate}\n${promptData}`;
  writefile(join(outputPath, promptLogFile), submitPrompt);
  const responseText = await aiProvider(submitPrompt);
  writefile(join(outputPath, responseLogFile), responseText);
  const output = extractCode(responseText, extractJson ?? false);
  writefile(join(outputPath, outputFile), output);
  console.log(`Successfully generated ${join(outputPath, outputFile)}`);
}
