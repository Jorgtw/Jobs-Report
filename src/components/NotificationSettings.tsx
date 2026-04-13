import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, ShieldCheck, ShieldAlert, Settings2 } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { User } from '../types';

interface NotificationSettingsProps {
  user: User;
  t: (key: any) => string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ user, t }) => {
  const { 
    permission, 
    isSubscribed, 
    requestPermission, 
    unsubscribeUser, 
    isSupported,
    loading 
  } = usePushNotifications(user);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('push_notifications_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('push_notifications_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  if (!isSupported) return null;

  const getStatusInfo = () => {
    if (permission === 'denied') return { label: 'communications.push_status_blocked', color: 'text-rose-600', bg: 'bg-rose-50', icon: <ShieldAlert size={16} /> };
    if (isSubscribed) return { label: 'communications.push_status_active', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <ShieldCheck size={16} /> };
    return { label: 'communications.push_status_disabled', color: 'text-slate-400', bg: 'bg-slate-50', icon: <Settings2 size={16} /> };
  };

  const status = getStatusInfo();

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          <Bell size={20} />
        </div>
        <h2 className="text-lg font-black text-slate-900">{t('communications.push_settings_title' as any)}</h2>
      </div>

      <div className="space-y-6">
        {/* STATO SISTEMA */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${status.bg} border-transparent`}>
          <div className="flex items-center gap-3">
            <span className={status.color}>{status.icon}</span>
            <span className={`text-xs font-black uppercase tracking-widest ${status.color}`}>
              {t(status.label as any)}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Browser: {permission}
          </span>
        </div>

        {/* CONTROLLI PUSH */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('communications.push_notifications' as any)}</label>
          {isSubscribed ? (
            <button
              onClick={() => unsubscribeUser()}
              disabled={loading}
              className="w-full py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <BellOff size={16} />
              {t('communications.push_deactivate' as any)}
            </button>
          ) : (
            <button
              onClick={() => requestPermission()}
              disabled={loading || permission === 'denied'}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Bell size={18} />
              {t('communications.push_activate' as any)}
            </button>
          )}
          {permission === 'denied' && (
             <p className="text-[10px] text-center font-bold text-rose-400 uppercase tracking-widest mt-1">
               {t('communications.push_reset_hint' as any)}
             </p>
          )}
        </div>

        {/* CONTROLLO SUONO */}
        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${soundEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t('communications.push_sound' as any)}</p>
              <p className="text-[10px] text-slate-400 font-medium">{t('communications.push_sound_desc' as any)}</p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-6 rounded-full p-1 transition-all duration-200 ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

const BellOff = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default NotificationSettings;
