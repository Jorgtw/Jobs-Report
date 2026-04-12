import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log("File length:", content.length);

// 1. App State Refactor
const findAppState = () => {
    const startMarker = "const { t } = useTranslation();";
    const endMarker = "const [unreadCount, setUnreadCount] = useState(0);";
    
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    
    console.log("App State Indices:", startIdx, endIdx);
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const replacement = `
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
        content = content.slice(0, startIdx) + replacement + "\n  " + content.slice(endIdx);
        return true;
    }
    return false;
};

// 2. ClientsView Refactor
const findClientsView = () => {
    const startMarker = "const ClientsView: React.FC = () => {";
    const endMarker = "return ("; // We look for the FIRST return ( after start
    
    const startIdx = content.indexOf(startMarker);
    console.log("ClientsView Start Index:", startIdx);
    
    if (startIdx !== -1) {
        const afterStart = content.slice(startIdx);
        const relativeEndIdx = afterStart.indexOf(endMarker);
        
        console.log("ClientsView Relative Return Index:", relativeEndIdx);
        
        if (relativeEndIdx !== -1) {
            const replacement = `
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
            content = content.slice(0, startIdx) + replacement + "\n  " + content.slice(startIdx + relativeEndIdx);
            
            // Fix calls in render block
            content = content.replace(/onClick=\{\(\) => handleDelete\(c\.id\)\}/g, 'onClick={() => handleLocalDelete(c.id)}');
            content = content.replace(/onSubmit=\{handleSubmit\}/g, 'onSubmit={handleLocalSubmit}');
            return true;
        }
    }
    return false;
};

// 3. Route Refactor
const fixRoute = () => {
    const routeMarker = "<Route path=\"/clients\" element={user.role === 'admin' ? <ClientsView /> : <Navigate to=\"/\" />} />";
    const replacement = '<Route path="/clients" element={user.role === "admin" ? <ClientsView clients={clients} onCreateClient={handleCreateClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} t={t} /> : <Navigate to="/" />} />';
    
    if (content.includes(routeMarker)) {
        content = content.replace(routeMarker, replacement);
        return true;
    } else {
        // Try fallback with double quotes if single quotes fail
        const routeMarker2 = "<Route path=\"/clients\" element={user.role === \"admin\" ? <ClientsView /> : <Navigate to=\"/\" />} />";
        if (content.includes(routeMarker2)) {
            content = content.replace(routeMarker2, replacement);
            return true;
        }
    }
    return false;
};

if (findAppState() && findClientsView() && fixRoute()) {
    fs.writeFileSync(filePath, content);
    console.log("App.tsx refactored successfully (Step 3 Stabilization)");
} else {
    console.error("Refactor failed at some stage");
}
