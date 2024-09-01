import fs from "fs";

export const getEnv = (
  dotEnvFilePath: string,
  key: string,
): string => {
  console.log("Reading .env file from: ", process.cwd());

  const dotenv = fs.readFileSync(dotEnvFilePath, "utf8");
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

export const getFiles = (source: string): string[] => {
  console.log("Reading source files from: ", source);

  // check if main.md exists
  if (!fs.existsSync(source + "/main.md")) {
    throw new Error("main.md not found in source directory");
  }

  const files: string[] = [];

  function readFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        readFiles(`${dir}/${entry.name}`);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {

        //skip main.md
        if (entry.name === "main.md") {
          return;
        }
        files.push(`${dir}/${entry.name}`);
      }
    });
  }


  readFiles(source);

  return files.concat(`${source}/main.md`);
};
