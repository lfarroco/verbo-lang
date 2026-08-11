// ls_test.ts — tests for the `ls` CLI, one test per spec behavior.
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { assertEquals, assertMatch } from "@std/assert";
import {
  type Entry,
  formatEntry,
  list,
  type Options,
  parseArgs,
  sortEntries,
} from "./ls.ts";

function baseOptions(path: string): Options {
  return {
    path,
    showHidden: false,
    longFormat: false,
    sortBy: "name",
    reverse: false,
    recursive: false,
  };
}

function makeFixture(): { dir: string; cleanup: () => void } {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-ls-test-" });
  const files = [
    "zeta.txt",
    "alpha.txt",
    ".secret",
    "sub/inner/deep.txt",
  ];
  for (const f of files) {
    const full = join(dir, f);
    Deno.mkdirSync(join(full, ".."), { recursive: true });
    Deno.writeTextFileSync(full, f);
  }
  // Give the entries distinct modification times so -t is deterministic:
  // alpha newest, zeta oldest, .secret in between.
  const now = Date.now();
  Deno.utimeSync(join(dir, "alpha.txt"), now, new Date(now + 10_000));
  Deno.utimeSync(join(dir, ".secret"), now, new Date(now));
  Deno.utimeSync(join(dir, "zeta.txt"), now, new Date(now - 10_000));
  Deno.utimeSync(join(dir, "sub"), now, new Date(now - 20_000));
  return {
    dir,
    cleanup: () => {
      try {
        Deno.removeSync(dir, { recursive: true });
      } catch {
        // best-effort cleanup
      }
    },
  };
}

Deno.test("parseArgs: defaults and flag mapping", () => {
  assertEquals(parseArgs([]).options, baseOptions("."));
  const r = parseArgs(["-a", "-l", "-t", "-r", "-R", "mydir"]);
  assertEquals(r.error, undefined);
  assertEquals(r.options.path, "mydir");
  assertEquals(r.options.showHidden, true);
  assertEquals(r.options.longFormat, true);
  assertEquals(r.options.sortBy, "modified");
  assertEquals(r.options.reverse, true);
  assertEquals(r.options.recursive, true);
});

Deno.test("parseArgs: unknown option is an error", () => {
  const r = parseArgs(["--bogus"]);
  assertMatch(r.error ?? "", /unknown option/);
});

Deno.test("default listing: sorted by name, no hidden, no dot entries", () => {
  const { dir, cleanup } = makeFixture();
  try {
    const result = list(baseOptions(dir));
    assertEquals(result.exitCode, 0);
    assertEquals(result.stderr, []);
    assertEquals(result.stdout, ["alpha.txt", "sub", "zeta.txt"]);
  } finally {
    cleanup();
  }
});

Deno.test("-a includes hidden entries (dot-prefixed names)", () => {
  const { dir, cleanup } = makeFixture();
  try {
    const result = list({ ...baseOptions(dir), showHidden: true });
    assertEquals(result.stdout, [".secret", "alpha.txt", "sub", "zeta.txt"]);
  } finally {
    cleanup();
  }
});

Deno.test("-l long format: type char, size, YYYY-MM-DD HH:MM, name", () => {
  const { dir, cleanup } = makeFixture();
  try {
    const result = list({ ...baseOptions(dir), longFormat: true });
    assertEquals(result.stdout.length, 3);
    for (const line of result.stdout) {
      assertMatch(
        line,
        /^[df] \d+ \d{4}-\d{2}-\d{2} \d{2}:\d{2} [^\s]+$/,
      );
    }
    // Directories report size 0; the name column is the entry name, not path.
    const sub = result.stdout.find((l) => l.endsWith("sub"))!;
    assertMatch(sub, /^d 0 \d{4}-\d{2}-\d{2} \d{2}:\d{2} sub$/);
  } finally {
    cleanup();
  }
});

Deno.test("-t sorts by modification time, newest first", () => {
  const { dir, cleanup } = makeFixture();
  try {
    const result = list({ ...baseOptions(dir), sortBy: "modified" });
    // alpha.txt is newest (now+10s), zeta.txt next (now-10s), sub oldest
    // (now-20s); .secret (now) is hidden without -a.
    assertEquals(result.stdout, ["alpha.txt", "zeta.txt", "sub"]);
  } finally {
    cleanup();
  }
});

Deno.test("-r reverses the sort order", () => {
  const { dir, cleanup } = makeFixture();
  try {
    const result = list({ ...baseOptions(dir), reverse: true });
    assertEquals(result.stdout, ["zeta.txt", "sub", "alpha.txt"]);
  } finally {
    cleanup();
  }
});

Deno.test("-R lists subdirectories recursively with headers", () => {
  const { dir, cleanup } = makeFixture();
  try {
    const result = list({ ...baseOptions(dir), recursive: true });
    assertEquals(result.exitCode, 0);
    assertEquals(result.stdout, [
      `${dir}:`,
      "alpha.txt",
      "sub",
      "zeta.txt",
      "",
      "sub:",
      "inner",
      "",
      "sub/inner:",
      "deep.txt",
    ]);
  } finally {
    cleanup();
  }
});

Deno.test("nonexistent path: error to stderr, exit code 1", () => {
  const result = list(baseOptions("/definitely/not/here"));
  assertEquals(result.exitCode, 1);
  assertEquals(result.stdout, []);
  assertMatch(result.stderr[0] ?? "", /cannot access/);
});

Deno.test("path is a file: list that single file as one entry", () => {
  const { dir, cleanup } = makeFixture();
  try {
    const file = join(dir, "alpha.txt");
    const plain = list(baseOptions(file));
    assertEquals(plain.exitCode, 0);
    assertEquals(plain.stdout, ["alpha.txt"]);

    // Even with -R the single file is listed as one entry.
    const recursive = list({ ...baseOptions(file), recursive: true });
    assertEquals(recursive.stdout, ["alpha.txt"]);
  } finally {
    cleanup();
  }
});

Deno.test("sortEntries: modified ties break by name ascending", () => {
  const base = new Date(1_700_000_000_000);
  const entries: Entry[] = [
    {
      name: "b",
      path: "b",
      isDirectory: false,
      size: 1,
      modifiedAt: base,
      hidden: false,
    },
    {
      name: "a",
      path: "a",
      isDirectory: false,
      size: 1,
      modifiedAt: base,
      hidden: false,
    },
  ];
  const sorted = sortEntries(entries, "modified", false);
  assertEquals(sorted.map((e) => e.name), ["a", "b"]);
});

Deno.test("formatEntry: long format shows name, never the path", () => {
  const entry: Entry = {
    name: "x.txt",
    path: "sub/x.txt",
    isDirectory: false,
    size: 42,
    modifiedAt: new Date(2026, 7, 11, 9, 5), // Aug 11 2026 09:05 local
    hidden: false,
  };
  assertEquals(formatEntry(entry, false), "x.txt");
  assertEquals(
    formatEntry(entry, true),
    "f 42 2026-08-11 09:05 x.txt",
  );
});
