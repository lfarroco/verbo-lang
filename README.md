# verbo-lang
An experiment on creating a programming the language defined in natural language.

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
- mask as incomplete: receives a todo name and marks it as incomplete

When "mark as completed" is called, the application should call the "ring bell" port with the todo item name as a parameter.
```

The definitions don't need to be in English (check the exemple under `test/todo-pt-br/`).

When we compile the above specifications, the generated looks like this (generated with the local model 7B codegemma):

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

We also are experimenting with automated testing generation.
This could be useful if you have a different AI model genering tests based on the description and available types only.
Currently, we are able to generate tests like this:

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

The compiler works by collecting all .md files within the `source` directory and providing it to an LLM, alongside a template code structure
that follows these key rules, among others:

- the program must be self-contained
- the program receives as parameters:
  - its initial state
  - a set of "ports" that allow it to interact with the outside world
- the program exposes a set of operations that allow manipulating the state and/or interacting with the ports

The resulting program is compiled into TypeScript. Currently, this is the only target language supported, but we plan to add more in the future.
The advantage of using TypeScript is that it has types, is multiparadigm, and is a good middle ground between OOP/functional languages.
That should be a helpful factor when the program into another language in the future - making the language an "AST" of sorts.
TypeScript also has extensive tooling of parsers/linters/testing that we can include in our pipeline.

After the code is generated we attempt to compile it using the `tsc` compiler.
If it fails, we ask the AI to fix it by making a prompt that includes the error message and the generated code.
If it fails again, the operation is aborted - that requires the user to update the specifications, as something is not clear enough for the AI to understand and generate valid code.

Currently, all Verbo code will result into a TypeScript class. We know that it is possible to achieve the same effect without classes, but we believe that this is a good starting point - and the AI that generates the code is more familiar with classes than with other constructs.

Having the AI perform tasks over a specification also allows for the generation of tests, collection of suggestions, generation of documentation, and other tasks that can be automated.

## Reasoning

In the past few years, there has been a lot of progress in the field of Natural Language
Processing with the rise of transformers and the popularization of GPT models.
When used for coding, a common practice that emerged is using comments to drive the code
generation process, like writing "the function below returns the square of a number" and
then letting the model generate said function.

With Verbo, we take this idea further by turning the comments into a specification.
Besides using natural language, you still need to be aware on how computers work, as you
will still be handling variables, functions, and other programming concepts.

We didn't achieve the "make a website, no bugs, please" phase yet, but maybe we will get there someday.

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

You can run this tool with your local AI using Ollama. 

We also have support for Gemini, Anthropic and OpenAi, provided that you have an API key.
For those providers, create a `.env` with `GEMINI_KEY=...`, `OPENAI_KEY=...` or `ANTHROPIC_KEY=...` depending on the provider you want to use.

As this is still experimental, we don't have a npm package yet. To try, clone this repo, then:
- install dependencies with `npm install`
- check the makefile to see how to run the tool

By default, the cli reads all `.md` files in the `source` directory. Having a `main.md` file is required.
The generated files will be placed in the `dist` directory.

To choose which AI provider to use, use the `-ai` option. The default is `ollama`, but you can also choose from `gemini`, `openai` or `anthropic`.

## Syntax

The language uses markdown files to allow compatibility with tools that allow rich text editing
and displaying, but no special markup is required to create a working program.

### Architecture

Verbo programs assume a standard architecture for all software created with it.
All Verbo programs are long-running processes that manage a state (optional) and expose operations to manipulate it.
To interact with the outside world, the program uses "ports" - functions that are passed as parameters to the program.
Once created, the program operations (think of them as methods) can be called to manipulate the state and/or to interact with the ports.
When declaring the program in the `main.md` file, you must define how the state will look like and which ports will be available.

### Comments

That's the nice thing about Verbo - everything is a comment. All the text is at the
same time documentation and code.

### Constants/Variables

You can declare that a variable exists:
```
Use a constant called FILE_PATH to store the path to the configuration file.
Use a variable called "address" to store the user's address.
```
Verbo variable are available are available anywhere in the program. 
You can also use direct assignment if you want to:

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

If you want to use a more traditional approach, it will work as well:

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
If the variable "age" is higher than 18, return "adult". Otherwise, return "minor".

If "musician code" is "MOZ", call the "play mozart" function. Otherwise, call the "play beethoven" function.

Check the user's "is student" property: 
- if true, the discount is 50%
- otherwise, the discount is 0%
```

So try to keep them simple - this applies to non-verbo code as well ;

## Roadmap

- Allow extending the language with skills "skills" like HTTP requests, file operations, cli generation, etc.
- Generate tests based on the requirements
- Get the model to analyze the code and suggest improvements