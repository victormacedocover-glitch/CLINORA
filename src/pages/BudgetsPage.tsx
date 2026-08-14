import React, { useState, useEffect } from 'react';
import { supabaseServices, Budget, Patient, ProcedureItem, formatClinicAddress } from '../lib/supabaseServices';
import { isValidPhoneBR, openWhatsApp } from '../lib/whatsapp';
import { FileText, Plus, User, CheckCircle2, AlertCircle, Trash2, Search, Filter, Check, XCircle, MessageSquare } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface BudgetsPageProps {
  onNavigate?: (route: string) => void;
}

export function BudgetsPage({ onNavigate }: BudgetsPageProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
  const [selectedProcId, setSelectedProcId] = useState('');
  const [budgetItems, setBudgetItems] = useState<{ id: string; name: string; price: number }[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isManualAmount, setIsManualAmount] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, pData, procData] = await Promise.all([
        supabaseServices.getBudgets(),
        supabaseServices.getPatients(),
        supabaseServices.getProcedures(),
      ]);
      setBudgets(bData);
      setPatients(pData);
      setProcedures(procData);
      if (procData.length > 0) {
        setSelectedProcId(procData[0].id);
      }
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

  const handleAddProcedureItem = () => {
    if (!selectedProcId) return;
    const proc = procedures.find((p) => p.id === selectedProcId);
    if (!proc) return;

    const newItem = {
      id: `${proc.id}-${Date.now()}`,
      name: proc.name,
      price: proc.price || 0,
    };

    const updated = [...budgetItems, newItem];
    setBudgetItems(updated);

    // Auto-sum if user hasn't manually overridden the amount
    if (!isManualAmount) {
      const sum = updated.reduce((acc, item) => acc + item.price, 0);
      setTotalAmount(sum);
    }
  };

  const handleRemoveProcedureItem = (id: string) => {
    const updated = budgetItems.filter((i) => i.id !== id);
    setBudgetItems(updated);

    if (!isManualAmount) {
      const sum = updated.reduce((acc, item) => acc + item.price, 0);
      setTotalAmount(sum);
    }
  };

  const subtotal = budgetItems.reduce((acc, item) => acc + item.price, 0);
  const adjustment = totalAmount - subtotal;

  const openNewModal = () => {
    setErrorMsg('');
    setPatientName('');
    setSelectedPatientId('');
    setBudgetItems([]);
    setTotalAmount(0);
    setIsManualAmount(false);
    if (procedures.length > 0) {
      setSelectedProcId(procedures[0].id);
    }
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = patientName.trim();
    if (!finalName) {
      setErrorMsg('Por favor, informe o nome do paciente.');
      return;
    }

    if (budgetItems.length === 0) {
      setErrorMsg('Adicione pelo menos um procedimento ao orçamento.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const matched = selectedPatientId
        ? patients.find((p) => p.id === selectedPatientId)
        : patients.find((p) => p.name.trim().toLowerCase() === finalName.toLowerCase());

      const descriptionStr = budgetItems.map((i) => i.name).join(', ');

      await supabaseServices.createBudget({
        clinicId: '',
        patientId: matched?.id || selectedPatientId || undefined,
        patientName: finalName,
        description: descriptionStr,
        amount: Number(totalAmount),
        status: 'enviado',
      });

      setSuccessMsg('Orçamento gerado com sucesso.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
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
      setErrorMsg(`Este paciente (${b.patientName}) não possui um telefone válido cadastrado.`);
      return;
    }

    const clinicDetails = await supabaseServices.getClinicDetails();
    const clinicName = clinicDetails.name || 'Clínica';
    const addressBlock = formatClinicAddress(clinicDetails, 'Onde estamos:');

    let msg = `Olá, ${b.patientName}!\n\nPreparamos seu orçamento para os procedimentos:\n${b.description}\n\nValor total: R$ ${b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    if (addressBlock) {
      msg += `\n\n${addressBlock}`;
    }

    msg += `\n\nSe tiver alguma dúvida, estamos à disposição.\n\nPodemos agendar seu atendimento?\n\n${clinicName}`;

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
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer text-sm shadow-lg shadow-emerald-500/20"
            id="btn-novo-orcamento"
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
            placeholder="Buscar por paciente ou procedimento do orçamento..."
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

      {errorMsg && !showModal && (
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

      {/* Modal - Novo Orçamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Novo Orçamento</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Selecionar Paciente Cadastrado
                </label>
                <select
                  value={selectedPatientId}
                  onChange={handlePatientSelectChange}
                  className="w-full px-3.5 py-2 mb-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Selecione ou digite manualmente abaixo --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome do Paciente *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome do paciente"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Multi-Procedure Selection */}
              <div className="space-y-2 border-t border-slate-700/80 pt-3">
                <label className="block text-xs font-semibold text-slate-200">
                  Procedimentos do Orçamento *
                </label>

                {procedures.length === 0 ? (
                  <div className="bg-slate-900 border border-amber-500/30 p-3 rounded-xl space-y-2">
                    <p className="text-xs text-amber-300">
                      Você ainda não possui procedimentos cadastrados.
                    </p>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          onNavigate('/procedimentos');
                        }}
                        className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Cadastrar novo procedimento
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedProcId}
                      onChange={(e) => setSelectedProcId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {procedures.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — R$ {p.price.toFixed(2)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddProcedureItem}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </div>
                )}

                {/* Selected Procedures List */}
                {budgetItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {budgetItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="bg-slate-900 border border-slate-700/70 px-3 py-2 rounded-xl flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-200 font-medium truncate max-w-[220px]">
                            {index + 1}. {item.name}
                          </span>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-emerald-400 font-bold">
                              R$ {item.price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveProcedureItem(item.id)}
                              className="text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-xl space-y-1 text-xs mt-3">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal dos procedimentos:</span>
                        <span className="font-mono text-slate-200">
                          R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {adjustment !== 0 && (
                        <div className="flex justify-between text-slate-400">
                          <span>Ajuste / Desconto:</span>
                          <span className={`font-mono ${adjustment < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {adjustment < 0 ? '-' : '+'} R$ {Math.abs(adjustment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Total Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Valor Total Final (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={totalAmount}
                  onChange={(e) => {
                    setTotalAmount(Number(e.target.value));
                    setIsManualAmount(true);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  O valor final é editável e pode ser ajustado manualmente com descontos ou adicionais.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
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
