/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Calendar, Filter, CheckCircle, Calculator, Info, Edit, Trash2, X, Save } from 'lucide-react';
import { FleetType, TripItem } from '../types';
import { toast } from 'sonner';
import { useFerppaStore } from '../store';
import ConfirmDeleteModal from './ConfirmDeleteModal';

type PeriodFilterType = 'HOJE' | '7_DIAS' | '15_DIAS' | 'MES_ATUAL' | 'TODOS';

export default function ModuloLogistica() {
  const { fleet, trips, addTrip, deleteTrip, updateTrip, userProfile } = useFerppaStore();
  const isAdmin = userProfile?.role === 'ADMIN';

  // Form State (novo lançamento)
  const [truckId, setTruckId] = useState('');
  const [tripNumber, setTripNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('08:00');
  const [arrivalTime, setArrivalTime] = useState('08:50');
  const [deliveryTime, setDeliveryTime] = useState('08:55');
  const [product, setProduct] = useState('RACHINHA');
  const [volume, setVolume] = useState('');
  const [unitPrice, setUnitPrice] = useState('85.00');

  // UI States
  const [period, setPeriod] = useState<PeriodFilterType>('TODOS');
  const [searchTruck, setSearchTruck] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // ─── Edit Modal State ───────────────────────────────────────────────────────
  const [editingTrip, setEditingTrip] = useState<TripItem | null>(null);
  const [editTruckId, setEditTruckId] = useState('');
  const [editTripNumber, setEditTripNumber] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDepartureTime, setEditDepartureTime] = useState('');
  const [editArrivalTime, setEditArrivalTime] = useState('');
  const [editDeliveryTime, setEditDeliveryTime] = useState('');
  const [editProduct, setEditProduct] = useState('');
  const [editVolume, setEditVolume] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ─── Delete Modal State ─────────────────────────────────────────────────────
  const [deletingTrip, setDeletingTrip] = useState<TripItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-calculate total price live
  const calculatedTotal = Number(volume) > 0 && Number(unitPrice) > 0
    ? (Number(volume) * Number(unitPrice)).toFixed(2)
    : '0.00';

  const editCalculatedTotal = Number(editVolume) > 0 && Number(editUnitPrice) > 0
    ? (Number(editVolume) * Number(editUnitPrice)).toFixed(2)
    : '0.00';

  // Preset ticket format on open
  useEffect(() => {
    if (!tripNumber) {
      setTripNumber('TKT-' + Math.floor(10000 + Math.random() * 90000));
    }
  }, [tripNumber, showForm]);

  // Close edit modal on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingTrip(null);
    };
    if (editingTrip) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editingTrip]);

  const availableTrucks = fleet.filter(f => f.type === FleetType.CAMINHAO);

  const openEdit = (trip: TripItem) => {
    setEditingTrip(trip);
    setEditTruckId(trip.truck_id);
    setEditTripNumber(trip.trip_number);
    setEditDate(trip.date);
    setEditDepartureTime(trip.departure_time);
    setEditArrivalTime(trip.arrival_time);
    setEditDeliveryTime(trip.delivery_time);
    setEditProduct(trip.product);
    setEditVolume(String(trip.volume_m3));
    setEditUnitPrice(String(trip.unit_price));
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    if (!editTruckId || !editTripNumber || !editVolume || !editUnitPrice) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setIsSaving(true);
    try {
      await updateTrip(editingTrip.id, {
        truck_id: editTruckId,
        trip_number: editTripNumber,
        date: editDate,
        departure_time: editDepartureTime,
        arrival_time: editArrivalTime,
        delivery_time: editDeliveryTime,
        product: editProduct,
        volume_m3: parseFloat(editVolume),
        unit_price: parseFloat(editUnitPrice),
      });
      toast.success('Ticket atualizado com sucesso!', { description: `${editTripNumber} foi salvo.` });
      setEditingTrip(null);
    } catch {
      toast.error('Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTrip) return;
    setIsDeleting(true);
    try {
      await deleteTrip(deletingTrip.id);
      toast.success(`Ticket ${deletingTrip.trip_number} excluído.`);
      setDeletingTrip(null);
    } catch {
      toast.error('Erro ao excluir ticket.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckId || !tripNumber || !volume || !unitPrice) {
      toast.error('Por favor preencha todos os campos obrigatórios (*).');
      return;
    }

    addTrip({
      truck_id: truckId,
      trip_number: tripNumber,
      date,
      departure_time: departureTime,
      arrival_time: arrivalTime,
      delivery_time: deliveryTime,
      product,
      volume_m3: parseFloat(volume),
      unit_price: parseFloat(unitPrice)
    });

    setFormSuccess(true);
    toast.success('Viagem registrada com sucesso!', {
      description: `Ticket ${tripNumber} | ${volume}m³ de ${product} logado.`,
    });

    setTimeout(() => { setFormSuccess(false); }, 4000);

    setTruckId('');
    setTripNumber('TKT-' + Math.floor(10000 + Math.random() * 90000));
    setVolume('');
    setShowForm(false);
  };

  // Filter helpers
  const filterByPeriod = (itemDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(itemDate + 'T12:00:00');

    if (period === 'HOJE') {
      return itemDate === today.toISOString().split('T')[0];
    }
    if (period === '7_DIAS') {
      const ago = new Date(today); ago.setDate(today.getDate() - 7);
      return checkDate >= ago && checkDate <= new Date();
    }
    if (period === '15_DIAS') {
      const ago = new Date(today); ago.setDate(today.getDate() - 15);
      return checkDate >= ago && checkDate <= new Date();
    }
    if (period === 'MES_ATUAL') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return checkDate >= first && checkDate <= new Date();
    }
    return true;
  };

  const filteredTrips = trips.filter(trip => {
    if (!filterByPeriod(trip.date)) return false;
    if (searchTruck) {
      const search = searchTruck.toLowerCase();
      const parentTruck = fleet.find(f => f.id === trip.truck_id);
      return (
        parentTruck?.plate.toLowerCase().includes(search) ||
        parentTruck?.driver_name.toLowerCase().includes(search) ||
        trip.trip_number.toLowerCase().includes(search) ||
        trip.product.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalVolume = filteredTrips.reduce((acc, curr) => acc + curr.volume_m3, 0);
  const totalCost = filteredTrips.reduce((acc, curr) => acc + curr.total_price, 0);

  const truckProduction = availableTrucks.map(truck => {
    const truckTrips = filteredTrips.filter(t => t.truck_id === truck.id);
    const m3Produced = truckTrips.reduce((acc, curr) => acc + curr.volume_m3, 0);
    return {
      plate: truck.plate,
      driver: truck.driver_name,
      m3Produced,
      tripsCount: truckTrips.length,
      valueProduced: truckTrips.reduce((acc, curr) => acc + curr.total_price, 0)
    };
  }).filter(t => t.tripsCount > 0).sort((a, b) => b.m3Produced - a.m3Produced);

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            LOGÍSTICA & CUBAGEM
          </h2>
          <span className="text-[10px] uppercase opacity-50 tracking-widest text-ferppa-gold">Pesagens de Material Extraído</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-[11px] uppercase tracking-widest transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'OCULTAR FORMULÁRIO' : 'LANÇAR TICKET'}
        </button>
      </div>

      {/* Success Notification */}
      {formSuccess && (
        <div className="bg-ferppa-green/10 border border-ferppa-green/40 text-ferppa-offwhite rounded-lg p-3 text-xs flex items-center gap-2.5 max-w-lg mb-4">
          <CheckCircle className="text-ferppa-green w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold block text-ferppa-green">TICKET REGISTRADO COM SUCESSO!</span>
            <span>A cubagem de areia foi validada, anexada ao caminhão correspondente e salva no banco de dados.</span>
          </div>
        </div>
      )}

      {/* Trip entry form */}
      {showForm && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded p-5 shadow-lg relative max-w-4xl transition-all duration-300 mb-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <h3 className="text-[11px] uppercase tracking-widest opacity-60 text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-ferppa-gold" />
              Lançamento de Viagem de Escoamento - Balança Operacional
            </h3>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Selecione Caminhão Caçamba *</label>
                <select value={truckId} onChange={(e) => setTruckId(e.target.value)} className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" required>
                  <option value="">Selecione...</option>
                  {availableTrucks.map((item) => (
                    <option key={item.id} value={item.id}>{item.plate} ({item.driver_name})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Nº Ticket / Pesagem *</label>
                <input type="text" value={tripNumber} onChange={(e) => setTripNumber(e.target.value)} className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" placeholder="TKT-12039" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Data do Ticket *</label>
                <div className="relative">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-ferppa-dark border border-[#26383a] rounded pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" required />
                  <Calendar className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Material *</label>
                <select value={product} onChange={(e) => setProduct(e.target.value)} className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" required>
                  <option value="RACHINHA">RACHINHA</option>
                  <option value="AREIA MÉDIA">AREIA MÉDIA</option>
                  <option value="AREIA FINA">AREIA FINA</option>
                  <option value="PEDRISCO">PEDRISCO</option>
                  <option value="PEDRA 1">PEDRA 1</option>
                  <option value="PEDRA 2">PEDRA 2</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Hora Saída Draga</label>
                <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Hora Chegada Pátio</label>
                <input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Hora da Entrega *</label>
                <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Cubagem Realizada (m³) *</label>
                <input type="number" step="0.01" value={volume} onChange={(e) => setVolume(e.target.value)} className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono font-bold" placeholder="Cubagem m3" required />
              </div>
              <div className="space-y-1 col-span-1">
                <label className="text-xs text-gray-400 font-semibold block">Preço por m³ (R$) *</label>
                <input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" placeholder="EX: 85.00" required />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-3 pt-3 border-t border-white/10">
              <div className="bg-transparent px-0 py-2.5 text-[11px] uppercase tracking-widest opacity-60 text-white">
                <span>VALOR TOTAL TICKET:</span>{' '}
                <span className="text-ferppa-gold font-bold text-sm tracking-wide font-mono opacity-100 ml-2">
                  R$ {Number(calculatedTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-transparent text-[11px] font-bold text-white/50 hover:text-white hover:bg-white/5 transition-colors shrink-0 uppercase tracking-widest">CANCELAR</button>
                <button type="submit" className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-[11px] uppercase tracking-widest transition-colors">
                  REGISTRAR VIAGEM
                  <Truck className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Production Leaderboard */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded p-4 space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest opacity-60 text-white flex items-center gap-1.5 border-b border-white/10 pb-3">
              <Calculator className="w-4 h-4 text-ferppa-gold" />
              SOMA POR EQUIPAMENTO
            </h3>
            {truckProduction.length === 0 ? (
              <div className="py-8 text-center text-[10px] text-gray-500 uppercase tracking-widest">Sem produção no período.</div>
            ) : (
              <div className="space-y-4 pt-1">
                {truckProduction.map((item, index) => (
                  <div key={item.plate} className="text-xs">
                    <div className="flex justify-between font-mono text-white mb-1">
                      <span>{index + 1}. {item.plate}</span>
                      <span className="text-ferppa-gold font-bold">{item.m3Produced.toLocaleString('pt-BR')} m³</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex justify-between mb-2 uppercase">
                      <span className="truncate max-w-28">{item.driver.split(' ')[0]}</span>
                      <span>{item.tripsCount} viagem(ns)</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-ferppa-gold h-full" style={{ width: `${Math.min((item.m3Produced / (totalVolume || 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trips Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded p-5 space-y-4">
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-2">
              <div className="flex flex-wrap items-center gap-2">
                {(['TODOS', 'HOJE', '7_DIAS', '15_DIAS', 'MES_ATUAL'] as PeriodFilterType[]).map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-[11px] font-bold tracking-widest uppercase transition-all ${period === p ? 'border-b-2 border-ferppa-gold text-white' : 'text-gray-500 hover:text-white'}`}>
                    {p === 'TODOS' ? 'TODOS' : p === 'HOJE' ? 'HOJE' : p === '7_DIAS' ? '7 DIAS' : p === '15_DIAS' ? '15 DIAS' : 'MÊS ATUAL'}
                  </button>
                ))}
              </div>
              <div className="w-full lg:w-60 flex items-center bg-transparent border-b border-white/10 px-3 py-1.5 focus-within:border-ferppa-gold transition-colors">
                <Filter className="w-4 h-4 text-gray-500 mr-2" />
                <input type="text" value={searchTruck} onChange={(e) => setSearchTruck(e.target.value)} placeholder="Localizar via Placa ou Ticket..." className="bg-transparent border-0 outline-none text-xs w-full text-white placeholder-gray-600" />
              </div>
            </div>

            {/* Info banner */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-[#172122] p-2 rounded border border-[#26383a]/60">
              <Info className="w-3.5 h-3.5 text-ferppa-gold shrink-0" />
              <span>
                Visualizando <span className="text-white font-mono">{filteredTrips.length} tickets</span>. Os totais de cubagem (m³) e faturamento (R$) são recalculados ao vivo conforme as datas selecionadas.
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full -mx-5 px-5 md:mx-0 md:px-0 minimal-scrollbar">
              <table className="w-full text-left border-collapse text-[13px] min-w-[800px]">
                <thead>
                  <tr>
                    <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Nº Ticket</th>
                    <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Placa / Modelo</th>
                    <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Motorista</th>
                    <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Data / Entrega</th>
                    <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Material</th>
                    <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-right">Volume</th>
                    <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-right">Preço m³</th>
                    <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-right">Total (R$)</th>
                    {isAdmin && <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 9 : 8} className="py-8 text-center text-gray-500 font-mono">
                        Nenhum ticket encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((trip) => {
                      const parentTruck = fleet.find(f => f.id === trip.truck_id);
                      return (
                        <tr key={trip.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-3 font-mono font-bold text-white">{trip.trip_number}</td>
                          <td className="p-3">
                            <span className="font-mono text-ferppa-gold block">{parentTruck?.plate || 'Indefinido'}</span>
                            <span className="text-[10px] text-gray-500 block truncate max-w-28">{parentTruck?.model}</span>
                          </td>
                          <td className="p-3 font-medium text-gray-300">{parentTruck?.driver_name}</td>
                          <td className="p-3 font-mono text-[11px] text-gray-400">
                            <div>{new Date(trip.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Ent. {trip.delivery_time}</div>
                          </td>
                          <td className="p-3">
                            <span className="bg-ferppa-gold/10 text-ferppa-gold text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                              {trip.product}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-white tabular-nums">
                            {trip.volume_m3.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} m³
                          </td>
                          <td className="p-3 text-right font-mono text-gray-400 tabular-nums">
                            R$ {trip.unit_price.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-ferppa-gold tabular-nums">
                            R$ {trip.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEdit(trip)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-ferppa-gold hover:bg-ferppa-gold/10 transition-all"
                                  title="Editar Ticket"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingTrip(trip)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                  title="Excluir Ticket"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredTrips.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-white/10 font-mono text-xs">
                      <td colSpan={isAdmin ? 5 : 5} className="p-4 text-right text-white/50 uppercase tracking-widest">
                        SOMA AUTOMÁTICA FILTRADA:
                      </td>
                      <td className="p-4 text-right text-white tabular-nums font-bold">
                        {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} m³
                      </td>
                      <td></td>
                      <td className="p-4 text-right text-ferppa-gold tabular-nums font-bold text-sm">
                        R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      {isAdmin && <td></td>}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EDIT MODAL ──────────────────────────────────────────────────────── */}
      {editingTrip && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingTrip(null); }}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a2426 0%, #131b1c 100%)',
              border: '1px solid rgba(212,175,55,0.3)',
              animation: 'modalIn 0.25s cubic-bezier(.34,1.56,.64,1)',
            }}
          >
            {/* Gold top accent */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #b8960c)' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <Edit className="w-5 h-5 text-ferppa-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Editar Ticket de Viagem</h3>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">{editingTrip.trip_number}</p>
                </div>
              </div>
              <button onClick={() => setEditingTrip(null)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSave}>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Truck */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Caminhão *</label>
                  <select value={editTruckId} onChange={e => setEditTruckId(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" required>
                    {availableTrucks.map(t => <option key={t.id} value={t.id}>{t.plate} ({t.driver_name})</option>)}
                  </select>
                </div>

                {/* Ticket Number */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Nº Ticket *</label>
                  <input type="text" value={editTripNumber} onChange={e => setEditTripNumber(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" required />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Data *</label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" required />
                </div>

                {/* Product */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Material *</label>
                  <select value={editProduct} onChange={e => setEditProduct(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite">
                    <option value="RACHINHA">RACHINHA</option>
                    <option value="AREIA MÉDIA">AREIA MÉDIA</option>
                    <option value="AREIA FINA">AREIA FINA</option>
                    <option value="PEDRISCO">PEDRISCO</option>
                    <option value="PEDRA 1">PEDRA 1</option>
                    <option value="PEDRA 2">PEDRA 2</option>
                  </select>
                </div>

                {/* Times */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Saída Draga</label>
                  <input type="time" value={editDepartureTime} onChange={e => setEditDepartureTime(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Chegada Pátio</label>
                  <input type="time" value={editArrivalTime} onChange={e => setEditArrivalTime(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Entrega *</label>
                  <input type="time" value={editDeliveryTime} onChange={e => setEditDeliveryTime(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" required />
                </div>

                {/* Volume */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Cubagem (m³) *</label>
                  <input type="number" step="0.01" value={editVolume} onChange={e => setEditVolume(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono font-bold" required />
                </div>

                {/* Unit Price */}
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Preço por m³ (R$) *</label>
                  <input type="number" step="0.01" value={editUnitPrice} onChange={e => setEditUnitPrice(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" required />
                </div>

                {/* Live total preview */}
                <div className="lg:col-span-2 flex items-center">
                  <div className="w-full rounded-xl px-4 py-3 border border-ferppa-gold/20"
                    style={{ background: 'rgba(212,175,55,0.06)' }}>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Total do Ticket</div>
                    <div className="text-xl font-mono font-bold text-ferppa-gold mt-0.5">
                      R$ {Number(editCalculatedTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10"
                style={{ background: 'rgba(0,0,0,0.2)' }}>
                <button type="button" onClick={() => setEditingTrip(null)}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors">
                  CANCELAR
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-ferppa-dark transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}>
                  <Save className="w-4 h-4" />
                  {isSaving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                </button>
              </div>
            </form>
          </div>

          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: scale(0.93) translateY(10px); }
              to   { opacity: 1; transform: scale(1)    translateY(0);    }
            }
          `}</style>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={!!deletingTrip}
        onClose={() => setDeletingTrip(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Excluir Ticket de Viagem"
        description="Esta ação é permanente e não pode ser desfeita. O ticket será removido do banco de dados e os totais serão recalculados automaticamente."
        itemLabel={deletingTrip ? `${deletingTrip.trip_number} — ${fleet.find(f => f.id === deletingTrip.truck_id)?.plate || '???'} — ${deletingTrip.volume_m3} m³ de ${deletingTrip.product}` : undefined}
      />
    </div>
  );
}
