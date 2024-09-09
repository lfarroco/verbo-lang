import { listFilesAt, writefile } from "../utils.ts";
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

	const compiledFiles = compileFiles(files, workingDir);

	const prompt = `
Task Overview:
Your task is to generate a PostgreSQL schema based on a series of models described in virtual files.
These files contain descriptions written in "Verbo," an abstract programming language that specifies software systems using natural language.

Input Details:
- Each file name is enclosed by double equal signs (==) as delimiters, e.g., == file_name ==.
- The Verbo language is a simplified specification tool that uses natural language to describe software models and relationships.
- Files are formatted in Markdown and contain one or more model definitions.
- Models may reference one another, and relationships (e.g., one-to-many, many-to-many) are described using natural language.

Your Output:
- Output Format: A single SQL file containing all the models from the provided Verbo files, formatted as Markdown with SQL code enclosed in triple backticks (\`\`\`sql\`\`\`).
- Foreign Keys: Ensure foreign keys are properly defined for any model references.
- Relationship Handling: For one-to-many relationships, define appropriate foreign keys. For many-to-many relationships, create necessary join tables.
- Constraints: Implement any constraints (e.g., NOT NULL, UNIQUE) as described by the models.
- Normalization: Ensure the database schema follows standard normalization practices where applicable.
- ids, created_at, updated_at: Include an id field as the primary key for each table, along with created_at and updated_at timestamp fields.
  
Key Guidelines:
- Handling Ambiguity: If any model descriptions are incomplete, make reasonable assumptions and document them as comments in the SQL file. Use comments to explain assumptions or decisions made to handle ambiguities (enclosed in -- SQL comments).
- Processing Order: Treat all provided files as a single cohesive project. Ensure the SQL file is structured to avoid errors when run, even if models reference each other across files.
- Modularity: The generated SQL should be modular, so that individual parts of the schema can be easily extended or modified in future iterations.
- Validation-Ready: The final output should be a well-formatted, valid SQL file that can be used directly or linted for integration into a project.
- One-to-Many Relationships: If a model has a list/array of another model, ensure the appropriate foreign key relationship is established.
- Many-to-Many Relationships: If two models reference each other in a many-to-many relationship, create a join table to represent this relationship. Example: A student can enroll in multiple courses, and a course can have multiple students.

Example Input:

== models/user.md ==

A user has a name and an email. A user can have many posts.

== models/post.md ==

A post has a title and content. A post belongs to a user.

== models/comment.md ==

A comment has content. A comment belongs to a post.

Example SQL Output:

\`\`\`sql
-- Table for users
CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL, 
	email VARCHAR(255) NOT NULL UNIQUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

-- Table for posts, with foreign key referencing users
CREATE TABLE posts (
	id SERIAL PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	content TEXT NOT NULL,
	user_id INTEGER REFERENCES users(id),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

-- One user can have many posts

-- Table for comments, with foreign key referencing posts
CREATE TABLE comments ( 
	id SERIAL PRIMARY KEY,
	content TEXT NOT NULL,
	post_id INTEGER REFERENCES posts(id),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
); 
\`\`\`

Processing Instruction:
Start by analyzing the file main.md, then process the other files in the order they are referenced.
Generate SQL code that fully implements the described software models, ensuring consistency and referential integrity throughout the schema.
`;
	const submitPrompt = `${prompt}\n${compiledFiles}`;

	console.log("The prompt:", submitPrompt);

	console.log(
		"Writing prompt.md to output folder. It contains the prompt sent to the AI provider."
	);

	writefile(`${verboDir}/sql-prompt`, submitPrompt);

	console.log("Submitting code to the AI...");

	let text = await aiProvider(submitPrompt);

	console.log(`AI response: ${text} `);

	writefile(`${verboDir}/sql-response`, text);

	text = text.replace("```sql", "```");
	text = text.split("```")[1];

	console.log("Extracted code from the AI response.");

	console.log(`Saving schema...`);

	writefile(`${verboDir}/init.sql`, text);

	console.log("The code has been successfully generated");
}