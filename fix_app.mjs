import fs from 'fs';
const path = 'c:/Users/jtw/Euro JTW/Archivi/JTW/Programmi/jobs-report-complete/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    '{/* Sezione Collaboratori */}\r\n                {!editingId && (\r\n                <div className="md:col-span-2 space-y-4 border-t pt-6">',
    '{/* Sezione Collaboratori */}\r\n                <div className="md:col-span-2 space-y-4 border-t pt-6">'
);
content = content.replace(
    '{/* Sezione Collaboratori */}\n                {!editingId && (\n                <div className="md:col-span-2 space-y-4 border-t pt-6">',
    '{/* Sezione Collaboratori */}\n                <div className="md:col-span-2 space-y-4 border-t pt-6">'
);

content = content.replace(
    '                  </div>\r\n                </div>\r\n                )}\r\n\r\n                {/* Box Totale Complessivo */}',
    '                  </div>\r\n                </div>\r\n\r\n                {/* Box Totale Complessivo */}'
);
content = content.replace(
    '                  </div>\n                </div>\n                )}\n\n                {/* Box Totale Complessivo */}',
    '                  </div>\n                </div>\n\n                {/* Box Totale Complessivo */}'
);

fs.writeFileSync(path, content);
console.log('App restored');
