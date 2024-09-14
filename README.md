# verbo-lang

An experiment on generating a web API using natural language.

## Table of Contents

- [Demo](#demo)
- [Reasoning](#reasoning)
- [Syntax](#syntax)
- [Roadmap](#roadmap)

## Demo

Given a directory with some markdown files with the following contents:

#### main.md

```
This defines the logic for the RPG Guild Simulator web API.
```

### models/hero.md

```
These are the properties for a hero:

- name: The name of the hero.
- level: The level of the hero (1 to 100).
- class: The class of the hero.
- experience: The experience of the hero.
- health: The health of the hero.
- attack: The attack of the hero.
- location: The current location of the hero.

Relationships:

- A hero can have multiple items.
```

### models/monster.md

```
These are the properties for a monster:

- name: The name of the monster.
- level: The level of the monster (1 to 100).
- health: The health of the monster.
- attack: The attack of the monster.

Relationships:

- A monster can drop from a list of multiple items.
```

### models/location.md

```
These are the attributes for a location in the world:

- name: The name of the location.
- description: The description of the location.

Relationships:

- A location can have multiple monsters.
```

### models/item.md

```
These are the properties for an item:

- name - The name of the item.
- value - The value of the item (must be positive).
```

#### routes.md

```
The endpoints are:

- `/heroes`
- `/heroes/{id}`
- `/monsters`
- `/monsters/{id}`
- `/items`
- `/items/{id}`
- `/locations`
- `/locations/{id}`

The following endpoints allow interacting with the relationships:

- `/heroes/{id}/items` - Get all items for a hero.
- `/heroes/{id}/items/{itemId}` - Add an item to a hero.
- `/heroes/{id}/items/{itemId}` - Remove an item from a hero.
- `/locations/{id}/monsters` - Get all monsters for a location.
```

The destiptions don't need to be in English.

When compiled, the specifications generate SQL and TypeScript Deno code for:

- a database schema
- model files
- DB clients
- API handlers

Some example files files generated by the AI are under `test/guild/results`.

## How it works

We have a series of steps where we guide the AI with some examples.

First, we translate the model specifications into a database schema. Some
guidance is needed to tell the AI how it should handle relationships.

Next, we generate model files for each generated table. The goal here is having
a 1:1 mapping between the database schema and the model files.

The following step is generating db clients to interact with the database. We
provide some examples on how the psql library works, and the AI generates the
necessary code.

The last step is generating the API handlers. Based on the user-defined routes
and the available models, the AI connects the dots and generates the necessary
code. Again, some examples are provided to guide the AI on the necessary typing
and how parameters are extracted from the request.

## Reasoning

Over the past few years, significant progress in Natural Language Processing
(NLP) has been achieved through advancements in transformer models and the rise
of GPT-based models. In coding, a common practice is using comments to drive
code generation, such as writing "the function below returns the square of a
number," and letting the model generate the function.

Verbo takes this idea further by turning comments into a specification. While
natural language is used, you still need a basic understanding of how computers
work, as you'll be dealing with variables, functions, and other programming
concepts.

We haven't reached the "make a website with no bugs" phase yet, but we're
getting closer!

## Getting Started

A basic project looks like this:

```
- models/
  - user.md
  - ... other files
main.md
routes.md
.env
```

Currently, we are working to support the generation of web APIs.

You can run Verbo with your local AI using Ollama. We also support Gemini,
Anthropic, and OpenAI, provided you have an API key. For those providers, create
a `.env` file with `GEMINI_KEY=...`, `OPENAI_KEY=...`, or `ANTHROPIC_KEY=...`,
depending on the provider you wish to use.

Check the `Makefile` for more information on how to run the project.

## Syntax

Verbo uses markdown files to allow compatibility with rich text editing and
display tools, but no special markup is required to create a working program.

### Comments

In Verbo, everything is a comment. The text is both documentation and code.

### Constants/Variables

You can declare constants and variables like this:

```
Use a constant called FILE_PATH to store the path to the configuration file.
Use a variable called "address" to store the user's address.
```

Variables are available throughout the program. Direct assignment is also
possible:

```
name: "John"
age: 25
```

Later, reference the declared variable to access it:

```
Log the FILE_PATH variable to the console.
Call the "navigate" function, passing the "address" variable as a parameter.
```

### Lists

You can define lists like this:

```
This is the list of supported fruits:
- Banana
- Apple
- Pear
```

Alternatively:

```
This is a constant called "fruits", which is composed of ["apple", "banana", "pear"].
```

You can also ask the AI to generate data:

```
The list "test foods" contains the following items:
  - apple
  - banana
  - carrot
  ... generate 10 random items
```

This is useful for defining test cases.

### Objects

Objects can be defined like this:

```
A "Person" object has the following properties:
  - name, a string
  - age, an integer
```

You can get creative with the properties:

```
A "Person" object has the following properties:
  - name, a string up to 10 characters
  - age, an integer, higher than 0
  - birthdate, a date (format: YYYY-MM-DD)
  - "is student", a boolean
```

A more traditional approach is also valid:

```
This defines the "person" variable:
- name: "John"
- age: 25
```

### Functions

You can define functions like this:

```
Define a function called "sum".
It receives two parameters, "a" and "b".
It returns the sum of "a" and "b".
```

You can also reference more abstract types as arguments:

```
The function "change user address" receives a "User" object and a "new address" string, and updates the user's address.
```

You can use words like "method" as well, but that is not encoraged because it
may make the code harder to translate into languages that don't have this
concept.

### Conditions

Conditions work best if they are short expressions:

```
If the variable "age" is higher than 18, return "adult".
Otherwise, return "minor".

If "musician code" is "MOZ", call the "play mozart" function.
Otherwise, call the "play beethoven" function.

Check if the is a student: 
- if true, the discount is 50%
- otherwise, the discount is 0%
```

So try to keep them simple - this applies to non-verbo code as well ;)

## Roadmap

- Allow extending the language with skills "skills" like HTTP requests, file
  operations, cli generation, etc.
- Generate tests based on the requirements
- Get the model to analyze the code and suggest improvements
