import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// helper to find start/end of a block defined by React.FC
const removeComponent = (name) => {
    const startStr = `const ${name}: React.FC`;
    const startIdx = content.indexOf(startStr);
    if (startIdx === -1) {
        console.error(`Component ${name} not found`);
        return false;
    }
    
    let nextMarker = content.indexOf("// ---", startIdx + 10);
    if (nextMarker === -1) {
        nextMarker = content.indexOf("const App: React.FC", startIdx + 10);
    }
    
    if (nextMarker !== -1) {
        content = content.slice(0, startIdx) + content.slice(nextMarker);
        console.log(`Removed ${name}`);
        return true;
    }
    return false;
};

// 1. Imports
if (!content.includes("import HelpView")) {
    const commsImport = "import CommunicationsHub from './components/CommunicationsHub';";
    if (content.includes(commsImport)) {
        content = content.replace(commsImport, 
            commsImport + "\nimport HelpView from './pages/HelpView';\nimport ProfileView from './pages/ProfileView';");
    }
}

// 2. Remove components
removeComponent("ArticleCard");
removeComponent("HelpView");
removeComponent("ProfileView");

// 3. ClientsView Refactor
const cvStart = content.indexOf("const ClientsView: React.FC");
const cvNext = content.indexOf("// ---", cvStart + 10);
if (cvStart !== -1 && cvNext !== -1) {
    const dumbCV = `
interface ClientsViewProps {
  clients: Client[];
  onCreateClient: (c: any) => Promise<void>;
  onUpdateClient: (id: string, c: any) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  t: (key: string) => string;
}

const ClientsView: React.FC<ClientsViewProps> = ({ 
  clients, 
  onCreateClient, 
  onUpdateClient, 
  onDeleteClient, 
  t 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    vatNumber: '',
    billingAddress: '',
    mainContactName: '',
    mainContactPhone: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  const handleEdit = (c: Client) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      vatNumber: c.vatNumber || '',
      billingAddress: c.billingAddress || '',
      mainContactName: c.mainContactName || '',
      mainContactPhone: c.mainContactPhone || '',
      email: c.email || '',
      status: c.status || 'active',
      notes: c.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleLocalDelete = (id: string) => {
    onDeleteClient(id);
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await onUpdateClient(editingId, formData);
    } else {
      await onCreateClient(formData);
    }
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      vatNumber: '',
      billingAddress: '',
      mainContactName: '',
      mainContactPhone: '',
      email: '',
      status: 'active',
      notes: ''
    });
    setIsModalOpen(true);
  };
`;
    const originalReturnIdx = content.indexOf("  return (", cvStart);
    if (originalReturnIdx !== -1 && originalReturnIdx < cvNext) {
         content = content.slice(0, cvStart) + dumbCV + "\n  " + content.slice(originalReturnIdx);
         content = content.replace(/onClick=\{\(\) => handleDelete\(c\.id\)\}/g, 'onClick={() => handleLocalDelete(c.id)}');
         content = content.replace(/onSubmit=\{handleSubmit\}/g, 'onSubmit={handleLocalSubmit}');
    }
}

// 4. App Component State
const appStart = content.indexOf("const App: React.FC = () => {");
const appStateMarker = "const { t } = useTranslation();";
const appStatePos = content.indexOf(appStateMarker, appStart);

if (appStatePos !== -1) {
    const appLogic = `
  const [clients, setClients] = useState<Client[]>([]);

  const handleRefreshClients = async () => {
    try {
      const data = await db.getClients();
      setClients(data);
    } catch (e) {
      console.error("Error refreshing clients:", e);
    }
  };

  const handleCreateClient = async (data: any) => {
    await db.addClient(data);
    await handleRefreshClients();
  };

  const handleUpdateClient = async (id: string, data: any) => {
    await db.updateClient(id, data);
    await handleRefreshClients();
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      await db.deleteClient(id);
      await handleRefreshClients();
    }
  };

  useEffect(() => {
    if (user && user.id) {
      handleRefreshClients();
    }
  }, [user]);

`;
    content = content.slice(0, appStatePos + appStateMarker.length) + appLogic + content.slice(appStatePos + appStateMarker.length);
}

// 5. Routes (Literal Match)
const helpRoute = '<Route path="/help" element={<HelpView user={user} isMobile={isMobile} />} />';
const profileRoute = '<Route path="/profile" element={<ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem(\'ws_auth\', JSON.stringify(updated)); }} />} />';
const clientsRoute = '<Route path="/clients" element={user.role === \'admin\' ? <ClientsView /> : <Navigate to="/" />} />';

content = content.replace(helpRoute, '<Route path="/help" element={<HelpView user={user} isMobile={isMobile} t={t} />} />');
content = content.replace(profileRoute, '<Route path="/profile" element={<ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem(\'ws_auth\', JSON.stringify(updated)); }} t={t} />} />');
content = content.replace(clientsRoute, '<Route path="/clients" element={user.role === "admin" ? <ClientsView clients={clients} onCreateClient={handleCreateClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} t={t} /> : <Navigate to="/" />} />');

fs.writeFileSync(filePath, content);
console.log("App.tsx MASTER REFACTOR v2 completed.");
