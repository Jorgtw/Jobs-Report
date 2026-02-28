const fs = require('fs');
const file = 'c:/Users/jtw/Euro JTW/Archivi/JTW/Programmi/jobs-report-complete/src/App.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    '{/* Sezione Collaboratori */}\r\n                <div className="md:col-span-2 space-y-4 border-t pt-6">',
    '{/* Sezione Collaboratori */}\r\n                {!editingId && (\r\n                  <div className="md:col-span-2 space-y-4 border-t pt-6">'
);

data = data.replace(
    '                  </div>\r\n                </div>\r\n\r\n                {/* Box Totale Complessivo */}',
    '                  </div>\r\n                </div>\r\n                )}\r\n\r\n                {/* Box Totale Complessivo */}'
);

fs.writeFileSync(file, data, 'utf8');
console.log('App.tsx updated successfully.');
