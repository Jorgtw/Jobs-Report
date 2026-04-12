import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The error was caused by removing the state declaration AND by removing setClients globally
// I will re-add `clients` state into App
const appStateMarker = "const { t } = useTranslation();";
if (!content.includes("const [clients, setClients] = useState<Client[]>")) {
    content = content.replace(appStateMarker, appStateMarker + "\n  const [clients, setClients] = useState<Client[]>([]);");
}

// In ProjectsView (around line 1459): we removed `setClients` but now we have:
// setClients(c.filter((cl: Client) => cl.status === 'active'));
// Let's remove this line exactly, as well as setPersonnel filter if there were issues.
// Actually, earlier the error was: `src/App.tsx(1459,7): error TS2552: Cannot find name 'setClients'. Did you mean 'clients'?`
const badProjectsViewLine1 = "setClients(c.filter((cl: Client) => cl.status === 'active'));";
content = content.replace(badProjectsViewLine1, "");

// In ProjectsView form:
// `{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}`
// We want to map only over active clients to preserve existing feature
content = content.replace("{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}", 
                          "{clients.filter(c => c.status === 'active' || c.id === formData.clientId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}");

fs.writeFileSync(filePath, content);
console.log("App.tsx fixed global clients state and ProjectsView errors");
