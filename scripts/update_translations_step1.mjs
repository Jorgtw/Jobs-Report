import fs from 'fs';

let content = fs.readFileSync('src/translations.ts', 'utf8');

const translationsToAdd = {
  da: {
    pendingHoursTitle: "Timer der afventer betaling",
    pendingHoursSubtitle: "Rapporter endnu ikke afregnet",
    needHelpChat: "Har du brug for hjælp?",
    personalExportBtn: "Download MINE rapporter (PDF)"
  },
  es: {
    pendingHoursTitle: "Horas pendientes de pago",
    pendingHoursSubtitle: "Partes aún no liquidados",
    needHelpChat: "¿Necesitas ayuda?",
    personalExportBtn: "Descargar MIS Partes (PDF)"
  },
  pl: {
    pendingHoursTitle: "Godziny oczekujące na płatność",
    pendingHoursSubtitle: "Raporty jeszcze nierozliczone",
    needHelpChat: "Potrzebujesz pomocy?",
    personalExportBtn: "Pobierz MOJE Raporty (PDF)"
  },
  tr: {
    pendingHoursTitle: "Ödeme bekleyen saatler",
    pendingHoursSubtitle: "Henüz ödenmemiş raporlar",
    needHelpChat: "Yardıma mı ihtiyacınız var?",
    personalExportBtn: "BENİM Raporlarımı İndir (PDF)"
  }
};

let updated = false;

for (const [lang, keys] of Object.entries(translationsToAdd)) {
  // Find the block for the language
  const langStartRegex = new RegExp(`\\n\\s*${lang}:\\s*\\{`);
  const match = content.match(langStartRegex);
  if (match) {
      let startIndex = match.index + match[0].length;
      // find closing brace of this block
      let braceCount = 1;
      let endIndex = -1;
      for (let i = startIndex; i < content.length; i++) {
          if (content[i] === '{') braceCount++;
          if (content[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                  endIndex = i;
                  break;
              }
          }
      }
      
      let block = content.substring(match.index, endIndex);
      
      for (const [key, val] of Object.entries(keys)) {
          if (!block.includes(`${key}:`)) {
              // insert at the end of the block
              const insertStr = `    ${key}: "${val}",\n`;
              content = content.substring(0, endIndex) + insertStr + content.substring(endIndex);
              // adjust endIndex for next inserts
              endIndex += insertStr.length;
              updated = true;
              console.log(`Added ${key} to ${lang}`);
          } else {
             console.log(`Key ${key} already exists in ${lang}`);
          }
      }
  } else {
    console.log(`Language block for ${lang} not found`);
  }
}

if (updated) {
    fs.writeFileSync('src/translations.ts', content);
    console.log('Translations updated successfully.');
} else {
    console.log('No updates were needed.');
}
