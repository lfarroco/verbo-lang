import { listFilesAt, readFile } from "../utils.ts";

export function gatherFiles(sourceDir: string) {
	const files = listFilesAt(sourceDir, ["md"]);

	let compiledFiles = "";

	files.forEach((file: string) => {
		// remove absolute file path from the file name
		const filteredFileName = file.replace(sourceDir + "/", "");
		compiledFiles += `== ${filteredFileName} ==\n\n`;
		const content = readFile(file);

		compiledFiles += content + "\n\n";
	});
	return compiledFiles;
}
