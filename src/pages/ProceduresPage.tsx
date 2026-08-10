import React, { useState, useEffect } from 'react';
import { supabaseServices, ProcedureItem } from '../lib/supabaseServices';
import { Sliders, Plus, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

export function ProceduresPage() {
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState(250);
  const [duration, setDuration] = useState(45);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseServices.getProcedures();
    setProcedures(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    await supabaseServices.createProcedure({
      clinicId: 'c1',
      name,
      price: Number(price),
      duration: Number(duration),
      active: true,
    });

    setSaving(false);
    setShowModal(false);
    setName('');
    setPrice(250);
    setDuration(45);
    loadData();
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
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Procedimento
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando catálogo...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {procedures.map((proc) => (
            <div
              key={proc.id}
              className="bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-5 transition space-y-3"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-white text-base">{proc.name}</h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Ativo
                </span>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duração Média (Minutos)</label>
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
    </div>
  );
}
