import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const unusedIcons = ['Smartphone', 'PlusCircle', 'BookOpen', 'BarChart3', 'ShieldCheck'];

unusedIcons.forEach(icon => {
    // Match the icon line in the import list, including possible commas and whitespace
    const regex = new RegExp(`\\s*${icon},?\\s*`, 'g');
    content = content.replace(regex, '\n  ');
});

// Clean up extra double newlines that might have been created
content = content.replace(/\n\s*\n\s*\n/g, '\n  ');

fs.writeFileSync(filePath, content);
console.log("App.tsx icon imports cleaned up");
