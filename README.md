# verbo-lang
Create software using natual language


## Table of Contents

- [Demo](#demo)
- [Reasoning](#reasoning)
- [Syntax](#syntax)
- [Roadmap](#roadmap)

## Demo

Given a directory with three markdown files, `model.md`, `example-todos.md`, and `main.md`, with the following contents:

#### model.md
```
A "To-Do Item" object has the following properties:

- name
- due to date
- completed (bool)

Here are some functions that allow interacting with a todo item:

- print todo item:
  This function prints to the console a string that represents the todo item.
  The string follows this pattern:
  "[<if completed, "x", otherwise, just " ">] <name> - due to <due to date>"

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

## Reasoing

In the past few years, there has been a lot of progress in the field of Natural Language
Processing with the rise of transformers and the popularization of GPT models.
When used for coding, a common practice that emerged was using comments to drive the code
generation process, like writing "the function below returns the square of a number" and
then letting the model generate said function.

With Verbo, we take this idea to the next level by using the comments as the code itself.
Besides using natural language, you still need to be aware on how computers work, as will
will still be handling variables, functions, and other programming concepts.

Another advantage is being able to target multiple languages at once, as the base language
is fairly simple and generic.

We didn't achieve the "make a website, no bugs, please" phase yet, but maybe we will get there someday.

## Syntax

The language uses markdown files to allow compatibility with tools that allow rich text editing
and displaying, but no special markup is required to create a working program.

### Comments

That's the nice thing about Verbo - everything is a comment. All the text is at the
same time documentation and code.

### Constants/Variables

You can use direct assignment:

```verbo
name: "John"
age: 25
```
or signal that a variable exists:
```
Use a constant called FILE_PATH to store the path to the configuration file.
Use a variable called "address" to store the user's address.
```

Later, you can use the variable like this:
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

Or use natural language:

```
The list "test foods" contains the following items:
  - apple
  - banana
  - carrot
  ... and other 10 random items
```

This is useful for defining test data.

### Objects

You can define objects like this:

```
person:
  name: "John"
  age: 25
```

Or use natural language:

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

### Functions

You can define functions like this:

```
Define a function called "sum".
It receives two parameters, "a" and "b".
It returns the sum of "a" and "b".
```

### Conditions

You can define conditions like this:

```
If the variable "age" is higher than 18, return "adult". Otherwise, return "minor".
If "musician code" is "MOZ", call the "play mozart" function. Otherwise, call the "play beethoven" function.
```

## Roadmap

- [ ] Feed generated files into a static code analyzer to check for common issues.
- [ ] Add support for more languages.
- [ ] Add support for application types (cli, web api, web app, mobile app).
- [ ] Generate tests based on the comments.