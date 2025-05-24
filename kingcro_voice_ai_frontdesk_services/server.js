require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
});

// health endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// check-in endpoint
app.post('/checkin', async (req, res) => {
  const payload = req.body;

  // basic required fields
  const required = ['unit','guest_names','phone','guest_count','check_in','agreement_accepted'];
  for (const field of required) {
    if(!payload[field]) {
      return res.status(400).json({ error: `Missing field: ${field}`});
    }
  }

  try {
    const text = """
      INSERT INTO visits
      (unit, guest_names, phone, guest_count, guest_type, has_vehicle, parking_stall,
       license_plate, car_make, car_model, car_color, car_year,
       check_in, check_out, agreement_accepted, residents)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id;
    ";
    const values = [
      payload.unit,
      payload.guest_names,
      payload.phone,
      parseInt(payload.guest_count || 0,10),
      payload.guest_type || null,
      payload.has_vehicle ?? false,
      payload.parking_stall || null,
      payload.license_plate || null,
      payload.car_make || null,
      payload.car_model || null,
      payload.car_color || null,
      payload.car_year || null,
      payload.check_in,
      payload.check_out || null,
      payload.agreement_accepted,
      payload.residents || null
    ];
    const {rows} = await pool.query(text, values);
    res.json({ stored: true, id: rows[0].id });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'db_error', detail: err.message });
  }
});

// resident lookup endpoint
app.get('/resident-lookup', async (req, res)=> {
  const { unit, name } = req.query;
  if(!unit || !name) return res.status(400).json({error:'unit and name required'});
  try {
    const { rows } = await pool.query(\"SELECT id, name FROM residents WHERE unit=$1 AND LOWER(name)=LOWER($2)\", [unit, name]);
    res.json({ valid: rows.length>0, matches: rows });
  } catch(err) {
    res.status(500).json({error:'db_error', detail: err.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`KingCRO service up on :${PORT}`));