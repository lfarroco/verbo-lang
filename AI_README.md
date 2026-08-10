# Verbo-Lang AI Project Context

This document provides a high-level overview of the `verbo-lang` project, intended for AI assistants to quickly understand its purpose, architecture, and goals. **The authoritative design reference is [`docs/DESIGN.md`](./docs/DESIGN.md) — read it first. Where this file and DESIGN.md conflict, DESIGN.md wins.**

## 1. Core Mission

**Verbo is a spec-driven code generation system: structured Markdown specifications compiled into working code by a guided AI pipeline.**

The project explores "structured vibe-coding" — using descriptive, structured natural language to generate complex applications reliably. It is *not* (yet) a "language" in the strict sense: output is non-deterministic and the spec has conventions rather than a grammar. "Language" is the long-term north star (see DESIGN.md §2). The current focus is a general core + composable skills system, with two first-class skills: **`web-app`** (REST APIs) and **`cli`**.

## 2. Key Concepts

- **Markdown as the Source of Truth:** The specs are Markdown (`.md`) files — `main.md`, `models/*.md`, `routes.md` (web-app) or `ports.md` (cli). Markdown stays loose and natural; structure lives in the derived manifest, not the prose.
- **The Manifest (IR):** One LLM call extracts the markdown corpus into a validated JSON *manifest* (types, functions, ports, behavior rules) with source maps back to file+line. The manifest is disposable and re-extracted before every compile.
- **AI-Driven Compilation:** There is no traditional compiler. A pipeline orchestrates prompts to an LLM (Ollama local, Gemini, GPT, Claude) to translate the manifest into target code.
- **Structured Pipeline:** Generation is a sequence of small steps (sql → models → db-client → routes for web-app), each with targeted prompt templates and few-shot examples, and each **verified** (`deno check`, SQL parse, route coverage) with a bounded retry loop that feeds errors back to the model.
- **Ambiguity as Compile Error:** An AI-powered `clarify` pass identifies vagueness/contradictions; an interactive `interview` walks the developer through severity-ordered questions and **writes the answers back into the spec files**, with an audit trail under `.verbo/clarifications/`.
- **Skills:** Composable codegen backends (skill.json + prompts + scaffold + fixtures). The pure-function/ports contract is the shared invariant: the LLM generates pure logic; the scaffold wires ports to the real world.

## 3. Project Structure

**Tool repo layout (current, partially planned):**

- `main.ts`: Deno CLI entrypoint (commands: `compile`, `clarify`, `interview`, …).
- `src/api/`: Thin provider adapters (Ollama, Gemini, OpenAI, Anthropic).
- `src/prompts/`: Modular prompt templates (`.md`), to be moved into per-skill `prompts/` dirs during the redesign.
- `skills/` *(planned)*: Composable codegen backends — `web-app/` and `cli/`, each with `skill.json`, `prompts/`, `scaffold/`, `fixtures/`.
- `templates/`: Server scaffold templates (server.ts, docker-compose, dotenv).
- `docs/`: `DESIGN.md` (authoritative), plus historical specs (`feature_clarification_mode.md`, `scaffolding_interview.md`).
- `test/`: Fixture projects — `guild/` and `todo/` (specs + generated results as golden data).

**A typical verbo project (source specs):**

- `main.md`: entry point, high-level description.
- `models/`: one `.md` per data model (web-app).
- `routes.md`: API endpoints (web-app).
- `ports.md`: declared external interactions (cli).
- `verbo.json` *(planned)*: declares skills, provider, model, output dir.

**Generated artifacts:**

- `.verbo/`: intermediate artifacts, prompt/response logs, `.verbo/clarifications/` audit trail.
- `clarifications.json`: optional file from the `clarify` command.

## 4. Workflow

The end-to-end process (planned core; the manifest pipeline replaces the older single-shot steps):

1.  **Specification:** A developer writes the application logic in `.md` files as described above.
2.  **Extract:** One LLM call parses the markdown corpus into a validated **manifest** (types, functions, ports, behavior rules) with source maps.
3.  **Lint (deterministic):** Required files, unique names, resolvable references, no duplicate/ambiguous routes. `CRITICAL` issues block compilation.
4.  **Clarify / Interview:** Passive `clarify` (→ `clarifications.json`) and interactive `interview` (severity-ordered Q&A that **writes answers back into the `.md` files**, audited under `.verbo/clarifications/`). Re-extract and re-clarify until clean.
5.  **Compile (skill pipeline):** Each step consumes the manifest and generates an artifact (e.g., sql → models → db-client → routes for `web-app`; pure-function core for `cli`).
6.  **Verify + retry:** Each generated artifact is checked (`deno check`, SQL parse, route coverage). Failures are fed back to the model with bounded retries (max 3). Prompts and raw responses are logged to `.verbo/`.
7.  **Scaffold:** Skill scaffolds + generated artifacts are assembled into the output project (server/CLI entrypoint, docker-compose, dotenv as applicable).
8.  **Output:** The complete, runnable Deno application source code (SQL, TypeScript, etc.) is saved to the output directory.

## 5. Technology Stack

- **Tool implementation:** Deno + TypeScript, functional style, no fp-ts/Effect (locked decision).
- **Specification language:** Structured Natural Language (primarily English) in Markdown.
- **AI Providers:**
    - Local: Ollama
    - Cloud: Google Gemini, OpenAI, Anthropic
- **Generated application stack (web-app skill):**
    - Runtime: Deno
    - Language: TypeScript
    - Framework: Oak (HTTP), postgres (psql)
    - Database: PostgreSQL
- **Planned dependency for verification:** `pg-query-ng` (npm specifier) for SQL parsing.

## 6. Project Goals & Roadmap

- **Current Status:** Experimental proof-of-concept for REST API generation exists (see `test/guild/results/`), plus a basic `clarify` command. The project is being rebuilt around the design in `docs/DESIGN.md`: general core (extract → manifest → lint → clarify → compile → verify → scaffold) + composable skills.
- **Roadmap:** See `docs/roadmap.md` and `docs/DESIGN.md` §12 for the phased plan (Phases 0–5). Deferred items: interview spec-authoring agent, web shell (browse/graph/deploy), additional skills, per-model caching.

## 7. How to Assist

When asked to contribute to or use `verbo-lang`:

- **Read the design first:** `docs/DESIGN.md` is the authoritative architecture reference. `docs/roadmap.md` summarizes the phases.
- **To understand the spec format:** Refer to the fixture examples under `test/guild/` and `test/todo/` (web-app) and the planned `ls` fixture (cli). The syntax is intentionally flexible — markdown conventions, not a grammar.
- **When generating Verbo specs (`.md` files):** Follow the structure and style of the fixtures. Be descriptive and clear about properties, relationships, routes, and behavior. Anchor to known conventions/tools ("follow REST conventions", "behaves like GNU ls") — it's the single most effective disambiguation technique. Consider running `clarify` before compiling.
- **When working on the tool:** The priority is the redesign in `docs/DESIGN.md` — phases 0–5. The core is target-agnostic (manifest, linter, verify, clarify); skills are the pluggable backends. Do not extend the old hardcoded `src/compiler/*` targets.
- **To improve code generation:** Refine the prompt files. In the planned layout these live under `skills/<skill>/prompts/`. Improve few-shot examples and verification checks; do **not** put code that a model may copy verbatim (a bug in a prompt example becomes a bug in the output).