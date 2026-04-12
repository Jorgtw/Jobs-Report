import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Rename handleRefreshClients to syncClientsFromDB
content = content.replace(/handleRefreshClients/g, 'syncClientsFromDB');

// 2. Refactor WorkSummaryView
// Search for WorkSummaryView signature
const wsmMatch = /const WorkSummaryView: React\.FC<\{ user: User \}> = \(\{ user \}\) => \{/;
content = content.replace(wsmMatch, 'const WorkSummaryView: React.FC<{ user: User, clients: any[] }> = ({ user, clients }) => {');
// Remove local state
content = content.replace(/const \[clients, setClients\] = useState<any\[\]>\(\[\]\);\n/, '');
// Remove db.getClients() from Promise.all in loadData
content = content.replace("db.getClients(),\n", "");
content = content.replace("const [s, c, p, w, sub] = await Promise.all([\n      db.getSummary(),\n      db.getProjects(),", 
                          "const [s, p, w, sub] = await Promise.all([\n      db.getSummary(),\n      db.getProjects(),");
// If it was already missing db.getClients, we need a regex to be more robust
content = content.replace(/db\.getClients\(\),?\s*/, '');
content = content.replace(/const \[s, c, p, w, sub\] = await Promise\.all/, 'const [s, p, w, sub] = await Promise.all');
content = content.replace(/setClients\(c\);\s*/, '');

// 3. Refactor ProjectsView
const pvMatch = /const ProjectsView: React\.FC<\{ user: User \}> = \(\{ user \}\) => \{/;
content = content.replace(pvMatch, 'const ProjectsView: React.FC<{ user: User, clients: any[] }> = ({ user, clients }) => {');
content = content.replace(/const \[clients, setClients\] = useState<Client\[\]>\(\[\]\);\s*/, '');
// ProjectsView has const [p, c, u] = await Promise.all([db.getProjects(), db.getClients(), db.getUsers()]);
content = content.replace(/const \[p, c, u\] = await Promise\.all\(\[db\.getProjects\(\), db\.getClients\(\), db\.getUsers\(\)\]\);/,
                          'const [p, u] = await Promise.all([db.getProjects(), db.getUsers()]);');
content = content.replace(/setClients\(c\);\s*/, '');

// 4. Refactor ReportsView
const rvMatch = /const ReportsView: React\.FC<\{ user: User \}> = \(\{ user \}\) => \{/;
content = content.replace(rvMatch, 'const ReportsView: React.FC<{ user: User, clients: any[] }> = ({ user, clients }) => {');
content = content.replace(/const \[clients, setClients\] = useState<Client\[\]>\(\[\]\);\s*/, '');
content = content.replace(/db\.getClients\(\)\.then\(setClients\);\s*/, '');

// 5. Update Routes in App
// <Route path="/reports" element={<ReportsView user={user} />} />
content = content.replace(/<Route path="\/reports" element=\{<ReportsView user=\{user\} \/>\} \/>/, 
                          '<Route path="/reports" element={<ReportsView user={user} clients={clients} />} />');
// <Route path="/work-summary" element={(user.role === 'admin' || user.role === 'supervisor') ? <WorkSummaryView user={user} /> : <Navigate to="/" />} />
content = content.replace(/<Route path="\/work-summary" element=\{\(user\.role === 'admin' \|\| user\.role === 'supervisor'\) \? <WorkSummaryView user=\{user\} \/> : <Navigate to="\/" \/>\} \/>/,
                          '<Route path="/work-summary" element={(user.role === \'admin\' || user.role === \'supervisor\') ? <WorkSummaryView user={user} clients={clients} /> : <Navigate to="/" />} />');
// <Route path="/projects" element={<ProjectsView user={user} />} />
content = content.replace(/<Route path="\/projects" element=\{<ProjectsView user=\{user\} \/>\} \/>/,
                          '<Route path="/projects" element={<ProjectsView user={user} clients={clients} />} />');


fs.writeFileSync(filePath, content);
console.log("App.tsx synced getClients centrally successfully");
