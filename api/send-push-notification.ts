import { createClient } from '@supabase/supabase-js';

// Helper per ottenere l'access token di Google (necessario per FCM HTTP v1)
// In produzione, si consiglia di usare 'firebase-admin' o una libreria di gestione token JWT.
// Per semplicità e leggerezza in una Vercel Function, useremo fetch verso l'API FCM.
// RICHIESTO: FIREBASE_SERVICE_ACCOUNT_JSON nelle variabili d'ambiente.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // 1. SICUREZZA: Verifica Shared Secret
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  const receivedSecret = req.headers['x-webhook-secret'] || req.headers['X-Webhook-Secret'];

  if (!webhookSecret || receivedSecret !== webhookSecret) {
    console.error('[PUSH] Accesso non autorizzato.');
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const payload = req.body;
  const { record, type, table } = payload;

  // 2. Validazione trigger
  if (type !== 'INSERT' || table !== 'internal_communications') {
    return res.status(200).json({ message: 'Evento ignorato' });
  }

  const { id: communicationId, title, sender_id, target_type, target_id, company_id } = record;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Credenziali Supabase mancanti' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 2. Risoluzione Destinatari (Worker IDs)
    let recipientIds: string[] = [];

    if (target_type === 'all') {
      const { data } = await supabase.from('workers').select('id').eq('company_id', company_id).eq('status', 'active');
      recipientIds = data?.map(w => w.id) || [];
    } else if (target_type === 'role') {
      const { data } = await supabase.from('workers').select('id').eq('company_id', company_id).eq('role', target_id).eq('status', 'active');
      recipientIds = data?.map(w => w.id) || [];
    } else if (target_type === 'user') {
      recipientIds = [target_id];
    } else if (target_type === 'project') {
      const { data } = await supabase.from('projects').select('assigned_worker_ids').eq('id', target_id).single();
      recipientIds = data?.assigned_worker_ids || [];
    }

    // Rimuoviamo il mittente dai destinatari per evitare l'auto-notifica
    recipientIds = recipientIds.filter(id => id !== sender_id);

    if (recipientIds.length === 0) {
      return res.status(200).json({ message: 'Nessun destinatario trovato' });
    }

    // 3. Recupero Token FCM per i destinatari
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_push_subscriptions')
      .select('worker_id, fcm_token')
      .in('worker_id', recipientIds)
      .eq('is_active', true);

    if (subsError || !subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'Nessun token push trovato per i destinatari' });
    }

    // 4. Invio Notifiche (Deduplicato per token)
    const results = [];
    const fcmServerKey = process.env.FCM_SERVER_KEY; // Nota: FCM HTTP v1 richiede OAuth2, qui usiamo legacy o v1 semplificata per l'esempio

    for (const sub of subscriptions) {
      // Controllo deduplica nel log
      const { data: existingLog } = await supabase
        .from('push_notifications_log')
        .select('id')
        .eq('communication_id', communicationId)
        .eq('worker_id', sub.worker_id)
        .maybeSingle();

      if (existingLog) {
        results.push({ worker_id: sub.worker_id, status: 'already_sent' });
        continue;
      }

      // Preparazione invio a Firebase (Esempio via REST)
      // Per un'implementazione reale, usate l'SDK di Firebase Admin per gestire i token OAuth2
      try {
        const fcmResponse = await fetch(`https://fcm.googleapis.com/fcm/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${fcmServerKey}`,
          },
          body: JSON.stringify({
            to: sub.fcm_token,
            notification: {
              title: `Nuovo messaggio: ${title}`,
              body: "Hai ricevuto una nuova comunicazione interna.",
              icon: "/icon-192x192.png",
              click_action: "/communications"
            },
            data: {
              communicationId: communicationId,
              type: 'internal_communication'
            }
          }),
        });

        if (fcmResponse.ok) {
          await supabase.from('push_notifications_log').insert({
            communication_id: communicationId,
            worker_id: sub.worker_id,
            status: 'sent'
          });
          results.push({ worker_id: sub.worker_id, status: 'sent' });
        } else {
          const errText = await fcmResponse.text();
          
          // PULIZIA AUTOMATICA TOKEN INVALIDI (Hardening)
          if (errText.includes('NotRegistered') || errText.includes('InvalidRegistration')) {
            console.log(`[PUSH] Rilevato token invalido per worker ${sub.worker_id}. Rimozione...`);
            await supabase
              .from('user_push_subscriptions')
              .delete()
              .eq('fcm_token', sub.fcm_token);
          }

          await supabase.from('push_notifications_log').insert({
            communication_id: communicationId,
            worker_id: sub.worker_id,
            status: 'failed',
            error_message: errText
          });
          results.push({ worker_id: sub.worker_id, status: 'failed', error: errText });
        }
      } catch (err: any) {
        results.push({ worker_id: sub.worker_id, status: 'error', error: err.message });
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (error: any) {
    console.error('[PUSH] Errore critico:', error);
    return res.status(500).json({ error: error.message });
  }
}
