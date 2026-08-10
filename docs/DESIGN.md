# Verbo Design — Specification Engineering Reference

> **Status:** This document is the authoritative reference for Verbo's architecture. It supersedes older docs (`docs/roadmap.md`, `README.md` sections, `docs/feature_clarification_mode.md`, `docs/scaffolding_interview.md`) wherever they conflict. Verbo has pivoted away from code generation and toward **specification engineering**: writing specifications in flavored Markdown, validating them deterministically, and resolving ambiguity through AI-assisted interviews.

## 1. Vision

Verbo is a **specification engineering tool**. You write data model specifications in flavored Markdown. Verbo parses them deterministically, generates validated TypeScript type definitions, checks value-level constraints with generated assertions, and uses AI to find and resolve ambiguities through an interactive interview.

The three core ideas:

| Idea | Verdict | Notes |
|---|---|---|
| "Natural language as a programming language" | **Dropped** | LLM output is non-deterministic. Verbo uses natural language for *description* but deterministic parsing for *structure*. |
| "Structured vibe coding" | **Reframed** | The pipeline discipline (parse → validate → clarify → interview) is the right architecture, but its output is validated specifications, not generated code. |
| "Ambiguity as compile error" | **Holds strongly** | This is Verbo's differentiator. An AI-powered clarify pass finds vague language and contradictions; an interactive interview resolves them with write-back into the source files. |

## 2. Naming

**Decision: drop the "language" framing entirely.**

Verbo is a **specification system** — not a programming language, not a code generator. The output is validated specifications (`.md` files, type definitions, constraint assertions), not application code. Code generation, if it ever happens, belongs in a separate project.

Primary descriptor: *"specification engineering with AI-assisted review."* The project name stays **verbo**.

## 3. Locked decisions

1. **Specification-only. No code generation.** Verbo validates specifications; it does not generate application code, API handlers, database schemas, or server scaffolding. Those concerns are separate projects.
2. **Flavored Markdown is the single source of truth.** Specs are `.md` files with lightweight conventions (directives, wiki-links, constraint annotations). Human-readable as plain Markdown; deterministically parseable by a zero-LLM parser.
3. **TypeScript types as validation output.** The parser produces `types.verbo.ts` — checked by `deno check`. The TypeScript compiler is Verbo's type-checker. No custom manifest schema or validator.
4. **Constraint assertions for value-level checks.** Ranges, enumerations, and cross-field invariants that TypeScript can't express are generated as assertion code in `.verbo/validate.ts`.
5. **Clarification is interactive and write-back.** An LLM-powered clarify pass finds ambiguities. An interactive interview resolves them and writes answers back into the `.md` files, with an audit trail under `.verbo/clarifications/`.
6. **Implementation: Deno + TypeScript, functional style, no fp-ts/Effect.** Pure functions, explicit data flow, typed errors via plain TS.
7. **Keep the content, replace the glue.** Prompts, fixtures, and design docs carry over; manifests, compilers, and scaffold code are dropped.

## 4. Why not: what we explicitly reject

- **Code generation.** Compiling specs into application code is a separate, complex domain. The AI code-generation market is saturated. Verbo's value is in producing correct, unambiguous specifications — not in competing with code generators.
- **A custom JSON manifest/IR.** Prior versions used a hand-maintained manifest schema (`src/manifest/types.ts`) with custom validation. Dropped in favor of TypeScript types checked by `deno check` — zero custom validation code, thousands of engineer-hours of correctness from the TS compiler.
- **Parser-generator based language.** Verbo spec files are Markdown with conventions — not a formal grammar. The deterministic parser handles structure; natural language handles prose.
- **Fully deterministic compilation.** We accept that LLM clarification is stochastic. The clarify/interview loop contains the non-determinism: ambiguity is caught before it becomes an error, and resolutions are audited.

## 5. Flavored Markdown specification

Verbo specs are standard `.md` files with a lightweight set of conventions. The conventions are designed to be:
- **Human-readable** — a non-technical reader sees ordinary markdown.
- **Deterministically parseable** — a zero-LLM parser extracts structure without hallucination.
- **Extensible** — new conventions can be added without breaking existing specs.

### 5.1 File directives

HTML comments with the `verbo:` prefix mark sections for the parser:

```markdown
<!-- verbo:model -->
```

Supported directives:
- `verbo:model` — marks a data model definition. The parser extracts properties, constraints, and relationships from the following content.
- `verbo:data` — marks spec-defined example/test data. The parser extracts named values for constraint assertion generation.

Files without directives are treated as free-form prose — the clarify system can still find ambiguities in them, but the deterministic parser ignores them.

### 5.2 Property definitions

Properties are defined as markdown list items with backtick-quoted names, type annotations, and optional constraints:

```markdown
## Properties
- `name`: string (required)
- `level`: number [1..100]
- `class`: [Warrior, Mage, Rogue, Cleric]
- `experience`: number (>=0)
- `health`: number [10..]
- `attack`: number (>0)
- `location`: → [[Location]]
```

Conventions:
- `` `name`: type `` — property name and primitive type (`string`, `number`, `boolean`, `date`).
- `(required)` — non-optional, non-nullable.
- `[min..max]`, `[min..]`, `[..max]` — numeric range constraints (inclusive).
- `(>0)`, `(>=0)`, `(<100)` — comparison constraints.
- `[A, B, C]` — enumeration of allowed values (type is inferred).
- `→ [[ModelName]]` — typed reference to another model (resolved by the parser).
- `` `createdAt`: date (auto) `` — auto-populated timestamp.

### 5.3 Wiki-links for cross-references

Double-bracket `[[Name]]` syntax creates typed references between models. The parser resolves these into TypeScript type references in the generated output:

```markdown
A hero's `location` is a → [[Location]].
A location can have multiple → [[Monster]].
```

Wiki-links are also valid in free-form prose — the clarify system can detect links to undefined models and flag them.

### 5.4 Relationship declarations

Relationships are declared under a `## Relationships` heading using natural language with wiki-links:

```markdown
## Relationships
- A hero can have multiple → [[Item]].
- A hero belongs to a → [[Location]].
- A monster can drop multiple → [[Item]].
```

The parser extracts:
- The source model (inferred from the file's `verbo:model` directive).
- The target model (from the wiki-link).
- The cardinality (`has many`, `belongs to`, `has one`, etc.).

### 5.5 Spec-defined data

Data declared under `<!-- verbo:data -->` provides example values that are checked against model constraints:

```markdown
<!-- verbo:data -->

## defaultHero
- name: "Aragorn"
- level: 5
- class: Warrior
- health: 20
- attack: 15
- location: "Rivendell"
```

The constraint assertion generator creates checks that every declared data value satisfies its model's constraints. If `defaultHero.health = 5` but the `Hero` model declares `health: number [10..]`, the assertion fails with a source-mapped error.

### 5.6 Example: complete spec

```
models/hero.md        — <!-- verbo:model --> with properties and relationships
models/item.md        — <!-- verbo:model --> with properties
main.md              — free-form project description (no directive)
```

The parser collects all `verbo:model` and `verbo:data` sections, resolves wiki-links across files, and produces the output artifacts (§11).

## 6. Deterministic parser

The parser (`src/parser/`) operates without any LLM calls. It is fast, predictable, and never produces different output for the same input.

### 6.1 Parsing stages

1. **File collection** — all `.md` files in the project directory are gathered.
2. **Directive extraction** — files are scanned for `<!-- verbo:model -->` and `<!-- verbo:data -->` directives. Each directive marks the beginning of a section; sections extend until the next directive or end-of-file.
3. **Property parsing** — within `verbo:model` sections, list items matching the `` `name`: type [constraints] `` pattern are extracted. Constraints are parsed into structured form (range, enum, comparison, reference).
4. **Wiki-link resolution** — all `[[Name]]` references are collected and resolved against declared model names. Unresolved links are reported as errors.
5. **Relationship extraction** — under `## Relationships` headings, cardinality and target are extracted from wiki-link patterns.
6. **Data extraction** — under `verbo:data` sections, named data blocks with key-value pairs are extracted.

### 6.2 Parser output

The parser produces a lightweight internal structure (not a user-facing manifest):

```
{
  models: [
    {
      name: "Hero",
      sourceFile: "models/hero.md",
      sourceLine: 2,
      properties: [
        { name: "name", type: "string", required: true },
        { name: "level", type: "number", constraints: [{ kind: "range", min: 1, max: 100 }] },
        { name: "class", type: "enum", values: ["Warrior", "Mage", "Rogue", "Cleric"] },
        { name: "location", type: "ref", ref: "Location" },
      ],
      relationships: [
        { kind: "has-many", target: "Item" },
        { kind: "belongs-to", target: "Location" },
      ]
    },
  ],
  data: [
    {
      name: "defaultHero",
      model: "Hero",
      values: { name: "Aragorn", level: 5, class: "Warrior", health: 20, attack: 15 }
    }
  ]
}
```

This internal structure feeds the type generator and constraint assertion generator. It is never exposed to the user.

## 7. Type generation

The type generator (`src/generator/types.ts`) produces `types.verbo.ts` from the parser output.

### 7.1 Generated output

For the guild example, the generator produces:

```typescript
// Generated by Verbo — do not edit directly.
// Source: models/hero.md, models/item.md, models/monster.md, models/location.md

export type Hero = {
  name: string;
  level: number;
  class: "Warrior" | "Mage" | "Rogue" | "Cleric";
  experience: number;
  health: number;
  attack: number;
  location: Location;
  items: Item[];
};

export type Item = {
  name: string;
  value: number;
};

export type Monster = {
  name: string;
  level: number;
  health: number;
  attack: number;
  items: Item[];
};

export type Location = {
  name: string;
  description: string | null;
  monsters: Monster[];
};
```

### 7.2 Validation

The generated file is validated by `deno check`:
- **Undefined type references** → caught as "Cannot find name 'Payment'" with a line number.
- **Circular references** → caught by the TS compiler.
- **Type mismatches** → caught as type errors.

No custom manifest schema. No hand-written validator. The TypeScript compiler is the type-checker.

### 7.3 Regeneration

`types.verbo.ts` is regenerated on every `verbo check` run. It lives alongside the `.md` files as a build artifact. Users can commit it for type-checking in CI, or `.gitignore` it and regenerate.

## 8. Constraint assertion generation

Value-level constraints that TypeScript cannot express are generated as assertion code in `.verbo/validate.ts`.

### 8.1 Constraint types

| Constraint | Spec syntax | Generated check |
|---|---|---|
| Range | `[1..100]` | `value >= 1 && value <= 100` |
| Minimum | `[10..]` | `value >= 10` |
| Maximum | `[..100]` | `value <= 100` |
| Positive | `(>0)` | `value > 0` |
| Non-negative | `(>=0)` | `value >= 0` |
| Required | `(required)` | `value !== undefined && value !== null` |
| Enum | `[A, B, C]` | `[A, B, C].includes(value)` |
| Data consistency | (automatic) | All `verbo:data` values satisfy their model's constraints |

### 8.2 Generated code

```typescript
// .verbo/validate.ts — generated, do not edit.

// Constraint: models/hero.md L4 — level: [1..100]
function assert_Hero_level(value: number, source: string): void {
  if (value < 1 || value > 100) {
    throw new Error(
      `${source}: level = ${value} violates constraint [1..100] defined in models/hero.md:4`
    );
  }
}

// Data check: main.md L12 — defaultHero against Hero constraints
import { defaultHero } from "./spec-data.ts";
assert_Hero_level(defaultHero.level, "defaultHero.level");
```

### 8.3 What assertions do NOT cover

Assertions are purely mechanical checks on declared constraints. They do not:
- Generate business logic ("on level up, add 10 health").
- Enforce state transitions or side effects.
- Replace the clarify/interview system for prose-level contradictions.

Those concerns belong to the clarify/interview loop (§9).

## 9. Clarify / Interview

The LLM-powered clarify and interview system is Verbo's differentiator. It finds and resolves ambiguity that neither the type-checker nor constraint assertions can catch.

### 9.1 Passive clarify

One LLM call analyzes the full spec corpus for:

- **Vague terms** — "proper validation", "efficiently", "soon".
- **Undefined concepts** — references to models, properties, or values not declared anywhere.
- **Incomplete logic** — missing edge cases, undefined error handling.
- **Contradictions** — conflicting requirements across files.
- **Implicit dependencies** — unstated relationships between components.

Results are categorized by severity (`CRITICAL`, `HIGH`, `MEDIUM`) and written to `clarifications.json`.

### 9.2 Interactive interview

The interview mode walks the developer through severity-ordered questions:

```
$ verbo interview

[HIGH] In models/hero.md:
❓ "experience determines level" — what's the formula?
1) level = floor(experience / 1000)
2) level = floor(sqrt(experience / 500))
3) Custom formula
> 1

Answer written to models/hero.md. Re-checking...
```

### 9.3 Write-back

Every answer is written back into the source `.md` file as an annotation:

```markdown
<!-- CLARIFICATION-RESULT @ 2026-08-10 -->
> **Q:** What formula determines level from experience?
> **A:** level = floor(experience / 1000)
```

### 9.4 Audit trail

All decisions are logged under `.verbo/clarifications/`:
- `YYYYMMDD-HHMMSS.md` — full interview transcripts.
- `decisions.jsonl` — machine-readable decision history.
- Pre/post clarification spec snapshots.

### 9.5 Re-check loop

After interview answers are written back, the parser re-runs and the clarify pass re-analyzes. The loop continues until no remaining ambiguities.

## 10. Pipeline overview

```
INPUT                    PIPELINE                    OUTPUT
─────                    ────────                    ──────
models/*.md ─┐
main.md ─────┤   ┌──────────────────┐
             ├──→│ Deterministic     │
             │   │ .md parser        │
             │   └────────┬─────────┘
             │            │ internal structure
             │            ▼
             │   ┌──────────────────┐
             │   │ Type generator    │──→ types.verbo.ts ──→ deno check
             │   └──────────────────┘
             │            │
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
                          ▼ (re-parse, re-check)
                 ┌──────────────────┐
                 │ Loop until clean  │
                 └──────────────────┘
```

Stages:
1. **Parse** (deterministic, zero-LLM) — extract models, properties, relationships from flavored `.md`.
2. **Generate types** (deterministic) — produce `types.verbo.ts`, validate with `deno check`.
3. **Generate assertions** (deterministic) — produce `.verbo/validate.ts`, run to check constraints.
4. **Clarify** (LLM) — find ambiguities in prose. If none, done.
5. **Interview** (interactive) — resolve ambiguities, write answers back to `.md`.
6. **Repeat** — re-parse and re-clarify until clean.

## 11. Output artifacts

| Artifact | Format | Purpose | Consumer |
|---|---|---|---|
| Enhanced `.md` files | Flavored Markdown | Source of truth with ambiguities resolved | Humans |
| `types.verbo.ts` | TypeScript declarations | Type-validated model definitions | `deno check`, TypeScript projects |
| `.verbo/validate.ts` | TypeScript assertions | Constraint validation (ranges, enums, data checks) | `deno run`, CI |
| `.verbo/clarifications/` | Markdown + JSONL | Audit trail of all clarification decisions | Humans, CI |
| `clarifications.json` | JSON | Machine-readable ambiguity report | Tooling |

## 12. What we keep vs. remove

### Keep
- `src/api/*` — 4 AI provider adapters (Ollama, Gemini, OpenAI, Anthropic). Used by the clarify/interview system.
- `src/prompts/clarify.md` — the clarify prompt template.
- `test/guild/` — the guild spec fixture (models + main.md, excluding routes.md and generated results).
- `test/todo/` — the todo spec fixture (models + main.md).
- `docs/` — design docs and historical specs (old docs remain as reference).

### Remove / stop building
- `src/compiler/*` — SQL, models, db-client, routes, class, function, react compilers. No code generation.
- `src/manifest/*` — manifest types, validation, extraction. Replaced by TS types + `deno check`.
- `src/lint/*` — custom linter. Partially replaced by `deno check`; route-specific rules are irrelevant.
- `src/testGenerator.ts` — test generation. No generated code to test.
- `scaffold.ts` — server scaffold. No application to scaffold.
- `templates/` — server.ts, docker-compose, dotenv templates. No REST server to generate.
- `test/guild/results/` — generated code golden files. Irrelevant; the `.md` files are the fixtures.
- `src/constants.ts` — language constants for old codegen targets.

### New modules to build
- `src/parser/` — deterministic flavored-Markdown parser.
- `src/generator/types.ts` — TypeScript type definition generator.
- `src/generator/assertions.ts` — constraint assertion generator.
- `src/interview/` — interactive interview engine with write-back.
- `src/commands/check.ts` — `verbo check` command (parse + generate + validate).
- `src/commands/interview.ts` — `verbo interview` command.

## 13. Out of scope / deferred

- **Code generation.** Application code, API handlers, database schemas, server scaffolding. Separate project if ever.
- **Web shell.** Browse specs, view the model graph, edit in-browser. Deferred; the parser output makes this a rendering problem.
- **LLM-facing API / MCP server.** Expose the spec checker to other LLMs. Deferred until the core is stable.
- **Interview spec-authoring agent.** An AI that interviews the developer to create initial specs. Deferred.
- **Per-model caching.** Hash-based cache for clarify results. Natural follow-up.

## 14. Implementation phases

| Phase | Scope | Gate |
|---|---|---|
| 0 | Clean up: remove codegen code (`src/compiler/*`, `src/manifest/*`, `scaffold.ts`, `templates/`); keep providers, prompts, fixtures | `deno check` green, tests pass |
| 1 | Deterministic parser for flavored `.md` (directives, properties, constraints, wiki-links, relationships) | Parser tests green on guild + todo fixtures (no LLM) |
| 2 | Type generator (`types.verbo.ts`) + `deno check` integration | Generated types pass `deno check` on guild + todo fixtures |
| 3 | Constraint assertion generator (`.verbo/validate.ts`) + data validation | Assertions catch deliberate constraint violations in fixtures |
| 4 | Interactive clarify/interview with write-back + audit trail | Interview writes answers, re-clarify converges |
| 5 | CLI polish: `verbo check` and `verbo interview` commands; test suite; CI | All green |

## 15. Glossary

- **Spec** — the `.md` source files (flavored Markdown).
- **Flavored Markdown** — Markdown with lightweight conventions: `<!-- verbo:model -->` directives, `[[WikiLinks]]`, constraint annotations (`[1..100]`, `(>0)`, `[A,B,C]`).
- **Parser** — deterministic, zero-LLM module that extracts structured data from flavored `.md` files.
- **Type generator** — produces `types.verbo.ts` from parser output, validated by `deno check`.
- **Assertion generator** — produces `.verbo/validate.ts` for value-level constraint checking.
- **Clarify** — LLM-powered passive ambiguity analysis.
- **Interview** — interactive ambiguity resolution that writes answers back into specs.
- **Audit trail** — `.verbo/clarifications/` directory with interview transcripts and decision log.
