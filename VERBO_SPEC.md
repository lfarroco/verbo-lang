# Verbo Specification Language v0.2

## 1. Introduction

**Verbo** is a specification language for data models. It uses **flavored Markdown** — standard Markdown with lightweight conventions — to define models, their properties, constraints, and relationships. Specifications are human-readable and deterministically parseable.

This document defines the syntax, conventions, and best practices for writing Verbo specifications.

## 2. Core Concepts

- **Markdown as Source of Truth:** Verbo files are standard Markdown (`.md`). All conventions are valid Markdown — a non-technical reader sees ordinary documentation.
- **Flavored, not a Grammar:** Verbo uses named conventions (directives, annotations, wiki-links), not a formal grammar. The deterministic parser extracts structure reliably without LLM interpretation.
- **Structured + Prose:** Structure comes from conventions (property lists, constraints); semantics and behavior come from natural language prose. The parser handles structure; the AI clarify system handles prose.
- **Models as the Unit of Specification:** Each model is defined in its own file with a `<!-- verbo:model -->` directive.

## 3. File Directives

### 3.1 Model directive

A `<!-- verbo:model -->` HTML comment marks a file as a data model definition. The parser extracts properties, constraints, and relationships from the content below it.

```markdown
<!-- verbo:model -->

# Hero

Heroes are the playable characters in the RPG Guild Simulator.

## Properties
- `name`: string (required)
- `level`: number [1..100]
...
```

Files without a directive are treated as free-form prose. The clarify system still analyzes them, but the parser ignores them for structure.

### 3.2 Data directive

A `<!-- verbo:data -->` directive marks spec-defined example or test data. Named data blocks within are checked against model constraints.

```markdown
<!-- verbo:data -->

## defaultHero
- name: "Aragorn"
- level: 5
- class: Warrior
- health: 20
```

## 4. Properties

Properties are defined under a `## Properties` heading as Markdown list items. Each property has a backtick-quoted name, a type, and optional constraints.

### 4.1 Basic syntax

```markdown
- `propertyName`: type [constraints]
```

### 4.2 Primitive types

| Type | Description | Example |
|---|---|---|
| `string` | Text value | `` `name`: string `` |
| `number` | Numeric value | `` `age`: number `` |
| `boolean` | True/false value | `` `isActive`: boolean `` |
| `date` | Date/time value | `` `createdAt`: date `` |

### 4.3 Reference types

A `→ [[ModelName]]` creates a typed reference to another model. The parser resolves these into TypeScript type references.

```markdown
- `location`: → [[Location]]
```

### 4.4 Enum types

List allowed values in square brackets. The parser infers the type and generates a union type.

```markdown
- `class`: [Warrior, Mage, Rogue, Cleric]
```

## 5. Constraints

Constraints follow the type annotation, separated by whitespace.

### 5.1 Required

```markdown
- `name`: string (required)
```

Marks a property as non-optional, non-nullable.

### 5.2 Range constraints

```markdown
- `level`: number [1..100]      # min..max (inclusive)
- `health`: number [10..]       # min only
- `score`: number [..999]       # max only
```

### 5.3 Comparison constraints

```markdown
- `experience`: number (>=0)    # non-negative
- `value`: number (>0)          # positive
- `discount`: number (<100)     # less than
```

### 5.4 Auto-populated

```markdown
- `createdAt`: date (auto)
- `updatedAt`: date (auto)
```

### 5.5 Multiple constraints

Constraints can be combined:

```markdown
- `age`: number (required) [0..150]
- `score`: number (>=0) [..100]
```

## 6. Relationships

Relationships are declared under a `## Relationships` heading using natural language with wiki-links.

### 6.1 Cardinality

The parser recognizes these patterns:

| Pattern | Cardinality |
|---|---|
| "has many", "can have multiple", "has multiple" | One-to-many |
| "belongs to", "has one", "references" | Many-to-one |

### 6.2 Examples

```markdown
## Relationships
- A hero can have multiple → [[Item]].
- A hero belongs to a → [[Location]].
- A location can have multiple → [[Monster]].
- A monster can drop multiple → [[Item]].
```

### 6.3 Bidirectional relationships

When two models declare complementary relationships, the parser recognizes them as a pair:

```markdown
# In hero.md
- A hero belongs to a → [[Location]].

# In location.md
- A location can have multiple → [[Hero]].
```

The generated types reflect both directions (`hero.location: Location` and `location.heroes: Hero[]`).

## 7. Wiki-Links

`[[ModelName]]` creates a cross-reference to another model. Wiki-links can appear in:

- **Property definitions** — typed references: `` `location`: → [[Location]] ``
- **Relationship declarations** — target models: "has many → [[Item]]"
- **Free-form prose** — the clarify system can detect undefined links

Wiki-links are resolved against all declared model names. A link to an undefined model is a parse error.

## 8. Spec-Defined Data

Data blocks under `<!-- verbo:data -->` provide example values that are checked against model constraints.

### 8.1 Syntax

```markdown
<!-- verbo:data -->

## dataName
- property: value
- property: value
```

### 8.2 Example

```markdown
<!-- verbo:data -->

## defaultHero
- name: "Aragorn"
- level: 5
- class: Warrior
- health: 20
- attack: 15
- location: "Rivendell"
```

### 8.3 Validation

The constraint assertion generator produces checks that every data value satisfies its model's constraints. If `defaultHero.level = 5` but the Hero model declares `level: number [10..]`, the assertion fails.

## 9. Complete Example

### models/hero.md

```markdown
<!-- verbo:model -->

# Hero

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

# Item

## Properties
- `name`: string (required)
- `value`: number (>0)
```

### main.md

```markdown
# RPG Guild Simulator

This defines the data model for the RPG Guild Simulator.
The game tracks heroes, monsters, locations, and items.
```

## 10. Best Practices

- **One model per file:** Each `<!-- verbo:model -->` file defines one data model. This keeps specs organized and parseable.
- **Use a `main.md`:** Provide a free-form `main.md` as the project entry point. The clarify system uses it for context.
- **Be explicit about constraints:** Instead of "it has a name," write `` `name`: string (required) ``. The parser can't infer constraints from prose.
- **Use wiki-links for all cross-references:** Every reference to another model should use `[[ModelName]]`. This makes relationships machine-checkable.
- **Define data to validate constraints:** Use `<!-- verbo:data -->` blocks to provide examples. The assertion generator will catch constraint violations.
- **Run `clarify` before finalizing:** The AI catch what the parser can't — vague terms, contradictions, missing edge cases.
- **Iterate:** Start with simple specs, run `verbo check`, review the output, refine. The interview system writes answers back for a reason.
