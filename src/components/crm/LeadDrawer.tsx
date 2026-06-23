import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Phone, Mail, Calendar, DollarSign, Building2, 
  UserCircle2, Clock, CheckCircle2, MessageSquare, 
  Plus, Activity, Check, Edit2, Trash2, Save, AlertTriangle
} from 'lucide-react';
import { Lead, LeadTaskType, LeadStatus } from '../../types';
import { useFerppaStore } from '../../store';
import { toast } from 'sonner';

interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const STATUS_OPTIONS: LeadStatus[] = ['NOVO', 'EM CONTATO', 'NEGOCIAÇÃO', 'CONVERTIDO', 'PERDIDO'];

export default function LeadDrawer({ leadId, onClose }: LeadDrawerProps) {
  const { 
    leads, leadTasks, leadNotes, 
    updateLead, deleteLead,
    addLeadTask, updateLeadTask, deleteLeadTask,
    addLeadNote, deleteLeadNote,
    userProfile
  } = useFerppaStore();
  
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'TASKS' | 'NOTES'>('DETAILS');
  
  const lead = leads.find(l => l.id === leadId);

  // ─── Task Form ───────────────────────────────────────────────────────────────
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<LeadTaskType>('CALL');
  const [newTaskDate, setNewTaskDate] = useState('');
  
  // ─── Note Form ───────────────────────────────────────────────────────────────
  const [newNoteContent, setNewNoteContent] = useState('');

  // ─── Edit Lead (full) ────────────────────────────────────────────────────────
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editStatus, setEditStatus] = useState<LeadStatus>('NOVO');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingLead, setIsSavingLead] = useState(false);

  // ─── Delete Lead ─────────────────────────────────────────────────────────────
  const [showDeleteLead, setShowDeleteLead] = useState(false);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  // ─── Delete Task/Note ─────────────────────────────────────────────────────────
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const openEditLead = () => {
    if (!lead) return;
    setEditName(lead.name);
    setEditPhone(lead.phone || '');
    setEditEmail(lead.email || '');
    setEditCompany(lead.company || '');
    setEditSource(lead.source || 'Indicação');
    setEditValue(lead.estimated_value ? String(lead.estimated_value) : '');
    setEditStatus(lead.status);
    setEditNotes(lead.notes || '');
    setIsEditingLead(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !editName || !editPhone) { toast.error('Nome e telefone são obrigatórios.'); return; }
    setIsSavingLead(true);
    try {
      await updateLead(lead.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        company: editCompany.trim() || undefined,
        source: editSource,
        estimated_value: editValue ? parseFloat(editValue) : undefined,
        status: editStatus,
        notes: editNotes.trim() || undefined,
      });
      toast.success('Lead atualizado com sucesso!');
      setIsEditingLead(false);
    } catch {
      toast.error('Erro ao salvar alterações.');
    } finally {
      setIsSavingLead(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    setIsDeletingLead(true);
    try {
      await deleteLead(lead.id);
      toast.success(`Lead "${lead.name}" excluído.`);
      onClose();
    } catch {
      toast.error('Erro ao excluir lead.');
    } finally {
      setIsDeletingLead(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setDeletingTaskId(taskId);
    try {
      await deleteLeadTask(taskId);
      toast.success('Tarefa removida.');
    } catch {
      toast.error('Erro ao remover tarefa.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    try {
      await deleteLeadNote(noteId);
      toast.success('Nota removida.');
    } catch {
      toast.error('Erro ao remover nota.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  // Close edit on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsEditingLead(false); };
    if (isEditingLead) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isEditingLead]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDate || !lead) return;
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
    if (!newNoteContent || !lead) return;
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

  if (!lead) return null;

  const tasks = leadTasks.filter(t => t.lead_id === lead.id).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const notes = leadNotes.filter(n => n.lead_id === lead.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white tracking-tight truncate">{lead.name}</h2>
                  {lead.company && (
                    <div className="flex items-center gap-1.5 text-xs text-ferppa-gold">
                      <Building2 className="w-3 h-3" />
                      <span>{lead.company}</span>
                    </div>
                  )}
                </div>
                {/* Admin actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={openEditLead}
                    className="p-2 rounded-lg text-gray-500 hover:text-ferppa-gold hover:bg-ferppa-gold/10 transition-all"
                    title="Editar Lead"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteLead(true)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Excluir Lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                <div className="flex-1 bg-[#0a0e0f] rounded-lg p-3 border border-[#1e2a2c]">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Valor Estimado</span>
                  <div className="text-sm font-bold text-green-400 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
                  </div>
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
                            className={`flex items-start gap-3 p-3 rounded-xl border group ${
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
                            {/* Delete task button */}
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={deletingTaskId === task.id}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                              title="Remover tarefa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {new Date(note.created_at).toLocaleDateString('pt-BR')} {new Date(note.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  disabled={deletingNoteId === note.id}
                                  className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100"
                                  title="Remover nota"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
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

          {/* ─── EDIT LEAD MODAL ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {isEditingLead && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm"
                  onClick={() => setIsEditingLead(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed inset-0 z-[120] flex items-center justify-center p-4"
                >
                  <div
                    className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #1a2426 0%, #131b1c 100%)',
                      border: '1px solid rgba(212,175,55,0.3)',
                    }}
                  >
                    <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #d4af37, #b8960c)' }} />

                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
                          <span className="text-ferppa-gold font-black text-lg">{lead.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Editar Lead</h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">{lead.name}</p>
                        </div>
                      </div>
                      <button onClick={() => setIsEditingLead(false)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveLead}>
                      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto minimal-scrollbar">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Nome Completo *</label>
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required
                            className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Telefone / WhatsApp *</label>
                          <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} required
                            className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">E-mail</label>
                          <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                            className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Empresa</label>
                          <input type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)}
                            className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Status</label>
                          <select value={editStatus} onChange={e => setEditStatus(e.target.value as LeadStatus)}
                            className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-bold">
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Origem</label>
                          <select value={editSource} onChange={e => setEditSource(e.target.value)}
                            className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite">
                            {['Indicação','WhatsApp','Instagram','Google','Visita Presencial','Ligação Fria','Outros'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Valor Estimado (R$)</label>
                          <div className="rounded-xl px-4 py-3 border border-ferppa-gold/20" style={{ background: 'rgba(212,175,55,0.06)' }}>
                            <div className="flex items-center gap-3">
                              <DollarSign className="w-4 h-4 text-ferppa-gold shrink-0" />
                              <input type="number" step="0.01" value={editValue} onChange={e => setEditValue(e.target.value)}
                                placeholder="0,00"
                                className="flex-1 bg-transparent text-green-400 font-mono font-bold text-lg focus:outline-none placeholder-green-400/30" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[11px] text-gray-400 font-semibold block uppercase tracking-wider">Observações</label>
                          <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                            className="w-full bg-ferppa-dark border border-[#26383a] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite resize-none" />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10"
                        style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <button type="button" onClick={() => setIsEditingLead(false)}
                          className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors">
                          CANCELAR
                        </button>
                        <button type="submit" disabled={isSavingLead}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-ferppa-dark transition-all active:scale-95 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}>
                          <Save className="w-4 h-4" />
                          {isSavingLead ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ─── DELETE LEAD CONFIRMATION ──────────────────────────────────────── */}
          <AnimatePresence>
            {showDeleteLead && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm"
                  onClick={() => setShowDeleteLead(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed inset-0 z-[120] flex items-center justify-center p-4"
                >
                  <div
                    className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #1a1010 0%, #131b1c 100%)',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}
                  >
                    <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #ef4444, #b91c1c)' }} />
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/30 shrink-0">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">Excluir Lead</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Esta ação é irreversível</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">Você está prestes a excluir o lead:</p>
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                        <p className="text-sm font-bold text-red-300">{lead.name}</p>
                        {lead.company && <p className="text-xs text-gray-500 mt-0.5">{lead.company}</p>}
                      </div>
                      <p className="text-xs text-gray-500 mb-6">Todas as tarefas e notas relacionadas também serão removidas permanentemente.</p>
                      <div className="flex gap-3">
                        <button onClick={() => setShowDeleteLead(false)}
                          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors">
                          CANCELAR
                        </button>
                        <button onClick={handleDeleteLead} disabled={isDeletingLead}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}>
                          <Trash2 className="w-4 h-4" />
                          {isDeletingLead ? 'EXCLUINDO...' : 'SIM, EXCLUIR'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
