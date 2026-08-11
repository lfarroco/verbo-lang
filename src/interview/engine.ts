import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { TextLineStream } from "https://deno.land/std@0.224.0/streams/text_line_stream.ts";

import {
  type ClarificationQuestion,
  type Severity,
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

/**
 * Replace the FIRST occurrence of `context` in `content` with `answer`.
 * Returns the original content unchanged when `context` is not found.
 */
export function applyAnswer(
  content: string,
  context: string,
  answer: string,
): string {
  const index = content.indexOf(context);
  if (index === -1) return content;
  return content.slice(0, index) + answer +
    content.slice(index + context.length);
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

/** Default `ask`: print the message and read one line from stdin. */
async function defaultAsk(message: string): Promise<string> {
  const writer = Deno.stdout.writable.getWriter();
  try {
    await writer.write(new TextEncoder().encode(message));
  } finally {
    writer.releaseLock();
  }

  const reader = Deno.stdin.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .getReader();
  try {
    const { value } = await reader.read();
    if (value === undefined) return "s"; // EOF → skip
    return value;
  } catch {
    return "s";
  } finally {
    reader.releaseLock();
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
  Deno.writeTextFileSync(
    join(auditDir, "interview-log.md"),
    [
      `## [${decision.severity}] ${decision.file}`,
      `Question: ${decision.question}`,
      `Answer: ${answerText}`,
      `Source: ${decision.source}`,
      "",
    ].join("\n") + "\n",
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

    if (source !== "skipped" && answer !== null) {
      Deno.writeTextFileSync(filePath, applyAnswer(content, q.context, answer));
      if (!filesTouched.includes(q.file)) filesTouched.push(q.file);
    }
  }

  const answered = decisions.filter((d) => d.source !== "skipped").length;
  return {
    answered,
    skipped: decisions.length - answered,
    filesTouched,
    decisions,
  };
}
