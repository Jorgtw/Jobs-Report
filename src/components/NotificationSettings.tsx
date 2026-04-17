import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { User } from '../types';

interface NotificationSettingsProps {
  user: User;
  t: (key: any) => string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ user, t }) => {
  const { isSupported } = usePushNotifications(user);
  
  // Initialize state from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('push_notifications_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('push_notifications_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  if (!isSupported) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between p-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t('communications.push_sound' as any)}</p>
              <p className="text-[10px] text-slate-400 font-medium">{t('communications.push_sound_desc' as any)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
