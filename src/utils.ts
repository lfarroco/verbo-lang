
export const getEnv = (
  dotEnvFilePath: string,
  key: string,
): string => {
  console.log("Reading .env file from: ", Deno.cwd());

  const dotenv = Deno.readTextFileSync(dotEnvFilePath);
  const lines = dotenv.split("\n");

  const row = lines.find((line) => line.startsWith(key));

  if (!row) {
    throw new Error(`Key ${key} not found in .env file`);
  }

  const value = row.split("=")[1];

  if (!value) {
    throw new Error(`Value for key ${key} not found in .env file`);
  }

  return value;
};

export const listFilesAt = (dir: string, extensions: string[]): string[] => {
  const files: string[] = [];

  for (const entry of Deno.readDirSync(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      files.push(...listFilesAt(path, extensions));
    } else if (entry.isFile && extensions.some(ext => entry.name.endsWith(`.${ext}`))) {
      files.push(path);
    }
  }
  return files;
};

export function readFile(file: string) {
  return Deno.readTextFileSync(file);
}
export function createDirIfNotExists(outputPath: string) {
  console.log(`Preparing output folder at ${outputPath}`);
  // Use { recursive: true } to avoid errors if the directory exists
  // and to create parent directories if needed.
  Deno.mkdirSync(outputPath, { recursive: true });
}
export function writefile(destination: string, text: string) {
  console.log(`Writing to ${destination}...`);
  Deno.writeTextFileSync(destination, text);
}

export function aggregateFilesForPrompt(sourceDir: string, extensions: string[] = ["md"]): string {
  console.log("Aggregating source files for prompt...");

  // A simple alphabetical sort is a reasonable default for aggregation.
  // Specific compilation steps can perform their own ordering if needed.
  const files = listFilesAt(sourceDir, extensions).sort();
  let compiledFiles = "";

  for (const file of files) {
    const filteredFileName = file.replace(`${sourceDir}/`, "");
    const content = readFile(file);
    compiledFiles += `== ${filteredFileName} ==\n\n${content}\n\n`;
  }

  return compiledFiles;
}