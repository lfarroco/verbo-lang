import { writefile } from "../utils.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

/**
 * Extracts a code block from a markdown-formatted string.
 * @param text The string containing the markdown.
 * @returns The extracted code, or the original text if no block is found.
 */
function extractCode(text: string): string {
	const parts = text.split('```');
	if (parts.length < 2) {
		console.warn("Could not find a markdown code block. Returning the full response as-is.");
		return text;
	}

	let code = parts[1];
	const firstLineEnd = code.indexOf('\n');

	// If there's a newline, check if the first line is a language specifier.
	if (firstLineEnd !== -1) {
		const firstLine = code.substring(0, firstLineEnd).trim();
		// A simple heuristic: if the first line is short and has no spaces, it's likely a language.
		if (firstLine.length > 0 && firstLine.length < 15 && !firstLine.includes(' ')) {
			code = code.substring(firstLineEnd + 1);
		}
	}

	return code.trim();
}

export interface GenerationOptions {
	aiProvider: (prompt: string) => Promise<string>;
	promptTemplatePath: string;
	promptData: string;
	outputPath: string;
	outputFile: string;
	promptLogFile: string;
	responseLogFile: string;
	startLogMessage: string;
}

/**
 * A generic function to run a step in the AI-based code generation pipeline.
 * It handles prompt creation, AI interaction, logging, and file output.
 */
export async function runAiGeneration(options: GenerationOptions) {
	const {
		aiProvider,
		promptTemplatePath,
		promptData,
		outputPath,
		outputFile,
		promptLogFile,
		responseLogFile,
		startLogMessage,
	} = options;

	console.log(startLogMessage);

	const __dirname = dirname(fromFileUrl(import.meta.url));
	const promptTemplate = await Deno.readTextFile(join(__dirname, promptTemplatePath));
	const submitPrompt = `${promptTemplate}\n${promptData}`;
	writefile(join(outputPath, promptLogFile), submitPrompt);
	const responseText = await aiProvider(submitPrompt);
	writefile(join(outputPath, responseLogFile), responseText);
	const extractedCode = extractCode(responseText);
	writefile(join(outputPath, outputFile), extractedCode);
	console.log(`Successfully generated ${join(outputPath, outputFile)}`);
}