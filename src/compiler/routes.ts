import { readFile, writefile } from "../utils.ts";
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
	console.log("Generating API routes from db clients...");

	const routes = readFile(workingDir + '/routes.md'); // todo: rename to "specsdir?"

	const dbClients = readFile(verboDir + '/db-client.ts');

	const __dirname = dirname(fromFileUrl(import.meta.url));
	const prompt = await Deno.readTextFile(join(__dirname, "../prompts/routes.md"));

	const submitPrompt = `
${prompt}
== routes.ts ==
${routes}
== db-client.ts ==
${dbClients}

The functions listed above are the only ones that should be called by the routes.

`;

	console.log("The prompt:", submitPrompt);

	console.log(
		"Writing routes-prompt to output folder. It contains the prompt sent to the AI provider."
	);
	writefile(`${verboDir}/routes-prompt`, submitPrompt);

	console.log("Submitting code to the AI...");

	let text = await aiProvider(submitPrompt);

	console.log(`AI response: ${text} `);

	writefile(`${verboDir}/routes-response`, text);
	text = text.replace("```typescript", "```");
	text = text.split("```")[1];

	console.log("Extracted code from the AI response.");

	console.log(`Writing main.ts to the output folder`);

	writefile(`${verboDir}/routes.ts`, text);

	console.log("Your code is ready in the target output folder.");

}
