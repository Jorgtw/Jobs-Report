const fs = require('fs');
let html = fs.readFileSync('jobs-report-demo.html', 'utf8');
html = html.replace(/\\"/g, '"');
html = html.replace(/\\'/g, "'");
fs.writeFileSync('jobs-report-demo.html', html, 'utf8');
