import React, { useState } from "react";
import { useFerppaStore } from "../store";
import { LeadStatus } from "../types";
import { motion } from "motion/react";
import { Plus, Search, MoreVertical, Phone, Mail, Clock, CheckCircle2, UserCircle2, Building2 } from "lucide-react";

const STATUS_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'NOVO', label: 'Novo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'EM CONTATO', label: 'Em Contato', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'NEGOCIAÇÃO', label: 'Negociação', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'CONVERTIDO', label: 'Convertido', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'PERDIDO', label: 'Perdido', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

export default function ModuloCRM() {
  const { leads, updateLeadStatus, deleteLead } = useFerppaStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

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

  return (
    <div className="w-full flex flex-col h-full bg-[#0a0e0f] rounded-2xl border border-[#1e2a2c] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#1e2a2c] bg-[#0d1314] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            CRM <span className="text-ferppa-gold">Leads</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Gestão de funil de vendas e prospects vindos da Landing Page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar lead ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141d1e] border border-[#1e2a2c] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold focus:ring-1 focus:ring-ferppa-gold w-full md:w-64"
            />
          </div>
          <button className="bg-ferppa-gold text-ferppa-dark px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Lead
          </button>
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
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${column.color}`}>
                  {column.label}
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {filteredLeads.filter((l) => l.status === column.id).length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {filteredLeads
                  .filter((l) => l.status === column.id)
                  .map((lead) => (
                    <motion.div
                      layoutId={lead.id}
                      key={lead.id}
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, lead.id)}
                      className={`p-4 rounded-xl border cursor-grab active:cursor-grabbing hover:border-ferppa-gold/50 transition-colors ${
                        draggedLead === lead.id
                          ? "bg-[#1e2a2c] border-ferppa-gold opacity-50"
                          : "bg-[#141d1e] border-[#1e2a2c]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm text-gray-100 flex items-center gap-2">
                          {lead.name}
                        </h3>
                        <button className="text-gray-500 hover:text-white transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {lead.company && (
                        <div className="flex items-center gap-1.5 text-xs text-ferppa-gold/80 mb-2">
                          <Building2 className="w-3 h-3" />
                          <span>{lead.company}</span>
                        </div>
                      )}

                      <div className="space-y-1.5 mt-3">
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#1e2a2c] flex items-center justify-between text-[10px] text-gray-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="bg-[#1e2a2c] px-2 py-0.5 rounded text-gray-300">
                          {lead.source || "Orgânico"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
