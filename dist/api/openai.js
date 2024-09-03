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
exports.openai = void 0;
const openai = (key, model) => (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "user", content: prompt }
            ]
        })
    });
    const data = yield response.json();
    // check validity of response
    if (!data.choices || !data.choices[0].message) {
        throw new Error(`Invalid response from OpenAI: ${JSON.stringify(data, null)}`);
    }
    return data.choices[0].message.content;
});
exports.openai = openai;
//# sourceMappingURL=openai.js.map