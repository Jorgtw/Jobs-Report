
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
  ChevronLeft
} from 'lucide-react';
import { db } from '../services/dbService';
import { InternalCommunication, CommType, User as AppUser, Project } from '../types';
import { LanguageContext, localeMap } from '../App';
import { supabase } from '../services/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CommunicationsHubProps {
  currentUser: AppUser;
  isPremium?: boolean;
}

const CommunicationsHub: React.FC<CommunicationsHubProps> = ({ currentUser, isPremium }) => {
  const { t, lang } = React.useContext(LanguageContext);
  
  const formatDate = (date: number | Date | string, options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  }) => {
    return new Intl.DateTimeFormat(localeMap[lang] || 'it-IT', options).format(new Date(date));
  };

  // State
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'archive'>('inbox');
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
    targetType: 'all' as 'all' | 'user' | 'project',
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
  }, [activeTab, currentUser.companyId, isPremium]);

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6 shadow-sm">
          <Lock size={36} />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
          {t('premium_feature_title')}
        </h2>
        
        <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium leading-relaxed">
          {t('internal_communications_desc')}
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
          {t('upgrade_now')}
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
      const data = await db.getCommunications({ type: activeTab });
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
        case 'close': await db.closeComm(commId); break;
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
    doc.text(t('internal_communication'), 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${t('reference')}: ${selectedThread.id}`, 14, 30);
    doc.text(`${t('status')}: ${t(selectedThread.status)}`, 14, 35);
    doc.text(`${t('date')}: ${formatDate(selectedThread.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 40);

    // Metadata Table
    (doc as any).autoTable({
      startY: 45,
      head: [[t('sender'), t('recipient'), t('type'), t('project')]],
      body: [[
        selectedThread.senderName,
        selectedThread.targetType === 'all' ? t('all') : (selectedThread.targetId || 'N/A'),
        t(selectedThread.type as any),
        projects.find(p => p.id === selectedThread.projectId)?.name || t('none')
      ]],
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] }
    });

    // Content
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(t('thread'), 14, (doc as any).lastAutoTable.finalY + 15);

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

  const filteredComms = communications.filter(c => 
    c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.senderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isPremium && currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-950 mb-2">{t('premium_feature_title')}</h2>
        <p className="text-gray-500 text-center max-w-md mb-8">
          {t('premium_feature_desc')}
        </p>
        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all">
          {t('upgrade_now')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* LEFT SIDEBAR - 30% */}
      <div className={`${isMobile && mobileView === 'detail' ? 'hidden' : 'flex'} w-full md:w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/20`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-950">{t('internal_communications')}</h2>
            <button 
              onClick={() => setIsNewMessageModalOpen(true)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button 
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}
            >
              <Inbox className="w-4 h-4" /> {t('inbox')}
            </button>
            <button 
              onClick={() => setActiveTab('sent')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'sent' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}
            >
              <Outbox className="w-4 h-4" /> {t('outbox')}
            </button>
            <button 
              onClick={() => setActiveTab('archive')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'archive' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-blue-600'}`}
            >
              <Archive className="w-4 h-4" /> {t('archive')}
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredComms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">{t('no_internal_communications')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredComms.map((comm) => (
                <button
                  key={comm.id}
                  onClick={() => handleSelectThread(comm)}
                  className={`w-full text-left p-4 hover:bg-white transition-colors border-l-4 ${selectedThread?.id === comm.id ? 'border-blue-600 bg-white shadow-inner' : 'border-transparent'} ${!comm.isRead ? 'bg-blue-50/10' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t(comm.type as any)}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(comm.createdAt)}</span>
                  </div>
                  <h4 className={`text-sm font-semibold mb-1 line-clamp-1 ${!comm.isRead ? 'text-slate-950' : 'text-gray-500'}`}>
                    {comm.senderName}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {comm.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      comm.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                      comm.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' :
                      comm.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                      comm.status === 'closed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-slate-800'
                    }`}>
                      {t(comm.status as any)}
                    </span>
                    {comm.projectId && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {projects.find(p => p.id === comm.projectId)?.name || 'Project'}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT DETAIL VIEW - 70% */}
      <div className={`${isMobile && mobileView === 'list' ? 'hidden' : 'flex'} w-full md:w-2/3 flex flex-col bg-white`}>
        {selectedThread ? (
          <>
            {/* Detail Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                {isMobile && (
                  <button 
                    onClick={() => setMobileView('list')}
                    className="p-2 -ml-2 hover:bg-gray-50 rounded-full text-blue-600 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  {selectedThread.senderName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                    {selectedThread.senderName}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter ${
                      selectedThread.status === 'open' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      selectedThread.status === 'acknowledged' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      selectedThread.status === 'in_progress' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      selectedThread.status === 'closed' ? 'bg-green-50 text-green-700 border border-green-200' :
                      'bg-gray-50 text-slate-700 border border-gray-200'
                    }`}>
                      {t(selectedThread.status as any)}
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(selectedThread.createdAt, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    {selectedThread.assignedToName && <span className="flex items-center gap-1 text-blue-600 font-medium"><UserCheck className="w-3 h-3" /> {selectedThread.assignedToName}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Actions based on Status & Role */}
                {selectedThread.status === 'open' && selectedThread.senderId !== currentUser.id && (
                  <button 
                    onClick={() => handleStatusAction('ack', selectedThread.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {t('acknowledge')}
                  </button>
                )}
                {(selectedThread.status === 'open' || selectedThread.status === 'acknowledged') && (currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
                  <button 
                    onClick={() => handleStatusAction('take', selectedThread.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                  >
                    <UserCheck className="w-4 h-4" /> {t('takeInCharge')}
                  </button>
                )}
                {['open', 'acknowledged', 'in_progress'].includes(selectedThread.status) && (
                  <button 
                    onClick={() => handleStatusAction('close', selectedThread.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                  >
                    <Check className="w-4 h-4" /> {t('closed')}
                  </button>
                )}
                {selectedThread.status === 'closed' && (
                  <button 
                    onClick={() => handleStatusAction('archive', selectedThread.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                  >
                    <Archive className="w-4 h-4" /> {t('archiveCommunication')}
                  </button>
                )}
                <button 
                  onClick={exportPDF}
                  className="p-2 border border-gray-100 hover:bg-gray-50 text-gray-400 rounded-lg transition-colors"
                  title={t('exportHistory')}
                >
                  <FileText className="w-5 h-5" />
                </button>
                {currentUser.role === 'admin' && (
                  <button 
                    onClick={() => handleStatusAction('delete', selectedThread.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
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
                      <div className={`max-w-[80%] flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${isMe ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-slate-700'}`}>
                          {msg.senderName.charAt(0)}
                        </div>
                        <div className={`group relative`}>
                          {!isMe && <p className="text-[10px] font-bold text-gray-400 mb-1 ml-2 uppercase tracking-widest">{msg.senderName}</p>}
                          <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-950 rounded-tl-none border border-gray-100'}`}>
                            {msg.content}
                          </div>
                          <p className={`text-[9px] mt-1 text-gray-400 font-medium ${isMe ? 'text-right mr-2' : 'text-left ml-2'}`}>
                            {formatDate(msg.createdAt, { hour: '2-digit', minute: '2-digit' })}
                            {isMe && msg.isRead && <span className="ml-2 text-blue-500">✓✓</span>}
                          </p>
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
                    placeholder={t('writeMessage')}
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
            <h3 className="text-xl font-bold text-slate-950 mb-2">{t('internal_communications')}</h3>
            <p className="text-gray-400 max-w-sm">
              {t('noThreadSelected')}
            </p>
          </div>
        )}
      </div>

      {/* NEW MESSAGE MODAL */}
      {isNewMessageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-950">{t('new_communication')}</h2>
              <button onClick={() => setIsNewMessageModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('recipient')}</label>
                <div className="flex gap-2 mb-3">
                  {['all', 'user', 'project'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewMsg(prev => ({ ...prev, targetType: type as any, targetIds: [] }))}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${newMsg.targetType === type ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-300'}`}
                    >
                      {t(type as any)}
                    </button>
                  ))}
                </div>

                {newMsg.targetType === 'user' && (
                  <select 
                    multiple
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions);
                      setNewMsg(prev => ({ ...prev, targetIds: options.map(o => o.value) }));
                    }}
                  >
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.role})</option>
                    ))}
                  </select>
                )}

                {newMsg.targetType === 'project' && (
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newMsg.projectId}
                    onChange={(e) => setNewMsg(prev => ({ ...prev, projectId: e.target.value }))}
                  >
                    <option value="">{t('selectProject')}</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('type')}</label>
                   <div className="flex gap-2">
                     {['note', 'issue', 'confirmation'].map((tType) => (
                       <button
                         key={tType}
                         onClick={() => setNewMsg(prev => ({ ...prev, type: tType as any }))}
                         className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${newMsg.type === tType ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-400'}`}
                       >
                         {t(tType as any)}
                       </button>
                     ))}
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('message')}</label>
                <textarea 
                  rows={4}
                  value={newMsg.content}
                  onChange={(e) => setNewMsg(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-950 placeholder:text-gray-400"
                  placeholder={t('writeMessage')}
                />
              </div>

              <button 
                disabled={sending || (newMsg.targetType === 'user' && newMsg.targetIds.length === 0) || (newMsg.targetType === 'project' && !newMsg.projectId) || !newMsg.content.trim()}
                onClick={handleCreateNew}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                {sending ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {t('send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationsHub;
