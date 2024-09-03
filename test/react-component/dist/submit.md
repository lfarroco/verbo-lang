

Your task is to generate a program that implements the functionality
described in a series of virtual files. 
Each file name is delimited by double equal signs (==).
These virtual files are from "Verbo", a programming language that allows describing
software with natural language.
Software described in Verbo has the following properties:
- A single mutable state that holds all the data
- Events that can change the state
- Constants
- Functions
- Objects
- Types
- Ports that allow the software to interact with the external world
All Verbo files are written in Markdown format.
The output of the program should be a single file that implements the described functionality.
A single "main" function or class should be generated that will run the software.
Avoid importing external libraries.
That "main" function or class should accept the following parameters:
- An object with parameters that will be used to configure the software
- An object that will be used to initialize the state
- An object with port function that can be used by the software
The intention of the language is allowing the user to create simple, self-contained software.
One example of such main function that could be generated is:
export function main(config, initialState, ports) {
  const url = config.baseUrl + "/users";
  const state = initialState;
  // using ports:
  ports.print("Hello, world!");
  ports.updateUser({ name: "Alice" });
  ports.sendEmail({ to: "", subject: "", body: "" });
Using those parameters is not obligatory.
If the target language is object-oriented, "main" will be a class.
If the target language is functional, "main" will be a function.
Multiparadigm languages will have the choice of using a class or a function.
The generated "main" function should be exposed to make it importable by other code, so that the user
may use it in their own codebase.

Starting from the file "main.md", generate code that implements the described software.
The generated code should represent a single ouput file that can be run in the target language.

If the code description says something like "... generate n items", or "generate n random items",
it means that you should generate data that fits that context.

As the Verbo language is language-agnostice, you may use any language constructs
that will be appropriate to implement the described functionality.
For example, if the description defines an "object", you are free to use a class, 
struct or dictionary depending on what will be more convenient in the target language.
The target programming language is TSX.
The response should come as a single block of code.
It is very important that the generated response contains only code.
If you want to add an explanation, use comments.
The code should not be wrapped in backticks.
After the code is generated, it will be fed into a formatter and linter, so ensure
that no illegal artifacts are present.


== user-table.md ==

A User Table is a component that lists all the users in the system. 
The component has a single parameter: users, which is an list of User objects.
Each row in the table represents a user.
Each column in the table represents a property of the user.
Each cell in the table has an input field to edit the value.
When editing a field, the state should be updated.


== users.md ==

A User is a object with the following properties:
- `id` (string): The unique identifier of the user 
- `name` (string): The name of the user.
- `email` (string): The email of the user.
- `age` (number): The age of the user.



== main.md ==


This defines a component called "TestUserComponent", a jsx React component. 

It generates a list of 10 random users and renders them in the User Table component.

