import * as fs from "fs";

import { getEnv, getFiles } from "../utils";
import { openai } from "../api/openai";
import { gemini } from "../api/gemini";
import { ollama } from "../api/ollama";

export default async function compile({
  outputPath,
  sourceDir,
  dotEnvFilePath,
  aiProvider,
  model,
}: {
  outputPath: string;
  sourceDir: string;
  dotEnvFilePath: string;
  aiProvider: string;
  model: string;
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

  //console.log("Compiled files:", compiledFiles);

  //TODO: have different examples for different languages

  const prompt = `

Your task is to generate a TypeScript program that implements the functionality
described in a series of virtual files. 

Each file name is delimited by double equal signs (==).

These virtual files are from "Verbo", a programming language that allows describing
software with natural language.
The intention of the language is allowing the user to create simple, self-contained software.

Software described in Verbo has the following properties:
- A single mutable state that holds all the data
- All symbols are unique (regardless of case or clojure)
- Constants
- Functions
- Objects
- Types
- Ports that allow the software to interact with the external world

All Verbo files are written in the Markdown format.

The generated code of the program should be a single file that implements the described functionality.

A single "main" function should be generated that will run the software.

Avoid importing external libraries.

That "main" function should accept the following parameters:
- An initial state (null if no state is used)
- An object with port functions that can be used by the software

One example of such generated code:

export type User = {
  name: string;
}
export function main(
  initialState: State,
  ports:{
    print: (message: string) => void,
    updateUser: (user: User) => void,
    getUserFromDB: (id: string) => User
):number {
  ...
  const state = initializeState(initialState);
  ...
  // using ports:
  ports.print("Hello, world!");
  ports.updateUser({ name: "Alice" });
  const user = ports.getUserFromDB("123");
  ...
  return 22
}

The local state is mutable.
All other side effects (logging, requests, etc.) should be done using the provided ports.

The generated "main" function should be exposed to make it importable by other code, so that the user
may use it in their own codebase.
Types used in the parameters should be exported as well.

Starting from the file "main.md", generate code that implements the described software.
The generated code should represent a single ouput file that can be run in the target language.

All functions/constants/variables should be contained inside in the main function.

If the code description says something like "... generate n items", or "generate n random items",
it means that you should generate data that fits that context.

The response should come as a single block of code.
It is very important that the generated response contains only code.
If you want to add an explanation, use comments.
The code should *not* be wrapped in backticks.
After the code is generated, it will be fed into a formatter and linter, to ensure
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

  const getProvider = () => {

    if (aiProvider === "gemini") {

      return gemini(getEnv(dotEnvFilePath, "GEMINI_KEY"), model)
    } else if (aiProvider === "openai") {


      return openai(getEnv(dotEnvFilePath, "OPENAI_KEY"), model)
    }

    return ollama(model);
  }

  let text = await getProvider()(submitPrompt)

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

  console.log(`Writing ${aiProvider}-ts-main.ts to the output folder.`);

  fs.writeFileSync(`${outputPath}/${aiProvider}-ts-main.ts`, text);

  console.log(
    'Your code is ready in the target output folder.'
  );

  // TODO: feed into formatter and linter, on error, feed it another prompt

}
