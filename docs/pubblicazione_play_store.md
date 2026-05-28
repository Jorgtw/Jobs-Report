# Guida Definitiva alla Pubblicazione su Google Play Store: Jobs-Report

Questa guida descrive passo-passo sia le procedure amministrative che quelle tecniche per pubblicare **Jobs-Report** sul Google Play Store.

---

## 🏢 1. La scelta dell'Account Sviluppatore Google (Cruciale)

Google richiede la creazione di un account **Google Play Console Developer** (costo una tantum di **$25**). Durante la registrazione, puoi scegliere due tipi di account:

### Opzione A: Account Organizzazione/Azienda (Altamente Consigliata)
*   **Vantaggi:** Puoi pubblicare l'applicazione direttamente in **Produzione** (aperta a tutti) non appena completi la verifica dei documenti aziendali (Partita IVA, Visura Camerale o D-U-N-S number).
*   **A chi è rivolto:** Se hai una ditta o società registrata.

### Opzione B: Account Personale (Privato)
*   **Svantaggi (La trappola dei 20 tester):** Google impone una regola severa per gli account personali creati dopo il 2023. Prima di poter pubblicare l'app in produzione, devi attivare un test chiuso con **almeno 20 tester reali** che tengano installata l'applicazione sul proprio telefono per **almeno 14 giorni consecutivi**.
*   **A chi è rivolto:** Se ti registri come singolo sviluppatore senza p.iva aziendale.

> [!IMPORTANT]
> **Raccomandazione B2B:** Poiché Jobs-Report è un applicativo aziendale mirato alle ditte, ti raccomandiamo caldamente di registrare l'account Google Play Console come **Organizzazione/Azienda** per bypassare completamente la regola dei 20 tester e pubblicare subito in produzione.

---

## 🎨 2. Asset Grafici per la Scheda del Play Store

Per completare la scheda del negozio, Google richiede i seguenti materiali grafici che devi preparare:

1.  **Icona dell'App per lo Store:** PNG da **512 x 512 pixel**, sfondo trasparente, massimo 1MB.
2.  **Immagine in Evidenza (Feature Graphic):** PNG da **1024 x 500 pixel**, essenziale per la promozione dello store.
3.  **Screenshot del Telefono:** Minimo 2 screenshot (consigliati 4-6) in formato 16:9 o 9:16 (es. screenshot dell'emulatore mentre usi l'app).
4.  **Screenshot del Tablet (Opzionale ma consigliato):** Almeno 2 screenshot per schermi da 7 e 10 pollici.

---

## ✍️ 3. Testi Ottimizzati per lo Store (Pronti all'uso)

Puoi copiare ed incollare questi testi direttamente all'interno della Google Play Console:

### Titolo dell'App (Max 30 caratteri)
> Jobs-Report

### Descrizione Breve (Max 80 caratteri)
> Rapportini di cantiere digitali, ore e materiali per operai e ditte artigiane.

### Descrizione Completa (Max 4000 caratteri)
> **Jobs-Report è l'applicazione professionale e minimalista studiata appositamente per chi lavora nei cantieri edili, ditte idrauliche, elettriche e artigiane.**
> 
> Smetti di perdere tempo a fine mese per rincorrere foglietti di carta spiegazzati, note illeggibili o messaggi WhatsApp caotici. Con Jobs-Report, la tua ditta ha il controllo totale dei cantieri in tempo reale direttamente sullo smartphone.
> 
> **PERCHÉ SCEGLIERE JOBS-REPORT?**
> 
> 👷 **Fatto per gli operai:** Un'interfaccia ultra-minimalista a 3 bottoni giganti studiata appositamente per chi lavora sul campo. L'inserimento dei dati richiede meno di 10 secondi a fine giornata.
> 
> ⏱️ **Tracciamento ore fulmineo:** Registra le ore lavorate del personale dipendente, dei collaboratori esterni e delle ditte in subappalto, specificando orari di inizio, fine e pause.
> 
> 📦 **Materiali e Spese Extra:** Tieni traccia istantaneamente dei materiali consumati, dei pasti, dei chilometri di trasferta e di qualsiasi spesa extra con la possibilità di allegare prove fotografiche.
> 
> ✍️ **Firma di conformità sul posto:** Fai firmare il cliente direttamente sullo schermo del tuo smartphone per accettazione dei lavori a regola d'arte ed evita qualsiasi contestazione futura sulle fatture.
> 
> 📊 **Pronto per l'ufficio:** Accedi alla dashboard amministratore ed esporta tutti i dati dei rapportini in formato Excel o PDF professionali con un solo clic. Il tuo commercialista ti ringrazierà!
> 
> **FUNZIONALITÀ PRINCIPALI:**
> * Inserimento rapido di Ore, Straordinari e Pause.
> * Gestione collaboratori, operai interni e squadre di subappalto.
> * Monitoraggio spese di cantiere (pasti, pedaggi, trasferte chilometriche).
> * Modulo "Soddisfatto del servizio svolto (SI/NO)" opzionale per il cliente.
> * Acquisizione firma digitale autografa sul campo.
> * Funzionamento offline in assenza di rete nei cantieri isolati.
> * Esportazione dati pulita in Excel e PDF.
> 
> Passa al digitale in 10 secondi. Rendi la tua ditta più solida, moderna ed efficiente con Jobs-Report!

---

## 🛠️ 4. Procedura Tecnica di Compilazione (in Android Studio)

Per generare il file definitivo da caricare su Google Play, segui questi passaggi all'interno di Android Studio:

### Step 1: Configurare l'Icona del Launcher (Icona sul Telefono)
1.  Fai clic destro sulla cartella **`app`** nella barra di sinistra del progetto nativo e seleziona **New > Image Asset**.
2.  In **Source Asset**, seleziona il percorso del file logo del tuo progetto (es. `C:\Users\jtw\Euro JTW\Archivi\JTW\Programmi\jobs-report-complete\public\logo.png`).
3.  Regola lo zoom per far rientrare perfettamente il logo all'interno del cerchio di sicurezza.
4.  Fai clic su **Next** e poi su **Finish**. Android Studio genererà automaticamente tutte le icone per ogni risoluzione di schermo!

### Step 2: Incrementare la Versione del Software
Ogni volta che carichi un nuovo aggiornamento sul Play Store, devi incrementare il `versionCode` (un numero intero progressivo) e il `versionName` (la versione testuale, es. "1.0.1").
1.  Apri il file [android/app/build.gradle](file:///C:/Users/jtw/Euro%20JTW/Archivi/JTW/Programmi/jobs-report-complete/android/app/build.gradle).
2.  Cerca il blocco `defaultConfig` ed incrementa i valori:
    ```groovy
    defaultConfig {
        applicationId "com.jobsreport.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1 // Incrementalo a 2, 3, etc. per ogni aggiornamento
        versionName "1.0.0" // Es. "1.0.1"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    ```

### Step 3: Generare il pacchetto firmato (.AAB)
Google non accetta più i vecchi file `.apk` per la pubblicazione, ma richiede il formato **Android App Bundle (.aab)**, che ottimizza il peso del download per gli utenti.
1.  Nel menu in alto di Android Studio, fai clic su **Build > Generate Signed Bundle / APK...**
2.  Seleziona **Android App Bundle** e fai clic su **Next**.
3.  Sotto **Key store path**, fai clic su **Create new...** per generare la chiave di firma digitale (Keystore):
    *   Scegli una cartella sicura sul computer e assegna un nome al file (es. `jobs-report-key.jks`).
    *   Imposta una password sicura per il Keystore e una per la chiave (Alias: `key0`).
    *   Compila i campi richiesti (Nome, Ditta, Città) e clicca su **OK**.
    *   *IMPORTANTE:* Conserva questo file Keystore e le password in un luogo sicuro. Se li perdi, non potrai più aggiornare l'applicazione sul Play Store!
4.  Fai clic su **Next**.
5.  Seleziona la variante di build **`release`** e clicca su **Create**.

Android Studio compilerà l'applicazione in modalità ottimizzata. Al termine, comparirà una notifica in basso a destra con scritto *"Generate Signed Bundle: Bundle(s) generated successfully"*. 
Cliccando su **"Locate"**, si aprirà la cartella contenente il file `app-release.aab` pronto da caricare direttamente sulla Google Play Console!
