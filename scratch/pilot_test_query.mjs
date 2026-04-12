import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for useClients
if (!content.includes("import { useClients }")) {
    content = content.replace("import HelpView from './pages/HelpView';", "import HelpView from './pages/HelpView';\nimport { useClients } from './hooks/useClients';");
}

// 2. Call the hook inside App component right under useTranslation()
const appMarker = "const { t } = useTranslation();";
if (!content.includes("const { data: rqClients, isLoading: rqIsLoading, isError: rqIsError } = useClients();")) {
    const testLog = `
  const { t } = useTranslation();

  // --- REACT QUERY PILOT TEST ---
  const { data: rqClients, isLoading: rqIsLoading, isError: rqIsError } = useClients();
  
  useEffect(() => {
    // Questo log dimostrerà se la query scatta, quante volte e come la cache reagisce
    console.log('[React Query Pilot] isLoading:', rqIsLoading, '| data.length:', rqClients?.length);
  }, [rqIsLoading, rqClients]);
  // ------------------------------
`;
    content = content.replace(appMarker, testLog);
}

fs.writeFileSync(filePath, content);
console.log("App.tsx temporarily integrated with useClients pilot");
