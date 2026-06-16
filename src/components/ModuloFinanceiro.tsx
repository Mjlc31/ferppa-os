import React, { useState, useMemo } from 'react';
import { DollarSign, Edit, CheckCircle, TrendingDown, TrendingUp, Filter, BarChart3, Plus, ArrowUpCircle, ArrowDownCircle, Download } from 'lucide-react';
import { TransactionType } from '../types';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFerppaStore } from '../store';

type PeriodFilter = 'DIARIO' | '15_DIAS' | 'MENSAL' | 'ANUAL';

export default function ModuloFinanceiro() {
  const { financeTransactions: transactions, fuelLogs, trips, addFinanceTransaction: addTransaction, deleteFinanceTransaction: deleteTransaction } = useFerppaStore();
  const [activeTab, setActiveTab] = useState<'dre' | 'recebimentos' | 'despesas'>('recebimentos');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('MENSAL');
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [txType, setTxType] = useState<TransactionType>('DESPESA');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txTime, setTxTime] = useState(() => new Date().toTimeString().substring(0, 5));
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txPayee, setTxPayee] = useState('');
  const [txCategory, setTxCategory] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDate || !txDesc || !txAmount || !txPayee || !txCategory) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    addTransaction({
      type: txType,
      date: txDate,
      time: txTime,
      description: txDesc,
      amount: parseFloat(txAmount),
      payee: txPayee,
      category: txCategory
    });

    toast.success('Lançamento registrado com sucesso!');
    setShowForm(false);
    setTxDesc('');
    setTxAmount('');
    setTxPayee('');
  };

  // Derived data based on periodFilter
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();

    if (periodFilter === 'DIARIO') cutoff.setDate(now.getDate() - 1);
    else if (periodFilter === '15_DIAS') cutoff.setDate(now.getDate() - 15);
    else if (periodFilter === 'MENSAL') cutoff.setMonth(now.getMonth() - 1);
    else if (periodFilter === 'ANUAL') cutoff.setFullYear(now.getFullYear() - 1);

    const isInFilter = (dateStr: string) => new Date(dateStr) >= cutoff;

    const autoReceitas = trips.filter(t => isInFilter(t.date)).reduce((sum, t) => sum + t.total_price, 0);
    const manualReceitas = transactions.filter(t => t.type === 'RECEBIMENTO' && isInFilter(t.date)).reduce((sum, t) => sum + t.amount, 0);
    
    // Add trips and manual revenues
    const totalReceitas = autoReceitas + manualReceitas;

    const autoDespesas = fuelLogs.filter(f => isInFilter(f.date)).reduce((sum, f) => sum + f.total_value, 0);
    const manualDespesas = transactions.filter(t => t.type === 'DESPESA' && isInFilter(t.date)).reduce((sum, t) => sum + t.amount, 0);

    const totalDespesas = autoDespesas + manualDespesas;
    const lucroLiquido = totalReceitas - totalDespesas;
    const margem = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;

    return { totalReceitas, totalDespesas, autoReceitas, manualReceitas, autoDespesas, manualDespesas, lucroLiquido, margem };
  }, [transactions, fuelLogs, trips, periodFilter]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.text('Relatório Financeiro DRE - Ferppa OS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Período do Relatório: ${periodFilter.replace('_', ' ')}`, 14, 30);
    
    doc.setFontSize(12);
    doc.text('1. Demonstrativo de Resultados (DRE)', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Descrição', 'Valor (R$)']],
      body: [
        ['RECEITA OPERACIONAL BRUTA', filteredData.totalReceitas.toFixed(2)],
        ['  - Faturamento Contratos (Tickets)', filteredData.autoReceitas.toFixed(2)],
        ['  - Entradas Avulsas/Manuais', filteredData.manualReceitas.toFixed(2)],
        ['DEDUÇÕES E CUSTOS OPERACIONAIS', filteredData.totalDespesas.toFixed(2)],
        ['  - Custo de Combustível', filteredData.autoDespesas.toFixed(2)],
        ['  - Despesas Manuais / Fornecedores', filteredData.manualDespesas.toFixed(2)],
        ['RESULTADO LÍQUIDO DO EXERCÍCIO', filteredData.lucroLiquido.toFixed(2)],
        ['Margem Operacional (%)', filteredData.margem.toFixed(2) + '%'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [40, 50, 50] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.text('2. Extrato Financeiro de Lançamentos (Manuais)', 14, finalY + 15);
    
    const txBody = transactions.map(tx => [
      `${new Date(tx.date).toLocaleDateString('pt-BR')} ${tx.time}`,
      tx.type,
      tx.description,
      tx.category,
      tx.payee,
      `R$ ${tx.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Data/Hora', 'Tipo', 'Descrição', 'Categoria', 'Favorecido/Origem', 'Valor']],
      body: txBody,
      theme: 'striped',
      headStyles: { fillColor: [40, 50, 50] }
    });

    doc.save('relatorio-financeiro-ferppa.pdf');
    toast.success('Relatório PDF gerado com sucesso!');
  };

  return (
    <div className="flex-1 flex flex-col pt-4 lg:pt-0 max-w-[100vw] overflow-hidden gap-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-ferppa-gold" /> MÓDULO FINANCEIRO
          </h1>
          <p className="text-gray-400 text-sm tracking-wide mt-1">Gestão de caixa, DRE e controle geral.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="border border-white/20 hover:bg-white/5 text-white font-bold px-4 py-2 rounded shadow flex items-center gap-2 transition-transform active:scale-95 text-xs tracking-wider"
          >
            <Download className="w-4 h-4" /> EXPORTAR PDF
          </button>
          <button
            onClick={() => {
              setTxType(activeTab === 'recebimentos' ? 'RECEBIMENTO' : 'DESPESA');
              setShowForm(true);
            }}
            className="bg-ferppa-gold hover:bg-[#c2a169] text-ferppa-dark font-bold px-4 py-2 rounded shadow flex items-center gap-2 transition-transform active:scale-95 text-xs tracking-wider"
          >
            <Plus className="w-4 h-4" /> NOVO LANÇAMENTO
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl p-6 relative">
          <h2 className="text-lg font-bold text-white mb-4">Registrar {txType === 'DESPESA' ? 'Despesa' : 'Recebimento'}</h2>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-ferppa-gold font-bold block">Tipo</label>
              <select value={txType} onChange={e => setTxType(e.target.value as TransactionType)} className="w-full bg-ferppa-dark border border-ferppa-gold/50 rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-bold">
                <option value="DESPESA">Saída (Despesa)</option>
                <option value="RECEBIMENTO">Entrada (Receita)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold block">Data</label>
              <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} required className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold block">Hora</label>
              <input type="time" value={txTime} onChange={e => setTxTime(e.target.value)} required className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold block">Valor (R$)</label>
              <input type="number" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} required placeholder="Ex: 1500.00" className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite font-mono" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs text-gray-400 font-semibold block">Descrição</label>
              <input type="text" value={txDesc} onChange={e => setTxDesc(e.target.value)} required placeholder="Ex: Pagamento de manutenção retroescavadeira" className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold block">Pessoa / Fornecedor</label>
              <input type="text" value={txPayee} onChange={e => setTxPayee(e.target.value)} required placeholder="Ex: Auto Peças Silva" className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold block">Categoria</label>
              <select value={txCategory} onChange={e => setTxCategory(e.target.value)} required className="w-full bg-ferppa-dark border border-[#26383a] rounded px-3 py-2 text-xs focus:outline-none focus:border-ferppa-gold text-ferppa-offwhite">
                <option value="">Selecione...</option>
                {txType === 'DESPESA' ? (
                  <>
                    <option value="Manutenção Frota">Manutenção Frota</option>
                    <option value="Peças e Insumos">Peças e Insumos</option>
                    <option value="Folha Pagamento">Folha Pagamento</option>
                    <option value="Combustível Avulso">Combustível Avulso</option>
                    <option value="Impostos">Impostos</option>
                    <option value="Outros">Outros</option>
                  </>
                ) : (
                  <>
                    <option value="Faturamento Contrato">Faturamento Contrato</option>
                    <option value="Venda Avulsa">Venda Avulsa</option>
                    <option value="Outros">Outros</option>
                  </>
                )}
              </select>
            </div>
            
            <div className="lg:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t border-[#26383a]">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-white text-xs font-bold transition-colors">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-ferppa-gold hover:bg-[#c2a169] text-ferppa-dark rounded text-xs font-bold transition-colors flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> SALVAR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto minimal-scrollbar">
        <button onClick={() => setActiveTab('recebimentos')} className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === 'recebimentos' ? 'border-ferppa-gold text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
          <ArrowUpCircle className="w-4 h-4" /> Recebimentos / Faturamento (Adm)
        </button>
        <button onClick={() => setActiveTab('despesas')} className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === 'despesas' ? 'border-ferppa-gold text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
          <ArrowDownCircle className="w-4 h-4" /> Despesas & Contas a Pagar
        </button>
        <button onClick={() => setActiveTab('dre')} className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === 'dre' ? 'border-ferppa-gold text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
          <BarChart3 className="w-4 h-4" /> Visão DRE
        </button>
      </div>

      <div className="flex justify-start">
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
          <button onClick={() => setPeriodFilter('DIARIO')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded ${periodFilter === 'DIARIO' ? 'bg-ferppa-gold text-ferppa-dark' : 'text-gray-400 hover:text-white'}`}>Diário</button>
          <button onClick={() => setPeriodFilter('15_DIAS')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded ${periodFilter === '15_DIAS' ? 'bg-ferppa-gold text-ferppa-dark' : 'text-gray-400 hover:text-white'}`}>15 Dias</button>
          <button onClick={() => setPeriodFilter('MENSAL')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded ${periodFilter === 'MENSAL' ? 'bg-ferppa-gold text-ferppa-dark' : 'text-gray-400 hover:text-white'}`}>Mensal</button>
          <button onClick={() => setPeriodFilter('ANUAL')} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded ${periodFilter === 'ANUAL' ? 'bg-ferppa-gold text-ferppa-dark' : 'text-gray-400 hover:text-white'}`}>Anual</button>
        </div>
      </div>

      {activeTab === 'dre' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#11191a] border border-[#1e2a2c] rounded-xl p-6">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Total Receitas</div>
              <div className="text-2xl font-mono text-green-400 font-bold">R$ {filteredData.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-gray-500 mt-2 font-mono">Faturamento auto: R$ {filteredData.autoReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-[#11191a] border border-[#1e2a2c] rounded-xl p-6">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Total Despesas</div>
              <div className="text-2xl font-mono text-red-400 font-bold">R$ {filteredData.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-gray-500 mt-2 font-mono">Custo Combustível: R$ {filteredData.autoDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-[#11191a] border border-ferppa-gold/30 rounded-xl p-6 relative overflow-hidden group">
              <div className="text-[10px] uppercase tracking-widest text-ferppa-gold/70 font-bold mb-2">Lucro Líquido / Margem</div>
              <div className={`text-2xl font-mono font-bold ${filteredData.lucroLiquido >= 0 ? 'text-ferppa-gold' : 'text-red-400'}`}>R$ {filteredData.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs mt-2 font-mono font-bold text-white uppercase tracking-widest">Margem OP: {filteredData.margem.toFixed(1)}%</div>
            </div>
          </div>
          <div className="bg-[#11191a] border border-[#1e2a2c] rounded-xl p-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-6 border-b border-[#1e2a2c] pb-3">Demonstrativo de Resultado do Exercício (Automático)</h3>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between items-center text-green-400">
                <span>1. RECEITA OPERACIONAL BRUTA</span>
                <span>R$ {filteredData.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 text-xs pl-4 border-l border-[#1e2a2c]">
                <span>1.1 Faturamento Contratos (Tickets Locais)</span>
                <span>R$ {filteredData.autoReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 text-xs pl-4 border-l border-[#1e2a2c]">
                <span>1.2 Faturamento Avulso / Outros Entradas</span>
                <span>R$ {filteredData.manualReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="my-4 border-t border-[#1e2a2c]"></div>
              
              <div className="flex justify-between items-center text-red-400">
                <span>2. DEDUÇÕES E CUSTOS OPERACIONAIS</span>
                <span>R$ {filteredData.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 text-xs pl-4 border-l border-[#1e2a2c]">
                <span>2.1 Custo de Combustível (Integração Abastecimentos)</span>
                <span>R$ {filteredData.autoDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 text-xs pl-4 border-l border-[#1e2a2c]">
                <span>2.2 Despesas Manuais / Fornecedores / Folha</span>
                <span>R$ {filteredData.manualDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="my-4 border-t border-[#1e2a2c]"></div>
              <div className={`flex justify-between items-center font-bold text-lg ${filteredData.lucroLiquido >= 0 ? 'text-ferppa-gold' : 'text-red-400'}`}>
                <span>3. RESULTADO LÍQUIDO DO EXERCÍCIO</span>
                <span>R$ {filteredData.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'recebimentos' || activeTab === 'despesas') && (
        <div className="bg-gradient-to-b from-[#182324] to-[#131b1c] shadow-panel border border-[#1e2a2c] rounded-xl flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b border-[#1e2a2c] text-left text-[10px] uppercase font-bold tracking-widest text-gray-500">Data/Hora</th>
                  <th className="p-4 border-b border-[#1e2a2c] text-left text-[10px] uppercase font-bold tracking-widest text-gray-500">Descrição / Categoria</th>
                  <th className="p-4 border-b border-[#1e2a2c] text-left text-[10px] uppercase font-bold tracking-widest text-gray-500">{activeTab === 'despesas' ? 'Fornecedor / Favorecido' : 'Origem / Cliente'}</th>
                  <th className="p-4 border-b border-[#1e2a2c] text-right text-[10px] uppercase font-bold tracking-widest text-gray-500">Valor (R$)</th>
                  <th className="p-4 border-b border-[#1e2a2c] text-center text-[10px] uppercase font-bold tracking-widest text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a2c]">
                {transactions
                  .filter(t => t.type === (activeTab === 'despesas' ? 'DESPESA' : 'RECEBIMENTO'))
                  .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())
                  .map(tx => (
                  <tr key={tx.id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono text-xs text-gray-400">
                      <div>{new Date(tx.date).toLocaleDateString('pt-BR')}</div>
                      <div className="text-[10px] text-gray-600">{tx.time}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-white font-bold">{tx.description}</div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-ferppa-gold mt-1">{tx.category}</div>
                    </td>
                    <td className="p-4 text-xs font-sans text-gray-300">
                      {tx.payee}
                    </td>
                    <td className={`p-4 font-mono font-bold text-right ${tx.type === 'DESPESA' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'DESPESA' ? '- ' : '+ '}R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => toast.info('Funcionalidade de edição em desenvolvimento.')} className="p-1.5 text-gray-500 hover:text-ferppa-gold transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.filter(t => t.type === (activeTab === 'despesas' ? 'DESPESA' : 'RECEBIMENTO')).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500 text-xs font-mono uppercase tracking-widest">
                      Nenhum registro manual encontrado para o período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
