/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Calendar, Clock, Filter, CheckCircle, Calculator, Info, Edit } from 'lucide-react';
import { FleetType } from '../types';
import { toast } from 'sonner';
import { useFerppaStore } from '../store';

type PeriodFilterType = 'HOJE' | '7_DIAS' | '15_DIAS' | 'MES_ATUAL' | 'TODOS';

export default function ModuloLogistica() {
  const { fleet, trips, addTrip, deleteTrip, userProfile } = useFerppaStore();
  const isAdmin = userProfile?.role === 'ADMIN';
  // Form State
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

  // Auto-calculate total price live
  const calculatedTotal = Number(volume) > 0 && Number(unitPrice) > 0
    ? (Number(volume) * Number(unitPrice)).toFixed(2)
    : '0.00';

  // Preset ticket format on open
  useEffect(() => {
    if (!tripNumber) {
      setTripNumber('TKT-' + Math.floor(10000 + Math.random() * 90000));
    }
  }, [tripNumber, showForm]);

  // List of only CAMINHÕES to select
  const availableTrucks = fleet.filter(f => f.type === FleetType.CAMINHAO);

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
    
    setTimeout(() => {
      setFormSuccess(false);
    }, 4000);

    // Reset fields elegantly
    setTruckId('');
    setTripNumber('TKT-' + Math.floor(10000 + Math.random() * 90000));
    setVolume('');
    setShowForm(false);
  };

  // Modern dynamic date filter matching
  const filterByPeriod = (itemDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(itemDate + 'T12:00:00'); // Safe timezone parsing
    
    if (period === 'HOJE') {
      const todayStr = today.toISOString().split('T')[0];
      return itemDate === todayStr;
    }

    if (period === '7_DIAS') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return checkDate >= sevenDaysAgo && checkDate <= new Date();
    }

    if (period === '15_DIAS') {
      const fifteenDaysAgo = new Date(today);
      fifteenDaysAgo.setDate(today.getDate() - 15);
      return checkDate >= fifteenDaysAgo && checkDate <= new Date();
    }

    if (period === 'MES_ATUAL') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return checkDate >= firstDayOfMonth && checkDate <= new Date();
    }

    return true; // TODOS
  };

  // Filter trips by Period, then by searchTruck query
  const filteredTrips = trips.filter(trip => {
    // 1. Period Match
    if (!filterByPeriod(trip.date)) return false;

    // 2. Search query match
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

  // Calculate Aggregations for the filtered set
  const totalVolume = filteredTrips.reduce((acc, curr) => acc + curr.volume_m3, 0);
  const totalCost = filteredTrips.reduce((acc, curr) => acc + curr.total_price, 0);

  // Group and compile production by Truck (allows management to track production per truck in the period selected)
  const truckProduction = availableTrucks.map(truck => {
    const truckTrips = filteredTrips.filter(t => t.truck_id === truck.id);
    const m3Produced = truckTrips.reduce((acc, curr) => acc + curr.volume_m3, 0);
    const tripsCount = truckTrips.length;
    const valueProduced = truckTrips.reduce((acc, curr) => acc + curr.total_price, 0);

    return {
      plate: truck.plate,
      driver: truck.driver_name,
      m3Produced,
      tripsCount,
      valueProduced
    };
  }).filter(t => t.tripsCount > 0) // Only show trucks with activity
    .sort((a, b) => b.m3Produced - a.m3Produced); // Highest producers first

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
            <span className="font-bold block text-ferppa-green">TICKET REGISTRADO CO SUCESSO!</span>
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
              
              {/* Truck selection */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Selecione Caminhão Caçamba *</label>
                <select
                  value={truckId}
                  onChange={(e) => setTruckId(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  required
                >
                  <option value="">Selecione...</option>
                  {availableTrucks.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.plate} ({item.driver_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticket Number */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Nº Ticket / Pesagem *</label>
                <input
                  type="text"
                  value={tripNumber}
                  onChange={(e) => setTripNumber(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                  placeholder="TKT-12039"
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Data do Ticket *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                    required
                  />
                  <Calendar className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Product */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Material *</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  required
                >
                  <option value="RACHINHA">RACHINHA</option>
                  <option value="AREIA MÉDIA">AREIA MÉDIA</option>
                  <option value="AREIA FINA">AREIA FINA</option>
                  <option value="PEDRISCO">PEDRISCO</option>
                  <option value="PEDRA 1">PEDRA 1</option>
                  <option value="PEDRA 2">PEDRA 2</option>
                </select>
              </div>

              {/* Times */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Hora Saída Draga</label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Hora Chegada Pátio</label>
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Hora da Entrega *</label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                  required
                />
              </div>

              {/* Volume m3 */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Cubagem Realizada (m³) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono font-bold"
                  placeholder="Cubagem m3"
                  required
                />
              </div>

              {/* Unit Price per m3 */}
              <div className="space-y-1 col-span-1">
                <label className="text-xs text-gray-400 font-semibold block">Preço por m³ (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                  placeholder="EX: 85.00"
                  required
                />
              </div>
            </div>

            {/* Calculations display */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-3 pt-3 border-t border-white/10">
              <div className="bg-transparent px-0 py-2.5 text-[11px] uppercase tracking-widest opacity-60 text-white">
                <span>VALOR TOTAL TICKET:</span>{' '}
                <span className="text-ferppa-gold font-bold text-sm tracking-wide font-mono opacity-100 ml-2">
                  R$ {Number(calculatedTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-transparent text-[11px] font-bold text-white/50 hover:text-white hover:bg-white/5 transition-colors shrink-0 uppercase tracking-widest"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-[11px] uppercase tracking-widest transition-colors tracking-wide"
                >
                  REGISTRAR VIAGEM
                  <Truck className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Advanced Management Screen Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Production Leaderboard by Truck */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded p-4 space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest opacity-60 text-white flex items-center gap-1.5 border-b border-white/10 pb-3">
              <Calculator className="w-4 h-4 text-ferppa-gold" />
              SOMA POR EQUIPAMENTO
            </h3>

            {truckProduction.length === 0 ? (
              <div className="py-8 text-center text-[10px] text-gray-500 uppercase tracking-widest">
                Sem produção no período.
              </div>
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
                    
                    {/* Visual production bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-ferppa-gold h-full" 
                        style={{ width: `${Math.min((item.m3Produced / (totalVolume || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trips Core Log List Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded p-5 space-y-4">
            
            {/* Advanced Filters */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPeriod('TODOS')}
                  className={`px-3 py-1 text-[11px] font-bold tracking-widest uppercase transition-all ${period === 'TODOS' ? 'border-b-2 border-ferppa-gold text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  TODOS
                </button>
                <button
                  onClick={() => setPeriod('HOJE')}
                  className={`px-3 py-1 text-[11px] font-bold tracking-widest uppercase transition-all ${period === 'HOJE' ? 'border-b-2 border-ferppa-gold text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  HOJE
                </button>
                <button
                  onClick={() => setPeriod('7_DIAS')}
                  className={`px-3 py-1 text-[11px] font-bold tracking-widest uppercase transition-all ${period === '7_DIAS' ? 'border-b-2 border-ferppa-gold text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  7 DIAS
                </button>
                <button
                  onClick={() => setPeriod('15_DIAS')}
                  className={`px-3 py-1 text-[11px] font-bold tracking-widest uppercase transition-all ${period === '15_DIAS' ? 'border-b-2 border-ferppa-gold text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  15 DIAS
                </button>
                <button
                  onClick={() => setPeriod('MES_ATUAL')}
                  className={`px-3 py-1 text-[11px] font-bold tracking-widest uppercase transition-all ${period === 'MES_ATUAL' ? 'border-b-2 border-ferppa-gold text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  MÊS ATUAL
                </button>
              </div>

              <div className="w-full lg:w-60 flex items-center bg-transparent border-b border-white/10 px-3 py-1.5 focus-within:border-ferppa-gold transition-colors">
                <Filter className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="text"
                  value={searchTruck}
                  onChange={(e) => setSearchTruck(e.target.value)}
                  placeholder="Localizar via Placa ou Ticket..."
                  className="bg-transparent border-0 outline-none text-xs w-full text-white placeholder-gray-600"
                />
              </div>
            </div>

            {/* Informational banner */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-[#172122] p-2 rounded border border-[#26383a]/60">
              <Info className="w-3.5 h-3.5 text-ferppa-gold shrink-0" />
              <span>
                Visualizando <span className="text-white font-mono">{filteredTrips.length} tickets</span>. Os totais de cubagem (m³) e faturamento (R$) são recalculados ao vivo conforme as datas selecionadas.
              </span>
            </div>

            {/* Trips list table */}
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
                    <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500 font-mono">
                        Nenhum ticket encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((trip) => {
                      const parentTruck = fleet.find(f => f.id === trip.truck_id);
                      return (
                        <tr key={trip.id} className="hover:bg-white/5 transition-colors">
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
                          <td className="p-3 text-center">
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  toast.info('Funcionalidade de edição em desenvolvimento.');
                                }}
                                className="p-1 text-gray-500 hover:text-ferppa-gold transition-colors"
                                title="Editar Ticket"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Dynamically aggregated Sum of Table Rows */}
                {filteredTrips.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-white/10 font-mono text-xs">
                      <td colSpan={5} className="p-4 text-right text-white/50 uppercase tracking-widest">
                        SOMA AUTOMÁTICA FILTRADA:
                      </td>
                      <td className="p-4 text-right text-white tabular-nums font-bold">
                        {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} m³
                      </td>
                      <td></td>
                      <td className="p-4 text-right text-ferppa-gold tabular-nums font-bold text-sm">
                        R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
