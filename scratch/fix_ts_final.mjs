import fs from 'fs';

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Fix WorkSummaryView
// Import useQueryClient inside WorkSummaryView for invalidations
appContent = appContent.replace("const WorkSummaryView: React.FC<{ user: User }> = ({ user }) => {", 
  "import { useQueryClient } from '@tanstack/react-query';\nconst WorkSummaryView: React.FC<{ user: User }> = ({ user }) => {\n  const queryClient = useQueryClient();");

// Replace loadData() with queryClient.invalidateQueries()
appContent = appContent.replace(/loadData\(\);/g, "queryClient.invalidateQueries({ queryKey: ['summary'] });");
// Sometimes loadData is in old handleSubmit:
appContent = appContent.replace(/setSummary\(await db\.getSummary\(\)\);/g, "queryClient.invalidateQueries({ queryKey: ['summary'] });");

// Fix ProjectsView: insert clients hook
const projectsViewSig = "const ProjectsView: React.FC<{ user: User }> = ({ user }) => {\n  const { data: projects = [], createProject, updateProject, deleteProject } = useProjects();";
appContent = appContent.replace(projectsViewSig, projectsViewSig + "\n  const { data: clients = [] } = useClients();");

// Fix ReportsView: insert clients hook
const reportsViewSig = "const ReportsView: React.FC<{ user: User }> = ({ user }) => {\n  const { lang, t } = useTranslation();\n  const { data: reports = [], createReport, updateReport, deleteReport } = useReports(user.id, user.role as any);\n  const { data: projects = [] } = useProjects();";
appContent = appContent.replace(reportsViewSig, reportsViewSig + "\n  const { data: clients = [] } = useClients();");

fs.writeFileSync('src/App.tsx', appContent);
console.log("TS Fixes applied");
