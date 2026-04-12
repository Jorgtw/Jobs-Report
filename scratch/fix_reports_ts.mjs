import fs from 'fs';

let content = fs.readFileSync('src/hooks/useReports.ts', 'utf8');
content = content.replace("import { WorkReport } from '../types';", "import { WorkReport, Role } from '../types';");
content = content.replace("export const useReports = (userId: string, role: string) => {", "export const useReports = (userId: string, role: Role) => {");
fs.writeFileSync('src/hooks/useReports.ts', content);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// The original signature in App.tsx
const reportsViewRegex = /const ReportsView: React\.FC<\{ user: User, clients: any\[\] \}> = \(\{ user, clients \}\) => \{\r?\n\s*const \{ lang, t \} = useTranslation\(\);\r?\n\s*const \[reports, setReports\] = useState<WorkReport\[\]>\(\[\]\);/g;

if (!appContent.includes("const { data: reports = [], createReport, updateReport, deleteReport } = useReports(user.id, user.role as any);")) {
  appContent = appContent.replace(reportsViewRegex, `const ReportsView: React.FC<{ user: User, clients: any[] }> = ({ user, clients }) => {
  const { lang, t } = useTranslation();
  const { data: reports = [], createReport, updateReport, deleteReport } = useReports(user.id, user.role as any);
  const { data: projects = [] } = useProjects();`);
}

fs.writeFileSync('src/App.tsx', appContent);
console.log("TypeScript fix script applied");
