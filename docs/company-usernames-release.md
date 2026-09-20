# Account separati per azienda con email condivisa

## Comportamento

- Nuovi account: nome utente obbligatorio, unico senza distinzione maiuscole/minuscole (3–64 caratteri ASCII: lettere, cifre, punto, trattino, underscore).
- Email di contatto riutilizzabile tra aziende. Ogni account ha una propria identità Supabase e password indipendente.
- Login tramite nome utente. Gli account preesistenti mantengono nome utente, password e auth_id; gli username preesistenti che coincidono con un indirizzo email restano validi.
- Nessuna ricerca o riconnessione automatica di identità tramite email. Un account non viene spostato in un’altra azienda.
- Recupero password: si indica il nome utente; risposta generica, limite persistente 3 richieste per account / 15 minuti e 20 per IP / 15 minuti. Il link è generato per l’identità selezionata e inviato all’email di contatto tramite Resend.
- Eliminazione azienda: disponibile al superadmin; elimina dati e associazioni della sola azienda e mette le relative identità in una coda di cancellazione. La API cancella gli account Supabase e svuota la coda.
- Eliminazione dipendente: conserva il record storico e i rapportini, rimuove nome utente, email, accesso, ruoli e sottoscrizioni push. Il personale eliminato non compare nell’elenco di gestione.
- Account protetti o identità legacy condivise tra aziende: l’operazione si interrompe senza eliminare dati.

## Implementazione

I nuovi indirizzi Auth sono UUID interni sul dominio riservato `accounts.jobs-report.invalid`; non ricevono email. Il contatto resta in `workers.email`. `get_email_by_username` risolve l’identità Auth del singolo record. Il trigger di bootstrap distingue i nuovi account tramite `app_metadata` impostati esclusivamente dal server e non li collega per email.

Il recupero usa [Supabase generateLink](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) e un provider email separato. L’eliminazione delle credenziali usa [Supabase deleteUser](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser). Il distacco dei dati operativi e delle appartenenze precede la cancellazione Auth, in un’unica transazione PostgreSQL.

## Verifiche eseguite

- TypeScript frontend e API: superati.
- Compilazione completa: superata; avvisi preesistenti di traduzione e dimensione bundle.
- `scripts/test-quick-registration.ts`: validazione username, contatto condiviso con identità distinte, nessuna password nelle email, rollback degli errori simulati.
- `scripts/test-quick-login.ts`: username tradizionali ed email usate come username legacy, credenziali errate, account sconosciuti.
- `scripts/test-company-accounts.ts`: handler reali con rete simulata; creazione, conflitti, recupero mirato, limiti, isolamento aziendale, account protetti e cancellazione autorizzata.
- `scripts/test-company-accounts-db.mjs`: PostgreSQL locale PGlite, schema di prova basato sui vincoli letti dal database; unicità normalizzata, guardie anche con ruoli/aziende NULL, cancellazione dipendente e azienda, conservazione rapportini, riutilizzo username, limiti, permessi RPC e ripetibilità della migrazione.
- Browser locale: nuovo modulo italiano, validazione username e recupero che richiede il nome utente.
- Produzione, sola lettura: nessun username normalizzato duplicato e nessuna identità associata a più aziende al momento del controllo.

Per ripetere il test SQL locale, installare `@electric-sql/pglite` in una cartella di test esterna al pacchetto applicativo e impostare `PGLITE_MODULE` sul suo `dist/index.js`, quindi eseguire `node scripts/test-company-accounts-db.mjs` dalla radice del progetto. La fixture è minimale: non sostituisce una verifica di integrazione sull’intero schema Supabase.

## Stato e ordine di rilascio

La modifica NON è attiva online. Nessuna migrazione o prova di scrittura è stata eseguita in produzione. La revisione automatica ha rifiutato l’esecuzione della migrazione/prova sul database live senza un’autorizzazione esplicita; richiedere tale autorizzazione prima del rilascio.

1. Conservare la versione corrente delle funzioni `handle_new_user_bootstrap` e `get_email_by_username` come riferimento di rollback.
2. Applicare `supabase_migration_company_usernames.sql`: aggiunge indice, colonna storica, tabelle private e funzioni; non modifica le password o i dati degli account esistenti. Il blocco è transazionale e fallisce in presenza di username in conflitto.
3. Pubblicare frontend e API insieme. Verificare `RESEND_API_KEY` e il mittente già usato `no-reply@jobs-report.app`; controllare che `https://app.jobs-report.app/` sia tra i redirect consentiti da Supabase.
4. Eseguire una prova concordata con account temporanei: due aziende con la stessa email, password distinte, recupero di una sola, cancellazione di una e accesso all’altra. Non inviare email a utenti reali come test.
5. Controllare `account_deletion_queue`: un errore temporaneo di Auth lascia la pulizia in coda e la API restituisce `ACCOUNT_CLEANUP_PENDING`; ripetere la richiesta con lo stesso identificativo e richiedente. Non cancellare account per sola corrispondenza dell’email.

Non ripristinare la vecchia funzione di lookup dopo aver creato account con indirizzi Auth interni: non riuscirebbero più ad accedere. In caso di problemi mantenere il nuovo lookup e correggere il rilascio, oppure preparare una migrazione inversa specifica. Non cancellare in blocco identità legacy orfane (inclusa Silla): con i nuovi account l’email di contatto è già riutilizzabile.
