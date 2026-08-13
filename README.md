# verbo

A specification engineering tool. Describe data models in loose natural
language. Verbo interviews you to resolve ambiguity, writing each answer back
into your files — the same `.md` becomes progressively more precise until it's
ready for an AI coding tool to consume.

You write loose Markdown. Verbo's interview loop asks questions and writes
answers directly into your files, refining them in place. The end result is
the same file you wrote, now unambiguous enough for Claude Code, Cursor,
or Copilot to read and generate code from. TypeScript types are generated
internally for verification only.


## Table of Contents

- [Demo](#demo)
- [How it works](#how-it-works)
- [Writing specs](#writing-specs)
- [Getting Started](#getting-started)
- [Development](#development)

## Demo

Given plain Markdown files describing your models and helper functions:

### models/student.md

```markdown
# Student

Students are enrolled in the school and can take multiple classes.

Properties:

- name: The full name of the student.
- email: The student's school email address (must be valid).
- gradeLevel: The student's grade level (9 to 12).
- enrollmentDate: The date the student enrolled.
- classes: The classes the student is enrolled in.
```

### models/class.md

```markdown
# Class

Classes are taught by a teacher and attended by students.

Properties:

- name: The name of the class.
- subject: The subject of the class.
- room: The room number where the class meets.
- maxStudents: The maximum number of students (1 to 30).
- teacher: The teacher who teaches the class.
- students: The students enrolled in the class.
```

### functions.md

```markdown
# Helper Functions

These are the helper functions provided by the school management system:

- formatEnrollmentDate(date): The enrollment date of a student, formatted as
  YYYY-MM-DD for display. Takes a date and returns a string.
- averageClassSize(classes): The average number of students in a list of
  classes, computed as a number. When the list is empty the average is 0.
```

No special syntax. No annotations. Just the way you'd explain your models to a
teammate.

When you run `verbo check`, Verbo:

1. **Extracts** structure from your prose using an LLM — types, constraints,
   cross-model references, and function signatures.
2. **Validates internally** — generates TypeScript types (models and function
   contracts) and constraint assertions, runs `deno check`. Failures feed back
   to the LLM for correction.
3. **Runs clarify** — an AI-powered pass that finds vague language, imprecise
   declarations, contradictions, and missing definitions.
4. **Offers interview** — interactive collaborator that asks questions, proposes
   precision improvements, and writes your answers directly into your `.md`
   files. Each round makes the file more precise. Add `--recheck` to re-run
   clarify afterwards and see how many ambiguities remain.

## How it works

Verbo has two layers:

### LLM-powered extraction

An LLM reads your natural language specs and extracts structured data — model
names, properties, types, constraints, and cross-model references. No parser to
maintain.
No syntax to learn. The LLM handles the variation in how people describe things.

If the extraction produces types that fail `deno check`, the errors are fed back
to the LLM in a **repair loop** (max 3 retries). This is what makes LLM-based
extraction reliable.

### Deterministic validation

- **`deno check`** validates the generated type graph — catches undefined
  references, circular types, type mismatches.
- **`.verbo/validate.ts`** checks value-level constraints (ranges, required
  fields, positive values) that TypeScript can't express.

### AI-assisted clarification

- **Clarify** — one LLM call finds vagueness, imprecise declarations,
  contradictions, and missing definitions in your prose.
- **Interview** — an interactive collaborator. The LLM proposes precision
  improvements for ambiguous declarations (e.g., "product code: not empty" → "a
  unique string identifier, cannot be empty"). You accept, choose an
  alternative, or write your own. All changes are written back into your `.md`
  files with a full audit trail under `.verbo/clarifications/`.
  `interview --recheck` re-runs clarify afterwards so you know exactly how many
  ambiguities remain.

The loop (extract → validate → clarify → interview → repeat) continues until
your specs are clean.

## Interview tips

- **Keep property bullets intact.** When a question targets a property bullet
  (`- size: The size of the entry in bytes.`), answer with the property name
  still attached — `size: always zero`. Verbo preserves the `name:` prefix
  automatically if you drop it, but accepting the AI's proposal is the safest
  path.
- **Expect several rounds.** `clarify` finds deeper, more specific questions
  each round (15 → 9 → 10 in the `ls` exercise); the count does not always
  shrink. Stop when the remaining questions are below your risk tolerance, or
  pass `--min-severity HIGH` to only chase CRITICAL/HIGH issues.
- **Duplicates are trimmed.** If an answer repeats a phrase that already follows
  the passage in the file, Verbo trims the trailing overlap instead of writing
  it twice.
- **Preview is interactive-only.** When you pipe answers (scripts/CI), the
  write-back diff-preview confirmation is skipped automatically.
- **Gate CI with `--fail-on`.** `verbo clarify --fail-on HIGH` (or
  `verbo interview --recheck --fail-on HIGH`) exits 1 while questions at or
  above that severity remain.

## Writing specs

There's no required syntax. Write the way you'd explain your models to a
teammate. Some conventions help the LLM extract better:

- **One model per file** — put each model in its own `models/` file.
- **Use bullet points for properties** — `- name: description` patterns.
- **Be explicit about ranges and constraints** — "9 to 12" is clearer than "a
  high school student."
- **Describe cross-model references** — how one model relates to another is a
  property that references it: a single one (`- teacher: The teacher who teaches
  the class.`) or a list (`- classes: The classes the student is enrolled in.`).
- **Add a `main.md`** — gives the LLM project-level context.
- **Describe helper functions too** — prose like "a helper that formats a date"
  is extracted as a function contract in `types.verbo.ts`, e.g.
  `export type formatEnrollmentDate = (date: Date) => string;`. No implementation
  is generated — an AI coding tool implements the contract from the refined
  spec (see `test/classroom/functions.md`).

For a complete guide, see the [**design reference**](./docs/DESIGN.md).

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
# Check specs: extract, generate types, validate, run clarify
deno run -A main.ts check

# Analyze specs for ambiguities only
deno run -A main.ts clarify

# Resolve ambiguities interactively
deno run -A main.ts interview

# Resolve ambiguities, then re-run clarify to check for remaining ones
deno run -A main.ts interview --recheck
```

You can run Verbo with your local AI using Ollama, or with Gemini, Anthropic,
OpenAI, or DeepSeek (API key required). Create a `.env` file:

```
GEMINI_KEY=...
OPENAI_KEY=...
ANTHROPIC_KEY=...
DEEPSEEK_KEY=...
```

For example, to run the full `check` pipeline with DeepSeek:

```bash
deno run -A main.ts check --dir test/classroom -a deepseek -m deepseek-v4-flash
```

## Development (Docker)

The recommended way to develop Verbo is inside Docker:

```bash
docker compose build dev
cp .env.example .env

./dev --version
./dev test
./dev check main.ts

./dev shell
./dev ollama start && ./dev ollama pull codegemma
```

A VS Code dev container is available at `.devcontainer/`.

## Roadmap

See [docs/roadmap.md](./docs/roadmap.md), [docs/DESIGN.md](./docs/DESIGN.md),
and the current milestone's [task list](./docs/tasks.md).
