# Manuale d'Uso - Jobs Report

## Introduzione
Jobs Report è un'applicazione PWA progettata per la gestione e il monitoraggio dei lavori di cantiere, dei costi del personale e dei rapporti con i subappaltatori. 

## 1. Accesso e Autenticazione

### Login
Accedi con le tue credenziali (username e password). L'applicazione supporta diversi livelli di accesso a seconda del ruolo assegnato:
- **Operatore**
- **Incaricato (Supervisor)**
- **Amministratore**

![Schermata di Login](file:///C:/Users/jtw/.gemini/antigravity/brain/07ba6648-f6f7-4d07-b419-c3a357a3490b/initial_load_page_1773835119390.png)
*Pagana di accesso — Inserisci le tue credenziali per iniziare*

### Recupero Password
In caso di smarrimento della password, contatta l'amministratore del sistema.

---

## 2. Dashboard Principale (Launcher)

Dopo il login, verrai indirizzato alla Dashboard principale. Da qui puoi accedere rapidamente a tutte le funzionalità autorizzate per il tuo ruolo.

![Dashboard Home](file:///C:/Users/jtw/.gemini/antigravity/brain/07ba6648-f6f7-4d07-b419-c3a357a3490b/dashboard_home_new_jobsreport_png_1773835256583.png)
*Launcher — Accesso rapido a Rapportini, Progetti e Riepiloghi*

---

## 3. Gestione Rapportini

### Lista Rapportini
Visualizza tutti i rapportini caricati. Puoi filtrare per data o per progetto.
- **Operatori**: Vedono solo i propri rapportini.
- **Incaricati**: Vedono i propri e quelli dei collaboratori assegnati ai propri progetti.
- **Admin**: Vedono tutti i rapportini dell'azienda.

![Lista Rapportini](C:\Users\jtw\.gemini\antigravity\brain\426e76eb-c620-4b8d-8aaf-dad9ce6ee541\screen_rapportini_1772699081545.png)
*Esempio di lista rapportini con filtri attivi*

### Creazione/Modifica Rapportino
Clicca su "**Nuovo Rapportino**" (o l'icona della matita per modificare):
- Seleziona il **Progetto**.
- Inserisci la **Data**.
- Specifica la **Squadra**: puoi aggiungere collaboratori cliccando su "Aggiungi Collaboratore".
- Inserisci le **Spese**: materiali, pasti, trasporti, ecc.
- Definisci lo **Stato Fatturazione** (solo per Admin).

![Schermata form rapportino](C:\Users\jtw\.gemini\antigravity\brain\426e76eb-c620-4b8d-8aaf-dad9ce6ee541\screen_rapportino_1772699103453.png)
*Form rapportino — orari, squadra, spese e stato fatturazione in un'unica schermata*

Permette l'inserimento e la modifica dei lavori svolti.
- **Operatori**: Possono gestire solo i propri dati.
- **Incaricati**: Possono gestire i dati propri e quelli dei **collaboratori** per i progetti a loro assegnati.
- **Admin**: Controllo completo su ogni aspetto del sistema.

### Dati principali

| Campo | Note |
| :--- | :--- |
| **Orario Inizio/Fine** | Calcolo automatico delle ore totali. |
| **Pausa** | Ore di pausa da detrarre dal totale. |
| **Straordinari** | Vengono calcolati oltre la soglia standard definita nel profilo. |

---

## 4. Gestione Progetti (Solo Admin)

### Progetti e Clienti
L'amministratore può creare nuovi progetti, associarli a un cliente e assegnare i lavoratori o gli incaricati.
- **Progetti Attivi**: Visibili per l'inserimento ore.
- **Progetti Chiusi**: Archivio storico, non più selezionabili per nuovi rapportini.

---

## 5. Sommario Lavori (Solo Admin)

Visualizzazione analitica dei costi e ricavi. Riservato agli **Admin**, permette di monitorare ore, costi (personale, subappalti, spese) e ricavi, con calcolo automatico del margine.

![Sommario Amministrativo](file:///C:/Users/jtw/.gemini/antigravity/brain/a6039416-7035-42c8-bf9f-c819cbaa18e2/admin_dashboard_new_1772984669516.png)
*Torre di controllo — Analisi economica per progetto e cliente*

---

## 6. Profilo e Impostazioni

### Profilo Utente
Ogni utente può aggiornare i propri dati di contatto e visualizzare il riepilogo delle proprie ore mensili.

### Lingua
L'applicazione supporta Italiano, Inglese, Francese, Tedesco e Spagnolo. Cambia la lingua dall'icona del mondo nella testata.

---

## 7. Modalità PWA (Installazione)
Si consiglia di installare l'app sulla home del telefono o del PC tramite il tasto "**Installa App**" per un'esperienza più fluida e accesso offline.

---
*Jobs Report — Efficienza in cantiere, controllo in ufficio.*
