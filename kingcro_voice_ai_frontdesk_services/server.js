// KingCRO Voice Service – server.js
// Minimal Express API for AI check-ins to Postgres

const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const AGENT_ID = process.env.AGENT_ID || 'bEhKKjApoVKKAMP3pftF';

// Railway auto-injects DB vars, or fill in manually for local
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'YOUR_DB_PASSWORD',
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'railway',
  ssl: { rejectUnauthorized: false },
});

app.use(bodyParser.json({ limit: '1mb' }));

// Health check
app.get('/health', (_, res) => res.send('OK'));

// Main AI check-in endpoint
app.post('/ai/checkin', async (req, res) => {
  // Step 1: Agent ID check
  const bodyAgentId = req.body && req.body.agent_id;
  if (bodyAgentId !== AGENT_ID) {
    return res.status(403).json({
      statusCode: 403,
      code: 'forbidden',
      message: `Invalid agent_id (got "${bodyAgentId || ''}")`,
    });
  }

  // Step 2: Data validation
  const data = req.body;
  const required = [
    'unit', 'guest_names', 'phone', 'guest_count',
    'check_in', 'agreement_accepted'
  ];
  for (const field of required) {
    if (!data[field]) {
      return res.status(400).json({
        statusCode: 400,
        code: 'bad_request',
        message: `Missing required field: ${field}`,
      });
    }
  }
  if (data.has_vehicle) {
    const vehicleFields = [
      'parking_stall', 'license_plate', 'car_make', 'car_model', 'car_color'
    ];
    for (const field of vehicleFields) {
      if (!data[field]) {
        return res.status(400).json({
          statusCode: 400,
          code: 'bad_request',
          message: `Missing vehicle field: ${field}`,
        });
      }
    }
  }

  // Step 3: DB Insert
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
        data.unit, data.guest_names, data.phone, data.guest_count, data.guest_type || null, data.has_vehicle || false,
        data.parking_stall || null, data.license_plate || null, data.car_make || null, data.car_model || null,
        data.car_color || null, data.car_year || null,
        data.check_in, data.check_out || null, data.agreement_accepted, data.residents || null
      ]
    );
    console.log('✅ Valid check-in:', data);
    return res.json({ stored: true });
  } catch (err) {
    console.error('DB insert error:', err);
    return res.status(500).json({
      statusCode: 500,
      code: 'db_error',
      message: err.message,
    });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 KingCRO Voice Service running on :${PORT}`));
