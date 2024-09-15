
// deno run --allow-net --allow-read mod.ts
import { Client } from "https://deno.land/x/postgres/mod.ts";
import { Application } from "https://deno.land/x/oak@v17.0.0/application.ts";
import { Router } from "https://deno.land/x/oak@v17.0.0/router.ts";
import "jsr:@std/dotenv/load";
import { handleRoutes } from "./routes.ts";

const client = new Client({
	user: Deno.env.get("PSQL_USER"),
	database: Deno.env.get("PSQL_DB"),
	hostname: Deno.env.get("PSQL_HOST"),
	password: Deno.env.get("PSQL_PASSWORD"),
	port: Deno.env.get("PSQL_PORT"),
});

await client.connect();

const router = new Router();

handleRoutes(client, router);

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: parseInt(Deno.env.get("API_PORT") || '8000') });

console.log("Server has stopped")

await client.end();

console.log("Database connection closed");