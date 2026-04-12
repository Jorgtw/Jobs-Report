import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. handleSubmit
const submitRegex = /const handleSubmit = async \(e: React\.FormEvent\) => \{\r?\n\s*e\.preventDefault\(\);\r?\n\s*const payload = \{ \.\.\.formData, notes: '', teamTotalHours: globalTotalHours \};\r?\n\s*try \{\r?\n\s*if \(editingId\) await db\.updateReport\(editingId, payload as any\); else await db\.addReport\(payload as any\);\r?\n\s*setReports\(await db\.getReports\(user\.id, user\.role\)\);\r?\n\s*setIsModalOpen\(false\);\r?\n\s*\} catch \(err: any\) \{\r?\n\s*console\.error\(err\);\r?\n\s*alert\(t\('common\.saveError'\) \+ JSON\.stringify\(err\)\);\r?\n\s*\}\r?\n\s*\};/g;

const submitNew = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, notes: '', teamTotalHours: globalTotalHours };
    try {
      if (editingId) await updateReport.mutateAsync({ id: editingId, data: payload as any }); else await createReport.mutateAsync(payload as Omit<WorkReport, 'id'>);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(t('common.saveError') + JSON.stringify(err));
    }
  };`;
content = content.replace(submitRegex, submitNew);

// 2. handleDelete
const deleteRegex = /const handleDelete = async \(id: string\) => \{\r?\n\s*if \(confirm\(t\('common\.confirmDelete'\)\)\) \{\r?\n\s*await db\.deleteReport\(id\);\r?\n\s*setReports\(await db\.getReports\(user\.id, user\.role\)\);\r?\n\s*if \(editingId === id\) \{\r?\n\s*setIsModalOpen\(false\);\r?\n\s*setEditingId\(null\);\r?\n\s*\}\r?\n\s*\}\r?\n\s*\};/g;

const deleteNew = `const handleDelete = async (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      await deleteReport.mutateAsync(id);
      if (editingId === id) {
        setIsModalOpen(false);
        setEditingId(null);
      }
    }
  };`;
content = content.replace(deleteRegex, deleteNew);

fs.writeFileSync(filePath, content);
console.log("ReportsView crud fixed");
