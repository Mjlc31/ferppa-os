/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Truck, Settings, Fuel, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { FleetType, FleetItem } from '../types';
import { toast } from 'sonner';
import { useFerppaStore } from '../store';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function FleetManager() {
  const { fleet, addFleetItem, deleteFleetItem, updateFleetItem } = useFerppaStore();

  // ─── Add Form State ─────────────────────────────────────────────────────────
  const [type, setType] = useState<FleetType>(FleetType.CAMINHAO);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [driverName, setDriverName] = useState('');
  const [ownerName, setOwnerName] = useState('Ferppa Mineração');
  const [weeklyFuelLimit, setWeeklyFuelLimit] = useState('350');
  const [showAddForm, setShowAddForm] = useState(false);

  // ─── Edit Modal State ────────────────────────────────────────────────────────
  const [editingItem, setEditingItem] = useState<FleetItem | null>(null);
  const [editType, setEditType] = useState<FleetType>(FleetType.CAMINHAO);
  const [editPlate, setEditPlate] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editWeeklyFuelLimit, setEditWeeklyFuelLimit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ─── Delete Modal State ──────────────────────────────────────────────────────
  const [deletingItem, setDeletingItem] = useState<FleetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openEdit = (item: FleetItem) => {
    setEditingItem(item);
    setEditType(item.type);
    setEditPlate(item.plate);
    setEditModel(item.model);
    setEditDriverName(item.driver_name);
    setEditOwnerName(item.owner_name);
    setEditWeeklyFuelLimit(String(item.weekly_fuel_limit_liters));
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editPlate || !editModel || !editDriverName || !editWeeklyFuelLimit) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setIsSaving(true);
    try {
      await updateFleetItem(editingItem.id, {
        type: editType,
        plate: editPlate.toUpperCase().trim(),
        model: editModel.trim(),
        driver_name: editDriverName.trim(),
        owner_name: editOwnerName.trim(),
        weekly_fuel_limit_liters: parseFloat(editWeeklyFuelLimit),
      });
      toast.success('Equipamento atualizado com sucesso!', {
        description: `${editPlate.toUpperCase()} foi salvo.`,
      });
      setEditingItem(null);
    } catch {
      toast.error('Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await deleteFleetItem(deletingItem.id);
      toast.success(`${deletingItem.plate} removido da frota.`);
      setDeletingItem(null);
    } catch {
      toast.error('Erro ao excluir equipamento.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Close edit on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditingItem(null); };
    if (editingItem) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editingItem]);

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

      {/* Add form */}
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
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Categoria de Serviço (Selecione) *</label>
                <select value={type} onChange={(e) => setType(e.target.value as FleetType)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-bold" required>
                  {Object.values(FleetType).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Identificação / Placa *</label>
                <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono uppercase"
                  placeholder="EX: PQS-8921" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Marca e Modelo do Equipamento *</label>
                <input type="text" value={model} onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  placeholder="Ex: Volvo FMX 460 Caçamba 16m³" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Nome do Motorista / Operador *</label>
                <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  placeholder="Ex: Roberto Carlos" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Proprietário / Transportador</label>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite"
                  placeholder="Ferppa Mineração" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold block">Cota de Diesel Semanal (Litros) *</label>
                <input type="number" value={weeklyFuelLimit} onChange={(e) => setWeeklyFuelLimit(e.target.value)}
                  className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono"
                  placeholder="Limite semanal em litros" required />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-[11px] font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors">CANCELAR</button>
              <button type="submit"
                className="px-6 py-2 bg-ferppa-gold hover:bg-ferppa-gold-hover text-ferppa-dark font-bold text-[11px] uppercase tracking-widest transition-colors">SALVAR EQUIPAMENTO</button>
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

                  {/* Action buttons — appear on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-ferppa-gold hover:bg-ferppa-gold/10 transition-all"
                      title="Editar Equipamento"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Excluir Equipamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

      {/* ─── EDIT MODAL ─────────────────────────────────────────────────────────── */}
      {editingItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingItem(null); }}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a2426 0%, #131b1c 100%)',
              border: '1px solid rgba(212,175,55,0.3)',
              animation: 'modalIn 0.25s cubic-bezier(.34,1.56,.64,1)',
            }}
          >
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #b8960c)' }} />

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <Truck className="w-5 h-5 text-ferppa-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Editar Equipamento</h3>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">{editingItem.plate}</p>
                </div>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSave}>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Categoria de Serviço *</label>
                  <select value={editType} onChange={e => setEditType(e.target.value as FleetType)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-bold">
                    {Object.values(FleetType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Placa / Identificação *</label>
                  <input type="text" value={editPlate} onChange={e => setEditPlate(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono uppercase" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Marca e Modelo *</label>
                  <input type="text" value={editModel} onChange={e => setEditModel(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Motorista / Operador *</label>
                  <input type="text" value={editDriverName} onChange={e => setEditDriverName(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Proprietário</label>
                  <input type="text" value={editOwnerName} onChange={e => setEditOwnerName(e.target.value)}
                    className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Cota de Diesel Semanal (L) *</label>
                  <div className="rounded-xl px-4 py-3 border border-ferppa-gold/20" style={{ background: 'rgba(212,175,55,0.06)' }}>
                    <div className="flex items-center gap-3">
                      <Fuel className="w-4 h-4 text-ferppa-gold shrink-0" />
                      <input type="number" value={editWeeklyFuelLimit} onChange={e => setEditWeeklyFuelLimit(e.target.value)}
                        className="flex-1 bg-transparent text-ferppa-gold font-mono font-bold text-lg focus:outline-none placeholder-ferppa-gold/30"
                        required />
                      <span className="text-ferppa-gold font-mono font-bold text-sm">L/semana</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10"
                style={{ background: 'rgba(0,0,0,0.2)' }}>
                <button type="button" onClick={() => setEditingItem(null)}
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
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Excluir Equipamento da Frota"
        description="Esta ação é permanente. O equipamento e TODOS os registros de abastecimento e viagens associados serão removidos do banco de dados."
        itemLabel={deletingItem ? `${deletingItem.plate} — ${deletingItem.model} — Motorista: ${deletingItem.driver_name}` : undefined}
      />
    </div>
  );
}
