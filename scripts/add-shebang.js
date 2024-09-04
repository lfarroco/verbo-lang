// add-shebang.js
const fs = require('fs');
const filePath = 'dist/index.js'; // Replace with your actual compiled output file

const data = fs.readFileSync(filePath, 'utf8');
const shebang = '#!/usr/bin/env node\n';

if (!data.startsWith(shebang)) {
	fs.writeFileSync(filePath, shebang + data);
	console.log(`Shebang added to ${filePath}`);
} else {
	console.log(`Shebang already present in ${filePath}`);
}