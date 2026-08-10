import React, { useState, useEffect } from 'react';
import { supabaseServices, Opportunity } from '../lib/supabaseServices';
import { TrendingUp, Plus, User, DollarSign, ChevronRight } from 'lucide-react';

export function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [patientName, setPatientName] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState(5000);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await supabaseServices.getOpportunities();
    setOpportunities(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !patientName) return;

    setSaving(true);
    await supabaseServices.createOpportunity({
      clinicId: 'c1',
      patientName,
      title,
      status: 'novo_lead',
      value: Number(value),
    });

    setSaving(false);
    setShowModal(false);
    setPatientName('');
    setTitle('');
    setValue(5000);
    loadData();
  };

  const STAGES = [
    { id: 'novo_lead', label: 'Novo Lead', color: 'border-blue-500/40 text-blue-400' },
    { id: 'contato', label: 'Contato Iniciado', color: 'border-purple-500/40 text-purple-400' },
    { id: 'orcamento', label: 'Orçamento Enviado', color: 'border-amber-500/40 text-amber-400' },
    { id: 'convertido', label: 'Tratamento Aprovado', color: 'border-emerald-500/40 text-emerald-400' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">CRM & Oportunidades</h1>
            <p className="text-slate-400 text-sm">Funil de atração e conversão de novos pacientes</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Oportunidade
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando funil de vendas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((stage) => {
            const stageOps = opportunities.filter((op) => op.status === stage.id);
            const totalStageValue = stageOps.reduce((acc, op) => acc + op.value, 0);

            return (
              <div key={stage.id} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-700/60">
                  <h3 className={`font-semibold text-xs uppercase tracking-wider ${stage.color}`}>{stage.label}</h3>
                  <span className="text-xs bg-slate-700/60 px-2 py-0.5 rounded-full text-slate-300">
                    {stageOps.length}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  Total: <strong className="text-emerald-400">R$ {totalStageValue.toLocaleString('pt-BR')}</strong>
                </div>

                <div className="space-y-3 pt-1">
                  {stageOps.map((op) => (
                    <div
                      key={op.id}
                      className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-3.5 space-y-2 shadow-sm transition"
                    >
                      <h4 className="font-semibold text-white text-sm">{op.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{op.patientName}</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-400 pt-1 border-t border-slate-700/40">
                        R$ {op.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                  {stageOps.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs italic border border-dashed border-slate-700/40 rounded-xl">
                      Nenhum paciente neste estágio
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal - Nova Oportunidade */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Nova Oportunidade no Funil</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Contato / Paciente *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Ex: Dra. Juliana Fernandes"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Título do Interesse *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Harmonização Facial / Lentes de Contato"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Valor Estimado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
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
                  {saving ? 'Registrando...' : 'Criar Oportunidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
