import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Sanitize the broken useEffect and Add Clients State + Handlers
// We identify the area between useTranslation() and unreadCount
const stateStartMarker = "const { t } = useTranslation();";
const unreadCountMarker = "const [unreadCount, setUnreadCount] = useState(0);";

const newAppStateLogic = `
  const { t } = useTranslation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isCommsUpgradeOpen, setIsCommsUpgradeOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_v1') && window.innerWidth >= 768;
  });

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
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setShowOnboarding(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user && user.id) {
      db.setUserId(user.id);
      if ((user.role as any) === 'superadmin') {
        setIsSuperAdmin(true);
        db.setIsSuperAdmin(true);
      } else {
        db.checkIsSuperAdmin(user.id).then(isSA => {
          setIsSuperAdmin(isSA);
          db.setIsSuperAdmin(isSA);
        }).catch(console.error);
      }
      handleRefreshClients();
    } else {
      setIsSuperAdmin(false);
      db.setIsSuperAdmin(false);
      db.setUserId(null);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.companyId) {
      db.getCompanyDetails(user.companyId).then(comp => {
        if (comp) {
          const updatedUser = { ...user, companyName: comp.name, isPremium: comp.isPremium };
          if (user.companyName !== comp.name || user.isPremium !== comp.isPremium) {
            setUser(updatedUser);
            localStorage.setItem('ws_auth', JSON.stringify(updatedUser));
          }
        }
      }).catch(console.error);
    }
  }, [user?.companyId, user?.companyName, user?.isPremium]);

`;

const startIdx = content.indexOf(stateStartMarker);
const endIdx = content.indexOf(unreadCountMarker);

if (startIdx !== -1 && endIdx !== -1) {
    content = content.slice(0, startIdx) + newAppStateLogic + "\n  " + content.slice(endIdx);
} else {
    console.error("Critical failure: markers not found for App state refactor");
    process.exit(1);
}

// 2. Refactor ClientsView to be DUMB
// We need to change the signature and remove internal state/fetch
const clientsViewStartMarker = "const ClientsView: React.FC = () => {";
const clientsViewEndMarker = "  return (";

const dumbClientsViewHeader = `
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

  const handleDelete = (id: string) => {
    onDeleteClient(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

const cvStart = content.indexOf(clientsViewStartMarker);
const cvEnd = content.indexOf(clientsViewEndMarker, cvStart);

if (cvStart !== -1 && cvEnd !== -1) {
    content = content.slice(0, cvStart) + dumbClientsViewHeader + "\n  " + content.slice(cvEnd);
} else {
    console.error("Critical failure: ClientsView markers not found");
    process.exit(1);
}

// 3. Update Route Usage
const routeMatch = /<Route path="\/clients" element=\{user\.role === 'admin' \? <ClientsView \/> : <Navigate to="\/" \/>\} \/>/;
const routeRepl = '<Route path="/clients" element={user.role === "admin" ? <ClientsView clients={clients} onCreateClient={handleCreateClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} t={t} /> : <Navigate to="/" />} />';

content = content.replace(routeMatch, routeRepl);

fs.writeFileSync(filePath, content);
console.log("App.tsx stabilized successfully: Centralized Clients state + Dumb ClientsView");
