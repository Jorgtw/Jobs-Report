const fs = require('fs');
const html = fs.readFileSync('jobs-report-demo.html', 'utf8');
const lines = html.split('\n');

const stack = [];
const regex = /<\/?div[^>]*>/g;

let lineNum = 1;
let indexInLine = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let match;
  while ((match = regex.exec(line)) !== null) {
    const tag = match[0];
    if (tag.startsWith('</')) {
      if (stack.length === 0) {
        console.log('Unmatched closing tag at line', i + 1);
      } else {
        stack.pop();
      }
    } else if (!tag.endsWith('/>')) {
      stack.push({ tag, line: i + 1 });
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed div tags:');
  stack.forEach(item => {
    console.log('Line ' + item.line + ': ' + item.tag);
  });
} else {
  console.log('All divs match.');
}
