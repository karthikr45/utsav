CREATE TABLE IF NOT EXISTS users (
 id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, password_hash text NOT NULL,
 role text NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','vendor','planner','operations','reviewer','support','finance','admin')),
 city text NOT NULL DEFAULT 'Hyderabad', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY,user_id text NOT NULL REFERENCES users(id),expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS businesses (
 id text PRIMARY KEY, owner_id text NOT NULL REFERENCES users(id),name text NOT NULL,kind text NOT NULL DEFAULT 'vendor',
 category text NOT NULL,city text NOT NULL,areas jsonb NOT NULL DEFAULT '[]',description text NOT NULL,image text NOT NULL,
 status text NOT NULL DEFAULT 'submitted' CHECK(status IN ('draft','submitted','changes_requested','approved','rejected','suspended')),
 price integer NOT NULL DEFAULT 0 CHECK(price>=0),tagline text NOT NULL DEFAULT '',verification text NOT NULL DEFAULT 'Review pending',
 review_note text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS business_members (business_id text REFERENCES businesses(id),user_id text REFERENCES users(id),role text NOT NULL CHECK(role IN ('owner','manager','worker','accounts')), PRIMARY KEY(business_id,user_id));
CREATE TABLE IF NOT EXISTS offerings (id text PRIMARY KEY,business_id text NOT NULL REFERENCES businesses(id),name text NOT NULL,description text NOT NULL,price integer NOT NULL CHECK(price>0),unit text NOT NULL DEFAULT 'package',inclusions jsonb NOT NULL,exclusions jsonb NOT NULL,image text NOT NULL,status text NOT NULL DEFAULT 'published');
CREATE TABLE IF NOT EXISTS events (id text PRIMARY KEY,owner_id text NOT NULL REFERENCES users(id),name text NOT NULL,type text NOT NULL,city text NOT NULL,date date NOT NULL,guests integer NOT NULL CHECK(guests>0),budget integer NOT NULL CHECK(budget>0),venue text NOT NULL DEFAULT '',status text NOT NULL DEFAULT 'planning',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS event_members (event_id text REFERENCES events(id),user_id text REFERENCES users(id),role text NOT NULL CHECK(role IN ('viewer','contributor','approver','planner')),spending_limit integer NOT NULL DEFAULT 0 CHECK(spending_limit>=0),PRIMARY KEY(event_id,user_id));
CREATE TABLE IF NOT EXISTS invitations (id text PRIMARY KEY,event_id text NOT NULL REFERENCES events(id),email text NOT NULL,role text NOT NULL,spending_limit integer NOT NULL DEFAULT 0,status text NOT NULL DEFAULT 'pending',expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days', UNIQUE(event_id,email));
CREATE TABLE IF NOT EXISTS quotes (id text PRIMARY KEY,event_id text NOT NULL REFERENCES events(id),business_id text NOT NULL REFERENCES businesses(id),offering_id text REFERENCES offerings(id),status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','sent','accepted','declined','expired')),amount integer NOT NULL DEFAULT 0 CHECK(amount>=0),scope text NOT NULL,note text NOT NULL DEFAULT '',version integer NOT NULL DEFAULT 1,expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS quote_versions (id text PRIMARY KEY,quote_id text NOT NULL REFERENCES quotes(id),version integer NOT NULL,amount integer NOT NULL,scope text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(quote_id,version));
CREATE TABLE IF NOT EXISTS bookings (id text PRIMARY KEY,event_id text NOT NULL REFERENCES events(id),business_id text NOT NULL REFERENCES businesses(id),quote_id text NOT NULL UNIQUE REFERENCES quotes(id),status text NOT NULL DEFAULT 'awaiting_payment' CHECK(status IN ('awaiting_payment','confirmed','in_progress','delivered','completed','cancel_requested','cancelled')),amount integer NOT NULL CHECK(amount>0),deposit integer NOT NULL CHECK(deposit>0),paid integer NOT NULL DEFAULT 0 CHECK(paid>=0),scope text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS reservations (business_id text REFERENCES businesses(id),event_date date NOT NULL,booking_id text NOT NULL UNIQUE REFERENCES bookings(id),PRIMARY KEY(business_id,event_date));
CREATE TABLE IF NOT EXISTS tasks (id text PRIMARY KEY,event_id text NOT NULL REFERENCES events(id),title text NOT NULL,done boolean NOT NULL DEFAULT false,due_date date);
CREATE TABLE IF NOT EXISTS messages (id text PRIMARY KEY,quote_id text NOT NULL REFERENCES quotes(id),sender_id text NOT NULL REFERENCES users(id),body text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS tickets (id text PRIMARY KEY,event_id text REFERENCES events(id),user_id text NOT NULL REFERENCES users(id),subject text NOT NULL,body text NOT NULL,status text NOT NULL DEFAULT 'open',reply text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS notifications (id text PRIMARY KEY,user_id text NOT NULL REFERENCES users(id),title text NOT NULL,body text NOT NULL,read boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS payments (id text PRIMARY KEY,booking_id text NOT NULL REFERENCES bookings(id),amount integer NOT NULL CHECK(amount>0),kind text NOT NULL CHECK(kind IN ('payment','refund','payout')),status text NOT NULL,reference text NOT NULL UNIQUE,created_by text REFERENCES users(id),approved_by text REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS changes (id text PRIMARY KEY,booking_id text NOT NULL REFERENCES bookings(id),requested_by text NOT NULL REFERENCES users(id),scope text NOT NULL,amount integer NOT NULL CHECK(amount>0),status text NOT NULL DEFAULT 'pending',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS reviews (id text PRIMARY KEY,booking_id text NOT NULL UNIQUE REFERENCES bookings(id),user_id text NOT NULL REFERENCES users(id),rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),body text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS audit (id text PRIMARY KEY,actor_id text REFERENCES users(id),action text NOT NULL,entity_id text NOT NULL,details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS auth_attempts (email text PRIMARY KEY,attempts integer NOT NULL DEFAULT 1,updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS event_owner_idx ON events(owner_id);
CREATE INDEX IF NOT EXISTS quote_business_idx ON quotes(business_id);
CREATE INDEX IF NOT EXISTS booking_event_idx ON bookings(event_id);
CREATE INDEX IF NOT EXISTS message_quote_idx ON messages(quote_id,created_at);
CREATE TABLE IF NOT EXISTS availability_blocks (id text PRIMARY KEY,business_id text NOT NULL REFERENCES businesses(id),date date NOT NULL,reason text NOT NULL,UNIQUE(business_id,date));
CREATE TABLE IF NOT EXISTS business_invitations (id text PRIMARY KEY,business_id text NOT NULL REFERENCES businesses(id),email text NOT NULL,role text NOT NULL CHECK(role IN ('manager','worker','accounts')),status text NOT NULL DEFAULT 'pending',expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',UNIQUE(business_id,email));
CREATE TABLE IF NOT EXISTS booking_assignments (booking_id text NOT NULL REFERENCES bookings(id),user_id text NOT NULL REFERENCES users(id),PRIMARY KEY(booking_id,user_id));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hold_until timestamptz DEFAULT now()+interval '30 minutes';
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_quote_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS active_booking_quote_idx ON bookings(quote_id) WHERE status<>'cancelled';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]';
ALTER TABLE quote_versions ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]';
CREATE TABLE IF NOT EXISTS documents (id text PRIMARY KEY,business_id text NOT NULL REFERENCES businesses(id),uploaded_by text NOT NULL REFERENCES users(id),name text NOT NULL,mime text NOT NULL,size integer NOT NULL,status text NOT NULL DEFAULT 'pending',review_note text NOT NULL DEFAULT '',reviewed_by text REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS guests (id text PRIMARY KEY,event_id text NOT NULL REFERENCES events(id),name text NOT NULL,email text NOT NULL DEFAULT '',party_size integer NOT NULL CHECK(party_size BETWEEN 1 AND 100),rsvp text NOT NULL DEFAULT 'pending' CHECK(rsvp IN ('pending','attending','declined')),dietary text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now());
