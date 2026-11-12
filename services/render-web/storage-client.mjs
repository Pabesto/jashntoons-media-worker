// Server-only adapters. Existing D1/R2 records stay in place during the hosting move.
// Never retry mutations automatically: the first request might already have committed.
export function createStorageClient({origin, secret, request = fetch}) {
  const base = new URL(origin);
  if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw Error('Configure an HTTPS STORAGE_ORIGIN.');
  if (!secret || secret.length < 32) throw Error('Configure STORAGE_BRIDGE_SECRET.');
  async function call(action, {method = 'POST', body, key, range, contentType} = {}) {
    const url = new URL('/api/hosting/storage', base);
    url.searchParams.set('action', action);
    if (key !== undefined) url.searchParams.set('key', key);
    if (range) {
      url.searchParams.set('offset', String(range.offset));
      url.searchParams.set('length', String(range.length));
    }
    const response = await request(url, {method, body, redirect: 'error', cache: 'no-store',
      signal: AbortSignal.timeout(180000),
      headers: {Authorization: 'Bearer ' + secret, ...(contentType ? {'Content-Type': contentType} : {})}});
    if (response.status === 404 && ['get', 'head'].includes(action)) return null;
    if (!response.ok) throw Error('Storage request failed (' + response.status + ').');
    return response;
  }
  async function query(statements, mode, column) {
    const r = await call('sql', {body: JSON.stringify({statements, mode, column}), contentType: 'application/json'});
    return r.json();
  }
  class Statement {
    constructor(sql, params = []) { this.sql = sql; this.params = params; }
    bind(...params) { return new Statement(this.sql, params); }
    first(column) { return query([this], 'first', column); }
    all() { return query([this], 'all'); }
    run() { return query([this], 'run'); }
  }
  function metadata(response) {
    const raw = response.headers.get('x-jashntoons-object');
    if (!raw) throw Error('Storage returned no object metadata.');
    const value = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    return {...value, uploaded: new Date(value.uploaded)};
  }
  return {
    DB: {
      prepare(sql) { return new Statement(sql); },
      batch(statements) { return query(statements.map(s => ({sql:s.sql, params:s.params})), 'batch'); },
    },
    BUCKET: {
      async head(key) { const r = await call('head', {key, method:'HEAD'}); return r ? metadata(r) : null; },
      async get(key, options) {
        const r = await call('get', {key, method:'GET', range:options?.range});
        return r ? {...metadata(r), body:r.body, arrayBuffer:() => r.arrayBuffer(), text:() => r.text(), json:() => r.json()} : null;
      },
      async put(key, bytes, options) {
        // Reel exports and encoder uploads arrive as streams. Buffer only on the
        // 2 GB Node host so fetch sends a known Content-Length to the edge bridge.
        if (bytes && typeof bytes.getReader === 'function') {
          const reader = bytes.getReader(), chunks = []; let size = 0;
          try {
            while (true) {
              const {done, value} = await reader.read(); if (done) break;
              size += value.byteLength;
              if (size > 80000000) { await reader.cancel(); throw Error('Storage upload exceeds 80 MB.'); }
              chunks.push(value);
            }
          } finally { reader.releaseLock(); }
          bytes = Buffer.concat(chunks, size);
        }
        if (!(bytes instanceof ArrayBuffer) && !ArrayBuffer.isView(bytes) && typeof bytes !== 'string') throw Error('Storage uploads require a bounded buffer.');
        if ((typeof bytes === 'string' ? Buffer.byteLength(bytes) : bytes.byteLength) > 80000000) throw Error('Storage upload exceeds 80 MB.');
        const r = await call('put', {key, method:'PUT', body:bytes, contentType:options?.httpMetadata?.contentType || 'application/octet-stream'});
        return r.json();
      },
      async delete(key) {
        if (Array.isArray(key)) { for (const item of key) await this.delete(item); return; }
        await call('delete', {key, method:'DELETE'});
      },
    },
    async check() { const r = await call('health', {method:'GET'}); return r.json(); },
  };
}
