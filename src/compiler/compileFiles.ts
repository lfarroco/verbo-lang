import { readFile } from "../utils.ts";

export function compileFiles(files: string[], dirPrefix: string) {
	let compiledFiles = "";

	files.forEach((file: string) => {
		// remove absolute file path from the file name
		const filteredFileName = file.replace(dirPrefix + "/", "");
		compiledFiles += `== ${filteredFileName} ==\n\n`;
		const content = readFile(file);

		compiledFiles += content + "\n\n";
	});
	return compiledFiles;
}
