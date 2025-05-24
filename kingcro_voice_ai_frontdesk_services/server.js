// KingCRO Voice Service – server.js
// Agentic Express API for Railway and AI check-ins

import express from 'express';
import bodyParser from 'body-parser';
import pkg from 'pg';
const { Pool } = pkg;

// Fill in your Railway Postgres details or use env vars
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'YOUR_PW',
  host: process.env.PGHOST || 'YOUR_HOST',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'railway',
  ssl: { rejectUnauthorized: false },
});

const app = express();
const PORT = process.env.PORT || 3000;
const BEARER_KEY = process.env.AI_BEARER || 'bEhKKjApoVKKAMP3pftF';

app.use(bodyParser.json({ limit: '1mb' }));

app.get('/health', (_, res) => res.send('OK'));

app.post('/ai/checkin', async (req, res) => {
  if (req.headers.authorization !== `Bearer ${BEARER_KEY}`) {
    return res.status(403).json({ statusCode: 403, code: 'forbidden', message: 'Invalid token' });
  }
  const data = req.body ?? {};
  const required = [
    'unit', 'guest_names', 'phone', 'guest_count',
    'check_in', 'agreement_accepted'
  ];
  for (const field of required) {
    if (!data[field]) {
      return res.status(400).json({ statusCode: 400, code: 'bad_request', message: `Missing required field: ${field}` });
    }
  }
  // Optional vehicle validation
  if (data.has_vehicle) {
    const vehicleFields = ['parking_stall', 'license_plate', 'car_make', 'car_model', 'car_color'];
    for (const field of vehicleFields) {
      if (!data[field]) {
        return res.status(400).json({ statusCode: 400, code: 'bad_request', message: `Missing vehicle field: ${field}` });
      }
    }
  }
  // Insert into Postgres
  try {
    await pool.query(
      `INSERT INTO visits_demo (
        unit, guest_names, phone, guest_count, guest_type, has_vehicle,
        parking_stall, license_plate, car_make, car_model, car_color, car_year,
        check_in, check_out, agreement_accepted, residents
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      )`,
      [
        data.unit, data.guest_names, data.phone, data.guest_count, data.guest_type, data.has_vehicle,
        data.parking_stall, data.license_plate, data.car_make, data.car_model, data.car_color, data.car_year,
        data.check_in, data.check_out, data.agreement_accepted, data.residents
      ]
    );
    return res.json({ stored: true });
  } catch (err) {
    console.error('DB insert error:', err);
    return res.status(500).json({ statusCode: 500, code: 'db_error', message: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 KingCRO Voice Service running on :${PORT}`));
