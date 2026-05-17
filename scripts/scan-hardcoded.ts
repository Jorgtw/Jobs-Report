import { parse } from '@typescript-eslint/typescript-estree';
import fs from 'fs';
import path from 'path';

function findHardcodedStrings(node: any, file: string, results: any[]) {
  if (!node) return;

  // JSX Text
  if (node.type === 'JSXText') {
    const text = node.value.trim();
    if (text.length > 1 && /[a-zA-Z]/.test(text)) {
      results.push({ file, line: node.loc.start.line, text, type: 'JSXText' });
    }
  }

  // JSX Attributes like placeholder, title, aria-label
  if (node.type === 'JSXAttribute') {
    const name = node.name.name;
    if (['placeholder', 'title', 'aria-label', 'label'].includes(name) && node.value?.type === 'Literal') {
      const text = node.value.value;
      if (typeof text === 'string' && text.length > 1 && /[a-zA-Z]/.test(text)) {
        results.push({ file, line: node.loc.start.line, text, type: `JSXAttribute: ${name}` });
      }
    }
  }

  // alert, toast
  if (node.type === 'CallExpression') {
    let isTargetCall = false;
    if (node.callee.type === 'Identifier' && ['alert', 'toast'].includes(node.callee.name)) {
      isTargetCall = true;
    }
    if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'error' && node.callee.object.name === 'console') {
      // maybe ignore console.error for now, but user asked for console user-facing
    }
    
    if (isTargetCall) {
      const arg = node.arguments[0];
      if (arg?.type === 'Literal' && typeof arg.value === 'string') {
        results.push({ file, line: node.loc.start.line, text: arg.value, type: `CallExpression: ${node.callee.name}` });
      }
    }
  }

  for (const key in node) {
    if (typeof node[key] === 'object' && node[key] !== null) {
      findHardcodedStrings(node[key], file, results);
    }
  }
}

function walkDir(dir: string, callback: (path: string) => void) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      callback(fullPath);
    }
  }
}

const results: any[] = [];
const srcDir = path.join(process.cwd(), 'src');

walkDir(srcDir, (filePath) => {
  if (filePath.includes('/i18n/')) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    const ast = parse(content, { jsx: true, loc: true });
    findHardcodedStrings(ast, filePath, results);
  } catch (e: any) {
    console.error(`Error parsing ${filePath}: ${e.message}`);
  }
});

fs.writeFileSync('hardcoded-report.json', JSON.stringify(results, null, 2));
console.log('Found', results.length, 'hardcoded strings.');
