import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Volume2, VolumeX, Square } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Handle Speech Cleanup
  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
    };
  }, [synth]);

  const speak = (text: string) => {
    if (!isSpeakingEnabled || !synth) return;
    
    synth.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Auto-detect language (simple guess or fallback to IT)
    utterance.lang = 'it-IT'; 
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsCurrentlySpeaking(true);
    utterance.onend = () => setIsCurrentlySpeaking(false);
    utterance.onerror = () => setIsCurrentlySpeaking(false);

    synth.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synth) {
      synth.cancel();
      setIsCurrentlySpeaking(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages, // Send existing history
        }),
      });

      const data = await response.json();
      if (data.text) {
        setMessages([...newMessages, { role: 'model', parts: [{ text: data.text }] }]);
        if (isSpeakingEnabled) {
          speak(data.text);
        }
      } else if (data.error) {
        setMessages([...newMessages, { role: 'model', parts: [{ text: "Mi dispiace, si è verificato un errore: " + data.error }] }]);
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'model', parts: [{ text: "Errore di connessione con l'assistente AI." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
          {/* Header */}
          <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight">Assistente Jobs Report</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manuale Parlante</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  if (isCurrentlySpeaking) {
                    stopSpeaking();
                  } else {
                    setIsSpeakingEnabled(!isSpeakingEnabled);
                  }
                }}
                title={isSpeakingEnabled ? "Disattiva voce" : "Attiva voce"}
                className={`p-1.5 rounded-lg transition-colors ${isSpeakingEnabled ? 'text-blue-400 hover:bg-white/10' : 'text-slate-500 hover:bg-white/10'}`}
              >
                {isCurrentlySpeaking ? <Square size={16} fill="currentColor" /> : (isSpeakingEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />)}
              </button>
              <button 
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4"
          >
            {messages.length === 0 && (
              <div className="text-center py-10 opacity-60">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 text-blue-500">
                  <Sparkles size={24} />
                </div>
                <p className="text-xs font-bold text-slate-500 px-10">
                  Ciao! Sono il manuale intelligente di Jobs Report. Chiedimi pure come funziona l'app!
                </p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}>
                  <div className="flex items-center gap-2 mb-1 opacity-60">
                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                      {msg.role === 'user' ? 'Tu' : 'AI Assistant'}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed font-medium">
                    {msg.parts[0].text}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 rounded-tl-none flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="text-xs font-bold text-slate-400">L'assistente sta scrivendo...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Fai una domanda sull'app..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group ${
          isOpen ? 'bg-slate-900 border-2 border-white' : 'bg-blue-600 hover:scale-110 active:scale-95'
        }`}
      >
        {isOpen ? (
          <X className="text-white" size={24} />
        ) : (
          <div className="relative">
            <MessageSquare className="text-white" size={28} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-bounce"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default AIChatAssistant;
