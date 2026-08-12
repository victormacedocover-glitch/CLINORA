import React, { useState, useEffect } from 'react';
import { supabaseServices, ProcedureItem } from '../lib/supabaseServices';
import { Sliders, Plus, Clock, DollarSign, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export function ProceduresPage() {
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState(250);
  const [duration, setDuration] = useState(45);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await supabaseServices.getProcedures();
      setProcedures(data);
    } catch (err) {
      console.error('Error loading procedures:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setErrorMsg('');

    try {
      await supabaseServices.createProcedure({
        clinicId: '',
        name: name.trim(),
        price: Number(price),
        duration: Number(duration),
        active: true,
      });

      setSuccessMsg('Procedimento cadastrado com sucesso.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
      setName('');
      setPrice(250);
      setDuration(45);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao cadastrar procedimento:', err);
      setErrorMsg(err.message || 'Não foi possível cadastrar o procedimento.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    setErrorMsg('');

    try {
      await supabaseServices.deleteProcedure(deleteTargetId);
      setDeleteTargetId(null);
      setSuccessMsg('Procedimento excluído com sucesso.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir procedimento:', err);
      setErrorMsg(err.message || 'Não foi possível excluir o procedimento.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Procedimentos & Tabela de Preços</h1>
            <p className="text-slate-400 text-sm">Catálogo de tratamentos oferecidos pela sua clínica</p>
          </div>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Procedimento
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && !showModal && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando catálogo do banco...</div>
      ) : procedures.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
          Nenhum procedimento cadastrado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {procedures.map((proc) => (
            <div
              key={proc.id}
              className="bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-5 transition space-y-3"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-white text-base">{proc.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Ativo
                  </span>
                  <button
                    onClick={() => setDeleteTargetId(proc.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                    title="Excluir procedimento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700/40 flex justify-between items-center text-sm">
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>{proc.duration} min</span>
                </div>
                <div className="text-base font-bold text-emerald-400">
                  R$ {proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Novo Procedimento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Cadastrar Procedimento</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Tratamento / Procedimento *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Toxina Botulínica, Profilaxia..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Valor do Procedimento (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duração (Minutos)</label>
                  <input
                    type="number"
                    required
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
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
                  {saving ? 'Salvando...' : 'Salvar Procedimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Excluir Procedimento"
        message="Tem certeza que deseja excluir este procedimento do catálogo?"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
