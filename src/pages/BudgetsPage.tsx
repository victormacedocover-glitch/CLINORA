import React, { useState, useEffect } from 'react';
import { supabaseServices, Budget } from '../lib/supabaseServices';
import { FileText, Plus, DollarSign, User, CheckCircle2, Send, Clock, XCircle, Trash2, Check } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [patientName, setPatientName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(1500);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseServices.getBudgets();
    setBudgets(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !description) return;

    setSaving(true);
    await supabaseServices.createBudget({
      clinicId: 'c1',
      patientName,
      description,
      amount: Number(amount),
      status: 'enviado',
    });

    setSaving(false);
    setShowModal(false);
    setPatientName('');
    setDescription('');
    setAmount(1500);
    loadData();
  };

  const handleStatusChange = async (id: string, status: Budget['status']) => {
    await supabaseServices.updateBudgetStatus(id, status);
    loadData();
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    await supabaseServices.deleteBudget(deleteTargetId);
    setDeleting(false);
    setDeleteTargetId(null);
    loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Gestão de Orçamentos</h1>
            <p className="text-slate-400 text-sm">Propostas financeiras para tratamentos de pacientes</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando orçamentos...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
          Nenhum orçamento cadastrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <div
              key={b.id}
              className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-white">{b.patientName}</h3>
                </div>
                <p className="text-xs text-slate-300">{b.description}</p>
                <span className="text-[11px] text-slate-500 block">
                  Criado em {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Valor Total</span>
                  <span className="text-lg font-bold text-emerald-400">
                    R$ {b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(b.id, b.status === 'aprovado' ? 'enviado' : 'aprovado')}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition cursor-pointer ${
                      b.status === 'aprovado'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : b.status === 'enviado'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {b.status === 'aprovado' ? '✓ APROVADO' : 'APROVAR?'}
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(b.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
                    title="Excluir orçamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Novo Orçamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Novo Orçamento</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Paciente *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome do cliente/paciente"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descrição do Tratamento Proposto *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: 2x Restauração em resina + Clareamento caseiro"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Valor Total Proposto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
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
                  {saving ? 'Gerando...' : 'Gerar Orçamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal - Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Excluir Orçamento"
        message="Tem certeza que deseja excluir esta proposta de orçamento?"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
