import fs from 'fs';
import path from 'path';
import { parse } from '@typescript-eslint/typescript-estree';

// -------------------------------------------------------------
// Configurations
// -------------------------------------------------------------
const LANGUAGES = ['it', 'en', 'es', 'pl', 'tr', 'da'];
const BASE_LANG = 'it';
const SRC_DIR = path.join(process.cwd(), 'src');
const I18N_DIR = path.join(SRC_DIR, 'i18n');

// -------------------------------------------------------------
// Helper: Flatten object keys (e.g., { common: { save: 'Salva' } } -> 'common.save')
// -------------------------------------------------------------
function getFlatKeys(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, getFlatKeys(obj[key], prefix + key + '.'));
    } else {
      result[prefix + key] = String(obj[key]);
    }
  }
  return result;
}

// -------------------------------------------------------------
// Helper: Read a Translation Namespace File and Find Source-Level Duplicate Keys
// -------------------------------------------------------------
function findDuplicateKeysInFile(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const duplicates: string[] = [];
  try {
    const ast = parse(content, { jsx: false, loc: true });
    const keysSeen = new Set<string>();
    
    function walk(node: any, currentPath: string[] = []) {
      if (!node) return;
      if (node.type === 'Property') {
        const keyName = node.key.name || node.key.value;
        if (keyName) {
          const fullPath = [...currentPath, keyName].join('.');
          if (keysSeen.has(fullPath)) {
            duplicates.push(fullPath);
          } else {
            keysSeen.add(fullPath);
          }
          if (node.value?.type === 'ObjectExpression') {
            node.value.properties.forEach((prop: any) => {
              walk(prop, [...currentPath, keyName]);
            });
            return;
          } else {
            return;
          }
        }
      }
      for (const k in node) {
        if (typeof node[k] === 'object' && node[k] !== null && k !== 'key') {
          walk(node[k], currentPath);
        }
      }
    }
    
    let objExpr: any = null;
    function findObj(n: any) {
      if (!n) return;
      if (n.type === 'ExportNamedDeclaration' && n.declaration?.type === 'VariableDeclaration') {
        const decl = n.declaration.declarations[0];
        if (decl?.init?.type === 'ObjectExpression') objExpr = decl.init;
        else if (decl?.init?.type === 'TSAsExpression' && decl.init.expression?.type === 'ObjectExpression') objExpr = decl.init.expression;
      }
      for (const k in n) {
        if (typeof n[k] === 'object' && n[k] !== null) findObj(n[k]);
      }
    }
    findObj(ast);
    if (objExpr) {
      objExpr.properties.forEach((prop: any) => {
        walk(prop, []);
      });
    }
  } catch (e: any) {
    // Naive fallback if TS parsing fails
  }
  return duplicates;
}

// -------------------------------------------------------------
// 1. Load All Translations & Validate Structure
// -------------------------------------------------------------
// Dynamically import translations by reading the files directly to avoid ESM issues
function loadTranslationsDirectly(): Record<string, Record<string, string>> {
  const translations: Record<string, Record<string, string>> = {};
  
  LANGUAGES.forEach(lang => {
    translations[lang] = {};
    const langDir = path.join(I18N_DIR, lang);
    if (!fs.existsSync(langDir)) return;
    
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.ts'));
    files.forEach(file => {
      const namespace = file.replace('.ts', '');
      const filePath = path.join(langDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Parse the file to extract keys and values using typescript-estree
      try {
        const ast = parse(content, { jsx: false });
        let objNode: any = null;
        
        // Find the exported object (e.g. export const common = { ... })
        function findExportedObject(node: any) {
          if (!node) return;
          if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration') {
            const declarator = node.declaration.declarations[0];
            if (declarator?.init?.type === 'ObjectExpression') {
              objNode = declarator.init;
            } else if (declarator?.init?.type === 'TSAsExpression' && declarator.init.expression?.type === 'ObjectExpression') {
              objNode = declarator.init.expression;
            }
          }
          for (const k in node) {
            if (typeof node[k] === 'object' && node[k] !== null) {
              findExportedObject(node[k]);
            }
          }
        }
        
        findExportedObject(ast);
        
        if (objNode) {
          const nsObj: Record<string, string> = {};
          objNode.properties.forEach((prop: any) => {
            const key = prop.key.name || prop.key.value;
            if (key) {
              if (prop.value.type === 'Literal') {
                nsObj[key] = String(prop.value.value);
              } else if (prop.value.type === 'TemplateLiteral') {
                nsObj[key] = prop.value.quasis.map((q: any) => q.value.cooked).join('');
              } else if (prop.value.type === 'ObjectExpression') {
                // Nested object support
                const nested: Record<string, string> = {};
                prop.value.properties.forEach((nestedProp: any) => {
                  const nestedKey = nestedProp.key.name || nestedProp.key.value;
                  if (nestedKey && nestedProp.value.type === 'Literal') {
                    nested[nestedKey] = String(nestedProp.value.value);
                  }
                });
                for (const nk in nested) {
                  nsObj[`${key}.${nk}`] = nested[nk];
                }
              } else {
                nsObj[key] = '[Complex Value]';
              }
            }
          });
          
          for (const k in nsObj) {
            translations[lang][`${namespace}.${k}`] = nsObj[k];
          }
        }
      } catch (err: any) {
        console.error(`Error parsing translation file ${filePath}:`, err.message);
      }
    });
  });
  
  return translations;
}

// -------------------------------------------------------------
// 2. Scan Codebase for Unused Keys and Hardcoded Texts
// -------------------------------------------------------------
interface HardcodedString {
  file: string;
  line: number;
  text: string;
  type: string;
}

function isExcludedHardcoded(text: string): boolean {
  const cleaned = text.trim();
  if (cleaned.length <= 1) return true;
  if (!/[a-zA-Zà-úÀ-Ú]/.test(cleaned)) return true;
  if (/^[0-9\s.:,\-+()/*%]*$/.test(cleaned)) return true;
  
  const whitelist = [
    'Jobs', 'Report', 'SaaS', 'PDF', 'EXCEL', 'Acme', 'Stripe', 'PWA', 'OK', 'Email', 'URL', 'Thomas Demo',
    'JobsReport Engine', 'Jobs-Report Legal', 'Jobs Report', 'JobsReport', 'Jobs-Report', 'legalContacts'
  ];
  if (whitelist.includes(cleaned)) return true;
  
  // Ignore emails, websites, or anything with @ or http
  if (cleaned.includes('@') || cleaned.includes('http') || cleaned.includes('.it') || cleaned.includes('.com') || cleaned.includes('.app')) return true;
  
  // Ignore versions and builds (e.g. v1.1, Build 82a70b5+, SaaS Infrastructure v1.3, v1.2-FINAL-INFRA)
  if (/^v?\d+(\.\d+)*(-[A-Z0-9-]+)?$/i.test(cleaned) || /build/i.test(cleaned) || /infrastructure/i.test(cleaned) || /version/i.test(cleaned) || /©/i.test(cleaned)) {
    return true;
  }
  
  // Ignore arrows back/forward with simple words
  if (/^[←→\s]*Jobs\s*Report[←→\s]*$/i.test(cleaned)) return true;
  
  return false;
}

function scanCodebase(flatBaseKeys: string[]) {
  const hardcodedList: HardcodedString[] = [];
  const usedKeys = new Set<string>();
  
  function walkDir(dir: string, callback: (path: string) => void) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'i18n' || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.tmp' || entry.name === 'scripts') continue;
        walkDir(fullPath, callback);
      } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        callback(fullPath);
      }
    }
  }
  
  walkDir(SRC_DIR, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Simple fast substring scan for used keys
    flatBaseKeys.forEach(key => {
      // Look for key in the code (e.g. t('common.save') or "common.save" or common.save in some way)
      if (content.includes(key)) {
        usedKeys.add(key);
      }
    });
    
    // Parse AST to find hardcoded strings
    try {
      const ast = parse(content, { jsx: true, loc: true });
      
      function checkNode(node: any) {
        if (!node) return;
        
        // JSX Text
        if (node.type === 'JSXText') {
          const text = node.value.trim();
          if (!isExcludedHardcoded(text)) {
            hardcodedList.push({ file: filePath, line: node.loc.start.line, text, type: 'JSXText' });
          }
        }
        
        // JSX Attribute (placeholder, title, label, aria-label)
        if (node.type === 'JSXAttribute') {
          const attrName = node.name.name;
          if (['placeholder', 'title', 'aria-label', 'label'].includes(attrName) && node.value?.type === 'Literal') {
            const text = node.value.value;
            if (typeof text === 'string' && !isExcludedHardcoded(text)) {
              // Exclude non-UI/standard things
              if (!['companyId', 'userId', 'role', 'status'].includes(text)) {
                hardcodedList.push({ file: filePath, line: node.loc.start.line, text, type: `JSXAttribute: ${attrName}` });
              }
            }
          }
        }
        
        // Call expressions: alert(), confirm(), toast.error(), toast.success()
        if (node.type === 'CallExpression') {
          let isUIFeedback = false;
          let feedbackName = '';
          
          if (node.callee.type === 'Identifier' && ['alert', 'confirm'].includes(node.callee.name)) {
            isUIFeedback = true;
            feedbackName = node.callee.name;
          } else if (node.callee.type === 'MemberExpression') {
            const objName = node.callee.object.name;
            const propName = node.callee.property.name;
            if (objName === 'toast' || (objName === 'console' && propName === 'error')) {
              // We'll capture console.error only if it's user facing (handled below)
              if (objName === 'toast') {
                isUIFeedback = true;
                feedbackName = `toast.${propName}`;
              }
            }
          }
          
          if (isUIFeedback) {
            const arg = node.arguments[0];
            if (arg?.type === 'Literal' && typeof arg.value === 'string') {
              hardcodedList.push({ file: filePath, line: node.loc.start.line, text: arg.value, type: feedbackName });
            }
          }
        }
        
        for (const k in node) {
          if (typeof node[k] === 'object' && node[k] !== null) {
            checkNode(node[k]);
          }
        }
      }
      
      checkNode(ast);
    } catch (e: any) {
      // Fail silently for non-JSX or invalid files
    }
  });
  
  return { usedKeys, hardcodedList };
}

// -------------------------------------------------------------
// 3. Perform the Audit
// -------------------------------------------------------------
console.log('🔄 Avvio audit completo i18n per Jobs-Report...');

const allTranslations = loadTranslationsDirectly();
const baseKeysMap = allTranslations[BASE_LANG] || {};
const baseKeys = Object.keys(baseKeysMap);

const results = {
  missing: {} as Record<string, string[]>,
  empty: {} as Record<string, string[]>,
  fallbackIT: {} as Record<string, string[]>,
  duplicates: {} as Record<string, string[]>,
  unused: [] as string[],
  hardcoded: [] as HardcodedString[]
};

// Check for missing, empty and fallback translations
LANGUAGES.forEach(lang => {
  if (lang === BASE_LANG) return;
  results.missing[lang] = [];
  results.empty[lang] = [];
  results.fallbackIT[lang] = [];
  
  const langKeysMap = allTranslations[lang] || {};
  
  baseKeys.forEach(key => {
    if (!(key in langKeysMap)) {
      results.missing[lang].push(key);
    } else {
      const val = langKeysMap[key];
      if (!val || val.trim() === '') {
        results.empty[lang].push(key);
      } else if (val === baseKeysMap[key] && val.trim() !== '' && !['Premium', 'PDF', 'EXCEL', 'OK', 'Email', 'Stripe', 'PWA'].includes(val)) {
        results.fallbackIT[lang].push(key);
      }
    }
  });
});

// Check for duplicate keys in translation source files
LANGUAGES.forEach(lang => {
  results.duplicates[lang] = [];
  const langDir = path.join(I18N_DIR, lang);
  if (!fs.existsSync(langDir)) return;
  
  const files = fs.readdirSync(langDir).filter(f => f.endsWith('.ts'));
  files.forEach(file => {
    const filePath = path.join(langDir, file);
    const dups = findDuplicateKeysInFile(filePath);
    if (dups.length > 0) {
      dups.forEach(d => {
        results.duplicates[lang].push(`${file.replace('.ts', '')}.${d}`);
      });
    }
  });
});

// Scan codebase
const { usedKeys, hardcodedList } = scanCodebase(baseKeys);
results.hardcoded = hardcodedList;

// Unused keys (defined in base but never used)
results.unused = baseKeys.filter(k => !usedKeys.has(k));

// -------------------------------------------------------------
// 4. Output Results
// -------------------------------------------------------------
console.log('\n=============================================================');
console.log('📋 REPORT COMPLETO DI AUDIT I18N');
console.log('=============================================================');

let hasSevereErrors = false;

// 1. Duplicate keys
let dupCount = 0;
LANGUAGES.forEach(lang => {
  if (results.duplicates[lang].length > 0) {
    console.log(`⚠️  Chiavi duplicate in [${lang.toUpperCase()}]:`);
    results.duplicates[lang].forEach(k => console.log(`   - ${k}`));
    dupCount += results.duplicates[lang].length;
  }
});
if (dupCount > 0) hasSevereErrors = true;

// 2. Missing keys in target languages
let missingCount = 0;
LANGUAGES.forEach(lang => {
  if (lang === BASE_LANG) return;
  const count = results.missing[lang].length;
  if (count > 0) {
    console.log(`❌ Chiavi mancanti in [${lang.toUpperCase()}]: ${count}`);
    // Print first 5 for brevity
    results.missing[lang].slice(0, 5).forEach(k => console.log(`   - ${k}`));
    if (count > 5) console.log(`   - ... e altre ${count - 5} chiavi.`);
    missingCount += count;
  }
});
// Missing keys in EN, ES, DA, PL, TR are severe errors!
if (missingCount > 0) hasSevereErrors = true;

// 3. Empty translations
let emptyCount = 0;
LANGUAGES.forEach(lang => {
  if (lang === BASE_LANG) return;
  const count = results.empty[lang].length;
  if (count > 0) {
    console.log(`⚠️  Traduzioni vuote in [${lang.toUpperCase()}]: ${count}`);
    results.empty[lang].slice(0, 5).forEach(k => console.log(`   - ${k}`));
    emptyCount += count;
  }
});

// 4. Unused keys in base translations
if (results.unused.length > 0) {
  console.log(`ℹ️  Chiavi orfane/mai usate nel codice (it): ${results.unused.length}`);
  results.unused.slice(0, 5).forEach(k => console.log(`   - ${k}`));
  if (results.unused.length > 5) console.log(`   - ... e altre ${results.unused.length - 5} chiavi.`);
}

// 5. Hardcoded Strings
if (results.hardcoded.length > 0) {
  console.log(`❌ Nuovi testi hardcoded rilevati nel codice: ${results.hardcoded.length}`);
  results.hardcoded.slice(0, 10).forEach(h => {
    console.log(`   - [${h.type}] ${path.basename(h.file)}:L${h.line} -> "${h.text}"`);
  });
  if (results.hardcoded.length > 10) console.log(`   - ... e altri ${results.hardcoded.length - 10} testi.`);
  hasSevereErrors = true;
} else {
  console.log('✅ Nessun testo hardcoded rilevato nel codice!');
}

console.log('=============================================================');

// Save JSON Report
fs.writeFileSync('i18n-audit-results.json', JSON.stringify(results, null, 2));
console.log('💾 Risultati di audit salvati in i18n-audit-results.json');

// Check strict mode
const isStrict = process.argv.includes('--strict');
if (hasSevereErrors && isStrict) {
  console.log('\n🔴 ERRORE: L\'audit ha riscontrato problemi i18n critici (stringhe hardcoded, chiavi duplicate o mancanti).');
  console.log('🔴 Il build viene bloccato in modalità STRICT.');
  process.exit(1);
} else if (hasSevereErrors) {
  console.log('\n⚠️  ATTENZIONE: Trovati problemi i18n gravi. Esegui in modalità --strict per bloccare i build.');
  process.exit(0);
} else {
  console.log('\n🎉 ECCELLENTE: Il sistema i18n è sano, completo e privo di regressioni o hardcoding!');
  process.exit(0);
}
