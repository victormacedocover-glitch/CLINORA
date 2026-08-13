import React, { useState } from 'react';
import { Patient, supabaseServices, formatClinicAddress } from '../lib/supabaseServices';
import { isValidPhoneBR, openWhatsApp } from '../lib/whatsapp';
import {
  X,
  Sparkles,
  DollarSign,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  MessageSquare,
  Edit2,
  Save,
  Check
} from 'lucide-react';

interface AiBudgetModalProps {
  patients: Patient[];
  clinicName?: string;
  onClose: () => void;
  onSaveBudget: (data: {
    patientId?: string;
    patientName: string;
    description: string;
    amount: number;
    status: 'enviado' | 'rascunho' | 'aprovado';
  }) => Promise<void>;
}

export const AiBudgetModal: React.FC<AiBudgetModalProps> = ({
  patients,
  clinicName = 'Nossa Clínica',
  onClose,
  onSaveBudget,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [procedure, setProcedure] = useState('');
  const [information, setInformation] = useState('');
  const [price, setPrice] = useState('2500');
  const [observations, setObservations] = useState('Validade de 15 dias. Parcelamento em até 10x.');

  const [loadingAi, setLoadingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedBudget, setGeneratedBudget] = useState<{
    title: string;
    description: string;
    benefits: string[];
    conditions: string;
    validity: string;
    whatsappMessage: string;
  } | null>(null);

  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [copied, setCopied] = useState(false);

  const getActivePatient = () => {
    if (selectedPatientId) {
      const p = patients.find((pat) => pat.id === selectedPatientId);
      if (p) return p;
    }
    if (patientName.trim()) {
      const nameLower = patientName.trim().toLowerCase();
      return patients.find((pat) => pat.name.trim().toLowerCase() === nameLower);
    }
    return null;
  };

  const handlePatientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPatientId(val);
    if (val) {
      const p = patients.find((pat) => pat.id === val);
      if (p) {
        setPatientName(p.name);
        setPatientPhone(p.phone || '');
      }
    }
  };

  const handleGenerateAiBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !procedure.trim() || !price) {
      setErrorMsg('Por favor, preencha o nome do paciente, procedimento e valor.');
      return;
    }

    setLoadingAi(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          procedure: procedure.trim(),
          information: information.trim(),
          price: price,
          observations: observations.trim(),
          clinicName: clinicName,
        }),
      });

      const data = await res.json();
      if (data.success && data.budgetData) {
        setGeneratedBudget(data.budgetData);
      } else {
        setErrorMsg(data.error || 'Não foi possível gerar o orçamento com IA.');
      }
    } catch (err: any) {
      console.error('Error generating AI budget:', err);
      setErrorMsg('Erro de conexão ao gerar o orçamento.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!generatedBudget) return;
    setSavingToDb(true);
    try {
      const matched = getActivePatient();
      const cleanAmount = Number(price.replace(/[^0-9.]/g, '')) || 0;
      await onSaveBudget({
        patientId: matched?.id || selectedPatientId || undefined,
        patientName: patientName.trim(),
        description: `${generatedBudget.title} — ${procedure}`,
        amount: cleanAmount,
        status: 'enviado',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg('Erro ao salvar no banco de dados: ' + (err.message || ''));
    } finally {
      setSavingToDb(false);
    }
  };

  const handleCopyMessage = () => {
    if (!generatedBudget?.whatsappMessage) return;
    navigator.clipboard.writeText(generatedBudget.whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsApp = async () => {
    const matched = getActivePatient();
    const phone = matched?.phone || patientPhone;
    if (!isValidPhoneBR(phone)) {
      setErrorMsg('Este paciente não possui um telefone cadastrado.');
      return;
    }

    let finalMsg = generatedBudget?.whatsappMessage || '';
    try {
      const clinicDetails = await supabaseServices.getClinicDetails();
      const addressBlock = formatClinicAddress(clinicDetails, '📍 Onde estamos:');
      if (addressBlock && !finalMsg.includes('📍')) {
        finalMsg += `\n\n${addressBlock}`;
      }
    } catch (e) {
      console.warn('Error fetching clinic address for AI budget:', e);
    }

    const res = openWhatsApp(phone, finalMsg);
    if (!res.success) {
      setErrorMsg(res.error || 'Não foi possível redirecionar para o WhatsApp.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/15 text-teal-400 rounded-xl border border-teal-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">✨ Gerador de Orçamentos com IA</h2>
              <p className="text-xs text-slate-400">Crie propostas comerciais persuasivas e profissionais em segundos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!generatedBudget ? (
            <form onSubmit={handleGenerateAiBudget} className="space-y-4">
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Selecione o Paciente ou Digite o Nome *
                </label>
                {patients.length > 0 && (
                  <select
                    value={selectedPatientId}
                    onChange={handlePatientSelectChange}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-teal-500 mb-2"
                  >
                    <option value="">-- Selecionar paciente cadastrado --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.phone ? `(${p.phone})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome do paciente"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Patient Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Procedure & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Procedimento / Serviço *</label>
                  <input
                    type="text"
                    required
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    placeholder="Ex: Implante Dental + Prótese Protocolo"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor do Investimento (R$) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Information */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">O que o paciente precisa? (Detalhes do caso)</label>
                <textarea
                  rows={2}
                  value={information}
                  onChange={(e) => setInformation(e.target.value)}
                  placeholder="Ex: Reabilitação estética anterior e substituição de restauração fraturada"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Observations */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Condições & Validade</label>
                <input
                  type="text"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: Validade de 15 dias. Parcelamento em 10x sem juros"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loadingAi}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  {loadingAi ? 'Criando Proposta com Inteligência Artificial...' : 'Gerar Orçamento Inteligente com IA'}
                </button>
              </div>
            </form>
          ) : (
            /* Proposal Preview Card */
            <div className="space-y-5">
              <div className="bg-slate-950 border border-teal-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Proposta Comercial</span>
                    <h3 className="text-xl font-bold text-white mt-0.5">{generatedBudget.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Preparado para: <strong className="text-slate-200">{patientName}</strong> — {clinicName}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Investimento</span>
                    <span className="text-2xl font-extrabold text-emerald-400">R$ {Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição do Tratamento</h4>
                  {isEditingProposal ? (
                    <textarea
                      rows={3}
                      value={generatedBudget.description}
                      onChange={(e) => setGeneratedBudget({ ...generatedBudget, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs"
                    />
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed">{generatedBudget.description}</p>
                  )}
                </div>

                {/* Benefits */}
                {generatedBudget.benefits && generatedBudget.benefits.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diferenciais e Benefícios</h4>
                    <ul className="space-y-1.5">
                      {generatedBudget.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Conditions & Validity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Condições de Pagamento</span>
                    <p className="text-slate-300 font-medium">{generatedBudget.conditions}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Validade da Proposta</span>
                    <p className="text-amber-400 font-medium">{generatedBudget.validity}</p>
                  </div>
                </div>

                {/* WhatsApp Message Preview */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold text-xs block mb-1">Mensagem formatada para o WhatsApp:</span>
                  <textarea
                    rows={4}
                    value={generatedBudget.whatsappMessage}
                    onChange={(e) => setGeneratedBudget({ ...generatedBudget, whatsappMessage: e.target.value })}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedBudget(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  ← Refazer Orçamento
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar Texto'}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Enviar pelo WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToDatabase}
                    disabled={savingToDb}
                    className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-xl shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingToDb ? 'Salvando...' : 'Salvar no Banco'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
