import React, { useState } from "react";
import { useFerppaStore } from "../store";
import { LeadStatus } from "../types";
import { motion } from "motion/react";
import { Plus, Search, MoreVertical, Phone, Mail, Clock, CheckCircle2, UserCircle2, Building2, DollarSign, AlertCircle, BarChart3 } from "lucide-react";
import LeadDrawer from "./crm/LeadDrawer";

const STATUS_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'NOVO', label: 'Novo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'EM CONTATO', label: 'Em Contato', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'NEGOCIAÇÃO', label: 'Negociação', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'CONVERTIDO', label: 'Convertido', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'PERDIDO', label: 'Perdido', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ModuloCRM() {
  const { leads, leadTasks, updateLeadStatus } = useFerppaStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLead(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id && draggedLead === id) {
      updateLeadStatus(id, status);
    }
    setDraggedLead(null);
  };

  // Dashboard Stats
  const totalPipelineValue = leads
    .filter(l => !['CONVERTIDO', 'PERDIDO'].includes(l.status))
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  
  const activeLeadsCount = leads.filter(l => !['CONVERTIDO', 'PERDIDO'].includes(l.status)).length;
  
  const overdueTasksCount = leadTasks.filter(t => 
    !t.completed && new Date(t.due_date) < new Date(new Date().setHours(0,0,0,0))
  ).length;

  return (
    <div className="w-full flex flex-col h-full bg-[#0a0e0f] rounded-2xl border border-[#1e2a2c] overflow-hidden relative">
      {/* Header & Stats */}
      <div className="p-6 border-b border-[#1e2a2c] bg-gradient-to-br from-[#141d1e] to-[#0d1314]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              CRM <span className="text-ferppa-gold">Leads</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Gestão de funil de vendas, acompanhamento de clientes e previsibilidade de receita.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar lead ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0a0e0f] border border-[#1e2a2c] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold focus:ring-1 focus:ring-ferppa-gold w-full lg:w-64"
              />
            </div>
            <button className="bg-ferppa-gold text-ferppa-dark px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-500 transition-colors flex items-center gap-2 whitespace-nowrap shadow-[0_0_15px_rgba(183,145,82,0.2)]">
              <Plus className="w-4 h-4" /> Novo Lead
            </button>
          </div>
        </div>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0a0e0f] border border-[#1e2a2c] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Leads Ativos</span>
              <span className="text-xl font-bold text-white">{activeLeadsCount}</span>
            </div>
          </div>
          <div className="bg-[#0a0e0f] border border-[#1e2a2c] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-ferppa-gold/10 border border-ferppa-gold/20 flex items-center justify-center text-ferppa-gold shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Pipeline (Valor Estimado)</span>
              <span className="text-xl font-bold text-white">{formatCurrency(totalPipelineValue)}</span>
            </div>
          </div>
          <div className="bg-[#0a0e0f] border border-[#1e2a2c] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Tarefas Atrasadas</span>
              <span className="text-xl font-bold text-white">{overdueTasksCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-max">
          {STATUS_COLUMNS.map((column) => (
            <div
              key={column.id}
              className="flex flex-col w-80 bg-[#0d1314] border border-[#1e2a2c] rounded-xl overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-[#1e2a2c] flex items-center justify-between bg-[#141d1e]/50">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${column.color} uppercase tracking-wider`}>
                  {column.label}
                </div>
                <span className="text-xs text-gray-500 font-mono bg-[#0a0e0f] px-2 py-0.5 rounded border border-[#1e2a2c]">
                  {filteredLeads.filter((l) => l.status === column.id).length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {filteredLeads
                  .filter((l) => l.status === column.id)
                  .map((lead) => {
                    const leadPendingTasks = leadTasks.filter(t => t.lead_id === lead.id && !t.completed).length;

                    return (
                      <motion.div
                        layoutId={lead.id}
                        key={lead.id}
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`p-4 rounded-xl border cursor-pointer active:cursor-grabbing hover:border-ferppa-gold/50 transition-colors shadow-sm ${
                          draggedLead === lead.id
                            ? "bg-[#1e2a2c] border-ferppa-gold opacity-50"
                            : "bg-[#141d1e] border-[#2a3a3d]"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                            {lead.name}
                          </h3>
                        </div>

                        {lead.company && (
                          <div className="flex items-center gap-1.5 text-xs text-ferppa-gold/80 mb-3">
                            <Building2 className="w-3 h-3" />
                            <span className="font-medium tracking-wide">{lead.company}</span>
                          </div>
                        )}

                        {lead.estimated_value ? (
                          <div className="text-sm font-bold text-green-400 mb-3 flex items-center gap-1 bg-green-400/5 px-2 py-1 rounded w-max border border-green-400/10">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(lead.estimated_value)}
                          </div>
                        ) : null}

                        <div className="mt-4 pt-3 border-t border-[#1e2a2c] flex items-center justify-between text-[10px] text-gray-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          {leadPendingTasks > 0 && (
                            <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                              <CheckCircle2 className="w-3 h-3" />
                              {leadPendingTasks} pendente{leadPendingTasks > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawer Overlay */}
      <LeadDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
    </div>
  );
}
