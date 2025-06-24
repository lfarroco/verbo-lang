import { readFile } from "../utils.ts";
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
	const routes = readFile(workingDir + '/routes.md'); // todo: rename to "specsdir?"
	const dbClients = readFile(verboDir + '/db-client.ts');

	const promptData = `
== routes.md ==
${routes}
== db-client.ts ==
${dbClients}

The functions listed above are the only ones that should be called by the routes.
`;

	await runAiGeneration({
		aiProvider,
		promptTemplatePath: "../prompts/routes.md",
		promptData: promptData,
		outputPath: verboDir,
		outputFile: "routes.ts",
		promptLogFile: "routes-prompt.md",
		responseLogFile: "routes-response.md",
		startLogMessage: "Generating API routes from db clients...",
	});
}
