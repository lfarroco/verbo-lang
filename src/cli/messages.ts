// src/cli/messages.ts — pure CLI message formatting and severity parsing.
// Kept free of I/O so the exact wording is unit-testable (T12).
import type { ClarificationQuestion, Severity } from "../interview/types.ts";

/** "1 ambiguity remains — run `verbo interview` again." or
 * "N ambiguities remain — run `verbo interview` again." */
export function formatRemainingMessage(count: number): string {
  if (count === 1) {
    return "1 ambiguity remains — run `verbo interview` again.";
  }
  return `${count} ambiguities remain — run \`verbo interview\` again.`;
}

/** "Ambiguities: 12 → 9 (3 fewer)." — the `--recheck` convergence report. */
export function formatRecheckReport(previous: number, current: number): string {
  const delta = current - previous;
  const deltaText = delta === 0
    ? "no change"
    : delta > 0
    ? `+${delta} new`
    : `${-delta} fewer`;
  return `Ambiguities: ${previous} → ${current} (${deltaText}).`;
}

/** "3 HIGH, 7 MEDIUM" / "none" — severity breakdown of remaining questions. */
export function formatSeverityBreakdown(
  questions: ClarificationQuestion[],
): string {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
  };
  for (const q of questions) counts[q.severity]++;
  const parts = (["CRITICAL", "HIGH", "MEDIUM"] as Severity[])
    .filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${s}`);
  return parts.length === 0 ? "none" : parts.join(", ");
}

/** Parse a `--min-severity` / `--fail-on` value, or null when absent/invalid. */
export function parseSeverity(value: string | undefined): Severity | null {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (
    normalized === "CRITICAL" || normalized === "HIGH" ||
    normalized === "MEDIUM"
  ) {
    return normalized;
  }
  return null;
}

/** Normalize a context excerpt for question-lineage comparison (T6):
 * lowercase, collapse whitespace, trim. */
export function normalizeContext(context: string): string {
  return context.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Split questions into those repeating a previously resolved context vs new
 * ones (T6). */
export function countNewVsRepeat(
  questions: ClarificationQuestion[],
  previousContexts: Set<string>,
): { newCount: number; repeatCount: number } {
  let repeatCount = 0;
  for (const q of questions) {
    if (previousContexts.has(normalizeContext(q.context))) repeatCount++;
  }
  return { newCount: questions.length - repeatCount, repeatCount };
}
