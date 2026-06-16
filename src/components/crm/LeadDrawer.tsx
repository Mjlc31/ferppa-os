import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Phone, Mail, Calendar, DollarSign, Building2, 
  UserCircle2, Clock, CheckCircle2, MessageSquare, 
  Plus, Activity, Check, Circle
} from 'lucide-react';
import { Lead, LeadTaskType, LeadStatus } from '../../types';
import { useFerppaStore } from '../../store';

interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function LeadDrawer({ leadId, onClose }: LeadDrawerProps) {
  const { 
    leads, leadTasks, leadNotes, 
    updateLead, addLeadTask, updateLeadTask, addLeadNote,
    userProfile
  } = useFerppaStore();
  
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'TASKS' | 'NOTES'>('DETAILS');
  
  const lead = leads.find(l => l.id === leadId);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<LeadTaskType>('CALL');
  const [newTaskDate, setNewTaskDate] = useState('');
  
  const [newNoteContent, setNewNoteContent] = useState('');
  
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editValue, setEditValue] = useState('');

  if (!lead) return null;

  const tasks = leadTasks.filter(t => t.lead_id === lead.id).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const notes = leadNotes.filter(n => n.lead_id === lead.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleSaveValue = () => {
    updateLead(lead.id, { estimated_value: Number(editValue) });
    setIsEditingValue(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDate) return;
    addLeadTask({
      lead_id: lead.id,
      title: newTaskTitle,
      type: newTaskType,
      due_date: newTaskDate,
      completed: false
    });
    setNewTaskTitle('');
    setNewTaskDate('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent) return;
    addLeadNote({
      lead_id: lead.id,
      content: newNoteContent,
      author_email: userProfile?.email
    });
    setNewNoteContent('');
  };

  const getTaskIcon = (type: LeadTaskType) => {
    switch (type) {
      case 'CALL': return <Phone className="w-3 h-3" />;
      case 'EMAIL': return <Mail className="w-3 h-3" />;
      case 'MEETING': return <UserCircle2 className="w-3 h-3" />;
      case 'TODO': return <CheckCircle2 className="w-3 h-3" />;
    }
  };

  return (
    <AnimatePresence>
      {leadId && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-md h-full bg-[#0d1314] border-l border-[#1e2a2c] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#1e2a2c] bg-gradient-to-br from-[#141d1e] to-[#0d1314] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ferppa-gold/5 rounded-full blur-[50px] pointer-events-none"></div>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-ferppa-dark border border-ferppa-gold/30 flex items-center justify-center text-ferppa-gold font-black text-xl shadow-[0_0_15px_rgba(183,145,82,0.15)]">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{lead.name}</h2>
                  {lead.company && (
                    <div className="flex items-center gap-1.5 text-xs text-ferppa-gold">
                      <Building2 className="w-3 h-3" />
                      <span>{lead.company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Value */}
              <div className="flex gap-4 mt-4">
                <div className="flex-1 bg-[#0a0e0f] rounded-lg p-3 border border-[#1e2a2c]">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Status Atual</span>
                  <span className="text-xs font-semibold text-white px-2 py-1 rounded bg-ferppa-dark border border-[#2a3a3d]">
                    {lead.status}
                  </span>
                </div>
                <div className="flex-1 bg-[#0a0e0f] rounded-lg p-3 border border-[#1e2a2c] relative group">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Valor Estimado</span>
                  {isEditingValue ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="bg-ferppa-dark text-white text-xs px-2 py-1 rounded border border-ferppa-gold/50 w-full focus:outline-none"
                        placeholder="Valor"
                      />
                      <button onClick={handleSaveValue} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4"/></button>
                    </div>
                  ) : (
                    <div 
                      className="text-sm font-bold text-green-400 cursor-pointer flex items-center gap-1"
                      onClick={() => { setEditValue(lead.estimated_value?.toString() || ''); setIsEditingValue(true); }}
                    >
                      <DollarSign className="w-3 h-3" />
                      {lead.estimated_value ? formatCurrency(lead.estimated_value) : 'Adicionar Valor'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#1e2a2c] px-6 mt-2 gap-6">
              {[
                { id: 'DETAILS', label: 'Detalhes', icon: UserCircle2 },
                { id: 'TASKS', label: 'Tarefas', icon: CheckCircle2 },
                { id: 'NOTES', label: 'Histórico', icon: Activity }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'border-ferppa-gold text-ferppa-gold' 
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0a0e0f]">
              {/* DETAILS TAB */}
              {activeTab === 'DETAILS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold border-b border-[#1e2a2c] pb-2">Informações de Contato</h3>
                    
                    <div className="bg-[#141d1e] rounded-xl p-4 border border-[#1e2a2c] space-y-4">
                      {lead.phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-ferppa-dark flex items-center justify-center text-ferppa-gold">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-gray-500 block">Telefone / WhatsApp</span>
                            <span className="text-sm text-white">{lead.phone}</span>
                          </div>
                        </div>
                      )}
                      
                      {lead.email && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-ferppa-dark flex items-center justify-center text-ferppa-gold">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-gray-500 block">E-mail</span>
                            <span className="text-sm text-white">{lead.email}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold border-b border-[#1e2a2c] pb-2">Dados Adicionais</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#141d1e] rounded-xl p-3 border border-[#1e2a2c]">
                        <span className="text-[10px] uppercase text-gray-500 block mb-1">Origem do Lead</span>
                        <span className="text-sm text-white">{lead.source || 'Orgânico'}</span>
                      </div>
                      <div className="bg-[#141d1e] rounded-xl p-3 border border-[#1e2a2c]">
                        <span className="text-[10px] uppercase text-gray-500 block mb-1">Data de Criação</span>
                        <span className="text-sm text-white">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    {lead.notes && (
                      <div className="bg-[#141d1e] rounded-xl p-4 border border-[#1e2a2c]">
                        <span className="text-[10px] uppercase text-gray-500 block mb-2">Observações Iniciais</span>
                        <p className="text-sm text-gray-300 leading-relaxed">{lead.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TASKS TAB */}
              {activeTab === 'TASKS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <form onSubmit={handleAddTask} className="bg-[#141d1e] rounded-xl p-4 border border-[#1e2a2c] space-y-4 shadow-lg">
                    <h3 className="text-xs uppercase tracking-widest text-ferppa-gold font-bold flex items-center gap-2">
                      <Plus className="w-3 h-3" /> Nova Tarefa
                    </h3>
                    
                    <input 
                      type="text"
                      placeholder="Ex: Ligar para confirmar proposta"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      className="w-full bg-[#0a0e0f] border border-[#2a3a3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-ferppa-gold"
                      required
                    />
                    
                    <div className="flex gap-2">
                      <select 
                        value={newTaskType}
                        onChange={(e) => setNewTaskType(e.target.value as LeadTaskType)}
                        className="bg-[#0a0e0f] border border-[#2a3a3d] rounded-lg px-2 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="CALL">Ligação</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="MEETING">Reunião</option>
                        <option value="TODO">A Fazer</option>
                      </select>
                      
                      <input 
                        type="date"
                        value={newTaskDate}
                        onChange={e => setNewTaskDate(e.target.value)}
                        className="flex-1 bg-[#0a0e0f] border border-[#2a3a3d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                    
                    <button type="submit" className="w-full bg-ferppa-dark text-ferppa-gold border border-ferppa-gold/50 rounded-lg py-2 text-xs font-bold uppercase tracking-widest hover:bg-ferppa-gold hover:text-ferppa-dark transition-colors">
                      Adicionar Tarefa
                    </button>
                  </form>

                  <div className="space-y-3">
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">Nenhuma tarefa agendada.</div>
                    ) : (
                      tasks.map(task => {
                        const isOverdue = new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0)) && !task.completed;
                        return (
                          <div 
                            key={task.id} 
                            className={`flex items-start gap-3 p-3 rounded-xl border ${
                              task.completed ? 'bg-[#0a0e0f] border-[#1e2a2c] opacity-50' : 
                              isOverdue ? 'bg-red-500/10 border-red-500/30' : 'bg-[#141d1e] border-[#2a3a3d]'
                            } transition-all`}
                          >
                            <button 
                              onClick={() => updateLeadTask(task.id, { completed: !task.completed })}
                              className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                task.completed ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'border-gray-500 hover:border-ferppa-gold text-transparent hover:text-ferppa-gold/50'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono tracking-wider">
                                <span className={`flex items-center gap-1 ${task.completed ? 'text-gray-600' : 'text-ferppa-gold/80'}`}>
                                  {getTaskIcon(task.type)} {task.type}
                                </span>
                                <span className={`flex items-center gap-1 ${isOverdue && !task.completed ? 'text-red-400' : 'text-gray-500'}`}>
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'NOTES' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <form onSubmit={handleAddNote} className="relative">
                    <textarea 
                      value={newNoteContent}
                      onChange={e => setNewNoteContent(e.target.value)}
                      placeholder="Registrar interação, resumo de ligação..."
                      className="w-full bg-[#141d1e] border border-[#2a3a3d] rounded-xl p-4 pr-12 text-sm text-white focus:outline-none focus:border-ferppa-gold min-h-[100px] resize-none"
                      required
                    />
                    <button 
                      type="submit"
                      disabled={!newNoteContent}
                      className="absolute bottom-3 right-3 w-8 h-8 bg-ferppa-gold text-ferppa-dark rounded-lg flex items-center justify-center hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#2a3a3d] before:to-transparent">
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">Nenhum histórico registrado.</div>
                    ) : (
                      notes.map(note => (
                        <div key={note.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0a0e0f] bg-[#141d1e] text-ferppa-gold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#141d1e] p-4 rounded-xl border border-[#1e2a2c] shadow">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-xs text-ferppa-gold">{note.author_email?.split('@')[0] || 'Usuário'}</span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {new Date(note.created_at).toLocaleDateString('pt-BR')} {new Date(note.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
