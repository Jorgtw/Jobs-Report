# Registrazione semplificata — progetto Vercel jobs-report

La modifica riguarda l'app `app.jobs-report.app`. Il progetto separato
`jobs-report-landing` non richiede modifiche: il collegamento esistente
`/#/richiesta-registrazione?lang=...` rimane valido.

## Comportamento

- Registrazione con nome azienda, email e password, oltre all'accettazione dei termini.
- Accesso con email; i nomi utente degli account esistenti rimangono validi.
- Lingua mantenuta nei collegamenti e dopo il ricaricamento; testi in IT/EN/ES/DA/PL/TR.
- Primo accesso con scorciatoie al rapportino interno, ai clienti e al profilo aziendale.
- Referente modificabile nel profilo personale; indirizzo, città e paese nei dati aziendali.
- Partita IVA facoltativa: l'amministratore può inserirla se mancante, senza poter
  sovrascrivere quella già salvata. La funzione database controlla anche l'azienda autorizzata.
- Se l'accesso automatico fallisce dopo la creazione, si riprova soltanto l'accesso.
- Un'email già esistente non viene collegata alla nuova azienda e la sua password non viene modificata.
- Nessuna password nelle email di benvenuto.

## Ordine di rilascio

1. Applicare `supabase_migration_quick_registration.sql` al database dell'app.
   Richiede la funzione già esistente `update_company_details_v1` e i controlli
   `is_admin_of_company` / `is_super_admin`. Non modifica colonne o dati esistenti.
2. Pubblicare frontend e `/api/self-register` insieme nel progetto **jobs-report**.
   Il nuovo endpoint richiede `acceptedTerms: true`; il vecchio modulo non lo invia.
3. Verificare con un'azienda di test: creazione, accesso, primo rapportino,
   completamento del profilo, primo salvataggio della partita IVA e rifiuto della sovrascrittura.

## Verifiche locali

- `npm run build` (TypeScript, audit traduzioni, bundle e PWA).
- `npx tsx scripts/test-quick-registration.ts` (API con richieste simulate, nessun account/email reale).
- `npx tsx scripts/test-quick-login.ts` (email e nomi utente con autenticazione simulata).
- Anteprima browser: tre campi, sei lingue, mostra/nascondi password e larghezza mobile.

La migrazione non è stata applicata a un database remoto e non è stato eseguito
un test completo su un account reale. Le modifiche locali non costituiscono una pubblicazione.
