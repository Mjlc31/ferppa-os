-- =====================================================================
-- FERPA MINERAÇÃO - FERPA OS DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Author: Senior Software Engineer & DB Architect
-- Date: 2026-06-15
-- Description: Core schema for logistics, fueling control, and fleet.
-- Includes: Enums, Tables, Foreign Keys, Row Level Security (RLS) policies,
-- and automated triggers/generated columns for totals.
-- =====================================================================

-- 0. CLEANUP (Optional / Development)
-- DROP TRIGGER IF EXISTS trg_calculate_fuel_total ON fuel_logs;
-- DROP TRIGGER IF EXISTS trg_calculate_trip_total ON trips;
-- DROP FUNCTION IF EXISTS check_fuel_limit();
-- DROP TABLE IF EXISTS trips;
-- DROP TABLE IF EXISTS fuel_logs;
-- DROP TABLE IF EXISTS fleet;
-- DROP TYPE IF EXISTS fleet_type_enum;

-- 1. ENUM CONFIGURATION
CREATE TYPE fleet_type_enum AS ENUM ('CAMINHÃO', 'DRAGA');

-- 2. CREATE core TABLES

-- FLEET TABLE
CREATE TABLE fleet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type fleet_type_enum NOT NULL DEFAULT 'CAMINHÃO',
    plate VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(255) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    weekly_fuel_limit_liters DECIMAL(10, 2) NOT NULL DEFAULT 400.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FUEL LOGS (Controle de Abastecimento)
CREATE TABLE fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_id UUID NOT NULL REFERENCES fleet(id) ON DELETE CASCADE,
    control_number VARCHAR(100) NOT NULL UNIQUE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    gas_station VARCHAR(255) NOT NULL,
    odometer INTEGER NOT NULL,
    fuel_type VARCHAR(100) NOT NULL DEFAULT 'Diesel S10',
    liters DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 4) NOT NULL,
    total_value DECIMAL(12, 2) GENERATED ALWAYS AS (liters * unit_price) STORED,
    receipt_number VARCHAR(150),
    receipt_image_url TEXT, -- URL pointing to Supabase storage bucket of receipt JPEG/PNG
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRIPS (Logística e Cubagem)
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id UUID NOT NULL REFERENCES fleet(id) ON DELETE CASCADE,
    trip_number VARCHAR(100) NOT NULL UNIQUE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    departure_time TIME,
    arrival_time TIME,
    delivery_time TIME NOT NULL,
    product VARCHAR(150) NOT NULL, -- Ex: "RACHINHA", "AREIA MÉDIA", "PEDRISCO"
    volume_m3 DECIMAL(10, 2) NOT NULL, -- Cubic meters delivered
    unit_price DECIMAL(10, 2) NOT NULL, -- Price per m3
    total_price DECIMAL(12, 2) GENERATED ALWAYS AS (volume_m3 * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) FOR ENTERPRISE SECURITY
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 4. CREATE SECURITY POLICIES (Example: Authenticated Users)

-- FLEET POLICIES
CREATE POLICY "Enable read/write for all authenticated users" ON fleet
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- FUEL LOGS POLICIES
CREATE POLICY "Enable read/write for all authenticated users" ON fuel_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- TRIPS POLICIES
CREATE POLICY "Enable read/write for all authenticated users" ON trips
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. ADVANCED DATABASE OPTIMIZATIONS (Indexes for Query Optimization)
CREATE INDEX idx_fleet_plate ON fleet(plate);
CREATE INDEX idx_fuel_logs_fleet_id ON fuel_logs(fleet_id);
CREATE INDEX idx_fuel_logs_date ON fuel_logs(date);
CREATE INDEX idx_trips_truck_id ON trips(truck_id);
CREATE INDEX idx_trips_date ON trips(date);

-- 6. DUMMY DATA SEEDING (Optional for Direct Supabase Provisioning)
/*
INSERT INTO fleet (type, plate, model, driver_name, owner_name, weekly_fuel_limit_liters) VALUES
('CAMINHÃO', 'PQS-8921', 'Volvo FMX 460 Caçamba 16m³', 'Marcos Souza', 'Ferppa Logística', 350.00),
('CAMINHÃO', 'JUX-4122', 'Scania G440 Caçamba 14m³', 'Antônio Ferreira', 'TransAreia Terceirizados', 400.00),
('DRAGA', 'DRAGA-01', 'Draga de Sucção Elétrica Cat 350', 'Sérgio Ramos (Operador)', 'Ferppa Extração', 800.00);
*/
