import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The line is:
// const { data: projects = [], isLoading, createProject, updateProject, deleteProject } = useProjects();
// I will replace it using regex to handle invisible spaces
content = content.replace(/const \{ data: projects = \[\], isLoading, createProject, updateProject, deleteProject \} = useProjects\(\);/,
                          "const { data: projects = [], createProject, updateProject, deleteProject } = useProjects();");

// Fix `load` function by removing setProjects(p)
content = content.replace("const [p, u] = await Promise.all([db.getProjects(), db.getUsers()]);\n      setProjects(p);\n      \n      setPersonnel(u.filter((usr: User) => usr.status === 'active'));",
                          "const [u] = await Promise.all([db.getUsers()]);\n      setPersonnel(u.filter((usr: User) => usr.status === 'active'));");

// Because sometimes line endings are CRLF, let's use a safer regex for load()
const loadRegex = /const \[p, u\] = await Promise\.all\(\[db\.getProjects\(\),\s*db\.getUsers\(\)\]\);\s*setProjects\(p\);\s*setPersonnel\(u\.filter\(\(usr: User\) => usr\.status === 'active'\)\);/g;
content = content.replace(loadRegex, "const [u] = await Promise.all([db.getUsers()]);\n      setPersonnel(u.filter((usr: User) => usr.status === 'active'));");

// Replace handleDelete
const deleteRegex = /const handleDelete = async \(id: string\) => \{\r?\n\s*if \(confirm\(t\('common\.confirmDelete'\)\)\) \{\r?\n\s*await db\.deleteProject\(id\);\r?\n\s*setProjects\(await db\.getProjects\(\)\);\r?\n\s*\}\r?\n\s*\};/g;
content = content.replace(deleteRegex, "const handleDelete = async (id: string) => {\n    if (confirm(t('common.confirmDelete'))) {\n      await deleteProject.mutateAsync(id);\n    }\n  };");

// Replace handleSubmit
const submitRegex = /const handleSubmit = async \(e: React\.FormEvent\) => \{\r?\n\s*e\.preventDefault\(\);\r?\n\s*try \{\r?\n\s*if \(editingId\) \{\r?\n\s*await db\.updateProject\(editingId, formData\);\r?\n\s*\} else \{\r?\n\s*await db\.addProject\(formData\);\r?\n\s*\}\r?\n\s*setProjects\(await db\.getProjects\(\)\);\r?\n\s*setIsModalOpen\(false\);\r?\n\s*\} catch \(error: any\) \{\r?\n\s*console\.error\('Error saving project:', error\);\r?\n\s*alert\(t\('common\.saveError'\) \+ \(error\.message \|\| error\.code \|\| 'Unknown error'\)\);\r?\n\s*\}\r?\n\s*\};/g;

const submitNew = `const handleSubmit = async (e: React.FormEvent) => {
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
content = content.replace(submitRegex, submitNew);

fs.writeFileSync(filePath, content);
console.log("ProjectsView logic manually patched against CRLF mismatch");
