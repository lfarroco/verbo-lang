import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

interface ScaffoldOptions {
	verboDir: string;
	outputPath: string;
}

// These paths are relative to the root of the verbo-lang project itself
const TEMPLATE_DIR = "./templates";
const SERVER_TEMPLATE_PATH = join(TEMPLATE_DIR, "server.ts.template");
const DOCKER_COMPOSE_TEMPLATE_PATH = join(
	TEMPLATE_DIR,
	"docker-compose.yml.template",
);
const DOTENV_TEMPLATE_PATH = join(TEMPLATE_DIR, "dotenv.template");

export async function scaffoldRestServer(options: ScaffoldOptions): Promise<void> {
	const { verboDir, outputPath } = options;

	console.log(`\nScaffolding new project in: ${outputPath}`);

	// 1. Define and create directory structure
	const srcDir = join(outputPath, "src");
	const dbDir = join(outputPath, "db");
	await ensureDir(srcDir);
	await ensureDir(dbDir);

	// 2. Copy generated files from .verbo to the new project structure
	const fileMappings: Record<string, string> = {
		"init.sql": join(dbDir, "init.sql"),
		"db-client.ts": join(srcDir, "db-client.ts"),
		"models.ts": join(srcDir, "models.ts"),
		"routes.ts": join(srcDir, "routes.ts"),
	};

	for (const [source, destination] of Object.entries(fileMappings)) {
		const sourcePath = join(verboDir, source);
		try {
			await Deno.copyFile(sourcePath, destination);
			console.log(`  ✓ Copied ${source}`);
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) {
				console.warn(`  ✗ Warning: Generated file not found: ${sourcePath}. Skipping.`);
			} else {
				throw error;
			}
		}
	}

	// 3. Copy and process template files
	await Deno.copyFile(SERVER_TEMPLATE_PATH, join(srcDir, "main.ts"));
	await Deno.copyFile(DOCKER_COMPOSE_TEMPLATE_PATH, join(outputPath, "docker-compose.yml"));
	await Deno.copyFile(DOTENV_TEMPLATE_PATH, join(outputPath, ".env"));
	console.log(`  ✓ Created server entrypoint, docker-compose.yml, and .env`);

	console.log("\n✨ Scaffolding complete! Your new REST server is ready.");
	console.log(
		`To get started, run:\n  cd ${outputPath}\n  docker-compose up -d\n  deno run --allow-all --watch src/main.ts`,
	);
}