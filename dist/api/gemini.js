"use strict";
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
exports.gemini = void 0;
const geminiURL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
const gemini = (key) => (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch(`${geminiURL}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
        }),
    });
    const json = yield response.json();
    // check if the response is valid (should have candidates and parts)
    if (!json.candidates || !json.candidates[0].content.parts) {
        throw new Error(`Invalid response from the AI: ${JSON.stringify(json, null, 2)}`);
    }
    let { text } = json.candidates[0].content.parts[0];
    return text;
});
exports.gemini = gemini;
//# sourceMappingURL=gemini.js.map