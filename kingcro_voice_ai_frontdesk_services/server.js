/*  KingCRO Voice Service – server.js
 *  Minimal Express API for Railway
 *  --------------------------------
 *  - GET  /health         → “OK”
 *  - POST /ai/checkin     → validates + logs visitor JSON
 *  --------------------------------
 *  ENV:
 *      PORT        (optional – Railway injects one)
 *      AI_BEARER   Bearer token you expect from your AI agent
 */
// auth check
const bearer = req.get('authorization') || '';
const expected = `Bearer ${process.env.BEARER_TOKEN}`;
if (bearer !== expected) {
  return res.status(403).json({ error: 'Forbidden' });
}

import express from 'express';
import bodyParser from 'body-parser';

const app        = express();
const PORT       = process.env.PORT || 3000;
const BEARER_KEY = process.env.AI_BEARER || 'bEhKKjApoVKKAMP3pftF';

app.use(bodyParser.json({ limit: '1mb' }));

/* ---------- health ---------- */
app.get('/health', (_, res) => res.send('OK'));

/* ---------- visitor check-in ---------- */
app.post('/ai/checkin', (req, res) => {
  if (req.headers.authorization !== `Bearer ${BEARER_KEY}`) {
    return res.status(403).json({ statusCode: 403, code: 'forbidden', message: 'Invalid token' });
  }

  const data = req.body ?? {};
  const required = [
    'unit', 'guest_names', 'phone', 'guest_count',
    'check_in', 'agreement_accepted',
  ];

  for (const field of required) {
    if (!data[field]) {
      return res
        .status(400)
        .json({ statusCode: 400, code: 'bad_request', message: `Missing required field: ${field}` });
    }
  }

  // Optional vehicle validation
  if (data.has_vehicle) {
    const vehicleFields = ['parking_stall', 'license_plate', 'car_make', 'car_model', 'car_color'];
    for (const field of vehicleFields) {
      if (!data[field]) {
        return res
          .status(400)
          .json({ statusCode: 400, code: 'bad_request', message: `Missing vehicle field: ${field}` });
      }
    }
  }

  /* ---------- your DB / queue / webhook goes here ---------- */
  console.log('✅  New visitor check-in', JSON.stringify(data, null, 2));

  return res.json({ stored: true });
});

/* ---------- start ---------- */
app.listen(PORT, () => console.log(`🚀  KingCRO Voice Service running on :${PORT}`));
