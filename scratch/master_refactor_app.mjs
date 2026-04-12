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
    // Correctly find the ending }; of the component block
    // We look for \n};\n followed by the next component comment or end of file
    // Actually, we can look for the next "// ---" marker
    let nextMarker = content.indexOf("// ---", startIdx);
    if (nextMarker === -1) {
        // Might be the last one before App component
        nextMarker = content.indexOf("const App: React.FC", startIdx);
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
    content = content.replace("import CommunicationsHub from './components/CommunicationsHub';", 
        "import CommunicationsHub from './components/CommunicationsHub';\nimport HelpView from './pages/HelpView';\nimport ProfileView from './pages/ProfileView';");
}

// 2. Remove ArticleCard, HelpView, ProfileView
removeComponent("ArticleCard");
removeComponent("HelpView");
removeComponent("ProfileView");

// 3. ClientsView Refactor (Special case)
const cvStart = content.indexOf("const ClientsView: React.FC");
const cvNext = content.indexOf("// ---", cvStart);
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
    // We only replace until the return ( in the original block starts
    const originalReturnIdx = content.indexOf("  return (", cvStart);
    if (originalReturnIdx !== -1 && originalReturnIdx < cvNext) {
         content = content.slice(0, cvStart) + dumbCV + "\n  " + content.slice(originalReturnIdx);
         // Update calls
         content = content.replace(/onClick=\{\(\) => handleDelete\(c\.id\)\}/g, 'onClick={() => handleLocalDelete(c.id)}');
         content = content.replace(/onSubmit=\{handleSubmit\}/g, 'onSubmit={handleLocalSubmit}');
    }
}

// 4. App Component State & Handlers
const appStart = content.indexOf("const App: React.FC = () => {");
const appStateEnd = content.indexOf("const [isMobileMenuOpen", appStart);
if (appStart !== -1 && appStateEnd !== -1) {
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
    content = content.slice(0, appStateEnd) + appLogic + content.slice(appStateEnd);
}

// 5. Routes
content = content.replace(/<Route path="\/help" element=\{<HelpView user=\{user\} isMobile=\{isMobile\} \/>\} \/>/, 
    '<Route path="/help" element={<HelpView user={user} isMobile={isMobile} t={t} />} />');

content = content.replace(/<Route path="\/profile" element=\{<ProfileView user=\{user\} onUpdate=\{onUpdate\} \/>\} \/>/, 
    '<Route path="/profile" element={<ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem(\'ws_auth\', JSON.stringify(updated)); }} t={t} />} />');
    
// Actually, check what ProfileView route looks like in original
const profRouteMatch = /<Route path="\/profile" element=\{<ProfileView user=\{user\} onUpdate=\{.*?\} \/>\} \/>/;
content = content.replace(profRouteMatch, 
    '<Route path="/profile" element={<ProfileView user={user} onUpdate={(updated) => { setUser(updated); localStorage.setItem(\'ws_auth\', JSON.stringify(updated)); }} t={t} />} />');

content = content.replace(/<Route path="\/clients" element=\{user\.role === 'admin' \? <ClientsView \/> : <Navigate to="\/" \/>\} \/>/, 
    '<Route path="/clients" element={user.role === "admin" ? <ClientsView clients={clients} onCreateClient={handleCreateClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} t={t} /> : <Navigate to="/" />} />');

fs.writeFileSync(filePath, content);
console.log("App.tsx MASTER REFACTOR completed.");
