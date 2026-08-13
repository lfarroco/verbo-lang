# Verbo Specification Guide

## 1. Introduction

Verbo specifications are plain Markdown files. You start with loose natural language. The interview asks questions and writes answers directly into your files, making them progressively more precise. The end result is the same file — now unambiguous enough for both humans and AI coding tools to consume.

## 2. Input: loose natural language

You write plain Markdown. No syntax, no annotations. Describe your models the way you'd explain them to a teammate. The LLM does the interpretation.

While there's no required syntax, certain patterns help the LLM extract better:

### 2.1 One model per file

Place each data model in its own file under a `models/` directory:

```
models/
  student.md
  teacher.md
  class.md
main.md
```

### 2.2 Property descriptions

List properties with a name and description. Bullet points work well:

```markdown
Properties:

- name: The full name of the student.
- email: The student's school email address (must be valid).
- gradeLevel: The student's grade level (9 to 12).
- enrollmentDate: The date the student enrolled.
```

The LLM extracts:
- `name` → string, required
- `email` → string, format hint (email)
- `gradeLevel` → number, range [9, 12]
- `enrollmentDate` → date

### 2.3 Constraints in prose

Embed constraints naturally in the description:

| Prose | Extracted constraint |
|---|---|
| "(9 to 12)" | Range: min=9, max=12 |
| "(must be positive)" | Positive: >0 |
| "(must be valid)" | Format hint (email) |
| "cannot be empty" | Required |

**Good:**
```markdown
- capacity: The maximum number of students (1 to 30).
- email: The student's school email address (must be valid).
- gradeLevel: The student's grade level (9 to 12).
```

**Also fine (the LLM handles variation):**
```markdown
- value: greater than 0
- email: valid email format
- age: at least 18
```

The LLM normalizes these into structured constraints.

### 2.4 Cross-model references

A reference to another model is just a property — either a single one or a list:

```markdown
Properties:

- classes: The classes the student is enrolled in.
- teacher: The teacher who teaches the class.
```

A single reference (`teacher`) becomes `Teacher`; a list (`classes`) becomes
`Class[]`. Natural sentences also work — the LLM extracts the reference and the
cardinality from prose like "A student can enroll in multiple classes." When a
list reference has no natural plural, the deterministic convention is
`<Model>_many` (e.g. `syllabus_many`).

### 2.5 Use a main.md

A `main.md` file gives the LLM project-level context:

```markdown
# School Management System

This defines the data model for a school management system.
It tracks students, teachers, and classes.
```

## 3. Progressive refinement

The `.md` file you write IS the output. There's no separate artifact. The interview edits your file in place — each answer makes the prose more explicit.

### 3.1 How a file evolves

You start with:

```markdown
# Student
- grade level: 9 to 12
- email: must be valid
- can take multiple classes
```

The interview asks about "must be valid" and writes the answer directly into the file:

```markdown
# Student
- grade level: 9 to 12
- email: must be a valid email address (e.g., student@school.edu).
- can take multiple classes
```

No syntax was added. The prose just got more explicit — now the LLM can extract `string, email format`. After a few rounds, the same file that a human reads is precise enough for Claude Code, Cursor, or any AI coding tool to consume.

### 3.2 How Verbo produces this

### 3.3 Extraction

One LLM call reads all your `.md` files and extracts:
- Model names and their source locations
- Properties with names, types, and constraints
- Cross-model references — properties whose type is another model, single or `[]`
- Cross-file references

The extraction prompt includes few-shot examples from the classroom and todo fixtures.

### 3.4 Type generation

The extracted structure is compiled into `types.verbo.ts`:

```typescript
export type Student = {
  name: string;
  email: string;
  gradeLevel: number;
  enrollmentDate: Date;
  classes: Class[];
};

export type Class = {
  name: string;
  subject: string;
  room: string;
  maxStudents: number;
  teacher: Teacher;
  students: Student[];
};
```

### 3.5 Validation

`deno check types.verbo.ts` validates the type graph. If it fails, the errors are fed back to the LLM in a repair loop:

```
Your extraction produced types that fail type-checking:
- Cannot find name 'Teacher'. Did you forget to process models/teacher.md?
Please re-extract and fix these errors.
```

The LLM retries up to 3 times.

### 3.6 Constraint assertions

Value-level constraints are generated as `.verbo/validate.ts`:

```typescript
// Constraint from models/student.md: "grade level: 9 to 12"
function assert_Student_gradeLevel(value: number, source: string): void {
  if (value < 9 || value > 12) {
    throw new Error(`${source}: gradeLevel = ${value} violates constraint [9..12]`);
  }
}
```

### 3.7 Clarification

An LLM clarify pass finds issues in your prose:
- Vague terms ("efficiently", "proper validation")
- Imprecise declarations ("product code: not empty" — string or number?)
- Undefined references (describing a relationship to a model that doesn't exist)
- Contradictions ("level: 1 to 100" and "starts at level 0")

Results are written to `clarifications.json`.

### 3.8 Interview

The interview is an interactive collaborator, not just a bug-finder. For each issue, the LLM **proposes a more precise version** of your spec:

```
❓ "product code: not empty" is ambiguous — should this be a string or number?

Proposed: `- product code: a unique string identifier (cannot be empty).`
1) Accept this proposal
2) It's a number, not a string
3) Custom definition
```

You can accept the proposal, choose an alternative, or write your own definition. All accepted changes are written back into your `.md` files with an audit trail under `.verbo/clarifications/`. The LLM acts as an editor — it helps you sharpen your prose, but you stay in control.

## 4. Complete example

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

### main.md

```markdown
# School Management System

This defines the data model for a school management system.
It tracks students, teachers, and classes.
```

That's it. No syntax, no annotations — just the way you'd describe your models to a teammate.

That's it. No syntax, no annotations — just the way you'd describe your models to a teammate.

## 5. Best practices

- **One model per file.** Helps the LLM know where each model begins and ends.
- **Be explicit about constraints.** "9 to 12" is better than "a high school student." "Must be positive" is better than "a valid value."
- **Describe cross-model references explicitly.** A property like `- classes: The classes the student is enrolled in.` names both the reference and the target model.
- **Use a main.md.** Gives the LLM project-level context and improves extraction quality.
- **Run clarify before finalizing.** The AI catches what you might miss — contradictions, missing models, vague terms.
- **Iterate.** Write a first draft, run `verbo check`, review the generated types, refine your prose, repeat. The interview system is there for the hard questions.
