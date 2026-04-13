import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Mail, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useTranslation } from '../contexts/LanguageContext';

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender?: {
    name: string;
    role: string;
  };
}

interface ProjectMessagesProps {
  projectId: string;
  user: any;
}

const ProjectMessages: React.FC<ProjectMessagesProps> = ({ projectId, user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel(`project_messages:${projectId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'project_messages',
        filter: `project_id=eq.${projectId}`
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('project_messages')
        .select(`
          *,
          sender:profiles!sender_id (
            name,
            role
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('project_messages')
        .insert([
          {
            project_id: projectId,
            sender_id: user.id,
            content: newMessage.trim(),
            sender_name: user.name
          }
        ]);

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert(t('projects.errorSendingMessage'));
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm(t('projects.confirmDeleteMessage'))) return;
    
    try {
      const { error } = await supabase
        .from('project_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t('projects.projectMessagesTitle')}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{messages.length} {t('projects.messagesCount')}</p>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 opacity-60">
            <Mail size={32} strokeWidth={1.5} />
            <p className="text-xs font-bold uppercase tracking-widest">{t('projects.noMessages')}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.sender_id === user?.id 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-tight ${
                    msg.sender_id === user?.id ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    {msg.sender?.name || msg.sender_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold ${
                      msg.sender_id === user?.id ? 'text-blue-200/80' : 'text-slate-300'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {(user?.role === 'admin' || msg.sender_id === user?.id) && (
                      <button 
                        onClick={() => deleteMessage(msg.id)}
                        className={`hover:opacity-100 opacity-40 transition-opacity ${
                          msg.sender_id === user?.id ? 'text-white' : 'text-red-500'
                        }`}
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-200">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('projects.typeMessagePlaceholder')}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={20} className={sending ? 'animate-pulse' : ''} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectMessages;
