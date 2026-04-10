
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Inbox, 
  Send as Outbox, 
  Archive, 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  X,
  UserCheck,
  Check,
  Lock,
  MessageSquare,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import { db } from '../services/dbService';
import { InternalCommunication, CommType, User as AppUser, Project } from '../types';
import { useTranslation, localeMap } from '../App';
import { supabase } from '../services/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CommunicationsHubProps {
  currentUser: AppUser;
  isPremium?: boolean;
}

const UserMultiSelect = ({ 
  users, 
  selectedIds, 
  onChange, 
  placeholder,
  t 
}: { 
  users: AppUser[], 
  selectedIds: string[], 
  onChange: (ids: string[]) => void,
  placeholder: string,
  t: any
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleUser = (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    onChange(newIds);
  };

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] w-full px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus-within:ring-2 focus-within:ring-blue-500 flex flex-wrap gap-2 items-center cursor-pointer transition-all"
      >
        {selectedUsers.length > 0 ? (
          selectedUsers.map(u => (
            <span key={u.id} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 group animate-in fade-in zoom-in duration-200">
              {u.name}
              <button 
                onClick={(e) => { e.stopPropagation(); toggleUser(u.id); }}
                className="hover:text-blue-900 transition-colors"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <div className="ml-auto text-gray-400">
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[110] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {users.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 font-medium">
              {t('communications.no_workers_available')}
            </div>
          ) : (
            users.map(u => (
              <button
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${selectedIds.includes(u.id) ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-slate-700'}`}
              >
                <span>{u.name} <span className="text-[10px] opacity-60 ml-1">({t(`projects.role${u.role.charAt(0).toUpperCase()}${u.role.slice(1)}` as any)})</span></span>
                {selectedIds.includes(u.id) && <Check size={14} strokeWidth={3} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const CommunicationsHub: React.FC<CommunicationsHubProps> = ({ currentUser, isPremium }) => {
  const { t, lang } = useTranslation();
  
  const formatDate = (date: number | Date | string, options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  }) => {
    return new Intl.DateTimeFormat(localeMap[lang] || 'it-IT', options).format(new Date(date));
  };

  // State
  const [isDaFareOpen, setIsDaFareOpen] = useState(true);
  const [isInviateOpen, setIsInviateOpen] = useState(false);
  const [communications, setCommunications] = useState<InternalCommunication[]>([]);
  const [selectedThread, setSelectedThread] = useState<InternalCommunication | null>(null);
  const [threadMessages, setThreadMessages] = useState<InternalCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // New Message Form State
  const [newMsg, setNewMsg] = useState({
    content: '',
    type: 'note' as CommType,
    targetType: 'all' as 'all' | 'user',
    targetIds: [] as string[],
    projectId: ''
  });

  // Data for Selects
  const [workers, setWorkers] = useState<AppUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isPremium) {
      setLoading(false);
      return;
    }
    fetchMainData();
    fetchSupportData();

    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('internal_comms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internal_communications',
          filter: `company_id=eq.${currentUser.companyId}`
        },
        () => {
          fetchMainData();
          if (selectedThread) {
            fetchThread(selectedThread.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.companyId, isPremium]);

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6 shadow-sm">
          <Lock size={36} />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
          {t('communications.premiumFeature')}
        </h2>
        
        <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium leading-relaxed">
          {t('communications.internalCommunicationsDesc')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
          {[
            { icon: MessageSquare, title: 'Ticket & Thread', desc: 'Gestisci conversazioni strutturate per ogni richiesta' },
            { icon: Users, title: 'Team Sync', desc: 'Invia avvisi a tutto il team o a singoli progetti' },
            { icon: FileText, title: 'Export PDF', desc: 'Scarica i verbali delle conversazioni in formato PDF' }
          ].map((feat, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <feat.icon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <h3 className="text-[10px] font-black uppercase text-slate-900 mb-1">{feat.title}</h3>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">{feat.desc}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={() => window.location.hash = '/profile'}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <Sparkles size={18} />
          {t('communications.upgradeNow')}
        </button>
      </div>
    );
  }

  useEffect(() => {
    if (selectedThread) {
      scrollToBottom();
    }
  }, [threadMessages]);

  const fetchMainData = async () => {
    setLoading(true);
    try {
      // Fetch "inbox" which includes everything relevant and active
      const data = await db.getCommunications({ type: 'inbox' });
      setCommunications(data);
    } catch (err) {
      console.error('Error fetching communications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [w, p] = await Promise.all([db.getUsers(), db.getProjects()]);
      setWorkers(w.filter(u => u.id !== currentUser.id));
      setProjects(p);
    } catch (err) {
      console.error('Error fetching support data:', err);
    }
  };

  const fetchThread = async (rootId: string) => {
    setThreadLoading(true);
    try {
      const messages = await db.getThread(rootId);
      setThreadMessages(messages);
      // Mark root as read
      await db.markAsRead(rootId);
    } catch (err) {
      console.error('Error fetching thread:', err);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSelectThread = (comm: InternalCommunication) => {
    setSelectedThread(comm);
    fetchThread(comm.id);
    if (isMobile) setMobileView('detail');
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    setSending(true);
    try {
      // Logic for reply: target is the original sender if we are the target, or vice versa
      const targetId = selectedThread.senderId === currentUser.id 
        ? selectedThread.targetId 
        : selectedThread.senderId;

      await db.sendCommunication({
        content: replyText,
        parentId: selectedThread.id,
        targetType: selectedThread.targetType,
        targetId: targetId,
        projectId: selectedThread.projectId,
        type: selectedThread.type
      });
      setReplyText('');
      fetchThread(selectedThread.id);
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newMsg.content.trim()) return;
    setSending(true);
    try {
      await db.sendCommunication({
        content: newMsg.content,
        type: newMsg.type,
        targetType: newMsg.targetType,
        targetIds: newMsg.targetIds,
        projectId: newMsg.projectId
      });
      setIsNewMessageModalOpen(false);
      setNewMsg({ content: '', type: 'note', targetType: 'all', targetIds: [], projectId: '' });
      fetchMainData();
    } catch (err) {
      console.error('Error creating communication:', err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusAction = async (action: 'ack' | 'take' | 'close' | 'archive' | 'delete', commId: string) => {
    try {
      switch (action) {
        case 'ack': await db.acknowledgeComm(commId); break;
        case 'take': await db.takeInCharge(commId); break;
        case 'close': await db.closeComm(commId, currentUser.id); break;
        case 'archive': await db.archiveComm(commId); break;
        case 'delete': await db.deleteComm(commId); break;
      }
      fetchMainData();
      if (selectedThread?.id === commId) {
        const updated = await db.getThread(commId);
        setThreadMessages(updated);
        // Refresh root status
        const root = updated.find(m => m.id === commId);
        if (root) setSelectedThread(root);
      }
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    }
  };

  const exportPDF = () => {
    if (!selectedThread) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.text(t('communications.internalCommunication'), 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${t('common.reference')}: ${selectedThread.id}`, 14, 30);
    doc.text(`${t('common.status')}: ${t(`communications.status_${selectedThread.status}` as any)}`, 14, 35);
    doc.text(`${t('common.date')}: ${formatDate(selectedThread.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 40);

    // Metadata Table
    (doc as any).autoTable({
      startY: 45,
      head: [[t('common.sender'), t('common.recipient'), t('common.type'), t('common.project')]],
      body: [[
        selectedThread.senderName,
        selectedThread.targetType === 'all' ? t('common.all') : (selectedThread.targetId || 'N/A'),
        t(`communications.type_${selectedThread.type}` as any),
        projects.find(p => p.id === selectedThread.projectId)?.name || t('common.none')
      ]],
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] }
    });

    // Content
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(t('communications.thread'), 14, (doc as any).lastAutoTable.finalY + 15);

    let startY = (doc as any).lastAutoTable.finalY + 20;

    threadMessages.forEach((msg) => {
      const dateStr = formatDate(msg.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const header = `${msg.senderName} - ${dateStr}`;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(header, 14, startY);
      
      startY += 5;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(msg.content, pageWidth - 28);
      doc.text(lines, 14, startY);
      
      startY += (lines.length * 5) + 10;
      
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }
    });

    doc.save(`Comunicazione_${selectedThread.id.substring(0,8)}.pdf`);
  };

  const daFareComms = communications.filter(c => c.needsAction && (
    c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  const inviateComms = communications.filter(c => c.senderId === currentUser.id && (
    c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  if (!isPremium && currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-955 mb-2">{t('communications.premiumFeature')}</h2>
        <p className="text-gray-500 text-center max-w-md mb-8">
          {t('communications.premiumRequiredDesc')}
        </p>
        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all">
          {t('communications.upgradeNow')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm selection:bg-blue-100">
      {/* LEFT SIDEBAR - 30% */}
      <div className={`${isMobile && mobileView === 'detail' ? 'hidden' : 'flex'} w-full md:w-1/3 border-r border-gray-100 flex flex-col bg-[#f5f4f0]`}>
        {/* Sidebar Header */}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('communications.internalCommunications')}</h2>
            <button 
              onClick={() => setIsNewMessageModalOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95"
              title={t('communications.newCommunication')}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm font-medium"
            />
          </div>
        </div>

        {/* List Content with Accordion */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Caricamento...</p>
            </div>
          ) : (
            <>
              {/* ACCORDION: DA FARE */}
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm transition-all duration-300">
                <button 
                  onClick={() => setIsDaFareOpen(!isDaFareOpen)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                      <Clock size={16} />
                    </div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Da Fare</span>
                    {daFareComms.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full shadow-sm">
                        {daFareComms.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDaFareOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDaFareOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    {daFareComms.length === 0 ? (
                      <div className="p-8 text-center">
                        <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2 opacity-40" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Tutto completato!</p>
                      </div>
                    ) : (
                      daFareComms.map((comm) => (
                        <button
                          key={comm.id}
                          onClick={() => handleSelectThread(comm)}
                          className={`w-full text-left p-4 hover:bg-slate-50 transition-all group relative ${selectedThread?.id === comm.id ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{t(`communications.type_${comm.type}` as any)}</span>
                            <span className="text-[9px] font-bold text-slate-400">{formatDate(comm.createdAt)}</span>
                          </div>
                          <h4 className={`text-sm font-bold mb-1 line-clamp-1 ${!comm.isRead ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-500'}`}>
                            {comm.senderName}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {comm.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                              comm.status === 'open' ? 'bg-amber-100 text-amber-700' :
                              comm.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' :
                              comm.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                              comm.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {t(`communications.status_${comm.status}` as any)}
                            </span>
                            {comm.projectId && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 border border-slate-200/50">
                                <FileText size={10} /> {projects.find(p => p.id === comm.projectId)?.name || 'Progetto'}
                              </span>
                            )}
                          </div>
                          {!comm.isRead && <div className="absolute right-4 bottom-4 w-2 h-2 bg-blue-600 rounded-full shadow-lg shadow-blue-200 ring-4 ring-white" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* ACCORDION: INVIATE */}
              <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm transition-all duration-300">
                <button 
                  onClick={() => setIsInviateOpen(!isInviateOpen)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Outbox size={16} />
                    </div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Inviate</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isInviateOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isInviateOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    {inviateComms.length === 0 ? (
                      <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-40">Nessuna inviata</div>
                    ) : (
                      inviateComms.map((comm) => (
                        <button
                          key={comm.id}
                          onClick={() => handleSelectThread(comm)}
                          className={`w-full text-left p-4 hover:bg-slate-50 transition-all group ${selectedThread?.id === comm.id ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t(`communications.type_${comm.type}` as any)}</span>
                            <span className="text-[9px] font-bold text-slate-400">{formatDate(comm.createdAt)}</span>
                          </div>
                          <h4 className="text-sm font-bold mb-1 text-slate-700 line-clamp-1">
                            {comm.targetType === 'all' ? 'Tutto il Team' : (comm.targetId === currentUser.id ? 'Io stesso' : 'Destinatario')}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3 italic">
                            {comm.content}
                          </p>
                          <div className="flex items-center gap-2">
                             <div className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-lg text-[9px] font-bold">
                                {t(`communications.status_${comm.status}` as any)}
                             </div>
                             {!comm.isRead ? (
                               <span className="text-[9px] font-bold text-amber-500 italic">In attesa di risposta altrui</span>
                             ) : (
                               <span className="text-[9px] font-bold text-emerald-500 italic flex items-center gap-1"><Check size={8} strokeWidth={4} /> Letto</span>
                             )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT DETAIL VIEW - 70% */}
      <div className={`${isMobile && mobileView === 'list' ? 'hidden' : 'flex'} w-full md:w-2/3 flex flex-col bg-white`}>
        {selectedThread ? (
          <>
            {/* Workflow Banner */}
            {selectedThread.needsAction && (
              <div className="px-6 py-2.5 bg-red-600 text-white flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500">
                <Sparkles size={16} className="animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">In attesa della tua risposta</span>
              </div>
            )}
            {!selectedThread.needsAction && selectedThread.status !== 'closed' && (
               <div className="px-6 py-2.5 bg-blue-50 text-blue-700 flex items-center justify-center gap-3">
                 <Clock size={16} />
                 <span className="text-xs font-black uppercase tracking-widest">In attesa di risposta altrui</span>
               </div>
            )}

            {/* Detail Header */}
            <div className="p-5 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-4">
                {isMobile && (
                  <button 
                    onClick={() => setMobileView('list')}
                    className="p-2 -ml-2 hover:bg-slate-50 rounded-full text-blue-600 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 font-bold shrink-0">
                  {selectedThread.senderName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                    {selectedThread.senderName}
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                      selectedThread.status === 'open' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      selectedThread.status === 'acknowledged' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      selectedThread.status === 'in_progress' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      selectedThread.status === 'closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {t(`communications.status_${selectedThread.status}` as any)}
                    </span>
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDate(selectedThread.createdAt)}</span>
                    {selectedThread.assignedToName && <span className="flex items-center gap-1.5 text-blue-600"><UserCheck className="w-3 h-3" /> {selectedThread.assignedToName}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Actions based on Status & Role & Ownership */}
                {selectedThread.status === 'open' && selectedThread.senderId !== currentUser.id && (
                  <button 
                    onClick={() => handleStatusAction('ack', selectedThread.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-200"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {t('communications.acknowledge')}
                  </button>
                )}
                {(selectedThread.status === 'open' || selectedThread.status === 'acknowledged') && (currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
                  <button 
                    onClick={() => handleStatusAction('take', selectedThread.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-200"
                  >
                    <UserCheck className="w-4 h-4" /> {t('communications.takeInCharge')}
                  </button>
                )}
                
                {/* CLOSE Action: ONLY SENDER */}
                {['open', 'acknowledged', 'in_progress'].includes(selectedThread.status) && selectedThread.senderId === currentUser.id && (
                  <button 
                    onClick={() => handleStatusAction('close', selectedThread.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-200"
                  >
                    <Check className="w-4 h-4" /> {t('communications.closed')}
                  </button>
                )}

                {selectedThread.status === 'closed' && (
                  <button 
                    onClick={() => handleStatusAction('archive', selectedThread.id)}
                    className="p-2 border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-400 rounded-xl transition-all"
                    title={t('communications.archiveCommunication')}
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={exportPDF}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-400 rounded-xl transition-all"
                  title={t('communications.exportHistory')}
                >
                  <FileText className="w-5 h-5" />
                </button>
                {currentUser.role === 'admin' && (
                  <button 
                    onClick={() => handleStatusAction('delete', selectedThread.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {threadLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                threadMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black border-2 ${isMe ? 'bg-blue-600 border-blue-100 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
                          {msg.senderName.charAt(0)}
                        </div>
                        <div className={`group relative`}>
                          {!isMe && <p className="text-[10px] font-black text-slate-400 mb-1.5 ml-2 uppercase tracking-widest">{msg.senderName}</p>}
                          <div className={`px-5 py-4 rounded-3xl text-sm shadow-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none border border-slate-100 font-medium'}`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-3 mt-1.5 text-[9px] font-bold text-slate-300 uppercase tracking-widest ${isMe ? 'justify-end mr-3' : 'justify-start ml-3'}`}>
                             <span>{formatDate(msg.createdAt, { hour: '2-digit', minute: '2-digit' })}</span>
                             {isMe && msg.isRead && (
                               <span className="text-blue-400 italic font-black flex items-center gap-1">
                                 <Check size={8} strokeWidth={4} /> Letto il {formatDate(msg.createdAt, { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Bar / Reply */}
            {['open', 'acknowledged', 'in_progress'].includes(selectedThread.status) ? (
              <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <textarea 
                    rows={1}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t('communications.writeMessage')}
                    className="flex-1 px-4 py-2 bg-transparent outline-none text-sm resize-none text-slate-950"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <button 
                    disabled={!replyText.trim() || sending}
                    onClick={handleSendReply}
                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all shadow-sm"
                  >
                    <Send className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-50 text-center border-t border-gray-100">
                 <p className="text-sm font-medium text-gray-400 italic">
                   {selectedThread.status === 'closed' ? "Questa conversazione è stata chiusa. Archivia per completare il ciclo." : "Conversazione archiviata."}
                 </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 text-blue-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-950 mb-2">{t('communications.internalCommunications')}</h3>
            <p className="text-gray-400 max-w-sm">
              {t('communications.noThreadSelected')}
            </p>
          </div>
        )}
      </div>

      {/* NEW MESSAGE MODAL */}
      {isNewMessageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-950">{t('communications.newCommunication')}</h2>
              <button onClick={() => setIsNewMessageModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('communications.recipient')}</label>
                <div className="flex gap-2 mb-3">
                  {['all', 'user'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewMsg(prev => ({ ...prev, targetType: type as any, targetIds: [] }))}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${newMsg.targetType === type ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-300'}`}
                    >
                      {type === 'all' ? t('communications.allUsers') : t('common.user')}
                    </button>
                  ))}
                </div>

                {newMsg.targetType === 'user' && (
                  <div className="mb-3">
                    <UserMultiSelect 
                      users={workers}
                      selectedIds={newMsg.targetIds}
                      onChange={(ids) => setNewMsg(prev => ({ ...prev, targetIds: ids }))}
                      placeholder={t('communications.selectUsers')}
                      t={t}
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-gray-50 mt-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('common.project')} ({t('common.optional')})</label>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newMsg.projectId}
                    onChange={(e) => setNewMsg(prev => ({ ...prev, projectId: e.target.value }))}
                  >
                    <option value="">{t('projects.selectProject')}</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('common.type')}</label>
                   <div className="flex gap-2">
                     {['note', 'issue', 'confirmation'].map((tType) => (
                       <button
                         key={tType}
                         onClick={() => setNewMsg(prev => ({ ...prev, type: tType as any }))}
                         className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${newMsg.type === tType ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-400'}`}
                       >
                         {t(`communications.type_${tType}` as any)}
                       </button>
                     ))}
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('communications.message')}</label>
                <textarea 
                  rows={4}
                  value={newMsg.content}
                  onChange={(e) => setNewMsg(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-950 placeholder:text-gray-400"
                  placeholder={t('communications.writeMessage')}
                />
              </div>

              <button 
                disabled={sending || (newMsg.targetType === 'user' && newMsg.targetIds.length === 0) || !newMsg.content.trim()}
                onClick={handleCreateNew}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {sending ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {t('communications.send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationsHub;
