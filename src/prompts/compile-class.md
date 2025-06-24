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
 - A main class that initializes and runs the software.
 - No use of external libraries or dependencies.
 - Complex operations (like running a server) should be handled via the provided ports.
 - The main class is only declared and exported, not executed.
- The response should be formatted as Markdown, with code enclosed in triple backticks (```) for easy integration.

The main class:
Constructor Parameters:
- initialState: an optional initial state (null if no state is provided).
- ports: an object containing functions for external interactions.

Example Output Structure:

export type State = {
  users: User[];
}

export type User = {
  id: string;
  name: string;
}

export type Ports = {
  print: (message: string) => void,
  createUserInDB: (user: User) => void,
  updateUserInDB: (user: User) => void,
  getUserFromDB: (id: string) => User
}

export class Main {
  private state: State;
  private ports: Ports;

  constructor(state: State, ports: Ports) {
    this.state = state;
    this.ports = ports;
  }

  private createUser(id: string, name: string): void {
    const user: User = { id, name };
    this.ports.createUserInDB(user);
    this.state.users.push(user);
  }

  // if defined in the Verbo files, you should add public methods 
  public updateUser(id: string, name: string): void {
    const user: User = this.ports.getUserFromDB(id);
    user.name = name;
    this.ports.updateUserInDB(user);
  }

}
  
Key Guidelines:
- State Mutability: The local state is mutable, but all other side effects should be managed through the provided ports.
- Encapsulation: Place all functions, constants, and variables within the main class to ensure encapsulation.
- Handling Ambiguity: If any Verbo descriptions are ambiguous or incomplete, make reasonable assumptions and document them in comments.
- Processing Order: Evaluate all provided files as one logical unit, ensuring that the main function can run without errors.
- Final Output: The generated TypeScript code should be a single, well-formatted file, suitable for immediate integration and further linting.

Starting from the file "main.md", generate the required code that fully implements the described software.