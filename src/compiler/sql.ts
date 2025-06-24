import { listFilesAt, writefile } from "../utils.ts";
import { compileFiles } from "./compileFiles.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

export default async function compile({
	workingDir,
	verboDir,
	aiProvider,
}: {
	workingDir: string;
	verboDir: string;
	aiProvider: (prompt: string) => Promise<string>;
}) {
	console.log("Generating SQL from models...");

	const files = listFilesAt(workingDir + '/models');

	const compiledFiles = compileFiles(files, workingDir);

	const __dirname = dirname(fromFileUrl(import.meta.url));
	const prompt = await Deno.readTextFile(join(__dirname, "../prompts/sql.md"));

	const submitPrompt = `${prompt}\n${compiledFiles}`;

	console.log("The prompt:", submitPrompt);

	console.log(
		"Writing prompt.md to output folder. It contains the prompt sent to the AI provider."
	);

	writefile(`${verboDir}/sql-prompt`, submitPrompt);

	console.log("Submitting code to the AI...");

	let text = await aiProvider(submitPrompt);

	console.log(`AI response: ${text} `);

	writefile(`${verboDir}/sql-response`, text);

	text = text.replace("```sql", "```");
	text = text.split("```")[1];

	console.log("Extracted code from the AI response.");

	console.log(`Saving schema...`);

	writefile(`${verboDir}/init.sql`, text);

	console.log("The code has been successfully generated");
}