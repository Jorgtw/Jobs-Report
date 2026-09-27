import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({plugins:[{
  name:'isolated-calendar-fixture', enforce:'pre', resolveId(source) {
    if (source.endsWith('/supabase') || source==='./supabase') return path.resolve('scripts/fixtures/calendar-supabase.ts');
    if (source==='../App') return path.resolve('scripts/fixtures/calendar-shared.tsx');
  }
},react()], server:{host:'127.0.0.1',port:5187,strictPort:true}});
