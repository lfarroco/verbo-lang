import {
	aggregateFilesForPrompt,
	createDirIfNotExists,
	runAiGeneration,
} from "../utils.ts";

/**
 * Analyzes project specifications to find ambiguities and generates a JSON file with questions.
 * This is the core logic for the `verbo clarify` command.
 */
export default async function clarify({
	sourceDir = ".",
	outputFile = "clarifications.json",
	aiProvider,
	priority,
}: {
	sourceDir?: string;
	outputFile?: string;
	aiProvider: (prompt: string) => Promise<string>;
	priority?: string;
}) {
	const projectFiles = aggregateFilesForPrompt(sourceDir, ["md"]);

	// As per the spec, create a directory for logs and other artifacts.
	createDirIfNotExists(".verbo/clarifications");

	await runAiGeneration({
		aiProvider,
		promptTemplatePath: "prompts/clarify.md",
		promptData: projectFiles,
		outputPath: ".", // Output file will be in the project root
		outputFile: outputFile,
		promptLogFile: ".verbo/clarifications/clarify-prompt.md",
		responseLogFile: ".verbo/clarifications/clarify-response.md",
		startLogMessage: "Analyzing project for ambiguities...",
		extractJson: true, // We need the raw JSON from the AI's markdown response
	});

	console.log(`✅ Clarification questions saved to ${outputFile}`);
	if (priority) {
		console.log(
			`💡 Note: Filtering by priority ('${priority}') is a post-processing step that can be added next.`,
		);
	}
}