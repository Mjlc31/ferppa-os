/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Fuel, Plus, Calendar, Clock, Filter, Eye, CheckCircle, ArrowRight, Image as ImageIcon, Edit, Download } from 'lucide-react';
import { FleetType, FuelLogItem } from '../types';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFerppaStore } from '../store';

export default function ModuloAbastecimento() {
  const { fleet, fuelLogs, addFuelLog, deleteFuelLog, userProfile } = useFerppaStore();
  const isAdmin = userProfile?.role === 'ADMIN';
  // Form State
  const [fleetId, setFleetId] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [gasStation, setGasStation] = useState('Auto Posto Caçula (Base)');
  const [odometer, setOdometer] = useState('');
  const [fuelType, setFuelType] = useState('Diesel S10');
  const [liters, setLiters] = useState('');
  const [unitPrice, setUnitPrice] = useState('5.80');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('A PRAZO / FATURADO');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  
  // UI States
  const [filterType, setFilterType] = useState<FleetType | 'TODOS'>('TODOS');
  const [searchPlate, setSearchPlate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<FuelLogItem | null>(null);

  // Auto-calculate live total value
  const calculatedTotal = Number(liters) > 0 && Number(unitPrice) > 0 
    ? (Number(liters) * Number(unitPrice)).toFixed(2)
    : '0.00';

  // Seed default control number on open
  useEffect(() => {
    if (!controlNumber) {
      setControlNumber('AB-' + Math.floor(10000 + Math.random() * 90000));
    }
  }, [controlNumber, showForm]);

  // Handle Simulated File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick preset function for high speed entry
  const setQuickLiters = (amount: number) => {
    setLiters(amount.toString());
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fleetId || !controlNumber || !odometer || !liters || !unitPrice) {
      toast.error('Por favor preencha todos os campos obrigatórios (*).');
      return;
    }

    // Call add state function
    addFuelLog({
      fleet_id: fleetId,
      control_number: controlNumber,
      date,
      time,
      gas_station: gasStation,
      odometer: odometer ? parseInt(odometer) : 0,
      fuel_type: fuelType,
      liters: parseFloat(liters),
      unit_price: parseFloat(unitPrice),
      receipt_number: receiptNumber || 'S/N',
      payment_method: paymentMethod,
      receipt_image: receiptImage
    });

    // Notify success
    setFormSuccess(true);
    toast.success('Abastecimento registrado com sucesso!', {
      description: `${parseFloat(liters).toFixed(2)} L de ${fuelType} no veículo via ${paymentMethod}.`,
    });
    
    setTimeout(() => {
      setFormSuccess(false);
    }, 4000);

    // Reset Form fields elegantly
    setFleetId('');
    setControlNumber('AB-' + Math.floor(10000 + Math.random() * 90000));
    setOdometer('');
    setLiters('');
    setReceiptNumber('');
    setPaymentMethod('A PRAZO / FATURADO');
    setReceiptImage(undefined);
    setShowForm(false);
  };

  // Filtering logs
  const filteredLogs = fuelLogs.filter(log => {
    const parentFleet = fleet.find(f => f.id === log.fleet_id);
    if (!parentFleet) return false;

    // Filter by type
    if (filterType !== 'TODOS' && parentFleet.type !== filterType) return false;

    // Filter by search word (plate, model, driver)
    if (searchPlate) {
      const search = searchPlate.toLowerCase();
      return (
        parentFleet.plate.toLowerCase().includes(search) ||
        parentFleet.driver_name.toLowerCase().includes(search) ||
        log.control_number.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Calculate Aggregations
  const totalLiters = filteredLogs.reduce((sum, log) => sum + log.liters, 0);
  const totalCost = filteredLogs.reduce((sum, log) => sum + log.total_value, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.text('Relatório de Abastecimentos - Ferppa OS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Filtro atual: ${filterType}`, 14, 30);
    doc.text(`Busca: ${searchPlate || 'Nenhuma'}`, 14, 35);
    
    const logsBody = filteredLogs.map(log => {
        const parentFleet = fleet.find(f => f.id === log.fleet_id);
        return [
          log.control_number,
          parentFleet?.plate || 'N/A',
          new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR'),
          log.gas_station,
          `${log.liters.toFixed(1)} L`,
          `R$ ${log.unit_price.toFixed(2)}`,
          `R$ ${log.total_value.toFixed(2)}`,
          log.payment_method || 'N/A'
        ];
    });

    autoTable(doc, {
      startY: 45,
      head: [['Controle', 'Placa', 'Data', 'Posto', 'Litragem', 'Unitário', 'Total', 'Forma Pgto']],
      body: logsBody,
      theme: 'grid',
      headStyles: { fillColor: [40, 50, 50] },
      foot: [['', '', '', 'TOTAL:', `${totalLiters.toFixed(1)} L`, '', `R$ ${totalCost.toFixed(2)}`, '']],
      showFoot: 'lastPage'
    });

    doc.save('relatorio-abastecimentos-ferppa.pdf');
    toast.success('Relatório PDF gerado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            ABASTECIMENTO
          </h2>
          <span className="text-[10px] uppercase opacity-50 tracking-widest">Controle & Digitalização de Canhoto</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-white/20 hover:bg-white/5 text-white font-bold text-xs tracking-wider transition-colors rounded"
          >
            <Download className="w-4 h-4" />
            EXPORTAR PDF
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-xs tracking-wider transition-colors rounded"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'OCULTAR FORMULÁRIO' : 'DIGITALIZAR CANHOTO'}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {formSuccess && (
        <div className="bg-ferppa-green/10 border border-ferppa-green/40 text-ferppa-offwhite rounded-lg p-3 text-xs flex items-center gap-2.5 max-w-lg">
          <CheckCircle className="text-ferppa-green w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold block text-ferppa-green">LANÇAMENTO CONCLUÍDO COM SUCESSO!</span>
            <span>O cupom fiscal foi digitalizado, vinculado à frota e associado ao banco de dados Supabase.</span>
          </div>
        </div>
      )}

      {/* Rápido & Sem Fricção Form (Optimized for keyboard) */}
      {showForm && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded p-5 shadow-lg relative max-w-4xl transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <h3 className="text-[11px] uppercase tracking-widest opacity-60 text-white flex items-center gap-2">
              <Fuel className="w-4 h-4 text-ferppa-gold" />
              ENTRADA RÁPIDA DE DADOS - TERMINAL DO FISCAL DE PISTA
            </h3>
            <span className="text-[10px] text-white/40 font-mono">Use tab para navegar rápido</span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Fleet Selection */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Selecione Veículo/Equipamento *</label>
                <select
                  value={fleetId}
                  onChange={(e) => setFleetId(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  required
                >
                  <option value="">Selecione...</option>
                  {fleet.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.plate} - {item.driver_name.split(' ')[0]} ({item.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Control Number */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Nº Controle Operacional *</label>
                <input
                  type="text"
                  value={controlNumber}
                  onChange={(e) => setControlNumber(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                  placeholder="AB-10023"
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Data do Abastecimento *</label>
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

              {/* Time */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Hora *</label>
                <div className="relative">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                    required
                  />
                  <Clock className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Gas Station */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Posto / Local de Bomba *</label>
                <input
                  type="text"
                  value={gasStation}
                  onChange={(e) => setGasStation(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  placeholder="Local de abastecimento"
                  required
                />
              </div>

              {/* Odometer */}
              <div className="space-y-1">
                <label className="text-xs text-ferppa-gold font-bold block">Hodômetro (KM) / Horímetro *</label>
                <input
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full bg-ferppa-dark border border-ferppa-gold/50 rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono placeholder-white/30"
                  placeholder="Ex: 145000"
                  required
                />
              </div>

              {/* Liters */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Litros de Diesel *</label>
                <input
                  type="number"
                  step="0.01"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono font-bold"
                  placeholder="Quant de litros"
                  required
                />
                <div className="flex gap-1 pt-1 opacity-80">
                  <button type="button" onClick={() => setQuickLiters(100)} className="bg-ferppa-dark-lighter hover:bg-ferppa-gold hover:text-ferppa-dark text-[9px] px-1.5 py-0.5 rounded font-mono text-gray-400">100L</button>
                  <button type="button" onClick={() => setQuickLiters(200)} className="bg-ferppa-dark-lighter hover:bg-ferppa-gold hover:text-ferppa-dark text-[9px] px-1.5 py-0.5 rounded font-mono text-gray-400">200L</button>
                  <button type="button" onClick={() => setQuickLiters(400)} className="bg-ferppa-dark-lighter hover:bg-ferppa-gold hover:text-ferppa-dark text-[9px] px-1.5 py-0.5 rounded font-mono text-gray-400">400L</button>
                </div>
              </div>

              {/* Unit Price */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Preço Unitário (R$ / Litro) *</label>
                <input
                  type="number"
                  step="0.001"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                  placeholder="Ex: 5.80"
                  required
                />
              </div>

              {/* Receipt Number */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Cupom Fiscal Nº</label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                  placeholder="CF-12345"
                />
              </div>

              {/* Fuel Type */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Tipo de Combustível</label>
                <input
                  type="text"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  placeholder="Diesel S10"
                />
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Forma de Pagamento *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  required
                >
                  <option value="A PRAZO / FATURADO">A PRAZO / FATURADO</option>
                  <option value="ESTOQUE INTERNO">ESTOQUE INTERNO</option>
                  <option value="À VISTA / PIX">À VISTA / PIX</option>
                  <option value="CARTÃO DE CRÉDITO">CARTÃO DE CRÉDITO</option>
                </select>
              </div>

              {/* Canhoto Image upload */}
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <label className="text-xs text-gray-400 font-semibold block">Foto do Cupom / Canhoto Comercial</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="canhoto-upload"
                    />
                    <label
                      htmlFor="canhoto-upload"
                      className="flex items-center justify-center gap-2 border border-dashed border-[#26383a] hover:border-ferppa-gold/50 rounded px-4 py-2 text-xs text-gray-300 cursor-pointer hover:bg-white/5 transition-all text-center"
                    >
                      <ImageIcon className="w-4 h-4 text-ferppa-gold" />
                      {receiptImage ? 'COPIADO COM SUCESSO. ALTERAR FOTO...' : 'ANEXAR FOTO DO CUPOM'}
                    </label>
                  </div>
                  {receiptImage && (
                    <div className="w-10 h-10 border border-ferppa-gold/40 rounded overflow-hidden shadow">
                      <img src={receiptImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live calculated values display */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-3 pt-3 border-t border-white/10">
              <div className="bg-transparent px-0 py-2.5 text-[11px] uppercase tracking-widest opacity-60 text-white">
                <span>TOTAL ESTIMADO:</span>{' '}
                <span className="text-ferppa-gold font-bold text-sm tracking-wide font-mono opacity-100 ml-2">
                  R$ {Number(calculatedTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-transparent text-white/50 hover:text-white hover:bg-white/5 text-xs transition-colors shrink-0 uppercase tracking-widest"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-[11px] uppercase tracking-widest transition-colors"
                >
                  CONCLUIR E REGISTRAR
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filters and List */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-wrap items-center gap-2 p-1">
            <button
              onClick={() => setFilterType('TODOS')}
              className={`px-3 py-1 text-[11px] font-semibold tracking-wide transition-all uppercase ${filterType === 'TODOS' ? 'border-b-2 border-ferppa-gold text-white' : 'text-gray-500 hover:text-ferppa-offwhite'}`}
            >
              TODOS
            </button>
            {Object.values(FleetType).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 text-[11px] font-semibold tracking-wide transition-all uppercase ${filterType === t ? 'border-b-2 border-ferppa-gold text-white' : 'text-gray-500 hover:text-ferppa-offwhite'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-full lg:w-72 flex items-center bg-transparent border-b border-white/10 px-3 py-1.5 focus-within:border-ferppa-gold transition-colors">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              placeholder="Filtro por Placa ou Motorista..."
              className="bg-transparent border-0 outline-none text-xs w-full text-ferppa-offwhite"
            />
          </div>
        </div>

        {/* List Table */}
        <div className="overflow-x-auto w-full -mx-5 px-5 md:mx-0 md:px-0 minimal-scrollbar">
          <table className="w-full text-left border-collapse text-[13px] min-w-[800px]">
            <thead>
              <tr>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Nº Controle</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Equipamento / Placa</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Operador / Motorista</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Categoria</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Data / Hora</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50">Hodômetro / Horas</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-right">Litragem (L)</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-right">Preço Unit.</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-right">Total (R$)</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-center">Cupom</th>
                <th className="p-3 border-b border-white/10 uppercase text-[10px] opacity-50 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-gray-500 font-mono">
                    Nenhum registro de abastecimento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const parentFleet = fleet.find(f => f.id === log.fleet_id);
                  const isCaminhao = parentFleet?.type === FleetType.CAMINHAO;
                  
                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-white">{log.control_number}</td>
                      <td className="p-3">
                        <div className="font-mono text-ferppa-gold">{parentFleet?.plate || 'Indefinido'}</div>
                        <div className="text-[10px] text-gray-500 truncate max-w-40">{parentFleet?.model}</div>
                      </td>
                      <td className="p-3 font-medium text-gray-300">{parentFleet?.driver_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${isCaminhao ? 'bg-orange-500/10 text-orange-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                          {parentFleet?.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-400">
                        <div>{new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                        <div className="text-[10px] text-gray-500">{log.time}</div>
                      </td>
                      <td className="p-3 font-mono text-gray-300 tabular-nums">
                        {log.odometer > 0 ? (
                          <>
                            {log.odometer.toLocaleString('pt-BR')} <span className="text-[10px] text-gray-500">KM</span>
                          </>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-right text-white tabular-nums">
                        {log.liters.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                      </td>
                      <td className="p-3 font-mono text-right text-gray-400 tabular-nums">
                        R$ {log.unit_price.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-right tabular-nums">
                        <div className="text-ferppa-gold">R$ {log.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div className="text-[9px] text-gray-500 uppercase mt-0.5">{log.payment_method || 'N/A'}</div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setViewingReceipt(log)}
                          className="p-1 text-gray-400 hover:text-ferppa-gold transition-colors inline-flex items-center"
                          title="Visualizar Cupom Fiscal"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        {isAdmin && (
                          <button
                            onClick={() => {
                              toast.info('Funcionalidade de edição em desenvolvimento.');
                            }}
                            className="p-1 text-gray-500 hover:text-ferppa-gold transition-colors"
                            title="Editar Registro"
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
            {/* Totals Summary Row */}
            {filteredLogs.length > 0 && (
              <tfoot>
                <tr className="border-t border-white/10 font-mono text-xs">
                  <td colSpan={6} className="p-4 text-right text-white/50 uppercase tracking-widest">
                    TOTALIZADORES FILTRADOS:
                  </td>
                  <td className="p-4 text-right text-white tabular-nums border-t border-white/5">
                    {totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                  </td>
                  <td className="border-t border-white/5"></td>
                  <td className="p-4 text-right text-ferppa-gold tabular-nums border-t border-white/5 text-sm font-bold">
                    R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="border-t border-white/5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Receipt Modal Viewer */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e2a2c] border border-ferppa-gold/30 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#26383a] flex justify-between items-center bg-[#172122]">
              <h4 className="text-sm font-bold font-mono text-ferppa-gold">
                CUPOM FISCAL: {viewingReceipt.receipt_number}
              </h4>
              <button
                onClick={() => setViewingReceipt(null)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-[#1e2a2c]"
              >
                FECHAR
              </button>
            </div>
            <div className="p-5 flex flex-col items-center gap-4">
              {viewingReceipt.receipt_image ? (
                <div className="border border-[#26383a] rounded max-h-80 overflow-y-auto w-full">
                  <img
                    src={viewingReceipt.receipt_image}
                    alt="Canhoto"
                    className="w-full object-contain"
                  />
                </div>
              ) : (
                <div className="py-12 px-6 border border-dashed border-[#26383a] rounded w-full flex flex-col items-center justify-center gap-2 text-center text-gray-500">
                  <Fuel className="w-10 h-10 text-gray-600 animate-pulse" />
                  <span className="text-xs font-mono">Nenhuma imagem real copiada.</span>
                  <span className="text-[10px]">Utilize o botão de "ANEXAR FOTO" no formulário de cadastro para digitalizar canhotos da sua câmera/galeria.</span>
                </div>
              )}
              
              <div className="w-full bg-[#172122] p-3 rounded border border-[#26383a] text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Controle:</span>
                  <span className="text-white font-bold">{viewingReceipt.control_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Equipamento:</span>
                  <span className="text-ferppa-gold font-bold">
                    {fleet.find(f => f.id === viewingReceipt.fleet_id)?.plate || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Local Combustível:</span>
                  <span className="text-gray-300">{viewingReceipt.gas_station}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Litragem:</span>
                  <span className="text-white font-bold">{viewingReceipt.liters.toLocaleString('pt-BR')} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor Total Pago:</span>
                  <span className="text-ferppa-gold font-bold">R$ {viewingReceipt.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-[#26383a] pt-1.5 mt-1.5">
                  <span className="text-gray-500">MÉTODO PGT:</span>
                  <span className="text-white font-bold">{viewingReceipt.payment_method || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
