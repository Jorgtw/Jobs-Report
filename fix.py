import re

with open('jobs-report-demo.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add onclick to btn-edit
html = re.sub(r'<button class=\"btn-icon btn-edit\">', '<button class=\"btn-icon btn-edit\" onclick=\"alert(\'Simulazione: Apertura modulo di modifica (sola lettura nella demo)\')\" title=\"Modifica\">', html)

# Add onclick to btn-del
html = re.sub(r'<button class=\"btn-icon btn-del\">', '<button class=\"btn-icon btn-del\" onclick=\"alert(\'Simulazione: Richiesta di conferma per eliminare il record\')\" title=\"Elimina\">', html)

# Add onclick to btn-mail
html = re.sub(r'<button class=\"btn-icon btn-mail\"[^>]*>', '<button class=\"btn-icon btn-mail\" onclick=\"alert(\'Simulazione: Invio email con credenziali di accesso\')\" title=\"Invia credenziali\">', html)

# Add onclick to + Nuovo buttons
html = re.sub(r'<button class=\"btn btn-primary btn-sm\">\+ Nuovo([^<]*)</button>', r'<button class=\"btn btn-primary btn-sm\" onclick=\"alert(\'Simulazione: Apertura form per un nuovo inserimento\')\">+ Nuovo\1</button>', html)

# New Project special button
html = re.sub(r'<button class=\"btn btn-primary btn-sm admin-only-btn\" id=\"btnNewProject\" onclick=\"toggleInfo\(\'projectsAdminView\'\)\">\+ Nuovo Progetto<\/button>', '<button class=\"btn btn-primary btn-sm admin-only-btn\" id=\"btnNewProject\" onclick=\"alert(\'Simulazione: Scorri in basso per visualizzare il form Nuovo Progetto\')\">+ Nuovo Progetto</button>', html)

# Compliance and Duplica
html = re.sub(r'<button class=\"btn-icon\" style=\"background:#f0fdf4;color:#059669\"[^>]*>', '<button class=\"btn-icon\" style=\"background:#f0fdf4;color:#059669\" title=\"Compliance Report\" onclick=\"alert(\'Simulazione: Apre il modulo Compliance Report per questo rapportino\')\">', html)
html = re.sub(r'<button class=\"btn-icon\" style=\"background:#f5f3ff;color:#7c3aed\"[^>]*>', '<button class=\"btn-icon\" style=\"background:#f5f3ff;color:#7c3aed\" title=\"Duplica\" onclick=\"alert(\'Simulazione: Duplica questo rapportino alla data odierna\')\">', html)

# PDF / Excel
html = re.sub(r'<button class=\"btn btn-outline btn-sm\">📄 PDF<\/button>', '<button class=\"btn btn-outline btn-sm\" onclick=\"alert(\'Simulazione: Generazione e download PDF\')\">📄 PDF</button>', html)
html = re.sub(r'<button class=\"btn btn-success btn-sm\">📊 Excel<\/button>', '<button class=\"btn btn-success btn-sm\" onclick=\"alert(\'Simulazione: Export in formato Excel XLSX\')\">📊 Excel</button>', html)

with open('jobs-report-demo.html', 'w', encoding='utf-8') as f:
    f.write(html)
