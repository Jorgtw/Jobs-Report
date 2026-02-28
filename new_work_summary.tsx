// --- Work Summary View ---
const WorkSummaryView: React.FC<{ user: User }> = ({ user }) => {
    const { lang, t } = useTranslation();
    const [summary, setSummary] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const [s, c, p, w, sub] = await Promise.all([
                db.getSummary(),
                db.getClients(),
                db.getProjects(),
                db.getUsers(),
                db.getSubcontractors(),
            ]);
            setSummary(s);
            setClients(c);
            setProjects(p);
            setUsers(w);
            setSubcontractors(sub);
        };
        load();
    }, []);

    const [filters, setFilters] = useState({
        clientId: '',
        projectId: '',
        userId: '',
        subcontractorId: '',
        dateFrom: '',
        dateTo: ''
    });

    const [adminStatus, setAdminStatus] = useState<'Fatturato' | 'Pagato' | 'Pending'>('Pending');

    const filteredData = useMemo(() => {
        return summary.filter(s => {
            const dateMatch = (!filters.dateFrom || s.date >= filters.dateFrom) &&
                (!filters.dateTo || s.date <= filters.dateTo);
            const clientMatch = !filters.clientId || projects.find(p => p.id === s.projectId)?.clientId === filters.clientId;
            const projectMatch = !filters.projectId || s.projectId === filters.projectId;
            const userMatch = !filters.userId || s.userId === filters.userId;
            const subMatch = !filters.subcontractorId || s.subcontractorId === filters.subcontractorId;
            return dateMatch && clientMatch && projectMatch && userMatch && subMatch;
        });
    }, [summary, filters, projects]);

    const totals = useMemo(() => {
        return filteredData.reduce((acc, s) => ({
            hours: acc.hours + s.totalHours,
            personnelCost: acc.personnelCost + (s.personnelCost || 0),
            subcontractCost: acc.subcontractCost + (s.subcontractorCost || 0),
            totalCost: acc.totalCost + s.cost
        }), { hours: 0, personnelCost: 0, subcontractCost: 0, totalCost: 0 });
    }, [filteredData]);

    const groupedByProject = useMemo(() => {
        const map = new Map();
        filteredData.forEach(s => {
            const key = s.projectId;
            if (!map.has(key)) map.set(key, {
                id: key,
                name: s.projectName,
                clientName: s.clientName,
                hours: 0,
                totalCost: 0,
                dates: new Set<string>()
            });
            const proj = map.get(key);
            proj.hours += s.totalHours;
            proj.totalCost += s.cost;
            proj.dates.add(s.date);
        });
        return Array.from(map.values()).map(p => ({
            ...p,
            dateDisplay: p.dates.size === 1 ? Array.from(p.dates)[0] : 'Periodo'
        })).sort((a, b) => b.totalCost - a.totalCost);
    }, [filteredData]);

    const formatCurrency = (val: number) => val.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleExportPDF = () => {
        const rows = filteredData.map(s => ({
            date: s.date,
            projectName: s.projectName,
            clientName: s.clientName,
            description: s.description,
            workerName: s.userName,
            hours: s.totalHours,
            purchasePrice: s.cost / (s.totalHours || 1),
            extra: s.totalExpenses,
            extraDescription: '',
            sellingPrice: 0,
            margin: 0,
            paid: adminStatus
        }));
        exportToPDF(rows, lang, user.name);
    };

    const handleExportExcel = () => {
        const rows = filteredData.map(s => ({
            date: s.date,
            projectName: s.projectName,
            clientName: s.clientName,
            description: s.description,
            workerName: s.userName,
            hours: s.totalHours,
            purchasePrice: s.cost / (s.totalHours || 1),
            extra: s.totalExpenses,
            extraDescription: '',
            sellingPrice: 0,
            margin: 0,
            paid: adminStatus
        }));
        exportToExcel(rows, lang);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">{t('workSummary')}</h1>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={handleExportExcel} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all">
                        <FileSpreadsheet size={16} className="mr-2" /> {t('exportExcelBtn')}
                    </button>
                    <button onClick={handleExportPDF} className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all">
                        <FileDown size={16} className="mr-2" /> {t('exportPDFBtn')}
                    </button>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5 flex flex-col">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Menu size={14} /> Filtri e Dati
                    </h3>
                    <button onClick={() => setFilters({ clientId: '', projectId: '', userId: '', subcontractorId: '', dateFrom: '', dateTo: '' })} className="text-[10px] items-center font-bold px-3 py-1 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors uppercase">
                        {t('clearFilters')}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('client')}</label>
                        <select value={filters.clientId} onChange={e => setFilters({ ...filters, clientId: e.target.value })} className={inputClasses}>
                            <option value="">{t('allClients')}</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('project')}</label>
                        <select value={filters.projectId} onChange={e => setFilters({ ...filters, projectId: e.target.value })} className={inputClasses}>
                            <option value="">{t('allProjects')}</option>
                            {projects.filter(p => !filters.clientId || p.clientId === filters.clientId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('workerLabel')}</label>
                        <select value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })} className={inputClasses}>
                            <option value="">{t('allWorkers')}</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Ditta Subappalto</label>
                        <select value={filters.subcontractorId} onChange={e => setFilters({ ...filters, subcontractorId: e.target.value })} className={inputClasses}>
                            <option value="">Tutte le Ditte</option>
                            {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('dateFrom')}</label>
                        <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className={inputClasses} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('dateTo')}</label>
                        <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className={inputClasses} />
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight shrink-0">Stato Amministrativo del periodo:</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                            <button onClick={() => setAdminStatus('Fatturato')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${adminStatus === 'Fatturato' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Fatturato</button>
                            <button onClick={() => setAdminStatus('Pagato')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${adminStatus === 'Pagato' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Pagato</button>
                            <button onClick={() => setAdminStatus('Pending')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${adminStatus === 'Pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Pending</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center min-h-[100px]">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Ore totali lavorate</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{totals.hours.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center min-h-[100px]">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Costo personale</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totals.personnelCost)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center min-h-[100px]">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Costo subappalti</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totals.subcontractCost)}</p>
                </div>
                <div className="bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-200 flex flex-col justify-center min-h-[100px] text-white">
                    <p className="text-[10px] font-bold uppercase opacity-80">Totale generale</p>
                    <p className="text-2xl font-black mt-1">{formatCurrency(totals.totalCost)}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Riepilogo per Progetto</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider whitespace-nowrap">Data</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Nome progetto</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">Cliente</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right whitespace-nowrap">Ore Totali</th>
                                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right whitespace-nowrap">Costo Totale</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {groupedByProject.length > 0 ? groupedByProject.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4 font-bold text-blue-600 whitespace-nowrap capitalize">{
                                        p.dateDisplay !== 'Periodo'
                                            ? new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(p.dateDisplay as string))
                                            : 'Periodo'
                                    }</td>
                                    <td className="px-4 py-4 font-bold text-slate-900">{p.name}</td>
                                    <td className="px-4 py-4 text-slate-600 text-xs font-semibold">{p.clientName}</td>
                                    <td className="px-4 py-4 font-black text-slate-700 text-right">{p.hours.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h</td>
                                    <td className="px-4 py-4 font-black text-slate-900 text-right">{formatCurrency(p.totalCost)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 font-medium">{t('noData')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
