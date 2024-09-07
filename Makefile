build:
	npm run build

test-gemini: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai gemini --envfile .env -t class -v 

test-anthropic: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai anthropic --envfile .env -t class -v

test-openai: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai openai --envfile .env -t class -v

test-ollama: build
	node dist/index.js --source test/todo/source --output test/todo/dist  -ai ollama --envfile .env -t class -v

test-react: build
	node dist/index.js --source test/react-todo/source --output test/react-todo/dist  -ai gemini --target react --envfile .env -v

test-function: build
	node dist/index.js --source test/function/source --output test/function/dist  -ai gemini --target function --envfile .env -v