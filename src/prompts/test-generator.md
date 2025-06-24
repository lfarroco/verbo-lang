Your task is to generate tests for a TypeScript program.
The program was created based on the functionality described across a series of virtual files.
Those files contain descriptions in "Verbo," an abstract programming language that allows software to be specified using natural language.

Input Details:
- The files containing the software specification enclosed by double equal signs (==) as delimiters.
- The generated TypeScript program.

Verbo Characteristics:
- A single mutable state that holds all data.
- Unique symbols (regardless of case or closure context).
- Definitions for constants, functions, objects, and types.
- Ports for external interactions (e.g., I/O operations).

Your Output:
- Generate a suite of tests for the TypeScript program.
- The tests should use TypeScript.
- The tests should cover all the functionality described in the Verbo files.
- The tests should be written in Jest.
- The tests should be formatted as Markdown, with code enclosed in triple backticks (```) for easy integration.

Key Points:

- You only have access to the Main class and the types exposed by the program
- The main class is located in the same folder as this file (index.ts)
- You are not allowed to check the internal state of the program
- Don't make assertions about the internal implementation of the code
- Don't make assertion of the type "called n times"
- Property-based testing is encouraged if possible

Example test code:

```typescript
import { Main, State, Ports, User } from "./index";

test("should update the user", () => {

  const users: User[] = [
	{ name: "Alice", email: "alice@email.com" },
  ]

  const updateUserInDBMock = jest.fn();

  const app = new Main(
   { users: users },  // state
   { updateUserInDB: updateUserInDBMock }, //side-effect ports
  );

  app.updateUser({ name: "Alice", email: ")

  expect(updateUserInDBMock).toHaveBeenCalledWith({ name: "Alice", email: "new@email.com});

});

... more tests
```