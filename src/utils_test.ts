// src/utils_test.ts — aggregation must never include Verbo's own generated
// artifacts (.verbo/ is Markdown after clarify) — T14.
import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

import { aggregateFilesForPrompt } from "./utils.ts";

Deno.test("aggregateFilesForPrompt skips hidden/generated directories", () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-utils-" });
  try {
    Deno.mkdirSync(join(dir, "models"), { recursive: true });
    Deno.mkdirSync(join(dir, ".verbo", "clarifications"), { recursive: true });
    Deno.writeTextFileSync(join(dir, "main.md"), "project context\n");
    Deno.writeTextFileSync(join(dir, "models", "item.md"), "an item\n");
    Deno.writeTextFileSync(
      join(dir, ".verbo", "clarifications", "interview-log.md"),
      "audit trail, must not leak into the corpus\n",
    );

    const corpus = aggregateFilesForPrompt(dir, ["md"]);
    assertStringIncludes(corpus, "== main.md ==");
    assertStringIncludes(corpus, "== models/item.md ==");
    assertEquals(corpus.includes(".verbo"), false);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});
