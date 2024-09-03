
Your task is to generate a TypeScript program based on the functionality described across a series of virtual files.
These files contain descriptions in "Verbo," an abstract programming language that allows software to be specified using natural language.

Input Details:
- Each file name is enclosed by double equal signs (==) as delimiters.
- The Verbo language enables users to create simple, self-contained software systems described in natural language.
- Each Verbo file is formatted in Markdown and contains one or more functional descriptions.

Verbo Characteristics:
- A single mutable state that holds all data.
- Unique symbols (regardless of case or closure context).
- Definitions for constants, functions, objects, and types.
- Ports for external interactions (e.g., I/O operations).

Your Output:
- Generate a single TypeScript file implementing the described functionality.
- The generated code should include:
 - A main function that initializes and runs the software.
 - No use of external libraries or dependencies.
 - Complex operations (like running a server) should be handled via the provided ports.
 - The main function is only declared and exported, not executed.

The main Function:
Parameters:
- initialState: an optional initial state (null if no state is provided).
- ports: an object containing functions for external interactions.

Example Output Structure:

type State = {
  users: User[];
}

export type User = {
  name: string;
}

export function main(
  initialState: State,
  ports: {
    print: (message: string) => void,
    createUserInDB: (user: User) => void,
    updateUserInDB: (user: User) => void,
    getUserFromDB: (id: string) => User
  }
): number {
  const state = { ...initialState }; // shallow copy of the initial state
  ...
  function createUser(id: string, name: string) { 
    const user = { id, name };
    ports.createUserInDB(user);
    state.users.push(user); 
  }
  createUser("123", "Bob");
  ...
  ports.print("Hello, world!");
  ports.updateUserInDB({ id: "11", name: "Alice" });
  const user = ports.getUserFromDB("123");
  ...
  return "completed!" // only return a value if specified by the user in the Verbo files
}

Key Guidelines:
- State Mutability: The local state is mutable, but all side effects should be managed through the provided ports.
- Encapsulation: Place all functions, constants, and variables within the main function to ensure encapsulation.
- Handling Ambiguity: If any Verbo descriptions are ambiguous or incomplete, make reasonable assumptions and document them in comments.
- Processing Order: Evaluate all provided files as one logical unit, ensuring that the main function can run without errors.
- Final Output: The generated TypeScript code should be a single, well-formatted file, suitable for immediate integration and further linting.
Starting from the file "main.md", generate the required code that fully implements the described software.


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


== main.md ==


The application state is composed of:
- A list of todos declared at example-todos.md.

For each todo item, call the function "print todo item".

Print "The number of todos is: x", where x is the total number of todos.

Print "== the second todo will be updated (completed) =="

Then, use the "mark todo item as completed" function on the second item.
After that, print the second item.

Print "== the first todo will be updated (incomplete)=="

Then, use the "mark todo item as incomplete" function on the first item.

After that, print the first item.

Remove the first item from the list of todos.

Print "== the first will be removed =="

Print "The number of todos is: x", where x is the total number of todos.

Print "===="

When all is done, print "Goodbye!".

