import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Refactor ClientsView props and internal logic
const cvStart = content.indexOf("interface ClientsViewProps {");
const cvEnd = content.indexOf("const ClientsView: React.FC<ClientsViewProps> = ({");

if (cvStart !== -1 && cvEnd !== -1) {
  content = content.replace(content.substring(cvStart, cvEnd), `interface ClientsViewProps {\n  t: (key: string) => string;\n}\n\n`);
}

const cvSignature = /const ClientsView: React\.FC<ClientsViewProps> = \(\{\s*clients,\s*onCreateClient,\s*onUpdateClient,\s*onDeleteClient,\s*t\s*\}\) => \{/;
if (cvSignature.test(content)) {
  content = content.replace(cvSignature, `const ClientsView: React.FC<ClientsViewProps> = ({ t }) => {\n  const {\n    data: clients = [],\n    isLoading,\n    createClient,\n    updateClient,\n    deleteClient\n  } = useClients();`);
} else {
  // Try more robust replace
  const altSignature = "const ClientsView: React.FC<ClientsViewProps> = ({ \n  clients, \n  onCreateClient, \n  onUpdateClient, \n  onDeleteClient, \n  t \n}) => {";
  content = content.replace(altSignature, "const ClientsView: React.FC<ClientsViewProps> = ({ t }) => {\n  const {\n    data: clients = [],\n    isLoading,\n    createClient,\n    updateClient,\n    deleteClient\n  } = useClients();");
}

// 2. Refactor ClientsView handlers
// handleLocalDelete
content = content.replace(/const handleLocalDelete = \(id: string\) => \{\n\s*onDeleteClient\(id\);\n\s*\};/, 
  "const handleLocalDelete = (id: string) => {\n    if (confirm(t('common.confirmDelete'))) {\n      deleteClient.mutate(id);\n    }\n  };");

// handleLocalSubmit
content = content.replace(/const handleLocalSubmit = async \(e: React\.FormEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*if \(editingId\) \{\n\s*await onUpdateClient\(editingId, formData\);\n\s*\} else \{\n\s*await onCreateClient\(formData\);\n\s*\}\n\s*setIsModalOpen\(false\);\n\s*\};/,
  "const handleLocalSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (editingId) {\n      await updateClient.mutateAsync({ id: editingId, data: formData });\n    } else {\n      await createClient.mutateAsync(formData);\n    }\n    setIsModalOpen(false);\n  };");

// 3. Remove App.tsx legacy state & handlers
const appRegex = /const \[clients, setClients\] = useState<Client\[\]>\(\[\]\);\n\s*const syncClientsFromDB = async \(\) => \{[\s\S]*?async \(id: string\) => \{[\s\S]*?syncClientsFromDB\(\);\n\s*\}\n\s*\};/g;
content = content.replace(appRegex, "");
// Remove the useEffect that called syncClientsFromDB
const useEffectRegex = /useEffect\(\(\) => \{\n\s*if \(user && user\.id\) \{\n\s*syncClientsFromDB\(\);\n\s*\}\n\s*\}, \[user\]\);/g;
content = content.replace(useEffectRegex, "");

// Ensure 'const { data: clients = [] } = useClients();' is used locally for ProjectsView etc. replacing the pilot code
const pilotRegex = /const \{ data: rqClients, isLoading: rqIsLoading, isError: rqIsError \} = useClients\(\);\s*useEffect\(\(\) => \{[\s\S]*?\}, \[rqIsLoading, rqClients, rqIsError\]\);/g;
content = content.replace(pilotRegex, "const { data: clients = [] } = useClients();");

// Fix ClientsView routing prop passing
const routeMatch = /<ClientsView clients=\{clients\} onCreateClient=\{handleCreateClient\} onUpdateClient=\{handleUpdateClient\} onDeleteClient=\{handleDeleteClient\} t=\{t\} \/>/;
content = content.replace(routeMatch, "<ClientsView t={t} />");

fs.writeFileSync(filePath, content);
console.log("ClientsView App.tsx refactored to React Query");
