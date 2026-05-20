import { createClient } from '@supabase/supabase-js';
import { webcrypto } from 'crypto';

// Helper per ottenere l'access token di Google (necessario per FCM HTTP v1)
const base64url = (source: ArrayBuffer | string) => {
  const encoded = typeof source === "string" ? btoa(source) : btoa(String.fromCharCode(...new Uint8Array(source)));
  return encoded.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};

async function getAccessToken(serviceAccount: any) {
  const iat = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: iat + 3600, iat
  }));

  const pemContents = serviceAccount.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  const cryptoObj = globalThis.crypto || webcrypto;
  const key = await cryptoObj.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await cryptoObj.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${payload}`));
  
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${payload}.${base64url(signature)}`
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(`OAuth Error: ${JSON.stringify(data)}`);
  return data.access_token;
}

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

  const { id: communicationId, content, sender_id, target_type, target_id, company_id, sender_name_snap } = record;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Credenziali Supabase mancanti' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // --- SSOT RECIPIENT SELECTION ---
    // 1. Get all authorized auth_ids for this company from user_companies
    let authQuery = supabase.from('user_companies').select('auth_id').eq('company_id', company_id);
    if (target_type === 'role') authQuery = authQuery.eq('role', target_id);
    
    const { data: authorizedUsers, error: authErr } = await authQuery;
    if (authErr || !authorizedUsers) throw authErr;

    const authIds = authorizedUsers.map(u => u.auth_id);
    if (authIds.length === 0) return res.status(200).json({ message: 'Nessun destinatario autorizzato' });

    // 2. Resolve Worker IDs from Auth IDs
    const { data: workerMap, error: workerErr } = await supabase
      .from('workers')
      .select('id')
      .in('auth_id', authIds)
      .eq('status', 'active');
    
    if (workerErr || !workerMap) throw workerErr;
    const recipientIds = workerMap.map(w => w.id).filter(id => id !== sender_id);

    if (recipientIds.length === 0) return res.status(200).json({ message: 'Nessun destinatario attivo trovato' });

    // 3. Fetch Push Tokens (SSOT)
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_push_subscriptions')
      .select('worker_id, fcm_token')
      .in('worker_id', recipientIds)
      .eq('is_active', true);

    if (subsError || !subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'Nessun token push attivo per i destinatari' });
    }

    // 4. Inizializzazione Firebase Service Account da Env
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      return res.status(500).json({ error: 'Chiave del Service Account Firebase mancante' });
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Costruisci il titolo e il corpo notifica in modo dinamico
    const notificationTitle = sender_name_snap ? `Messaggio da ${sender_name_snap.trim()}` : "Nuova comunicazione";
    const notificationBody = content ? (content.length > 100 ? content.substring(0, 100) + '...' : content) : "Hai ricevuto una nuova comunicazione interna.";

    // 5. Invio Notifiche (Deduplicato per token)
    const results = [];

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

      try {
        const fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: sub.fcm_token,
              notification: {
                title: notificationTitle,
                body: notificationBody,
              },
              webpush: {
                notification: {
                  title: notificationTitle,
                  body: notificationBody,
                  icon: "/icon-192.png",
                  badge: "/icon-192.png",
                  vibrate: [200, 100, 200]
                },
                fcm_options: {
                  link: "https://jobs-report.vercel.app/#/communications"
                }
              }
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
          if (errText.includes('UNREGISTERED') || errText.includes('NotRegistered') || errText.includes('senderId mismatch')) {
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
