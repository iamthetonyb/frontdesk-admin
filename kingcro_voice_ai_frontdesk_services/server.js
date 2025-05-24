/*  KingCRO Voice Service – server.js
 *  --------------------------------
 *  - GET  /health         → “OK”
 *  - POST /ai/checkin     → validates + logs visitor JSON
 *
 *  ENV:
 *      PORT           (Railway injects one automatically)
 *      BEARER_TOKEN   Bearer token you expect from Tixae / Make
 */

require('dotenv').config();           // optional – reads .env in local dev
const express     = require('express');
const bodyParser  = require('body-parser');

const app    = express();
const PORT   = process.env.PORT || 3000;
const TOKEN  = process.env.BEARER_TOKEN || process.env.AI_BEARER || 'bEhKKjApoVKKAMP3pftF';

app.use(bodyParser.json({ limit: '1mb' }));

/* ---------- health ---------- */
app.get('/health', (_, res) => res.send('OK'));
console.log('AUTH HEADER RECEIVED →', req.headers.authorization);

/* ---------- visitor check-in ---------- */
app.post('/ai/checkin', (req, res) => {
  // ── auth ───────────────────────────────────────
  if ((req.get('authorization') || '') !== `Bearer ${TOKEN}`) {
    return res.status(403).json({ statusCode: 403, code: 'forbidden', message: 'Invalid token' });
  }

  const data = req.body || {};

  // ── validation ─────────────────────────────────
  const required = [
    'unit', 'guest_names', 'phone', 'guest_count',
    'check_in', 'agreement_accepted',
  ];
  for (const f of required) {
    if (!data[f]) {
      return res
        .status(400)
        .json({ statusCode: 400, code: 'bad_request', message: `Missing required field: ${f}` });
    }
  }

  if (data.has_vehicle) {
    const vehicleReq = ['parking_stall', 'license_plate', 'car_make', 'car_model', 'car_color'];
    for (const f of vehicleReq) {
      if (!data[f]) {
        return res
          .status(400)
          .json({ statusCode: 400, code: 'bad_request', message: `Missing vehicle field: ${f}` });
      }
    }
  }

  // ── your DB / queue / webhook goes here ────────
  console.log('✅  New visitor check-in', JSON.stringify(data, null, 2));

  return res.json({ stored: true });
});

/* ---------- start ---------- */
app.listen(PORT, () => console.log(`🚀  KingCRO Voice Service running on :${PORT}`));
