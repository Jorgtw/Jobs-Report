# Fonti dell'assistente Jobs Report

Revisione del 20 settembre 2026. Le istruzioni in `api/chat-assistant.ts` descrivono funzioni presenti nel codice, non lo stato privato dell'account dell'utente.

| Argomento | Fonte verificata |
| --- | --- |
| PWA, nessuna pubblicazione negli store | Conferma del proprietario; `vite.config.ts`; [Safari su iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios), [Chrome su Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=it) |
| Prezzi, limiti, funzioni incluse | `src/utils/pricingConfig.ts`, importato direttamente nel prompt |
| Registrazione, username, email condivisa, recupero | `api/self-register.ts`, `api/recover-account.ts`, `src/pages/LoginView.tsx` |
| Eliminazione azienda riservata al superadmin | `supabase_migration_company_usernames.sql`, `api/delete-account.ts` |
| Pausa modificabile, totale manuale | `src/pages/ReportsView.tsx` |
| PDF, firma obbligatoria, massimo tre foto | `src/components/InterventionReportModal.tsx` |
| Comunicazioni e destinatari interni | `src/components/CommunicationsHub.tsx` |
| Tipi di spesa | `src/types.ts`, interfaccia `Expense` |
| Sommario e visibilità del supervisore | `src/pages/WorkSummaryView.tsx` |
| Upgrade e portale Stripe | `src/pages/HomeView.tsx` |
| Contatto assistenza | `src/pages/HelpView.tsx` |

Rimosse le restrizioni inventate Business/Premium sugli export e sulle firme, la pausa obbligatoria di un'ora, il rimborso/prorata garantito e la soglia arbitraria di dieci giornate. L'assistente deve dichiarare quando manca un'informazione e non simulare accessi o operazioni sugli account.

Formato: schema JSON imposto al modello; parsing validato prima della risposta HTTP, recupero degli involucri annidati e nessun fallback che mostri JSON malformato. `scripts/test-assistant.ts` verifica questi casi con rete simulata. Provate inoltre domande reali su installazione, piani, account, pausa e impossibilità di consultare dati privati. Le prove riducono il rischio di errori ma non garantiscono ogni futura risposta generativa.
