# Verbo Roadmap

> **Superseded** by [docs/DESIGN.md](./DESIGN.md) as of the 2026 redesign. This file summarizes the locked plan; DESIGN.md is authoritative.

## Locked direction

- **Specification engineering, not code generation.** Verbo validates specifications; it does not generate application code.
- **Flavored Markdown is the source of truth.** Lightweight conventions (`<!-- verbo:model -->`, `[[WikiLinks]]`, constraint annotations) on standard `.md`.
- **Deterministic parser** extracts structure from flavored `.md` — zero LLM, zero hallucination.
- **TypeScript types as validation output.** `types.verbo.ts` checked by `deno check`. No custom manifest or validator.
- **Constraint assertions** for value-level checks that TypeScript can't express.
- **Interactive clarify/interview** that writes answers back into the spec files, with an audit trail.
- **Implementation: Deno + TypeScript, functional style, no fp-ts/Effect.**
- **Keep the content, replace the glue** (prompts, fixtures, docs carry over; compilers, manifests, scaffolds are dropped).

## Phases (from DESIGN.md §14)

| Phase | Scope | Gate |
|---|---|---|
| 0 | Clean up: remove codegen code (`src/compiler/*`, `src/manifest/*`, `scaffold.ts`, `templates/`); keep providers, prompts, fixtures | `deno check` green, tests pass |
| 1 | Deterministic parser for flavored `.md` (directives, properties, constraints, wiki-links, relationships) | Parser tests green on guild + todo fixtures (no LLM) |
| 2 | Type generator (`types.verbo.ts`) + `deno check` integration | Generated types pass `deno check` on guild + todo fixtures |
| 3 | Constraint assertion generator (`.verbo/validate.ts`) + data validation | Assertions catch deliberate constraint violations in fixtures |
| 4 | Interactive clarify/interview with write-back + audit trail | Interview writes answers, re-clarify converges |
| 5 | CLI polish: `verbo check` and `verbo interview` commands; test suite; CI | All green |

## Deferred

- Code generation (separate project if ever).
- Web shell (browse specs, model graph, edit in-browser).
- LLM-facing API / MCP server.
- Interview spec-authoring agent.
- Per-model caching.
