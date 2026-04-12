import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for useProjects
if (!content.includes("import { useProjects }")) {
    content = content.replace("import { useClients } from './hooks/useClients';", "import { useClients } from './hooks/useClients';\nimport { useProjects } from './hooks/useProjects';");
}

// 2. Modify ProjectsView body
const projectsViewSig = /const ProjectsView: React\.FC<\{ user: User, clients: any\[\] \}> = \(\{ user, clients \}\) => \{/;

if (projectsViewSig.test(content)) {
  content = content.replace(projectsViewSig, `const ProjectsView: React.FC<{ user: User, clients: any[] }> = ({ user, clients }) => {\n  const { data: projects = [], isLoading, createProject, updateProject, deleteProject } = useProjects();`);
}

// Remove local projects state
content = content.replace(/const \[projects, setProjects\] = useState<Project\[\]>\(\[\]\);\s*/, "");

// Modify load function to remove getProjects()
// Before: const [p, u] = await Promise.all([db.getProjects(), db.getUsers()]);
// After: const [u] = await Promise.all([db.getUsers()]);
content = content.replace(/const \[p, u\] = await Promise\.all\(\[db\.getProjects\(\), db\.getUsers\(\)\]\);\n\s*setProjects\(p\);/, "const [u] = await Promise.all([db.getUsers()]);");

// 3. Modify handlers in ProjectsView
// handleDelete
content = content.replace(/const handleDelete = async \(id: string\) => \{\n\s*if \(confirm\(t\('common\.confirmDelete'\)\)\) \{\n\s*await db\.deleteProject\(id\);\n\s*setProjects\(await db\.getProjects\(\)\);\n\s*\}\n\s*\};/, 
  "const handleDelete = async (id: string) => {\n    if (confirm(t('common.confirmDelete'))) {\n      await deleteProject.mutateAsync(id);\n    }\n  };");

// handleSubmit
const handleSubmitOld = /const handleSubmit = async \(e: React\.FormEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*try \{\n\s*if \(editingId\) \{\n\s*await db\.updateProject\(editingId, formData\);\n\s*\} else \{\n\s*await db\.addProject\(formData\);\n\s*\}\n\s*setProjects\(await db\.getProjects\(\)\);\n\s*setIsModalOpen\(false\);\n\s*\} catch \(error: any\) \{\n\s*console\.error\('Error saving project:', error\);\n\s*alert\(t\('common\.saveError'\) \+ \(error\.message \|\| error\.code \|\| 'Unknown error'\)\);\n\s*\}\n\s*\};/;

const handleSubmitNew = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProject.mutateAsync({ id: editingId, data: formData });
      } else {
        await createProject.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert(t('common.saveError') + (error.message || error.code || 'Unknown error'));
    }
  };`;

content = content.replace(handleSubmitOld, handleSubmitNew);


fs.writeFileSync(filePath, content);
console.log("ProjectsView refactored to use react-query");
