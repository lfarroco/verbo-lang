build:
	npm run build

test-gemini: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -a gemini --envfile .env -t class -v 

test-anthropic: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -a anthropic --envfile .env -t class -v

test-openai: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -a openai --envfile .env -t class -v

test-ollama: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -a ollama --envfile .env -t class -v

test-react: build
	node dist/index.js --source test/react-todo/source --output test/react-todo/dist  -a gemini --target react --envfile .env -v

test-function: build
	node dist/index.js --source test/function/source --output test/function/dist  -a gemini --target function --envfile .env -v

test-sql: 
	deno run --allow-all main.ts --dir test/todo  -a gemini --target sql --envfile .env -v

test-models: 
	deno run --allow-all main.ts --dir test/todo  -a gemini --target model --envfile .env -v

test-db-client: 
	deno run --allow-all main.ts --dir test/todo  -a gemini --target db-client --envfile .env -v

test-routes:
	deno run --allow-all main.ts --dir test/todo  -a gemini --target routes --envfile .env -v

run-db:
	docker run -d \
	--rm \
	--name verbo-postgres \
	-e POSTGRES_PASSWORD=mysecretpassword \
	-e PGDATA=/var/lib/postgresql/data/pgdata \
	-p 55400:5432 \
	-v "$(shell pwd)"/test/guild/results/init.sql:/docker-entrypoint-initdb.d/data.sql \
	postgres

scaffold:
	mkdir dist
	mkdir dist/src
	mkdir dist/src/models
	mkdir dist/src/db
	mkdir dist/db

	cp templates/main.template app/src/main.ts
	cp templates/dotenv.template app/.env
	cp templates/docker-compose.template app/docker-compose.yml

	cp test/guild/results/init.sql app/db/init.sql
	cp test/guild/results/db-client.ts app/src/db-client.ts
	cp test/guild/results/routes.ts app/src/routes.ts
	cp test/guild/results/models.ts app/src/models.ts

# --- Docker-based development (recommended; no host tooling required) ---
# All commands run inside the `dev` service container (see docker-compose.yml).
DEV := docker compose run --rm dev

dev-build:
	docker compose build dev

dev-up:
	docker compose up -d dev

dev-down:
	docker compose down

dev-shell:
	docker compose run --rm dev bash

dev-test:
	$(DEV) deno test -P

dev-check:
	$(DEV) deno check main.ts

dev-fmt:
	$(DEV) deno fmt

dev-fmt-check:
	$(DEV) deno fmt --check

dev-lint:
	$(DEV) deno lint

dev-help:
	$(DEV) deno run -A main.ts --help

ollama-start:
	docker compose up -d ollama

ollama-stop:
	docker compose stop ollama

ollama-pull:
	docker compose exec ollama ollama pull codegemma

db-start:
	docker compose up -d db

db-stop:
	docker compose stop db



