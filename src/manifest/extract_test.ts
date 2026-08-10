import { assert, assertEquals } from "@std/assert";
import { extractManifest, ManifestExtractionError, parseManifestJson } from "./extract.ts";
import { guildManifest } from "./fixtures.ts";

const CORPUS = "== main.md ==\n\nThis defines the logic for the RPG Guild Simulator web API.\n";

Deno.test("parseManifestJson handles raw JSON", () => {
	const text = JSON.stringify({ hello: "world" });
	assertEquals(parseManifestJson(text), { hello: "world" });
});

Deno.test("parseManifestJson handles fenced JSON", () => {
	const text = "Here you go:\n```json\n{\"hello\":\"world\"}\n```\nThat's it.";
	assertEquals(parseManifestJson(text), { hello: "world" });
});

Deno.test("parseManifestJson handles JSON surrounded by prose", () => {
	const text = "sure, the manifest is {\"a\":1} ok";
	assertEquals(parseManifestJson(text), { a: 1 });
});

Deno.test("parseManifestJson throws on non-JSON", () => {
	let threw = false;
	try {
		parseManifestJson("this is not json at all");
	} catch {
		threw = true;
	}
	assert(threw);
});

Deno.test("extractManifest returns the manifest on the first valid attempt", async () => {
	let calls = 0;
	const provider = (_prompt: string): Promise<string> => {
		calls++;
		return Promise.resolve(JSON.stringify(guildManifest()));
	};
	const result = await extractManifest(CORPUS, provider, { maxRetries: 3 });
	assertEquals(result.attempts, 1);
	assertEquals(calls, 1);
	assertEquals(result.manifest.project.name, "Guild Simulator API");
});

Deno.test("extractManifest repairs invalid output by feeding errors back", async () => {
	const responses = [
		JSON.stringify({ ...guildManifest(), schemaVersion: 2 }),
		JSON.stringify(guildManifest()),
	];
	const prompts: string[] = [];
	const provider = (p: string): Promise<string> => {
		prompts.push(p);
		const response = responses.shift();
		if (response === undefined) throw new Error("no more responses");
		return Promise.resolve(response);
	};
	const result = await extractManifest(CORPUS, provider, { maxRetries: 3 });
	assertEquals(result.attempts, 2);
	assertEquals(prompts.length, 2);
	assert(prompts[1].includes("failed validation"));
	assert(prompts[1].includes("$.schemaVersion"));
});

Deno.test("extractManifest retries when the response is not valid JSON", async () => {
	const responses = ["oops not json", JSON.stringify(guildManifest())];
	const prompts: string[] = [];
	const provider = (p: string): Promise<string> => {
		prompts.push(p);
		const response = responses.shift();
		if (response === undefined) throw new Error("no more responses");
		return Promise.resolve(response);
	};
	const result = await extractManifest(CORPUS, provider, { maxRetries: 3 });
	assertEquals(result.attempts, 2);
	assert(prompts[1].includes("not valid JSON"));
});

Deno.test("extractManifest throws after exhausting retries", async () => {
	const provider = (_prompt: string): Promise<string> => Promise.resolve("still not json");
	let caught: unknown;
	try {
		await extractManifest(CORPUS, provider, { maxRetries: 2 });
	} catch (err) {
		caught = err;
	}
	assert(caught instanceof ManifestExtractionError);
	const error = caught as ManifestExtractionError;
	assertEquals(error.attempts, 2);
	assertEquals(error.errors.length, 2);
	assert(error.errors[0][0].path === "$");
});

Deno.test("extractManifest uses a custom prompt template and includes the corpus", async () => {
	const customTemplate = "CUSTOM EXTRACTION TEMPLATE";
	let seenPrompt = "";
	const provider = (p: string): Promise<string> => {
		seenPrompt = p;
		return Promise.resolve(JSON.stringify(guildManifest()));
	};
	await extractManifest(CORPUS, provider, { promptTemplate: customTemplate });
	assert(seenPrompt.startsWith(customTemplate));
	assert(seenPrompt.includes(CORPUS));
});
