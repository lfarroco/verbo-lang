import * as fs from "fs";

import { getEnv, getFiles } from "../utils";
import { supportedLanguageCode, supportedLanguages } from "../constants";
import { openai } from "../api/openai";
import { gemini } from "../api/gemini";

export default async function compile({
  outputPath,
  sourceDir,
  dotEnvFilePath,
  targetLanguage,
  aiProvider,
}: {
  outputPath: string;
  sourceDir: string;
  dotEnvFilePath: string;
  targetLanguage: supportedLanguageCode;
  aiProvider: string;
}) {

  console.log("Compiling source files...");

  const files = getFiles(sourceDir);

  let compiledFiles = "";

  files.forEach((file: string) => {

    // remove absolute file path from the file name
    const filteredFileName = file.replace(sourceDir + "/", "");
    compiledFiles += `== ${filteredFileName} ==\n\n`;
    const content = fs.readFileSync(file, "utf8");

    compiledFiles += content + "\n\n";
  });

  const languageName = supportedLanguages[targetLanguage] as string;

  const prompt = `
You will receive a list of files describing how a software should work.
Each file name is delimited by a double equal sign (==).
Starting from the file "main.md", generate code that will implement the software.
If the code description says something in the lines of "... generate n items", or "generate n random items",
 it means that you should generate data that fits that context.
If the description says something in the lines of "using the constant/variable declared at some_file.md",
this means that you should use the variable declared at the file x.md (not try to import it).
If the constant is used in multiple places, you may turn it into a function.
The response should come as a single block of code.
The code should not be wrapped in backticks.
The target language is ${languageName}.
`;
  const submitPrompt = `${prompt}\n\n${compiledFiles}`;

  console.log("The prompt:", submitPrompt)

  console.log(`Preparing output folder at ${outputPath}`);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  console.log("Writing submit.md prompt to output folder."); // TODO: include ai provider in the name
  fs.writeFileSync(`${outputPath}/submit.md`, submitPrompt);

  console.log("Submitting code to the AI...");

  // TODO: should be part of the ai provider

  const provider = aiProvider === "gemini" ?
    gemini(
      getEnv(dotEnvFilePath, "GEMINI_KEY"),
    ) :
    openai(
      getEnv(dotEnvFilePath, "OPENAI_KEY"),
    );

  let text = await provider(submitPrompt)

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

  console.log(`Writing ${aiProvider}-main.js to the output folder.`);

  fs.writeFileSync(`${outputPath}/${aiProvider}-main.${targetLanguage}`, text);

  console.log(
    'Your code is ready in the target output folder.'
  );
}
