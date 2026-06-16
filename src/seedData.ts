/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FleetItem, FleetType, FuelLogItem, TripItem, Geofence } from './types';

export const INITIAL_FLEET: FleetItem[] = [
  {
    id: 'f1',
    type: FleetType.CAMINHAO,
    plate: 'PQS-8921',
    model: 'Volvo FMX 460 Caçamba 16m³',
    driver_name: 'Marcos Souza',
    owner_name: 'Ferppa Logística',
    weekly_fuel_limit_liters: 350,
  },
  {
    id: 'f2',
    type: FleetType.CAMINHAO,
    plate: 'JUX-4122',
    model: 'Scania G440 Caçamba 14m³',
    driver_name: 'Antônio Ferreira',
    owner_name: 'TransAreia Terceirizados',
    weekly_fuel_limit_liters: 400,
  },
  {
    id: 'f3',
    type: FleetType.CAMINHAO,
    plate: 'KLU-3091',
    model: 'Mercedes-Benz Axor 3344',
    driver_name: 'Carlos Oliveira',
    owner_name: 'Ferppa Logística',
    weekly_fuel_limit_liters: 300,
  },
  {
    id: 'f4',
    type: FleetType.DRAGA,
    plate: 'DRAGA-01',
    model: 'Draga de Sucção Elétrica Cat 350',
    driver_name: 'Sérgio Ramos (Operador)',
    owner_name: 'Ferppa Extração',
    weekly_fuel_limit_liters: 800,
  },
  {
    id: 'f5',
    type: FleetType.DRAGA,
    plate: 'DRAGA-02',
    model: 'Draga Flutuante Cummins 6BT',
    driver_name: 'Roberto Dias (Operador)',
    owner_name: 'Ferppa Extração',
    weekly_fuel_limit_liters: 600,
  }
];

// Helper to get relative dates to ensure "Hoje", "7 dias", etc. work dynamically regardless of current year!
const getRelativeDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

export const INITIAL_FUEL_LOGS: FuelLogItem[] = [
  {
    id: 'fuel-1',
    fleet_id: 'f1', // PQS-8921 (Limit 350)
    control_number: 'AB-29402',
    date: getRelativeDate(1), // Ontem
    time: '07:30',
    gas_station: 'Auto Posto Caçula (Base)',
    odometer: 145200,
    fuel_type: 'Diesel S10',
    liters: 180,
    unit_price: 5.80,
    total_value: 1044.00,
    receipt_number: 'CF-119420',
    payment_method: 'A PRAZO / FATURADO',
  },
  {
    id: 'fuel-2',
    fleet_id: 'f1', // PQS-8921 (Limit 350) - triggers overlimit since 180 + 190 = 370 > 350
    control_number: 'AB-29511',
    date: getRelativeDate(3),
    time: '18:15',
    gas_station: 'Auto Posto Caçula (Base)',
    odometer: 144890,
    fuel_type: 'Diesel S10',
    liters: 190,
    unit_price: 5.80,
    total_value: 1102.00,
    receipt_number: 'CF-119631',
    payment_method: 'A PRAZO / FATURADO',
  },
  {
    id: 'fuel-3',
    fleet_id: 'f2', // JUX-4122 (Limit 400)
    control_number: 'AB-29405',
    date: getRelativeDate(2),
    time: '06:45',
    gas_station: 'Abastecimento Interno Draga 1',
    odometer: 89400,
    fuel_type: 'Diesel S10',
    liters: 220,
    unit_price: 5.75,
    total_value: 1265.00,
    receipt_number: 'CF-203912',
    payment_method: 'ESTOQUE INTERNO',
  },
  {
    id: 'fuel-4',
    fleet_id: 'f4', // DRAGA-01 (Limit 800)
    control_number: 'DR-1092',
    date: getRelativeDate(4),
    time: '11:00',
    gas_station: 'Balsa de Extração Rio Claro',
    odometer: 0, // Draga doesn't have odometer (hours instead)
    fuel_type: 'Diesel S10',
    liters: 550,
    unit_price: 5.90,
    total_value: 3245.00,
    receipt_number: 'NF-89021',
    payment_method: 'ESTOQUE INTERNO',
  },
  {
    id: 'fuel-5',
    fleet_id: 'f3', // KLU-3091 (Limit 300)
    control_number: 'AB-29621',
    date: getRelativeDate(0), // Hoje
    time: '08:00',
    gas_station: 'Auto Posto Caçula (Base)',
    odometer: 210150,
    fuel_type: 'Diesel S10',
    liters: 110,
    unit_price: 5.80,
    total_value: 638.00,
    receipt_number: 'CF-120038',
    payment_method: 'A PRAZO / FATURADO',
  }
];

export const INITIAL_TRIPS: TripItem[] = [
  {
    id: 'trip-1',
    truck_id: 'f1', // PQS-8921
    trip_number: 'TKT-9951',
    date: getRelativeDate(0), // Hoje
    departure_time: '08:15',
    arrival_time: '09:05',
    delivery_time: '09:10',
    product: 'RACHINHA',
    volume_m3: 16.0,
    unit_price: 85.00,
    total_price: 1360.00,
  },
  {
    id: 'trip-2',
    truck_id: 'f1', // PQS-8921
    trip_number: 'TKT-9952',
    date: getRelativeDate(0), // Hoje
    departure_time: '10:30',
    arrival_time: '11:20',
    delivery_time: '11:25',
    product: 'RACHINHA',
    volume_m3: 16.0,
    unit_price: 85.00,
    total_price: 1360.00,
  },
  {
    id: 'trip-3',
    truck_id: 'f2', // JUX-4122
    trip_number: 'TKT-9945',
    date: getRelativeDate(1), // Ontem
    departure_time: '07:00',
    arrival_time: '07:55',
    delivery_time: '08:00',
    product: 'AREIA MÉDIA',
    volume_m3: 14.0,
    unit_price: 55.00,
    total_price: 770.00,
  },
  {
    id: 'trip-4',
    truck_id: 'f2', // JUX-4122
    trip_number: 'TKT-9948',
    date: getRelativeDate(2),
    departure_time: '14:00',
    arrival_time: '14:50',
    delivery_time: '14:55',
    product: 'PEDRISCO',
    volume_m3: 14.0,
    unit_price: 65.00,
    total_price: 910.00,
  },
  {
    id: 'trip-5',
    truck_id: 'f3', // KLU-3091
    trip_number: 'TKT-9938',
    date: getRelativeDate(5),
    departure_time: '09:00',
    arrival_time: '10:10',
    delivery_time: '10:15',
    product: 'AREIA FINA',
    volume_m3: 12.0,
    unit_price: 52.00,
    total_price: 624.00,
  },
  {
    id: 'trip-6',
    truck_id: 'f3', // KLU-3091
    trip_number: 'TKT-9921',
    date: getRelativeDate(12), // 12 dias atrás
    departure_time: '11:00',
    arrival_time: '12:05',
    delivery_time: '12:10',
    product: 'RACHINHA',
    volume_m3: 12.0,
    unit_price: 85.00,
    total_price: 1020.00,
  },
  {
    id: 'trip-7',
    truck_id: 'f1', // PQS-8921
    trip_number: 'TKT-9850',
    date: getRelativeDate(20), // 20 dias atrás
    departure_time: '15:10',
    arrival_time: '16:00',
    delivery_time: '16:05',
    product: 'AREIA MÉDIA',
    volume_m3: 16.0,
    unit_price: 55.00,
    total_price: 880.00,
  }
];

export const INITIAL_GEOFENCES: Geofence[] = [
  {
    id: 'geo-1',
    name: 'Base Draga 01',
    type: 'EXTRACTION',
    latitude: -23.5505,
    longitude: -46.6333,
    radius_meters: 150,
    created_at: new Date().toISOString(),
  },
  {
    id: 'geo-2',
    name: 'Auto Posto Caçula (Base)',
    type: 'GAS_STATION',
    latitude: -23.5600,
    longitude: -46.6400,
    radius_meters: 100,
    created_at: new Date().toISOString(),
  },
  {
    id: 'geo-3',
    name: 'Obra Edifício X',
    type: 'DELIVERY',
    latitude: -23.5400,
    longitude: -46.6200,
    radius_meters: 150,
    created_at: new Date().toISOString(),
  }
];
