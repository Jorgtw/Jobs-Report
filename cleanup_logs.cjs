const fs = require('fs');
const files = [
  'src/contexts/CompanyContext.tsx',
  'src/utils/companyStatePolicy.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove debug logs
  content = content.replace(/console\.log\("\[CompanyContext\] Policy Check for company:".*?\);/gs, "");
  content = content.replace(/console\.log\("\[CompanyContext\] Result for".*?\);/gs, "");
  content = content.replace(/console\.log\("\[Policy Debug\]", \{.*?\n  \}\);/gs, "");
  content = content.replace(/console\.log\("\[CompanyContext\] Optimistic access granted.*?\);/gs, "");
  
  fs.writeFileSync(file, content);
});
console.log('Cleaned up debug logs.');
