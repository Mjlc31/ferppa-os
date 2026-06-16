/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum FleetType {
  CAMINHAO = 'CAMINHÃO CAÇAMBA',
  DRAGA = 'DRAGA DE EXTRAÇÃO',
  ESCAVADEIRA = 'ESCAVADEIRA HIDRÁULICA',
  PADEIRA = 'PÁ CARREGADEIRA',
  TRATOR = 'TRATOR DE ESTEIRA',
  CAMINHONETE = 'CAMINHONETE APOIO',
}

export interface FleetItem {
  id: string;
  type: FleetType;
  plate: string;
  model: string;
  driver_name: string;
  owner_name: string;
  weekly_fuel_limit_liters: number;
}

export interface FuelLogItem {
  id: string;
  fleet_id: string; // References FleetItem.id
  control_number: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  gas_station: string;
  odometer: number;
  fuel_type: string; // default "Diesel S10"
  liters: number;
  unit_price: number;
  total_value: number;
  receipt_number: string;
  payment_method: string;
  receipt_image?: string; // Reference to a simulated or real receipt photo Base64/url
}

export interface TripItem {
  id: string;
  truck_id: string; // References FleetItem.id (type CAMINHÃO)
  trip_number: string;
  date: string; // YYYY-MM-DD
  departure_time: string; // HH:MM
  arrival_time: string; // HH:MM
  delivery_time: string; // HH:MM
  product: string;
  volume_m3: number;
  unit_price: number;
  total_price: number;
}

export type GeofenceType = 'EXTRACTION' | 'DELIVERY' | 'GAS_STATION' | 'BASE';

export interface Geofence {
  id: string;
  name: string;
  type: GeofenceType;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_at: string;
}

export type TransactionType = 'DESPESA' | 'RECEBIMENTO';

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  amount: number;
  payee: string; // "A quem foi pago" or "Quem pagou"
  category: string;
}

export interface TelemetryLog {
  id: string;
  truck_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  timestamp: string;
}

export type LeadStatus = 'NOVO' | 'EM CONTATO' | 'NEGOCIAÇÃO' | 'CONVERTIDO' | 'PERDIDO';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  status: LeadStatus;
  notes?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}
