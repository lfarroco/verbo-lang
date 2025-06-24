Your task is to generate a TypeScript React component program based on the functionality described across a series of virtual files.
These files contain descriptions in "Verbo," an abstract programming language that allows software to be specified using natural language.

Input Details:
- Each file name is enclosed by double equal signs (==) as delimiters.
- The Verbo language enables users to create simple, self-contained software systems described in natural language.
- Each Verbo file is formatted in Markdown and contains one or more functional descriptions.

Verbo Characteristics for React components:
- A single mutable state that holds all data.
- Unique symbols (regardless of case or closure context).
- Definitions for constants, functions, objects, and types.
- Ports for external interactions (e.g., I/O operations).

Your Output:
- Generate a single TypeScript (.tsx) file implementing the described functionality into a single React Component.
- The generated code should include:
 - A functional component that initializes and runs the software.
 - No use of external libraries or dependencies (besides React)
 - Complex operations (like running a server) should be handled via the provided ports.
 - The main component is only declared and exported, not executed.
- The response should be formatted as Markdown, with code enclosed in triple backticks (```) for easy integration.

The React component:
Properties:
- initialState: an optional initial state (null if no state is provided).
- ports: an object containing functions for external interactions.

Example Output Structure:

import React, { useState } from 'react';

// Define types
export type User = {
  id: string;
  name: string;
}

export type Ports = {
  print: (message: string) => void;
}

// Main Component
const UserList: React.FC<{ state:User[], ports: Ports }> = ({ state, ports }) => {
  // Initial state setup with useState for managing users
  const [users, setUsers] = useState<User[]>(state);

  return (
    <div>
      <h1>User List</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} (ID: {user.id})
          </li>
        ))}
      </ul>
      <button onClick={() => ports.print('Fetching users...')}>
        Fetch Users
      </button>
    </div>
  );
};

export default UserList;

  
Key Guidelines:
- State Mutability: The local state is mutable, but all other side effects should be managed through the provided ports.
- Handling Ambiguity: If any Verbo descriptions are ambiguous or incomplete, make reasonable assumptions and document them in comments.
- Visibility: Only the main React component and the types used by the component should be exported.
- Processing Order: Evaluate all provided files as one logical unit, ensuring that the main function can run without errors.
- Final Output: The generated React TypeScript code should be a single, well-formatted file, suitable for immediate integration and further linting.

Starting from the file "main.md", generate the required code that fully implements the described software.