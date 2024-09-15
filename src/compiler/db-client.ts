import { listFilesAt, readFile, writefile } from "../utils.ts";
import { compileFiles } from "./compileFiles.ts";

export default async function compile({
	workingDir,
	verboDir,
	aiProvider,
}: {
	workingDir: string;
	verboDir: string;
	aiProvider: (prompt: string) => Promise<string>;
}) {
	console.log("Generating DB clients from spec, schema and models...");

	const specs = listFilesAt(workingDir + '/models');

	const schema = readFile(verboDir + '/init.sql');

	const models = readFile(verboDir + '/models.ts');

	const compiledSpecs = compileFiles(specs, workingDir);

	const prompt = `
Task Overview:
You are tasked with generating a series of TypeScript database clients based on the provided application specification,
which includes descriptions in "Verbo", a database schema and TypeScript models.
These will be provided as virtual files.

Input Details:
- File names are enclosed by double equal signs (==) as delimiters.
- The Verbo language is an abstract programming language that uses natural language to describe simple, self-contained software systems.
- Each Verbo file is formatted in Markdown and contains:
  - One or more functional descriptions of models.
  - A model may reference other models.
- The database schema file (init.sql) is written in standard PostgreSQL statements.
- TypeScript types that describe each table in the database schema.

Your Output:
- Generate a series of database clients, one for each model described in the Verbo files.
- Those database clients should be compatible with the Deno psql library (deno.land/x/postgres).
- Format the output as Markdown, and wrap the code in triple backticks (\`\`\`) to ensure proper display.
- You should generate functions to create, read one, read all, update and delete records for each model.
- Each client function should receive:
  - A database client instance.
  - The data to be inserted or updated.
  - If a relationship between two models exists, create a function to handle that relationship. Example: getting all posts for a user.
- Each client function should return a Promise with the result of the operation.
- You don't need to redeclared the models. Import them from "./models.ts".

Key Guidelines:
- Ambiguity Handling: If any Verbo descriptions are ambiguous or incomplete, make reasonable assumptions and document them clearly in comments.
- Processing: Treat all provided files as part of one logical system. Ensure consistency between the models described in Verbo and the database schema. Types should directly map to the database schema.
- Output Format: The TypeScript code must be well-formatted and suitable for immediate integration, including compliance with common TypeScript linting rules. Avoid unnecessary abstractions—focus on providing a straightforward mapping to the database schema.

Example Input:

Verbo Model Descriptions:

== models/user.md ==
A user has a name, an email, and many posts.

== models/post.md ==
A post has a title and content. A post can have multiple users as authors.

== init.sql ==

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE users_posts (
  user_id INTEGER REFERENCES users(id),
  post_id INTEGER REFERENCES posts(id)
);

Your output should generate TypeScript types based on the schema and the Verbo model definitions. For example:

\`\`\`typescript

export async function getUser(client: Client, id: number): Promise<User> {
  const result = await client.queryObject<User>\`SELECT * FROM users WHERE id = \${id};\`;
  return result.rows[0];
}

export async function getUsers(client: Client): Promise<User[]> {
  const result = await client.queryObject<User>\`SELECT * FROM users;\`;
  return result.rows;
}

export async function createUser(client: Client, name: string, email: string): Promise<User> {
  const result = await client.queryObject<User>\`INSERT INTO users (name, email) VALUES (\${name}, \${email}) RETURNING *;\`;
  return result.rows[0];
}

export async function updateUser(client: Client, user:User): Promise<User> {
  const result = await client.queryObject<User>\`UPDATE users SET name = \${user.name}, email = \${user.email} WHERE id = \${user.id} RETURNING *;\`;
  return result.rows[0];
}

export async function deleteUser(client: Client, id:number): Promise<void> {
  await return client.queryObject<void>\`DELETE FROM users WHERE id = \${id};\`;
}

// ...same thing for posts

// relationship functions

export async function getPostsForUser(client: Client, userId: number): Promise<Post[]> {
  const result = client.queryObject<Post>\`SELECT * FROM posts WHERE user_id = \${userId};\`;
  return result.rows;
}

\`\`\`

Final Notes:
- Ensure that your TypeScript types are fully consistent with both the Verbo model descriptions and the SQL schema.
- Be explicit in handling relationships between models (e.g., one-to-many, many-to-many).
- Document any assumptions you make in the TypeScript file as comments.
`;
	const submitPrompt = `
${prompt}
${compiledSpecs}
== init.sql ==
${schema}
== models.ts ==
${models}
`;

	console.log("The prompt:", submitPrompt);

	console.log(
		"Writing models-prompt to output folder. It contains the prompt sent to the AI provider."
	);
	writefile(`${verboDir}/db-client-prompt`, submitPrompt);

	console.log("Submitting code to the AI...");

	// TODO: should be part of the ai provider

	let text = await aiProvider(submitPrompt);

	console.log(`AI response: ${text} `);

	writefile(`${verboDir}/db-client-response`, text);
	text = text.replace("```typescript", "```");
	text = text.split("```")[1];

	console.log("Extracted code from the AI response.");

	console.log(`Writing main.ts to the output folder`);

	writefile(`${verboDir}/db-client.ts`, text);

	console.log("Your code is ready in the target output folder.");

}

