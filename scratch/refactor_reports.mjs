import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add import useReports
content = content.replace("import { useProjects } from './hooks/useProjects';", "import { useProjects } from './hooks/useProjects';\nimport { useReports } from './hooks/useReports';");

// 1. In ReportsView, hook initialization
const reportsInitSearch = "const ReportsView: React.FC<{ user: User, clients: any[] }> = ({ user, clients }) => {\n  const { lang, t } = useTranslation();\n  const [reports, setReports] = useState<WorkReport[]>([]);";
const reportsInitReplace = "const ReportsView: React.FC<{ user: User, clients: any[] }> = ({ user, clients }) => {\n  const { lang, t } = useTranslation();\n  const { data: reports = [], createReport, updateReport, deleteReport } = useReports(user.id, user.role);\n  const { data: projects = [] } = useProjects();";
content = content.replace(reportsInitSearch, reportsInitReplace);

// 2. Remove local projects state and promise.all
const reportsStateSearch = "  const [projects, setProjects] = useState<Project[]>([]);";
content = content.replace(reportsStateSearch, "");

const loadSearch = /useEffect\(\(\) => \{\s*const load = async \(\) => \{\s*const \[r, p, u\] = await Promise\.all\(\[\s*db\.getReports\(user\.id, user\.role\),\s*db\.getProjects\(\),\s*db\.getUsers\(\),\s*\]\);\s*setReports\(r\);\s*setProjects\(p\); \/\/ Keep all projects for permission checks\s*setPersonnel\(u\.filter\(\(usr: User\) => usr\.status === 'active'\)\);\s*\};\s*load\(\);\s*\}, \[\]\);/g;
content = content.replace(loadSearch, "useEffect(() => {\n    db.getUsers().then(u => setPersonnel(u.filter((usr: User) => usr.status === 'active')));\n  }, []);");


// 3. Fix handlers
const handleDeleteRaw = /const handleDelete = async \(id: string\) => \{\r?\n\s*if \(confirm\(t\('common\.confirmDelete'\)\)\) \{\r?\n\s*await db\.deleteReport\(id\);\r?\n\s*setReports\(await db\.getReports\(user\.id, user\.role\)\);\r?\n\s*\}\r?\n\s*\};/g;
content = content.replace(handleDeleteRaw, "const handleDelete = async (id: string) => {\n    if (confirm(t('common.confirmDelete'))) {\n      await deleteReport.mutateAsync(id);\n    }\n  };");

const handleSubmitRaw = /const handleSubmit = async \(e: React\.FormEvent\) => \{\r?\n\s*e\.preventDefault\(\);\r?\n\s*const dataToSave = \{[\s\S]*?\};\r?\n\s*try \{\r?\n\s*if \(editingId\) \{\r?\n\s*await db\.updateReport\(editingId, dataToSave\);\r?\n\s*\} else \{\r?\n\s*await db\.addReport\(dataToSave\);\r?\n\s*\}\r?\n\s*setReports\(await db\.getReports\(user\.id, user\.role\)\);\r?\n\s*setIsModalOpen\(false\);\r?\n\s*\} catch \(error\) \{\r?\n\s*console\.error\('Error saving report:', error\);\r?\n\s*alert\('Errore nel salvataggio. Riprovare\.'\);\r?\n\s*\}\r?\n\s*\};/g;

content = content.replace(handleSubmitRaw, `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      userId: formData.userId || user.id,
      cost: formData.cost || 0,
      subcontractorId: formData.subcontractorId || undefined,
      internalWorkerId: formData.internalWorkerId || undefined
    };

    try {
      if (editingId) {
        await updateReport.mutateAsync({ id: editingId, data: dataToSave });
      } else {
        await createReport.mutateAsync(dataToSave as Omit<WorkReport, 'id'>);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Errore nel salvataggio. Riprovare.');
    }
  };`);

fs.writeFileSync(filePath, content);
console.log("Reports refactor script complete");
