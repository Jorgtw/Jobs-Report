import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { requestForToken } from '../services/firebase';

export const usePushNotifications = (user: User | null) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && permission === 'granted') {
      checkSubscriptionAndRefresh();
    }

    const handleStatusChange = () => {
      // Sincronizziamo sia il permesso browser che lo stato DB
      const currentPermission = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
      setPermission(prev => {
        if (prev !== currentPermission) return currentPermission;
        return prev;
      });
      
      if (user && currentPermission === 'granted') {
        checkSubscriptionAndRefresh();
      } else {
        setIsSubscribed(false);
      }
    };

    window.addEventListener('push-subscription-change', handleStatusChange);
    return () => {
      window.removeEventListener('push-subscription-change', handleStatusChange);
    };
  }, [user, permission]);

  const checkSubscriptionAndRefresh = async () => {
    if (!user) return;
    
    try {
      const { data: subs, error } = await supabase
        .from('user_push_subscriptions')
        .select('id, updated_at')
        .eq('worker_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      
      const sub = subs && subs.length > 0 ? subs[0] : null;
      setIsSubscribed(!!sub);

      // Se il token non viene aggiornato da più di 7 giorni, lo aggiorniamo
      if (sub) {
        const lastUpdate = new Date(sub.updated_at).getTime();
        const now = new Date().getTime();
        const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate > 7) {
          await subscribeUser();
        }
      }
    } catch (error) {
      console.error("[PUSH] Errore verifica sottoscrizione:", error);
      setIsSubscribed(false);
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
      console.error("[PUSH] Errore richiesta permessi:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const subscribeUser = async () => {
    if (!user) return;

    try {
      let swRegistration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        if (swRegistration.waiting) {
          swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const token = await requestForToken(swRegistration);

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

        if (!error) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('push-subscription-change'));
            setIsSubscribed(true);
          }, 500);
        }
      }
    } catch (error: any) {
      console.error("[PUSH] Errore sottoscrizione:", error);
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

      if (!error) {
        // Notifichiamo il cambiamento a tutte le altre istanze dell'hook
        window.dispatchEvent(new CustomEvent('push-subscription-change'));
        setIsSubscribed(false);
      }
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
