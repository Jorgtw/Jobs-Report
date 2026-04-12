import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix WorkSummaryView
// My previous script didn't remove `const [clients, setClients] = useState<any[]>([]);` because of spacing
content = content.replace(/const \[clients, setClients\] = useState<any\[\]>\(\[\]\);\s*\n?/g, '');

// Fix ProjectsView errors
// I replaced the Promise.all properly, but `setClients(c)` wasn't caught due to spacing
content = content.replace(/setClients\(c\);\s*\n?/g, '');

// Also ensure `const [clients, setClients] = useState<Client[]>([]);` in ProjectsView is removed
content = content.replace(/const \[clients, setClients\] = useState<Client\[\]>\(\[\]\);\s*\n?/g, '');

fs.writeFileSync(filePath, content);
console.log("App.tsx fixed lingering getClients properties");
