const fs = require('fs');
const files = ['da','en','es','pl','tr'].map(l => 'src/i18n/'+l+'/reports.ts');
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('summaryTitle:')) {
      content = content.replace('export const reports = {', 'export const reports = {\n  summaryTitle: "Sommario Lavori",');
      fs.writeFileSync(file, content);
    }
  }
}
