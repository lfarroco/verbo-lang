# verbo-lang
Create software using natual language


## Table of Contents

- [Demo](#demo)
- [Reasoning](#reasoning)
- [Syntax](#syntax)

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
```

Then, when we compile the above specifications, we generate code that produces
the following output:
```
[x] buy bread - due to 01/01/2025
[ ] buy milk - due to 02/02/2026
[ ] buy eggs - due to 03/03/2027
[ ] buy cheese - due to 04/04/2028
[ ] buy yogurt - due to 05/05/2029
[ ] buy fruit - due to 06/06/2030
```

Here are some languages that we can target (examples used Google Gemini 1.5-flash at 2024-09-01):

JavaScript

```javascript
const todos = [
  { name: 'buy bread', dueTo: '01/01/2025', completed: true },
  { name: 'buy milk', dueTo: '02/02/2026', completed: false },
  { name: 'buy eggs', dueTo: '03/03/2027', completed: false },
  { name: 'buy cheese', dueTo: '04/04/2028', completed: false },
  { name: 'buy yogurt', dueTo: '05/05/2029', completed: false },
  { name: 'buy fruit', dueTo: '06/06/2030', completed: false },
];

function printTodoItem(todoItem) {
  const completionMark = todoItem.completed ? '[x]' : '[ ]';
  console.log(`${completionMark} ${todoItem.name} - due to ${todoItem.dueTo}`);
}

todos.forEach(printTodoItem);
```

Or, if you fancy Python:

```python
from datetime import datetime

class TodoItem:
    def __init__(self, name, due_to, completed=False):
        self.name = name
        self.due_to = due_to
        self.completed = completed

    def print_todo_item(self):
        completed_marker = "[x]" if self.completed else "[ ]"
        print(f"{completed_marker} {self.name} - due to {self.due_to.strftime('%Y-%m-%d')}")

    def mark_completed(self):
        self.completed = True

    def mark_incomplete(self):
        self.completed = False

# Example Todos
todos = [
    TodoItem("buy bread", datetime(2025, 1, 1), completed=True),
    TodoItem("buy milk", datetime(2026, 2, 2)),
    TodoItem("walk the dog", datetime(2023, 12, 25)),
    TodoItem("pay bills", datetime(2024, 1, 15)),
    TodoItem("clean the house", datetime(2023, 12, 31)),
    TodoItem("go to the gym", datetime(2024, 1, 1)),
    TodoItem("buy groceries", datetime(2023, 12, 24)),
]

# Print each todo item
for todo in todos:
    todo.print_todo_item()
```

Why not in Haskell?

```haskell
data TodoItem = TodoItem {
  name :: String,
  dueDate :: String,
  completed :: Bool
} deriving (Show)

printTodoItem :: TodoItem -> String
printTodoItem todoItem =
  let completedMark = if completed todoItem then "[x]" else "[ ]"
  in completedMark ++ " " ++ name todoItem ++ " - due to " ++ dueDate todoItem

todos =
  [ TodoItem { name = "buy bread", dueDate = "01/01/2025", completed = True }
  , TodoItem { name = "buy milk", dueDate = "02/02/2026", completed = False }
  , TodoItem { name = "buy eggs", dueDate = "03/03/2027", completed = False }
  , TodoItem { name = "buy cheese", dueDate = "04/04/2028", completed = False }
  , TodoItem { name = "buy butter", dueDate = "05/05/2029", completed = False }
  , TodoItem { name = "buy yogurt", dueDate = "06/06/2030", completed = False }
  ]

main :: IO ()
main = mapM_ (putStrLn . printTodoItem) todos
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

That's the nice thing about verbo - everything is a comment. All the text is at the
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
``

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