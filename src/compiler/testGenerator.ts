import * as fs from "fs";

import { getEnv, getFiles } from "../utils";
import { openai } from "../api/openai";
import { gemini } from "../api/gemini";
import { ollama } from "../api/ollama";
import { anthropic } from "../api/anthropic";

export default async function testGenerator({
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

	const code = fs.readFileSync(`${outputPath}/index.ts`);

	const prompt = `
Your task is to generate tests for a TypeScript program.
The program was created based on the functionality described across a series of virtual files.
Those files contain descriptions in "Verbo," an abstract programming language that allows software to be specified using natural language.

Input Details:
- The files containing the software specification enclosed by double equal signs (==) as delimiters.
- The generated TypeScript program.

Verbo Characteristics:
- A single mutable state that holds all data.
- Unique symbols (regardless of case or closure context).
- Definitions for constants, functions, objects, and types.
- Ports for external interactions (e.g., I/O operations).

Your Output:
- Generate a suite of tests for the TypeScript program.
- The tests should use TypeScript.
- The tests should cover all the functionality described in the Verbo files.
- The tests should be written in Jest.
- The tests should be formatted as Markdown, with code enclosed in triple backticks (\`\`\`) for easy integration.

Key Points:

- You only have access to the Main class and the types exposed by the program
- The main class is located in the same folder as this file (index.ts)
- You are not allowed to check the internal state of the program
- Don't make assertions about the internal implementation of the code
- Don't make assertion of the type "called n times"
- Property-based testing is encouraged if possible

Example test code:

\`\`\`typescript
import { Main, State, Ports, User } from "./index";

test("should update the user", () => {

  const users: User[] = [
	{ name: "Alice", email: "alice@email.com" },
  ]

  const updateUserInDBMock = jest.fn();

  const app = new Main(
   { users: users },  // state
   { updateUserInDB: updateUserInDBMock }, //side-effect ports
  );

  app.updateUser({ name: "Alice", email: ")

  expect(updateUserInDBMock).toHaveBeenCalledWith({ name: "Alice", email: "new@email.com});

});

... more tests
\`\`\`

This is the specification of the TypeScript program:

${compiledFiles}

This is the TypeScript program:

${code}

Now, write the tests for the program.
`;

	console.log("The test prompt:", prompt);

	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath);
	}

	console.log(
		"Writing prompt.md to output folder. It contains the prompt sent to the AI provider."
	); // TODO: include ai provider in the name
	fs.writeFileSync(`${outputPath}/test-prompt.md`, prompt);

	console.log("Submitting code to the AI...");


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

	let text = await getProvider()(prompt);


	fs.writeFileSync(`${outputPath}/${aiProvider}-response.md`, text);
	text = text.replace("```typescript", "```");
	text = text.split("```")[1];

	console.log(`Writing index.test.ts to the output folder.`);

	fs.writeFileSync(`${outputPath}/index.test.ts`, text);

	// run jest test

	console.log("Running tests...");

	const { exec } = require("child_process");

	exec(`npx jest ${outputPath}`, async (error: any, stdout: any, stderr: any) => {

		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (error) {

			console.log(`The generated tests have errors. Asking the AI for fixes...`);

			const fixPrompt = `
			Your task is to fix issues with a TypeScript test suite.
			Input Details:
			- A test suite that is failing.
			- An error message from the test suite.

			Each input section will be identified by a delimiter, which is a double equal sign (==).

			Output:
			- A new version of the test suite that passes all tests.
			- The output should be in Markdown format, with code enclosed in triple backticks (\`\`\`) for easy integration.
			- You should reply with all the tests, not just the failing ones, as your response will replace the entire test suite.
			- Your response should contain only code - no explanations or comments.

			The inputs are as follows:

			== Test Suite ==

			${text}

			== Error Message ==

			${error}
			`

			fs.writeFileSync(`${outputPath}/${aiProvider}-test-fix-prompt.md`, fixPrompt);

			let response = await getProvider()(fixPrompt);

			fs.writeFileSync(`${outputPath}/${aiProvider}-test-fix-response.md`, response);
			response = response.replace("```typescript", "```");
			response = response.split("```")[1];

			console.log(`Writing fixed index.test.ts to the output folder.`);

			fs.writeFileSync(`${outputPath}/index.test.ts`, response);

			exec(`npx jest ${outputPath}`, async (error: any, stdout: any, stderr: any) => {

				if (error) {
					console.error(error)
					throw new Error("The test suite still has errors. Please check the specs.");
				} else {
					console.log("After fixes, all tests passed!");
				}

			})


		} else {

			console.log("All tests passed!", stdout);

		}

	})

}
