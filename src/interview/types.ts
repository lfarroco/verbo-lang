/**
 * Interactive interview types — severity ordering for `clarifications.json`
 * questions, per docs/DESIGN.md §9.2.
 */

/** Severity of a clarification question, from most to least blocking. */
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM";

/**
 * A single ambiguity flagged by `verbo clarify` (one element of
 * `clarifications.json`).
 *
 * `context` is the exact passage in `file` that is ambiguous — it must appear
 * verbatim in the file so the interview can write answers back in place.
 */
export interface ClarificationQuestion {
  severity: Severity;
  file: string;
  context: string;
  question: string;
  options?: string[];
}

/** Interview order: CRITICAL (0) first, then HIGH (1), then MEDIUM (2). */
export const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
};

/**
 * Stable sort by severity — questions of equal severity keep their original
 * order (DESIGN §9.2).
 */
export function sortBySeverity(
  qs: ClarificationQuestion[],
): ClarificationQuestion[] {
  return qs
    .map((question, index) => ({ question, index }))
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.question.severity] -
          SEVERITY_ORDER[b.question.severity] ||
        a.index - b.index,
    )
    .map(({ question }) => question);
}
