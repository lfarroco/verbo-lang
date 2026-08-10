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
	const specs = listFilesAt(workingDir + '/models', ["md"]);
	const schema = readFile(verboDir + '/init.sql');
	const models = readFile(verboDir + '/models.ts');
	const compiledSpecs = compileFiles(specs, workingDir);
	const routes = readFile(workingDir + '/routes.md');

	const promptData = `
${compiledSpecs}
== routes.md ==
${routes}
== init.sql ==
${schema}
== models.ts ==
${models}
`;

	await runAiGeneration({
		aiProvider,
		promptTemplatePath: "../prompts/db-client.md",
		promptData: promptData,
		outputPath: verboDir,
		outputFile: "db-client.ts",
		promptLogFile: "db-client-prompt.md",
		responseLogFile: "db-client-response.md",
		startLogMessage: "Generating DB clients from spec, schema and models...",
	});
}
