/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPABASE_SQL_SCHEMA = `-- =====================================================================
-- FERPPA MINERAÇÃO - FERPPA OS DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Author: Senior Software Engineer & DB Architect
-- Date: 2026-06-15
-- Description: Core schema for logistics, fueling control, fleet, finance, and CRM.
-- Includes: Enums, Tables, Foreign Keys, Row Level Security (RLS) policies,
-- and automated triggers/generated columns for totals.
-- =====================================================================

-- 1. ENUM CONFIGURATION
CREATE TYPE fleet_type_enum AS ENUM ('CAMINHÃO CAÇAMBA', 'DRAGA DE EXTRAÇÃO', 'ESCAVADEIRA HIDRÁULICA', 'PÁ CARREGADEIRA', 'TRATOR DE ESTEIRA', 'CAMINHONETE APOIO');
CREATE TYPE geofence_type_enum AS ENUM ('EXTRACTION', 'DELIVERY', 'GAS_STATION', 'BASE');
CREATE TYPE transaction_type_enum AS ENUM ('DESPESA', 'RECEBIMENTO');
CREATE TYPE lead_status_enum AS ENUM ('NOVO', 'EM CONTATO', 'NEGOCIAÇÃO', 'CONVERTIDO', 'PERDIDO');

-- 2. CREATE CORE TABLES

-- FLEET TABLE (FROTA)
CREATE TABLE IF NOT EXISTS fleet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type fleet_type_enum NOT NULL DEFAULT 'CAMINHÃO CAÇAMBA',
    plate VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(255) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    weekly_fuel_limit_liters DECIMAL(10, 2) NOT NULL DEFAULT 400.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FUEL LOGS (ABASTECIMENTO)
CREATE TABLE IF NOT EXISTS fuel_logs (
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
    payment_method VARCHAR(100) NOT NULL DEFAULT 'A PRAZO / FATURADO',
    receipt_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRIPS (LOGÍSTICA & CUBAGEM)
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id UUID NOT NULL REFERENCES fleet(id) ON DELETE CASCADE,
    trip_number VARCHAR(100) NOT NULL UNIQUE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    departure_time TIME,
    arrival_time TIME,
    delivery_time TIME NOT NULL,
    product VARCHAR(150) NOT NULL,
    volume_m3 DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) GENERATED ALWAYS AS (volume_m3 * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- GEOFENCES (TELEMETRIA E RASTREAMENTO)
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type geofence_type_enum NOT NULL DEFAULT 'EXTRACTION',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 150,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- FINANCE TRANSACTIONS (FINANCEIRO DRE)
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type transaction_type_enum NOT NULL DEFAULT 'DESPESA',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payee VARCHAR(255) NOT NULL,
    category VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CRM LEADS (GESTÃO COMERCIAL)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255),
    status lead_status_enum NOT NULL DEFAULT 'NOVO',
    notes TEXT,
    source VARCHAR(150) DEFAULT 'Landing Page',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) FOR ENTERPRISE SECURITY
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 4. CREATE SECURITY POLICIES (Desabilitado / Permitir tudo durante fase de implantação inicial com Anon Key)
-- IMPORTANTE: Para o Ferppa OS com Anon Key, precisamos permitir operações anônimas
CREATE POLICY "Enable all operations for anon and authenticated users" ON fleet FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for anon and authenticated users" ON fuel_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for anon and authenticated users" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for anon and authenticated users" ON geofences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for anon and authenticated users" ON finance_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for anon and authenticated users" ON leads FOR ALL USING (true) WITH CHECK (true);

-- 5. ADVANCED DATABASE OPTIMIZATIONS (Indexes for Query Optimization)
CREATE INDEX IF NOT EXISTS idx_fleet_plate ON fleet(plate);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_fleet_id ON fuel_logs(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(date);
CREATE INDEX IF NOT EXISTS idx_trips_truck_id ON trips(truck_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_finance_date ON finance_transactions(date);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
`;
