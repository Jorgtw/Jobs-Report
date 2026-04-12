import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Clean up unused icons
const unusedIcons = ['Smartphone', 'PlusCircle', 'BookOpen', 'BarChart3', 'ShieldCheck'];
unusedIcons.forEach(icon => {
    const regex = new RegExp(`\\s*${icon},?\\s*`, 'g');
    content = content.replace(regex, '\n  ');
});
content = content.replace(/\n\s*\n\s*\n/g, '\n  ');

// 2. Fix global replacement error
// We want to revert handleLocalSubmit -> handleSubmit and handleLocalDelete -> handleDelete
// EXCEPT for ClientsView.
// Strategy: revert ALL, and then only apply to ClientsView section specifically.

content = content.replace(/handleLocalDelete/g, 'handleDelete');
content = content.replace(/handleLocalSubmit/g, 'handleSubmit');

// Now identify ClientsView section again and apply it there ONLY
const cvStart = content.indexOf("const ClientsView: React.FC<ClientsViewProps>");
const cvEnd = content.indexOf("// ---", cvStart + 10);

if (cvStart !== -1 && cvEnd !== -1) {
    let cvSection = content.slice(cvStart, cvEnd);
    cvSection = cvSection.replace(/handleDelete\(/g, 'handleLocalDelete(');
    cvSection = cvSection.replace(/handleSubmit =/g, 'handleLocalSubmit =');
    
    // In the return block of ClientsView
    // Actually, I need to find the return block inside cvSection
    cvSection = cvSection.replace(/onClick=\{\(\) => handleDelete\(c\.id\)\}/g, 'onClick={() => handleLocalDelete(c.id)}');
    cvSection = cvSection.replace(/onSubmit=\{handleSubmit\}/g, 'onSubmit={handleLocalSubmit}');
    
    content = content.slice(0, cvStart) + cvSection + content.slice(cvEnd);
}

fs.writeFileSync(filePath, content);
console.log("App.tsx syntax errors fixed (narrowed scope of local handlers)");
