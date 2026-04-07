import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Send, Filter, CheckCircle2, AlertCircle, Info, Users, Briefcase, Bell, Search, Trash2, CheckCircle } from 'lucide-react';
import { db } from '../services/dbService';
import { User, InternalCommunication, CommunicationTargetType, MessageType } from '../types';
import { translations } from '../translations';

interface CommunicationsHubProps {
  user: User;
  lang?: any;
}

const HistoryItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    date: string;
    actions?: React.ReactNode;
    statusBadge?: React.ReactNode;
}> = ({ icon, title, subtitle, date, actions, statusBadge }) => (
    <div className="card-item d-flex align-items-start gap-3 p-3 border-bottom hover-bg-light transition-all">
        <div className="flex-shrink-0 mt-1">
            {icon}
        </div>
        <div className="flex-grow-1 min-w-0">
            <div className="d-flex align-items-center justify-content-between mb-1 gap-2">
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>{title}</span>
                    {statusBadge}
                </div>
                <span className="text-muted flex-shrink-0" style={{ fontSize: '0.75rem' }}>{date}</span>
            </div>
            <div className="text-secondary text-wrap" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                {subtitle}
            </div>
            {actions && <div className="mt-2 d-flex align-items-center gap-2">
                {actions}
            </div>}
        </div>
    </div>
);

const CommunicationsHub: React.FC<CommunicationsHubProps> = ({ user, lang = 'it' }) => {
  const t = (key: string): string => {
    const currentTranslations = (translations as any)[lang] || translations['it'];
    return currentTranslations[key] || (translations['it'] as any)[key] || key;
  };

  const [comms, setComms] = useState<InternalCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CommunicationTargetType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState({
    content: '',
    type: 'note' as MessageType,
    targetType: 'all' as CommunicationTargetType,
    targetIds: [] as string[],
    projectId: '' as string
  });

  const [personnel, setPersonnel] = useState<User[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Split loading to be robust as requested
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const c = await db.getCommunications();
        setComms(c);
      } catch (err) {
        console.error("Error loading messages:", err);
        setComms([]);
      }
    };

    const loadProjects = async () => {
      try {
        const p = await db.getProjects();
        setProjects(p);
      } catch (err) {
        console.error("Error loading projects:", err);
        setProjects([]);
      }
    };

    const loadPersonnel = async () => {
      try {
        const u = await db.getUsers();
        // Point 1 Fix: Ensure personnel list is populated (exclude self)
        setPersonnel(u.filter((usr: any) => usr.id !== user.id));
      } catch (err) {
        console.error("Error loading personnel:", err);
        setPersonnel([]);
      }
    };

    const init = async () => {
      setLoading(true);
      await Promise.all([loadMessages(), loadProjects(), loadPersonnel()]);
      setLoading(false);
    };

    init();
  }, [user.id]);

  const filteredComms = useMemo(() => {
    return comms.filter(c => {
      const matchType = filter === 'all' || c.targetType === filter;
      const matchSearch = c.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.senderName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }, [comms, filter, searchTerm]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim()) return;

    setIsSending(true);
    try {
      await db.sendCommunication({
        content: newMessage.content,
        type: newMessage.type,
        targetType: newMessage.targetType,
        targetIds: newMessage.targetType === 'all' ? [] : newMessage.targetIds,
        projectId: newMessage.projectId || undefined
      });
      
      setNewMessage({
        content: '',
        type: 'note',
        targetType: 'all',
        targetIds: [],
        projectId: ''
      });
      
      const updated = await db.getCommunications();
      setComms(updated);
    } catch (err: any) {
      alert(t('sendError' as any) || 'Errore durante l\'invio: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const toggleWorkerSelection = (id: string) => {
    setNewMessage(prev => ({
      ...prev,
      targetIds: prev.targetIds.includes(id) 
        ? prev.targetIds.filter(tid => tid !== id)
        : [...prev.targetIds, id]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="row g-4">
        {/* Main Panel - Composition Form */}
        <div className="col-12 col-lg-5 order-2 order-lg-1">
          <div className="custom-card shadow-sm border-0 h-100 p-4" style={{ backgroundColor: '#fff', borderRadius: '16px' }}>
            <div className="d-flex align-items-center gap-2 mb-4 border-bottom pb-3">
              <Mail className="text-blue-600" size={24} />
              <h2 className="h5 fw-bold m-0">{t('new_communication' as any) || 'Nuova Comunicazione'}</h2>
            </div>
            
            <form onSubmit={handleSend} className="space-y-6">
              {/* Recipient Selection */}
              <div className="mb-4">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight mb-2 d-block">
                  A: {t('recipient' as any) || 'Destinatario'}
                </label>
                <div className="custom-badge-group mb-2">
                    <button 
                        type="button"
                        onClick={() => setNewMessage({ ...newMessage, targetType: 'all', targetIds: [] })}
                        className={`badge-item ${newMessage.targetType === 'all' ? 'active' : ''}`}
                    >
                        <div className="icon-circle"><Users size={12}/></div>
                        {t('all' as any) || 'Tutti'}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setNewMessage({ ...newMessage, targetType: 'user' })}
                        className={`badge-item ${newMessage.targetType === 'user' ? 'active' : ''}`}
                    >
                        <div className="icon-circle"><UserIcon size={12}/></div>
                        {t('selection' as any) || 'Selezione'}
                    </button>
                </div>

                {newMessage.targetType === 'user' && (
                    <div className="multi-select mt-2 animate-in fade-in duration-200">
                        {personnel.length === 0 ? (
                             <p className="text-muted small p-2">{t('no_workers_available' as any) || 'Nessun collaboratore disponibile'}</p>
                        ) : (
                            personnel.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => toggleWorkerSelection(p.id)}
                                    className={`worker-pill ${newMessage.targetIds.includes(p.id) ? 'active' : ''}`}
                                >
                                    {p.name}
                                    {newMessage.targetIds.includes(p.id) && <CheckCircle size={12} className="ml-1" />}
                                </button>
                            ))
                        )}
                    </div>
                )}
              </div>

              {/* Reference Project */}
              <div className="mb-4">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight mb-2 d-block">
                  {t('reference' as any) || 'Referenza'}
                </label>
                <select 
                  className="form-select-custom w-100"
                  value={newMessage.projectId}
                  onChange={(e) => setNewMessage({ ...newMessage, projectId: e.target.value })}
                >
                  <option value="">{t('internal_communication' as any) || 'Comunicazione Interna'}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Message Type */}
              <div className="mb-4">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight mb-2 d-block">
                  {t('type' as any) || 'Tipo'}
                </label>
                <div className="type-selector">
                    <button 
                        type="button" 
                        onClick={() => setNewMessage({ ...newMessage, type: 'note' })}
                        className={`type-btn ${newMessage.type === 'note' ? 'active' : ''}`}
                    >
                        <Info size={18} />
                        <span>{t('note' as any) || 'Nota'}</span>
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setNewMessage({ ...newMessage, type: 'alert' })}
                        className={`type-btn ${newMessage.type === 'alert' ? 'active' : ''}`}
                    >
                        <AlertCircle size={18} />
                        <span>{t('alert' as any) || 'Segnalazione'}</span>
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setNewMessage({ ...newMessage, type: 'success' })}
                        className={`type-btn ${newMessage.type === 'success' ? 'active' : ''}`}
                    >
                        <CheckCircle2 size={18} />
                        <span>{t('confirmation' as any) || 'Conferma'}</span>
                    </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="mb-4">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight mb-2 d-block">
                  {t('message' as any) || 'Messaggio'}
                </label>
                <textarea
                  className="custom-textarea"
                  placeholder={t('writeMessage' as any) || 'Scrivi un messaggio...'}
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSending || !newMessage.content.trim()}
                className="btn-send w-100"
              >
                {isSending ? (
                  <div className="spinner-border spinner-border-sm mr-2" role="status"></div>
                ) : (
                  <Send size={18} className="mr-2" />
                )}
                {t('send' as any) || 'Invia'}
              </button>
            </form>
          </div>
        </div>

        {/* Results Panel - Feed */}
        <div className="col-12 col-lg-7 order-1 order-lg-2">
          <div className="custom-card shadow-sm border-0 h-100 p-0 overflow-hidden" style={{ backgroundColor: '#fff', borderRadius: '16px' }}>
            <div className="p-4 border-bottom">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h2 className="h4 fw-bold m-0">{t('internal_communications' as any) || 'Comunicazioni'}</h2>
                    {/* Compact Filter Button (Point 3) */}
                    <div className="d-flex gap-2">
                        <button 
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                            title="Tutti"
                        >
                            <Filter size={18} />
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'user' ? 'active' : ''}`}
                            onClick={() => setFilter('user')}
                            title="Personali"
                        >
                            <UserIcon size={18} />
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'project' ? 'active' : ''}`}
                            onClick={() => setFilter('project')}
                            title="Progetti"
                        >
                            <Briefcase size={18} />
                        </button>
                    </div>
                </div>
                <div className="p-relative">
                    <Search className="position-absolute translate-middle-y text-muted" style={{ top: '50%', left: '12px' }} size={16} />
                    <input 
                        type="text" 
                        placeholder={t('search' as any) || 'Cerca...'}
                        className="form-control-custom w-100 ps-5"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px', height: '42px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                    />
                </div>
            </div>

            <div className="card-body p-0 pt-2 h-100 w-100 d-flex flex-column" id="results-card-body">
                <div className="p-relative h-100 w-100 scroll-wrapper" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                    <div id="results" className="p-0">
                        {
                            filteredComms.length > 0 ? (
                                filteredComms.map((i, index) => (
                                    <HistoryItem
                                        key={i.id}
                                        icon={i.type === 'note' ? (
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                                <Info size={18} />
                                            </div>
                                        ) : i.type === 'alert' ? (
                                            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                                                <AlertCircle size={18} />
                                            </div>
                                        ) : (
                                            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                                <CheckCircle2 size={18} />
                                            </div>
                                        )}
                                        title={i.senderName}
                                        subtitle={i.content}
                                        date={new Date(i.createdAt).toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB')}
                                        statusBadge={
                                            <div className="d-flex gap-1">
                                                {i.projectId && (
                                                    <span className="status-badge">
                                                        <Briefcase size={10} /> {i.projectId.substring(0, 8)}...
                                                    </span>
                                                )}
                                                <span className={`status-badge ${i.isRead ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {i.isRead ? <CheckCircle size={10} /> : <CheckCircle2 size={10} />}
                                                    {i.isRead ? t('read') : t('sent')}
                                                </span>
                                            </div>
                                        }
                                    />
                                ))
                            ) : (
                                <div className="text-center py-5">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Mail className="text-slate-300" size={32} />
                                    </div>
                                    <p className="text-slate-400 font-medium">{t('no_internal_communications')}</p>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-card {
            border: none;
            border-radius: 16px;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }

        .custom-badge-group {
            display: flex;
            background: #f8fafc;
            padding: 4px;
            border-radius: 12px;
            gap: 4px;
            border: 1px solid #f1f5f9;
        }

        .badge-item {
            flex: 1;
            padding: 10px 12px;
            border-radius: 8px;
            border: none;
            background: transparent;
            color: #64748b;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .badge-item:hover:not(.active) {
            background: rgba(0, 0, 0, 0.02);
            color: #1e293b;
        }

        .badge-item.active {
            background: white;
            color: #2563eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .badge-item.active .icon-circle {
            background: #2563eb;
            color: white;
        }

        .icon-circle {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .multi-select {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            max-height: 180px;
            overflow-y: auto;
        }

        .worker-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            color: #64748b;
        }

        .worker-pill:hover {
            border-color: #2563eb;
            color: #2563eb;
        }

        .worker-pill.active {
            background: #eff6ff;
            border-color: #2563eb;
            color: #2563eb;
        }

        .type-selector {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }

        .type-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: white;
            gap: 8px;
            transition: all 0.2s;
            color: #64748b;
        }

        .type-btn:hover {
            border-color: #cbd5e1;
            background: #f8fafc;
        }

        .type-btn.active {
            border-color: #2563eb;
            background: #eff6ff;
            color: #2563eb;
        }

        .custom-textarea {
            width: 100%;
            padding: 14px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            min-height: 120px;
            resize: none;
            transition: all 0.2s;
            font-size: 14px;
            background: #f8fafc;
        }

        .custom-textarea:focus {
            outline: none;
            border-color: #2563eb;
            background: white;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.05);
        }

        .form-select-custom {
            width: 100%;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .form-select-custom:focus {
            outline: none;
            border-color: #2563eb;
            background: white;
        }

        .btn-send {
            width: 100%;
            padding: 14px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(37,99,235,0.25);
        }

        .btn-send:hover {
            background: #1d4ed8;
            transform: translateY(-1px);
            box-shadow: 0 10px 15px -3px rgba(37,99,235,0.3);
        }

        .btn-send:active {
            transform: translateY(0);
        }

        .btn-send:disabled {
            background: #cbd5e1;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .filter-btn {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px;
            border-radius: 10px;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .filter-btn:hover {
            background: #f1f5f9;
            color: #1e293b;
        }

        .filter-btn.active {
            background: #eff6ff;
            border-color: #2563eb;
            color: #2563eb;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            background: #f1f5f9;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }

        .hover-bg-light:hover {
            background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
};

export default CommunicationsHub;
