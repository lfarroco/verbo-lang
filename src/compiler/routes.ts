import { readFile, writefile } from "../utils.ts";

export default async function compile({
	workingDir,
	verboDir,
	aiProvider,
}: {
	workingDir: string;
	verboDir: string;
	aiProvider: (prompt: string) => Promise<string>;
}) {
	console.log("Generating API routes from db clients...");

	const routes = readFile(workingDir + '/routes.md'); // todo: rename to "specsdir?"

	const dbClients = readFile(verboDir + '/db-client.ts');

	const prompt = `
Task Overview:
You are tasked with generating a series of Deno TypeScript API routes, based on a list of desired routes and available database clients.
These will be provided as virtual files. The list of routes is defined in Verbo, an abstract programming language that describes software systems using natural language.

Input Details:
- File names are enclosed by double equal signs (==) as delimiters.
- The Verbo language is an abstract programming language that uses natural language to describe simple, self-contained software systems.
- The file with the db clients (db-client.sql) is written in Deno TypeScript, using the psql library.

Your Output:
- Generate a series of API handlers, one for each endpoint described in the Verbo files.
- Use the available database clients to interact with the database.
- Use standard Deno HTTP server to handle incoming requests and RESTful API conventions (GET, POST, PUT, DELETE).
- Format the output as Markdown, and wrap the code in triple backticks (\`\`\`) to ensure proper display.
- Endpoints not specified in the Verbo files should not be implemented (even if a db client function exists).
- You don't need to redeclared the models. Import them from "./models.ts".
- All endpoints should receive and return data in the JSON format.
- You should use the Oak framework for handling HTTP requests.
- You should expose a single function called "handleRoutes" that receives a database Client instance and an Router instance and sets up the routes.

Key Guidelines:
- Ambiguity Handling: If any Verbo descriptions are ambiguous or incomplete, make reasonable assumptions and document them clearly in comments.
- Processing: Treat all provided files as part of one logical system. Ensure consistency between the models described in Verbo and the database schema. Types should directly map to the database schema.
- Output Format: The TypeScript code must be well-formatted and suitable for immediate integration, including compliance with common TypeScript linting rules. Avoid unnecessary abstractions—focus on providing a straightforward mapping to the database schema.

Example Input:

Verbo Model Descriptions:

== routes.md ==
The application has the following endpints:
- users/
- users/{id}
- posts/
- posts/{id}

The top-level routes are for listing and creating.
The nested routes are for getting a single user or post by ID, updating or deleting them.

There's also a route for getting all posts for a user:
- users/{id}/posts

== db-client.ts ==

\`\`\`typescript
import { Client } from "https://deno.land/x/postgres/mod.ts";
import { User, Post } from "./models.ts";

export async function getUser(client: Client, id: number): Promise<User> {
  // implementation here
}

export async function getUsers(client: Client): Promise<User[]> {
 // implementation here
}

//... other functions

export async function getPostsForUser(client: Client, userId: number): Promise<Post[]> {
// implementation here
}

Your output should generate TypeScript types based on the schema and the Verbo model definitions. For example:

\`\`\`typescript
import { Router, Context, RouterContext } from "https://deno.land/x/oak/mod.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";
import { User, Post } from "./models.ts";

import * as dbClients from "./db-client.ts";

export function handleRoutes(client:Client, router: Router) {

  router
    .get("/users", async (ctx:Context) => {
      ctx.response.body = await dbClients.getUsers(client);
    })
    // any routes that access "params" need to use the RouterContext type
    .get("/users/:id", async (ctx:RouterContext<"/users/:id", {id: string}>) => {
      ctx.response.body = await dbClients.getUser(client, ctx.params.id);
    })
    .post("/users", async (ctx:Context) => {
      const user: User = await ctx.request.body.json();
      ctx.response.body = await dbClients.createUser(client, user);
    })
    .put("/users/:id", async (ctx:RouterContext<"/users/:id", {id: string}>) => {
      const user: User = await ctx.request.body.json();
      ctx.response.body = await dbClients.updateUser(client, ctx.params.id, user);
    })
    .delete("/users/:id", async (ctx:RouterContext<"/users/:id", {id: string}>) => {
      ctx.response.body = await dbClients.deleteUser(client, ctx.params.id);
    })
    //... other routes for posts
    .get("/users/:id/posts", async (ctx:RouterContext<"/users/:id/posts", {id: string}>) => {
      ctx.response.body = await dbClients.getPostsForUser(client, ctx.params.id);
    });

}

\`\`\`

Final Notes:
- Ensure that your TypeScript types are fully consistent with both the Verbo model descriptions and the SQL schema.
- Be explicit in handling relationships between models (e.g., one-to-many, many-to-many).
- Document any assumptions you make in the TypeScript file as comments.
`;
	const submitPrompt = `
${prompt}
== routes.ts ==
${routes}
== db-client.ts ==
${dbClients}

The functions listed above are the only ones that should be called by the routes.

`;

	console.log("The prompt:", submitPrompt);

	console.log(
		"Writing routes-prompt to output folder. It contains the prompt sent to the AI provider."
	);
	writefile(`${verboDir}/routes-prompt`, submitPrompt);

	console.log("Submitting code to the AI...");

	let text = await aiProvider(submitPrompt);

	console.log(`AI response: ${text} `);

	writefile(`${verboDir}/routes-response`, text);
	text = text.replace("```typescript", "```");
	text = text.split("```")[1];

	console.log("Extracted code from the AI response.");

	console.log(`Writing main.ts to the output folder`);

	writefile(`${verboDir}/routes.ts`, text);

	console.log("Your code is ready in the target output folder.");

}

