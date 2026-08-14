# Capture From Code — Viability Study & Future Plan

> **Status:** Future plan. This document studies whether Verbo can derive an
> initial spec corpus from an existing repository — *code in, prose `.md` out* —
> and, if so, how to build it. It is the mirror image of
> [`docs/specs-from-zero.md`](./specs-from-zero.md) (chat → first prose) applied
> to brownfield code: *existing code → first prose*. It is **not active work**;
> it is gated on the requisites in §9. The authoritative design remains
> [`docs/DESIGN.md`](./DESIGN.md).

---

## 1. Verdict

**Viable — as a scoped MVP, with one serious risk (fidelity to the code) and one
real engineering cost (scale).**

- The reverse direction is a **new front-end for the existing loop**, exactly the
  pattern `specs-from-zero.md` establishes for `verbo new`:

  ```
  scan/rank code → LLM code→prose → write main.md + models/*.md
      → runCheck (extract → types → deno check) → clarify → interview → repeat
  ```

  The moment seed `.md` files exist, every existing command (`check`, `clarify`,
  `interview`) works on them **unchanged**. The LLM code→prose step is the only
  new magic.
- It is **not as cheap as `verbo new`**, because:
  - real repos exceed the single-call context budget — the current pipeline
    aggregates the whole corpus into one prompt (`aggregateFilesForPrompt`),
  - real type systems are richer than Verbo's vocabulary — extraction must be a
    **deliberate lossy projection**, not a guess,
  - and the existing `deno check` repair loop validates **internal consistency,
    not fidelity to the actual code** — a spec can be self-consistent yet wrong
    about the codebase. Fidelity needs a dedicated mitigation (§4.4).

---

## 2. Definition

### 2.1 Two readings — which one we mean

- **Reading A (product):** code → Verbo-convention prose `.md` corpus
  (`main.md`, `models/*.md`, `functions.md`). The prose is the product; the user
  owns, reviews, and refines it. **This is the target.**
- **Reading B (pipeline):** code → structured `ExtractedSpec` JSON directly,
  skipping prose. Rejected: violates DESIGN §3.4 ("the `.md` file IS the
  output") and produces an artifact nothing downstream wants.

Reading A satisfies every locked decision: we produce prose (no codegen, DESIGN
§3.1), the prose becomes the single source of truth (§3.2), and the output needs
no new syntax or artifact types (§3.4).

### 2.2 What it is not

- Not code generation, scaffolding, or templates (DESIGN §4). `verbo capture`
  only *reads* code and *writes* Markdown. The old codegen-era
  `docs/scaffolding_interview.md` is explicitly **not** revived (same call as
  `specs-from-zero.md` §2).
- Not a replacement for `verbo new` — the two are complementary: chat authoring
  for greenfield, code capture for brownfield/legacy.
- Not a documentation generator — the output is a *spec*, in the conventions the
  extractor rewards, validated by the real pipeline.

---

## 3. Fit with the architecture

- **"The `.md` file IS the output"** (DESIGN §3.4) — capture writes the same
  prose files a human would have written, seeded from the code.
- **"Ambiguity as compile error"** (DESIGN §1) — the extracted prose inherits
  the full clarify/interview loop. Spec-vs-code divergence surfaces as
  HIGH/CRITICAL questions; the human resolves them with write-back. This is the
  realistic brownfield workflow no current command supports.
- **Validation is source-language agnostic** — the generator always emits
  TypeScript and `deno check` runs on the *generated* file, so even a
  Python/Go/Ruby repo's extraction gets a real consistency check.
- **No syntax added to the product** (DESIGN §3.2) — the prose is plain
  Markdown; conventions only, same as hand-written specs.

---

## 4. Reuse surface vs. missing pieces

### 4.1 Already exists (reuse verbatim or near-verbatim)

| Need | Where |
|---|---|
| 5 AI providers + prompt/response logging | `src/api/*`, `extract()` pattern under `.verbo/extract/` |
| Defensive JSON parsing/normalization | `parseExtraction` / `normalizeSpec` in `src/extract/extractor.ts` |
| Corpus assembly for the downstream loop | `aggregateFilesForPrompt` / `listFilesAt` in `src/utils.ts` |
| Extract→types→`deno check` repair loop | `runCheck` / `runDenoCheck` in `src/check/pipeline.ts` |
| Write-back + UX helpers | `diffPreview`, `preserveBulletPrefix`, `trimTrailingOverlap`, `sessionId`, `defaultAsk` in `src/interview/engine.ts` |
| Ambiguity gate + interactive refinement | `src/commands/clarify.ts`, `runInterview` (severity flags, audit trail) |
| Extracted-spec schema + vocabulary | `src/extract/types.ts`, `src/prompts/extract.md` |
| Precedent for "new front-end → seed prose → existing loop" | `docs/specs-from-zero.md` |

### 4.2 Missing (the actual work)

1. **Repo scanner/filter** — `listFilesAt` skips dot-dirs only. Capture needs an
   extension allowlist (`.ts/.tsx` types, SQL migrations, OpenAPI/JSON schema,
   ORM entities), gitignore/node_modules/vendor exclusion, and **importance
   ranking** so the context budget lands on spec-rich files first.
2. **Scale: chunked multi-pass** — the pipeline is one LLM call over the whole
   corpus today. A real repo needs per-module extraction + a **merge/deconflict
   pass** (same `Student` in two files, naming drift). This is the only genuinely
   new subsystem.
3. **The code→prose prompt** (`src/prompts/capture.md`) — inverse of
   `extract.md`; few-shots TS/SQL/OpenAPI → Verbo-convention prose. Biased toward
   the conventions `extract.md` already parses (DESIGN §5.2) to minimize
   round-trip drift.
4. **Fidelity verification** (§4.4) — the biggest risk; the current repair loop
   cannot detect a plausible-but-wrong spec.
5. **CLI command + guard** — `verbo capture` must refuse to clobber an existing
   spec dir (mirror of `verbo new`'s empty-dir guard).

### 4.3 Projection rules (lossy by design)

Verbo's vocabulary is primitives + `date` + arrays + model refs + 16 constraint
kinds + function contracts (`src/extract/types.ts`). Real code has more. The
prompt must map explicitly:

| Real code | Verbo projection |
|---|---|
| `interface` / `type` object literals | Model with `Properties:` bullets |
| `enum` / string-literal unions | `enum` constraint / union type |
| numeric ranges in schemas/validators (`min`/`max`, `1..30`) | `range` / `minimum` / `maximum` prose ("9 to 12") |
| regex/format validators | `format` / `pattern` prose |
| `optional?` / `null` | `optional` / `nullable` prose |
| FK/relation columns, API payload refs | single / many model-reference properties |
| `Date` / `string` columns | `date` / `string` |
| **Generics, unions, intersections, inheritance, overloads, methods** | **Project away** — Verbo explicitly rejects them for specs (`docs/language-features.md` §6). Do not invent equivalents. |

### 4.4 Fidelity verification (the mitigation ladder)

| # | Check | Cost | Scope |
|---|---|---|---|
| 1 | **Prompt self-check round** — second LLM pass: given draft spec + source files, report every model/property it cannot find in code | cheap (1 extra call) | all languages |
| 2 | **Deterministic spot-check** — grep/parse source for each extracted property name, enum value, range, default; flag missing ones | free (no LLM) | all languages |
| 3 | **Type-level cross-check** — scratch file importing real exported TS types + generated `types.verbo.ts`, compile-time assignment checks | medium | TS repos with exported types |
| 4 | **Human gate** — always run `clarify` / `interview` after capture; spec-vs-code divergence surfaces as HIGH/CRITICAL questions | free | all |

MVP ships 1 + 2 + 4; 3 is Phase E.

---

## 5. Design

### 5.1 Command

```
verbo capture --code DIR [--spec-dir SPEC_DIR] [-a PROVIDER] [-m MODEL] [-e ENVFILE]
              [--ext ts,sql,yaml] [--fidelity spot]
```

- `--code` is the repository to read; the spec lands in `--spec-dir`, which
  defaults to `--code` when writable and to `<code>/verbo/` otherwise
  (read-only repos), `--spec-dir` to override.
- Refuses a `--spec-dir` that already contains `.md` specs (`--force` to
  override) — capture bootstraps, it never clobbers.
- Reuses `-a/-m/-e` flag handling and provider adapters verbatim.
- **Naming:** the internal pipeline step is already called *extract* — a CLI
  command named `verbo extract` would be confusing. **`capture`** is the working
  name; `import` / `reverse` are alternatives (decision in §9, R4).

### 5.2 Pipeline

```
1. scan:   rank spec-rich files (types/entities/schemas/migrations first), respect
           .gitignore, drop generated/vendor/dot dirs
2. draft:  per-chunk LLM call (capture.md) → partial SpecCorpus prose
           [small repos: single call — the MVP]
3. merge:  deconflict identical models across chunks, reconcile naming, keep a
           provenance map (model → source files) for the fidelity checks
4. write:  main.md + models/*.md into --spec-dir (diffPreview each)
5. verify: fidelity rounds 1 + 2 (§4.4), then full runCheck — the true
           prose → extract → deno check round trip
6. handoff: run clarify; print remaining-ambiguity count + severity breakdown;
           suggest `verbo interview --recheck`. Audit trail under
           `.verbo/capture/` (capture-YYYYMMDD-HHMMSS.jsonl + capture-log.md).
```

Steps 2–4 are the MVP; 3's chunking is the Phase D scale-up; 6 reuses `runCheck`
and `clarify` unchanged.

### 5.3 Prompt design (`src/prompts/capture.md`)

- **Role:** reverse-spec engineer — read code, write the prose spec a developer
  would have written.
- **Write extraction-friendly prose** — the exact conventions the extractor
  rewards (property bullets `- name: description`, explicit ranges, enums,
  defaults, uniqueness, identity, cross-model references). Minimizes round-trip
  drift: the capture model writes in the dialect `extract.md` already parses
  reliably.
- **Vocabulary reference** from `src/extract/types.ts` + the projection table
  (§4.3).
- **Fidelity rules:** ground every model/property in code you can point to; mark
  uncertain items `(verify)` instead of guessing; never invent helpers from
  method bodies (functions come only from real exported helpers, mirror of
  `extract.md`'s no-invention rule).
- **Scope note:** models only. `routes.md` / `workflows.md` extraction is not
  supported by `verbo check` today (`docs/language-features.md` §2), so capture
  does not emit them either.
- **Few-shot examples:** TS `interface` + SQL `CREATE TABLE` + OpenAPI schema →
  the classroom/todo prose style.
- **Output contract:** a fenced JSON envelope (mirror of `parseExtraction`
  conventions) carrying per-file prose.

### 5.4 Failure modes this design assumes

- Repo too big for one call → chunked pass (Phase D). The MVP documents its size
  limit and ranks files so the *first* N files are the spec-rich ones.
- Repo has no type-rich files (pure scripts) → capture still produces `main.md`
  context + whatever models are inferable; clarify surfaces the rest.
- Repo changes after capture → the spec is a snapshot; the audit trail records
  what was captured when.

---

## 6. Viability risks & mitigations

| Risk | Mitigation |
|---|---|
| **Hallucinated models/properties** (spec is self-consistent but wrong) | Fidelity ladder §4.4 (self-check round + deterministic spot-check + human gate); `(verify)` marker rule in the prompt; `diffPreview` per write. |
| **Prose→structure round-trip drift** | Draft in extraction-friendly prose; full `runCheck` re-extraction gate at the end (same gate as `verbo new` §3.3). |
| **Token/context limits on real repos** | Importance-ranked file selection; chunked multi-pass with merge (Phase D); MVP states its size ceiling. |
| **Lossy projection hides real constraints** | Deliberate projection table (§4.3); the clarify loop surfaces dropped invariants as questions — the first capture is a starting draft, not a finished spec. |
| **Two sources of truth after capture** (code + prose) | Capture is a bootstrapper: the human decides the prose becomes the spec (normal Verbo workflow — code refactored to match) or abandons it; the interview pass resolves divergence. |
| **Clobbering an existing spec dir** | `--spec-dir` guard + `--force`. |
| **Non-deterministic / untestable** | Injectable `aiProvider`; pure unit-tested scan/merge/parse; fixtures (same pattern as `runInterview` / pipeline tests). |
| **Command-name collision with the internal "extract" step** | Ship as `verbo capture`; `import` / `reverse` documented alternatives. |

---

## 7. Implementation plan

### Phase A — Scanner + prompt (small)

- [ ] **A1.** `src/capture/scan.ts` — rank/filter spec-rich files: extension
  allowlist, gitignore/vendor/dot-dir exclusion, importance ranking (pure,
  unit-testable).
- [ ] **A2.** `src/prompts/capture.md` — code→prose prompt (§5.3), few-shot
  TS/SQL/OpenAPI fixtures.
- [ ] **A3.** `src/capture/parse.ts` — defensive envelope parser (mirror of
  `extractor.parseExtraction`, so it is pure and unit-testable).

### Phase B — Engine + CLI (the MVP core)

- [ ] **B1.** `src/capture/engine.ts` — `runCapture(options)`: scan → draft →
  write `.md` (reuse `diffPreview`, `sessionId`) → audit trail under
  `.verbo/capture/`.
- [ ] **B2.** `main.ts` — `capture` command + help entry + `--spec-dir` guard.

### Phase C — Fidelity + handoff

- [ ] **C1.** Self-check round (§4.4 #1): second LLM pass over draft + sources.
- [ ] **C2.** Deterministic spot-check (§4.4 #2): property/enum/range/default
  grep against sources; report misses.
- [ ] **C3.** On done: full `runCheck`; print pass/fail with errors; run
  `clarify`; print remaining ambiguities + severity breakdown; hint
  `verbo interview --recheck`.

### Phase D — Scale: chunked multi-pass (later)

- [ ] **D1.** Chunked per-module extraction with a **merge/deconflict** pass and
  a provenance map (model → source files).
- [ ] **D2.** Cross-file relationship pass after merge (references visible only
  after the full model set exists).

### Phase E — Type-level cross-check (later, TS-only)

- [ ] **E1.** §4.4 #3: scratch file importing real exported TS types +
  generated `types.verbo.ts`; compile-time assignment checks via the existing
  `runDenoCheck` subprocess.

### Tests + fixture

- [ ] **T1.** `src/capture/scan_test.ts` — ranking/filtering cases.
- [ ] **T2.** `src/capture/parse_test.ts` — envelope parsing edge cases.
- [ ] **T3.** `test/capture/` fixture — a small TypeScript repo whose real types
  the smoke test compares against; a smoke test wiring the loop to the pipeline
  (mirror `src/check/pipeline_test.ts`).

---

## 8. Gates

- **G1** — `deno test` green (new + existing suites).
- **G2** — `deno check main.ts src/capture/*.ts` green.
- **G3** — End-to-end with a real provider (e.g. `verbo capture --code <fixture>`
  with `-a deepseek -m deepseek-v4-flash`): produces plain `.md`; `verbo check`
  passes; `verbo clarify` leaves few/no CRITICAL/HIGH; `interview --recheck`
  converges.
- **G4** — Output is ordinary `.md` with no new syntax and no new artifact
  types; all existing commands consume it unchanged.
- **G5** — Fidelity: on the fixture, the deterministic spot-check (§4.4 #2)
  reports **no** invented properties.

---

## 9. Requisites — when this becomes active work

This plan is **gated**. It becomes active when these are met:

- [ ] **R1. Core loop stable.** Phases 1–5 of the current milestone (`check`,
      `clarify`, `interview`; DESIGN §15) shipped, tested, and CI-green. Capture
      leans on every one of them; a moving core invalidates it.
- [ ] **R2. Extraction vocabulary settled.** `src/extract/types.ts` +
      `src/prompts/extract.md` stable enough that `capture.md` can be written
      *against* them. The two prompts must be maintained in lockstep, so capture
      should not start while the vocabulary is still churning (Tier 1–4 language
      features, `docs/language-features.md` §4).
- [ ] **R3. `verbo new` landed (recommended, not blocking).** `specs-from-zero`
      implements the shared "new front-end → seed prose → existing loop" patterns
      (envelope parsing, write-back, `--dir` guard, audit trail). Capture reuses
      them; doing both from scratch doubles the plumbing.
- [ ] **R4. Product decisions made.** Command name (`capture` vs
      `import`/`reverse`); MVP language scope (TS/TSX + SQL + OpenAPI first vs
      multi-language); fidelity depth (prompt+spot-check vs type-level
      cross-check in v1).
- [ ] **R5. (Later) Tier 5 scale features.** Namespaces/domains and cross-spec
      imports (`docs/language-features.md` Q14/Q15) make large-repo capture much
      cleaner; not blocking for the MVP.

---

## 10. Out of scope / deferred

- Code generation, scaffolding, templates (DESIGN §4).
- Web UI or anything non-terminal.
- `routes.md` / `workflows.md` capture — models-only until `verbo check` supports
  more file kinds (same deferral as `specs-from-zero.md` §7).
- One-shot perfect extraction — the first capture is a starting draft; the
  clarify/interview loop is the finishing pass.
- Multi-language constraint mining beyond the MVP scope decision in R4.

