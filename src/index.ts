import { Command } from "commander";
import compile from "./compiler/compiler";
import { supportedLanguageCodes } from "./constants";

const program = new Command();

const languagesList = supportedLanguageCodes.join(", ");

program
  .version("1.0.2")
  .description(
    "A simple programming language that lets you compile code using natural language."
  )
  .option("-o, --output <value>", "Target output directory")
  .option(
    "-t, --target [value]",
    `Target language. Valid options: ${languagesList}. Default: js`
  )
  .option("-e, --envfile <value>", "Path to .env file. Default: .env")
  .option("-s, --source <value>", "Path to source directory. Default: source/")
  .option("-ai, --aiprovider <value>", "AI provider. Default: gemini")
  .parse(process.argv);

const pwd = process.cwd();

const options = program.opts();

console.log("OPTIONS: ", options)

if (!options.output) {
  console.log("Using default output directory: /dist");
}

if (options.target && !languagesList.includes(options.target)) {
  console.error(`Invalid target language. Valid options: ${languagesList}`);
}

if (!options.target) {
  console.log("Using default target language: js");
}

if (!options.Envfile) {
  console.log("Using default .env file: .env");
}

if (!options.Source) {
  console.log("Using default source directory: source/");
}

if (!options.aiprovider) {
  console.log("Using default AI provider: gemini");
}

const envfile = options.envfile || ".env";
const source = options.source || "source/";

const outputPath = `${pwd}/${options.output || "dist/"}`;
const targetLanguage = options.target || "js";
const sourceDir = `${pwd}/${source}`;
const dotEnvFilePath = `${pwd}/${envfile}`;
const aiProvider = options.aiprovider || "gemini";

console.log("using: ", { outputPath, targetLanguage, sourceDir, dotEnvFilePath });

console.log(`Compiling to ${targetLanguage}...`);

compile({
  outputPath,
  targetLanguage,
  sourceDir,
  dotEnvFilePath,
  aiProvider,
});
