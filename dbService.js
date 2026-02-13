// dbService.js
// Servizio dati con LocalStorage + struttura pronta per Supabase

// Chiave unica per LocalStorage
const STORAGE_KEY = "jobsReportData_v1";

// Tipi base (puoi estenderli liberamente)
export interface Rapportino {
  id: string;
  date: string;
  project: string;
  people: number;
  hours: number;
  notes?: string;
}

export interface DBData {
  rapportini: Rapportino[];
}

// Carica i dati da LocalStorage
function loadData(): DBData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { rapportini: [] };
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Errore caricamento dati:", err);
    return { rapportini: [] };
  }
}

// Salva i dati su LocalStorage
function saveData(data: DBData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Errore salvataggio dati:", err);
  }
}

// Singleton dei dati
let db = loadData();

// -----------------------------
// API PUBBLICHE
// -----------------------------
export const dbService = {
  getReports() {
    return JSON.parse(localStorage.getItem("reports") || "[]");
  },

  saveReport(report) {
    const reports = this.getReports();
    reports.push(report);
    localStorage.setItem("reports", JSON.stringify(reports));
  }
};

  // Aggiungi un nuovo rapportino
  addRapportino(r: Rapportino) {
    db.rapportini.push(r);
    saveData(db);
  },

  // Aggiorna un rapportino
  updateRapportino(id: string, updates: Partial<Rapportino>) {
    db.rapportini = db.rapportini.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    saveData(db);
  },

  // Elimina un rapportino
  deleteRapportino(id: string) {
    db.rapportini = db.rapportini.filter(r => r.id !== id);
    saveData(db);
  },

  // Reset completo (utile per debug)
  clearAll() {
    db = { rapportini: [] };
    saveData(db);
  }
};

// -----------------------------
// FUTURA INTEGRAZIONE SUPABASE
// -----------------------------
//
// Quando Supabase sarà pronto, basterà sostituire:
// - loadData() → fetch da Supabase
// - saveData() → insert/update/delete su Supabase
//
// La UI non cambierà: continuerà a chiamare dbService.
// -----------------------------
