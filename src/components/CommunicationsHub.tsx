
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Inbox, 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  X,
  Check,
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
  onUpgradeRequest?: () => void;
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

const CommunicationsHub: React.FC<CommunicationsHubProps> = ({ currentUser, isPremium, onUpgradeRequest }) => {
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
  const [activeTab, setActiveTab] = useState<'todo' | 'sent'>('todo');
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
  const selectedThreadRef = useRef<InternalCommunication | null>(null);

  useEffect(() => {
    selectedThreadRef.current = selectedThread;
  }, [selectedThread]);

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
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchMainData(true);
          if (selectedThreadRef.current) {
            fetchThread(selectedThreadRef.current.id, true);
          }
        }
      )
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.companyId, isPremium]);

  useEffect(() => {
    if (!isPremium) {
      if (onUpgradeRequest) onUpgradeRequest();
    }
  }, [isPremium]);

  if (!isPremium) return null;

  useEffect(() => {
    if (selectedThread) {
      scrollToBottom();
    }
  }, [threadMessages]);

  const fetchMainData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch "inbox" which includes everything relevant and active
      const data = await db.getCommunications({ type: 'inbox' });
      setCommunications(data);
    } catch (err) {
      console.error('Error fetching communications:', err);
    } finally {
      if (!silent) setLoading(false);
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

  const fetchThread = async (rootId: string, silent = false) => {
    if (!silent) setThreadLoading(true);
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
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      styles: {
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
        textColor: [0, 0, 0]
      }
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

        {/* List Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
          <button 
            onClick={() => setActiveTab('todo')}
            className={`flex-1 py-4 text-[12px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'todo' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t('communications.todo')} ({daFareComms.length})
            {activeTab === 'todo' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-in fade-in slide-in-from-bottom-1" />}
          </button>
          <button 
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-4 text-[12px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'sent' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t('communications.sent')} ({inviateComms.length})
            {activeTab === 'sent' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-in fade-in slide-in-from-bottom-1" />}
          </button>
        </div>
        
        {/* List Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">{t('communications.loading')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(activeTab === 'todo' ? daFareComms : inviateComms).length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <CheckCircle2 className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{t('common.noData')}</p>
                </div>
              ) : (
                (activeTab === 'todo' ? daFareComms : inviateComms).map((comm) => (
                  <button
                    key={comm.id}
                    onClick={() => handleSelectThread(comm)}
                    className={`w-full text-left p-6 transition-all group relative hover:bg-slate-50/50 ${selectedThread?.id === comm.id ? 'bg-blue-50/30' : 'bg-white'}`}
                  >
                    <div className="flex flex-col gap-1">
                      {/* 1. Type */}
                      <span className="text-[11px] font-medium text-[#888780] uppercase tracking-wider">
                        {t(`communications.type_${comm.type}` as any)}
                      </span>
                      
                      {/* 2. Sender Name */}
                      <div className="flex justify-between items-center">
                        <h4 className={`text-[13px] font-medium tracking-tight ${!comm.isRead && activeTab === 'todo' ? 'text-blue-600 font-bold' : 'text-[#2c2c2a]'}`}>
                          {activeTab === 'sent' 
                            ? (comm.targetType === 'all' ? t('communications.allTeam') : (comm.targetId === currentUser.id ? t('communications.myself') : t('communications.recipientLabel')))
                            : comm.senderName
                          }
                        </h4>
                        <span className="text-[10px] font-medium text-slate-300">{formatDate(comm.createdAt)}</span>
                      </div>
                      
                      {/* 3. Preview Text */}
                      <p className="text-[12px] text-gray-400 line-clamp-1 mt-1 font-normal">
                        {comm.content}
                      </p>
                      
                      {/* 4. Status Badge */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${
                          comm.status === 'open' ? 'bg-amber-50 text-amber-600' :
                          comm.status === 'acknowledged' ? 'bg-blue-50 text-blue-600' :
                          comm.status === 'in_progress' ? 'bg-purple-50 text-purple-600' :
                          comm.status === 'closed' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {t(`communications.status_${comm.status}` as any)}
                        </span>
                        {comm.projectId && (
                          <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1 opacity-60">
                            • {projects.find(p => p.id === comm.projectId)?.name}
                          </span>
                        )}
                        {!comm.isRead && activeTab === 'todo' && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT DETAIL VIEW - 70% */}
      <div className={`${isMobile && mobileView === 'list' ? 'hidden' : 'flex'} w-full md:w-2/3 flex flex-col bg-white`}>
        {selectedThread ? (
          <>
            {/* Workflow Banner */}
            {/* Minimalist Status Bar */}
            <div className="px-6 py-2 bg-[#fafaf8] border-b-[0.5px] border-[#e8e5de] flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${selectedThread.needsAction ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-[12px] font-medium text-slate-500 lowercase">
                {selectedThread.needsAction ? t('communications.waitingYourReply') : t('communications.waitingOthersReply')}
              </span>
              {selectedThread.needsAction && (
                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded text-[10px] font-bold uppercase tracking-tight">
                  {t('communications.actionRequired')}
                </span>
              )}
            </div>

            {/* Detail Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                {isMobile && (
                  <button 
                    onClick={() => setMobileView('list')}
                    className="p-2 -ml-2 hover:bg-slate-50 rounded-full text-blue-600 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                    {selectedThread.senderName}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      selectedThread.status === 'open' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      selectedThread.status === 'acknowledged' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      selectedThread.status === 'in_progress' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      selectedThread.status === 'closed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {t(`communications.status_${selectedThread.status}` as any)}
                    </span>
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    <span className="flex items-center gap-1.5">{formatDate(selectedThread.createdAt)}</span>
                    {projects.find(p => p.id === selectedThread.projectId) && (
                      <span className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-500 capitalize">
                        {projects.find(p => p.id === selectedThread.projectId)?.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Actions: Small & Minimalist */}
                {['open', 'acknowledged', 'in_progress'].includes(selectedThread.status) && selectedThread.senderId === currentUser.id && (
                  <button 
                    onClick={() => handleStatusAction('close', selectedThread.id)}
                    className="px-3.5 py-1.5 bg-white border border-[#185FA5] text-[#185FA5] text-[12px] font-bold rounded hover:bg-blue-50 transition-all"
                  >
                    {t('communications.close')}
                  </button>
                )}

                {selectedThread.status === 'closed' && (
                  <button 
                    onClick={() => handleStatusAction('archive', selectedThread.id)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-500 text-[12px] font-bold rounded hover:bg-slate-50 transition-all"
                  >
                    {t('communications.archiveAction')}
                  </button>
                )}

                <button 
                  onClick={exportPDF}
                  className="w-[30px] h-[30px] flex items-center justify-center border border-slate-300 text-slate-400 rounded hover:bg-slate-50 transition-all bg-white"
                  title={t('communications.exportHistory')}
                >
                  <FileText className="w-4 h-4" />
                </button>

                {currentUser.role === 'admin' && (
                  <button 
                    onClick={() => handleStatusAction('delete', selectedThread.id)}
                    className="w-[30px] h-[30px] flex items-center justify-center text-slate-300 hover:text-red-400 transition-all"
                    title={t('common.delete')}
                  >
                    <X className="w-4 h-4" />
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
                          <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed ${isMe ? 'bg-[#EBF3FC] text-[#1a3a5c] rounded-tr-none' : 'bg-[#f5f4f0] text-[#2c2c2a] rounded-tl-none font-medium'}`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-3 mt-1.5 text-[9px] font-bold text-slate-300 uppercase tracking-widest ${isMe ? 'justify-end mr-3' : 'justify-start ml-3'}`}>
                             <span>{formatDate(msg.createdAt, { hour: '2-digit', minute: '2-digit' })}</span>
                             {isMe && msg.isRead && (
                               <span className="text-blue-400 italic font-black flex items-center gap-1">
                                 <Check size={8} strokeWidth={4} /> {t('communications.read_at')} {formatDate(msg.createdAt, { hour: '2-digit', minute: '2-digit' })}
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
                   {selectedThread.status === 'closed' ? t('communications.thread_closed_msg') : t('communications.thread_archived_msg')}
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
