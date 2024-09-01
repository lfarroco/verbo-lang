"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = exports.getEnv = void 0;
const fs_1 = __importDefault(require("fs"));
const getEnv = (dotEnvFilePath, key) => {
    console.log("Reading .env file from: ", process.cwd());
    const dotenv = fs_1.default.readFileSync(dotEnvFilePath, "utf8");
    const lines = dotenv.split("\n");
    const row = lines.find((line) => line.startsWith(key));
    if (!row) {
        throw new Error(`Key ${key} not found in .env file`);
    }
    const value = row.split("=")[1];
    if (!value) {
        throw new Error(`Value for key ${key} not found in .env file`);
    }
    return value;
};
exports.getEnv = getEnv;
const getFiles = (source) => {
    console.log("Reading source files from: ", source);
    // check if main.md exists
    if (!fs_1.default.existsSync(source + "/main.md")) {
        throw new Error("main.md not found in source directory");
    }
    const files = [];
    function readFiles(dir) {
        const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
        entries.forEach((entry) => {
            if (entry.isDirectory()) {
                readFiles(`${dir}/${entry.name}`);
            }
            else if (entry.isFile() && entry.name.endsWith(".md")) {
                //skip main.md
                if (entry.name === "main.md") {
                    return;
                }
                files.push(`${dir}/${entry.name}`);
            }
        });
    }
    readFiles(source);
    const allFiles = files.concat(`${source}/main.md`);
    console.log("all files: ", allFiles);
    return allFiles;
};
exports.getFiles = getFiles;
//# sourceMappingURL=utils.js.map