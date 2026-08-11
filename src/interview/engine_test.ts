import {
  assertEquals,
  assertMatch,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import { dirname, join } from "https://deno.land/std@0.224.0/path/mod.ts";

import {
  applyAnswer,
  diffPreview,
  parseClarifications,
  preserveBulletPrefix,
  runInterview,
  sessionId,
  trimTrailingOverlap,
} from "./engine.ts";
import {
  type ClarificationQuestion,
  severityAtLeast,
  sortBySeverity,
} from "./types.ts";

function writeFile(dir: string, rel: string, content: string): void {
  const path = join(dir, rel);
  Deno.mkdirSync(dirname(path), { recursive: true });
  Deno.writeTextFileSync(path, content);
}

function makeQuestion(
  severity: ClarificationQuestion["severity"],
  context: string,
): ClarificationQuestion {
  return { severity, file: "todo.md", context, question: "Q", options: [] };
}

/** Read the (single) audit file in `auditDir` whose name matches `pattern`. */
function readAuditFile(auditDir: string, pattern: RegExp): string {
  const entry = [...Deno.readDirSync(auditDir)].find(
    (e) => e.isFile && pattern.test(e.name),
  );
  if (!entry) {
    throw new Error(`No audit file matching ${pattern} in ${auditDir}`);
  }
  return Deno.readTextFileSync(join(auditDir, entry.name));
}

// --- parseClarifications ---

Deno.test("parseClarifications parses a plain and a fenced JSON array", () => {
  const plain = JSON.stringify([
    {
      severity: "HIGH",
      file: "todo.md",
      context: "a name",
      question: "What is a name?",
    },
  ]);
  assertEquals(parseClarifications(plain), [
    {
      severity: "HIGH",
      file: "todo.md",
      context: "a name",
      question: "What is a name?",
      options: [],
    },
  ]);

  const fenced = `Here you go:\n\n\`\`\`json\n${plain}\n\`\`\`\n`;
  assertEquals(parseClarifications(fenced), parseClarifications(plain));
});

Deno.test("parseClarifications throws on garbage", () => {
  assertThrows(() => parseClarifications("no json here"));
  assertThrows(() => parseClarifications("just prose without brackets"));
  assertThrows(() => parseClarifications('{"severity": "HIGH"}')); // not an array
  assertThrows(() => parseClarifications("[not valid json"));
});

Deno.test("parseClarifications drops malformed entries and defaults missing options", () => {
  const text = JSON.stringify([
    {
      severity: "HIGH",
      file: "todo.md",
      context: "a name",
      question: "What is a name?",
    },
    {
      severity: "HIGH",
      file: "todo.md",
      context: "b",
      question: "Mixed options",
      options: ["only", 42, "strings", null],
    },
    {
      severity: "LOW",
      file: "todo.md",
      context: "c",
      question: "Unknown severity",
    },
    { severity: "HIGH", context: "d", question: "Missing file" },
    { severity: "HIGH", file: "todo.md", question: "Missing context" },
    { severity: "HIGH", file: "todo.md", context: "e" }, // missing question
    { severity: "HIGH", file: "", context: "f", question: "Empty file" },
    "junk",
    null,
  ]);

  const qs = parseClarifications(text);
  assertEquals(qs.length, 2);
  assertEquals(qs[0].options, []);
  assertEquals(qs[1].context, "b");
  assertEquals(qs[1].options, ["only", "strings"]);
});

// --- sortBySeverity ---

Deno.test("sortBySeverity orders CRITICAL first and preserves tie order", () => {
  const qs = [
    makeQuestion("MEDIUM", "m1"),
    makeQuestion("CRITICAL", "c1"),
    makeQuestion("HIGH", "h1"),
    makeQuestion("CRITICAL", "c2"),
    makeQuestion("MEDIUM", "m2"),
    makeQuestion("HIGH", "h2"),
  ];
  const sorted = sortBySeverity(qs);
  assertEquals(sorted.map((q) => q.context), [
    "c1",
    "c2",
    "h1",
    "h2",
    "m1",
    "m2",
  ]);
});

// --- applyAnswer ---

Deno.test("applyAnswer replaces the first occurrence and preserves the rest", () => {
  const content = [
    "- name: the item's name",
    "- status: active or completed",
    "- name: another mention of the name",
  ].join("\n") + "\n";
  const updated = applyAnswer(
    content,
    "the item's name",
    "the item's full name (max 100 chars)",
  );
  assertEquals(updated.applied, true);
  assertEquals(updated.index, content.indexOf("the item's name"));
  assertEquals(
    updated.content,
    [
      "- name: the item's full name (max 100 chars)",
      "- status: active or completed",
      "- name: another mention of the name",
    ].join("\n") + "\n",
  );
});

Deno.test("applyAnswer reports applied:false when the context is missing", () => {
  const content = "- name: hello\n";
  assertEquals(
    applyAnswer(content, "does not exist anywhere", "replacement"),
    { content, applied: false, index: -1 },
  );
});

// --- preserveBulletPrefix (T1) ---

Deno.test("preserveBulletPrefix re-adds a dropped property name", () => {
  const context = "- size: The size of the entry in bytes.";
  assertEquals(
    preserveBulletPrefix(context, "always zero"),
    "- size: always zero",
  );
});

Deno.test("preserveBulletPrefix keeps an answer that already has the name", () => {
  assertEquals(
    preserveBulletPrefix("- size: ...", "size: always zero"),
    "size: always zero",
  );
  assertEquals(
    preserveBulletPrefix("- size: ...", "- size: always zero"),
    "- size: always zero",
  );
  assertEquals(
    preserveBulletPrefix("name: the name", "name: a full name"),
    "name: a full name",
  );
});

Deno.test("preserveBulletPrefix leaves non-property contexts alone", () => {
  assertEquals(
    preserveBulletPrefix("some prose passage", "a rewrite"),
    "a rewrite",
  );
});

// --- trimTrailingOverlap (T3) ---

Deno.test("trimTrailingOverlap removes a phrase that already follows the context", () => {
  const content = "- path: pick a dir. Defaults to the current directory.\n";
  const context = "pick a dir";
  const answer =
    "pick a dir, or a single file. Defaults to the current directory.";
  assertEquals(
    trimTrailingOverlap(answer, content, context),
    "pick a dir, or a single file.",
  );
});

Deno.test("trimTrailingOverlap ignores short or word-cutting overlaps", () => {
  const content = "the cat sat on the mat\n";
  // overlap "at" is too short
  assertEquals(
    trimTrailingOverlap("the cat sat", content, "the cat"),
    "the cat sat",
  );
  // overlap would cut the word "mathematics" -> boundary check rejects it
  const answer = "the cat mathematics";
  const cut = trimTrailingOverlap(answer, "mathematics is fun\n", "the cat");
  assertEquals(cut, answer);
});

// --- diffPreview (T5) ---

Deno.test("diffPreview shows only the changed lines", () => {
  const before = ["a: 1", "b: 2", "c: 3"].join("\n");
  const after = ["a: 1", "b: 9", "c: 3"].join("\n");
  assertEquals(diffPreview(before, after), "- b: 2\n+ b: 9");
});

Deno.test("diffPreview reports no change", () => {
  assertEquals(diffPreview("same", "same"), "(no change)");
});

// --- sessionId ---

Deno.test("sessionId formats YYYYMMDD-HHMMSS from a local date", () => {
  assertEquals(sessionId(new Date(2025, 0, 5, 9, 7, 3)), "20250105-090703");
});

// --- runInterview ---

Deno.test("runInterview writes answers back and records the audit trail", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-e2e-" });
  try {
    writeFile(
      dir,
      "todo.md",
      "A todo has a name and a status, either active or completed.\n",
    );
    writeFile(
      dir,
      "clarifications.json",
      JSON.stringify([
        {
          severity: "HIGH",
          file: "todo.md",
          context: "either active or completed",
          question: "What are the allowed status values?",
          options: [
            "active, completed or archived",
            "active and completed only",
          ],
        },
        {
          severity: "CRITICAL",
          file: "todo.md",
          context: "a name",
          question: "Can a name be empty?",
        },
      ]),
    );

    const proposals = [
      "a non-empty name (required)",
      "the allowed status values are active, completed or archived",
    ];
    let proposalCall = 0;
    const logLines: string[] = [];

    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => proposals[proposalCall++],
      ask: async () => "1",
      log: (m) => logLines.push(m),
    });

    assertEquals(result.answered, 2);
    assertEquals(result.skipped, 0);
    assertEquals(result.filesTouched, ["todo.md"]);
    assertEquals(result.decisions.length, 2);
    assertEquals(result.decisions.map((d) => d.source), [
      "proposal",
      "proposal",
    ]);
    // CRITICAL is asked first (severity order), so proposal[0] hit "a name".
    assertEquals(result.decisions[0].severity, "CRITICAL");
    assertEquals(result.decisions[1].severity, "HIGH");

    const updated = Deno.readTextFileSync(join(dir, "todo.md"));
    assertStringIncludes(
      updated,
      "A todo has a non-empty name (required) and a status,",
    );
    assertStringIncludes(
      updated,
      "the allowed status values are active, completed or archived",
    );
    assertEquals(updated.includes("either active or completed"), false);

    // Audit trail: session JSONL + human-readable log.
    const auditDir = join(dir, ".verbo", "clarifications");
    const jsonlEntry = [...Deno.readDirSync(auditDir)].find(
      (e) => e.isFile && /^interview-.*\.jsonl$/.test(e.name),
    );
    if (!jsonlEntry) throw new Error("missing interview jsonl");
    assertMatch(jsonlEntry.name, /^interview-\d{8}-\d{6}\.jsonl$/);

    const jsonl = Deno.readTextFileSync(join(auditDir, jsonlEntry.name));
    const lines = jsonl.trim().split("\n");
    assertEquals(lines.length, 2);
    const parsed = lines.map((line) => JSON.parse(line));
    assertEquals(parsed[0].severity, "CRITICAL");
    assertEquals(parsed[0].answer, "a non-empty name (required)");
    assertEquals(parsed[1].source, "proposal");

    const markdown = Deno.readTextFileSync(join(auditDir, "interview-log.md"));
    assertStringIncludes(markdown, "## [CRITICAL] todo.md");
    assertStringIncludes(markdown, "## [HIGH] todo.md");
    assertStringIncludes(markdown, "Question: Can a name be empty?");
    assertStringIncludes(markdown, "Answer: a non-empty name (required)");
    assertStringIncludes(markdown, "Source: proposal");
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("runInterview with a scripted skip leaves the file untouched", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-skip-" });
  try {
    const original = "A todo has a name.\n";
    writeFile(dir, "todo.md", original);
    writeFile(
      dir,
      "clarifications.json",
      JSON.stringify([
        {
          severity: "MEDIUM",
          file: "todo.md",
          context: "a name",
          question: "What is a name?",
        },
      ]),
    );

    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => "proposed rewrite",
      ask: async () => "s",
      log: () => {},
    });

    assertEquals(result.answered, 0);
    assertEquals(result.skipped, 1);
    assertEquals(result.filesTouched, []);
    assertEquals(Deno.readTextFileSync(join(dir, "todo.md")), original);
    assertEquals(result.decisions.length, 1);
    assertEquals(result.decisions[0].source, "skipped");
    assertEquals(result.decisions[0].answer, null);

    const auditDir = join(dir, ".verbo", "clarifications");
    assertEquals(
      JSON.parse(readAuditFile(auditDir, /^interview-.*\.jsonl$/)).source,
      "skipped",
    );

    const markdown = Deno.readTextFileSync(join(auditDir, "interview-log.md"));
    assertStringIncludes(markdown, "## [MEDIUM] todo.md");
    assertStringIncludes(markdown, "Answer: skipped");
    assertStringIncludes(markdown, "Source: skipped");
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("runInterview accepts a numbered option and a custom answer", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-option-" });
  try {
    writeFile(dir, "todo.md", "The status is active or completed.\n");
    writeFile(dir, "user.md", "A user has an email.\n");
    writeFile(
      dir,
      "clarifications.json",
      JSON.stringify([
        {
          severity: "HIGH",
          file: "todo.md",
          context: "active or completed",
          question: "Allowed values?",
          options: ["active, completed or archived", "active only"],
        },
        {
          severity: "MEDIUM",
          file: "user.md",
          context: "an email",
          question: "Custom?",
          options: ["an option"],
        },
      ]),
    );

    const asks = ["2", "c", "custom text"];
    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => "proposal ignored",
      ask: async () => asks.shift() ?? "s",
      log: () => {},
    });

    assertEquals(result.answered, 2);
    assertEquals(result.skipped, 0);
    assertEquals(result.filesTouched, ["todo.md", "user.md"]);
    assertEquals(result.decisions.map((d) => d.source), ["option", "custom"]);
    assertEquals(result.decisions[0].answer, "active, completed or archived");
    assertEquals(result.decisions[1].answer, "custom text");

    assertStringIncludes(
      Deno.readTextFileSync(join(dir, "todo.md")),
      "The status is active, completed or archived.",
    );
    assertStringIncludes(
      Deno.readTextFileSync(join(dir, "user.md")),
      "A user has custom text.",
    );
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("runInterview records a skipped decision when the spec file is missing", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-missing-" });
  try {
    writeFile(
      dir,
      "clarifications.json",
      JSON.stringify([
        {
          severity: "CRITICAL",
          file: "models/gone.md",
          context: "x",
          question: "?",
        },
      ]),
    );

    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => "proposal",
      ask: async () => "1",
      log: () => {},
    });

    assertEquals(result.answered, 0);
    assertEquals(result.skipped, 1);
    assertEquals(result.filesTouched, []);
    assertEquals(result.decisions[0].source, "skipped");
    assertEquals(result.decisions[0].answer, "file not found");

    const auditDir = join(dir, ".verbo", "clarifications");
    assertEquals(
      JSON.parse(readAuditFile(auditDir, /^interview-.*\.jsonl$/)).answer,
      "file not found",
    );
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("severityAtLeast compares severities", () => {
  assertEquals(severityAtLeast("CRITICAL", "HIGH"), true);
  assertEquals(severityAtLeast("HIGH", "HIGH"), true);
  assertEquals(severityAtLeast("MEDIUM", "HIGH"), false);
  assertEquals(severityAtLeast("HIGH", "CRITICAL"), false);
});

Deno.test("runInterview warns and skips when the context is missing (T2)", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-noctx-" });
  try {
    writeFile(dir, "todo.md", "A todo has a name.\n");
    writeFile(
      dir,
      "clarifications.json",
      JSON.stringify([
        {
          severity: "HIGH",
          file: "todo.md",
          context: "this context does not exist",
          question: "What?",
        },
      ]),
    );
    const logLines: string[] = [];
    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => "a rewrite",
      ask: async () => "1",
      log: (m) => logLines.push(m),
    });

    assertEquals(result.answered, 0);
    assertEquals(result.skipped, 1);
    assertEquals(result.filesTouched, []);
    assertEquals(result.decisions[0].note, "context not found in file");
    // File left unchanged.
    assertEquals(
      Deno.readTextFileSync(join(dir, "todo.md")),
      "A todo has a name.\n",
    );
    assertStringIncludes(logLines.join("\n"), "context not found");
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("runInterview skips a question whose context was already rewritten (T4)", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-rectx-" });
  try {
    writeFile(dir, "todo.md", "-R lists subdirectories recursively.\n");
    writeFile(
      dir,
      "clarifications.json",
      JSON.stringify([
        {
          severity: "MEDIUM",
          file: "todo.md",
          context: "-R lists subdirectories recursively.",
          question: "First",
        },
        {
          severity: "MEDIUM",
          file: "todo.md",
          context: "-R lists subdirectories recursively.",
          question: "Second",
        },
      ]),
    );
    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => "proposed",
      ask: async () => "1",
      log: () => {},
    });

    assertEquals(result.answered, 1);
    assertEquals(result.skipped, 1);
    assertEquals(result.filesTouched, ["todo.md"]);
    assertEquals(
      result.decisions[1].note,
      "context already rewritten this session",
    );
    const content = Deno.readTextFileSync(join(dir, "todo.md"));
    // The second answer must NOT have chained into the first.
    assertEquals(content, "proposed\n");
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("runInterview skips questions below --min-severity (T7)", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-minsev-" });
  try {
    writeFile(dir, "todo.md", "A todo has a status, active or completed.\n");
    writeFile(
      dir,
      "clarifications.json",
      JSON.stringify([
        {
          severity: "CRITICAL",
          file: "todo.md",
          context: "a status",
          question: "Q1",
        },
        {
          severity: "MEDIUM",
          file: "todo.md",
          context: "active or completed",
          question: "Q2",
        },
      ]),
    );
    let proposals = 0;
    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => {
        proposals++;
        return "a status with allowed values";
      },
      ask: async () => "1",
      minSeverity: "HIGH",
      log: () => {},
    });

    assertEquals(proposals, 1); // MEDIUM question never proposed to the LLM
    assertEquals(result.answered, 1);
    assertEquals(result.skipped, 1);
    assertEquals(result.decisions[0].severity, "CRITICAL");
    assertEquals(result.decisions[1].note, "below --min-severity HIGH");
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("runInterview previews and can decline a write when interactive (T5)", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-preview-" });
  try {
    writeFile(dir, "todo.md", "A todo has a name.\n");
    writeFile(
      dir,
      "clarifications.json",
      JSON.stringify([
        {
          severity: "MEDIUM",
          file: "todo.md",
          context: "a name",
          question: "What?",
        },
      ]),
    );
    const asks = ["1", "n"]; // accept proposal, then decline the preview
    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => "a full name",
      ask: async () => asks.shift() ?? "s",
      interactive: true,
      log: () => {},
    });

    assertEquals(result.answered, 0);
    assertEquals(result.skipped, 1);
    assertEquals(result.decisions[0].note, "preview declined");
    assertEquals(
      Deno.readTextFileSync(join(dir, "todo.md")),
      "A todo has a name.\n",
    );
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("runInterview logs and returns zeros when clarifications.json is missing", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-noclar-" });
  try {
    const logLines: string[] = [];
    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => "proposal",
      ask: async () => "1",
      log: (m) => logLines.push(m),
    });
    assertEquals(result, {
      answered: 0,
      skipped: 0,
      filesTouched: [],
      decisions: [],
    });
    assertEquals(logLines, [
      "No clarifications found. Run `verbo clarify` first.",
    ]);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("runInterview treats an unparseable clarifications file as no clarifications", async () => {
  const dir = Deno.makeTempDirSync({ prefix: "verbo-interview-badclar-" });
  try {
    writeFile(dir, "clarifications.json", "this is not json");
    const logLines: string[] = [];
    const result = await runInterview({
      sourceDir: dir,
      aiProvider: async () => "proposal",
      ask: async () => "1",
      log: (m) => logLines.push(m),
    });
    assertEquals(result.answered, 0);
    assertEquals(result.skipped, 0);
    assertEquals(logLines, [
      "No clarifications found. Run `verbo clarify` first.",
    ]);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});
