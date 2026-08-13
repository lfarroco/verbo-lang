# Verbo AI Project Context

This document provides a high-level overview of the `verbo-lang` project, intended for AI assistants to quickly understand its purpose, architecture, and goals. **The authoritative design reference is [`docs/DESIGN.md`](./docs/DESIGN.md) — read it first. Where this file and DESIGN.md conflict, DESIGN.md wins.**

## 1. Core Mission

**Verbo is a specification engineering tool: natural language Markdown specs are processed by an LLM to extract structured type definitions, validated by `deno check` and generated constraint assertions, with AI-assisted ambiguity resolution via an interactive interview.**

Verbo does NOT generate application code. It validates specifications. The output is validated `.md` files, `types.verbo.ts`, `.verbo/validate.ts`, and an audit trail of all clarification decisions.

## 2. Key Concepts

- **Natural Language as Input:** Specs are plain `.md` files. No syntax, no annotations, no directives. Users write the way they'd explain models to a teammate. The LLM handles interpretation.
- **LLM as Extractor:** Structure (models, properties, types, constraints,
  cross-model references, and function signatures) is extracted from prose by an
  LLM with a **repair loop**: if `deno check` fails on generated types, errors
  are fed back to the LLM for a corrected extraction (max 3 retries).
- **TypeScript Types as Validation Output:** Extracted structure is emitted as
  `types.verbo.ts` — model types plus function contracts. `deno check` validates
  the type graph — no custom manifest or validator.
- **Constraint Assertions:** Value-level constraints (ranges, required fields, positive values) that TypeScript can't express are generated as assertion code in `.verbo/validate.ts`.
- **AI-Assisted Clarify / Interview:** A clarify pass finds ambiguity in prose. An interactive interview resolves it and writes answers back into the `.md` files, with an audit trail.
- **No Code Generation:** Application code, API handlers, SQL schemas — all out of scope. Verbo's output is validated specifications.
- **No Flavored Markdown / Deterministic Parser:** Rejected. If the user must write rigid syntax, Verbo has failed. The LLM handles the messiness of natural language; verification catches mistakes.

## 3. Project Structure

**Tool repo layout:**

- `main.ts`: Deno CLI entrypoint (commands: `check`, `clarify`, `interview`).
- `src/api/`: Thin provider adapters (Ollama, Gemini, OpenAI, Anthropic, DeepSeek).
- `src/prompts/`: LLM prompt templates (`clarify.md`, `extract.md`).
- `src/extract/`: Extraction orchestrator with repair loop (`types.ts`, `extractor.ts`).
- `src/generator/`: TypeScript type generator (`types.ts`) and constraint assertion generator (`assertions.ts` → `.verbo/validate.ts`).
- `src/check/`: `verbo check` pipeline wiring extract → generate → `deno check` → repair.
- `src/interview/`: Interactive interview engine with write-back (`engine.ts`, `types.ts`) — reads `clarifications.json`, resolves ambiguities severity-ordered, writes answers back into the `.md` files, and records an audit trail under `.verbo/clarifications/`.
- `docs/`: `DESIGN.md` (authoritative), plus historical docs.
- `test/`: Fixture specs — `classroom/`, `guild/`, and `todo/` (plain `.md` files with no special syntax).

**A typical verbo project:**

- `main.md`: project-level description (free-form prose).
- `models/`: one `.md` per data model (free-form prose, no directives required).
- `functions.md`: helper functions described in prose (optional); Verbo emits
  their signatures as TS function contracts in `types.verbo.ts`.

**Generated artifacts:**

- `types.verbo.ts`: TypeScript type definitions (regenerated on every check).
- `.verbo/validate.ts`: constraint assertion code.
- `.verbo/clarifications/`: audit trail of clarification decisions.
- `clarifications.json`: machine-readable ambiguity report.

## 4. Workflow

1. **Specification:** A developer writes data models in plain `.md` files.
2. **Extract (LLM + repair loop):** One LLM call extracts structured data from prose. Generate `types.verbo.ts`. Run `deno check`. On failure, feed errors back to the LLM (max 3 retries).
3. **Generate assertions (deterministic):** `.verbo/validate.ts` checks value-level constraints.
4. **Clarify (LLM):** Find ambiguities — vague terms, contradictions, undefined concepts.
5. **Interview (interactive):** Resolve ambiguities with write-back to `.md`, audited under `.verbo/clarifications/`. `--recheck` re-runs clarify and reports remaining ambiguities.
6. **Re-extract, re-clarify:** Loop until clean.

## 5. Technology Stack

- **Tool implementation:** Deno + TypeScript, functional style.
- **Specification input:** Plain Markdown (natural language, no required syntax).
- **AI Providers:** Ollama (local), Google Gemini, OpenAI, Anthropic, DeepSeek.
- **Output validation:** `deno check` (type-checking) + generated assertion code (value constraints).

## 6. Project Goals & Roadmap

- **Current Status:** Pivoted from code generation to specification engineering. Old codegen code removed. `verbo check` is real: LLM extraction with a repair loop (Phase 1) + type generator (Phase 2) + constraint assertion generator (Phase 3), verified end-to-end with the DeepSeek provider (`deepseek-v4-flash`). `clarify` and `interview` are real (Phase 4): `interview` reads `clarifications.json`, resolves ambiguities interactively with write-back to the `.md` files, records an audit trail under `.verbo/clarifications/`, and `interview --recheck` re-runs clarify and reports remaining ambiguities. Building toward the design in `docs/DESIGN.md`.
- **Phases:** Cleanup (✓ done) → Extraction + repair loop (✓) → Type generator (✓) → Assertion generator (✓) → Interview (✓) → CLI polish (5).

## 7. How to Assist

- **Read the design first:** `docs/DESIGN.md` is authoritative.
- **To understand the spec format:** Refer to `test/guild/models/*.md` — these are plain Markdown with NO special syntax. The user writes natural language. The LLM does the extraction.
- **When generating Verbo specs:** Write plain, descriptive Markdown — the way you'd explain models to a teammate. No backtick-quoted types, no constraint annotations, no directives. Be explicit but natural.
- **When working on the tool:** Next up is Phase 5 (CLI polish and CI). Do NOT build a parser or add syntax conventions.
- **Never generate codegen infrastructure:** No SQL, no route handlers, no API scaffolding.
