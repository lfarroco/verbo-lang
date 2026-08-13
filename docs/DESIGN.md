# Verbo Design — Specification Engineering Reference

> **Status:** This document is the authoritative reference for Verbo's architecture. Verbo has pivoted away from code generation and toward **specification engineering**: writing specifications in natural language, using LLMs to extract structured type definitions, validating them with `deno check` and generated assertions, and resolving ambiguity through AI-assisted interviews.

## 1. Vision

Verbo is a **specification engineering tool**. You describe data models in loose natural language. Verbo interviews you to resolve ambiguity, and each answer is written back into your `.md` files — making them progressively more precise. After a few rounds, the same file that you wrote and reviewed is also precise enough for an AI coding tool (Claude Code, Cursor, Copilot) to consume and generate code from. Verbo doesn't generate code; it sharpens the spec that another AI reads.

The three core ideas:

| Idea | Verdict | Notes |
|---|---|---|
| "Natural language as specification" | **Holds strongly** | The durable insight is that prose IS the spec. The LLM extracts structure; verification catches mistakes. The user never writes syntax. |
| "Structured vibe coding" | **Reframed** | The pipeline discipline (extract → validate → clarify → interview) is the right architecture, but the LLM does the extraction, not a parser. Natural language is the input; validated types are the output. |
| "Ambiguity as compile error" | **Holds strongly** | This is Verbo's differentiator. An AI clarify pass finds vague language and contradictions; an interactive interview resolves them with write-back into the source files. |

## 2. Naming

Verbo is a **specification system** — not a programming language, not a code generator. The interview loop progressively refines your `.md` files in place. The end result is the same file you wrote — now unambiguous enough for AI coding tools (Claude Code, Cursor, Copilot) to consume. Code generation is handled by those tools; Verbo's job is to make sure the spec they read is unambiguous and complete.

Primary descriptor: *"specification engineering for AI consumers."* The project name stays **verbo**.

## 3. Locked decisions

1. **Specification-only. No code generation.** Verbo validates specifications; it does not generate application code, API handlers, database schemas, or server scaffolding.
2. **Natural language is the single source of truth.** Specs are plain `.md` files with no required syntax. Users write prose. The LLM extracts structure. If the user must write rigid syntax, Verbo has failed.
3. **LLM as the extractor.** Structure (types, constraints, cross-model references) is extracted from natural language by an LLM with a repair loop. There is no deterministic parser.
4. **The `.md` file IS the output.** Clarification answers are written back into the same file. The end state is a precise, unambiguous spec — both human-readable documentation and AI-consumable specification. No separate output artifact.
5. **TypeScript types as internal verification.** `types.verbo.ts` and `.verbo/validate.ts` are generated internally to validate the extraction. They prove correctness; they are not the product.
6. **Extraction has a repair loop.** If `deno check` fails on generated types, the errors are fed back to the LLM for a corrected extraction (max 3 retries).
7. **Clarification is interactive and write-back.** An LLM-powered clarify pass finds ambiguities. An interactive interview resolves them and writes answers back into the `.md` files, with an audit trail under `.verbo/clarifications/`.
8. **Implementation: Deno + TypeScript, functional style, no fp-ts/Effect.**

## 4. Why not: what we explicitly reject

- **Code generation.** Compiling specs into application code is a separate domain. The AI code-generation market is saturated.
- **A custom JSON manifest/IR.** Prior versions used a hand-maintained manifest schema. Dropped in favor of TypeScript types checked by `deno check`.
- **Flavored Markdown as input.** If the user must write `` `name`: string (required) `` they might as well write TypeScript. Verbo's input is loose natural language. The LLM handles interpretation; verification catches mistakes.
- **Separate output artifacts.** The `.md` file the user writes is the only artifact. The interview edits it in place. No separate "output" format is generated — the file just becomes more precise.
- **Deterministic parser for natural language.** Natural language is too varied for a hand-written parser. The LLM is the parser. Verification (deno check + assertions) is the safety net.
- **Fully deterministic output.** LLM extraction is stochastic. The repair loop and verification contain the non-determinism: extraction fails loudly rather than silently.

## 5. Natural language as input

Verbo specs are plain `.md` files. No directives, no required syntax, no annotations. Users describe their models the way they'd explain them to a teammate:

```markdown
# Student

Students are enrolled in the school and can take multiple classes.

Properties:

- name: The full name of the student.
- email: The student's school email address (must be valid).
- gradeLevel: The student's grade level (9 to 12).
- enrollmentDate: The date the student enrolled.
- classes: The classes the student is enrolled in.
```

This is plain prose. No syntax was added. The LLM extracts structure from it.

### 5.1 What the LLM extracts

From the prose above, the extraction LLM produces structured data:

```json
{
  "name": "Student",
  "properties": [
    { "name": "name", "type": "string", "constraints": [{ "kind": "required" }] },
    { "name": "email", "type": "string", "constraints": [{ "kind": "format", "value": "email" }] },
    { "name": "gradeLevel", "type": "number", "constraints": [{ "kind": "range", "min": 9, "max": 12 }] },
    { "name": "enrollmentDate", "type": "date" },
    { "name": "classes", "type": "Class[]" }
  ]
}
```

A reference to another model is a regular property — a single one (`"teacher":
"Teacher"`) or a list (`"classes": "Class[]"`). There is no separate
relationship construct. List names use a natural plural (`students`, `classes`)
or the deterministic `<Model>_many` form (`syllabus_many`) when no plural reads
well — never a mechanical "append s/es" rule.

### 5.2 Conventions that help the LLM

While there is no required syntax, some conventions improve extraction quality:

- **One model per file** — helps the LLM know where one model ends and another begins.
- **Property lists** — bullet points or numbered lists with `name: description` patterns.
- **Explicit ranges and constraints** — "9 to 12" is clearer than "a high school student." "Must be valid" hints at format constraints.
- **Cross-model references** — describe how one model connects to others as a property that references them: a single one (`- teacher: The teacher who teaches the class.`) or a list (`- classes: The classes the student is enrolled in.`).
- **A `main.md`** — gives the LLM project-level context.

These are conventions, not rules. The LLM handles variation; the clarify system catches what it can't.

## 6. LLM extraction with repair loop

Extraction is a single LLM call (with retries) that takes the full spec corpus and outputs structured model data. No deterministic parser — the LLM handles the messiness of natural language.

### 6.1 Extraction prompt

The prompt (`src/prompts/extract.md`) instructs the LLM to extract:
- Model names and source locations
- Properties with names, types, and constraints
- Cross-model references — properties whose type is another model, single or `[]`
- Cross-file references

The prompt includes few-shot examples from the classroom and todo fixtures.

### 6.2 Repair loop

1. LLM extracts structured data from the spec corpus.
2. The type generator produces `types.verbo.ts`.
3. `deno check` runs on the generated types.
4. If `deno check` fails, the errors are fed back to the LLM:
   ```
   Your previous extraction produced types that fail type-checking:
   - Cannot find name 'Class'. Did you forget to extract models/class.md?
   Please re-extract and fix these errors.
   ```
5. Retry up to 3 times. If all attempts fail, report the errors to the user.

### 6.3 What the repair loop catches

- **Missed models** — the LLM skipped a file (e.g., `models/class.md` wasn't processed, causing "Cannot find name 'Class'").
- **Wrong types** — the LLM inferred `string` for `gradeLevel` when the prose says "9 to 12."
- **Missing references** — a property names another model but that model wasn't extracted.
- **Inconsistent naming** — "Student" in one file, "student" in another.

The repair loop is what makes LLM-based extraction reliable: verification provides a hard signal, and the LLM corrects itself.

## 7. Type generation

The type generator (`src/generator/types.ts`) produces `types.verbo.ts` from the extracted structure.

### 7.1 Generated output

```typescript
// Generated by Verbo — do not edit directly.
// Source: models/student.md, models/teacher.md, models/class.md

export type Student = {
  name: string;
  email: string;
  gradeLevel: number;
  enrollmentDate: Date;
  classes: Class[];
};

export type Teacher = {
  name: string;
  email: string;
  department: string;
  hireDate: Date;
  classes: Class[];
};

export type Class = {
  name: string;
  subject: string;
  room: string;
  maxStudents: number;
  teacher: Teacher;
  students: Student[];
};
```

### 7.2 Validation

`deno check` validates the generated types:
- **Undefined type references** → "Cannot find name 'Payment'"
- **Circular references** → caught by the TS compiler
- **Type mismatches** → caught as type errors

No custom manifest schema. No hand-written validator. The TypeScript compiler does the work.

### 7.3 Regeneration

`types.verbo.ts` is regenerated on every `verbo check` run. It lives alongside the `.md` files. Users can commit it for CI type-checking or `.gitignore` it.

## 8. Constraint assertion generation

Value-level constraints that TypeScript cannot express are generated as assertion code in `.verbo/validate.ts`.

### 8.1 Constraint types

| Constraint | Prose example | Generated check |
|---|---|---|
| Range | "grade level: 9 to 12" | `value >= 9 && value <= 12` |
| Minimum | "max students: at least 1" | `value >= 1` |
| Positive | "capacity: greater than 0" | `value > 0` |
| Required | "name: cannot be empty" | `value !== undefined && value !== null` |
| Format | "email: must be valid" | (format hint extracted, assertion checks non-empty) |

### 8.2 Generated code

```typescript
// .verbo/validate.ts — generated, do not edit.

// Constraint from models/student.md L4 — gradeLevel: 9 to 12
function assert_Student_gradeLevel(value: number, source: string): void {
  if (value < 9 || value > 12) {
    throw new Error(
      `${source}: gradeLevel = ${value} violates constraint [9..12] from models/student.md:4`
    );
  }
}
```

### 8.3 What assertions do NOT cover

Assertions are mechanical checks on extracted constraints. They do not:
- Generate business logic ("on level up, add 10 health").
- Enforce state transitions or side effects.
- Replace the clarify/interview system for prose-level contradictions.

## 9. Progressive refinement through interview

There is no separate "output" step. The `.md` file the user writes IS the output — the interview edits it in place, making it progressively more precise with each round.

### 9.1 How a file evolves

A user starts with loose prose:

```markdown
# Student
- grade level: 9 to 12
- email: must be valid
- can take multiple classes
```

The clarify pass flags imprecise declarations. The interview asks questions and writes answers directly into the file:

```
$ verbo interview

[HIGH] In models/student.md:
❓ "email: must be valid" — what format?

Proposed: email: must be a valid email address (e.g., student@school.edu).
1) Accept
2) Custom
> 1

Answer written to models/student.md.
```

After the round, the file now reads:

```markdown
# Student
- grade level: 9 to 12
- email: must be a valid email address (e.g., student@school.edu).
- can take multiple classes
```

The LLM extraction now has enough information to infer `string, email format`. No syntax was added — the prose just got more explicit. Re-extract, re-check, re-clarify. When no ambiguities remain, the file is done.

### 9.2 Why this works for AI consumers

The same file that a human reads and reviews is now precise enough for another LLM to consume. An AI coding tool reading this file sees:

- "grade level: 9 to 12" → number, range constraint
- "email: must be a valid email address" → string, format constraint  
- "can take multiple classes" → a reference to the Class model (`classes: Class[]`)

No special syntax. No annotations. Just explicit prose — the kind that both humans and LLMs understand.

### 9.3 Internal verification

TypeScript types (`types.verbo.ts`) and constraint assertions (`.verbo/validate.ts`) are still generated internally to validate the extraction. They prove the spec is consistent. They are not the user-facing artifact — the `.md` file is.

## 10. Clarify / Interview

The LLM-powered clarify and interview system is Verbo's differentiator. It doesn't just find bugs — it's a **collaborator** that helps users sharpen their specifications. It finds ambiguity, proposes precision improvements, and writes resolutions back into the source files.

### 9.1 Passive clarify

One LLM call analyzes the full spec corpus for:

- **Vague terms** — "proper validation", "efficiently", "soon".
- **Imprecise declarations** — "product code: not empty" doesn't specify whether it's a string or number. "user type: can be admin or regular" doesn't name the enum values.
- **Undefined concepts** — references to models or properties not described anywhere.
- **Incomplete logic** — missing edge cases, undefined error handling.
- **Contradictions** — conflicting requirements across files.
- **Implicit dependencies** — unstated relationships between components.

Results are categorized by severity (`CRITICAL`, `HIGH`, `MEDIUM`).

### 9.2 Interactive interview

Severity-ordered questions are presented to the developer. For each question the LLM **proposes a more precise version** of the spec. The developer can accept the proposal, choose an alternative, or provide their own. Answers are **written back into the `.md` files** with an audit trail under `.verbo/clarifications/`.

```
$ verbo interview

[HIGH] In models/product.md:
❓ "product code: not empty" is ambiguous — should this be a string or a number?

Proposed: `- product code: a unique string identifier for the product (cannot be empty).`
1) Accept this proposal
2) It's a number, not a string
3) Custom definition
> 1

Answer written to models/product.md. Re-checking...

[MEDIUM] In models/student.md:
❓ "experience determines level" — what's the formula?

Proposed: level = floor(experience / 1000)
1) Accept this proposal
2) level = floor(sqrt(experience / 500))
3) Custom formula
> 1

Answer written to models/student.md. Re-checking...
```

The LLM acts as an editor: it reads the user's prose, identifies where precision would improve extraction, and proposes concrete rewrites. The user stays in control — every change is opt-in.

### 9.3 Re-check loop

After interview answers are written back, extraction re-runs and clarify re-analyzes. The loop continues until no remaining ambiguities.

## 11. Pipeline overview

```
INPUT                    PIPELINE                    OUTPUT
─────                    ────────                    ──────
models/*.md ─┐
main.md ─────┤   ┌──────────────────┐
             ├──→│ LLM extraction    │──→ structured data
             │   │ (with repair loop)│
             │   └────────┬─────────┘
             │            │
             │            ▼
             │   ┌──────────────────┐
             │   │ Type generator    │──→ types.verbo.ts ──→ deno check
             │   └──────────────────┘       │
             │            │                 │ failures?
             │            │                 └──→ repair loop
             │            ▼
             │   ┌──────────────────┐
             │   │ Assertion gen     │──→ .verbo/validate.ts ──→ deno run
             │   └──────────────────┘
             │            │
             │            ▼
             │   ┌──────────────────┐
             └──→│ LLM clarify       │──→ clarifications.json
                 └────────┬─────────┘
                          │ has ambiguities?
                          ▼
                 ┌──────────────────┐
                 │ Interview         │──→ write-back to .md
                 └────────┬─────────┘
                          │
                          ▼ (re-extract, re-check)
                 ┌──────────────────┐
                 │ Loop until clean  │
                 └──────────────────┘
```

Stages:
1. **Extract** (LLM with repair loop) — extract models, properties, constraints, and cross-model references from natural language `.md`.
2. **Generate types** (deterministic) — produce `types.verbo.ts`, validate with `deno check`. Failures → repair loop.
3. **Generate assertions** (deterministic) — produce `.verbo/validate.ts`, run to check constraints.
4. **Clarify** (LLM) — find ambiguities in prose. If none, done.
5. **Interview** (interactive) — resolve ambiguities, write answers back to `.md`.
6. **Repeat** — re-extract and re-clarify until clean.

## 12. Output artifacts

| Artifact | Format | Purpose | Consumer |
|---|---|---|---|
| **The `.md` files** | Plain Markdown | The product. Progressively refined through interviews — both human documentation and AI-consumable spec. | Humans, AI coding tools |
| `types.verbo.ts` | TypeScript declarations | Internal verification — proves extraction is consistent | `deno check` |
| `.verbo/validate.ts` | TypeScript assertions | Internal verification — proves constraints are consistent | `deno run`, CI |
| `.verbo/clarifications/` | Markdown + JSONL | Audit trail of all clarification decisions | Humans, CI |
| `clarifications.json` | JSON | Machine-readable ambiguity report | Tooling |

## 13. What we keep vs. remove

### Keep
- `src/api/*` — 5 AI provider adapters (Ollama, Gemini, OpenAI, Anthropic, DeepSeek). Used by extraction, clarify, and interview.
- `src/prompts/clarify.md` — the clarify prompt template.
- `test/guild/` — the guild spec fixture (plain `.md`, no syntax added).
- `test/todo/` — the todo spec fixture.
- `docs/` — design docs and historical specs.

### Remove / stop building
- Everything from the code-generation era: compilers, manifests, linters, scaffolds, templates, codegen results. Already removed.
- Flavored Markdown conventions — rejected. Natural language is the input.
- Deterministic parser — rejected. The LLM is the extractor.

### New modules to build
- `src/prompts/extract.md` — LLM prompt for extracting structure from natural language.
- `src/extract/` — extraction orchestrator with repair loop.
- `src/generator/types.ts` — TypeScript type definition generator.
- `src/generator/assertions.ts` — constraint assertion generator.
- `src/interview/` — interactive interview engine with write-back.

## 14. Out of scope / deferred

- **Code generation.** Application code, API handlers, database schemas. Separate project if ever.
- **Web shell.** Browse specs, view the model graph, edit in-browser.
- **LLM-facing API / MCP server.** Expose the spec checker to other LLMs.
- **Interview spec-authoring agent.** An AI that interviews the developer to
  create initial specs — **now planned**, see
  [`docs/specs-from-zero.md`](./specs-from-zero.md).

## 15. Implementation phases

| Phase | Scope | Gate |
|---|---|---|
| 0 | Clean up: remove codegen code; keep providers, prompts, fixtures | ✓ Done |
| 1 | Extraction prompt + repair loop: LLM extracts structure from natural language; `deno check` failures feed back for retry | Extraction produces valid types for classroom fixture |
| 2 | Type generator: produce `types.verbo.ts` from extracted structure | Generated types pass `deno check` on fixture specs |
| 3 | Constraint assertion generator: produce `.verbo/validate.ts` | Assertions catch deliberate violations in fixtures |
| 4 | Interactive clarify/interview with write-back + audit trail | Interview writes answers, re-clarify converges |
| 5 | CLI polish: `verbo check` and `verbo interview` commands; test suite; CI | All green |

## 16. Glossary

- **Spec** — the `.md` source files (plain natural language Markdown).
- **Extraction** — LLM call that produces structured model data from natural language prose.
- **Repair loop** — retry mechanism: `deno check` failures are fed back to the LLM for corrected extraction.
- **Type generator** — produces `types.verbo.ts` from extracted structure, validated by `deno check`.
- **Assertion generator** — produces `.verbo/validate.ts` for value-level constraint checking.
- **Clarify** — LLM-powered passive ambiguity analysis.
- **Interview** — interactive ambiguity resolution that writes answers back into specs.
- **Audit trail** — `.verbo/clarifications/` directory with interview transcripts and decision log.
