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

    const handleStatusChange = () => {
      // Sincronizziamo sia il permesso browser che lo stato DB
      const currentPermission = Notification.permission;
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
      console.log("[PUSH] Richiesta permesso al browser...");
      const result = await Notification.requestPermission();
      console.log("[PUSH] Risultato permesso:", result);
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
    console.log("[PUSH] Avvio procedura di sottoscrizione...");

    try {
      // 1. Registrazione e Attivazione Service Worker
      let swRegistration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        console.log("[PUSH] Registrazione Service Worker in corso...");
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        console.log("[PUSH] Attesa Service Worker ready...");
        await navigator.serviceWorker.ready;

        if (swRegistration.waiting) {
          console.log("[PUSH] Nuovo worker in attesa, forzo skipWaiting...");
          swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log("[PUSH] Service Worker pronto e attivo");
      }

      // 2. Ottenimento token reale da Firebase
      console.log("[PUSH] Richiesta token a Firebase...");
      const token = await requestForToken(swRegistration);

      if (token) {
        console.log("[PUSH] Token ottenuto con successo, invio al DB...");
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
          console.log("[PUSH] Sottoscrizione salvata nel DB correttamente");
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('push-subscription-change'));
            setIsSubscribed(true);
          }, 300);
        } else {
          console.error("[PUSH] Errore salvataggio DB:", error);
        }
      } else {
        console.warn("[PUSH] Nessun token ricevuto da Firebase. Controlla VAPID KEY e configurazione.");
      }
    } catch (error) {
      console.error("[PUSH] Errore critico durante la sottoscrizione:", error);
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
