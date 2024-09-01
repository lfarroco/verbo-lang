import * as fs from "fs";

import { getEnv, getFiles } from "../utils";

export default async function compile({
  outputPath,
  sourceDir,
  dotEnvFilePath,
  targetLanguage = "js",
}: {
  outputPath: string;
  sourceDir: string;
  dotEnvFilePath: string;
  targetLanguage: string;
}) {

  console.log("Compiling source files...");

  const files = getFiles(sourceDir);

  let compiledFiles = "";

  files.forEach((file: string) => {
    compiledFiles += `== ${file} ==\n\n`;
    const content = fs.readFileSync(file, "utf8");

    compiledFiles += content + "\n\n";
  });

  const prompt = `
You will receive a list of files describing how a software should work.
Each file name is delimited by a double equal sign (==).
Starting from the file "main.md", generate code that will implement the software.
If the code description has the pattern "... generate" it means that you should generate data that fits that context.
The response should come as a single block of code.
The code should not be wrapped in backticks.
The target language is JavaScript.
`;
  const submitPrompt = `${prompt}\n\n${compiledFiles}`;

  console.log(`Preparing output folder at ${outputPath}`);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  console.log("Writing submit.md prompt to output folder."); // TODO: include ai provider in the name
  fs.writeFileSync(`${outputPath}/submit.md`, submitPrompt);

  console.log("Submitting code to the AI...");

  // TODO: should be part of the ai provider
  const GEMINI_KEY = getEnv(dotEnvFilePath, "GEMINI_KEY");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: submitPrompt,
              },
            ],
          },
        ],
      }),
    }
  );

  const json = await response.json();
  console.log(
    "Received response from the AI. Writing response.md to output folder."
  );
  fs.writeFileSync(`${outputPath}/gemini-response.json`, JSON.stringify(json));

  // check if the response is valid (should have candidates and parts)
  if (!json.candidates || !json.candidates[0].content.parts) {
    console.error("Invalid response from the AI:");
    console.error(json);
    return;
  }

  let { text } = json.candidates[0].content.parts[0];

  // Google Gemini (sometimes) is returning the code wrapped in backticks besides the prompt
  // check if first line has "```"
  // if it does, remove it

  if (text.startsWith("```")) {
    console.log("Removing first line as it has backticks.");
    text = text.split("\n").slice(1).join("\n");
  }

  // same for the last line
  if (text.endsWith("```")) {
    console.log("Removing last line as it has backticks.");
    text = text.split("\n").slice(0, -1).join("\n");
  }

  console.log("Writing gemini-main.js to the output folder.");

  fs.writeFileSync(`${outputPath}/gemini-main.js`, text);

  console.log(
    'Your code is ready in the target output folder.'
  );
}
