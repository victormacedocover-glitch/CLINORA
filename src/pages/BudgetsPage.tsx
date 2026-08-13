import React, { useState, useEffect } from 'react';
import { supabaseServices, Budget, Patient, formatClinicAddress } from '../lib/supabaseServices';
import { isValidPhoneBR, openWhatsApp } from '../lib/whatsapp';
import { FileText, Plus, DollarSign, User, CheckCircle2, AlertCircle, Trash2, Sparkles, Search, Filter, Copy, Check, XCircle, MessageSquare } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { AiBudgetModal } from '../components/AiBudgetModal';

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(1500);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, pData] = await Promise.all([
        supabaseServices.getBudgets(),
        supabaseServices.getPatients(),
      ]);
      setBudgets(bData);
      setPatients(pData);
    } catch (err) {
      console.error('Error loading budgets data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPatientId(val);
    if (val) {
      const p = patients.find((pat) => pat.id === val);
      if (p) setPatientName(p.name);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = patientName.trim();
    if (!finalName || !description.trim()) return;

    setSaving(true);
    setErrorMsg('');

    try {
      const matched = selectedPatientId
        ? patients.find((p) => p.id === selectedPatientId)
        : patients.find((p) => p.name.trim().toLowerCase() === finalName.toLowerCase());

      await supabaseServices.createBudget({
        clinicId: '',
        patientId: matched?.id || selectedPatientId || undefined,
        patientName: finalName,
        description: description.trim(),
        amount: Number(amount),
        status: 'enviado',
      });

      setSuccessMsg('Orçamento gerado com sucesso.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
      setPatientName('');
      setSelectedPatientId('');
      setDescription('');
      setAmount(1500);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao criar orçamento:', err);
      setErrorMsg(err.message || 'Não foi possível gerar o orçamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, currentStatus: Budget['status']) => {
    const nextStatus = currentStatus === 'aprovado' ? 'enviado' : 'aprovado';
    try {
      await supabaseServices.updateBudgetStatus(id, nextStatus);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSendBudgetWhatsApp = async (b: Budget) => {
    setErrorMsg('');
    let matched = b.patientId ? patients.find((p) => p.id === b.patientId) : undefined;

    if (!matched && b.patientName) {
      const nameLower = b.patientName.trim().toLowerCase();
      matched = patients.find((p) => p.name.trim().toLowerCase() === nameLower);
    }

    const phone = matched?.phone;

    if (!isValidPhoneBR(phone)) {
      setErrorMsg(`Este paciente (${b.patientName}) não possui um telefone cadastrado.`);
      return;
    }

    const clinicDetails = await supabaseServices.getClinicDetails();
    const clinicName = clinicDetails.name || 'Clínica';
    const addressBlock = formatClinicAddress(clinicDetails, '📍 Onde estamos:');

    let msg = `Olá, ${b.patientName}! 😊\n\nPreparamos seu orçamento para o procedimento de ${b.description}.\n\nInvestimento: R$ ${b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    if (addressBlock) {
      msg += `\n\n${addressBlock}`;
    }

    msg += `\n\nSe tiver alguma dúvida, estou à disposição.\n\nPodemos agendar seu atendimento?\n\n${clinicName}`;

    openWhatsApp(phone, msg);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    setErrorMsg('');

    try {
      await supabaseServices.deleteBudget(deleteTargetId);
      setDeleteTargetId(null);
      setSuccessMsg('Orçamento excluído com sucesso.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir orçamento:', err);
      setErrorMsg(err.message || 'Não foi possível excluir o orçamento.');
    } finally {
      setDeleting(false);
    }
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setErrorMsg('');
              setShowAiModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer text-sm"
          >
            <Sparkles className="w-4 h-4" />
            ✨ Criar Orçamento com IA
          </button>
          <button
            onClick={() => {
              setErrorMsg('');
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por paciente ou descrição do orçamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 text-slate-100 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Todos os Status</option>
            <option value="enviado">Enviado / Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
            <option value="rascunho">Rascunho</option>
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && !showModal && !showAiModal && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando orçamentos do banco...</div>
      ) : (
        (() => {
          const filtered = budgets.filter((b) => {
            const matchesSearch =
              b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              b.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
            return matchesSearch && matchesStatus;
          });

          if (filtered.length === 0) {
            return (
              <div className="text-center py-12 text-slate-500 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
                Nenhum orçamento encontrado com esses critérios.
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {filtered.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
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
                        onClick={() => handleSendBudgetWhatsApp(b)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
                        title="Enviar orçamento pelo WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-slate-950" />
                        Enviar pelo WhatsApp
                      </button>

                      <button
                        onClick={() => handleStatusChange(b.id, b.status)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition cursor-pointer flex items-center gap-1 ${
                          b.status === 'aprovado'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : b.status === 'recusado'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                      >
                        {b.status === 'aprovado' && <Check className="w-3.5 h-3.5" />}
                        {b.status === 'recusado' && <XCircle className="w-3.5 h-3.5" />}
                        {b.status === 'aprovado' ? 'APROVADO' : b.status === 'recusado' ? 'RECUSADO' : 'PENDENTE / APROVAR'}
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
          );
        })()
      )}

      {/* Modal AI Budget */}
      {showAiModal && (
        <AiBudgetModal
          patients={patients}
          onClose={() => setShowAiModal(false)}
          onSaveBudget={async (data) => {
            await supabaseServices.createBudget({
              clinicId: '',
              patientId: data.patientId,
              patientName: data.patientName,
              description: data.description,
              amount: data.amount,
              status: data.status,
            });
            setSuccessMsg('Orçamento gerado pela IA salvo com sucesso.');
            setTimeout(() => setSuccessMsg(''), 4000);
            await loadData();
          }}
        />
      )}

      {/* Modal - Novo Orçamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Novo Orçamento</h2>
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Selecionar Paciente</label>
                <select
                  value={selectedPatientId}
                  onChange={handlePatientSelectChange}
                  className="w-full px-3.5 py-2 mb-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Selecione ou digite abaixo --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Paciente *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome do paciente"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Descrição dos Tratamentos *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Toxina botulínica + 2 Restaurações + Limpeza..."
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
        message="Tem certeza que deseja excluir este orçamento do banco de dados?"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
