-- MÓDULO 2: AUDITORIA ANTI-DESVIO (SQL Trigger + PostGIS)
-- Arquivo para ser rodado no SQL Editor do Supabase Ferppa OS

-- 1. Ativar a extensão PostGIS (se já não estiver ativa)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Tabela de Alertas (para registrar anomalias e desvios)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50), -- 'TRUCK'
    entity_id UUID,          -- truck_id
    alert_type VARCHAR(50),  -- 'GEOFENCE_VIOLATION'
    message TEXT,
    severity VARCHAR(20) DEFAULT 'HIGH',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Função do Trigger para Auditoria do Abastecimento
CREATE OR REPLACE FUNCTION audit_fuel_log_geofence()
RETURNS TRIGGER AS $$
DECLARE
    last_telemetry RECORD;
    target_geofence RECORD;
    distance_meters FLOAT;
    max_allowed_distance FLOAT := 300; -- 300 metros limite
BEGIN
    -- Obter a última coordenada de telemetria do caminhão (nos últimos 30 min, por exemplo)
    SELECT * INTO last_telemetry 
    FROM telemetry_logs 
    WHERE truck_id = NEW.truck_id
    ORDER BY timestamp DESC
    LIMIT 1;

    -- Se não houver telemetria recente, podemos pular a verificação ou gerar outro tipo de alerta
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Localizar a geofence do posto (buscando a mais próxima ou baseada no nome "gas_station" se inserido no log)
    -- Supondo que a string `gas_station` do OCR corresponda a um Posto cadastrado (Type = GAS_STATION)
    SELECT * INTO target_geofence
    FROM geofences
    WHERE type = 'GAS_STATION' AND name ILIKE '%' || NEW.gas_station || '%'
    LIMIT 1;

    -- Se o posto foi roteado no geofence
    IF FOUND THEN
        -- Calcula a distância em metros (SRID 4326 -> PostGIS) usando geometria/geography
        -- ST_Distance para POINT(longitude, latitude) convertido em tipo geography
        distance_meters := ST_Distance(
            ST_SetSRID(ST_MakePoint(last_telemetry.longitude, last_telemetry.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(target_geofence.longitude, target_geofence.latitude), 4326)::geography
        );

        -- Se a distância entre a posição do caminhão e o Posto for superior a 300 metros
        IF distance_meters > max_allowed_distance THEN
            -- Inserir flag/alerta anti-desvio
            INSERT INTO public.alerts (entity_type, entity_id, alert_type, message, severity)
            VALUES (
                'TRUCK', 
                NEW.truck_id, 
                'FUEL_DEVIATION_RISK', 
                'Risco de Desvio: Caminhão registrou abastecimento (R$ ' || NEW.total_value || ') no posto [' || NEW.gas_station || '], mas sua telemetria atual aponta para uma distância de ' || ROUND(distance_meters::numeric, 2) || ' metros do local.',
                'CRITICAL'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. O Trigger propriamente dito na tabela `fuel_logs`
DROP TRIGGER IF EXISTS trg_audit_fuel_geofence ON public.fuel_logs;

CREATE TRIGGER trg_audit_fuel_geofence
BEFORE INSERT ON public.fuel_logs
FOR EACH ROW
EXECUTE FUNCTION audit_fuel_log_geofence();
