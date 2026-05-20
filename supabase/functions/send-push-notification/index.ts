import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const FETCH_RETRY_COUNT = 2;

/**
 * Genera un token di accesso OAuth2 per Firebase usando la Web Crypto API nativa di Deno.
 * Non richiede librerie esterne.
 */
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
  const key = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${payload}`));
  
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${header}.${payload}.${base64url(signature)}`
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(`OAuth Error: ${JSON.stringify(data)}`);
  return data.access_token;
}

serve(async (req) => {
  // Gestione CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })

  try {
    const { record, type, table } = await req.json();
    
    // Validazione trigger
    if (!record) throw new Error('No record found in payload');
    if (type !== 'INSERT' || table !== 'internal_communications') {
      return new Response(JSON.stringify({ message: 'Evento ignorato' }), { headers: { "Content-Type": "application/json" } });
    }

    const { id: communicationId, content, sender_id, target_type, target_id, company_id, sender_name_snap } = record;

    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // --- SSOT RECIPIENT SELECTION ---
    // 1. Get all authorized auth_ids for this company from user_companies
    let authQuery = supabase.from('user_companies').select('auth_id').eq('company_id', company_id);
    if (target_type === 'role') authQuery = authQuery.eq('role', target_id);
    
    const { data: authorizedUsers, error: authErr } = await authQuery;
    if (authErr) throw authErr;
    if (!authorizedUsers || authorizedUsers.length === 0) {
      return new Response(JSON.stringify({ message: 'Nessun destinatario autorizzato nella compagnia' }), { headers: { "Content-Type": "application/json" } });
    }

    const authIds = authorizedUsers.map(u => u.auth_id);

    // 2. Resolve Worker IDs from Auth IDs
    const { data: workerMap, error: workerErr } = await supabase
      .from('workers')
      .select('id')
      .in('auth_id', authIds)
      .eq('status', 'active');
    
    if (workerErr) throw workerErr;
    if (!workerMap || workerMap.length === 0) {
      return new Response(JSON.stringify({ message: 'Nessun destinatario attivo trovato' }), { headers: { "Content-Type": "application/json" } });
    }

    const recipientIds = workerMap.map(w => w.id).filter(id => id !== sender_id);
    if (recipientIds.length === 0) {
      return new Response(JSON.stringify({ message: 'Nessun destinatario attivo oltre al mittente' }), { headers: { "Content-Type": "application/json" } });
    }

    // 3. Fetch Push Tokens (SSOT)
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_push_subscriptions')
      .select('worker_id, fcm_token')
      .in('worker_id', recipientIds)
      .eq('is_active', true);

    if (subsError) throw subsError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'Nessun token push attivo per i destinatari' }), { headers: { "Content-Type": "application/json" } });
    }

    // Generazione token fresco
    const accessToken = await getAccessToken(serviceAccount);

    // Costruisci il titolo e il corpo notifica in modo dinamico
    const notificationTitle = sender_name_snap ? `Messaggio da ${sender_name_snap.trim()}` : "Nuova comunicazione";
    const notificationBody = content ? (content.length > 100 ? content.substring(0, 100) + '...' : content) : "Hai ricevuto una nuova comunicazione interna.";

    // 4. Invio notifiche con Retry Strategy e Log Deduplicati
    const results = await Promise.all(subscriptions.map(async (s) => {
      // Controllo deduplica nel log
      const { data: existingLog } = await supabase
        .from('push_notifications_log')
        .select('id')
        .eq('communication_id', communicationId)
        .eq('worker_id', s.worker_id)
        .maybeSingle();

      if (existingLog) {
        return { worker_id: s.worker_id, status: 'already_sent' };
      }

      const send = async (attempt = 0): Promise<{ success: boolean; errorText?: string }> => {
        try {
          const res = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${accessToken}`, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
              message: {
                token: s.fcm_token,
                notification: { 
                  title: notificationTitle, 
                  body: notificationBody 
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
            })
          });
          
          if (!res.ok) {
            const errText = await res.text();
            if (attempt < FETCH_RETRY_COUNT) {
              console.warn(`Retry attempt ${attempt + 1} for token ${s.fcm_token.substring(0, 10)}: ${errText}`);
              return send(attempt + 1);
            }
            return { success: false, errorText: errText };
          }
          return { success: true };
        } catch (e) {
          if (attempt < FETCH_RETRY_COUNT) {
            return send(attempt + 1);
          }
          return { success: false, errorText: e.message };
        }
      };

      const outcome = await send();

      if (outcome.success) {
        await supabase.from('push_notifications_log').insert({
          communication_id: communicationId,
          worker_id: s.worker_id,
          status: 'sent'
        });
        return { worker_id: s.worker_id, status: 'sent' };
      } else {
        const errorMsg = outcome.errorText || 'Errore sconosciuto';
        
        // Pulizia token invalidati o non registrati (Hardening)
        if (errorMsg.includes('UNREGISTERED') || errorMsg.includes('NotRegistered') || errorMsg.includes('senderId mismatch')) {
          console.log(`[PUSH] Token non valido rilevato per worker ${s.worker_id}. Rimozione in corso...`);
          await supabase
            .from('user_push_subscriptions')
            .delete()
            .eq('fcm_token', s.fcm_token);
        }

        await supabase.from('push_notifications_log').insert({
          communication_id: communicationId,
          worker_id: s.worker_id,
          status: 'failed',
          error_message: errorMsg
        });
        return { worker_id: s.worker_id, status: 'failed', error: errorMsg };
      }
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      sent: results.filter(r => r.status === 'sent').length,
      total: results.length,
      details: results
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error('[PUSH ERROR]', err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
});
