BEGIN;


-- using the UID created by firbase at login
CREATE TABLE IF NOT EXISTS users ( -- 
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  account_type TEXT,
  class_code TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS  portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Main',
  current_cash NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS  user_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stock_tic TEXT,
  purchase_price NUMERIC(15,2),
  price_difference NUMERIC(15,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;

