// ───────────────────────────────────────────────────────────
// KingCRO Voice Service – QUICK-DEMO
// • Stores visit → Postgres
// • Immediately POSTs json → WP store-visit route
// • Logs everything
// ───────────────────────────────────────────────────────────
import express     from 'express';
import bodyParser  from 'body-parser';
import pg          from 'pg';
import fetch       from 'node-fetch';
import 'dotenv/config';

const PORT        = process.env.PORT || 3000;
const AI_BEARER   = process.env.AI_BEARER;
const WP_URL      = process.env.WP_WEBHOOK_URL;
const WP_TOKEN    = process.env.WP_WEBHOOK_TOKEN;

// ─── Postgres ───────────────────────────────────────────────
const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await pgPool.query(`
  CREATE TABLE IF NOT EXISTS visits_demo (
    id SERIAL PRIMARY KEY,
    ts TIMESTAMPTZ     DEFAULT now(),
    unit               TEXT,
    guest_names        TEXT,
    phone              TEXT,
    guest_count        INT,
    raw_payload        JSONB
  );
`);

// ─── Express ────────────────────────────────────────────────
const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

app.get('/health', (_,res) => res.send('OK'));

// MAIN demo endpoint
app.post('/ai/checkin', async (req, res) => {
  /* auth */
  const authHeader = req.headers.authorization;
const agentId = req.body.agent_id || (req.body.tool_metadata && req.body.tool_metadata.agent_id);

if (
  (authHeader && authHeader === `Bearer ${BEARER_KEY}`) ||
  (agentId && agentId === BEARER_KEY)
) {
  // Allow request
} else {
  return res.status(403).json({ statusCode: 403, code: 'forbidden', message: 'Invalid token' });
}

  const p = req.body?.tool_payload || req.body || {};
  const required = ['unit','guest_names','phone','guest_count'];
  for (const f of required) if (!p[f]) {
    return res.status(400).json({ statusCode:400, code:'bad_request', message:`Missing field: ${f}`});
  }

  /* save → Postgres */
  const { rows:[{ id }] } = await pgPool.query(
    'INSERT INTO visits_demo (unit,guest_names,phone,guest_count,raw_payload) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [p.unit, p.guest_names, p.phone, +p.guest_count, p]
  );

  /* forward → WordPress (fire-and-forget) */
  if (WP_URL) {
    fetch(WP_URL, {
      method : 'POST',
      headers: {
        'content-type' : 'application/json',
        'authorization': WP_TOKEN
      },
      body: JSON.stringify(p)
    })
    .then(r => r.text())
    .then(txt => console.log('→ WP response', txt))
    .catch(err => console.warn('WP forward failed', err.message));
  }

  console.log('✅ demo check-in stored id', id);
  return res.json({ stored:true, id });
});

// list for quick viewing
app.get('/api/demo', async (_,res)=>{
  const { rows } = await pgPool.query('SELECT * FROM visits_demo ORDER BY ts DESC LIMIT 100');
  res.json(rows);
});

app.listen(PORT, () => console.log(`🚀 Quick-demo service on :${PORT}`));
