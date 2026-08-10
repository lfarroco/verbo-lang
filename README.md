# verbo

A specification engineering tool. Write data models in flavored Markdown, validate them deterministically, and resolve ambiguities through AI-assisted interviews.

> **Status (2026 redesign):** Verbo has pivoted from code generation to **specification engineering**. It validates specifications — not generates application code. Flavored Markdown specs are the source of truth; a deterministic parser extracts structure; TypeScript types and constraint assertions are generated as validation output; ambiguity is resolved through an interactive `interview` that writes answers back into the specs. **The authoritative design reference is [`docs/DESIGN.md`](./docs/DESIGN.md).**

## Table of Contents

- [Demo](#demo)
- [How it works](#how-it-works)
- [Flavored Markdown](#flavored-markdown)
- [Getting Started](#getting-started)
- [Development](#development)

## Demo

Given a directory with flavored Markdown files:

### models/hero.md

```markdown
<!-- verbo:model -->

Heroes are the playable characters in the RPG Guild Simulator.

## Properties
- `name`: string (required)
- `level`: number [1..100]
- `class`: [Warrior, Mage, Rogue, Cleric]
- `experience`: number (>=0)
- `health`: number [10..]
- `attack`: number (>0)
- `location`: → [[Location]]

## Relationships
- A hero can have multiple → [[Item]].
- A hero belongs to a → [[Location]].
```

### models/item.md

```markdown
<!-- verbo:model -->

## Properties
- `name`: string (required)
- `value`: number (>0)
```

### models/location.md

```markdown
<!-- verbo:model -->

## Properties
- `name`: string (required)
- `description`: string

## Relationships
- A location can have multiple → [[Monster]].
```

### models/monster.md

```markdown
<!-- verbo:model -->

## Properties
- `name`: string (required)
- `level`: number [1..100]
- `health`: number (>0)
- `attack`: number (>0)

## Relationships
- A monster can drop multiple → [[Item]].
```

When checked, Verbo:

1. **Parses** all `.md` files deterministically — no LLM, instant.
2. **Generates `types.verbo.ts`** — TypeScript type definitions for all models, validated by `deno check`.
3. **Generates `.verbo/validate.ts`** — constraint assertions that catch violations like `health: 5` when the spec says `[10..]`.
4. **Runs clarify** — an AI-powered pass that finds vague language, contradictions, and undefined references.
5. **Offers interview** — interactive resolution of ambiguities, with answers written back into the `.md` files.

## How it works

Verbo has two layers: a **deterministic core** that processes structure, and an **AI-assisted layer** that resolves ambiguity.

### Deterministic core (zero LLM, zero cost)

1. **Parser** — scans flavored `.md` files for `<!-- verbo:model -->` and `<!-- verbo:data -->` directives, extracts properties, constraints, wiki-links, and relationships.
2. **Type generator** — produces `types.verbo.ts` from the parsed structure. `deno check` validates the type graph: undefined references, circular types, and type mismatches are caught by the TypeScript compiler.
3. **Assertion generator** — produces `.verbo/validate.ts` for value-level constraints (ranges, enumerations, required fields). Running it checks that spec-defined data satisfies all declared constraints.

### AI-assisted layer (LLM-powered)

4. **Clarify** — one LLM call analyzes the full spec for vagueness, contradictions, and missing definitions. Results in `clarifications.json`.
5. **Interview** — interactive Q&A that walks through severity-ordered ambiguities and writes resolutions back into the `.md` files, with a full audit trail under `.verbo/clarifications/`.

The loop (parse → generate → clarify → interview → repeat) continues until the spec is clean.

## Flavored Markdown

Verbo specs are standard `.md` with lightweight conventions:

| Convention | Example | Purpose |
|---|---|---|
| `<!-- verbo:model -->` | File-level directive | Marks a data model for the parser |
| `<!-- verbo:data -->` | File-level directive | Marks example/test data |
| `` `name`: type `` | `` `level`: number `` | Property with type annotation |
| `[min..max]` | `[1..100]` | Range constraint |
| `(>0)`, `(required)` | `(>=0)` | Comparison / required constraint |
| `[A, B, C]` | `[Warrior, Mage]` | Enumeration |
| `→ [[Model]]` | `→ [[Location]]` | Typed cross-reference |

Files without directives are free-form prose — the clarify system still analyzes them, but the deterministic parser ignores them.

For a complete guide, see [**the Verbo language specification**](./VERBO_SPEC.md) and the [**design reference**](./docs/DESIGN.md).

## Getting Started

A basic project looks like this:

```
- models/
  - user.md
  - post.md
  - ... other model files
main.md
```

### Running Verbo

```bash
# Check specs: parse, generate types, validate constraints, run clarify
deno run -A main.ts check

# Resolve ambiguities interactively
deno run -A main.ts interview
```

You can run Verbo with your local AI using Ollama, or with Gemini, Anthropic, or OpenAI (API key required). Create a `.env` file:

```
GEMINI_KEY=...
OPENAI_KEY=...
ANTHROPIC_KEY=...
```

See the `Makefile` for more commands.

### Clarify Mode

Before finalizing your specs, ask the AI to analyze for ambiguities:

```bash
deno run -A main.ts clarify
```

This creates a `clarifications.json` file with potential issues, allowing you to refine your specifications before sharing them.

## Development (Docker)

The recommended way to develop Verbo is inside Docker:

```bash
# one-time: build the dev image
docker compose build dev
cp .env.example .env

# run deno in the dev container
./dev --version
./dev test
./dev check main.ts
./dev fmt --check

# open a shell in the container
./dev shell

# optional: local AI provider
./dev ollama start && ./dev ollama pull codegemma
```

Everything is bind-mounted, so your edits on the host are live inside the container. A VS Code dev container is available at `.devcontainer/`.

## Roadmap

See [docs/roadmap.md](./docs/roadmap.md) and [docs/DESIGN.md](./docs/DESIGN.md) §14 for the phased plan. The focus is on specification engineering — validated specs, not generated code.
