import { listFilesAt, readFile, writefile } from "../utils.ts";
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
	console.log("Generating DB clients from spec, schema and models...");

	const specs = listFilesAt(workingDir + '/models');

	const schema = readFile(verboDir + '/init.sql');

	const models = readFile(verboDir + '/models.ts');

	const compiledSpecs = compileFiles(specs, workingDir);
	const routes = readFile(workingDir + '/routes.md');

	const __dirname = dirname(fromFileUrl(import.meta.url));
	const prompt = await Deno.readTextFile(join(__dirname, "../prompts/db-client.md"));

	const submitPrompt = `
${prompt}
${compiledSpecs}
== routes.md ==
${routes}
== init.sql ==
${schema}
== models.ts ==
${models}
`;

	console.log("The prompt:", submitPrompt);

	console.log(
		"Writing models-prompt to output folder. It contains the prompt sent to the AI provider."
	);
	writefile(`${verboDir}/db-client-prompt`, submitPrompt);

	console.log("Submitting code to the AI...");

	// TODO: should be part of the ai provider

	let text = await aiProvider(submitPrompt);

	console.log(`AI response: ${text} `);

	writefile(`${verboDir}/db-client-response`, text);
	text = text.replace("```typescript", "```");
	text = text.split("```")[1];

	console.log("Extracted code from the AI response.");

	console.log(`Writing main.ts to the output folder`);

	writefile(`${verboDir}/db-client.ts`, text);

	console.log("Your code is ready in the target output folder.");

}
