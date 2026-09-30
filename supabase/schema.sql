-- ==============================================================================
-- 🚌 Yatra Now — Supabase PostgreSQL Master Database Schema
-- Compatible with Free Tier Supabase (PostgreSQL 15+)
-- Features Row Level Security (RLS), Realtime Replication, and Cryptographic 2FA
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Tables Schema
-- ==============================================================================

-- 2.1 Users Table (Gov ID, 2FA, Role, License Documents)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(50) UNIQUE,
    gender VARCHAR(20) DEFAULT 'Male',
    dob DATE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('public', 'owner', 'crew', 'admin')),
    address TEXT,
    license_number VARCHAR(100),
    license_doc_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT TRUE,
    two_factor_secret TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Depots Table (State Transport Corporation & Private Bus Fleet Depots)
CREATE TABLE IF NOT EXISTS public.depots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    branch_code VARCHAR(50) UNIQUE NOT NULL,
    is_government BOOLEAN DEFAULT TRUE,
    total_buses INTEGER DEFAULT 0,
    active_buses INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 Buses Table (Live Telemetry, Speed, Delays, Sequential Stoppings)
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bus_number VARCHAR(50) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    depot_id UUID REFERENCES public.depots(id) ON DELETE SET NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'idle', 'breakdown', 'maintenance')),
    speed NUMERIC(5, 2) DEFAULT 0.0,
    bearing NUMERIC(5, 2) DEFAULT 0.0,
    delay_minutes INTEGER DEFAULT 0,
    current_stop_index INTEGER DEFAULT 0,
    driver_name VARCHAR(255),
    driver_mobile VARCHAR(50),
    driver_license VARCHAR(100),
    conductor_name VARCHAR(255),
    conductor_mobile VARCHAR(50),
    current_lat NUMERIC(10, 6) DEFAULT 12.9716,
    current_lng NUMERIC(10, 6) DEFAULT 77.5946,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4 Route Sequential Stops Table
CREATE TABLE IF NOT EXISTS public.route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE,
    stop_name VARCHAR(255) NOT NULL,
    lat NUMERIC(10, 6) NOT NULL,
    lng NUMERIC(10, 6) NOT NULL,
    stop_order INTEGER NOT NULL,
    scheduled_time VARCHAR(50) NOT NULL,
    actual_time VARCHAR(50) NOT NULL,
    delay_minutes INTEGER DEFAULT 0
);

-- 2.5 Incident & Breakdown Reports Table
CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE,
    issue_type VARCHAR(100) NOT NULL,
    description TEXT,
    reported_by VARCHAR(255) NOT NULL,
    reported_role VARCHAR(50) DEFAULT 'crew',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved')),
    visible_to_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.6 Two-Factor Authentication Challenges Table
CREATE TABLE IF NOT EXISTS public.two_factor_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_identifier VARCHAR(255) NOT NULL,
    otp_code_hash VARCHAR(255) NOT NULL,
    temp_token VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'public',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. Row-Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_challenges ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (Allow Commuters to read fleet, routes, stops, and alerts)
CREATE POLICY "Public buses are viewable by everyone" ON public.buses FOR SELECT USING (true);
CREATE POLICY "Public stops are viewable by everyone" ON public.route_stops FOR SELECT USING (true);
CREATE POLICY "Depots are viewable by everyone" ON public.depots FOR SELECT USING (true);
CREATE POLICY "Public incident alerts are viewable by everyone" ON public.incident_reports FOR SELECT USING (visible_to_public = true);

-- Allow Anonymous/Authenticated users to insert/update for demo mode
CREATE POLICY "Allow telemetry updates" ON public.buses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow incident creation" ON public.incident_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow 2FA challenges" ON public.two_factor_challenges FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. Enable Supabase Realtime Replication for Live GPS Telemetry
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.buses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_reports;

-- ==============================================================================
-- 5. Seed Initial Transit Data
-- ==============================================================================

-- Seed Depots
INSERT INTO public.depots (id, name, location, branch_code, is_government, total_buses, active_buses, verified)
VALUES 
    ('d1111111-1111-1111-1111-111111111111', 'Central City State Transport Depot', 'Majestic Hub, Central Junction', 'CSTD-01', true, 48, 36, true),
    ('d2222222-2222-2222-2222-222222222222', 'Metro Link Private Fleet Operators', 'North Bypass Highway Terminal', 'MLPF-09', false, 24, 18, true),
    ('d3333333-3333-3333-3333-333333333333', 'Eastern Suburban Transport Depot', 'Tech Valley Ring Road Terminal', 'ESTD-04', true, 30, 22, false)
ON CONFLICT (branch_code) DO NOTHING;

-- Seed Buses
INSERT INTO public.buses (id, name, bus_number, registration_number, depot_id, origin, destination, status, speed, bearing, delay_minutes, driver_name, driver_mobile, conductor_name, conductor_mobile, current_lat, current_lng)
VALUES 
    ('b1111111-1111-1111-1111-111111111111', 'City Superfast Express', '104-A', 'KA-01-F-9821', 'd1111111-1111-1111-1111-111111111111', 'Central Bus Terminal', 'Tech Valley Metro Complex', 'running', 42.0, 65.0, 0, 'Ramesh Kumar', '+91 94451 12345', 'Suresh Babu', '+91 94451 12346', 12.9716, 77.5946),
    ('b2222222-2222-2222-2222-222222222222', 'Rapid Metro Rider', '204-B', 'DL-01-AB-4509', 'd2222222-2222-2222-2222-222222222222', 'Airport Gateway Terminal', 'Central Railway Station', 'running', 54.0, 185.0, 14, 'Vikas Deshmukh', '+91 98231 65432', 'Mohan Lal', '+91 98231 65433', 12.9980, 77.5920),
    ('b3333333-3333-3333-3333-333333333333', 'Suburban Green Cruiser', '302-C', 'MH-12-Q-7788', 'd1111111-1111-1111-1111-111111111111', 'University North Gate', 'South End Circle', 'running', 38.0, 140.0, 8, 'Jagdish Rao', '+91 97123 44556', 'Anand Verma', '+91 97123 44557', 12.9645, 77.5855),
    ('b4444444-4444-4444-4444-444444444444', 'Eastern Interstate Shuttle', '505-X', 'TN-09-BK-3312', 'd3333333-3333-3333-3333-333333333333', 'Silk Board Junction', 'Tech Valley Metro Complex', 'idle', 0.0, 0.0, 0, 'K. Balaji', '+91 98840 99881', 'Pradeep Chandran', '+91 98840 99882', 12.9175, 77.6235)
ON CONFLICT (registration_number) DO NOTHING;

-- Seed Route Stops for Bus 101
INSERT INTO public.route_stops (bus_id, stop_name, lat, lng, stop_order, scheduled_time, actual_time, delay_minutes)
VALUES 
    ('b1111111-1111-1111-1111-111111111111', 'Central Bus Terminal', 12.9716, 77.5946, 1, '08:00 AM', '08:00 AM', 0),
    ('b1111111-1111-1111-1111-111111111111', 'Town Hall Circle', 12.9645, 77.5855, 2, '08:15 AM', '08:15 AM', 0),
    ('b1111111-1111-1111-1111-111111111111', 'Lalbagh West Gate', 12.9510, 77.5840, 3, '08:30 AM', '08:30 AM', 0),
    ('b1111111-1111-1111-1111-111111111111', 'South End Circle', 12.9360, 77.5790, 4, '08:45 AM', '08:45 AM', 0),
    ('b1111111-1111-1111-1111-111111111111', 'Silk Board Junction', 12.9175, 77.6235, 5, '09:05 AM', '09:05 AM', 0),
    ('b1111111-1111-1111-1111-111111111111', 'Tech Valley Metro Complex', 12.8950, 77.6550, 6, '09:30 AM', '09:30 AM', 0);

-- Seed Incident Report
INSERT INTO public.incident_reports (bus_id, issue_type, description, reported_by, reported_role, status, visible_to_public)
VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'Vehicle Breakdown',
    'Radiator coolant overheating near Hebbal Flyover. Mechanic team requested.',
    'Vikas Deshmukh (Driver)',
    'crew',
    'investigating',
    true
);
