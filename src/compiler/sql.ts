import { listFilesAt } from "../utils.ts";
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
	const compiledFiles = compileFiles(files, workingDir);

	await runAiGeneration({
		aiProvider,
		promptTemplatePath: "../prompts/sql.md",
		promptData: compiledFiles,
		outputPath: verboDir,
		outputFile: "init.sql",
		promptLogFile: "sql-prompt.md",
		responseLogFile: "sql-response.md",
		startLogMessage: "Generating SQL from models...",
	});
}