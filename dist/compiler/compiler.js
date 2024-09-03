"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = compile;
const fs = __importStar(require("fs"));
const utils_1 = require("../utils");
const openai_1 = require("../api/openai");
const gemini_1 = require("../api/gemini");
const ollama_1 = require("../api/ollama");
function compile(_a) {
    return __awaiter(this, arguments, void 0, function* ({ outputPath, sourceDir, dotEnvFilePath, aiProvider, model, }) {
        console.log("Compiling source files...");
        const files = (0, utils_1.getFiles)(sourceDir);
        let compiledFiles = "";
        files.forEach((file) => {
            // remove absolute file path from the file name
            const filteredFileName = file.replace(sourceDir + "/", "");
            compiledFiles += `== ${filteredFileName} ==\n\n`;
            const content = fs.readFileSync(file, "utf8");
            compiledFiles += content + "\n\n";
        });
        //console.log("Compiled files:", compiledFiles);
        //TODO: have different examples for different languages
        const prompt = `
Your task is to generate a TypeScript program based on the functionality described across a series of virtual files.
These files contain descriptions in "Verbo," an abstract programming language that allows software to be specified using natural language.

Input Details:
- Each file name is enclosed by double equal signs (==) as delimiters.
- The Verbo language enables users to create simple, self-contained software systems described in natural language.
- Each Verbo file is formatted in Markdown and contains one or more functional descriptions.

Verbo Characteristics:
- A single mutable state that holds all data.
- Unique symbols (regardless of case or closure context).
- Definitions for constants, functions, objects, and types.
- Ports for external interactions (e.g., I/O operations).

Your Output:
- Generate a single TypeScript file implementing the described functionality.
- The generated code should include:
 - A main function that initializes and runs the software.
 - No use of external libraries or dependencies.
 - Complex operations (like running a server) should be handled via the provided ports.
 - The main function is only declared and exported, not executed.

The main Function:
Parameters:
- initialState: an optional initial state (null if no state is provided).
- ports: an object containing functions for external interactions.

Example Output Structure:

type State = {
  users: User[];
}

export type User = {
  name: string;
}

export function main(
  initialState: State,
  ports: {
    print: (message: string) => void,
    createUserInDB: (user: User) => void,
    updateUserInDB: (user: User) => void,
    getUserFromDB: (id: string) => User
  }
): number {
  const state = { ...initialState }; // shallow copy of the initial state
  ...
  function createUser(id: string, name: string) { 
    const user = { id, name };
    ports.createUserInDB(user);
    state.users.push(user); 
  }
  createUser("123", "Bob");
  ...
  ports.print("Hello, world!");
  ports.updateUserInDB({ id: "11", name: "Alice" });
  const user = ports.getUserFromDB("123");
  ...
  return "completed!" // only return a value if specified by the user in the Verbo files
}

Key Guidelines:
- State Mutability: The local state is mutable, but all side effects should be managed through the provided ports.
- Encapsulation: Place all functions, constants, and variables within the main function to ensure encapsulation.
- Handling Ambiguity: If any Verbo descriptions are ambiguous or incomplete, make reasonable assumptions and document them in comments.
- Processing Order: Evaluate all provided files as one logical unit, ensuring that the main function can run without errors.
- Final Output: The generated TypeScript code should be a single, well-formatted file, suitable for immediate integration and further linting.
Starting from the file "main.md", generate the required code that fully implements the described software.
`;
        const submitPrompt = `${prompt}\n\n${compiledFiles}`;
        console.log("The prompt:", submitPrompt);
        console.log(`Preparing output folder at ${outputPath}`);
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
        }
        console.log("Writing prompt.md to output folder. It contains the prompt sent to the AI provider."); // TODO: include ai provider in the name
        fs.writeFileSync(`${outputPath}/prompt.md`, submitPrompt);
        console.log("Submitting code to the AI...");
        // TODO: should be part of the ai provider
        const getProvider = () => {
            if (aiProvider === "gemini") {
                return (0, gemini_1.gemini)((0, utils_1.getEnv)(dotEnvFilePath, "GEMINI_KEY"), model);
            }
            else if (aiProvider === "openai") {
                return (0, openai_1.openai)((0, utils_1.getEnv)(dotEnvFilePath, "OPENAI_KEY"), model);
            }
            return (0, ollama_1.ollama)(model);
        };
        let text = yield getProvider()(submitPrompt);
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
        console.log('Your code is ready in the target output folder.');
        // TODO: feed into formatter and linter, on error, feed it another prompt
    });
}
//# sourceMappingURL=compiler.js.map