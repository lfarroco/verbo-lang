# Verbo Language Features — Catalog & Roadmap

> **Status:** Working catalog of Verbo's spec-language features: what exists,
> the quick wins implemented, what is planned, and what is explicitly rejected.
> The authoritative design remains [`docs/DESIGN.md`](./DESIGN.md). Where this
> document and DESIGN.md conflict, DESIGN.md wins.

## 1. Design principle

Verbo specs are plain Markdown — natural language is the input, the LLM is the
extractor, and verification (`deno check` + generated assertions) catches
mistakes. Every "feature" below is a *vocabulary addition*: a concept the LLM
can recognize in prose and the generators can verify. The user never writes
syntax.

Adding a feature touches the same pipeline in the same places:

1. `src/extract/types.ts` — the extracted-spec schema (`ConstraintKind`,
   `Property`, ...)
2. `src/prompts/extract.md` — teach the LLM to recognize the prose
3. `src/generator/types.ts` — how it shows up in `types.verbo.ts`
4. `src/generator/assertions.ts` — what `.verbo/validate.ts` enforces
5. tests (+ a fixture when the behavior needs an end-to-end example)

## 2. Current feature surface

| Feature | Status | Notes |
|---|---|---|
| Models | ✅ | named property lists |
| Relationships | ✅ | model-reference properties: single (`Teacher`) or many (`Class[]`) |
| Functions | ✅ | signatures → TS contracts (no implementation) |
| required / optional | ✅ | required is asserted; optional → `?` |
| nullable | ✅ quick win | `\| null` in types; assertions skip null |
| enum | ✅ | scalar → union type; asserted |
| range / minimum / maximum / positive | ✅ | numeric, asserted |
| format | ✅ | email/url/uuid/date hint |
| minLength / maxLength | ✅ quick win | asserted |
| pattern | ✅ quick win | asserted via `RegExp` |
| size | ✅ quick win | list cardinality; asserted |
| default | ✅ quick win | `@default` tag in types |
| unique | ✅ quick win | `@unique` tag in types |
| primaryKey | ✅ quick win | `@primaryKey` tag in types |
| `main.md` project context | ✅ | free-form prose |
| Routes (`guild/routes.md`) | ⚠️ prose only | described but not yet extracted |

## 3. Quick wins (implemented)

These close gaps that already existed in the fixtures' prose — facts the LLM
could read but Verbo silently dropped:

| Prose | Extracted | Generated |
|---|---|---|
| "defaults to 'active'" | `{kind:"default", value:"active"}` | `/** @default "active" */` |
| "each student has a unique email" | `{kind:"unique"}` | `/** @unique */` |
| "identified by an id" | `{kind:"primaryKey"}` | `/** @primaryKey */` |
| "at least 3 characters" | `{kind:"minLength", value:3}` | asserted |
| "at most 80 characters" | `{kind:"maxLength", value:80}` | asserted |
| "must match `^[A-Za-z]`" | `{kind:"pattern", value:"^[A-Za-z]"}` | asserted |
| "1 to 30 students" (on a list) | `{kind:"size", min:1, max:30}` | asserted + `@size` |
| "may be null" | `nullable: true` | `\| null` |

Notes:

- **Documentational vs assertable.** `default`/`unique`/`primaryKey` carry no
  per-value check (uniqueness needs collection context), so they are documented
  as JSDoc tags on the generated type. `minLength`/`maxLength`/`pattern`/`size`
  are enforced by `.verbo/validate.ts`.
- **Nullable ≠ optional.** `optional` = the key may be absent (`?`); `nullable`
  = the value may be null (`\| null`). Both can combine. `required` wins over
  both at extraction time.

## 4. Planned features (tiered)

### Tier 1 — constraint vocabulary (medium effort, high value)

- [ ] **Array element constraints** — "each rating is 1 to 5". Needs nested
      constraints on `Property`.
- [ ] **Ordered vs unordered lists** — the `ls` fixture's sort prose needs
      this.
- [ ] **Cross-property constraints** — "endDate after startDate"; conditional
      required ("if paid, paymentDate is required"). Hardest of the tier.

### Tier 2 — relationship semantics (data modeling, zero OOP)

- [ ] **Declared relationships with inverses** — declare "a class is taught by
      one teacher; a teacher teaches many classes" once and derive the
      back-reference, preventing the two-sides-drift bug.
- [ ] **Lifecycle semantics** — cascade / restrict / orphan when a referenced
      model is removed.

### Tier 3 — behavioral contracts (extend functions)

- [ ] **Pre/post conditions** — "when the list is empty the average is 0".
- [ ] **State machines / allowed transitions** — "active → completed, never
      back".
- [ ] **Operations / state changes** — create/update/delete semantics; the
      `guild/routes.md` interactions are prose for this today.

### Tier 4 — type-level expressiveness (data, not OOP)

- [ ] **Named value types / aliases** — "`EmailAddress` is a string, email
      format". Reuse constraints without copying prose.
- [ ] **Sealed unions** — "a `Pet` is either a `Cat` or a `Dog`". Data-level
      one-of; the non-OOP replacement for inheritance.
- [ ] **Derived fields** — "`fullName = firstName + lastName`".

### Tier 5 — scale

- [ ] **Namespaces / domains** — group models ("billing", "inventory").
- [ ] **Cross-spec imports** — reference another Verbo project's model.
- [ ] **Deprecation / status metadata** — "deprecated: use X".

## 5. Explicitly rejected (OOP)

| Feature | Why rejected | Replacement |
|---|---|---|
| Inheritance / `extends` | OOP; speculative generalization | aliases + composition + sealed unions |
| Methods on models | behavior belongs in functions, not data | top-level functions + state transitions |
| Interfaces / polymorphism | references are already concrete | — |
| Encapsulation / visibility | a spec is documentation, not an API for a compiler | — |
| Generics | premature at this scale | — |

## 6. Recommended order

> defaults → unique → identity → inverse relationships → pre/post conditions →
> aliases → sealed unions → constraint polish (element / ordered /
> cross-property) → state machines → scale features.

The quick wins (§3) are the first batch: `default`, `unique`, `primaryKey`,
`minLength`, `maxLength`, `pattern`, `size`, `nullable`. The next batch is
inverse relationships + pre/post conditions — the two most common spec-bug
classes.
