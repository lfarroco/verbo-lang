# Verbo Roadmap

> **Superseded** by [docs/DESIGN.md](./DESIGN.md) as of the 2026 redesign. This file now summarizes the locked plan; DESIGN.md is authoritative.

## Locked direction

- **General core + composable skills.** The core (extract → manifest → lint → clarify → compile → verify → scaffold) is target-agnostic. First-class skills: `web-app` and `cli`.
- **Markdown is the source of truth; the manifest is a disposable IR.**
- **Every compile step is verified** (`deno check`, SQL parse, route coverage) with a bounded retry loop.
- **Interactive clarify** that writes answers back into the spec files, with an audit trail.
- **Implementation: Deno + TypeScript, functional style, no fp-ts/Effect.**
- **Keep the content, replace the glue** (prompts, fixtures, templates, docs carry over).

## Phases (from DESIGN.md §12)

| Phase | Scope |
|---|---|
| 0 | Environment & hygiene: install Deno, fix prompt bugs, add regression fixtures |
| 1 | Manifest types + schema validation; extraction with repair loop; deterministic linter |
| 2 | Verification module + pipeline retry loop |
| 3 | Interactive clarify/interview with write-back + audit trail |
| 4 | Skill system: refactor rest-server → `web-app` skill; add `cli` skill + `ls` fixture |
| 5 | Test suite (`deno test` with mock AI provider); Makefile/CI on Deno only |

## Deferred

- Interview spec-authoring agent (idea A): AI that interviews the developer and writes/edits the `.md` specs.
- Web shell (idea B): browse specs, connection graph, deploy.
- Additional skills (platform-game is demo-only; dashboards possible later).
- Per-model slicing/caching.
