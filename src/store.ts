import { create } from 'zustand';
import { supabase } from './lib/supabase';
import { FleetItem, FuelLogItem, TripItem, Geofence, FinanceTransaction, Lead, LeadStatus, UserProfile, LeadTask, LeadNote } from './types';

interface FerppaState {
  fleet: FleetItem[];
  fuelLogs: FuelLogItem[];
  trips: TripItem[];
  geofences: Geofence[];
  financeTransactions: FinanceTransaction[];
  leads: Lead[];
  leadTasks: LeadTask[];
  leadNotes: LeadNote[];
  activeTab: string;
  loading: boolean;
  setActiveTab: (tab: string) => void;
  fetchData: () => Promise<void>;
  addFleetItem: (item: Omit<FleetItem, 'id'>) => Promise<FleetItem | null>;
  updateFleetItem: (id: string, updates: Partial<Omit<FleetItem, 'id'>>) => Promise<void>;
  deleteFleetItem: (id: string) => Promise<void>;
  addFuelLog: (log: Omit<FuelLogItem, 'id' | 'total_value'>) => Promise<FuelLogItem | null>;
  updateFuelLog: (id: string, updates: Partial<Omit<FuelLogItem, 'id' | 'total_value'>>) => Promise<void>;
  deleteFuelLog: (id: string) => Promise<void>;
  addTrip: (trip: Omit<TripItem, 'id' | 'total_price'>) => Promise<TripItem | null>;
  updateTrip: (id: string, updates: Partial<Omit<TripItem, 'id' | 'total_price'>>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addGeofence: (geo: Omit<Geofence, 'id' | 'created_at'>) => Promise<Geofence | null>;
  deleteGeofence: (id: string) => Promise<void>;
  addFinanceTransaction: (transaction: Omit<FinanceTransaction, 'id'>) => Promise<FinanceTransaction | null>;
  updateFinanceTransaction: (id: string, updates: Partial<Omit<FinanceTransaction, 'id'>>) => Promise<void>;
  deleteFinanceTransaction: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<Lead | null>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addLeadTask: (task: Omit<LeadTask, 'id' | 'created_at'>) => Promise<void>;
  updateLeadTask: (id: string, updates: Partial<LeadTask>) => Promise<void>;
  deleteLeadTask: (id: string) => Promise<void>;
  addLeadNote: (note: Omit<LeadNote, 'id' | 'created_at'>) => Promise<void>;
  deleteLeadNote: (id: string) => Promise<void>;
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
  leadTasks: [],
  leadNotes: [],
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
        { data: leadsData },
        { data: leadTasksData },
        { data: leadNotesData }
      ] = await Promise.all([
        supabase.from('fleet').select('*'),
        supabase.from('fuel_logs').select('*').order('date', { ascending: false }),
        supabase.from('trips').select('*').order('date', { ascending: false }),
        supabase.from('geofences').select('*').order('created_at', { ascending: false }),
        supabase.from('finance_transactions').select('*').order('date', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('lead_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('lead_notes').select('*').order('created_at', { ascending: false })
      ]);

      set({
        fleet: fleetData || [],
        fuelLogs: fuelData || [],
        trips: tripsData || [],
        geofences: geoData || [],
        financeTransactions: financeData || [],
        leads: leadsData || [],
        leadTasks: leadTasksData || [],
        leadNotes: leadNotesData || [],
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
        leadTasks: [],
        leadNotes: [],
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

  updateFleetItem: async (id, updates) => {
    set((state) => ({
      fleet: state.fleet.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
    const { error } = await supabase.from('fleet').update(updates).eq('id', id);
    if (error) console.error('Erro ao atualizar frota:', error);
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

  updateFuelLog: async (id, updates) => {
    const total_value = updates.liters !== undefined && updates.unit_price !== undefined
      ? Number((updates.liters * updates.unit_price).toFixed(2))
      : undefined;
    const fullUpdates = total_value !== undefined ? { ...updates, total_value } : updates;
    set((state) => ({
      fuelLogs: state.fuelLogs.map(l => l.id === id ? { ...l, ...fullUpdates } : l)
    }));
    const { total_value: _tv, ...dbUpdates } = fullUpdates as any;
    const { error } = await supabase.from('fuel_logs').update(dbUpdates).eq('id', id);
    if (error) console.error('Erro ao atualizar abastecimento:', error);
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

  updateTrip: async (id, updates) => {
    const existing = get().trips.find(t => t.id === id);
    if (!existing) return;
    const volume_m3 = updates.volume_m3 ?? existing.volume_m3;
    const unit_price = updates.unit_price ?? existing.unit_price;
    const total_price = Number((volume_m3 * unit_price).toFixed(2));
    const fullUpdates = { ...updates, total_price };
    set((state) => ({
      trips: state.trips.map(t => t.id === id ? { ...t, ...fullUpdates } : t)
    }));
    const { total_price: _tp, ...dbUpdates } = fullUpdates as any;
    const { error } = await supabase.from('trips').update(dbUpdates).eq('id', id);
    if (error) console.error('Erro ao atualizar viagem:', error);
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

  updateFinanceTransaction: async (id, updates) => {
    set((state) => ({
      financeTransactions: state.financeTransactions.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
    const { error } = await supabase.from('finance_transactions').update(updates).eq('id', id);
    if (error) console.error('Erro ao atualizar transação:', error);
  },

  addLead: async (lead) => {
    const newLead = { ...lead, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    set((state) => ({ leads: [newLead as Lead, ...state.leads] }));
    
    const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
    if (error) console.error(error);
    return data || newLead;
  },

  updateLeadStatus: async (id, status) => {
    set((state) => ({
      leads: state.leads.map(lead => lead.id === id ? { ...lead, status, updated_at: new Date().toISOString() } : lead)
    }));
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  },

  updateLead: async (id, updates) => {
    set((state) => ({
      leads: state.leads.map(lead => lead.id === id ? { ...lead, ...updates, updated_at: new Date().toISOString() } : lead)
    }));
    await supabase.from('leads').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  },

  deleteLead: async (id) => {
    set((state) => ({ 
      leads: state.leads.filter(l => l.id !== id),
      leadTasks: state.leadTasks.filter(t => t.lead_id !== id),
      leadNotes: state.leadNotes.filter(n => n.lead_id !== id)
    }));
    await supabase.from('leads').delete().eq('id', id);
  },

  addLeadTask: async (task) => {
    const newTask = { ...task, id: crypto.randomUUID(), created_at: new Date().toISOString() } as LeadTask;
    set((state) => ({ leadTasks: [newTask, ...state.leadTasks] }));
    const { error } = await supabase.from('lead_tasks').insert([newTask]);
    if (error) console.error('Erro ao salvar tarefa:', error);
  },

  updateLeadTask: async (id, updates) => {
    set((state) => ({
      leadTasks: state.leadTasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
    const { error } = await supabase.from('lead_tasks').update(updates).eq('id', id);
    if (error) console.error('Erro ao atualizar tarefa:', error);
  },

  deleteLeadTask: async (id) => {
    set((state) => ({ leadTasks: state.leadTasks.filter(t => t.id !== id) }));
    await supabase.from('lead_tasks').delete().eq('id', id);
  },

  addLeadNote: async (note) => {
    const newNote = { ...note, id: crypto.randomUUID(), created_at: new Date().toISOString() } as LeadNote;
    set((state) => ({ leadNotes: [newNote, ...state.leadNotes] }));
    const { error } = await supabase.from('lead_notes').insert([newNote]);
    if (error) console.error('Erro ao salvar nota:', error);
  },

  deleteLeadNote: async (id) => {
    set((state) => ({ leadNotes: state.leadNotes.filter(n => n.id !== id) }));
    await supabase.from('lead_notes').delete().eq('id', id);
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
