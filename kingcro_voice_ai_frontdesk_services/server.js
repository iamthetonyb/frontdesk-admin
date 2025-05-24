// KingCRO Voice Service – server.js
// Agentic Express API for Railway and AI check-ins

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// This is the token or agent_id your agent should use to auth
const BEARER_KEY = process.env.AI_BEARER || 'bEhKKjApoVKKAMP3pftF';

// Middleware
app.use(bodyParser.json({ limit: '1mb' }));

// Health check
app.get('/health', (_, res) => res.send('OK'));

// Check-in endpoint
app.post('/ai/checkin', (req, res) => {
  // Check Authorization header OR agent_id in JSON body
  const authHeader = req.headers.authorization;
  const agentId = req.body.agent_id ||
    (req.body.tool_metadata && req.body.tool_metadata.agent_id) ||
    (req.body.tool_payload && req.body.tool_payload.agent_id);

  if (
    (authHeader && authHeader === `Bearer ${BEARER_KEY}`) ||
    (agentId && agentId === BEARER_KEY)
  ) {
    // continue
  } else {
    return res.status(403).json({ statusCode: 403, code: 'forbidden', message: 'Invalid token' });
  }

  // Support both: whole body as checkin, or tool_payload inside the body
  const data = req.body.tool_payload ? req.body.tool_payload : req.body;

  // Minimal required fields for the demo
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

  // Optional: check vehicle fields
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

  // For demo, just log the check-in
  console.log('✅  New visitor check-in', JSON.stringify(data, null, 2));
  return res.json({ stored: true });
});

// Start server
app.listen(PORT, () => console.log(`🚀  KingCRO Voice Service running on :${PORT}`));
