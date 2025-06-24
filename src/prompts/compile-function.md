Your task is to generate a TypeScript function based on the functionality described across a series of virtual files.
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
 - A pure function 
 - No use of external libraries or dependencies.
 - Complex operations (like running a server) should be handled with callbacks
 - The function is only declared and exported, not executed.
- The response should be formatted as Markdown, with code enclosed in triple backticks (```) for easy integration.
- The function accepts arguments defined by the user in the Verbo files.
- The function returns a value based on the user's requirements.

Example Output Structure:

export type User = {
  id: string;
  name: string;
}

export function yell (
  user:User,
  print: (name: string) => void,
): string {

  function yellName(name: string) {
    return name.toUpperCase();
  }

  const uppercaseName = yellName(user.name);

  print(uppercaseName);

  return uppercaseName;

}
  
Key Guidelines:
- Purity: the function is not allowed to mutate state or performing any side effects. If the user needs to perform an effect
- Encapsulation: Place all internal functions, constants, and variables within function to ensure encapsulation.
- Handling Ambiguity: If any Verbo descriptions are ambiguous or incomplete, make reasonable assumptions and document them in comments.
- Processing Order: Evaluate all provided files as one logical unit, ensuring that the main function can run without errors.
- Final Output: The generated TypeScript code should be a single, well-formatted file, suitable for immediate integration and further linting.

Starting from the file "main.md", generate the required code that fully implements the described software.