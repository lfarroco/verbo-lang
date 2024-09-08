
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

export const listFilesAt = (source: string): string[] => {
  const files: string[] = [];

  function readFiles(dir: string) {
    const entries = Deno.readDirSync(dir);

    for (const entry of entries) {
      if (entry.isDirectory) {
        readFiles(`${dir}/${entry.name}`);
      } else if (entry.isFile && entry.name.endsWith(".md")) {

        files.push(`${dir}/${entry.name}`);
      }
    }

  }

  readFiles(source);

  return files;

}

export const listAppFiles = (source: string): string[] => {
  console.log("Reading source files from: ", source);

  // check if main.md exists
  if (!Deno.statSync(source + "/main.md")) {
    throw new Error("main.md not found in source directory");
  }

  const files = listFilesAt(source);

  const allFiles = files.filter(
    (file) => file !== `${source}/main.md`
  ).concat(`${source}/main.md`);

  console.log("all files: ", allFiles)

  return allFiles;
};

export function readFile(file: string) {
  return Deno.readTextFileSync(file);
}
export function createDirIfNotExists(outputPath: string) {

  console.log(`Preparing output folder at ${outputPath}`);
  // check if output folder exists
  try { !Deno.statSync(outputPath) } catch (_e) {


    Deno.mkdirSync(outputPath);
  }



}
export function writefile(destination: string, text: string) {
  console.log(`Writing to ${destination}...`);
  Deno.writeFileSync(destination, new TextEncoder().encode(text));
}