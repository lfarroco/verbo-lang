import compileSql from "./src/compiler/sql.ts";
import compileModel from "./src/compiler/models.ts";
import compileDbClient from "./src/compiler/db-client.ts";
import compileRoutes from "./src/compiler/routes.ts";
import { parse } from "https://deno.land/std@0.200.0/flags/mod.ts";
import type { Args } from "https://deno.land/std@0.200.0/flags/mod.ts";
import { gemini } from "./src/api/gemini.ts";
import { createDirIfNotExists, getEnv } from "./src/utils.ts";
import { openai } from "./src/api/openai.ts";
import { anthropic } from "./src/api/anthropic.ts";
import { ollama } from "./src/api/ollama.ts";

function parseArguments(args: string[]): Args {

  const booleanArgs = [
    "help",
    "generate-tests",
    "verbose",
    "version",
  ];

  const stringArgs = [
    "dir",
    "envfile",
    "aiprovider",
    "model",
    "target",
  ];

  const alias = {
    "help": "h",
    "generate-tests": "g",
    "verbose": "v",
    "dir": "d",
    "envfile": "e",
    "aiprovider": "a",
    "model": "m",
    "target": "t",
    "version": "V",
  };

  return parse(args, {
    alias,
    boolean: booleanArgs,
    string: stringArgs,
    stopEarly: false,
    "--": true,
  });
}

function printHelp(): void {
  console.log(`Usage: verbo [OPTIONS...]`);
  console.log("\nOptional flags:");
  console.log("  -h, --help                  Display this help and exit");
  console.log("  -V, --version               Output version information and exit");
  console.log("  -g, --generate-tests        Generate tests");
  console.log("  -v, --verbose               Verbose output");
  console.log("  -d, --dir <value>           Working directory. Default: ./");
  console.log("  -e, --envfile <value>       Path to .env file. Default: .env");
  console.log("  -a, --aiprovider <value>    AI provider. Default: ollama"); // TODO: replace with provider:model
  console.log("  -m, --model <value>         AI model. Defaults: gpt-4o-mini for OpenAI, codegemma for Ollama, gemini-1.5-flash-latest for Gemini");
  console.log("  -t, --target <value>        Target output (class, function, react). Default: function");
}

const options = parseArguments(Deno.args)

if (options.help) {
  printHelp();
  Deno.exit(0);
}

if (options.version) {
  console.log("0.0.1");
  Deno.exit(0);
}

const pwd = Deno.cwd();

const verbose = options.verbose || false;

if (verbose)
  console.log("options: ", options);

if (!options.args && verbose) {
  console.log("Using default output directory: dist/");
}

if (!options.target && verbose) {
  console.log("Using default target: function");
}

if (!options.envfile && verbose) {
  console.log("Using default .env file: .env");
}

if (!options.directory && verbose) {
  console.log("Using default directory: ./");
}

if (!options.aiprovider && verbose) {
  console.log("Using default AI provider: gemini");
}

const envfile = options.envfile || ".env";
const workingDir = options.dir || "./";
const dotEnvFilePath = `${pwd}/${envfile}`;
const aiProvider = options.aiprovider || "ollama";
const target = options.target || "function";

const verboDir = workingDir + "/.verbo";
createDirIfNotExists(verboDir);

const defaultModels: { [key: string]: string } = {
  gemini: "gemini-1.5-flash-latest",
  openai: "gpt-4o-mini",
  ollama: "codegemma",
  anthropic: "claude-3-haiku-20240307",
}

const model = options.model || defaultModels[aiProvider];

if (!["gemini", "openai", "ollama", "anthropic"].includes(aiProvider)) {
  console.error("Invalid AI provider. Valid options: gemini, openai, ollama", "anthropic");
}

if (!model) {
  console.error("Invalid model for AI provider");
}

console.log(`Compiling to TypeScript...`);

const getProvider = () => {
  if (aiProvider === "gemini") {
    console.log(`Using Gemini with model: ${model}`);
    return gemini(getEnv(dotEnvFilePath, "GEMINI_KEY"), model);
  } else if (aiProvider === "openai") {
    console.log(`Using OpenAI with model: ${model}`);
    return openai(getEnv(dotEnvFilePath, "OPENAI_KEY"), model);
  } else if (aiProvider === "anthropic") {
    console.log(`Using Anthropic with model: ${model}`);
    return anthropic(getEnv(dotEnvFilePath, "ANTHROPIC_KEY"), model);
  } else if (aiProvider === "ollama") {
    console.log(`Using Ollama with model: ${model}`);
    return ollama(model);
  } else {
    throw new Error("Invalid AI provider");
  }
};

export async function main() {

  const aiProvider = getProvider();

  if (target === "sql") {
    await compileSql({
      workingDir,
      verboDir,
      aiProvider,
    });
  } else if (target === "model") {
    await compileModel({
      workingDir,
      verboDir,
      aiProvider,
    });
  } else if (target === "db-client") {
    await compileDbClient({
      workingDir,
      verboDir,
      aiProvider,
    });
  } else if (target === "routes") {
    await compileRoutes({
      workingDir,
      verboDir,
      aiProvider,
    });
  } else {
    throw new Error("Invalid compilation target");
  }


}

main();