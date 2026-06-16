/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Truck, Settings, Users, Fuel, Plus, ShieldAlert, Edit } from 'lucide-react';
import { FleetType } from '../types';
import { toast } from 'sonner';
import { useFerppaStore } from '../store';

export default function FleetManager() {
  const { fleet, addFleetItem, deleteFleetItem } = useFerppaStore();
  // New Fleet Item form state
  const [type, setType] = useState<FleetType>(FleetType.CAMINHAO);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [driverName, setDriverName] = useState('');
  const [ownerName, setOwnerName] = useState('Ferppa Mineração');
  const [weeklyFuelLimit, setWeeklyFuelLimit] = useState('350');

  const [showAddForm, setShowAddForm] = useState(false);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !model || !driverName || !weeklyFuelLimit) {
      toast.error('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    addFleetItem({
      type,
      plate: plate.toUpperCase().trim(),
      model: model.trim(),
      driver_name: driverName.trim(),
      owner_name: ownerName.trim(),
      weekly_fuel_limit_liters: parseFloat(weeklyFuelLimit)
    });

    toast.success('Veículo cadastrado!', {
      description: `O ativo ${plate.toUpperCase().trim()} foi adicionado à frota.`,
    });

    // Reset fields
    setPlate('');
    setModel('');
    setDriverName('');
    setWeeklyFuelLimit('350');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            FROTA & EQUIPAMENTOS
          </h2>
          <span className="text-[10px] uppercase opacity-50 tracking-widest text-ferppa-gold">Cadastro e Configuração da Frota Ativa</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-[11px] uppercase tracking-widest transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'FECHAR FORMULÁRIO' : 'REGISTRAR EQUIPAMENTO'}
        </button>
      </div>

      {/* Add equipment form */}
      {showAddForm && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded p-5 shadow-lg relative max-w-2xl transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <h3 className="text-[11px] uppercase tracking-widest opacity-60 text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-ferppa-gold" />
              CADASTRO DE EQUIPAMENTO LOGÍSTICO OU DE EXTRAÇÃO
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Equipment type */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Categoria de Serviço (Selecione) *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FleetType)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-bold"
                  required
                >
                  {Object.values(FleetType).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Identification Plate */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Identificação / Placa *</label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono uppercase"
                  placeholder="EX: PQS-8921"
                  required
                />
              </div>

              {/* Vehicle Model */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Marca e Modelo do Equipamento *</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  placeholder="Ex: Volvo FMX 460 Caçamba 16m³"
                  required
                />
              </div>

              {/* Driver / Operator name */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Nome do Motorista / Operador *</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  placeholder="Ex: Roberto Carlos"
                  required
                />
              </div>

              {/* Proprietor / Owner */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Proprietário / Transportador</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  placeholder="Ferppa Mineração"
                />
              </div>

              {/* Weekly cota limit in liters */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Cota de Diesel Semanal (Litros) *</label>
                <input
                  type="number"
                  value={weeklyFuelLimit}
                  onChange={(e) => setWeeklyFuelLimit(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                  placeholder="Limite semanal em litros"
                  required
                />
              </div>

            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-[11px] font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-[11px] uppercase tracking-widest transition-colors"
              >
                SALVAR EQUIPAMENTO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Equipment List Grid */}
      <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl p-6 space-y-4">
        <h3 className="text-[11px] uppercase tracking-[0.1em] text-gray-400 font-bold">
          FROTA E ATIVOS LOGÍSTICOS CADASTRADOS ({fleet.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fleet.map((item) => {
            const isTruck = item.type === FleetType.CAMINHAO;
            return (
              <div key={item.id} className="bg-[#111819] border border-[#1e2a2c] shadow-[0_4px_15px_rgba(0,0,0,0.2)] rounded-lg p-5 space-y-4 hover:border-ferppa-gold/50 transition-all cursor-default group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-gradient-to-br from-ferppa-dark to-black border border-[#1e2a2c] text-ferppa-gold rounded-lg shadow-inner group-hover:scale-105 transition-transform">
                      <Truck className="w-5 h-5 drop-shadow-[0_0_5px_rgba(183,145,82,0.4)]" />
                    </span>
                    <div>
                      <span className="font-mono font-bold text-sm text-ferppa-offwhite tracking-wider block drop-shadow-sm">{item.plate}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 mt-1 inline-block rounded uppercase tracking-widest ${isTruck ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                        {item.type}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      toast.info('Funcionalidade de edição em desenvolvimento.');
                    }}
                    className="p-1.5 text-[#26383a] hover:text-ferppa-gold hover:bg-ferppa-gold/10 rounded transition-all"
                    title="Editar Ativo"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-[11px] text-gray-400 border-t border-[#1e2a2c] pt-4">
                  <div className="flex justify-between items-center">
                    <span className="opacity-70 font-mono text-[10px]">Modelo</span>
                    <span className="text-gray-200 font-sans truncate max-w-[170px]" title={item.model}>{item.model}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-70 font-mono text-[10px]">Operador</span>
                    <span className="text-gray-200 font-sans font-medium">{item.driver_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-70 font-mono text-[10px]">Proprietário</span>
                    <span className="text-gray-300 truncate max-w-[150px]">{item.owner_name}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-[#1e2a2c] pt-3 mt-3">
                    <span className="flex items-center gap-1.5 text-ferppa-gold opacity-90 uppercase tracking-[0.1em] text-[9px] font-bold">
                      <Fuel className="w-3 h-3" />
                      COTA SEMANAL
                    </span>
                    <span className="text-ferppa-gold font-mono font-bold">{item.weekly_fuel_limit_liters.toLocaleString('pt-BR')} L</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
