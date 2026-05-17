import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const LANGUAGES = ['en', 'es', 'pl', 'tr', 'da'];
const BASE_LANG = 'it';
const SRC_DIR = path.join(process.cwd(), 'src');
const I18N_DIR = path.join(SRC_DIR, 'i18n');

function deepMerge(base: any, target: any, fallback: any): any {
  const result: any = { ...target };
  for (const key in base) {
    if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
      result[key] = deepMerge(base[key], target[key] || {}, fallback ? fallback[key] : undefined);
    } else {
      const targetVal = target[key];
      if (targetVal === undefined || targetVal === null || targetVal === '') {
        // Fallback to English if available, otherwise Italian
        const fbVal = (fallback && fallback[key] !== undefined && fallback[key] !== null && fallback[key] !== '') 
          ? fallback[key] 
          : base[key];
        result[key] = fbVal;
      }
    }
  }
  return result;
}

function serialize(obj: any, indent = 2): string {
  const spaces = ' '.repeat(indent);
  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }
  if (Array.isArray(obj)) {
    const items = obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        return ' '.repeat(indent + 2) + serialize(item, indent + 2);
      }
      return ' '.repeat(indent + 2) + serialize(item, indent + 2);
    });
    return `[\n${items.join(',\n')}\n${spaces}]`;
  }
  if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    const properties = keys.map(key => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
      return `${spaces}${safeKey}: ${serialize(obj[key], indent + 2)}`;
    });
    return `{\n${properties.join(',\n')}\n${' '.repeat(indent - 2)}}`;
  }
  return 'null';
}

async function runSync() {
  console.log('🔄 Sincronizzazione chiavi i18n mancanti...');
  
  const itDir = path.join(I18N_DIR, 'it');
  const files = fs.readdirSync(itDir).filter(f => f.endsWith('.ts'));

  for (const file of files) {
    const namespace = file.replace('.ts', '');
    
    // Import base (it) and fallback (en)
    const itPath = path.join(I18N_DIR, 'it', file);
    const itModule = await import(pathToFileURL(itPath).toString());
    const itData = itModule[namespace];

    let enData = {};
    try {
      const enPath = path.join(I18N_DIR, 'en', file);
      const enModule = await import(pathToFileURL(enPath).toString());
      enData = enModule[namespace];
    } catch (e) {
      // English file might be missing or build error, fallback to empty
    }

    for (const lang of LANGUAGES) {
      if (lang === BASE_LANG) continue;

      const langFilePath = path.join(I18N_DIR, lang, file);
      let langData = {};

      if (fs.existsSync(langFilePath)) {
        try {
          const langModule = await import(pathToFileURL(langFilePath).toString());
          langData = langModule[namespace];
        } catch (e) {
          console.warn(`⚠️ Impossibile importare ${lang}/${file}, verrà ricreato.`);
        }
      }

      // Merge target language with fallbacks
      const mergedData = deepMerge(itData, langData, enData);

      // Specific manual adjustments (e.g. italy translation)
      if (namespace === 'dashboard') {
        if (lang === 'es') mergedData.italy = 'España';
        if (lang === 'pl') mergedData.italy = 'Włochy';
        if (lang === 'tr') mergedData.italy = 'İtalya';
        if (lang === 'da') mergedData.italy = 'Italien';
      }

      // Write merged file back
      const serializedObj = serialize(mergedData, 2);
      const fileContent = `export const ${namespace} = ${serializedObj} as const;\n`;
      fs.writeFileSync(langFilePath, fileContent);
      console.log(`✅ Sincronizzato ${lang}/${file}`);
    }
  }

  console.log('🎉 Sincronizzazione completata con successo!');
}

runSync().catch(err => {
  console.error('❌ Errore durante la sincronizzazione:', err);
  process.exit(1);
});
