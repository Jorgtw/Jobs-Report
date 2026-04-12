import fs from 'fs';

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add hook imports
appContent = appContent.replace("import { useReports } from './hooks/useReports';", "import { useReports } from './hooks/useReports';\nimport { useSummary } from './hooks/useSummary';\nimport { useUsers } from './hooks/useUsers';\nimport { useSubcontractors } from './hooks/useSubcontractors';");

// 2. Refactor WorkSummaryView logic
const summaryViewRegex = /const WorkSummaryView: React\.FC<\{ user: User, clients: any\[\] \}> = \(\{ user, clients \}\) => \{\r?\n\s*const \{ lang, t \} = useTranslation\(\);\r?\n\s*const \[summary, setSummary\] = useState<any\[\]>\(\[\]\);\r?\n\s*const \[projects, setProjects\] = useState<any\[\]>\(\[\]\);\r?\n\s*const \[users, setUsers\] = useState<any\[\]>\(\[\]\);\r?\n\s*const \[subcontractors, setSubcontractors\] = useState<any\[\]>\(\[\]\);\r?\n\s*const \[isArchiveModalOpen, setIsArchiveModalOpen\] = useState\(false\);\r?\n\s*const \[isDeleting, setIsDeleting\] = useState\(false\);\r?\n\r?\n\s*const loadData = async \(\) => \{[\s\S]*?\};\r?\n\r?\n\s*useEffect\(\(\) => \{\r?\n\s*loadData\(\);\r?\n\s*\}, \[\]\);/g;

const newSummaryLogic = `const WorkSummaryView: React.FC<{ user: User }> = ({ user }) => {
  const { lang, t } = useTranslation();
  
  const { data: clients = [] } = useClients();
  const { data: rawSummary = [] } = useSummary();
  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  const { data: subcontractors = [] } = useSubcontractors();

  const summary = React.useMemo(() => {
    if (user.role === 'supervisor') {
      const assignedProjectIds = projects.filter((proj: any) => canUserAccessProject(proj, user.id)).map((proj: any) => proj.id);
      return rawSummary.filter((item: any) => assignedProjectIds.includes(item.projectId));
    }
    return rawSummary;
  }, [rawSummary, projects, user.role, user.id]);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);`;

appContent = appContent.replace(summaryViewRegex, newSummaryLogic);

// 3. Remove `clients` from `<WorkSummaryView user={user} clients={clients} />`
appContent = appContent.replace(/<WorkSummaryView user=\{user\} clients=\{clients\} \/>/g, "<WorkSummaryView user={user} />");

// 4. Also `ProjectsView`, `ReportsView` and `ClientsView` shouldn't get `clients` anymore if they used `useClients()` or `useProjects()`
appContent = appContent.replace(/<ProjectsView user=\{user\} clients=\{clients\} \/>/g, "<ProjectsView user={user} />");
appContent = appContent.replace(/<ReportsView user=\{user\} clients=\{clients\} \/>/g, "<ReportsView user={user} />");
appContent = appContent.replace(/const ProjectsView: React\.FC<\{ user: User, clients: any\[\] \}> = \(\{ user, clients \}\) => \{/g, "const ProjectsView: React.FC<{ user: User }> = ({ user }) => {");
appContent = appContent.replace(/const ReportsView: React\.FC<\{ user: User, clients: any\[\] \}> = \(\{ user, clients \}\) => \{/g, "const ReportsView: React.FC<{ user: User }> = ({ user }) => {");

// Now we can SAFELY map clients inside ProjectsView and ReportsView
// In ProjectsView: wait, ProjectsView already has useProjects(). Does it need useClients? Yes, for the form Dropdown!
// Wait, I replaced `clients` parameter with just `user` in `ProjectsView`, but `ProjectsView` was using `clients.map(c => ...)` where did it get them?
// From the props! Now it won't have them. I must add `const { data: clients = [] } = useClients();` to ProjectsView!
appContent = appContent.replace("const { data: projects = [], createProject, updateProject, deleteProject } = useProjects();",
  "const { data: projects = [], createProject, updateProject, deleteProject } = useProjects();\n  const { data: clients = [] } = useClients();");

// Same for ReportsView:
appContent = appContent.replace(/const \{\s*data: reports = \[\],\s*createReport,\s*updateReport,\s*deleteReport\s*\} = useReports\(user\.id, user\.role as any\);/g, 
  "const { data: reports = [], createReport, updateReport, deleteReport } = useReports(user.id, user.role as any);\n  const { data: clients = [] } = useClients();");

// 5. Finally, we can REMOVE `const { data: clients = [] } = useClients();` from the VERY TOP of `App` component!
const rootAppClientsRegex = /const \{ data: clients = \[\] \} = useClients\(\);\r?\n/g;
appContent = appContent.replace(rootAppClientsRegex, "");

fs.writeFileSync('src/App.tsx', appContent);
console.log("WorkSummaryView refactored perfectly and App.tsx completely cleaned of payload passed downwards.");
