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
const constants_1 = require("../constants");
const openai_1 = require("../api/openai");
const gemini_1 = require("../api/gemini");
function compile(_a) {
    return __awaiter(this, arguments, void 0, function* ({ outputPath, sourceDir, dotEnvFilePath, targetLanguage, aiProvider, }) {
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
        const languageName = constants_1.supportedLanguages[targetLanguage];
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
        console.log("The prompt:", submitPrompt);
        console.log(`Preparing output folder at ${outputPath}`);
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
        }
        console.log("Writing submit.md prompt to output folder."); // TODO: include ai provider in the name
        fs.writeFileSync(`${outputPath}/submit.md`, submitPrompt);
        console.log("Submitting code to the AI...");
        // TODO: should be part of the ai provider
        const GEMINI_KEY = (0, utils_1.getEnv)(dotEnvFilePath, "GEMINI_KEY");
        const OPENAI_KEY = (0, utils_1.getEnv)(dotEnvFilePath, "OPENAI_KEY");
        const provider = aiProvider === "gemini" ? (0, gemini_1.gemini)(GEMINI_KEY) : (0, openai_1.openai)(OPENAI_KEY);
        let text = yield provider(submitPrompt);
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
        fs.writeFileSync(`${outputPath}/${aiProvider}-main.${targetLanguage}`, text);
        console.log('Your code is ready in the target output folder.');
    });
}
//# sourceMappingURL=compiler.js.map