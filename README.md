# verbo-lang
Create software using natual language

## Demo

Given a directory with three markdown files, model.md, example-todos.md, and main.md, with the following contents:


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
