import { createDirIfNotExists, readFile, writefile, aggregateFilesForPrompt } from "./utils.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

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

	const __dirname = dirname(fromFileUrl(import.meta.url));
	const promptTemplate = await Deno.readTextFile(join(__dirname, "./prompts/test-generator.md"));

	const prompt = `
${promptTemplate}

This is the specification of the TypeScript program:

${compiledFiles}

This is the TypeScript program:

${code}

Now, write the tests for the program.
`;

	console.log("The test prompt:", prompt);

	createDirIfNotExists(outputPath);

	console.log(
		"Writing prompt.md to output folder. It contains the prompt sent to the AI provider."
	); // TODO: include ai provider in the name

	writefile(`${outputPath}/test-prompt.md`, prompt);

	console.log("Submitting code to the AI...");

	let text = await aiProvider(prompt);


	writefile(`${outputPath}/${aiProvider}-response.md`, text);
	text = text.replace("```typescript", "```");
	text = text.split("```")[1];

	console.log(`Writing index.test.ts to the output folder.`);

	writefile(`${outputPath}/index.test.ts`, text);

	// run jest test

	console.log("Running tests...");


}
