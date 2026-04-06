import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Send, Filter, CheckCircle2, AlertCircle, Info, Users, Briefcase, Bell, Search, Trash2 } from 'lucide-react';
import { db } from '../services/dbService';
import { User, InternalCommunication, CommunicationTargetType, MessageType } from '../types';
import { translations } from '../translations';

interface CommunicationsHubProps {
  user: User;
  lang?: any;
}

const CommunicationsHub: React.FC<CommunicationsHubProps> = ({ user, lang = 'it' }) => {
  const t = (key: string): string => {
    const currentTranslations = (translations as any)[lang] || translations['it'];
    return currentTranslations[key] || (translations['it'] as any)[key] || key;
  };

  const [comms, setComms] = useState<InternalCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CommunicationTargetType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Message State
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    type: 'note' as MessageType,
    targetType: 'all' as CommunicationTargetType,
    targetIds: [] as string[]
  });

  // Reference Data
  const [personnel, setPersonnel] = useState<User[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [c, p, u] = await Promise.all([
        db.getCommunications(),
        db.getProjects(),
        db.getUsers()
      ]);
      setComms(c);
      setProjects(p);
      setPersonnel(u.filter((usr: any) => usr.status === 'active' && usr.id !== user.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredComms = useMemo(() => {
    return comms.filter(c => {
      const matchType = filter === 'all' || c.targetType === filter;
      const matchSearch = c.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.senderName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }, [comms, filter, searchTerm]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim()) return;
    if (newMessage.targetType === 'user' && newMessage.targetIds.length === 0) {
        alert(t('selectAtLeastOneUser' as any) || 'Seleziona almeno un destinatario');
        return;
    }
    if (newMessage.targetType === 'project' && newMessage.targetIds.length === 0) {
        alert(t('selectProject' as any) || 'Seleziona un progetto');
        return;
    }

    setIsSending(true);
    try {
      await db.sendCommunication({
        content: newMessage.content,
        type: newMessage.type,
        targetType: newMessage.targetType,
        targetIds: newMessage.targetIds,
        title: newMessage.title
      });
      setNewMessage({
        title: '',
        content: '',
        type: 'note',
        targetType: 'all',
        targetIds: []
      });
      loadData();
    } catch (err) {
      alert(t('saveError') + JSON.stringify(err));
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await db.markAsRead(id);
      setComms(prev => prev.map(c => c.id === id ? { ...c, isRead: true } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: MessageType) => {
    switch (type) {
      case 'issue': return <AlertCircle className="text-red-500" size={18} />;
      case 'confirmation': return <CheckCircle2 className="text-emerald-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* Sidebar: Filters & New Message (Admin only for new) */}
      <div className="lg:w-80 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} /> {t('filters')}
          </h2>
          <div className="space-y-1">
            {[
              { id: 'all', label: t('all' as any) || 'Tutti', icon: Bell },
              { id: 'all', label: t('target_all'), icon: Users, type: 'all' },
              { id: 'project', label: t('target_project'), icon: Briefcase, type: 'project' },
              { id: 'user', label: t('personal' as any) || 'Personali', icon: Mail, type: 'user' }
            ].map((f, i) => (
              <button
                key={i}
                onClick={() => setFilter(f.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  filter === f.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <f.icon size={16} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {(user.role === 'admin' || user.role === 'supervisor') && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Send size={14} /> {t('new_communication')}
            </h2>
            <form onSubmit={handleSend} className="space-y-3">
              <input
                type="text"
                placeholder={t('communication_title')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                value={newMessage.title}
                onChange={e => setNewMessage({ ...newMessage, title: e.target.value })}
              />
              
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={newMessage.targetType}
                onChange={e => setNewMessage({ ...newMessage, targetType: e.target.value as any, targetIds: [] })}
              >
                <option value="all">{t('target_all')}</option>
                <option value="project">{t('target_project')}</option>
                <option value="user">{t('individualWorkers' as any) || 'Lavoratori Singoli'}</option>
              </select>

              {newMessage.targetType === 'project' && (
                <select
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  onChange={e => setNewMessage({ ...newMessage, targetIds: [e.target.value] })}
                >
                  <option value="">{t('selectProject' as any) || 'Seleziona Progetto'}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}

              {newMessage.targetType === 'user' && (
                <div className="max-h-32 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1 bg-slate-50/50">
                  {personnel.map(p => (
                    <label key={p.id} className="flex items-center gap-2 px-2 py-1 hover:bg-white rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={newMessage.targetIds.includes(p.id)}
                        onChange={e => {
                          const ids = e.target.checked 
                            ? [...newMessage.targetIds, p.id]
                            : newMessage.targetIds.filter(id => id !== p.id);
                          setNewMessage({ ...newMessage, targetIds: ids });
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold text-slate-600">{p.name}</span>
                    </label>
                  ))}
                </div>
              )}

              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                value={newMessage.type}
                onChange={e => setNewMessage({ ...newMessage, type: e.target.value as any })}
              >
                <option value="note">{t('typeNote')}</option>
                <option value="issue">{t('typeIssue')}</option>
                <option value="confirmation">{t('typeConfirmation')}</option>
              </select>

              <textarea
                required
                placeholder={t('communication_content')}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-colors resize-none"
                value={newMessage.content}
                onChange={e => setNewMessage({ ...newMessage, content: e.target.value })}
              />

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                <Send size={14} /> {isSending ? t('sending') : (t('send' as any) || 'Invia')}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Main Feed */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between px-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t('internalCommMenu')} 
                {comms.filter(c => !c.isRead).length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center justify-center">
                        {comms.filter(c => !c.isRead).length}
                    </span>
                )}
            </h1>
            <div className="relative w-48">
                <input 
                    type="text" 
                    placeholder={t('placeholderSearch')}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold outline-none focus:border-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 translate-y-10">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">{t('loading' as any) || 'Caricamento...'}</p>
          </div>
        ) : filteredComms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 opacity-60">
            <Mail size={40} className="text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-400">{t('noMessages')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComms.map((c) => (
              <div 
                key={c.id} 
                onClick={() => !c.isRead && markAsRead(c.id)}
                className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer group shadow-sm ${
                  c.isRead ? 'border-slate-100' : 'border-blue-200 bg-blue-50/20 ring-1 ring-blue-100'
                } hover:shadow-md hover:border-blue-300`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getIcon(c.type)}
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.senderName}</span>
                      <span className="text-[9px] text-slate-300">• {new Date(c.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {!c.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>}
                    </div>
                    {c.title && <h3 className="text-sm font-black text-slate-900 leading-tight">{c.title}</h3>}
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    
                    {c.targetType === 'project' && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase border border-amber-100">
                            <Briefcase size={10} />
                            {projects.find(p => p.id === c.targetId)?.name || 'Progetto'}
                        </div>
                    )}
                  </div>
                  
                  {user.role === 'admin' && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationsHub;
