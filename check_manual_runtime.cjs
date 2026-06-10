const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.resolve('MANUALE.html');
if (!fs.existsSync(htmlPath)) {
  console.error('MANUALE.html not found');
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf8');
let errors = [];
// 1. Check stylesheet link (if any)
const linkMatch = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/i);
if (linkMatch) {
  const href = linkMatch[1];
  if (!href.startsWith('http')) {
    const cssPath = path.resolve(path.dirname(htmlPath), href);
    if (!fs.existsSync(cssPath)) {
      errors.push(`Missing CSS file: ${href} => ${cssPath}`);
    }
  }
} else {
  // No external stylesheet (inline style present) – fine
}
// 2. Find all img src attributes
const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
let match;
while ((match = imgSrcRegex.exec(html)) !== null) {
  const src = match[1];
  let imgPath;
  if (src.startsWith('file:///')) {
    imgPath = src.replace('file:///', '').replace(/%20/g, ' ');
    // Windows drive letters appear after file:///, e.g., C:/Users/... => keep as absolute
    imgPath = path.resolve('/', imgPath);
  } else if (/^[A-Za-z]:\\/.test(src) || /^[A-Za-z]:\//.test(src)) {
    // Absolute Windows path like C:\Users\... or C:/Users/...
    imgPath = src.replace(/\\/g, '\\'); // keep backslashes
  } else {
    // Relative path
    imgPath = path.resolve(path.dirname(htmlPath), src);
  }
  if (!fs.existsSync(imgPath)) {
    errors.push(`Missing image file: ${src} => ${imgPath}`);
  }
}
// 3. Evaluate inline script blocks for syntax errors
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
while ((match = scriptRegex.exec(html)) !== null) {
  const scriptContent = match[1];
  // Skip empty scripts
  if (!scriptContent.trim()) continue;
  try {
    const sandbox = { console, window: {}, document: {} };
    vm.runInNewContext(scriptContent, sandbox, { timeout: 1000 });
  } catch (e) {
    errors.push(`Script error: ${e.message}`);
  }
}
if (errors.length === 0) {
  console.log('All runtime checks passed');
  process.exit(0);
} else {
  console.error('Runtime check failures:');
  errors.forEach(e => console.error(e));
  process.exit(1);
}
