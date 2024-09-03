A "To-Do Item" object has the following properties:

- name, a string up to 10 characters
- due date
- completed (bool)

Here are some functions that allow interacting with a todo item:

- print todo item:
  This function prints to the console a string that represents the todo item.
  The string follows this pattern:
  "[<if completed, "x", otherwise, just " ">] <name> - due to <due date>"
  Completed item example: [x] buy bread - due to 2025-01-01
  Incomplete item example: [ ] buy milk - due to 2026-02-02

- mark todo item as completed:
  This function changes the completed property of the todo item to True.

- mark todo item as incomplete:
  This function changes the completed property of the todo item to False.

- remove todo item:
  This function removes a todo item from the list of todos.
