/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { FleetItem, FuelLogItem, TripItem, FleetType, Geofence, FinanceTransaction } from './types';
import { INITIAL_FLEET, INITIAL_FUEL_LOGS, INITIAL_TRIPS, INITIAL_GEOFENCES } from './seedData';

// Constants for LocalStorage keys
const STORAGE_KEYS = {
  FLEET: 'ferppa_os_fleet_v1',
  FUEL_LOGS: 'ferppa_os_fuel_logs_v1',
  TRIPS: 'ferppa_os_trips_v1',
  GEOFENCES: 'ferppa_os_geofences_v1',
  FINANCE: 'ferppa_os_finance_v1'
};

export function getStoredData() {
  const storedFleet = localStorage.getItem(STORAGE_KEYS.FLEET);
  const storedFuel = localStorage.getItem(STORAGE_KEYS.FUEL_LOGS);
  const storedTrips = localStorage.getItem(STORAGE_KEYS.TRIPS);
  const storedGeofences = localStorage.getItem(STORAGE_KEYS.GEOFENCES);
  const storedFinance = localStorage.getItem(STORAGE_KEYS.FINANCE);

  return {
    fleet: storedFleet ? JSON.parse(storedFleet) as FleetItem[] : INITIAL_FLEET,
    fuelLogs: storedFuel ? JSON.parse(storedFuel) as FuelLogItem[] : INITIAL_FUEL_LOGS,
    trips: storedTrips ? JSON.parse(storedTrips) as TripItem[] : INITIAL_TRIPS,
    geofences: storedGeofences ? JSON.parse(storedGeofences) as Geofence[] : INITIAL_GEOFENCES,
    financeTransactions: storedFinance ? JSON.parse(storedFinance) as FinanceTransaction[] : []
  };
}

export function saveStoredData(fleet: FleetItem[], fuelLogs: FuelLogItem[], trips: TripItem[], geofences: Geofence[], financeTransactions: FinanceTransaction[]) {
  localStorage.setItem(STORAGE_KEYS.FLEET, JSON.stringify(fleet));
  localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(fuelLogs));
  localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  localStorage.setItem(STORAGE_KEYS.GEOFENCES, JSON.stringify(geofences));
  localStorage.setItem(STORAGE_KEYS.FINANCE, JSON.stringify(financeTransactions));
}

// Custom hook to manage the full state of Ferppa OS with LocalPersistence
export function useFerppaState() {
  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLogItem[]>([]);
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    const data = getStoredData();
    setFleet(data.fleet);
    setFuelLogs(data.fuelLogs);
    setTrips(data.trips);
    setGeofences(data.geofences);
    setFinanceTransactions(data.financeTransactions);
    setLoading(false);
  }, []);

  // Update localStorage whenever state changes
  const persist = (updatedFleet: FleetItem[], updatedFuel: FuelLogItem[], updatedTrips: TripItem[], updatedGeofences: Geofence[], updatedFinance: FinanceTransaction[]) => {
    setFleet(updatedFleet);
    setFuelLogs(updatedFuel);
    setTrips(updatedTrips);
    setGeofences(updatedGeofences);
    setFinanceTransactions(updatedFinance);
    saveStoredData(updatedFleet, updatedFuel, updatedTrips, updatedGeofences, updatedFinance);
  };

  const addFleetItem = (item: Omit<FleetItem, 'id'>) => {
    const newItem: FleetItem = {
      ...item,
      id: 'f-' + Math.random().toString(36).substring(2, 9)
    };
    persist([...fleet, newItem], fuelLogs, trips, geofences, financeTransactions);
    return newItem;
  };

  const deleteFleetItem = (id: string) => {
    // Also cleanup associated fuel logs and trips to maintain database referential integrity
    const updatedFleet = fleet.filter(f => f.id !== id);
    const updatedFuel = fuelLogs.filter(f => f.fleet_id !== id);
    const updatedTrips = trips.filter(t => t.truck_id !== id);
    persist(updatedFleet, updatedFuel, updatedTrips, geofences, financeTransactions);
  };

  const addFuelLog = (log: Omit<FuelLogItem, 'id' | 'total_value'>) => {
    const total_value = Number((log.liters * log.unit_price).toFixed(2));
    const newLog: FuelLogItem = {
      ...log,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      total_value
    };
    persist(fleet, [newLog, ...fuelLogs], trips, geofences, financeTransactions);
    return newLog;
  };

  const deleteFuelLog = (id: string) => {
    persist(fleet, fuelLogs.filter(l => l.id !== id), trips, geofences, financeTransactions);
  };

  const addTrip = (trip: Omit<TripItem, 'id' | 'total_price'>) => {
    const total_price = Number((trip.volume_m3 * trip.unit_price).toFixed(2));
    const newTrip: TripItem = {
      ...trip,
      id: 'trip-' + Math.random().toString(36).substring(2, 9),
      total_price
    };
    persist(fleet, fuelLogs, [newTrip, ...trips], geofences, financeTransactions);
    return newTrip;
  };

  const deleteTrip = (id: string) => {
    persist(fleet, fuelLogs, trips.filter(t => t.id !== id), geofences, financeTransactions);
  };

  const addGeofence = (geo: Omit<Geofence, 'id' | 'created_at'>) => {
    const newGeo: Geofence = {
      ...geo,
      id: 'geo-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };
    persist(fleet, fuelLogs, trips, [newGeo, ...geofences], financeTransactions);
    return newGeo;
  };

  const deleteGeofence = (id: string) => {
    persist(fleet, fuelLogs, trips, geofences.filter(g => g.id !== id), financeTransactions);
  };

  const addFinanceTransaction = (transaction: Omit<FinanceTransaction, 'id'>) => {
    const newTrans: FinanceTransaction = {
      ...transaction,
      id: 'fin-' + Math.random().toString(36).substring(2, 9)
    };
    persist(fleet, fuelLogs, trips, geofences, [newTrans, ...financeTransactions]);
    return newTrans;
  };

  const deleteFinanceTransaction = (id: string) => {
    persist(fleet, fuelLogs, trips, geofences, financeTransactions.filter(f => f.id !== id));
  };

  // Reset to default seed data
  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEYS.FLEET);
    localStorage.removeItem(STORAGE_KEYS.FUEL_LOGS);
    localStorage.removeItem(STORAGE_KEYS.TRIPS);
    localStorage.removeItem(STORAGE_KEYS.GEOFENCES);
    localStorage.removeItem(STORAGE_KEYS.FINANCE);
    setFleet(INITIAL_FLEET);
    setFuelLogs(INITIAL_FUEL_LOGS);
    setTrips(INITIAL_TRIPS);
    setGeofences(INITIAL_GEOFENCES);
    setFinanceTransactions([]);
  };

  // Helper calculation metrics:
  // Fuel consumed in the current calendar week (or last 7 days for robust calculation)
  // Let's implement active week check (based on modern JS date operations)
  const getWeeklyLimitsExceeded = () => {
    // Returns array of objects with fleet plate, name, liters used, and the cota
    // Group fuel logs of CAMINHAO in the current ISO week (or last 7 days, let's group by active calendar week starting Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday ...
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weeklyUsageMap: Record<string, number> = {};
    
    // Sum titers consumed during this specific week
    fuelLogs.forEach(log => {
      const logDate = new Date(log.date + 'T12:00:00'); // Prevent timezone offset shift
      if (logDate >= monday && logDate <= sunday) {
        weeklyUsageMap[log.fleet_id] = (weeklyUsageMap[log.fleet_id] || 0) + log.liters;
      }
    });

    const exceeded: Array<{
      fleetId: string;
      plate: string;
      model: string;
      driver: string;
      litersConsumed: number;
      limit: number;
      excess: number;
    }> = [];

    fleet.forEach(item => {
      const consumed = weeklyUsageMap[item.id] || 0;
      if (consumed > item.weekly_fuel_limit_liters) {
        exceeded.push({
          fleetId: item.id,
          plate: item.plate,
          model: item.model,
          driver: item.driver_name,
          litersConsumed: consumed,
          limit: item.weekly_fuel_limit_liters,
          excess: Number((consumed - item.weekly_fuel_limit_liters).toFixed(2))
        });
      }
    });

    return exceeded;
  };

  return {
    fleet,
    fuelLogs,
    trips,
    geofences,
    financeTransactions,
    activeTab,
    setActiveTab,
    loading,
    addFleetItem,
    deleteFleetItem,
    addFuelLog,
    deleteFuelLog,
    addTrip,
    deleteTrip,
    addGeofence,
    deleteGeofence,
    addFinanceTransaction,
    deleteFinanceTransaction,
    resetToDefaults,
    getWeeklyLimitsExceeded
  };
}
