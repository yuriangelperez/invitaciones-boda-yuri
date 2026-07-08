const getEnv = (name) => process.env[name];

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const json = (res, status, payload) => {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const supabaseRequest = async (path, options = {}) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${text}`);
  }

  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
};

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await supabaseRequest('playlist?select=*&order=created_at.desc');
      return json(res, 200, { data: data || [] });
    }

    if (req.method === 'POST') {
      const { cancion, cantante, motivo } = req.body || {};

      if (!cancion || !String(cancion).trim()) {
        return json(res, 400, { error: 'El campo cancion es obligatorio.' });
      }

      await supabaseRequest('playlist', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify([
          {
            cancion: String(cancion).trim(),
            cantante: cantante ? String(cantante).trim() : null,
            motivo: motivo ? String(motivo).trim() : null
          }
        ])
      });

      return json(res, 201, { ok: true });
    }

    if (req.method === 'DELETE') {
      const { id, all } = req.query || {};

      if (all === '1') {
        await supabaseRequest('playlist?id=gt.0', {
          method: 'DELETE',
          headers: { Prefer: 'return=minimal' }
        });
        return json(res, 200, { ok: true });
      }

      if (!id) {
        return json(res, 400, { error: 'Provide ?id=<id> or ?all=1.' });
      }

      await supabaseRequest(`playlist?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' }
      });

      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Unexpected server error.' });
  }
}
