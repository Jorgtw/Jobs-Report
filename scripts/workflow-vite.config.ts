import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({plugins:[{name:'isolated-workflow',enforce:'pre',resolveId(source){
 if(source.endsWith('/supabase') || source==='./supabase') return path.resolve('scripts/fixtures/workflow-supabase.ts');
 if(source==='../App') return path.resolve('scripts/fixtures/calendar-shared.tsx');
 if(source.endsWith('/useSubscription')) return path.resolve('scripts/fixtures/workflow-subscription.ts');
}},react()],server:{host:'127.0.0.1',port:5189,strictPort:true}});
