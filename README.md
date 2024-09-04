# verbo-lang
Create software using natural language

## Table of Contents

- [Demo](#demo)
- [Reasoning](#reasoning)
- [Syntax](#syntax)
- [Roadmap](#roadmap)

## Demo

(the language is still in its early stages, so the API is still subject to change)

Given a directory with three markdown files, `model.md`, `example-todos.md`, and `main.md`, with the following contents:

#### model.md
```
A "To-Do Item" object has the following properties:

- name
- due date
- completed (bool)

Here are some functions that allow interacting with a todo item:

- print todo item:
  This function prints to the console a string that represents the todo item.
  The string follows this pattern:
  "[<if completed, "x", otherwise, just " ">] <name> - due to <due date>"

- mark todo item as completed:
  This function changes the completed property of the todo item to True.

- mark todo item as incomplete:
  This function changes the completed property of the todo item to False.
```

#### example-todos.md
```
This defines a constant called "todos".

It is a list of example todo items.
All items are not completed, except for the first one.

todos:
 - name: buy bread, due to: 01/01/2025
 - name: buy milk, due to: 02/02/2026
 ... other 5 example items
 ```

#### main.md
```
Pick the list of todos located at example-todos.md.

For each todo item, call the function "print todo item".

Print "===="

Then, use the "mark todo item as completed" function for the second item.
After that, print the second item.

Print "===="

Then, use the "mark todo item as incomplete" function for the first item.
After that, print the first item.

Print "===="

When all is done, print "Goodbye!".
```

When we compile the above specifications, the generated code produces
the following output:
```
[x] buy bread - due to 01/01/2025
[ ] buy milk - due to 02/02/2026
[ ] buy eggs - due to 03/03/2027
[ ] buy cheese - due to 04/04/2028
[ ] buy ham - due to 05/05/2029
[ ] buy wine - due to 06/06/2030
====
[x] buy milk - due to 02/02/2026
====
[ ] buy bread - due to 01/01/2025
====
Goodbye!
```

The definitions don't need to be in English (check the exemple under `test/todo-pt-br`).

Here are some languages that we can target (examples generated with Google Gemini 1.5-flash at 2024-09-01):

JavaScript

```javascript
const todos = [
  { name: 'buy bread', dueTo: '01/01/2025', completed: true },
  { name: 'buy milk', dueTo: '02/02/2026', completed: false },
  { name: 'buy eggs', dueTo: '03/03/2027', completed: false },
  { name: 'buy cheese', dueTo: '04/04/2028', completed: false },
  { name: 'buy ham', dueTo: '05/05/2029', completed: false },
  { name: 'buy wine', dueTo: '06/06/2030', completed: false },
];

function printTodoItem(todoItem) {
  const completedSymbol = todoItem.completed ? 'x' : ' ';
  console.log(`[${completedSymbol}] ${todoItem.name} - due to ${todoItem.dueTo}`);
}

function markTodoItemAsCompleted(todoItem) {
  todoItem.completed = true;
}

function markTodoItemAsIncomplete(todoItem) {
  todoItem.completed = false;
}

todos.forEach(printTodoItem);

console.log('====');

markTodoItemAsCompleted(todos[1]);
printTodoItem(todos[1]);

console.log('====');

markTodoItemAsIncomplete(todos[0]);
printTodoItem(todos[0]);

console.log('====');

console.log('Goodbye!');
```

Or, if you fancy Python:

```python
class ToDoItem:
    def __init__(self, name, due_to, completed):
        self.name = name
        self.due_to = due_to
        self.completed = completed

    def print_todo_item(self):
        completed_mark = "[x]" if self.completed else "[ ]"
        print(f"{completed_mark} {self.name} - due to {self.due_to}")

    def mark_todo_item_as_completed(self):
        self.completed = True

    def mark_todo_item_as_incomplete(self):
        self.completed = False

todos = [
    ToDoItem("buy bread", "01/01/2025", True),
    ToDoItem("buy milk", "02/02/2026", False),
    ToDoItem("buy eggs", "03/03/2027", False),
    ToDoItem("buy cheese", "04/04/2028", False),
    ToDoItem("buy yogurt", "05/05/2029", False),
    ToDoItem("buy coffee", "06/06/2030", False),
]

for todo in todos:
    todo.print_todo_item()

print("====")

todos[1].mark_todo_item_as_completed()
todos[1].print_todo_item()

print("====")

todos[0].mark_todo_item_as_incomplete()
todos[0].print_todo_item()

print("====")

print("Goodbye!")
```

Why not in Haskell?

```haskell
data TodoItem = TodoItem {
  name :: String,
  dueDate :: String,
  completed :: Bool
} deriving (Show)

-- example-todos.md
todos = [
  TodoItem { name = "buy bread", dueDate = "01/01/2025", completed = True },
  TodoItem { name = "buy milk", dueDate = "02/02/2026", completed = False },
  TodoItem { name = "buy cheese", dueDate = "03/03/2027", completed = False },
  TodoItem { name = "buy eggs", dueDate = "04/04/2028", completed = False },
  TodoItem { name = "buy flour", dueDate = "05/05/2029", completed = False },
  TodoItem { name = "buy sugar", dueDate = "06/06/2030", completed = False }
]

printTodoItem :: TodoItem -> IO ()
printTodoItem item = putStrLn $
  if completed item then "[x] " else "[ ] " ++
  name item ++ " - due to " ++ dueDate item

markTodoItemAsCompleted :: TodoItem -> TodoItem
markTodoItemAsCompleted item = item { completed = True }

markTodoItemAsIncomplete :: TodoItem -> TodoItem
markTodoItemAsIncomplete item = item { completed = False }

main :: IO ()
main = do
  mapM_ printTodoItem todos
  putStrLn "===="
  let secondItem = todos !! 1
  printTodoItem $ markTodoItemAsCompleted secondItem
  putStrLn "===="
  let firstItem = todos !! 0
  printTodoItem $ markTodoItemAsIncomplete firstItem
  putStrLn "===="
  putStrLn "Goodbye!"
```

## How it works

This compiler works by collecting all .md files with the "source" and providing it to an LLM, alongside some template code
that follows these key rules, among others:

- self-contained
- with optional mutable local state
- side-effects handled with "port" functions

The .md files are compiled into TypeScript, which we use as an "AST" of sorts. Why TypeScript? It has types, is multiparadigm, and is a good middle ground between OOP/functional languages. Also, there are lots of parsers/linters/testing tools for TypeScript that we can include in our pipeline.
Another factor is that the existing AIs are heavily trained on this language.

Then, a new prompt is generated, asking the AI to convert the TypeScript code into the target language, respecting the target's syntax and conventions.

I'm changing it to not target specific languages directly, but instead compile to typescript and use .ts as an AST. why? typescript has types and is multiparadigm, so it's a good middle ground. As there's lots of parsers/linters for ts, we can take advantage of that. Also AIs are heavily trained on ts. If the user wants java, I believe that it will be easier to make ts -> java instead of going from md -> java
the idea is having a small Elm-like thing that lets people build self-contained software
it can run under different ai providers (openai, gemini, ollama local models), and it was interesting to learn that gemini has free API keys and ollama models run surprisingly well locally (just download 4gb and you are set)
The next goals are generating tests, then handling adding changes to existing compiled code. And make the compiler self-hosted (written in verbo itself).
over time it should be possible to add skills/modes/plugins to it, enabling it to create cli apps, servers with routes - who knows! 

## Reasoning

In the past few years, there has been a lot of progress in the field of Natural Language
Processing with the rise of transformers and the popularization of GPT models.
When used for coding, a common practice that emerged was using comments to drive the code
generation process, like writing "the function below returns the square of a number" and
then letting the model generate said function.

With Verbo, we take this idea to the next level by using the comments as the code itself.
Besides using natural language, you still need to be aware on how computers work, as you
will still be handling variables, functions, and other programming concepts.

Another advantage is being able to target multiple languages at once, as the base language
is fairly simple and generic.

We didn't achieve the "make a website, no bugs, please" phase yet, but maybe we will get there someday.

## Getting Started

A basic project looks like this:
```
- source/
  - main.md
  - model.md
  - example-todos.md
- dist/
.env
```

You can run this tool with your local AI using Ollama. 

We also have support for Gemini and OpenAi, provided that you have an API key.
For those providers, create a `.env` with `GEMINI_KEY=...` or `OPENAI_KEY=...` entries, depending on the provider.
You can get a free API key for Gemini at https://aistudio.google.com/app/apikey.

As this is still experimental, we don't have a npm package yet. To try, clone this repo then run:

`npm i -g` 

Then, run it with `verbo`.

By default, the cli reads all `.md` files in the `source` directory. Having a `main.md` file is required.
The generated files will be placed in the `dist` directory.
Use `--target <lang>` to choose the target language. The default is `js`, but you can choose from `py`, `go`, `java`, `hs`, and others.

To choose which AI provider to use, use the `-ai` option. The default is `ollama`, but you can also choose from `gemini` and `openai`.

You can run `verbo --help` to see all the available options.

## Syntax

The language uses markdown files to allow compatibility with tools that allow rich text editing
and displaying, but no special markup is required to create a working program.

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
names:
- John
- Mary
- Peter
```

If you want to use a more traditional approach, it will work as well:

```
This is constant called "fruits", which is composed of ["apple", "banana", "pear"].
```

You can also ask the AI to generate data:

```
The list "test foods" contains the following items:
  - apple
  - banana
  - carrot
  ... and other 10 random items
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
person:
  name: "John"
  age: 25
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