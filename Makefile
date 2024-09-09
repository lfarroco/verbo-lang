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
	deno run --allow-all main.ts --dir test/guild  -a gemini --target sql --envfile .env -v

test-models: 
	deno run --allow-all main.ts --dir test/guild  -a gemini --target model --envfile .env -v

test-db-client: 
	deno run --allow-all main.ts --dir test/guild  -a gemini --target db-client --envfile .env -v

test-routes:
	deno run --allow-all main.ts --dir test/guild  -a gemini --target routes --envfile .env -v

run-db:
	docker run -d \
	--rm \
	--name verbo-postgres \
	-e POSTGRES_PASSWORD=mysecretpassword \
	-e PGDATA=/var/lib/postgresql/data/pgdata \
	-p 55400:5432 \
	-v "$(shell pwd)"/dist/init.sql:/docker-entrypoint-initdb.d/data.sql \
	postgres