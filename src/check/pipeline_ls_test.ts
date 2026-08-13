// pipeline_ls_test.ts — regression smoke test for the `test/ls` fixture
// (T11): the `check` pipeline run against the ls spec files with a canned
// extraction must produce `Entry`, `Options` and a container `DirectoryListing`
// — without the redundant `Entry.entries: Entry[]` self-reference (T13).
import { assertEquals, assertStringIncludes } from "@std/assert";
import { dirname, join } from "https://deno.land/std@0.224.0/path/mod.ts";

import { runCheck } from "./pipeline.ts";

const FIXTURE = new URL("../../test/ls/", import.meta.url);

/** Copy the plain spec files of `test/ls` (main.md + models/*.md) into a temp
 * dir, without the generated `.verbo/` artifacts. */
function makeLsFixture(): string {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-ls-pipeline-" });
  for (const rel of ["main.md", "models/entry.md", "models/options.md"]) {
    const source = new URL(rel, FIXTURE);
    const text = Deno.readTextFileSync(source);
    const target = join(dir, rel);
    Deno.mkdirSync(dirname(target), { recursive: true });
    Deno.writeTextFileSync(target, text);
  }
  return dir;
}

const lsSpec = JSON.stringify({
  models: [
    {
      name: "Entry",
      source: "models/entry.md",
      properties: [
        { name: "name", type: "string" },
        { name: "path", type: "string" },
        { name: "isDirectory", type: "boolean" },
        {
          name: "size",
          type: "number",
          constraints: [{ kind: "minimum", value: 0 }],
        },
        { name: "modifiedAt", type: "date" },
        { name: "hidden", type: "boolean" },
      ],
    },
    {
      name: "DirectoryListing",
      source: "models/entry.md",
      properties: [
        { name: "entries", type: "Entry[]" },
      ],
    },
    {
      name: "Options",
      source: "models/options.md",
      properties: [
        { name: "path", type: "string" },
        { name: "showHidden", type: "boolean" },
        { name: "longFormat", type: "boolean" },
        {
          name: "sortBy",
          type: "string",
          constraints: [{ kind: "enum", values: ["name", "modified", "none"] }],
        },
        { name: "reverse", type: "boolean" },
        { name: "recursive", type: "boolean" },
      ],
    },
  ],
});

Deno.test("check on the ls fixture extracts Entry/Options without self-reference", async () => {
  const dir = makeLsFixture();
  try {
    const result = await runCheck({
      sourceDir: dir,
      aiProvider: async () => lsSpec,
      runDenoCheck: async () => ({ ok: true, stderr: "" }),
    });
    assertEquals(result.ok, true);

    const typesText = Deno.readTextFileSync(join(dir, "types.verbo.ts"));
    assertStringIncludes(typesText, "export type Entry = {");
    assertStringIncludes(typesText, "export type Options = {");
    assertStringIncludes(
      typesText,
      'export type OptionsSortBy = "name" | "modified" | "none";',
    );
    assertStringIncludes(typesText, "export type DirectoryListing = {");
    assertStringIncludes(typesText, "entries: Entry[];");

    // (T13) The container owns `entries`; the element model must not repeat it.
    const entryStart = typesText.indexOf("export type Entry = {");
    const entryEnd = typesText.indexOf("};", entryStart);
    const entryBlock = typesText.slice(entryStart, entryEnd);
    assertEquals(entryBlock.includes("entries:"), false);
  } finally {
    try {
      Deno.removeSync(dir, { recursive: true });
    } catch {
      // already gone
    }
  }
});
