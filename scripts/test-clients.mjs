import { build } from 'esbuild';
import { unlink } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const scripts = path.dirname(fileURLToPath(import.meta.url));
const outfile = path.join(scripts, '.test-clients.generated.mjs');
try {
  await build({
    entryPoints: [path.join(scripts, 'test-clients.ts')], outfile,
    bundle: true, platform: 'node', format: 'esm', packages: 'external',
    plugins: [{ name: 'isolated-client-test', setup(builder) {
      builder.onLoad({ filter: /services[\\/]supabase\.ts$/ }, () => ({
        contents: "import {createClient} from '@supabase/supabase-js'; export const supabase=createClient('https://clients-test.invalid','test-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});",
        loader: 'ts'
      }));
    }}]
  });
  await import(pathToFileURL(outfile).href);
} finally {
  await unlink(outfile).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
