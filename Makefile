build:
	npm run build

test-gemini: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai gemini --envfile .env -v 

test-anthropic: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai anthropic --envfile .env -v

test-openai: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai openai --envfile .env -v

test-ollama: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai ollama --envfile .env -v