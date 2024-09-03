#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const compiler_1 = __importDefault(require("./compiler/compiler"));
const program = new commander_1.Command();
program
    .version("1.0.3")
    .description("A simple programming language that lets you compile code using natural language.")
    .option("-o, --output <value>", "Target output directory")
    .option("-t, --target [value]", `Target language. Default: js`)
    .option("-e, --envfile <value>", "Path to .env file. Default: .env")
    .option("-s, --source <value>", "Path to source directory. Default: source/")
    .option("-ai, --aiprovider <value>", "AI provider. Default: ollama")
    .option("-m, --model <value>", "AI model. Defaults: gpt-3.5-turbo for OpenAI, llama3.1 for Ollama, gemini-1.5-flash-latest for Gemini")
    .parse(process.argv);
const pwd = process.cwd();
const options = program.opts();
if (!options.output) {
    console.log("Using default output directory: /dist");
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
const aiProvider = options.aiprovider || "ollama";
const defaultModels = {
    gemini: "gemini-1.5-flash-latest",
    openai: "gpt-4o",
    ollama: "llama3.1",
};
const model = options.model || defaultModels[aiProvider];
if (["gemini", "openai", "ollama"].indexOf(aiProvider) === -1) {
    console.error("Invalid AI provider. Valid options: gemini, openai, ollama");
}
console.log("using: ", { outputPath, targetLanguage, sourceDir, dotEnvFilePath });
console.log(`Compiling to ${targetLanguage}...`);
(0, compiler_1.default)({
    outputPath,
    targetLanguage,
    sourceDir,
    dotEnvFilePath,
    aiProvider,
    model,
});
//# sourceMappingURL=index.js.map