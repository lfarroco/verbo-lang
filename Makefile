build:
	npm run build
	echo '#!/usr/bin/env node' | cat - dist/index.js > temp.js && mv temp.js dist/index.js

test-gemini: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai gemini --envfile .env
	cat test/todo/dist/gemini-ts-main.ts

test-openapi: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai openapi --envfile .env
	cat test/todo/dist/openapi-ts-main.ts

test-ollama: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai ollama --envfile .env
	cat test/todo/dist/ollama-ts-main.ts