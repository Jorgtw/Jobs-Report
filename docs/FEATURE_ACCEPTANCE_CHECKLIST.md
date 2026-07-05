# Jobs-Report – Feature Acceptance Checklist (V1 Guardrail)

Ogni nuova funzionalità deve passare questi 4 controlli prima di essere implementata.

---

## 1. È dentro il perimetro del prodotto?

La feature serve a:
* inserire ore
* gestire interventi
* registrare spese operative
* esportare dati

Se richiede:
* contabilità
* fatturazione
* IVA
* margini
* pricing automatico

→ NON è accettata in V1

---

## 2. Modifica il modello dati operativo o introduce logica economica?

Domanda chiave:
> sto salvando realtà operativa o sto costruendo un sistema finanziario?

Se introduce:
* calcoli di prezzo
* regole tariffarie
* snapshot economici
* stati contabili

→ deve essere rifiutata o semplificata

---

## 3. Può essere spiegata a un tecnico sul campo in meno di 10 secondi?

Se la feature richiede:
* spiegazioni amministrative
* termini contabili
* configurazioni complesse
* decisioni economiche

→ non è compatibile con UX V1

---

## 4. Migliora il flusso “inserisci → esporta”?

La V1 ha un solo flusso centrale:
> inserimento rapido → export semplice

Se la feature:
* accelera questo flusso → OK
* lo complica → NON OK

---

# Regola finale

Se anche solo UNA risposta è negativa:
> la feature deve essere rifiutata o semplificata fino a diventare puramente operativa

---

## Come usarla (importante)

Non è documentazione passiva.
È un filtro attivo da usare:
* prima di scrivere codice
* prima di progettare UI
* prima di aggiungere campi al database
