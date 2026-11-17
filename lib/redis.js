import { Redis } from '@upstash/redis';

// Vercel's Upstash integration sets KV_REST_API_*; a manual Upstash setup uses UPSTASH_REDIS_REST_*.
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Tiny in-memory stand-in so `npm run dev` works with zero setup. NOT for production.
class Mem {
  d = new Map();
  c = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  async hset(k, o) { const h = this.d.get(k) || {}; Object.assign(h, this.c(o)); this.d.set(k, h); return 1; }
  async hsetnx(k, f, v) { const h = this.d.get(k) || {}; if (f in h) return 0; h[f] = this.c(v); this.d.set(k, h); return 1; }
  async hincrby(k, f, n) { const h = this.d.get(k) || {}; h[f] = (h[f] || 0) + n; this.d.set(k, h); return h[f]; }
  async hget(k, f) { return (this.d.get(k) || {})[f] ?? null; }
  async hgetall(k) { const h = this.d.get(k); return h ? { ...h } : null; }
  async hdel(k, f) { const h = this.d.get(k); if (h && f in h) { delete h[f]; return 1; } return 0; }
  async get(k) { return this.d.get(k) ?? null; }
  async set(k, v) { this.d.set(k, v); return 'OK'; }
  async incr(k) { const n = (this.d.get(k) || 0) + 1; this.d.set(k, n); return n; }
  async del(...ks) { ks.forEach(k => this.d.delete(k)); return ks.length; }
  async expire() { return 1; }
}

function make() {
  if (url && token) return new Redis({ url, token, enableAutoPipelining: true });
  if (process.env.VERCEL) throw new Error('Redis is not connected. Add the Upstash Redis integration to this Vercel project, then redeploy.');
  return (globalThis.__housieMem ??= new Mem());
}
export const redis = make();
