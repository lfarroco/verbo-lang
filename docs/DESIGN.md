# Verbo Design — Working Core Reference

> **Status:** This document is the authoritative reference for Verbo's planned architecture. It supersedes older docs (`docs/roadmap.md`, `README.md` sections, `docs/feature_clarification_mode.md`, `docs/scaffolding_interview.md`) wherever they conflict. Future agents should treat this file as the source of truth for design decisions, and the fixture specs under the skills (`skills/*/fixtures/`) as ground truth for expected behavior.

## 1. Vision

Verbo is an experiment in **"structured vibe-coding"**: compiling natural-language specifications written in Markdown into working code, guided by structure rather than left to chance.

The three core ideas, and whether they hold:

| Idea | Verdict | Notes |
|---|---|---|
| "Natural language as a programming language" | **Holds partially** | The durable insight is *spec-as-source-of-truth*, not NL-as-syntax. Non-deterministic output means "language" overpromises (see §2). |
| "Structured vibe coding" | **Holds strongly** | Decomposing generation into a verifiable pipeline (a "build system for prompts") is the correct architecture. |
| "Spec compiling" (AI asks for clarification on vague points) | **Holds strongly** | Ambiguity-as-compile-error, resolved through an interview, is Verbo's differentiator. |

## 2. Naming: is Verbo a "language"?

**Decision: not yet — and the docs should say so.**

Verbo is currently best described as a **spec-driven code generation system**: structured Markdown specs compiled into code by an AI pipeline. Calling it a "language" today overpromises, because a language implies:

- a grammar (Verbo has conventions, not a grammar);
- deterministic semantics (the same spec can produce different output across models/runs);
- reproducibility (LLM compilation is stochastic).

"Language" is retained as the **long-term north star**. The path to language-hood is concrete and already in this design:

| What a language has | Verbo's path toward it |
|---|---|
| An AST | The **manifest** — a validated, structured IR extracted from Markdown (§5) |
| Type checking | Deterministic **linter** + **verification** of generated artifacts (§6.3, §8) |
| Compile errors | The **clarify / interview loop** — ambiguity is treated as a compile error (§6.4) |
| A standard library | The **skill system** — reusable, composable codegen backends (§7) |

Primary descriptor for external communication: *"structured vibe-coding"* / *"spec-driven code generation."* The project name stays **verbo**.

## 3. Locked decisions (summary)

1. **General core + composable skills.** The core (extract → manifest → lint → clarify → compile → verify → scaffold) is target-agnostic. Skills are pluggable codegen backends. First-class skills: **`web-app`** and **`cli`** only.
2. **Markdown is the single source of truth.** The manifest is always derived and disposable (a build artifact under `.verbo/`).
3. **One generic manifest schema.** Entities are object types; routes are functions whose port is HTTP; CLI flags are parameter annotations. Skills are *interpretation layers*, not separate schemas.
4. **Every compile step is verified** (`deno check`, SQL parse, route coverage) with a bounded retry loop feeding errors back to the model.
5. **Clarification is interactive and write-back.** Answers are written into the `.md` files, decisions are audited under `.verbo/clarifications/`, and the loop re-runs until clean.
6. **Implementation: Deno + TypeScript, functional style, no fp-ts/Effect.** Pure functions, explicit data flow, typed errors via plain TS.
7. **Keep the content, replace the glue.** Prompts, fixtures, templates, and design docs carry over; the orchestration code is rewritten (see §10).
8. **`verbo.json` per project** declares skills, provider, model, and output dir.

## 4. Architecture overview

```
[Interview Agent (idea A, deferred)]        [Compiler Core]                [Web Shell (idea B, deferred)]
  "What do you want to build?"                 .md files ──► extract         browse specs
  writes/edits .md files ─────────────────►    manifest  ──► validate        connection graph
        │                                     linter    ──► clarify          deploy
        │                                     compile   ──► verify
        └──── agents communicate ONLY through spec files ◄─────┘
```

The invariant: **agents communicate through files.** The interview agent and the compiler never need to know about each other; they exchange Markdown (and, internally, the manifest).

## 5. The Manifest (IR)

The manifest is the AST: a structured description of the project extracted from the Markdown corpus by one dedicated LLM call. It is **validated** (deterministic schema checks), **repaired** (retry loop on extraction), and carries **source maps** (`sourceFile` + `sourceLine`) on every element so any derived artifact can be traced back to the prose it came from.

```typescript
type Manifest = {
  schemaVersion: 1;
  project: { name: string; description: string; sourceFile: string; sourceLine: number };
  types: TypeDef[];          // entities are object types with table semantics
  functions: FunctionDef[];  // routes are functions whose port is HTTP
  cli?: CliSection;          // flag annotations, console port
};

type TypeDef = {
  name: string;
  kind: "string" | "number" | "boolean" | "date" | "array" | "object" | "enum" | "ref";
  sourceFile: string;
  sourceLine: number;
  constraints?: string[];      // "not null", "unique", "1..100", "must be positive"
  ref?: string;                // for kind="ref"
  items?: TypeDef;             // for kind="array"
  enumValues?: string[];
  properties?: PropertyDef[];  // for kind="object"
};

type FunctionDef = {
  name: string;                // "ls", "GET /heroes"
  sourceFile: string;
  sourceLine: number;
  parameters: ParameterDef[];  // typed; cli flags are annotated parameters
  ports: PortDef[];            // external interactions (http, db, readDirectory, render, console)
  behaviorRules: string[];     // ordered natural-language rules
  errors: string[];            // error conditions
};
```

Rules:

- Markdown stays loose and natural. **Structure lives in the manifest, not in the markdown.** This is what keeps Verbo "natural language" rather than YAML.
- The manifest is re-extracted before every compile (one LLM call) so direct Markdown edits are always honored.
- The manifest is disposable: never edited by hand, never treated as a source file.

## 6. Pipeline stages

### 6.1 Extract
One LLM call: aggregated Markdown (skill-aware extraction prompt) → manifest JSON. Output must be valid JSON matching the schema.

### 6.2 Validate & repair
Deterministic schema validation. On failure, feed the exact errors back to the model and retry (bounded, default 3). Persistent extraction failure is a clarify-worthy condition.

### 6.3 Lint (deterministic, no LLM cost)
- Required files exist (`main.md`, skill-required files).
- Type/property names unique within scope.
- Every route/function references an existing entity/type.
- No duplicate or ambiguous routes (e.g. the same path listed twice with no method — regression fixture: old `test/guild/routes.md`).
- Relationships resolve to defined types.

Severity levels (reused by clarify): `CRITICAL` (blocks compile), `HIGH` (likely runtime bug), `MEDIUM` (best-practice gap).

### 6.4 Clarify / interview
- `verbo clarify` → passive analysis, writes `clarifications.json` (exists today; upgraded to run against the manifest so questions carry `file` + `line`).
- `verbo interview` → interactive, severity-ordered; answers accepted as numbered option / free text / `skip`; answers are **written back into the `.md` files** via a targeted LLM edit; every decision appended to `decisions.jsonl` + a transcript under `.verbo/clarifications/`; then re-extract → re-clarify until no `CRITICAL`/`HIGH` or the user stops (bounded iterations).

This implements `docs/feature_clarification_mode.md`. The framing: **ambiguity is a compile error, resolved through an interview.**

### 6.5 Compile
Skill pipeline steps. Each step: **generate → verify → on failure, feed errors back → retry (max 3)**. Every attempt's prompt and raw response logged to `.verbo/`. Compilation fails loudly instead of silently emitting broken code.

### 6.6 Scaffold
Copy skill scaffolds + generated artifacts into the output project (`verbo.json`, server/CLI entrypoint, docker-compose, dotenv as applicable).

### 6.7 Compliance report (optional)
A cheap LLM check after compile: every manifest route has a handler, every entity has a table, every relationship has an FK/join. Emits a coverage report. Catches spec↔code drift.

## 7. Skill system

A skill is a directory:

```
skills/web-app/
  skill.json     # required files, manifest expectations, pipeline steps + verify checks, conventions
  prompts/       # sql.md, models.md, db-client.md, routes.md (moved from src/prompts, bug-fixed)
  scaffold/      # server template, docker-compose, dotenv, port wiring
  fixtures/      # golden specs that must compile & pass verification

skills/cli/
  skill.json     # requires main.md + ports.md; understands flags/ports/behavior
  prompts/       # pure-function core, port wiring conventions
  scaffold/      # parseArgs + stdout/stderr/exit-code + real-FS port wiring
  fixtures/      # ls golden spec
```

`skill.json` (planned shape):

```json
{
  "name": "web-app",
  "requiredFiles": ["main.md", "routes.md"],
  "optionalDirs": ["models"],
  "manifest": { "expects": ["types", "functions"] },
  "pipeline": [
    { "name": "sql", "prompt": "prompts/sql.md", "verify": "sql-parse" },
    { "name": "models", "prompt": "prompts/models.md", "verify": "deno-check" },
    { "name": "db-client", "prompt": "prompts/db-client.md", "verify": "deno-check" },
    { "name": "routes", "prompt": "prompts/routes.md", "verify": ["deno-check", "route-coverage"] }
  ],
  "scaffold": "scaffold/",
  "conventions": ["REST conventions", "Deno + Oak + Postgres"]
}
```

Rules:

- **Skills are composable** ("admin web-app with a maintenance CLI" = `web-app` + `cli`). The manifest is project-level; skills contribute sections.
- **Quality gate:** a skill becomes first-class only when it has ≥3 golden fixtures that compile and pass their own verification.
- Skills are how the tool stays *general* (anyone can add one) while every shipped skill is *reliable*.
- The pure-function/ports contract is the shared core invariant across all skills: the LLM generates pure logic; the scaffold wires ports to the real world.

## 8. Verification

| Artifact | Check |
|---|---|
| TypeScript | `deno check <file>` (deterministic; catches types, imports) |
| SQL schema | `pg-query-ng` (npm specifier) parse + structural checks (every entity has a table, relationships have FK/join) |
| Routes | deterministic route-coverage (every manifest route has a handler in generated code) |
| CLI | `deno check` + smoke-run against fixture inputs |

All checks run on generated output; failures feed back into the retry loop (§6.5). Generated code must never be executed with `--allow-all` outside a sandbox/temp dir during verification.

## 9. Worked examples

### 9.1 web-app — "guild" (RPG API)
Spec: `main.md` + `models/{hero,monster,location,item}.md` + `routes.md` (see `test/guild/`). Manifest: object types (Hero, Monster, Location, Item) + relationship constraints + route functions (`GET /heroes`, `PUT /heroes/{id}/items/{itemId}`, …). Pipeline: sql → models → db-client → routes → scaffold.

### 9.2 cli — `ls`
Spec: `main.md` (options: `targetPath`, `long`/`-l`, `all`/`-a`, `humanReadable`/`-h`, `recursive`/`-R`; behavior rules) + `ports.md` (`readDirectory(path) → Entry[]`). Manifest: `Entry` object type + `ls` function with parameters/flags + `readDirectory` port. Pipeline: compile pure core → scaffold CLI wiring (arg parsing, real-FS port implementation, stdout/exit-code contract).

The `ls` example is the canonical demonstration that the core is general: no database, no HTTP — only types, a function, and a port.

## 10. What we keep vs. replace

**Keep (content):** `src/prompts/*.md` (bug-fixed), `test/guild`, `test/todo` (specs + generated results as golden fixtures), `templates/`, `docs/` (superseded docs remain as history), `src/api/*` (4 providers).

**Replace (glue):** `main.ts` orchestration, `src/compiler/*`, `generator.ts` (keep the prompt-loading concept, replace `extractCode` with structured parsing), `gatherFiles.ts`/`compileFiles.ts` (rewrite with source-line tracking), `scaffold.ts` (becomes skill scaffolds), `src/commands/clarify.ts` (upgraded), `testGenerator.ts` (broken — replace), Node path (`tsconfig.json`, `jest.config.js`, npm build — discard).

## 11. Out of scope / deferred

- **Interview spec-authoring agent (idea A):** an AI that interviews the developer ("what do you want to build?") and writes/edits the `.md` specs. Boundary: communicates only through spec files. Uses skill question banks (see old `docs/scaffolding_interview.md`).
- **Web shell (idea B):** browse specs, view the connection graph (the manifest *is* the graph), deploy. The manifest makes this a rendering problem.
- **Additional skills:** platform-game (different difficulty class — scaffolds can provide loop/canvas/input/physics, but game "feel" is not prose-compilable; demo-only), dashboards.
- **Per-model slicing/caching** (smaller generation units, hash-based cache). Natural follow-up after the skill system exists.

## 12. Implementation phases

| Phase | Scope | Gate |
|---|---|---|
| 0 | Install Deno; fix prompt bugs; add regression fixtures | `deno check` green on fixtures |
| 1 | Manifest types + schema validation; extraction with repair loop; deterministic linter | linter unit tests green (no LLM) |
| 2 | Verification module + pipeline retry loop | compile web-app fixture with mock provider, verify passes |
| 3 | Interactive clarify/interview with write-back + audit trail | interview applies answers, re-clarify converges |
| 4 | Skill system: refactor rest-server → `web-app` skill; add `cli` skill + `ls` fixture | both skills' golden fixtures compile + verify |
| 5 | Test suite: `deno test` with mock AI provider; Makefile/CI on Deno only | all green |

## 13. Glossary

- **Spec** — the `.md` source files (markdown, natural language).
- **Manifest** — validated structured IR extracted from specs; disposable.
- **Skill** — composable codegen backend (skill.json + prompts + scaffold + fixtures).
- **Port** — a declared external interaction wired by the scaffold (http, db, fs, console, render).
- **Clarify** — passive ambiguity analysis.
- **Interview** — interactive ambiguity resolution that writes answers back into specs.
- **Verification** — deterministic checks on generated artifacts (deno check, SQL parse, route coverage).
