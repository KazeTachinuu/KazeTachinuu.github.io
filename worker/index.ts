// Cloudflare Worker with KV storage
// Deploy: cd worker && npx wrangler deploy
// KV namespace created via wrangler.toml

interface Env {
  COUNTS: KVNamespace;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return json({ error: 'not found' }, 404);

    const type = parts[0]; // "likes" or "hits"
    const slug = parts.slice(1).join('/');
    const key = `${type}:${slug}`;

    if (type !== 'likes' && type !== 'hits') {
      return json({ error: 'not found' }, 404);
    }

    if (request.method === 'POST') {
      const current = parseInt(await env.COUNTS.get(key) || '0', 10);
      const next = current + 1;
      await env.COUNTS.put(key, String(next));
      return json({ count: next });
    }

    // GET
    const count = parseInt(await env.COUNTS.get(key) || '0', 10);
    return json({ count });
  },
};
