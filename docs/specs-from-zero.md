# Specs From Zero — Viability Study & Implementation Plan

> **Status:** Proposal. This document studies whether Verbo can author a brand-new
> spec entirely through a conversational chat interface — the user explains what
> they want to build and never touches a `.md` file — and if so, how to build it.
> The authoritative design remains [`docs/DESIGN.md`](./DESIGN.md); this plan
> promotes DESIGN §14's deferred *"Interview spec-authoring agent"* into a
> concrete, scoped feature.

---

## 1. Verdict

**Viable — and unusually cheap to build.**

Conversational authoring (`verbo new`) is a **new front-end for the existing
loop**, not a new system. Verbo's loop is already *"prose in → validated,
progressively-more-precise prose out"*:

```
extract → generate types → deno check → clarify → interview (write-back) → repeat
```

A green-field chat only needs to produce the **first** prose. The moment seed
`.md` files exist, every existing command (`check`, `clarify`, `interview`) works
on them **unchanged**. So the chat interface has exactly three jobs:

1. **Elicit** requirements ("What are you building?" → follow-up questions).
2. **Draft** the seed `main.md` + `models/*.md` from the conversation.
3. **Hand off** to the existing loop (validate, then clarify/interview).

New code is small — roughly **400–600 lines**: an authoring engine, a defensive
JSON parser, one prompt template, one CLI command, tests, and a fixture. It
reuses the 5 AI providers, CLI flag parsing, the stdin `ask()` abstraction, the
write-back helpers (`diffPreview`, `preserveBulletPrefix`,
`trimTrailingOverlap`), the audit-trail machinery, the extract/generate/`deno
check` pipeline, and `clarify` as an independent "are we done?" gate.

---

## 2. Why it fits the architecture

- **"The `.md` file IS the output"** (DESIGN §3.4) — the chat writes prose into
  the same files the user would have written, only it writes them for the user.
  The end state is identical to a hand-written spec: plain Markdown, no special
  syntax, no new artifacts.
- **"Ambiguity as compile error"** (DESIGN §1) — authoring mode inherits the
  whole ambiguity-resolution loop. The chat *front-loads* some of those
  questions, and whatever it misses is caught by the existing
  `clarify`/`interview` pass at the end.
- **No codegen, no scaffolding** (DESIGN §4) — the feature produces prose, not
  code. It is fully consistent with the project's locked decisions. (The old
  codegen-era `docs/scaffolding_interview.md` is explicitly **not** revived.)
- **Stateless, functional style** (DESIGN §3.8) — every LLM call is
  self-contained given the transcript, matching the codebase's per-question,
  stateless interview design.

---

## 3. Design

### 3.1 Command

```
verbo new [--dir DIR] [-a PROVIDER] [-m MODEL] [-e ENVFILE]
          [--max-turns N] [--validate-lite]
```

- Refuses a non-empty target dir (an empty `--dir`, or `--force` to override) so
  a chat never clobbers an existing project.
- Reuses the existing `-d/-a/-m/-e` flag handling and provider adapters verbatim.

### 3.2 State

```ts
interface ChatTurn { role: "user" | "verbo"; text: string }

/** Current best draft — the files Verbo writes on the user's behalf. */
interface SpecCorpus {
  main: string;                        // main.md
  models: Record<string, string>;      // "student.md" → prose
}

interface AuthorState {
  transcript: ChatTurn[];              // keeps the LLM stateless across turns
  corpus: SpecCorpus;                  // merged after every draft
  lastValidation: string[];            // deno check errors from the previous draft, if any
}
```

### 3.3 The loop (one iteration per user message)

1. `ask()` — print Verbo's last question, read one line (reuse `defaultAsk` and
   the stdin line reader from `src/interview/engine.ts`).
2. Handle local commands: `/done`, `/models` (show current model list), `/quit`;
   anything else is treated as a chat reply.
3. Call the LLM with `src/prompts/author.md` + **transcript** + **current
   corpus** + **last validation errors**. The model returns a single fenced JSON
   envelope (same convention as extraction):

```json
{
  "message": "Got it — a Course has a subject and a room.",
  "next_question": "How many courses can a student take in a semester?",
  "question_options": ["Unlimited", "Up to 6", "No fixed limit — timetable-dependent"],
  "draft": {
    "main": "# Course System\n\nThis defines the data model ...",
    "models": {
      "student.md": "# Student\n\nStudents ...\n\nProperties:\n\n- name: ...\n",
      "course.md": "# Course\n\nCourses ...\n"
    },
    "validation": { "models": [ "/* extract-vocabulary envelope for the cheap type check */" ] }
  },
  "status": "in_progress"
}
```

4. Parse defensively with `parseAuthorResponse` (a mirror of
   `extractor.parseExtraction`); on garbage, log the raw response and retry once.
5. If `draft` is present: merge into `corpus`, **write the files to
   `sourceDir`** (`main.md`, `models/*.md`), and show a `diffPreview` of what
   changed. Writing incrementally means `verbo check` / `clarify` / `interview`
   can run on the work-in-progress at any moment — the spec grows exactly the way
   the README promises, but authored by chat.
6. Validate:
   - **During chat (cheap, `--validate-lite` default):** feed the model's own
     `draft.validation` envelope through `generateTypes` → `deno check` on a
     scratch file under `.verbo/scratch/`. No extra LLM call.
   - **At `done` (the real gate):** full `runCheck({ sourceDir, aiProvider })` —
     the true prose → extract → `deno check` round trip, i.e. the exact path an
     AI coding tool will take on the finished spec.
   - Any errors are stored in `lastValidation` and shown in the next prompt, so
     the model asks the user to resolve them ("your answers so far produce an
     inconsistent type graph: …").
7. Print `message` + `next_question` (with numbered options, the same menu
   family as the interview engine).
8. Loop until `status === "done"`, the user types `/done`, `--max-turns` is hit,
   or stdin EOF.


### 3.4 Finalization ("hand off")

- Run the full `runCheck` gate and print pass/fail.
- Run `clarify` once; print the remaining-ambiguity count + severity breakdown;
  suggest `verbo interview --recheck` to keep refining. This is where the
  green-field chat becomes the ordinary interview loop — the two modes are
  seamlessly chained.
- Audit trail under `.verbo/author/` (`author-YYYYMMDD-HHMMSS.jsonl` +
  `author-log.md`), mirroring the interview conventions so the user can review
  exactly how each phrase of the spec came to be.

### 3.5 Prompt design (`src/prompts/author.md`)

The prompt is the highest-leverage artifact. Key content:

- **Role:** expert requirements interviewer + spec writer for Verbo specs.
- **Write drafts in extraction-friendly prose** — the exact conventions the
  extractor already rewards (README "Writing specs", DESIGN §8): property
  bullets `- name: description`, explicit ranges ("9 to 12"), enums ("either
  active or completed"), relationship sentences ("A student can enroll in
  multiple classes"). This minimizes round-trip drift: the drafting model writes
  in the dialect the extraction model already parses reliably.
- **Vocabulary reference** from `src/extract/types.ts` (string/number/boolean/
  date/arrays/model refs; enum/range/minimum/maximum/positive/format/required/
  optional; relationship cardinalities) so the interview questions map cleanly
  onto what the pipeline can actually validate.
- **Rules:** one question at a time; prefer offering options; never invent
  models/properties not grounded in the user's answers; no code fences, backticks,
  or type annotations in the prose; one model per file.
- **Few-shot example transcript** styled after `test/classroom/`.
- **Output contract:** the JSON envelope above, wrapped in a code fence.

---

## 4. Viability risks & mitigations

| Risk | Mitigation |
|---|---|
| **Prose→structure round-trip drift** ("telephone game": prose written by the model may be re-extracted imprecisely) | Draft in extraction-friendly prose; full `runCheck` re-extraction gate at `done`; validation errors fed back into the next question. |
| **Hallucinated models/properties** | `diffPreview` after every draft; an explicit "here's what I have — anything missing?" step built into the loop; the user can always correct in plain chat. |
| **Endless interview / weak stopping criterion** | Model-classified `status`, user `/done`, `--max-turns` cap, and the post-run `clarify` gate as an independent check. |
| **Token/context limits on large specs** | Compact transcript (older turns summarized), corpus is already compact, incremental one-model-per-file drafting. |
| **Extra LLM cost** (a re-extract per turn) | Self-envelope type check during chat (no extra call); full re-extract only at `done`. |
| **Clobbering an existing project** | Empty-dir guard; `--force` overrides. |
| **Non-deterministic UX / untestable** | Injectable `ask` + `aiProvider` (same pattern as `runInterview`); pure, unit-tested envelope parser. |
| **Spec outlives the session** | Files written incrementally to the real source dir; nothing is trapped in chat memory. |

---

## 5. Implementation plan

### Phase A — Plumbing (small)

- [ ] **A1.** `src/author/types.ts` — `ChatTurn`, `SpecCorpus`, `AuthorResponse`
  (message / next_question / question_options / draft / status), `AuthorOptions`,
  `AuthorResult` (mirrors `InterviewResult`).
- [ ] **A2.** `src/author/validate.ts` — `validateEnvelope(spec)` writes a scratch
  `types.verbo.ts` from the model's own envelope and runs `deno check` (reuse the
  exported `runDenoCheck` from `src/check/pipeline.ts`). No new subprocess logic.

### Phase B — Prompt + parser

- [ ] **B1.** `src/prompts/author.md` — the elicitation prompt (see §3.5).
- [ ] **B2.** `src/author/parse.ts` — `parseAuthorResponse(text)` — defensive
  fence-stripping + normalization + defaults + throw on garbage (mirror of
  `extractor.parseExtraction`, so it is pure and unit-testable).

### Phase C — Engine + CLI

- [ ] **C1.** `src/author/engine.ts` — `runAuthor(options)` implementing the loop
  in §3.3; reuse `defaultAsk`, `diffPreview`, `sessionId`; audit trail under
  `.verbo/author/`; local commands `/done`, `/models`, `/quit`.
- [ ] **C2.** `main.ts` — add the `new` command + `printHelp` entry + empty-dir
  guard; `-d/-a/-m/-e/--max-turns/--validate-lite` flags.

### Phase D — Finalization + handoff

- [ ] **D1.** On done: full `runCheck`; print pass/fail with errors.
- [ ] **D2.** Run `clarify`; print remaining ambiguities + severity breakdown;
  hint `verbo interview --recheck`.
- [ ] **D3.** Docs: move *"Interview spec-authoring agent"* out of DESIGN §14
  Deferred into a new section pointing here; add a "Start from zero" section to
  `README.md` (Getting Started); update `docs/roadmap.md` / `docs/tasks.md`.

### Phase E — Tests + fixture

- [ ] **E1.** `src/author/parse_test.ts` — envelope parsing edge cases (mirror
  `src/extract/extractor_test.ts`).
- [ ] **E2.** `src/author/engine_test.ts` — mock AI + scripted `ask`; assert: no
  files written before `done`, drafts merged in order, diffs logged, `/done`
  stops the loop, garbage JSON is retried once, audit trail is written.
- [ ] **E3.** Fixture `test/author/` — a canned transcript + canned envelopes
  that produce a corpus passing `deno check`; a smoke test wiring the loop to the
  pipeline (mirror `test/ls` + `src/check/pipeline_ls_test.ts`).

---

## 6. Gates

- **G1** — `deno test` green (new + existing suites).
- **G2** — `deno check main.ts src/author/*.ts` green.
- **G3** — End-to-end with a real provider (e.g.
  `verbo new --dir /tmp/spec -a deepseek -m deepseek-v4-flash`): produces plain
  `.md`; `verbo check` passes; `verbo clarify` leaves few/no CRITICAL/HIGH
  questions; `verbo interview --recheck` converges.
- **G4** — The output spec is ordinary `.md` with no new syntax and no new
  artifact types; all existing commands consume it unchanged.

---

## 7. Out of scope / deferred

- Scaffolding, templates, or code generation (DESIGN §4 explicitly rejects).
- Web UI or anything non-terminal.
- Session save/resume — the `.verbo/author/` JSONL audit makes this a cheap,
  later addition.
- `routes.md` / `workflows.md` authoring — extraction is currently models-only;
  add chat support when `verbo check` supports more file kinds.




