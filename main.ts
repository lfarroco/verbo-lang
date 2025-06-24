import { parse } from "https://deno.land/std@0.200.0/flags/mod.ts";
import type { Args } from "https://deno.land/std@0.200.0/flags/mod.ts";

import { gemini } from "./src/api/gemini.ts";
import { openai } from "./src/api/openai.ts";
import { anthropic } from "./src/api/anthropic.ts";
import { ollama } from "./src/api/ollama.ts";

import compileSql from "./src/compiler/sql.ts";
import compileModel from "./src/compiler/models.ts";
import compileDbClient from "./src/compiler/db-client.ts";
import compileRoutes from "./src/compiler/routes.ts";
import compileClass from "./src/compiler/compile-class.ts";
import compileFunction from "./src/compiler/compile-function.ts";
import compileReact from "./src/compiler/compile-react.ts";
import testGenerator from "./src/testGenerator.ts";

import { createDirIfNotExists, getEnv } from "./src/utils.ts";

// --- Constants ---
const VERSION = "0.0.1";

const BOOLEAN_ARGS = ["help", "generate-tests", "verbose", "version"];
const STRING_ARGS = ["dir", "output", "envfile", "aiprovider", "model", "target"];
const ALIASES = {
  "help": "h",
  "version": "V",
  "generate-tests": "g",
  "verbose": "v",
  "dir": "d",
  "output": "o",
  "envfile": "e",
  "aiprovider": "a",
  "model": "m",
  "target": "t",
};

const DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-1.5-flash-latest",
  openai: "gpt-4o-mini",
  ollama: "codegemma",
  anthropic: "claude-3-haiku-20240307",
};

const VALID_PROVIDERS = Object.keys(DEFAULT_MODELS);
const VALID_TARGETS = ["sql", "model", "db-client", "routes", "class", "function", "react"];

type AiProviderType = keyof typeof DEFAULT_MODELS;
type TargetType = typeof VALID_TARGETS[number];
type AiProviderFn = (prompt: string) => Promise<string>;

// --- Helper Functions ---

function printHelp(): void {
  console.log(`Verbo v${VERSION}`);
  console.log("Usage: verbo [OPTIONS...]");
  console.log("\nOptional flags:");
  console.log("  -h, --help                  Display this help and exit");
  console.log("  -V, --version               Output version information and exit");
  console.log("  -g, --generate-tests        Generate tests for the output code");
  console.log("  -v, --verbose               Enable verbose output");
  console.log("  -d, --dir <path>            Source directory for Verbo files. Default: ./");
  console.log("  -o, --output <path>         Output directory for generated files. Default: dist/");
  console.log("  -e, --envfile <path>        Path to .env file. Default: .env");
  console.log(`  -a, --aiprovider <name>   AI provider (${VALID_PROVIDERS.join(", ")}). Default: ollama`);
  console.log("  -m, --model <name>          AI model to use. See provider for defaults.");
  console.log(`  -t, --target <type>         Compilation target (${VALID_TARGETS.join(", ")}). Default: function`);
}

function getProvider(
  providerName: AiProviderType,
  model: string,
  dotEnvFilePath: string,
): AiProviderFn {
  switch (providerName) {
    case "gemini":
      console.log(`Using Gemini with model: ${model}`);
      return gemini(getEnv(dotEnvFilePath, "GEMINI_KEY"), model);
    case "openai":
      console.log(`Using OpenAI with model: ${model}`);
      return openai(getEnv(dotEnvFilePath, "OPENAI_KEY"), model);
    case "anthropic":
      console.log(`Using Anthropic with model: ${model}`);
      return anthropic(getEnv(dotEnvFilePath, "ANTHROPIC_KEY"), model);
    case "ollama":
      console.log(`Using Ollama with model: ${model}`);
      return ollama(model);
  }
}

// --- Main Execution ---

export async function main(args: string[] = Deno.args): Promise<void> {
  const options: Args = parse(args, {
    alias: ALIASES,
    boolean: BOOLEAN_ARGS,
    string: STRING_ARGS,
  });

  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    console.log(VERSION);
    return;
  }

  const verbose = options.verbose || false;
  if (verbose) {
    console.log("CLI Options:", options);
  }

  // --- Configuration ---
  const sourceDir = options.dir || "./";
  const outputPath = options.output || "dist/";
  const envfile = options.envfile || ".env";
  const dotEnvFilePath = `${Deno.cwd()}/${envfile}`;
  const aiProviderName = (options.aiprovider || "ollama") as AiProviderType;
  const target = (options.target || "function") as TargetType;
  const verboDir = `${sourceDir}/.verbo`;

  if (!VALID_PROVIDERS.includes(aiProviderName)) {
    console.error(`Error: Invalid AI provider "${aiProviderName}". Valid options are: ${VALID_PROVIDERS.join(", ")}`);
    return;
  }

  if (!VALID_TARGETS.includes(target)) {
    console.error(`Error: Invalid target "${target}". Valid options are: ${VALID_TARGETS.join(", ")}`);
    return;
  }

  const model = options.model || DEFAULT_MODELS[aiProviderName];

  console.log(`Starting compilation for target "${target}"...`);

  createDirIfNotExists(verboDir);
  const aiProvider = getProvider(aiProviderName, model, dotEnvFilePath);

  // --- Compilation Dispatch ---
  try {
    switch (target) {
      case "sql":
        await compileSql({ workingDir: sourceDir, verboDir, aiProvider });
        break;
      case "model":
        await compileModel({ workingDir: sourceDir, verboDir, aiProvider });
        break;
      case "db-client":
        await compileDbClient({ workingDir: sourceDir, verboDir, aiProvider });
        break;
      case "routes":
        await compileRoutes({ workingDir: sourceDir, verboDir, aiProvider });
        break;
      case "class":
        await compileClass({ sourceDir, outputPath, aiProvider });
        break;
      case "function":
        await compileFunction({ sourceDir, outputPath, aiProvider });
        break;
      case "react":
        await compileReact({ sourceDir, outputPath, aiProvider });
        break;
    }

    if (options["generate-tests"]) {
      if (["class", "function", "react"].includes(target)) {
        console.log("Generating tests...");
        const targetFile = `${outputPath}/${target === 'react' ? 'index.tsx' : 'index.ts'}`;
        await testGenerator({ sourceDir, outputPath, targetFile, aiProvider });
      } else {
        console.warn(`Test generation is not supported for target "${target}".`);
      }
    }

    console.log("Compilation finished successfully.");
  } catch (error) {
    console.error("An error occurred during compilation:", error.message);
    if (verbose) {
      console.error(error);
    }
  }
}

// Run main only when the script is executed directly
if (import.meta.main) {
  main(Deno.args);
}