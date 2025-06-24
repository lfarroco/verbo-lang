import { createDirIfNotExists, writefile } from "../utils.ts";
import { gatherFiles } from "./gatherFiles.ts";
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

  const compiledFiles = gatherFiles(sourceDir);

  const __dirname = dirname(fromFileUrl(import.meta.url));
  const prompt = await Deno.readTextFile(join(__dirname, "../prompts/compile-class.md"));

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

  writefile(`${outputPath}/index.ts`, text);

  // compile the generated code

  console.log("Will attempt to compile the generated code.");


  // exec(`npx tsc ${outputPath}/index.ts --outDir ${outputPath}`, async (error: any, stdout: any, stderr: any) => {

  //   if (!error) {
  //     console.log("Code has been successfully compiled.");
  //     return
  //   }

  //   console.log(`The generated code has errors. Asking the AI for fixes...`);

  //   const retryPrompt = `
  //     Your task is to fix issues with a TypeScript React component.
  // 		Input Details:
  // 		- The TypeScript code for a React component that has issues.
  // 		- An error message from the TypeScript compiler.

  // 		Each input section will be identified by a delimiter, which is a double equal sign (==).

  // 		Output:
  // 		- A new version of the component that resolves the issues.
  // 		- The output should be in Markdown format, with code enclosed in triple backticks (\`\`\`) for easy integration.

  // 		The inputs are as follows:

  // 		== Component code ==

  // 		${text}

  // 		== Error Message ==

  // 		${error}

  //       `;

  //   fs.writeFileSync(`${outputPath}/${aiProvider}-retry.md`, retryPrompt);

  //   let fixResponse = await getProvider()(retryPrompt);

  //   console.log(`AI response: ${fixResponse} `);

  //   fixResponse = fixResponse.replace("```typescript", "```");
  //   fixResponse = fixResponse.split("```")[1];

  //   console.log("Extracted code from the AI response.");

  //   console.log(`Writing fixed main.ts to the output folder`);

  //   fs.writeFileSync(`${outputPath}/index-fixed.tsx`, fixResponse);

  //   console.log("Will attempt to compile the fixed code.");

  //   exec(`npx tsc ${outputPath}/index-fixed.ts --outDir ${outputPath}`, async (error: any, stdout: any, stderr: any) => {

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
