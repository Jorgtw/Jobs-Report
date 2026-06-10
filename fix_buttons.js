const fs = require('fs');
let html = fs.readFileSync('jobs-report-demo.html', 'utf8');

html = html.replace(/<button class="btn-icon btn-edit">/g, '<button class="btn-icon btn-edit" onclick="alert(\'Simulazione: Apertura modulo di modifica (sola lettura nella demo)\')" title="Modifica">??</button>');
html = html.replace(/<button class="btn-icon btn-edit" title="Modifica">??<\/button>??<\/button>/g, '<button class="btn-icon btn-edit" onclick="alert(\'Simulazione: Apertura modulo di modifica (sola lettura nella demo)\')" title="Modifica">??</button>');

html = html.replace(/<button class="btn-icon btn-del">/g, '<button class="btn-icon btn-del" onclick="alert(\'Simulazione: Richiesta di conferma per eliminare il record\')" title="Elimina">???</button>');
html = html.replace(/<button class="btn-icon btn-del" title="Elimina">???<\/button>???<\/button>/g, '<button class="btn-icon btn-del" onclick="alert(\'Simulazione: Richiesta di conferma per eliminare il record\')" title="Elimina">???</button>');

html = html.replace(/<button class="btn-icon btn-mail"[^>]*>/g, '<button class="btn-icon btn-mail" onclick="alert(\'Simulazione: Invio email con credenziali di accesso\')" title="Invia credenziali">');

html = html.replace(/<button class="btn btn-primary btn-sm">\+ Nuovo/g, '<button class="btn btn-primary btn-sm" onclick="alert(\'Simulazione: Apertura form per un nuovo inserimento\')">+ Nuovo');
html = html.replace(/<button class="btn btn-primary btn-sm admin-only-btn"[^>]*>\+ Nuovo Progetto<\/button>/g, '<button class="btn btn-primary btn-sm admin-only-btn" id="btnNewProject" onclick="alert(\'Simulazione: Scroll al form Nuovo Progetto (vedi in basso)\')">+ Nuovo Progetto</button>');

html = html.replace(/<button class="btn-icon" style="background:#f0fdf4;color:#059669"[^>]*>?<\/button>/g, '<button class="btn-icon" style="background:#f0fdf4;color:#059669" title="Compliance Report" onclick="alert(\'Simulazione: Apre il modulo Compliance Report per questo rapportino\')">?</button>');
html = html.replace(/<button class="btn-icon" style="background:#f5f3ff;color:#7c3aed"[^>]*>?<\/button>/g, '<button class="btn-icon" style="background:#f5f3ff;color:#7c3aed" title="Duplica" onclick="alert(\'Simulazione: Duplica questo rapportino alla data odierna\')">?</button>');

html = html.replace(/<button class="btn btn-outline btn-sm">?? PDF<\/button>/g, '<button class="btn btn-outline btn-sm" onclick="alert(\'Simulazione: Generazione e download PDF\')">?? PDF</button>');
html = html.replace(/<button class="btn btn-success btn-sm">?? Excel<\/button>/g, '<button class="btn btn-success btn-sm" onclick="alert(\'Simulazione: Export in formato Excel XLSX\')">?? Excel</button>');

// Fix multiple + Nuovo Comunicazione matches
html = html.replace(/onclick="alert\('Simulazione: Apertura form per un nuovo inserimento'\)">\+ Nuova Comunicazione/g, 'onclick="alert(\'Simulazione: Scroll al form di invio messaggio (vedi in basso)\')">+ Nuova Comunicazione');

fs.writeFileSync('jobs-report-demo.html', html);
