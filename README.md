# verbo-lang
An experiment on programming in natural language.

## Table of Contents

- [Demo](#demo)
- [Reasoning](#reasoning)
- [Syntax](#syntax)
- [Roadmap](#roadmap)

## Demo

Given a directory with two markdown files, `model.md` and `main.md`, with the following contents:

#### model.md
```
A "To-Do Item" object has the following properties:

- name, a string
- due date, a ISO 8601 date string
- completed, a boolean
```

#### main.md
```
This application will be a long-running process that manages a list of todos.

The application state is composed of:
- A list of todos received as an argument

The application ports are:
- A function called "ring bell" that receives a string

The application exposes the following operations to allow manipulating the state:
- get todos: returns all todos
- add todo: receives a todo name and a due date and adds it to the list
- remove todo: receives a todo name and removes it from the list
- update due date: receives a todo name and a new due date and updates the todo
- mark as completed: receives a todo name and marks it as completed.
- mark as incomplete: receives a todo name and marks it as incomplete

When "mark as completed" is called, the application should call the "ring bell"
port with the todo item name as a parameter.
```

The language is not restricted to English (see the example under test/todo-pt-br/).

When compiled, the specifications generate code like this (using the local 7B codegemma model):

```typescript

export type State = {
  todos: ToDo[];
}

export type ToDo = {
  name: string;
  dueDate: string;
  completed: boolean;
}

export type Ports = {
  ringBell: (message: string) => void;
}

export class Main {
  private state: State;
  private ports: Ports;

  constructor(state: State, ports: Ports) {
    this.state = state;
    this.ports = ports;
  }

  public getTodos(): ToDo[] {
    return this.state.todos;
  }

  public addTodo(name: string, dueDate: string): void {
    this.state.todos.push({ name, dueDate, completed: false });
  }

  public removeTodo(name: string): void {
    this.state.todos = this.state.todos.filter((todo) => todo.name !== name);
  }

  public updateDueDate(name: string, newDueDate: string): void {
    const todo = this.state.todos.find((todo) => todo.name === name);
    if (todo) {
      todo.dueDate = newDueDate;
    }
  }

  public markAsCompleted(name: string): void {
    const todo = this.state.todos.find((todo) => todo.name === name);
    if (todo) {
      todo.completed = true;
      this.ports.ringBell(todo.name);
    }
  }

  public markAsIncomplete(name: string): void {
    const todo = this.state.todos.find((todo) => todo.name === name);
    if (todo) {
      todo.completed = false;
    }
  }
}

```

We are also experimenting with automated test generation. This could be useful when using different AI models to generate tests based on descriptions and available types. Currently, we can generate tests like this:

```typescript

import { Main, Todo, Ports } from "./index";

test("should get todos", () => {
  const todos: Todo[] = [
    { name: "Buy groceries", dueDate: "2023-10-26", completed: false },
    { name: "Do laundry", dueDate: "2023-10-27", completed: false },
  ];

  const app = new Main(todos, {} as Ports);

  expect(app.getTodos()).toEqual(todos);
});

test("should add a todo", () => {
  const todos: Todo[] = [];

  const app = new Main(todos, {} as Ports);

  app.addTodo("Pay bills", "2023-10-28");

  expect(app.getTodos()).toEqual([
    { name: "Pay bills", dueDate: "2023-10-28", completed: false },
  ]);
});

test("should remove a todo", () => {
  const todos: Todo[] = [
    { name: "Pay bills", dueDate: "2023-10-28", completed: false },
    { name: "Do laundry", dueDate: "2023-10-27", completed: false },
  ];

  const app = new Main(todos, {} as Ports);

  app.removeTodo("Pay bills");

  expect(app.getTodos()).toEqual([
    { name: "Do laundry", dueDate: "2023-10-27", completed: false },
  ]);
});

test("should update the due date of a todo", () => {
  const todos: Todo[] = [
    { name: "Pay bills", dueDate: "2023-10-28", completed: false },
  ];

  const app = new Main(todos, {} as Ports);

  app.updateDueDate("Pay bills", "2023-10-29");

  expect(app.getTodos()).toEqual([
    { name: "Pay bills", dueDate: "2023-10-29", completed: false },
  ]);
});

// ... and other tests

```

## How it works

The compiler collects all .md files within the source directory and provides them to a Large Language Model (LLM), alongside a template code structure. The structure follows these key rules:

- The program must be self-contained.
- It receives as parameters:
  - Its initial state
  - A set of "ports" that allow it to interact with the outside world
- It exposes a set of operations to manipulate the state or interact with the ports.

The result is compiled into TypeScript. Currently, TypeScript is the only supported target language, though we plan to support more in the future. TypeScript is a good middle ground between OOP and functional languages, with strong typing and extensive tooling for parsing, linting, and testing.

After the code is generated, we compile it using the tsc compiler. If it fails, we provide the error message to the AI, prompting it to fix the issue. If it fails again, the operation is aborted, and the user must update the specifications to clarify any ambiguities.

At present, all Verbo-generated code results in a TypeScript class. While the same functionality could be achieved without classes, we chose this approach because the AI is more familiar with classes.

The AI-driven approach enables additional automation, such as generating tests, collecting suggestions, creating documentation, and other tasks.

## Reasoning

Over the past few years, significant progress in Natural Language Processing (NLP) has been achieved through advancements in transformer models and the rise of GPT-based models. In coding, a common practice is using comments to drive code generation, such as writing "the function below returns the square of a number," and letting the model generate the function.

Verbo takes this idea further by turning comments into a specification. While natural language is used, you still need a basic understanding of how computers work, as you'll be dealing with variables, functions, and other programming concepts.

We haven't reached the "make a website with no bugs" phase yet, but we're getting closer!

## Getting Started

A basic project looks like this:
```
- source/
  - main.md
  - model.md
  - ... other files
- dist/
.env
```

You can run Verbo with your local AI using Ollama. We also support Gemini, Anthropic, and OpenAI, provided you have an API key. For those providers, create a `.env` file with `GEMINI_KEY=...`, `OPENAI_KEY=...`, or `ANTHROPIC_KEY=...`, depending on the provider you wish to use.

As this project is experimental, we haven't published an npm package yet. To try it out, clone the repository and:

1. Install dependencies with `npm install`.
2. Check the Makefile to see how to run the tool (eg. `make test-gemini`)

By default, the CLI reads all .md files in the source directory. A main.md file is required. The generated files will be placed in the dist directory.

To choose which AI provider to use, pass the -ai option. The default is ollama, but you can also choose gemini, openai, or anthropic.

## Syntax

Verbo uses markdown files to allow compatibility with rich text editing and display tools, but no special markup is required to create a working program.

### Architecture

Verbo programs assume a standard architecture: they are long-running processes that manage a state (optional) and expose operations to manipulate it. To interact with the outside world, the program uses "ports"—functions passed as parameters. You must define how the state looks and which ports are available in the main.md file.

### Comments

In Verbo, everything is a comment. The text is both documentation and code.

### Constants/Variables

You can declare constants and variables like this:

```
Use a constant called FILE_PATH to store the path to the configuration file.
Use a variable called "address" to store the user's address.
```

Variables are available throughout the program. Direct assignment is also possible:

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

You can use words like "method" as well, but that is not encoraged because it may make the code harder to translate into 
languages that don't have this concept.

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

- Allow extending the language with skills "skills" like HTTP requests, file operations, cli generation, etc.
- Generate tests based on the requirements
- Get the model to analyze the code and suggest improvements