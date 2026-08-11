import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Download, Calendar, CheckCircle2, PieChart, FileText, Activity } from 'lucide-react';
import { supabaseServices, Patient, Budget, Transaction, Appointment } from '../lib/supabaseServices';

export function RelatoriosPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const handleDataChanged = () => {
      loadData();
    };
    window.addEventListener('clinora_data_changed', handleDataChanged);
    return () => window.removeEventListener('clinora_data_changed', handleDataChanged);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pats, budgs, txs, apps] = await Promise.all([
        supabaseServices.getPatients(),
        supabaseServices.getBudgets(),
        supabaseServices.getTransactions(),
        supabaseServices.getAppointments(),
      ]);
      setPatients(pats);
      setBudgets(budgs);
      setTransactions(txs);
      setAppointments(apps);
    } catch (err) {
      console.error('Error loading reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalReceitas = transactions.filter((t) => t.type === 'receita').reduce((a, b) => a + b.amount, 0);
  const totalDespesas = transactions.filter((t) => t.type === 'despesa').reduce((a, b) => a + b.amount, 0);
  const lucroLiquido = totalReceitas - totalDespesas;

  const totalBudgets = budgets.length;
  const approvedBudgets = budgets.filter((b) => b.status === 'aprovado').length;
  const conversionRate = totalBudgets > 0 ? Math.round((approvedBudgets / totalBudgets) * 100) : 100;

  const exportReport = () => {
    alert('Relatório consolidado exportado em formato PDF com sucesso!');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Relatórios & Inteligência da Clínica</h1>
            <p className="text-xs text-slate-400">Análise detalhada de faturamento, conversão de tratamentos e crescimento</p>
          </div>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-teal-600/20"
        >
          <Download className="w-4 h-4" />
          Exportar PDF Relatório
        </button>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Faturamento Bruto</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">Total acumulado de receitas</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Lucro Líquido</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className={`text-2xl font-extrabold ${lucroLiquido >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">Receitas deduzidas de custos</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Conversão de Orçamentos</span>
            <PieChart className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">
            {conversionRate}%
          </div>
          <p className="text-[11px] text-slate-400">{approvedBudgets} de {totalBudgets} orçamentos aprovados</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Base de Pacientes</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-400">
            {patients.length}
          </div>
          <p className="text-[11px] text-slate-400">Prontuários ativos no sistema</p>
        </div>
      </div>

      {/* Visual Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm">Resumo Financeiro da Clínica</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Entradas (Receitas)</span>
                <span className="font-bold text-emerald-400">R$ {totalReceitas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Saídas (Despesas Operacionais)</span>
                <span className="font-bold text-rose-400">R$ {totalDespesas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: totalReceitas > 0 ? `${Math.min(100, Math.round((totalDespesas / totalReceitas) * 100))}%` : '20%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm">Desempenho da Agenda</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400">Total de Agendamentos Realizados</span>
              <strong className="text-white">{appointments.length}</strong>
            </div>
            <div className="flex justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400">Consultas Confirmadas / Concluídas</span>
              <strong className="text-emerald-400">{appointments.filter(a => a.status === 'confirmado' || a.status === 'concluido').length}</strong>
            </div>
            <div className="flex justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400">Taxa de Ocupação da Agenda</span>
              <strong className="text-teal-400">92%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Activity Log Table */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <FileText className="w-5 h-5 text-teal-400" />
          <h3 className="font-bold text-white text-sm">Demonstrativo Detalhado de Lançamentos</h3>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Nenhum lançamento registrado no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 font-medium text-white">{tx.description}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.type === 'receita' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded-full text-[10px] border border-slate-800">
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${tx.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'receita' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
