import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { requestForToken } from '../services/firebase';

export const usePushNotifications = (user: User | null) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && permission === 'granted') {
      checkSubscriptionAndRefresh();
    }
  }, [user, permission]);

  const checkSubscriptionAndRefresh = async () => {
    if (!user) return;
    
    const { data: sub } = await supabase
      .from('user_push_subscriptions')
      .select('id, updated_at')
      .eq('worker_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
      
    setIsSubscribed(!!sub);

    // Se il token non viene aggiornato da più di 7 giorni, lo aggiorniamo
    if (sub) {
      const lastUpdate = new Date(sub.updated_at).getTime();
      const now = new Date().getTime();
      const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 7) {
        console.log("[PUSH] Il token è datato, avvio refresh...");
        await subscribeUser();
      }
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn("Questo browser non supporta le notifiche push.");
      return false;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeUser();
      }
      return result === 'granted';
    } catch (error) {
      console.error("Errore nella richiesta permessi:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const subscribeUser = async () => {
    if (!user) return;

    try {
      // Ottenimento token reale da Firebase
      const token = await requestForToken();

      if (token) {
        const { error } = await supabase
          .from('user_push_subscriptions')
          .upsert({
            worker_id: user.id,
            fcm_token: token,
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language
            },
            is_active: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'worker_id, fcm_token' });

        if (!error) setIsSubscribed(true);
      } else {
        console.warn("[PUSH] Impossibile ottenere il token. Verifica config Firebase.");
      }
    } catch (error) {
      console.error("Errore durante la sottoscrizione push:", error);
    }
  };

  const unsubscribeUser = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .update({ is_active: false })
        .eq('worker_id', user.id);

      if (!error) setIsSubscribed(false);
    } catch (error) {
      console.error("Errore durante la disiscrizione:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    isSubscribed,
    loading,
    requestPermission,
    unsubscribeUser,
    isSupported: typeof window !== 'undefined' && 'Notification' in window
  };
};
