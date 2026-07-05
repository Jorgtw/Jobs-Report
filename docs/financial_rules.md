# Financial Rules - Jobs-Report

Questo documento definisce le regole ufficiali di calcolo finanziario del sistema Jobs-Report.

Tutte le regole qui descritte devono essere implementate esclusivamente nel `billingEngine.ts`.

---

## 1. Definizione di Revenue

**Revenue** rappresenta il valore economico generato da un report.

### Regola attuale del sistema:
- Se il progetto è interno → revenue = 0
- Se il progetto ha un prezzo di vendita → revenue = ore_totali × selling_price
- Gli additional workers seguono la stessa logica del progetto associato

---

## 2. Definizione di Cost

Il costo totale è composto da:

- personnelCost → costo del lavoro dei dipendenti interni
- subcontractorCost → costo dei lavoratori esterni/subappaltatori
- totalExpenses → spese dirette associate al report

---

## 3. Regola di classificazione lavoratore

Un lavoratore può essere:

### Internal Worker
- i suoi costi rientrano in personnelCost

### Subcontractor
- i suoi costi rientrano in subcontractorCost

Mai entrambi contemporaneamente.

---

## 4. Definizione di Expenses

- Le expenses sono costi esterni non legati alle ore lavorate
- Vengono sempre aggiunte al costo totale
- Attualmente NON includono variazioni fiscali o moltiplicatori

---

## 5. Definizione di Margin

Formula ufficiale:

margin = revenue - personnelCost - subcontractorCost - totalExpenses

---

## 6. Regole sugli Overtime

- Le ore straordinarie sono già incluse nel calcolo del costo orario
- Non esiste un moltiplicatore globale fisso nel sistema attuale
- Ogni tariffa è già esplicita nei dati di input

---

## 7. Regole sugli Additional Workers (AW)

- Sono trattati come entità equivalenti ai report principali
- Non hanno logiche speciali di margin
- Condividono la stessa formula finanziaria standard

---

## 8. Source of Truth

L'unico punto autorizzato per il calcolo finanziario è:

billingEngine.ts → calculateFinancials()

Qualsiasi altra forma di calcolo è considerata legacy o errore architetturale.

---

## 9. Principio fondamentale

Se un valore finanziario è calcolato fuori da billingEngine.ts, è un bug.
