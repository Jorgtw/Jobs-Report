const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const htmlPath = path.resolve('MANUALE.html');
if (!fs.existsSync(htmlPath)) {
  console.error('MANUALE.html not found');
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;
let errors = [];
// Check CSS link existence
const link = document.querySelector('link[rel="stylesheet"]');
if (link) {
  const href = link.getAttribute('href');
  let cssPath;
  if (href.startsWith('http')) {
    // external, ignore for local test
  } else {
    cssPath = path.resolve(path.dirname(htmlPath), href);
    if (!fs.existsSync(cssPath)) {
      errors.push(`Missing CSS: ${href} => ${cssPath}`);
    }
  }
} else {
  errors.push('No stylesheet link found');
}
// Check all img src paths
const imgs = Array.from(document.querySelectorAll('img'));
imgs.forEach(img => {
  const src = img.getAttribute('src');
  if (!src) return;
  let imgPath;
  if (src.startsWith('file:///')) {
    imgPath = src.replace('file:///', '').replace(/%20/g, ' ');
    // Resolve from root drive (e.g., C:/...)
    if (!path.isAbsolute(imgPath)) {
      imgPath = path.resolve('/', imgPath);
    }
  } else {
    imgPath = path.resolve(path.dirname(htmlPath), src);
  }
  if (!fs.existsSync(imgPath)) {
    errors.push(`Missing image: ${src} => ${imgPath}`);
  }
});
if (errors.length === 0) {
  console.log('All resources exist');
  process.exit(0);
} else {
  console.error('Resource errors:');
  errors.forEach(e => console.error(e));
  process.exit(1);
}
