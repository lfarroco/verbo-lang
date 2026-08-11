// src/cli/messages_test.ts — pins the exact CLI message wording (T12/T8).
import { assertEquals } from "@std/assert";
import {
  countNewVsRepeat,
  formatRecheckReport,
  formatRemainingMessage,
  formatSeverityBreakdown,
  normalizeContext,
  parseSeverity,
} from "./messages.ts";
import type { ClarificationQuestion } from "../interview/types.ts";

Deno.test("formatRemainingMessage pluralizes and fixes singular verb", () => {
  assertEquals(
    formatRemainingMessage(0),
    "0 ambiguities remain — run `verbo interview` again.",
  );
  assertEquals(
    formatRemainingMessage(1),
    "1 ambiguity remains — run `verbo interview` again.",
  );
  assertEquals(
    formatRemainingMessage(9),
    "9 ambiguities remain — run `verbo interview` again.",
  );
});

Deno.test("formatRecheckReport shows the delta", () => {
  assertEquals(formatRecheckReport(15, 9), "Ambiguities: 15 → 9 (6 fewer).");
  assertEquals(formatRecheckReport(9, 9), "Ambiguities: 9 → 9 (no change).");
  assertEquals(formatRecheckReport(9, 10), "Ambiguities: 9 → 10 (+1 new).");
});

Deno.test("formatSeverityBreakdown counts by severity", () => {
  const qs = (severities: string[]) =>
    severities.map((severity) => ({
      severity,
      file: "x",
      context: "c",
      question: "q",
      options: [],
    })) as ClarificationQuestion[];
  assertEquals(formatSeverityBreakdown(qs([])), "none");
  assertEquals(
    formatSeverityBreakdown(qs(["CRITICAL", "HIGH", "HIGH"])),
    "1 CRITICAL, 2 HIGH",
  );
});

Deno.test("parseSeverity accepts and rejects values", () => {
  assertEquals(parseSeverity(undefined), null);
  assertEquals(parseSeverity("high"), "HIGH");
  assertEquals(parseSeverity("MEDIUM"), "MEDIUM");
  assertEquals(parseSeverity("bogus"), null);
});

Deno.test("countNewVsRepeat and normalizeContext", () => {
  const previous = new Set([
    normalizeContext("-R lists subdirectories recursively."),
  ]);
  const questions = [
    {
      severity: "HIGH",
      file: "main.md",
      context: "-R lists  subdirectories\nrecursively.",
      question: "q",
    },
    {
      severity: "HIGH",
      file: "main.md",
      context: "-a includes hidden entries",
      question: "q",
    },
  ] as ClarificationQuestion[];
  const result = countNewVsRepeat(questions, previous);
  assertEquals(result, { newCount: 1, repeatCount: 1 });
  assertEquals(normalizeContext("  A   B\nC "), "a b c");
});
