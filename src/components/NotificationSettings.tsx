import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Bell, BellOff, RefreshCw } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { User } from '../types';
import { audioService } from '../services/audioService';

interface NotificationSettingsProps {
  user: User;
  t: (key: any) => string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ user, t }) => {
  const { isSupported, isSubscribed, permission, requestPermission, unsubscribeUser, loading } = usePushNotifications(user);
  
  // Initialize state from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('app_notification_audio');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('app_notification_audio', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const handleTestSound = () => {
    audioService.play();
  };

  if (!isSupported) return null;

  return (
    <div className="space-y-4">
      {/* Card 1: Push Notifications (Telefono/Browser) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between p-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {isSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t('communications.push_notifications' as any)}</p>
              <p className="text-[10px] text-slate-400 font-medium">
                {isSubscribed 
                  ? t('communications.push_status_active' as any)
                  : (permission === 'denied' 
                      ? t('communications.push_status_blocked' as any) 
                      : t('communications.push_banner_desc' as any))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => isSubscribed ? unsubscribeUser() : requestPermission()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSubscribed 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {loading && <RefreshCw size={12} className="animate-spin" />}
              <span>{isSubscribed ? t('communications.push_deactivate' as any) : t('communications.push_activate' as any)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Suono Notifiche (Suoneria) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between p-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t('communications.push_sound' as any)}</p>
              <p className="text-[10px] text-slate-400 font-medium">{t('communications.push_sound_desc' as any)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {soundEnabled && (
              <button
                type="button"
                onClick={handleTestSound}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors mr-2"
                title={t('communications.testSoundTitle' as any)}
              >
                <Play size={12} />
                <span>{t('communications.testSound' as any)}</span>
              </button>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-6 rounded-full p-1 transition-all duration-200 ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
