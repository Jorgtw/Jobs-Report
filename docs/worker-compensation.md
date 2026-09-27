# Compensi per assegnazione lavoratore–progetto

## Modello e retrocompatibilità

L’assegnazione esistente rimane `projects.assigned_worker_ids` (elenco vuoto: progetto aperto a tutti, come prima). `project_worker_compensations` aggiunge una sola riga per coppia progetto/lavoratore. L’assenza della riga equivale a HOURLY; la migrazione non crea righe e non cambia dati esistenti.

HOURLY conserva esattamente tariffa personale, straordinari ed extra precedenti. PER_UNIT sostituisce questi costi con quantità × tariffa. FIXED_PROJECT sostituisce questi costi con l’importo concordato, una volta sola. Le spese e i ricavi cliente restano separati; per un subappaltatore il costo resta nella categoria subappaltatori. Le ore continuano a essere rilevate per operatività e ricavo cliente.

Le quantità sono salvate sia su `reports` sia su `rapportini_workers`; il campo compare solo per PER_UNIT. Null significa zero per vecchi client/rapportini; i nuovi moduli PER_UNIT chiedono esplicitamente la quantità (zero ammesso). Valori negativi/non finiti sono rifiutati dal database. Duplicare un rapportino azzera le quantità per evitare di duplicare lavoro completato.

## Compenso fisso e filtri

L’importo fisso è attribuito alla prima presenza del lavoratore nel progetto, ordinando per data, creazione, ID rapportino e posizione principale/aiutante. Malattia e ferie non sono eventi di riconoscimento. La scelta avviene sull’intera cronologia accessibile prima dei filtri temporali, per stato o per lavoratore. Il progetto senza rapportini non matura ancora costo. Se il primo rapportino viene eliminato o ridatato, l’attribuzione passa alla prima presenza rimasta. Il Sommario non è un libro contabile immutabile.

I termini sono quelli correnti dell’assegnazione, come le tariffe personali già usate dall’app: modificarli esplicitamente ricalcola anche lo storico di quell’assegnazione. Non sono stati aggiunti versionamento tariffario, paghe o fatturazione cliente.

## Permessi e migrazione

Eseguire `supabase_migration_worker_compensation.sql` **prima** di pubblicare il frontend aggiornato. La migrazione è transazionale e ripetibile. Applicata al database online il 27 settembre 2026, dopo autorizzazione esplicita del rilascio.

La tabella nuova ha RLS e GRANT espliciti per authenticated/service_role; anon non ha accesso. Worker legge soltanto i propri termini nei progetti accessibili della propria azienda. Supervisor legge i termini della propria azienda entro la visibilità progetti esistente. Admin/Superadmin può modificare i termini. I rapportini mantengono le policy esistenti. Un trigger impedisce riferimenti a lavoratori di altre aziende. La funzione `save_project_with_compensations` usa SECURITY INVOKER: progetto e termini vengono salvati nella stessa transazione e ogni policy resta applicabile. Il Supervisor può salvare le altre informazioni del progetto senza cambiare compensi.

Le policy riutilizzano `is_super_admin()` e le tabelle `workers`, `user_companies`, `projects` già presenti. I test locali verificano un modello rappresentativo delle policy esistenti. Prima del rilascio è stato controllato anche lo schema online; la nuova RPC verifica esplicitamente azienda e ruolo perché alcune policy legacy dei progetti non sono sufficientemente restrittive.

## Interfaccia ed export

In Progetti, l’Admin sceglie il compenso sotto il lavoratore assegnato. I rapportini mostrano Quantità completata soltanto per PER_UNIT, anche per gli aiutanti. Il Sommario aggiunge il dettaglio per progetto/lavoratore con quantità e unità separate: non somma unità incompatibili. I totali economici usano `calculateFinancials()`.

Gli export economici aggiungono un dettaglio compensi soltanto se necessario. Gli export Worker mantengono il foglio ore e aggiungono le quantità, senza importi. Gli importi fissi riconosciuti compaiono una sola volta nell’export. Le traduzioni sono presenti nelle sei lingue dell’app.

## Verifica locale

- `npx tsc --noEmit`
- `npm run test:compensation`: formule, 96 scenari orari indipendenti, integrazione reale getSummary, principali/aiutanti, ordine, filtri, mapping ed export.
- `npm run test:compensation:db` con `PGLITE_MODULE` impostato al file locale `@electric-sql/pglite/dist/index.js`: migrazione ripetuta, RLS, GRANT, quantità e rollback atomico in PostgreSQL isolato.
- `node scripts/test-worker-exports.mjs`: test export precedenti.
- `node scripts/test-worker-compensation-browser.mjs` con un server Vite locale sulla porta 5187: controlli reali, validazione decimali e layout mobile. `COMPENSATION_TEST_ORIGIN` può cambiare la porta.

Il test storico `test:financial` termina correttamente ma salta tutti i 50 snapshot perché i risultati attesi sono null: i nuovi test non dipendono da questi snapshot. L’audit i18n segnala testi hardcoded già presenti, esterni ai nuovi controlli.
