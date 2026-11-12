import {createStorageClient} from './storage-client.mjs';

let storage: ReturnType<typeof createStorageClient> | undefined;
function client() {
  return storage ??= createStorageClient({origin:process.env.STORAGE_ORIGIN || '', secret:process.env.STORAGE_BRIDGE_SECRET || ''});
}

// This file replaces cloudflare:workers only in the native Next.js server build.
// No credential or database binding is exported into a browser bundle.
export const env = new Proxy({} as Cloudflare.Env, {
  get(_target, key) {
    if (key === 'DB') return client().DB;
    if (key === 'BUCKET') return client().BUCKET;
    return typeof key === 'string' ? process.env[key] : undefined;
  },
});
