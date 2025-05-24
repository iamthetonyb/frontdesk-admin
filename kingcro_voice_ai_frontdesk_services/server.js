/* KingCRO Voice Service – server.js
   ---------------------------------
   Routes:
     GET  /health      → “OK”
     POST /ai/checkin  → validates & logs visitor JSON
   ENV:
     PORT        (Railway injects one automatically)
     AI_BEARER   Bearer token expected from the Tixae tool
*/

require('dotenv').config();
const express    = require('express');
const bodyParser = require('body-parser');

const app         = express();
const PORT        = process.env.PORT || 3000;
const BEARER_KEY  = process.env.AI_BEARER || 'bEhKKjApoVKKAMP3pftF';

app.use(bodyParser.json({ limit: '1mb' }));

/* ---------- health ---------- */
app.get('/health', (_req, res) => res.send('OK'));

/* optional root so Railway’s HTTP check doesn’t 404 */
app.get('/', (_req, res) => res.send('KingCRO Voice Service'));

/* ---------- visitor check-in ---------- */
app.post('/ai/checkin', (req, res) => {
  /* --- auth --------------------------------------------------------- */
  const authHeader = (req.headers.authorization || '').trim();
  const [scheme, token] = authHeader.split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || token !== BEARER_KEY) {
    return res
      .status(403)
      .json({ statusCode: 403, code: 'forbidden', message: 'Invalid token' });
  }

  /* --- validate body ------------------------------------------------ */
  const data = req.body || {};
  const required = [
    'unit', 'guest_names', 'phone', 'guest_count',
    'check_in', 'agreement_accepted'
  ];

  for (const f of required) {
    if (!data[f]) {
      return res
        .status(400)
        .json({ statusCode: 400, code: 'bad_request', message: `Missing required field: ${f}` });
    }
  }

  if (data.has_vehicle) {
    const veh = ['parking_stall', 'license_plate', 'car_make', 'car_model', 'car_color'];
    for (const f of veh) {
      if (!data[f]) {
        return res
          .status(400)
          .json({ statusCode: 400, code: 'bad_request', message: `Missing vehicle field: ${f}` });
      }
    }
  }

  /* --- store / queue / forward ------------------------------------- */
  console.log('✅ VISITOR CHECK-IN\n', JSON.stringify(data, null, 2));

  return res.json({ stored: true });
});

/* ---------- start ---------- */
app.listen(PORT, () => console.log(`🚀  KingCRO Voice Service listening on :${PORT}`));
