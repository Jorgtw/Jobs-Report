# 📋 Manuale di Utilizzo — JobsReport

> Versione 1.0 · Marzo 2026

---

## Indice

1. [Accesso e Ruoli](#1-accesso-e-ruoli)
2. [Flusso di inserimento dati](#2-flusso-di-inserimento-dati)
3. [Passo 1 — Clienti](#3-passo-1--clienti)
4. [Passo 2 — Subappalti](#4-passo-2--subappalti)
5. [Passo 3 — Personale](#5-passo-3--personale)
6. [Passo 4 — Progetti](#6-passo-4--progetti)
7. [Passo 5 — Rapportini](#7-passo-5--rapportini)
8. [Passo 6 — Sommario Lavori](#8-passo-6--sommario-lavori)
9. [Esportazione PDF / Excel](#9-esportazione-pdf--excel)
10. [Consigli pratici](#10-consigli-pratici)

---

## 1. Accesso e Ruoli

![Schermata di login di JobsReport](C:\Users\jtw\.gemini\antigravity\brain\426e76eb-c620-4b8d-8aaf-dad9ce6ee541\screen_login_1772699026857.png)
*Schermata di accesso — inserire username e password*

| Ruolo | Cosa può fare |
|---|---|
| **Amministratore** | Gestione completa di tutte le sezioni |
| **Incaricato** | Solo i propri rapportini |
| **Operaio** | Solo i propri rapportini |

> [!NOTE]
> Le credenziali vengono create dall'Amministratore nella sezione **Personale**.

---

## 2. Flusso di inserimento dati

![Schermata Home con menu di navigazione](C:\Users\jtw\.gemini\antigravity\brain\426e76eb-c620-4b8d-8aaf-dad9ce6ee541\screen_home_1772699041788.png)
*Dashboard principale — panoramica di tutte le sezioni*

Il flusso è **lineare** e **va rispettato nell'ordine**, perché ogni sezione dipende da quella precedente.

```
  ┌─────────┐    ┌────────────┐    ┌───────────┐
  │ CLIENTI │───►│  PROGETTI  │───►│RAPPORTINI │
  └─────────┘    └────────────┘    └───────────┘
                      ▲                  ▲
  ┌─────────┐    ┌────┴───────┐          │
  │PERSONALE│───►│SUBAPPALTI  │──────────┘
  └─────────┘    └────────────┘
  ──────────────────────────────────────────────
  ┌─────────────────────────────────────────────┐
  │         SOMMARIO LAVORI (solo Admin)         │
  └─────────────────────────────────────────────┘
```

---

## 3. Passo 1 — Clienti

**Menu:** `Clienti` → **+ Nuovo Cliente**

![Schermata elenco clienti](C:\Users\jtw\.gemini\antigravity\brain\426e76eb-c620-4b8d-8aaf-dad9ce6ee541\screen_clienti_1772699056806.png)
*Elenco clienti — ogni scheda mostra nome, referente e contatti*

| Campo | Obbligatorio | Note |
|---|---|---|
| Nome della ditta | ✅ | Nome commerciale del cliente |
| Partita IVA | — | Utile per i documenti |
| Persona di riferimento | — | Contatto principale |
| Telefono / Email | — | Per comunicazioni |
| Stato | ✅ | Attivo / Non attivo |

> [!TIP]
> Inserisci prima **tutti i tuoi clienti** prima di creare i progetti.

---

## 4. Passo 2 — Subappalti (Ditte esterne)

**Menu:** `Subappalti` → **+ Nuova Ditta**

Le ditte subappaltatrici sono partner esterni che collaborano ai cantieri.

| Campo | Note |
|---|---|
| Nome ditta | Nome della ditta esterna |
| Condizione economica | **A ore** (tariffa oraria) o **A corpo** (importo fisso) |
| Importo | Tariffa oraria o importo concordato |
| Stato | Attivo / Non attivo |

---

## 5. Passo 3 — Personale

**Menu:** `Personale` → **+ Nuovo Personale**

![Schermata form personale](C:\Users\jtw\.gemini\antigravity\brain\426e76eb-c620-4b8d-8aaf-dad9ce6ee541\screen_personale_1772699071894.png)
*Form inserimento lavoratore — notare il campo Prezzo orario, fondamentale per i margini*

| Campo | Note |
|---|---|
| Nome | Nome e cognome del lavoratore |
| Tipo di personale | **Interno** oppure seleziona la ditta subappaltatrice |
| Ruolo | Operaio / Incaricato / Amministratore |
| **Tariffa oraria** | ⚠️ **FONDAMENTALE** per il calcolo del costo nei reporting |
| Username + Password | Solo per personale interno |
| Stato | Attivo / Non attivo |

> [!IMPORTANT]
> La **tariffa oraria** è il costo aziendale per quel lavoratore. Senza questo valore il costo nel sommario sarà **€0,00**.

---

## 6. Passo 4 — Progetti

**Menu:** `Progetti` → **+ Nuovo Progetto**

![Schermata form nuovo progetto](C:\Users\jtw\.gemini\antigravity\brain\426e76eb-c620-4b8d-8aaf-dad9ce6ee541\screen_progetti_1772699088031.png)
*Form progetto — il Prezzo vendita/ora determina il ricavo nel Sommario*

| Campo | Note |
|---|---|
| Cliente | Seleziona da quelli inseriti precedentemente |
| Titolo del progetto | Nome cantiere/intervento |
| Condizione economica | **A ore** o **A corpo** |
| **Prezzo vendita / Ora** | ⚠️ **FONDAMENTALE** per il calcolo del ricavo e del margine |
| Stato | Attivo / Chiuso |

> [!IMPORTANT]
> Il **prezzo di vendita per ora** è ciò che fatturi al cliente. Senza questo valore il ricavo nel Sommario sarà **€0,00** e il margine non sarà calcolabile.

---

## 7. Passo 5 — Rapportini

**Menu:** `Rapportini` → **+ Nuovo Rapportino**

![Schermata form rapportino](C:\Users\jtw\.gemini\antigravity\brain\426e76eb-c620-4b8d-8aaf-dad9ce6ee541\screen_rapportino_1772699103453.png)
*Form rapportino — orari, squadra, spese e stato fatturazione in un'unica schermata*

### Dati principali

| Campo | Note |
|---|---|
| Data | Giorno di lavoro |
| Progetto | Seleziona il cantiere (mostra indirizzo e contatti) |
| Ora inizio / fine | Calcolo automatico delle ore totali |
| Pausa (ore) | Sottratta automaticamente |
| Ore totali (manuale) | Opzionale: sovrascrive il calcolo automatico |
| Descrizione attività | Cosa è stato fatto quel giorno |

### Squadra e Collaboratori
1. Clicca **+ Aggiungi Collaboratore**
2. Seleziona il lavoratore e inserisci i suoi orari
3. Il costo viene calcolato in automatico dalla sua tariffa

### Spese Extra
1. Clicca **+ Aggiungi Spesa**
2. Inserisci tipo, importo e note

### Stato Fatturazione

| Stato | Significato |
|---|---|
| **In Attesa** | Lavoro eseguito, non ancora fatturato |
| **Fatturato** | Fattura emessa al cliente |
| **Pagato** | Fattura incassata |

---

## 8. Passo 6 — Sommario Lavori

**Menu:** `Sommario Lavori` *(solo Amministratore)*

![Schermata sommario lavori con KPI e tabella margini](C:\Users\jtw\.gemini\antigravity\brain\426e76eb-c620-4b8d-8aaf-dad9ce6ee541\screen_sommario_1772699132302.png)
*Sommario Lavori — KPI economici e tabella per progetto con Vendita e Margine*

### Filtri disponibili
- Cliente · Progetto · Collaboratore · Ditta Subappalto
- Periodo (Da → A data)
- Stato fatturazione (Tutti / Fatturato / Pagato / In attesa)

### Indicatori KPI

| Indicatore | Colore | Descrizione |
|---|---|---|
| Ore Lavorate | Grigio | Totale ore nel periodo |
| Costo Personale | Grigio | Ore × tariffa personale interno |
| Costo Subappalti | Grigio | Costo personale esterno |
| Spese Totali | Arancio | Somma spese extra |
| **Totale Costo** | Blu | Tutti i costi sommati |
| **Totale Vendita** | Indigo | Ore × prezzo vendita progetto |
| **Margine** | 🟢 Verde / 🔴 Rosso | Vendita − Costi − Spese |

### Tabella per Progetto
Ogni riga mostra: Data · Progetto · Cliente · Ore · Costo · Vendita · **Margine** (badge colorato)

---

## 9. Esportazione PDF / Excel

Nella sezione **Sommario Lavori**, pulsanti in alto a destra:

- **📊 Esporta Excel** — file `.xlsx` con tutti i dati filtrati
- **📄 Esporta PDF** — report formattato con intestazione

> [!TIP]
> Applica i filtri **prima** di esportare (es. solo un mese, solo un cliente).
> L'export è nella **lingua selezionata** dall'utente (IT/EN/ES/PL/TR/DA).

---

## 10. Consigli pratici

### ✅ Checklist setup iniziale

1. [ ] Crea i tuoi **Clienti**
2. [ ] Aggiungi le **Ditte subappaltatrici** (se usi personale esterno)
3. [ ] Aggiungi il **Personale** con le tariffe orarie
4. [ ] Crea i **Progetti** con il prezzo di vendita/ora
5. [ ] Inizia a inserire i **Rapportini** quotidiani

### 💡 Formula del Margine

```
MARGINE = Totale Vendita − Costo Personale − Costo Subappalti − Spese Extra
```

- **Costo** → viene dalla **tariffa oraria** del Personale
- **Ricavo** → viene dal **prezzo vendita/ora** del Progetto
- Se uno dei due è 0 → il margine non è realistico

### 📅 Flusso mensile consigliato

```
Inizio mese   → Verifica che i progetti abbiano il prezzo di vendita aggiornato
Durante mese  → Inserimento rapportini quotidiani dagli operai
Fine mese     → Sommario → filtro per mese → Esporta Excel/PDF
              → Aggiorna stato fatturazione (In attesa → Fatturato → Pagato)
```

---

*JobsReport — Sistema professionale di gestione lavori e rapportini*
*React + TypeScript + Supabase*
