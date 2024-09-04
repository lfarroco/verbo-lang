build:
	npm run build

lint:
	npx tsc --noEmit test/todo/dist/*.ts

test-gemini: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai gemini --envfile .env
	cat test/todo/dist/gemini-ts-main.ts
	$(MAKE) lint

test-openapi: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai openapi --envfile .env
	cat test/todo/dist/openapi-ts-main.ts
	$(MAKE) lint

test-ollama: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai ollama --envfile .env
	cat test/todo/dist/ollama-ts-main.ts
	$(MAKE) lint