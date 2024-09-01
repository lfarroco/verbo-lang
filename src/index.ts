import { Command } from "commander";
import compile from "./compiler/compiler";

const program = new Command();

program
  .version("0.0.1")
  .description(
    "A simple programming language that lets you compile code using natural language."
  )
  .option("-o, --output <value>", "Target output directory")
  .option(
    "-t, --target [value]",
    "Target language. Valid options: js, py, go, hs, c. Default: js"
  )
  .option("-e, --envfile <value>", "Path to .env file. Default: .env")
  .option("-s, --source <value>", "Path to source directory. Default: source/")
  .parse(process.argv);

const pwd = process.cwd();

const options = program.opts();

console.log(options)

if (!options.output) {
  console.log("Using default output directory: /dist");
}

if (options.target && !["js", "py", "go", "hs", "c"].includes(options.target)) {
  console.error("Invalid target language. Valid options: js, py, go, hs, c");
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

const envfile = options.envfile || ".env";
const source = options.source || "source/";



const outputPath = `${pwd}/${options.output || "dist/"}`;
const targetLanguage = options.target || "js";
const sourceDir = `${pwd}/${source}`;
const dotEnvFilePath = `${pwd}/${envfile}`;

console.log("using: ", { outputPath, targetLanguage, sourceDir, dotEnvFilePath });

console.log(`Compiling to ${targetLanguage}...`);

compile({
  outputPath,
  targetLanguage,
  sourceDir,
  dotEnvFilePath,
});
