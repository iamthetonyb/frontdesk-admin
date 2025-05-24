# KingCRO Voice Service (Railway ready)

Express/Node backend that stores visitor check‑ins from your AI concierge (VG, Vapi, etc.)  
and exposes a couple of helper endpoints.

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/health` | Simple health check. |
| `POST` | `/checkin` | Save visitor check‑in payload → **visits** table. |
| `GET`  | `/resident-lookup?unit={unit}&name={name}` | Verify resident name+unit against **residents** table. |

## Env vars

Railway injects PostgreSQL variables – you can also use `.env` locally.

```
DATABASE_URL=postgresql://postgres:****@host:5432/railway
PGSSL=true          # Railway PG requires SSL
PORT=3000
```

## Deploy on Railway (1‑click)

1. Click **Deploy from repo** in Railway and point at this repo/zip.  
2. Railway detects Node, installs deps, provisions Postgres automatically (thanks to `railway.json`).  
3. After first deploy, run the migration once:

```bash
railway run psql < migrations/001_init.sql
```

Or open the **Database → Query** UI and paste the SQL from _migrations/001_init.sql_.

## Using with AI agent tool

Configure your Agentic AI tool:

```
Tool URL: https://your-service--{DEPLOYMENT_ID}.up.railway.app/checkin
Method: POST
Headers: 
  Content-Type: application/json
Body: (raw JSON from your gather)
Bearer token header optional – add auth if desired.
```

Ensure your payload matches the required fields:
`unit, guest_names, phone, guest_count, check_in, agreement_accepted`

Everything else is optional but recommended if `has_vehicle=true`.

---

Happy shipping 🚀
