const fs = require('fs');
const file = 'src/services/dbService.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix duplicate 'status: active'
content = content.replace(/status: 'active',\s+status: 'active'/g, "status: 'active'");

// Fix unused prevError
content = content.replace(/const prevError = prevErrorText \? `\${prevErrorText}\\n\\n--- Retry at \${new Date\(\)\.toISOString\(\)} ---\\n` : '';/g, "");

fs.writeFileSync(file, content);
console.log('Fixed build errors in dbService.ts');
