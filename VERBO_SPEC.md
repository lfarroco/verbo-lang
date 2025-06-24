# Verbo Language Specification v0.1

## 1. Introduction

**Verbo** is an abstract programming language designed to generate code from natural language descriptions. It leverages the intuitive nature of human language, structured within Markdown files, to specify software systems. The core philosophy is that documentation and code should be one and the same.

This document outlines the syntax, semantics, and best practices for writing effective Verbo specifications.

## 2. Core Concepts

*   **Natural Language as Code**: The primary building block of Verbo is natural language (English is the most tested, but other languages may work). The AI compiler interprets these descriptions to generate target-specific code (e.g., TypeScript, SQL).
*   **Markdown-Based**: Verbo files are standard Markdown (`.md`). This allows for rich formatting, comments, and easy integration with documentation tools.
*   **Context is Key**: The AI compiler processes all provided `.md` files as a single, cohesive unit. A declaration in one file is available to all others in the same compilation context.
*   **Everything is a Comment**: From Verbo's perspective, all text is both human-readable documentation and machine-interpretable code.

## 3. Syntax and Constructs

### 3.1. Data Declaration: Variables and Constants

Variables and constants hold data. They can be declared implicitly through assignment or explicitly through descriptive sentences.

**Implicit Declaration (Assignment Style):**
Uses a `key: value` format. This is useful for defining simple values or properties of an object.

```verbo
# A simple variable
name: "John Doe"

# A constant
MAX_RETRIES: 3
```

**Explicit Declaration (Descriptive Style):**
Uses a sentence to describe the purpose and name of the data holder.

```verbo
Use a constant called PI to store the value 3.14159.
A variable named "currentUser" will hold the logged-in user's data.
```

### 3.2. Data Structures

#### 3.2.1. Lists / Arrays

Lists can be defined using Markdown list syntax or descriptive sentences.

**Markdown List Style:**

```verbo
This is the list of supported fruits:
- Banana
- Apple
- Pear
```

**Inline Array Style:**

```verbo
A constant called "fruits" is an array composed of ["apple", "banana", "pear"].
```

#### 3.2.2. Objects / Structs

Objects define structured data with named properties.

**Property List Style:**
This is the preferred way to define a data model or type.

```verbo
A "Person" object has the following properties:
- name: a string
- age: an integer
- isStudent: a boolean
```

**Inline Object Style:**

```verbo
This defines the "person" variable:
- name: "John"
- age: 25
```

**Property Constraints:**
You can add constraints and type hints to properties. The AI will attempt to translate these into appropriate types or validation logic in the target language (e.g., SQL constraints, TypeScript types).

```verbo
A "User" object has these properties:
- name: a string, up to 50 characters, cannot be empty.
- email: a string, must be a valid email format and unique.
- age: an integer, must be 18 or greater.
- memberSince: a date (format: YYYY-MM-DD).
```

### 3.3. Functions / Methods

Functions define reusable blocks of logic.

```verbo
Define a function called "calculateSum".
It receives two integer parameters, "a" and "b".
It returns the sum of "a" and "b".
```

Functions can also be described as performing actions on objects:

```verbo
The function "changeUserAddress" receives a "User" object and a "newAddress" string, and it updates the user's address.
```

### 3.4. Control Flow: Conditionals

Conditional logic is expressed using "if/else" phrasing. Keep expressions simple and clear.

```verbo
If the variable "age" is greater than or equal to 18, return "adult".
Otherwise, return "minor".
```

```verbo
Check if the user is a student:
- if true, the discount is 50%.
- otherwise, the discount is 0%.
```

## 4. Target-Specific Constructs

Verbo's interpretation can be guided by the compilation target (e.g., `sql`, `routes`, `model`).

### 4.1. Database Schema Generation (`--target sql`)

When generating SQL, Verbo focuses on data models and their relationships.

**Model Relationships:**
Relationships between models are crucial.

*   **One-to-Many:** Describe ownership or containment. The AI should generate a foreign key.

    ```verbo
    # In user.md
    A user can have many posts.

    # In post.md
    A post belongs to a user.
    ```

*   **Many-to-Many:** Describe a mutual relationship. The AI should generate a join table.

    ```verbo
    # In student.md
    A student can enroll in many courses.

    # In course.md
    A course can have many students.
    ```

**Default Fields:**
The SQL generator is instructed to automatically add `id SERIAL PRIMARY KEY`, `created_at TIMESTAMP`, and `updated_at TIMESTAMP` to all tables.

### 4.2. API Route Generation (`--target routes`)

When generating API routes, Verbo uses a `routes.md` file to define endpoints.

**Endpoint Definition:**
List the desired RESTful endpoints. The AI will map these to the generated DB client functions.

```verbo
# In routes.md
The application has the following endpoints:
- GET /users
- GET /users/{id}
- POST /users
- PUT /users/{id}
- DELETE /users/{id}

The following endpoints handle relationships:
- GET /users/{id}/posts - Get all posts for a specific user.
- POST /users/{id}/items/{itemId} - Add an item to a hero's inventory.
```

The generator is instructed to use the Deno Oak framework and follow REST conventions.

## 5. Special Directives

Verbo supports special directives to guide the AI.

**Data Generation:**
Useful for creating test data or examples.

```verbo
The list "randomFoods" contains:
  - apple
  - banana
  ... generate 10 more random food items.
```

## 6. Best Practices

*   **Be Explicit:** While Verbo uses natural language, ambiguity is its greatest challenge. Be as clear and explicit as possible. Instead of "it has a name," write "it has a `name` property which is a string."
*   **One Idea Per File:** Dedicate one Markdown file to each core model or concept (e.g., `user.md`, `post.md`). This improves organization.
*   **Use a `main.md`:** Provide a `main.md` file to give the AI an entry point and overall context for the project.
*   **Structure with Headings:** Use Markdown headings (`#`, `##`) to structure your specifications. This helps both humans and the AI parse the document.
*   **Iterate:** Start with a simple specification, compile it, and review the output. Refine your Verbo descriptions based on the generated code to steer the AI toward the desired result.