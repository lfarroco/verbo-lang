build:
	npm run build
	echo '#!/usr/bin/env node' | cat - dist/index.js > temp.js && mv temp.js dist/index.js