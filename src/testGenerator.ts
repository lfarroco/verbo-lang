import { createDirIfNotExists, readFile, aggregateFilesForPrompt } from "./utils.ts";
import { runAiGeneration } from "./compiler/generator.ts";

export default async function testGenerator({
	outputPath,
	sourceDir,
	targetFile,
	aiProvider,
}: {
	outputPath: string;
	sourceDir: string;
	targetFile: string;
	aiProvider: (prompt: string) => Promise<string>;
}) {
	const compiledFiles = aggregateFilesForPrompt(sourceDir);

	const code = readFile(targetFile);

	const promptData = `
This is the specification of the TypeScript program:

${compiledFiles}

This is the TypeScript program:

${code}

Now, write the tests for the program.
`;

	createDirIfNotExists(outputPath);

	await runAiGeneration({
		aiProvider,
		promptTemplatePath: "../prompts/test-generator.md",
		promptData: promptData,
		outputPath: outputPath,
		outputFile: "index.test.ts",
		promptLogFile: "test-prompt.md",
		responseLogFile: "ai-response.md",
		startLogMessage: "Generating tests...",
	});

	// run jest test

	console.log("Running tests...");


}
