import { createDirIfNotExists, listAppFiles, readFile, writefile } from "../utils.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

export default async function compile({
  outputPath,
  sourceDir,
  aiProvider,
}: {
  outputPath: string;
  sourceDir: string;
  aiProvider: (prompt: string) => Promise<string>;
}) {
  console.log("Compiling source files...");

  const files = listAppFiles(sourceDir);

  let compiledFiles = "";

  files.forEach((file: string) => {
    // remove absolute file path from the file name
    const filteredFileName = file.replace(sourceDir + "/", "");
    compiledFiles += `== ${filteredFileName} ==\n\n`;
    const content = readFile(file);

    compiledFiles += content + "\n\n";
  });

  const __dirname = dirname(fromFileUrl(import.meta.url));
  const prompt = await Deno.readTextFile(join(__dirname, "../prompts/compile-react.md"));

  const submitPrompt = `${prompt}\n\n${compiledFiles}`;

  console.log("The prompt:", submitPrompt);

  console.log(`Preparing output folder at ${outputPath}`);

  createDirIfNotExists(outputPath);

  console.log(
    "Writing prompt.md to output folder. It contains the prompt sent to the AI provider."
  ); // TODO: include ai provider in the name

  writefile(`${outputPath}/prompt.md`, submitPrompt);

  console.log("Submitting code to the AI...");

  // TODO: should be part of the ai provider

  let text = await aiProvider(submitPrompt);

  console.log(`AI response: ${text} `);

  writefile(`${outputPath}/${aiProvider}-response.md`, text);
  text = text.replace("```typescript", "```");
  text = text.split("```")[1];

  console.log("Extracted code from the AI response.");

  console.log(`Writing main.ts to the output folder`);

  writefile(`${outputPath}/index.tsx`, text);

  // compile the generated code

  console.log("Will attempt to compile the generated code.");

  //const { exec } = require("child_process");

  // TODO: with deno, tsc is no longer needed

  // exec(`npx tsc --jsx react --esModuleInterop ${outputPath}/index.tsx --outDir ${outputPath}`, async (error: any, stdout: any, stderr: any) => {

  //   if (!error) {
  //     console.log("Code has been successfully compiled.");
  //     return
  //   }

  //   console.log(`The generated code has errors. Asking the AI for fixes...`);

  //   const retryPrompt = `
  //     Your task is to fix issues with a TypeScript file.
  // 		Input Details:
  // 		- The TypeScript code for an application that has issues.
  // 		- An error message from the TypeScript compiler.

  // 		Each input section will be identified by a delimiter, which is a double equal sign (==).

  // 		Output:
  // 		- A new version of the program that resolves the issues.
  // 		- The output should be in Markdown format, with code enclosed in triple backticks (\`\`\`) for easy integration.

  // 		The inputs are as follows:

  // 		== Application code ==

  // 		${text}

  // 		== Error Message ==

  // 		error: ${error}
  //     stdout: ${stdout}
  //     stderr: ${stderr}

  //       `;

  //   fs.writeFileSync(`${outputPath}/${aiProvider}-retry.md`, retryPrompt);

  //   let fixResponse = await getProvider()(retryPrompt);

  //   console.log(`AI response: ${fixResponse} `);

  //   fixResponse = fixResponse.replace("```typescript", "```");
  //   fixResponse = fixResponse.split("```")[1];

  //   console.log("Extracted code from the AI response.");

  //   console.log(`Writing fixed main.ts to the output folder`);

  //   fs.writeFileSync(`${outputPath}/index.tsx`, fixResponse);

  //   console.log("Will attempt to compile the fixed code.");

  //   exec(`npx tsc --jsx react --esModuleInterop ${outputPath}/index.tsx --outDir ${outputPath}`, async (error: any, stdout: any, stderr: any) => {

  //     if (error) {
  //       console.error(error)
  //       throw new Error("The code still has errors. Please adjust the specs.");
  //     } else {
  //       console.log("Your code is ready in the target output folder.");
  //     }
  //   });

  // })

  console.log("Your code is ready in the target output folder.");

  // TODO: feed into formatter and linter, on error, feed it another prompt
}
