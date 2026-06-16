import { create } from 'zustand';
import { supabase } from './lib/supabase';
import { FleetItem, FuelLogItem, TripItem, Geofence, FinanceTransaction, Lead, LeadStatus, UserProfile } from './types';

interface FerppaState {
  fleet: FleetItem[];
  fuelLogs: FuelLogItem[];
  trips: TripItem[];
  geofences: Geofence[];
  financeTransactions: FinanceTransaction[];
  leads: Lead[];
  activeTab: string;
  loading: boolean;
  setActiveTab: (tab: string) => void;
  fetchData: () => Promise<void>;
  addFleetItem: (item: Omit<FleetItem, 'id'>) => Promise<FleetItem | null>;
  deleteFleetItem: (id: string) => Promise<void>;
  addFuelLog: (log: Omit<FuelLogItem, 'id' | 'total_value'>) => Promise<FuelLogItem | null>;
  deleteFuelLog: (id: string) => Promise<void>;
  addTrip: (trip: Omit<TripItem, 'id' | 'total_price'>) => Promise<TripItem | null>;
  deleteTrip: (id: string) => Promise<void>;
  addGeofence: (geo: Omit<Geofence, 'id' | 'created_at'>) => Promise<Geofence | null>;
  deleteGeofence: (id: string) => Promise<void>;
  addFinanceTransaction: (transaction: Omit<FinanceTransaction, 'id'>) => Promise<FinanceTransaction | null>;
  deleteFinanceTransaction: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<Lead | null>;
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  resetToDefaults: () => void;
  getWeeklyLimitsExceeded: () => Array<{
    fleetId: string;
    plate: string;
    model: string;
    driver: string;
    litersConsumed: number;
    limit: number;
    excess: number;
  }>;
  session: any | null;
  userProfile: UserProfile | null;
  setSession: (session: any | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  signOut: () => Promise<void>;
}

export const useFerppaStore = create<FerppaState>((set, get) => ({
  fleet: [],
  fuelLogs: [],
  trips: [],
  geofences: [],
  financeTransactions: [],
  leads: [],
  activeTab: 'dashboard',
  loading: true,
  session: null,
  userProfile: null,

  setSession: (session) => set({ session }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, userProfile: null });
  },

  setActiveTab: (tab: string) => set({ activeTab: tab }),

  fetchData: async () => {
    set({ loading: true });
    
    // Tenta buscar do Supabase
    try {
      const [
        { data: fleetData },
        { data: fuelData },
        { data: tripsData },
        { data: geoData },
        { data: financeData },
        { data: leadsData }
      ] = await Promise.all([
        supabase.from('fleet').select('*'),
        supabase.from('fuel_logs').select('*').order('date', { ascending: false }),
        supabase.from('trips').select('*').order('date', { ascending: false }),
        supabase.from('geofences').select('*').order('created_at', { ascending: false }),
        supabase.from('finance_transactions').select('*').order('date', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false })
      ]);

      set({
        fleet: fleetData || [],
        fuelLogs: fuelData || [],
        trips: tripsData || [],
        geofences: geoData || [],
        financeTransactions: financeData || [],
        leads: leadsData || [],
        loading: false
      });
    } catch (error) {
      console.error('Erro ao buscar dados do Supabase:', error);
      set({
        fleet: [],
        fuelLogs: [],
        trips: [],
        geofences: [],
        financeTransactions: [],
        leads: [],
        loading: false
      });
    }
  },

  addFleetItem: async (item) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    // Optimistic UI update
    set((state) => ({ fleet: [...state.fleet, newItem] }));
    
    const { data, error } = await supabase.from('fleet').insert([newItem]).select().single();
    if (error) console.error(error);
    return data || newItem;
  },

  deleteFleetItem: async (id) => {
    set((state) => ({
      fleet: state.fleet.filter(f => f.id !== id),
      fuelLogs: state.fuelLogs.filter(f => f.fleet_id !== id),
      trips: state.trips.filter(t => t.truck_id !== id)
    }));
    await supabase.from('fleet').delete().eq('id', id);
  },

  addFuelLog: async (log) => {
    const total_value = Number((log.liters * log.unit_price).toFixed(2));
    const newLog = { ...log, id: crypto.randomUUID(), total_value };
    set((state) => ({ fuelLogs: [newLog, ...state.fuelLogs] }));
    
    // Removemos total_value pois é GENERATED ALWAYS no Postgres
    const { total_value: _val, ...dbPayload } = newLog;
    const { data, error } = await supabase.from('fuel_logs').insert([dbPayload]).select().single();
    if (error) console.error(error);
    return data || newLog;
  },

  deleteFuelLog: async (id) => {
    set((state) => ({ fuelLogs: state.fuelLogs.filter(l => l.id !== id) }));
    await supabase.from('fuel_logs').delete().eq('id', id);
  },

  addTrip: async (trip) => {
    const total_price = Number((trip.volume_m3 * trip.unit_price).toFixed(2));
    const newTrip = { ...trip, id: crypto.randomUUID(), total_price };
    set((state) => ({ trips: [newTrip, ...state.trips] }));
    
    // Removemos total_price pois é GENERATED ALWAYS no Postgres
    const { total_price: _price, ...dbPayload } = newTrip;
    const { data, error } = await supabase.from('trips').insert([dbPayload]).select().single();
    if (error) console.error(error);
    return data || newTrip;
  },

  deleteTrip: async (id) => {
    set((state) => ({ trips: state.trips.filter(t => t.id !== id) }));
    await supabase.from('trips').delete().eq('id', id);
  },

  addGeofence: async (geo) => {
    const newGeo = { ...geo, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    set((state) => ({ geofences: [newGeo, ...state.geofences] }));
    
    const { data, error } = await supabase.from('geofences').insert([newGeo]).select().single();
    if (error) console.error(error);
    return data || newGeo;
  },

  deleteGeofence: async (id) => {
    set((state) => ({ geofences: state.geofences.filter(g => g.id !== id) }));
    await supabase.from('geofences').delete().eq('id', id);
  },

  addFinanceTransaction: async (transaction) => {
    const newTrans = { ...transaction, id: crypto.randomUUID() };
    set((state) => ({ financeTransactions: [newTrans, ...state.financeTransactions] }));
    
    const { data, error } = await supabase.from('finance_transactions').insert([newTrans]).select().single();
    if (error) console.error(error);
    return data || newTrans;
  },

  deleteFinanceTransaction: async (id) => {
    set((state) => ({ financeTransactions: state.financeTransactions.filter(f => f.id !== id) }));
    await supabase.from('finance_transactions').delete().eq('id', id);
  },

  addLead: async (lead) => {
    const newLead = { ...lead, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    set((state) => ({ leads: [newLead as Lead, ...state.leads] }));
    
    const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
    if (error) console.error(error);
    return data || newLead;
  },

  updateLeadStatus: async (id, status) => {
    // Optimistic UI Update
    set((state) => ({
      leads: state.leads.map(lead => lead.id === id ? { ...lead, status, updated_at: new Date().toISOString() } : lead)
    }));
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  },

  deleteLead: async (id) => {
    set((state) => ({ leads: state.leads.filter(l => l.id !== id) }));
    await supabase.from('leads').delete().eq('id', id);
  },

  resetToDefaults: () => {
    set({
      fleet: [],
      fuelLogs: [],
      trips: [],
      geofences: [],
      financeTransactions: [],
      leads: []
    });
  },

  getWeeklyLimitsExceeded: () => {
    const state = get();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weeklyUsageMap: Record<string, number> = {};
    
    state.fuelLogs.forEach(log => {
      const logDate = new Date(log.date + 'T12:00:00');
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

    state.fleet.forEach(item => {
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
  }
}));
