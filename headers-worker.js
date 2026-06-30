/**
 * محلّل هيدرات الأمان — Cloudflare Worker
 * RAKANSTACK · راكان عبدالعزيز
 *
 * كيف تنشره (مجاني تماماً):
 * 1. سجّل في https://dash.cloudflare.com (مجاني)
 * 2. Workers & Pages → Create → Create Worker
 * 3. احذف الكود الموجود والصق هذا الملف كامل
 * 4. Deploy → انسخ الرابط (مثل https://headers.yourname.workers.dev)
 * 5. حط الرابط في متغيّر WORKER_URL داخل ملف headers-analyzer.html
 */

export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const { searchParams } = new URL(request.url);
    const target = searchParams.get('url');

    if (!target) {
      return json({ error: 'missing url parameter' }, 400, cors);
    }

    // basic validation
    let parsed;
    try {
      parsed = new URL(target);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      return json({ error: 'invalid url' }, 400, cors);
    }

    try {
      const res = await fetch(parsed.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': 'RAKANSTACK-HeaderScanner/1.0' },
        cf: { cacheTtl: 0 },
      });

      // collect response headers
      const headers = {};
      for (const [k, v] of res.headers.entries()) {
        headers[k] = v;
      }

      return json(
        {
          url: parsed.toString(),
          status: res.status,
          headers,
        },
        200,
        cors
      );
    } catch (e) {
      return json({ error: 'fetch failed: ' + e.message }, 502, cors);
    }
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
