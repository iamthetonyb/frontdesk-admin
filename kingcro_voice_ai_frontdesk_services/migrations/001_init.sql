-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  unit VARCHAR(20) NOT NULL,
  guest_names TEXT NOT NULL,
  phone TEXT NOT NULL,
  guest_count INT,
  guest_type TEXT,
  has_vehicle BOOLEAN DEFAULT FALSE,
  parking_stall TEXT,
  license_plate TEXT,
  car_make TEXT,
  car_model TEXT,
  car_color TEXT,
  car_year TEXT,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  agreement_accepted TEXT,
  residents TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Residents table (optional lookup)
CREATE TABLE IF NOT EXISTS residents (
  id SERIAL PRIMARY KEY,
  unit VARCHAR(20),
  name TEXT,
  phone TEXT
);
