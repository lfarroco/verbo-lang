import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { TextLineStream } from "https://deno.land/std@0.224.0/streams/text_line_stream.ts";

import {
  type ClarificationQuestion,
  type Severity,
  severityAtLeast,
  sortBySeverity,
} from "./types.ts";

export type AiProvider = (prompt: string) => Promise<string>;

export interface InterviewOptions {
  sourceDir: string;
  aiProvider: AiProvider;
  /** Defaults to "clarifications.json". */
  clarificationsFile?: string;
  /** Prompts the user and returns one line of input. Defaults to stdin. */
  ask?: (message: string) => Promise<string>;
  /** Defaults to console.log. */
  log?: (message: string) => void;
  /** (T7) Skip questions below this severity, recording them as skipped. */
  minSeverity?: Severity;
  /** (T5) Show a diff preview and confirm before writing. Defaults to
   * `Deno.stdin.isTerminal()` — piped/scripted runs stay non-interactive. */
  interactive?: boolean;
}

export interface InterviewDecision {
  timestamp: string;
  severity: Severity;
  file: string;
  context: string;
  question: string;
  /** The resolved rewrite; null when the question was skipped. */
  answer: string | null;
  source: "proposal" | "option" | "custom" | "skipped";
  /** (T2/T4) Optional reason, e.g. "context not found" / "already rewritten". */
  note?: string;
}

export interface InterviewResult {
  answered: number;
  skipped: number;
  filesTouched: string[];
  decisions: InterviewDecision[];
}

const PROMPT_TEMPLATE_REL = "../prompts/interview.md";
const AUDIT_SUBDIR = ".verbo/clarifications";

const SEVERITIES: readonly Severity[] = ["CRITICAL", "HIGH", "MEDIUM"];

// --- Session / time helpers ---

/** `YYYYMMDD-HHMMSS` session id for the audit trail, from a local date. */
export function sessionId(date: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return [
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
  ].join("-");
}

// --- Parsing clarifications.json ---

/** Pull the JSON array out of an LLM response: first code fence, else raw. */
function extractJsonArray(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) {
    throw new Error(
      `Clarifications JSON array not found. Raw response:\n${text}`,
    );
  }
  return text.slice(start, end + 1).trim();
}

function normalizeQuestion(item: unknown): ClarificationQuestion | null {
  if (!item || typeof item !== "object") return null;
  const q = item as Record<string, unknown>;
  if (
    typeof q.severity !== "string" ||
    !(SEVERITIES as readonly string[]).includes(q.severity)
  ) {
    return null;
  }
  if (typeof q.file !== "string" || q.file.trim() === "") return null;
  if (typeof q.context !== "string" || q.context.trim() === "") return null;
  if (typeof q.question !== "string" || q.question.trim() === "") return null;

  // `options` is optional; default to [] and keep only string entries.
  const options = Array.isArray(q.options)
    ? q.options.filter((o): o is string => typeof o === "string")
    : [];

  return {
    severity: q.severity as Severity,
    file: q.file.trim(),
    // `context` is an exact excerpt — keep it verbatim so `applyAnswer` can
    // find it in the spec file.
    context: q.context,
    question: q.question,
    options,
  };
}

/**
 * Defensively parse a `clarifications.json` payload (plain or fenced JSON
 * array), dropping entries missing severity/file/context/question and
 * defaulting missing `options` to []. Throws when no JSON array can be
 * extracted or parsed.
 */
export function parseClarifications(text: string): ClarificationQuestion[] {
  const jsonText = extractJsonArray(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Clarifications JSON could not be parsed: ${message}\nRaw response:\n${text}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `Clarifications JSON must be an array. Got: ${JSON.stringify(parsed)}`,
    );
  }

  const questions: ClarificationQuestion[] = [];
  for (const item of parsed) {
    const question = normalizeQuestion(item);
    if (question) questions.push(question);
  }
  return questions;
}

// --- Applying answers ---

export interface ApplyAnswerResult {
  content: string;
  /** False when `context` was not found and the content is unchanged. */
  applied: boolean;
  /** Index of the matched `context`, or -1 when not found. */
  index: number;
}

/**
 * Replace the FIRST occurrence of `context` in `content` with `answer`.
 * Reports `applied: false` (content unchanged) when `context` is missing so
 * callers can warn instead of silently dropping the answer.
 */
export function applyAnswer(
  content: string,
  context: string,
  answer: string,
): ApplyAnswerResult {
  const index = content.indexOf(context);
  if (index === -1) return { content, applied: false, index: -1 };
  return {
    content: content.slice(0, index) + answer +
      content.slice(index + context.length),
    applied: true,
    index,
  };
}

/**
 * (T1) When `context` is a property bullet (`- size: The size...`) or a bare
 * `name:` property and `answer` dropped the property name, re-add the prefix so
 * a custom answer cannot clobber the property list structure.
 */
export function preserveBulletPrefix(context: string, answer: string): string {
  const match = context.match(/^([-*]\s+)?([A-Za-z_$][\w]*)(\s*:)/);
  if (!match) return answer;
  const propertyName = match[2];
  // Already starts with the property name (`size: ...` or `- size: ...`).
  if (
    new RegExp(`^[-*]?\\s*${escapeRegExp(propertyName)}\\s*:`).test(answer)
  ) {
    return answer;
  }
  const prefix = `${match[1] ?? ""}${propertyName}${match[3]}`;
  return `${prefix} ${answer.trimStart()}`;
}

/**
 * (T3) If the answer ends with text that already follows the `context` in the
 * file, trim that trailing overlap so naive replacement doesn't duplicate a
 * phrase (observed: "...Defaults to the current directory." twice). Minimum
 * overlap length and a word-boundary check avoid cutting words.
 */
export function trimTrailingOverlap(
  answer: string,
  content: string,
  context: string,
): string {
  const index = content.indexOf(context);
  if (index === -1) return answer;
  const suffix = content.slice(index + context.length);
  const overlap = trailingOverlap(answer, suffix);
  if (overlap.length < 8) return answer;

  const beforeOverlap = answer.length === overlap.length
    ? ""
    : answer[answer.length - overlap.length - 1] ?? "";
  const boundaryIsClean = answer.length === overlap.length ||
    !/[A-Za-z0-9]/.test(beforeOverlap);
  if (!boundaryIsClean) return answer;

  return answer.slice(0, answer.length - overlap.length).replace(/\s+$/, "");
}

/** Longest suffix of `a` that is a prefix of `b`, skipping leading
 * non-alphanumeric separators in `b`. */
export function trailingOverlap(a: string, b: string): string {
  const bTrimmed = b.replace(/^[^A-Za-z0-9]+/, "");
  let best = "";
  for (let i = 1; i <= Math.min(a.length, bTrimmed.length); i++) {
    const candidate = bTrimmed.slice(0, i);
    if (a.endsWith(candidate)) best = candidate;
  }
  return best;
}

/**
 * (T5) Minimal line diff for a before/after pair — prints only the lines that
 * changed, as `- old` / `+ new`. Used for the write-back preview.
 */
export function diffPreview(before: string, after: string): string {
  const a = before.split("\n");
  const b = after.split("\n");
  let start = 0;
  while (
    start < a.length && start < b.length && a[start] === b[start]
  ) {
    start++;
  }
  let endA = a.length - 1;
  let endB = b.length - 1;
  while (
    endA >= start && endB >= start && a[endA] === b[endB]
  ) {
    endA--;
    endB--;
  }
  const lines: string[] = [];
  for (let i = start; i <= endA; i++) lines.push(`- ${a[i]}`);
  for (let i = start; i <= endB; i++) lines.push(`+ ${b[i]}`);
  return lines.length === 0 ? "(no change)" : lines.join("\n");
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- Prompt assembly & menu rendering (pure) ---

function buildProposalPrompt(
  template: string,
  content: string,
  q: ClarificationQuestion,
): string {
  return [
    template,
    "",
    "== SPEC FILE ==",
    content,
    "",
    "== QUESTION ==",
    q.question,
    "",
    `Context: ${q.context}`,
  ].join("\n");
}

function renderMenu(q: ClarificationQuestion, proposal: string): string {
  const lines = [
    `[${q.severity}] In ${q.file}:`,
    `❓ ${q.question}`,
    `Context: ${q.context}`,
    `Proposed rewrite: ${proposal}`,
    "1) Accept proposal",
  ];
  for (let i = 0; i < (q.options ?? []).length; i++) {
    lines.push(`${i + 2}) ${(q.options ?? [])[i]}`);
  }
  lines.push("c) Custom answer", "s) Skip", "> ");
  return lines.join("\n");
}

/** True when `input` is an option number (2..count+1, never "1"). */
function isOptionNumber(input: string, count: number): boolean {
  const n = Number(input);
  return Number.isInteger(n) && n >= 2 && n <= count + 1;
}

// --- Default interactive pieces ---

// `Deno.stdin.readable` can only be piped once — build the line reader lazily
// and reuse it across questions so piped answers (e.g. `printf '1\n1\n...' |`)
// are consumed one line at a time instead of EOF-ing after the first question.
let stdinReader: ReadableStreamDefaultReader<string> | null = null;

function getStdinLineReader(): ReadableStreamDefaultReader<string> {
  if (stdinReader === null) {
    stdinReader = Deno.stdin.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .getReader();
  }
  return stdinReader;
}

/** Default `ask`: print the message and read one line from stdin. */
async function defaultAsk(message: string): Promise<string> {
  const writer = Deno.stdout.writable.getWriter();
  try {
    await writer.write(new TextEncoder().encode(message));
  } finally {
    writer.releaseLock();
  }

  try {
    const { value } = await getStdinLineReader().read();
    if (value === undefined) return "s"; // EOF → skip
    return value;
  } catch {
    return "s";
  }
}

function emptyResult(): InterviewResult {
  return { answered: 0, skipped: 0, filesTouched: [], decisions: [] };
}

function fileExists(path: string): boolean {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
  }
}

/** Append one decision to the session JSONL and the human-readable log. */
function appendDecision(
  auditDir: string,
  session: string,
  decision: InterviewDecision,
): void {
  Deno.writeTextFileSync(
    join(auditDir, `interview-${session}.jsonl`),
    `${JSON.stringify(decision)}\n`,
    { append: true },
  );

  const answerText = decision.answer ?? "skipped";
  const logLines = [
    `## [${decision.severity}] ${decision.file}`,
    `Question: ${decision.question}`,
    `Answer: ${answerText}`,
    `Source: ${decision.source}`,
  ];
  if (decision.note) logLines.push(`Note: ${decision.note}`);
  logLines.push("");
  Deno.writeTextFileSync(
    join(auditDir, "interview-log.md"),
    logLines.join("\n") + "\n",
    { append: true },
  );
}

/**
 * The `verbo interview` core (DESIGN §9.2): read `clarifications.json`,
 * resolve each ambiguity (severity-ordered) through the user, write answers
 * back into the .md files in place, and record an audit trail under
 * `<sourceDir>/.verbo/clarifications/`.
 */
export async function runInterview(
  options: InterviewOptions,
): Promise<InterviewResult> {
  const {
    sourceDir,
    aiProvider,
    clarificationsFile = "clarifications.json",
    ask = defaultAsk,
    log = console.log,
    minSeverity,
    interactive,
  } = options;

  const clarificationsPath = join(sourceDir, clarificationsFile);

  let raw: string;
  try {
    raw = Deno.readTextFileSync(clarificationsPath);
  } catch {
    log("No clarifications found. Run `verbo clarify` first.");
    return emptyResult();
  }

  let questions: ClarificationQuestion[];
  try {
    questions = sortBySeverity(parseClarifications(raw));
  } catch {
    log("No clarifications found. Run `verbo clarify` first.");
    return emptyResult();
  }

  const moduleDir = dirname(fromFileUrl(import.meta.url));
  const promptTemplate = await Deno.readTextFile(
    join(moduleDir, PROMPT_TEMPLATE_REL),
  );

  const session = sessionId();
  const auditDir = join(sourceDir, AUDIT_SUBDIR);
  Deno.mkdirSync(auditDir, { recursive: true });

  const decisions: InterviewDecision[] = [];
  const filesTouched: string[] = [];
  // (T4) Contexts already rewritten this session, per file — stops a later
  // question from re-targeting a passage inside a previous answer.
  const consumedContexts = new Map<string, Set<string>>();
  const interactiveMode = interactive ?? Deno.stdin.isTerminal();

  const recordSkipped = (q: ClarificationQuestion, note: string): void => {
    const decision: InterviewDecision = {
      timestamp: new Date().toISOString(),
      severity: q.severity,
      file: q.file,
      context: q.context,
      question: q.question,
      answer: null,
      source: "skipped",
      note,
    };
    decisions.push(decision);
    appendDecision(auditDir, session, decision);
  };

  for (const q of questions) {
    const filePath = join(sourceDir, q.file);

    if (!fileExists(filePath)) {
      const decision: InterviewDecision = {
        timestamp: new Date().toISOString(),
        severity: q.severity,
        file: q.file,
        context: q.context,
        question: q.question,
        answer: "file not found",
        source: "skipped",
      };
      decisions.push(decision);
      appendDecision(auditDir, session, decision);
      continue;
    }

    // (T7) Severity gate: questions below `--min-severity` are recorded as
    // skipped and leave the file untouched.
    if (minSeverity && !severityAtLeast(q.severity, minSeverity)) {
      recordSkipped(q, `below --min-severity ${minSeverity}`);
      continue;
    }

    // (T4) Same-context chaining guard.
    if (consumedContexts.get(q.file)?.has(q.context)) {
      log(
        `⚠️ [${q.severity}] ${q.file}: this passage was already rewritten by an earlier answer this session — skipping.`,
      );
      recordSkipped(q, "context already rewritten this session");
      continue;
    }

    const content = Deno.readTextFileSync(filePath);
    const proposal =
      (await aiProvider(buildProposalPrompt(promptTemplate, content, q)))
        .trim();
    const input = (await ask(renderMenu(q, proposal))).trim();

    let answer: string | null;
    let source: InterviewDecision["source"];

    if (input === "1") {
      answer = proposal;
      source = "proposal";
    } else if (isOptionNumber(input, (q.options ?? []).length)) {
      answer = (q.options ?? [])[Number(input) - 2];
      source = "option";
    } else if (input === "c") {
      const custom = (await ask("Custom answer: ")).trim();
      if (custom === "") {
        answer = null;
        source = "skipped";
      } else {
        answer = custom;
        source = "custom";
      }
    } else {
      // "s", empty input, or anything unrecognized → skip.
      answer = null;
      source = "skipped";
    }

    if (answer === null) {
      const decision: InterviewDecision = {
        timestamp: new Date().toISOString(),
        severity: q.severity,
        file: q.file,
        context: q.context,
        question: q.question,
        answer: null,
        source,
      };
      decisions.push(decision);
      appendDecision(auditDir, session, decision);
      continue;
    }

    // (T1) Keep the `name:` prefix on property bullets.
    answer = preserveBulletPrefix(q.context, answer);
    // (T3) Don't duplicate a phrase that already follows the context.
    answer = trimTrailingOverlap(answer, content, q.context);

    const result = applyAnswer(content, q.context, answer);

    // (T2) Context drifted from the file → warn instead of silently no-op.
    if (!result.applied) {
      log(
        `⚠️ [${q.severity}] ${q.file}: could not apply answer — context not found in file. File left unchanged.`,
      );
      recordSkipped(q, "context not found in file");
      continue;
    }

    // (T5) Preview + confirm when run interactively.
    if (interactiveMode) {
      const preview = diffPreview(content, result.content);
      const confirm = (await ask(
        `\nChange to ${q.file}:\n${preview}\nApply? [y/N] `,
      )).trim().toLowerCase();
      if (confirm !== "y" && confirm !== "yes") {
        recordSkipped(q, "preview declined");
        continue;
      }
    }

    Deno.writeTextFileSync(filePath, result.content);
    if (!filesTouched.includes(q.file)) filesTouched.push(q.file);
    let consumed = consumedContexts.get(q.file);
    if (!consumed) {
      consumed = new Set();
      consumedContexts.set(q.file, consumed);
    }
    consumed.add(q.context);

    const decision: InterviewDecision = {
      timestamp: new Date().toISOString(),
      severity: q.severity,
      file: q.file,
      context: q.context,
      question: q.question,
      answer,
      source,
    };
    decisions.push(decision);
    appendDecision(auditDir, session, decision);
  }

  const answered = decisions.filter((d) => d.source !== "skipped").length;
  return {
    answered,
    skipped: decisions.length - answered,
    filesTouched,
    decisions,
  };
}
