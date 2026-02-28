# Jobs Report

Sistema professionale di gestione lavori, progetti e rapportini.

## 🚀 Deploy su GitHub Pages

### Prerequisiti
- Node.js 20+ installato
- Account GitHub
- Repository GitHub chiamato `Jobs-Report`

### Istruzioni

1. **Clona il tuo repository:**
   ```bash
   git clone https://github.com/TUO-USERNAME/Jobs-Report.git
   cd Jobs-Report
   ```

2. **Copia tutti i file del progetto nella cartella**

3. **Installa le dipendenze:**
   ```bash
   npm install
   ```

4. **Test locale (opzionale):**
   ```bash
   npm run dev
   ```
   Apri http://localhost:5173

5. **Commit e push:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

6. **Abilita GitHub Pages:**
   - Vai su Settings → Pages
   - Source: GitHub Actions
   - Salva

7. **Dopo il push, GitHub Actions farà automaticamente:**
   - Build del progetto
   - Deploy su GitHub Pages
   - L'app sarà disponibile su: `https://TUO-USERNAME.github.io/Jobs-Report/`

## 📱 Accesso

**Username:** `admin`  
**Password:** `password123`

## 💾 Dati

I dati sono salvati nel localStorage del browser.

---

Sviluppato con React + TypeScript + Vite + Tailwind CSS
