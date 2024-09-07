import * as fs from "fs";

import { getEnv, getFiles } from "../utils";
import { openai } from "../api/openai";
import { gemini } from "../api/gemini";
import { ollama } from "../api/ollama";
import { anthropic } from "../api/anthropic";

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

  const prompt = `
Your task is to generate a TypeScript React component program based on the functionality described across a series of virtual files.
These files contain descriptions in "Verbo," an abstract programming language that allows software to be specified using natural language.

Input Details:
- Each file name is enclosed by double equal signs (==) as delimiters.
- The Verbo language enables users to create simple, self-contained software systems described in natural language.
- Each Verbo file is formatted in Markdown and contains one or more functional descriptions.

Verbo Characteristics for React components:
- A single mutable state that holds all data.
- Unique symbols (regardless of case or closure context).
- Definitions for constants, functions, objects, and types.
- Ports for external interactions (e.g., I/O operations).

Your Output:
- Generate a single TypeScript (.tsx) file implementing the described functionality into a single React Component.
- The generated code should include:
 - A functional component that initializes and runs the software.
 - No use of external libraries or dependencies (besides React)
 - Complex operations (like running a server) should be handled via the provided ports.
 - The main component is only declared and exported, not executed.
- The response should be formatted as Markdown, with code enclosed in triple backticks (\`\`\`) for easy integration.

The React component:
Properties:
- initialState: an optional initial state (null if no state is provided).
- ports: an object containing functions for external interactions.

Example Output Structure:

import React, { useState } from 'react';

// Define types
export type User = {
  id: string;
  name: string;
}

export type Ports = {
  print: (message: string) => void;
}

// Main Component
const UserList: React.FC<{ state:User[], ports: Ports }> = ({ state, ports }) => {
  // Initial state setup with useState for managing users
  const [users, setUsers] = useState<User[]>(state);

  return (
    <div>
      <h1>User List</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} (ID: {user.id})
          </li>
        ))}
      </ul>
      <button onClick={() => ports.print('Fetching users...')}>
        Fetch Users
      </button>
    </div>
  );
};

export default UserList;

  
Key Guidelines:
- State Mutability: The local state is mutable, but all other side effects should be managed through the provided ports.
- Handling Ambiguity: If any Verbo descriptions are ambiguous or incomplete, make reasonable assumptions and document them in comments.
- Visibility: Only the main React component and the types used by the component should be exported.
- Processing Order: Evaluate all provided files as one logical unit, ensuring that the main function can run without errors.
- Final Output: The generated React TypeScript code should be a single, well-formatted file, suitable for immediate integration and further linting.

Starting from the file "main.md", generate the required code that fully implements the described software.
`;
  const submitPrompt = `${prompt}\n\n${compiledFiles}`;

  console.log("The prompt:", submitPrompt);

  console.log(`Preparing output folder at ${outputPath}`);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  console.log(
    "Writing prompt.md to output folder. It contains the prompt sent to the AI provider."
  ); // TODO: include ai provider in the name
  fs.writeFileSync(`${outputPath}/prompt.md`, submitPrompt);

  console.log("Submitting code to the AI...");

  // TODO: should be part of the ai provider

  const getProvider = () => {
    if (aiProvider === "gemini") {
      return gemini(getEnv(dotEnvFilePath, "GEMINI_KEY"), model);
    } else if (aiProvider === "openai") {
      return openai(getEnv(dotEnvFilePath, "OPENAI_KEY"), model);
    } else if (aiProvider === "anthropic") {
      return anthropic(getEnv(dotEnvFilePath, "ANTHROPIC_KEY"), model);
    }

    return ollama(model);
  };

  let text = await getProvider()(submitPrompt);

  console.log(`AI response: ${text} `);

  fs.writeFileSync(`${outputPath}/${aiProvider}-response.md`, text);
  text = text.replace("```typescript", "```");
  text = text.split("```")[1];

  console.log("Extracted code from the AI response.");

  console.log(`Writing main.ts to the output folder`);

  fs.writeFileSync(`${outputPath}/index.tsx`, text);

  // compile the generated code

  console.log("Will attempt to compile the generated code.");

  const { exec } = require("child_process");

  exec(`npx tsc --jsx react --esModuleInterop ${outputPath}/index.tsx --outDir ${outputPath}`, async (error: any, stdout: any, stderr: any) => {

    if (!error) {
      console.log("Code has been successfully compiled.");
      return
    }

    console.log(`The generated code has errors. Asking the AI for fixes...`);

    const retryPrompt = `
      Your task is to fix issues with a TypeScript file.
			Input Details:
			- The TypeScript code for an application that has issues.
			- An error message from the TypeScript compiler.

			Each input section will be identified by a delimiter, which is a double equal sign (==).

			Output:
			- A new version of the program that resolves the issues.
			- The output should be in Markdown format, with code enclosed in triple backticks (\`\`\`) for easy integration.

			The inputs are as follows:

			== Application code ==

			${text}

			== Error Message ==

			error: ${error}
      stdout: ${stdout}
      stderr: ${stderr}
        
        `;

    fs.writeFileSync(`${outputPath}/${aiProvider}-retry.md`, retryPrompt);

    let fixResponse = await getProvider()(retryPrompt);

    console.log(`AI response: ${fixResponse} `);

    fixResponse = fixResponse.replace("```typescript", "```");
    fixResponse = fixResponse.split("```")[1];

    console.log("Extracted code from the AI response.");

    console.log(`Writing fixed main.ts to the output folder`);

    fs.writeFileSync(`${outputPath}/index.tsx`, fixResponse);

    console.log("Will attempt to compile the fixed code.");

    exec(`npx tsc --jsx react --esModuleInterop ${outputPath}/index.tsx --outDir ${outputPath}`, async (error: any, stdout: any, stderr: any) => {

      if (error) {
        console.error(error)
        throw new Error("The code still has errors. Please adjust the specs.");
      } else {
        console.log("Your code is ready in the target output folder.");
      }
    });

  })

  console.log("Your code is ready in the target output folder.");

  // TODO: feed into formatter and linter, on error, feed it another prompt
}
