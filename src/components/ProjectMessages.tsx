import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { db } from '../services/dbService';
import { User, InternalCommunication, MessageType } from '../types';
import { translations } from '../translations';

interface ProjectMessagesProps {
  projectId: string;
  user: User;
  lang?: any;
}

const ProjectMessages: React.FC<ProjectMessagesProps> = ({ projectId, user, lang = 'it' }) => {
  const t = (key: string): string => {
    const currentTranslations = (translations as any)[lang] || translations['it'];
    return currentTranslations[key] || (translations['it'] as any)[key] || key;
  };

  const [messages, setMessages] = useState<InternalCommunication[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [msgType, setMsgType] = useState<MessageType>('note');
  const [loading, setLoading] = useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const data = await db.getCommunications({ projectId });
      setMessages(data.reverse()); // Reverse because db returns DESC and we want flow
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await db.sendCommunication({
        content: newMessage,
        type: msgType,
        targetType: 'project',
        targetIds: [projectId]
      });
      setNewMessage('');
      loadMessages();
    } catch (err) {
      alert(t('saveError') + JSON.stringify(err));
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
      {/* Messages List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8 text-slate-400 text-xs animate-pulse font-bold">{t('sending')}</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-60">
            <Mail size={32} />
            <p className="text-sm font-medium">{t('noMessages')}</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === user.id;
            const date = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const day = new Date(m.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' });

            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{m.senderName || 'Utente'}</span>
                  <span className="text-[9px] text-slate-300 font-bold">{day} {date}</span>
                </div>
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm relative group ${
                  isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {m.type !== 'note' && (
                    <div className={`text-[9px] font-black uppercase mb-1 px-1.5 py-0.5 rounded inline-block ${
                      m.type === 'issue' ? (isMe ? 'bg-blue-500 text-white' : 'bg-red-50 text-red-600') : (isMe ? 'bg-blue-500 text-white' : 'bg-emerald-50 text-emerald-600')
                    }`}>
                      {t(`type${m.type.charAt(0).toUpperCase() + m.type.slice(1)}`)}
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 space-y-3">
        <div className="flex gap-2">
          {['note', 'issue', 'confirmation'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMsgType(type as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border ${
                msgType === type 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t(`type${type.charAt(0).toUpperCase() + type.slice(1)}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('writeMessage')}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Mail size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectMessages;
