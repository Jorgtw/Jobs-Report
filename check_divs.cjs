const fs = require('fs');
const html = fs.readFileSync('jobs-report-demo.html', 'utf8');

const stack = [];
const regex = /<\/?div[^>]*>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const tag = match[0];
  if (tag.startsWith('</')) {
    if (stack.length === 0) {
      console.log('Unmatched closing tag at', match.index);
    } else {
      stack.pop();
    }
  } else if (!tag.endsWith('/>')) {
    stack.push({ tag, index: match.index });
  }
}

if (stack.length > 0) {
  console.log('Unclosed div tags:');
  stack.forEach(item => {
    const context = html.substring(item.index - 50, item.index + 100);
    console.log(item.index, item.tag, 'Context:', context);
  });
} else {
  console.log('All divs match.');
}
