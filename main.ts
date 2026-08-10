import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";

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
import { scaffoldRestServer } from "./scaffold.ts";

// --- Constants ---
const VERSION = "0.0.1";

const DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-1.5-flash-latest",
  openai: "gpt-4o-mini",
  ollama: "codegemma",
  anthropic: "claude-3-haiku-20240307",
};

const VALID_PROVIDERS = ["gemini", "openai", "ollama", "anthropic"];
const VALID_TARGETS = ["sql", "model", "db-client", "routes", "class", "function", "react", "rest-server"];

type AiProviderType = "gemini" | "openai" | "ollama" | "anthropic";
type TargetType = typeof VALID_TARGETS[number];
type AiProviderFn = (prompt: string) => Promise<string>;

interface CompilationContext {
  sourceDir: string;
  outputPath: string;
  verboDir: string;
  aiProvider: AiProviderFn;
  target: TargetType;
  verbose: boolean;
  generateTests: boolean;
}

// --- Helper Functions ---

function printHelp(): void {
  console.log(`Verbo v${VERSION}`);
  console.log("Usage: verbo [OPTIONS...]");
  console.log("\nOptional flags:");
  console.log("  -h, --help              Display this help and exit");
  console.log("  -V, --version           Output version information and exit");
  console.log("  -g, --generate-tests    Generate tests for the output code");
  console.log("  -v, --verbose           Enable verbose output");
  console.log("  -d, --dir <path>        Source directory for Verbo files. Default: ./");
  console.log("  -o, --output <path>     Output directory for generated files. Default: dist/");
  console.log("  -e, --envfile <path>    Path to .env file. Default: .env");
  console.log(`  -a, --aiprovider <name> AI provider (${VALID_PROVIDERS.join(", ")}). Default: ollama`);
  console.log("  -m, --model <name>      AI model to use. See provider for defaults.");
  console.log(`  -t, --target <type>     Compilation target (${VALID_TARGETS.join(", ")}). Default: function`);
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

// --- Orchestration Functions ---

async function runRestServerCompilation(context: CompilationContext): Promise<void> {
  console.log("Generating complete REST server...");
  const { sourceDir, verboDir, outputPath, aiProvider } = context;
  const compileOptions = { workingDir: sourceDir, verboDir, aiProvider };

  await compileSql(compileOptions);
  await compileModel(compileOptions);
  await compileDbClient(compileOptions);
  await compileRoutes(compileOptions);
  await scaffoldRestServer({ verboDir, outputPath });
}

async function runSingleCompilation(context: CompilationContext): Promise<void> {
  const { target, sourceDir, outputPath, verboDir, aiProvider, generateTests } = context;
  const compileOptions = { workingDir: sourceDir, verboDir, aiProvider };

  switch (target) {
    case "sql":
      await compileSql(compileOptions);
      break;
    case "model":
      await compileModel(compileOptions);
      break;
    case "db-client":
      await compileDbClient(compileOptions);
      break;
    case "routes":
      await compileRoutes(compileOptions);
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

  if (generateTests) {
    if (["class", "function", "react"].includes(target)) {
      console.log("Generating tests...");
      const targetFile = `${outputPath}/${target === "react" ? "index.tsx" : "index.ts"}`;
      await testGenerator({ sourceDir, outputPath, targetFile, aiProvider });
    } else {
      console.warn(`Test generation is not supported for target "${target}".`);
    }
  }
}

// --- Main Execution ---

export async function main(args: string[] = Deno.args): Promise<void> {
  const options = parseArgs(args, {
    alias: {
      "help": "h", "version": "V", "generate-tests": "g", "verbose": "v",
      "dir": "d", "output": "o", "envfile": "e", "aiprovider": "a",
      "model": "m", "target": "t",
    },
    boolean: ["help", "generate-tests", "verbose", "version"],
    string: ["dir", "output", "envfile", "aiprovider", "model", "target"],
    default: {
      dir: "./", output: "dist/", envfile: ".env",
      aiprovider: "ollama", target: "function",
    },
  });

  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    console.log(VERSION);
    return;
  }

  const verbose = options.verbose;
  if (verbose) {
    console.log("CLI Options:", options);
  }

  // --- Configuration & Validation ---
  const aiProviderName = options.aiprovider as AiProviderType;
  const target = options.target as TargetType;

  // deno-lint-ignore no-explicit-any
  if (!VALID_PROVIDERS.includes(aiProviderName)) {
    console.error(`Error: Invalid AI provider "${aiProviderName}". Valid options are: ${VALID_PROVIDERS.join(", ")}`);
    return;
  }

  if (!VALID_TARGETS.includes(target)) {
    console.error(`Error: Invalid target "${target}". Valid options are: ${VALID_TARGETS.join(", ")}`);
    return;
  }

  const model = options.model || DEFAULT_MODELS[aiProviderName as keyof typeof DEFAULT_MODELS];
  const dotEnvFilePath = `${Deno.cwd()}/${options.envfile}`;
  const verboDir = `${options.dir}/.verbo`;

  console.log(`Starting compilation for target "${target}"...`);

  createDirIfNotExists(verboDir);

  const context: CompilationContext = {
    sourceDir: options.dir,
    outputPath: options.output,
    verboDir,
    aiProvider: getProvider(aiProviderName, model, dotEnvFilePath),
    target,
    verbose,
    generateTests: options["generate-tests"],
  };

  // --- Compilation Dispatch ---
  try {
    if (context.target === "rest-server") {
      await runRestServerCompilation(context);
    } else {
      await runSingleCompilation(context);
    }

    console.log("Compilation finished successfully.");
  } catch (error) {
    console.error("An error occurred during compilation:", error instanceof Error ? error.message : String(error));
    if (verbose) {
      console.error(error);
    }
  }
}

// Run main only when the script is executed directly
if (import.meta.main) {
  main(Deno.args);
}