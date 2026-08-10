import React, { useState, useEffect } from 'react';
import { supabaseServices, Transaction } from '../lib/supabaseServices';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, Wallet, Calendar } from 'lucide-react';

export function FinancialPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('receita');
  const [amount, setAmount] = useState(300);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseServices.getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    setSaving(true);
    await supabaseServices.createTransaction({
      clinicId: 'c1',
      description,
      type,
      amount: Number(amount),
      status: 'pago',
      date,
    });

    setSaving(false);
    setShowModal(false);
    setDescription('');
    setAmount(300);
    loadData();
  };

  const totalReceitas = transactions
    .filter((t) => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDespesas = transactions
    .filter((t) => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0);

  const saldoLiquido = totalReceitas - totalDespesas;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Financeiro Básico</h1>
            <p className="text-slate-400 text-sm">Lançamento de receitas, despesas e saldo da clínica</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Transação
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Receitas do Mês</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Despesas Operacionais</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
            <span>Saldo Líquido</span>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <div className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando movimentações...</div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-800/80 border-b border-slate-700 font-semibold text-white text-sm">
            Histórico de Lançamentos
          </div>
          <div className="divide-y divide-slate-700/50">
            {transactions.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between text-sm hover:bg-slate-800/30 transition">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl border ${
                      t.type === 'receita'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {t.type === 'receita' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{t.description}</h4>
                    <span className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div
                  className={`font-bold text-base ${
                    t.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {t.type === 'receita' ? '+ ' : '- '}
                  R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal - Nova Transação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Nova Transação Financeira</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Lançamento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('receita')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      type === 'receita'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    + Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('despesa')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      type === 'despesa'
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    - Despesa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descrição / Referência *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Recebimento de consulta, Conta de luz, Material"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition"
                >
                  {saving ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
