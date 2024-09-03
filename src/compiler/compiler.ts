import * as fs from "fs";

import { getEnv, getFiles } from "../utils";
import { supportedLanguageCode, supportedLanguages } from "../constants";
import { openai } from "../api/openai";
import { gemini } from "../api/gemini";
import { ollama } from "../api/ollama";

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

  //TODO: have different examples for different languages
  //TODO: if generating java, use "class" instead of "function"

  const prompt = `

Your task is to generate a program that implements the functionality
described in a series of virtual files. 
Each file name is delimited by double equal signs (==).
These virtual files are from "Verbo", a programming language that allows describing
software with natural language.
Software described in Verbo has the following properties:
- A single mutable state that holds all the data
- Events that can change the state
- Constants
- Functions
- Objects
- Types
- Ports that allow the software to interact with the external world
All Verbo files are written in Markdown format.
The output of the program should be a single file that implements the described functionality.
A single "main" function or class should be generated that will run the software.
That "main" function or class should accept the following parameters:
- An object with parameters that will be used to configure the software
- An object that will be used to initialize the state
- An object with the ports that will be used by the software
The intention of the language is allowing the user to create simple, self-contained software.
One example of such main function that could be generated is:
export function main(config, initialState, ports) {
  const url = config.baseUrl + "/users";
  const state = initialState;
  // using ports:
  ports.print("Hello, world!");
  ports.updateUser({ name: "Alice" });
  ports.sendEmail({ to: "", subject: "", body: "" });
}
If the target language is object-oriented, "main" will be a class.
If the target language is functional, "main" will be a function.
Multiparadigm languages will have the choice of using a class or a function.
The generated code should be importable by other code, so that the user
may use it in their own codebase.

Starting from the file "main.md", generate code that implements the described software.

If the code description says something like "... generate n items", or "generate n random items",
it means that you should generate data that fits that context.

If the description says something like "using the constant/variable declared at some_file.md",
this means that you should use the variable declared at the file some_file.md (not try to import it).
If the constant is used in multiple places, you may turn it into a function.

As the Verbo language is language-agnostice, you may use any language constructs
that will be appropriate to implement the described functionality.
For example, if the description defines an "object", you are free to use a class, 
struct or dictionary depending on what will be more convenient in the target language.
The target programming language is ${languageName}.
The response should come as a single block of code.
The code should not be wrapped in backticks.
After the code is generated, it will be fed into a formatter and linter, so ensure
that no illegal artifacts are present.
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

  const provider = aiProvider === "gemini" ? gemini(getEnv(dotEnvFilePath, "GEMINI_KEY")) :
    aiProvider === "openai" ? openai(getEnv(dotEnvFilePath, "OPENAI_KEY")) :
      ollama;

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
