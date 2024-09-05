import { Command } from "commander";
import compile from "./compiler/compiler";
import testGenerator from "./compiler/testGenerator";

const program = new Command();

program
  .version("0.0.1")
  .description(
    "A simple programming language that lets you compile code using natural language."
  )
  .option("-o, --output <value>", "Target output directory")
  .option("-c, --compile", "Compile the code. Default: true")
  .option("-e, --envfile <value>", "Path to .env file. Default: .env")
  .option("-s, --source <value>", "Path to source directory. Default: source/")
  .option("-ai, --aiprovider <value>", "AI provider. Default: ollama")
  .option("-m, --model <value>", "AI model. Defaults: gpt-3.5-turbo for OpenAI, codegemma for Ollama, gemini-1.5-flash-latest for Gemini")
  .option("-g, --generate-tests", "Generate tests")
  .option("-v, --verbose", "Verbose output")
  .parse(process.argv);

const pwd = process.cwd();

const options = program.opts();

const verbose = options.verbose || false;

if (!options.output && verbose) {
  console.log("Using default output directory: /dist");
}

if (!options.target && verbose) {
  console.log("Using default target language: js");
}

if (!options.Envfile && verbose) {
  console.log("Using default .env file: .env");
}

if (!options.Source && verbose) {
  console.log("Using default source directory: source/");
}

if (!options.aiprovider && verbose) {
  console.log("Using default AI provider: gemini");
}

const envfile = options.envfile || ".env";
const source = options.source || "source/";
const outputPath = `${pwd}/${options.output || "dist/"}`;
const sourceDir = `${pwd}/${source}`;
const dotEnvFilePath = `${pwd}/${envfile}`;
const generateTests = options.generateTests || false;
const aiProvider = options.aiprovider || "ollama";
const shouldCompile = options.compile || true;

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

if (verbose)
  console.log("using: ", {
    outputPath,
    sourceDir,
    dotEnvFilePath,
  });

console.log(`Compiling to TypeScript...`);

async function main() {
  if (shouldCompile)
    await compile({
      outputPath,
      sourceDir,
      dotEnvFilePath,
      aiProvider,
      model,
    });
  else if (verbose) {
    console.log("Skipping compilation");
  }

  if (!generateTests) {
    if (verbose)
      console.log("Skipping test generation");
    return;
  }
  await testGenerator({
    outputPath,
    sourceDir,
    dotEnvFilePath,
    aiProvider,
    model,
  });
}

main();