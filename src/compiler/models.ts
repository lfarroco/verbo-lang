import { listFilesAt, readFile } from "../utils.ts";
import { compileFiles } from "./compileFiles.ts";
import { runAiGeneration } from "./generator.ts";

export default async function compile({
	workingDir,
	verboDir,
	aiProvider,
}: {
	workingDir: string;
	verboDir: string;
	aiProvider: (prompt: string) => Promise<string>;
}) {
	const files = listFilesAt(workingDir + '/models');
	const schemaFile = readFile(verboDir + '/init.sql');
	const compiledFiles = compileFiles(files, workingDir);

	const promptData = `
${compiledFiles}
== init.sql ==
${schemaFile}`;

	await runAiGeneration({
		aiProvider,
		promptTemplatePath: "../prompts/models.md",
		promptData: promptData,
		outputPath: verboDir,
		outputFile: "models.ts",
		promptLogFile: "models-prompt.md",
		responseLogFile: "models-response.md",
		startLogMessage: "Generating TypeScript models from schema...",
	});
}
