# Calendario operativo opzionale

## Architettura e scelte

La funzionalità usa React/TypeScript, React Query, HashRouter e il client Supabase esistenti. Il ruolo Worker è denominato `operator` nel codice. Il menu `/calendar` è caricato in modo differito. Le traduzioni sono in `src/i18n/{it,en,es,pl,tr,da}/calendar.ts`.

Progetti, clienti, indirizzi e operatori restano nelle tabelle esistenti. `projects.assigned_worker_ids` resta il vincolo di assegnazione: elenco vuoto significa progetto aperto a tutti gli operatori dell'azienda. La pianificazione non modifica quel campo, non duplica clienti e non legge/scrive compensi. Il cliente del calendario deriva dal progetto.

- `work_schedules`: una regola singola o settimanale, con intervallo, orari opzionali per la singola, attività, note e stato operativo.
- `work_schedule_workers`: operatori della regola oppure di una specifica eccezione.
- `work_schedule_exceptions`: sostituzione completa di una sola occorrenza, identificata da regola/data. L'elenco operatori dell'eccezione sostituisce quello della regola.
- `reports.schedule_id` e `reports.schedule_date`: collegamento opzionale; i rapportini manuali non lo valorizzano.

`calendar_feed` calcola soltanto i giorni del periodo richiesto, con limite server di 62 giorni. La vista mese include solo le settimane adiacenti necessarie; Prossimi lavori copre 14 giorni. Nessuna materializzazione futura. Un'unica chiamata restituisce un array JSON con progetto, cliente, operatori e riferimenti ai rapportini, senza N+1 di rete e senza troncamento al limite standard di righe PostgREST. Le query interne usano indici sulle regole, eccezioni, operatori e rapportini.

## Permessi

Le tre nuove tabelle hanno RLS e GRANT espliciti per `authenticated`/`service_role`, senza accesso `anon`. I controlli usano `auth.uid()`, `user_companies`, `workers.company_id` e le policy esistenti di progetti/operatori. È richiesta un'azienda attiva. Non si usa l'helper storico `is_admin_of_company` per distinguere i ruoli, perché in alcune migrazioni comprende anche Supervisor.

Admin e Supervisor gestiscono le regole tramite `calendar_save` SECURITY INVOKER: si applicano RLS e visibilità esistenti. Una regola con operatori non visibili al Supervisor viene esclusa interamente. Il Supervisor non riceve nuovi permessi economici. Anche scritture dirette sono soggette a RLS, foreign key e trigger di coerenza azienda/progetto/operatori.

Worker non legge alcuna riga delle tabelle grezze: questo evita di esporre una regola generale insieme alle sostituzioni dei colleghi. La RPC SECURITY DEFINER `calendar_my_occurrences`, con search_path fisso e accesso anon revocato, applica prima le eccezioni e poi seleziona solo le occorrenze del Worker autenticato e attivo nella propria azienda. Restituisce solo il suo nominativo e i suoi riferimenti ai rapportini. Cambiare azienda, Worker o ruolo nel frontend non amplia i risultati. `calendar_feed` decide il percorso usando i ruoli verificati dal database.

Le chiavi React Query comprendono azienda e identità. Anche la cache rapportini ora distingue l'utente.

## Modifiche e rapportini

`calendar_save` salva regola, eccezione e operatori nella stessa transazione:

- Solo questa: conserva data e progetto della serie, cambia attività, note, orari, stato e operatori per quella data.
- Questa e le successive: tronca la regola precedente al giorno prima e crea la nuova; trasferisce le eccezioni ancora compatibili e i collegamenti ai rapportini futuri. Le eccezioni non più comprese nelle nuove date/giorni vengono rimosse.
- Tutta la serie: aggiorna la regola mantenendo le eccezioni esplicite indipendenti. Quelle fuori dal nuovo intervallo non producono eventi.
- Duplica: apre una nuova assegnazione singola, modificabile prima del salvataggio.
- Elimina singola occorrenza: registra un'eccezione annullata. Elimina serie/futuro: rimuove la pianificazione interessata. I rapportini esistenti restano conservati; se la relativa pianificazione viene eliminata, il collegamento viene azzerato.

Gli orari sono nello stesso giorno, coerentemente con il calcolo orario già presente. La modifica del progetto di una regola con rapportini incompatibili viene rifiutata e annullata atomicamente.

Dal dettaglio si apre il modulo rapportini esistente con data, progetto, attività e Worker precompilati. Data/progetto/Worker rimangono bloccati per conservare la coerenza del collegamento; per altre registrazioni si usa il modulo manuale. Orari effettivi vuoti, pausa zero, nessuna quantità/ora pianificata trasferita. Un rapportino orario richiede gli orari effettivi oppure il totale esplicito. Il salvataggio continua a usare il calcolo e gli export esistenti. Le assegnazioni includono i riferimenti ai rapportini anche quando il Worker figura fra i collaboratori aggiuntivi.

Se il rapportino esiste, il pulsante diventa Apri rapportino. Per Worker l'apertura è in sola lettura, coerentemente con `authService.can(..., 'update', 'reports')`. Le copie manuali non ereditano il collegamento al calendario. Un indice impedisce duplicati della stessa regola/data/autore. Stato operativo e stato amministrativo restano distinti; non è stato aggiunto il completamento automatico perché il flusso rapportini attuale non ha un evento univoco di completamento operativo.

Nella scheda progetto, Pianificazione mostra le regole correnti/future e collega al calendario filtrato, dove si creano assegnazioni singole o ricorrenti. Nessuna regola è necessaria per continuare a usare un progetto.

## Rilascio

Applicare **`supabase_migration_work_calendar.sql` prima del frontend**. È una migrazione transazionale e ripetibile che non crea assegnazioni né modifica ore, costi o stati amministrativi esistenti. Permessi espliciti seguono le indicazioni [Supabase per proteggere il Data API](https://supabase.com/docs/guides/api/securing-your-api).

Migrazione applicata al database online il 27 settembre 2026. Verificate le policy effettive e una transazione di prova con identità Admin, Worker e altra azienda: ricorrenze, sostituzione singola, isolamento delle occorrenze, divieto di lettura delle tabelle grezze e scrittura Worker, rapportino di 3 ore effettive su 2 pianificate e divisione della serie. Tutte le scritture di prova sono state annullate. Dopo la verifica: 12 progetti, 298 rapportini, 2.146,58 ore e nessuna assegnazione di prova persistente. La fixture locale verifica anche Supervisor con visibilità ristretta. Le prove HTTP con account temporanei richiedono autorizzazione specifica per la creazione degli accessi. Il pacchetto frontend del solo calendario è compilato sulla versione pubblicata più recente, preservando gli altri lavori del workspace.

## Test ripetibili

- `npx tsc --noEmit`
- `npm run test:calendar`: date/DST, intervalli, mapping e salvataggio effettivo del servizio rapportini con I/O simulato, ore reali, rapportini manuali e parità delle sei lingue.
- `npm run test:calendar:db`: PostgreSQL isolato con PGlite. Impostare `PGLITE_MODULE` al percorso di `@electric-sql/pglite/dist/index.js`; nel workspace viene riutilizzata l'installazione di test già presente in `scratch/account-db-test`. Verifica ripetibilità, RLS dirette, RPC, GRANT, aziende, ruoli, ricorrenza mercoledì/domenica, eccezioni, split, cancellazioni, vincoli e rollback.
- `npm run test:calendar:preview`: anteprima isolata su `http://127.0.0.1:5187/scripts/fixtures/calendar.html`, con componenti reali e backend simulato, senza credenziali o chiamate al database online. Consente di passare fra Admin, Dogan, Marco e le sei lingue.
- Regressioni esistenti: `test:compensation`, `test:financial`, `scripts/test-worker-exports.mjs`, suite offline account/accesso/registrazione/notifiche e suite database compensi/account.
- `npm run build`.

Verifiche browser eseguite: mese Admin; sostituzione dell'11 ottobre con serie invariata; vista mobile Worker a 390 px senza overflow; creazione dal calendario con orari vuoti; inserimento 18:00–21:00 e salvataggio di 3 ore su pianificazione 18:00–20:00; successivo Apri rapportino senza nuovi permessi Worker.

La suite finanziaria storica salta tutti i 50 snapshot con risultato atteso assente: non costituisce una verifica numerica di quei casi. La suite compensi verifica invece 96 scenari orari precedenti oltre a quantità/fisso ed export. L'audit i18n generale segnala testi hardcoded preesistenti; le nuove stringhe del calendario sono tradotte.
