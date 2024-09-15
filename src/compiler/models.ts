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
	console.log("Generating SQL from models...");

	const files = listFilesAt(workingDir + '/models');

	const schemaFile = readFile(verboDir + '/init.sql');

	const compiledFiles = compileFiles(files, workingDir);

	const prompt = `
Task Overview:
You are tasked with generating a series of TypeScript types based on the provided application specification, which includes descriptions in "Verbo" and a database schema.
These will be provided as virtual files.

Input Details:
- File names are enclosed by double equal signs (==) as delimiters.
- The Verbo language is an abstract programming language that uses natural language to describe simple, self-contained software systems.
- Each Verbo file is formatted in Markdown and contains:
  - One or more functional descriptions of models.
  - A model may reference other models.
- The database schema file (init.sql) is written in standard PostgreSQL statements.

Your Output:
- Generate a single TypeScript file that declares all types described in the database schema.
- Each table from the schema should have a corresponding TypeScript type definition.
- These types will be used for building a database client that enables querying the database.
- Format the output as Markdown, and wrap the code in triple backticks (\`\`\`) to ensure proper display.

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

== models/comment.md ==
A comment has content and belongs to a post.

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
export type User = { id: number; name: string; email: string; }

export type Post = { id: number; title: string; content: string; }

export type UserPost = { userId: number; postId: number; }
\`\`\`

Final Notes:
- Ensure that your TypeScript types are fully consistent with both the Verbo model descriptions and the SQL schema.
- Be explicit in handling relationships between models (e.g., one-to-many, many-to-many).
- Document any assumptions you make in the TypeScript file as comments.
`;
	const submitPrompt = `
${prompt}
${compiledFiles}
== init.sql ==
${schemaFile}`;

	console.log("The prompt:", submitPrompt);

	console.log(
		"Writing models-prompt to output folder. It contains the prompt sent to the AI provider."
	);
	writefile(`${verboDir}/models-prompt`, submitPrompt);

	console.log("Submitting code to the AI...");

	// TODO: should be part of the ai provider

	let text = await aiProvider(submitPrompt);

	console.log(`AI response: ${text} `);

	writefile(`${verboDir}/models-response`, text);
	text = text.replace("```typescript", "```");
	text = text.split("```")[1];

	console.log("Extracted code from the AI response.");

	console.log(`Writing main.ts to the output folder`);

	writefile(`${verboDir}/models.ts`, text);

	console.log("Your code is ready in the target output folder.");

}

