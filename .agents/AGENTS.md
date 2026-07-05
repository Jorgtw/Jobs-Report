# Jobs-Report V1 – Product Constraints

## 1. Scope del prodotto
Jobs-Report è uno strumento di time tracking e raccolta dati operativi sul campo.
Non è un sistema di contabilità, fatturazione o ERP.

## 2. Natura dei dati
Il sistema registra solo dati operativi reali:
- ore lavorate (ordinarie, straordinarie, festive, notturne)
- spese effettive sostenute
- assegnazione a cliente / progetto / intervento

Non deve contenere logiche di:
- margini
- pricing automatico
- fatturazione interna

## 3. Export
L’export Excel/PDF è un allegato operativo.

Serve per:
- aggregare dati
- supportare amministrazione esterna
- eventuale compilazione manuale di dati economici fuori dal sistema

Non deve diventare un sistema contabile interno.

## 4. Stato dei dati
È ammesso solo uno stato operativo semplice dei rapportini (es. new / exported) per supporto UX.

Non sono ammessi:
- snapshot contabili
- versioning economico
- blocchi irreversibili dei dati

## 5. UX e semplicità
L’interfaccia deve rimanere orientata a:
- inserimento veloce sul campo
- zero terminologia contabile
- massima semplicità operativa

## Principio guida
La complessità economica deve restare esterna al sistema (Excel / amministrazione), non interna all’app.

---

## Nota importante

Questo file non deve introdurre nuove funzionalità, ma solo servire come guida architetturale e di coerenza del prodotto per evitare future derive verso complessità ERP.

---

# AI Feature Validation Gate (MANDATORY)

A partire da questo momento, **ogni intelligenza artificiale (incluso Antigravity) è severamente obbligata** a validare qualsiasi richiesta di "nuova funzionalità" o "modifica architetturale" rispondendo apertamente a queste 4 domande prima di scrivere anche una sola riga di codice:

1. **È dentro il perimetro del prodotto?** (Serve a inserire ore, gestire interventi, registrare spese o esportare dati?)
2. **Modifica il modello dati operativo o introduce logica economica?** (Introduce calcoli di prezzo, snapshot o stati contabili?)
3. **Può essere spiegata a un tecnico sul campo in meno di 10 secondi?**
4. **Migliora il flusso “inserisci → esporta”?**

Se anche una sola di queste risposte viola la "Feature Acceptance Checklist" (vedi `docs/FEATURE_ACCEPTANCE_CHECKLIST.md`), l'AI deve **FERMARSI, rifiutare la richiesta** e proporre all'utente una semplificazione puramente operativa, avvisando del rischio di deriva ERP.
