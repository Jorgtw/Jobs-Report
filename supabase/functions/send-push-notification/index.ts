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
    const { record } = await req.json();
    if (!record) throw new Error('No record found in payload');

    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Generazione token fresco
    const accessToken = await getAccessToken(serviceAccount);

    // Recupero sottoscrizioni attive
    const { data: subs, error: subError } = await supabase
      .from('user_push_subscriptions')
      .select('fcm_token')
      .eq('is_active', true);

    if (subError) throw subError;
    if (!subs?.length) return new Response(JSON.stringify({ message: 'No recipients found' }), { headers: { "Content-Type": "application/json" } });

    // Invio notifiche con Retry Strategy
    const results = await Promise.all(subs.map(async (s) => {
      const send = async (attempt = 0): Promise<boolean> => {
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
                title: record.title || "Nuovo messaggio", 
                body: "Hai ricevuto una nuova comunicazione interna." 
              },
              webpush: { 
                fcm_options: { link: "https://jobs-report.vercel.app/#/communications" } 
              }
            }
          })
        });
        
        if (!res.ok && attempt < FETCH_RETRY_COUNT) {
          console.warn(`Retry attempt ${attempt + 1} for token ${s.fcm_token.substring(0, 10)}...`);
          return send(attempt + 1);
        }
        return res.ok;
      };
      return send();
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      sent: results.filter(r => r).length,
      total: results.length 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error('[PUSH ERROR]', err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
});
