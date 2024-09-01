
You will receive a list of files describing how a software should work.
Each file name is delimited by a double equal sign (==).
Starting from the file "main.md", generate code that will implement the software.
If the code description has the pattern "... generate" it means that you should generate data that fits that context.
The response should come as a single block of code.
The code should not be wrapped in backticks.
The target language is JavaScript.


== example-todos.md ==

This defines a constant called "todos".

It is a list of example todo items.
All items are not completed, except for the first one.

todos:
 - name: buy bread, due to: 01/01/2025
 - name: buy milk, due to: 02/02/2026
 ... other 5 example items

== model.md ==

A "To-Do Item" object has the following properties:

- name, a string up to 10 characters
- due to date
- completed (bool)

Here are some functions that allow interacting with a todo item:

- print todo item:
  This function prints to the console a string that represents the todo item.
  The string follows this pattern:
  "[<if completed, "x", otherwise, just " ">] <name> - due to <due to date>"
  Completed item example: [x] buy bread - due to 2025-01-01
  Incomplete item example: [ ] buy milk - due to 2026-02-02

- mark todo item as completed:
  This function changes the completed property of the todo item to True.

- mark todo item as incomplete:
  This function changes the completed property of the todo item to False.


== main.md ==

Pick the list of todos located at example-todos.md.

For each todo item, call the function "print todo item".


