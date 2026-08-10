# Verbo AI Project Context

This document provides a high-level overview of the `verbo-lang` project, intended for AI assistants to quickly understand its purpose, architecture, and goals. **The authoritative design reference is [`docs/DESIGN.md`](./docs/DESIGN.md) — read it first. Where this file and DESIGN.md conflict, DESIGN.md wins.**

## 1. Core Mission

**Verbo is a specification engineering tool: flavored Markdown specs parsed deterministically, validated through generated TypeScript types and constraint assertions, with AI-assisted ambiguity resolution via an interactive interview.**

Verbo does NOT generate application code, API handlers, database schemas, or server scaffolding. It validates specifications. The output is validated `.md` files, `types.verbo.ts`, `.verbo/validate.ts`, and an audit trail of all clarification decisions.

## 2. Key Concepts

- **Flavored Markdown as Source of Truth:** Specs are `.md` files with lightweight conventions — `<!-- verbo:model -->` directives, `[[WikiLinks]]` for cross-references, and constraint annotations (`[1..100]`, `(>0)`, `[A,B,C]`). Human-readable as plain Markdown; deterministically parseable.
- **Deterministic Parser:** A zero-LLM parser extracts structured data (models, properties, constraints, relationships) from flavored `.md`. Fast, predictable, never hallucinates. Lives in `src/parser/`.
- **TypeScript Types as Validation Output:** The parser output drives a type generator that produces `types.verbo.ts`. `deno check` validates the type graph — no custom manifest schema or validator needed.
- **Constraint Assertions:** Value-level constraints that TypeScript can't express (ranges, enums) are generated as assertion code in `.verbo/validate.ts`. The spec proves itself internally consistent.
- **AI-Assisted Clarify / Interview:** An LLM-powered clarify pass finds ambiguity in prose. An interactive interview walks through severity-ordered questions and **writes answers back into the `.md` files**, with an audit trail under `.verbo/clarifications/`.
- **No Code Generation:** Application code, API handlers, SQL schemas — all out of scope. Verbo's output is validated specifications, not generated code.

## 3. Project Structure

**Tool repo layout (current, partially planned):**

- `main.ts`: Deno CLI entrypoint (commands: `check`, `clarify`, `interview`).
- `src/api/`: Thin provider adapters (Ollama, Gemini, OpenAI, Anthropic).
- `src/prompts/`: LLM prompt templates (`clarify.md`, `interview.md`).
- `src/parser/` *(planned)*: Deterministic flavored-Markdown parser.
- `src/generator/` *(planned)*: TypeScript type generator (`types.ts`) and constraint assertion generator (`assertions.ts`).
- `src/interview/` *(planned)*: Interactive interview engine with write-back.
- `docs/`: `DESIGN.md` (authoritative), plus historical docs.
- `test/`: Fixture specs — `guild/` and `todo/` (`.md` files only; generated `results/` are legacy and should be ignored).

**A typical verbo project (source specs):**

- `main.md`: free-form project description (no directive required).
- `models/`: one `.md` per data model, each with `<!-- verbo:model -->` directive.
- Optionally: files with `<!-- verbo:data -->` for example/test data.

**Generated artifacts:**

- `types.verbo.ts`: TypeScript type definitions (regenerated on every check).
- `.verbo/validate.ts`: constraint assertion code.
- `.verbo/clarifications/`: audit trail of clarification decisions.
- `clarifications.json`: machine-readable ambiguity report.

## 4. Workflow

1. **Specification:** A developer writes data models in flavored `.md` files.
2. **Parse (deterministic):** The parser extracts models, properties, constraints, relationships from all files. Zero LLM cost.
3. **Generate types (deterministic):** `types.verbo.ts` is produced from parser output. `deno check` validates the type graph.
4. **Generate assertions (deterministic):** `.verbo/validate.ts` checks value-level constraints and spec data consistency.
5. **Clarify (LLM):** One LLM call finds ambiguities — vague terms, undefined concepts, contradictions. Results in `clarifications.json`.
6. **Interview (interactive):** Severity-ordered Q&A that writes answers back into the `.md` files, audited under `.verbo/clarifications/`.
7. **Re-parse, re-clarify:** The loop continues until no ambiguities remain.

## 5. Technology Stack

- **Tool implementation:** Deno + TypeScript, functional style, no fp-ts/Effect.
- **Specification language:** Flavored Markdown — standard Markdown with lightweight conventions.
- **AI Providers:**
    - Local: Ollama
    - Cloud: Google Gemini, OpenAI, Anthropic
- **Output validation:**
    - `deno check` — TypeScript type-checking (zero custom code).
    - Generated assertion code — value-level constraint checking.

## 6. Project Goals & Roadmap

- **Current Status:** Pivoting from code generation to specification engineering. The old codebase has a working REST API generation POC (see `test/guild/results/` for legacy output), plus a basic `clarify` command. The project is being rebuilt around the design in `docs/DESIGN.md`: deterministic parser → type generation → assertion generation → clarify → interview.
- **Roadmap:** See `docs/roadmap.md` and `docs/DESIGN.md` §14. Phases: cleanup (Phase 0) → parser (1) → type generator (2) → assertion generator (3) → interview (4) → CLI polish (5).

## 7. How to Assist

When asked to contribute to or use `verbo-lang`:

- **Read the design first:** `docs/DESIGN.md` is the authoritative architecture reference.
- **To understand the spec format:** Refer to the fixture examples under `test/guild/` and `test/todo/` (the `.md` files, not the legacy `results/`).
- **When generating Verbo specs (`.md` files):** Follow the flavored Markdown conventions: `<!-- verbo:model -->` directives, property lists with backtick-quoted names and type annotations, `[[WikiLinks]]` for cross-references, constraint annotations (`[1..100]`, `(>0)`, `[A,B,C]`). Be descriptive but precise.
- **When working on the tool:** The priority is the redesign in `docs/DESIGN.md` phases 0–5. The deterministic parser and type generation are the first new modules to build. Do NOT extend the old `src/compiler/*` or `src/manifest/*` code — it will be removed.
- **Never generate codegen infrastructure:** Verbo does not produce application code. No SQL generation, no route handlers, no database clients, no server scaffolding.
