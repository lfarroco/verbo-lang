# verbo-lang
Create software using natual language


## Table of Contents

- [Demo](#demo)
- [Reasoning](#reasoning)
- [Syntax](#syntax)

## Demo

Given a directory with three markdown files, `model.md`, `example-todos.md`, and `main.md`, with the following contents:

#### model.md
```markdown
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
```markdown
This defines a constant called "todos".

It is a list of example todo items.
All items are not completed, except for the first one.

todos:
 - name: buy bread, due to: 01/01/2025
 - name: buy milk, due to: 02/02/2026
 ... other 5 example items
 ```

#### main.md
```markdown
Pick the list of todos located at example-todos.md.

For each todo item, call the function "print todo item".
```

The generated code prints the following todo items:

```
[x] buy bread - due to 01/01/2025
[ ] buy milk - due to 02/02/2026
[ ] buy eggs - due to 03/03/2027
[ ] buy cheese - due to 04/04/2028
[ ] buy coffee - due to 05/05/2029
[ ] buy sugar - due to 06/06/2030
[ ] buy flour - due to 07/07/2031
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



## Comments

That's the nice thing about verbo - everything is a comment. All the text is at the
same time documentation and code.

## Literals

You can declare variables like this:

You can use direct assignment:

```verbo
name: "John"
age: 25
```
or signal that a variable exists:
```verbo
Use a constant called FILE_PATH to store the path to the configuration file.
```

Later, you can use the variable like this:
```verbo
Log the FILE_PATH variable to the console.
```

## Lists

You can define lists like this:

```verbo
names:
  - John
  - Mary
  - Peter
```

Or use natural language:

```verbo
The list "test foods" contains the following items:
  - apple
  - banana
  - carrot
  ... and other 10 random items
```

This is useful for defining test data.

## Objects

You can define objects like this:

```verbo
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

## Methods

You can attach methods to objects like this:

```
A "Person" object has the "yell" method. This method returns the person's name in uppercase.
```

Or use it to mutate the object:

```
A "Person" object has the "grow" method. This method increases the person's age by 1.
```

## Functions

You can define functions like this:

```
Define a function called "sum". It receives two parameters, "a" and "b". It returns the sum of "a" and "b".
```

## Conditions

You can define conditions like this:

```
If the variable "age" is higher than 18, return "adult". Otherwise, return "minor".
```