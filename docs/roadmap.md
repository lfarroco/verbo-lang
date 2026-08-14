# Verbo Roadmap

> **Superseded** by [docs/DESIGN.md](./DESIGN.md) as of the 2026 redesign. This file summarizes the locked plan; DESIGN.md is authoritative.

## Locked direction

- **Specification engineering, not code generation.** Verbo validates specifications; it does not generate application code.
- **Natural language as input.** Plain `.md` files — no syntax, no annotations. The LLM extracts structure from prose.
- **LLM as extractor with repair loop.** Extraction failures (deno check errors) are fed back for retry.
- **TypeScript types as validation output.** `types.verbo.ts` checked by `deno check`.
- **Constraint assertions** for value-level checks that TypeScript can't express.
- **Interactive clarify/interview** that writes answers back into spec files, with an audit trail.
- **Implementation: Deno + TypeScript, functional style.**

## Phases (from DESIGN.md §14)

| Phase | Scope | Gate |
|---|---|---|
| 0 | Clean up: remove codegen code; keep providers, prompts, fixtures | ✓ Done |
| 1 | Extraction prompt + repair loop: LLM extracts structure from natural language; deno check failures feed back for retry | Extraction produces valid types for classroom fixture |
| 2 | Type generator: produce `types.verbo.ts` from extracted structure | Generated types pass `deno check` on fixture specs |
| 3 | Constraint assertion generator: produce `.verbo/validate.ts` | Assertions catch deliberate violations in fixtures |
| 4 | Interactive clarify/interview with write-back + audit trail | Interview writes answers, re-clarify converges |
| 5 | CLI polish: `verbo check` and `verbo interview` commands; test suite; CI | All green |

## Deferred

- Code generation (separate project if ever).
- Web shell (browse specs, model graph, edit in-browser).
- LLM-facing API / MCP server.
- Interview spec-authoring agent — now planned, see
  [docs/specs-from-zero.md](./specs-from-zero.md).
- Reverse spec extraction from an existing codebase — future plan (gated on
  requisites), see [docs/capture-from-code.md](./capture-from-code.md).
