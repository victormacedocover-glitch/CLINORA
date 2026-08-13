import React, { useState, useEffect } from 'react';
import { Patient, Appointment, Budget, Transaction, Opportunity, supabaseServices } from '../lib/supabaseServices';
import { normalizePhoneBR, isValidPhoneBR, openWhatsApp } from '../lib/whatsapp';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Copy,
  MessageSquare,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  UserCheck,
  Edit2
} from 'lucide-react';

interface PatientDetailModalProps {
  patient: Patient;
  clinicName?: string;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  clinicName = 'Nossa Clínica',
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'budgets' | 'financial' | 'opportunities'>('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // AI Followup State
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    loadPatientHistory();
  }, [patient.id]);

  const loadPatientHistory = async () => {
    setLoadingData(true);
    try {
      const [allAppts, allBudgets, allTrans, allOpps] = await Promise.all([
        supabaseServices.getAppointments(),
        supabaseServices.getBudgets(),
        supabaseServices.getTransactions(),
        supabaseServices.getOpportunities(),
      ]);

      // Filter by patient ID or patient Name
      const pNameLower = patient.name.toLowerCase();
      
      const pAppts = allAppts.filter(
        (a) => a.patientId === patient.id || (a.patientName && a.patientName.toLowerCase() === pNameLower)
      );
      const pBudgets = allBudgets.filter(
        (b) => b.patientId === patient.id || (b.patientName && b.patientName.toLowerCase() === pNameLower)
      );
      const pTrans = allTrans.filter(
        (t) => t.description.toLowerCase().includes(pNameLower)
      );
      const pOpps = allOpps.filter(
        (o) => o.patientName && o.patientName.toLowerCase() === pNameLower
      );

      setAppointments(pAppts);
      setBudgets(pBudgets);
      setTransactions(pTrans);
      setOpportunities(pOpps);
    } catch (err) {
      console.error('Error loading patient history:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleGenerateAiFollowup = async () => {
    setGeneratingAi(true);
    setAiError('');
    setCopySuccess(false);

    try {
      const pendingBudgets = budgets.filter((b) => b.status === 'enviado' || b.status === 'rascunho');
      const lastAppt = appointments[0];

      let detailsContext = patient.notes || '';
      if (pendingBudgets.length > 0) {
        detailsContext += ` Possui orçamento pendente de R$ ${pendingBudgets[0].amount} (${pendingBudgets[0].description}).`;
      } else if (lastAppt) {
        detailsContext += ` Última consulta realizada em ${new Date(lastAppt.date).toLocaleDateString('pt-BR')} sobre ${lastAppt.procedure}.`;
      } else {
        detailsContext += ' Retorno de acompanhamento preventivo da saúde bucal / estética.';
      }

      const res = await fetch('/api/ai/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patient.name,
          contextType: pendingBudgets.length > 0 ? 'Follow-up de Orçamento Pendente' : 'Retorno e Acompanhamento Clínico',
          details: detailsContext,
          clinicName: clinicName,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setAiMessage(data.message);
      } else {
        setAiError(data.error || 'Não foi possível gerar a mensagem com IA no momento.');
      }
    } catch (err: any) {
      console.error('Error requesting AI followup:', err);
      setAiError('Falha ao se conectar com a inteligência artificial.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCopyMessage = () => {
    if (!aiMessage) return;
    navigator.clipboard.writeText(aiMessage);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    if (!isValidPhoneBR(patient.phone)) {
      setAiError('Este paciente não possui um telefone cadastrado.');
      return;
    }
    const msg = aiMessage || `Olá, ${patient.name}! Passando para saber como você está e dar continuidade ao seu atendimento na ${clinicName}.`;
    const res = openWhatsApp(patient.phone, msg);
    if (!res.success) {
      setAiError(res.error || 'Não foi possível redirecionar para o WhatsApp.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-lg shadow-emerald-500/10">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{patient.name}</h2>
                <button
                  onClick={() => onEdit(patient)}
                  className="p-1 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition"
                  title="Editar cadastro"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-400">
                {patient.phone && (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Phone className="w-3.5 h-3.5" />
                    {patient.phone}
                  </span>
                )}
                {patient.email && (
                  <span className="flex items-center gap-1 text-blue-400">
                    <Mail className="w-3.5 h-3.5" />
                    {patient.email}
                  </span>
                )}
                {patient.birthDate && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Nascimento: {new Date(patient.birthDate).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Visão Geral & IA Follow-up
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'appointments'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Consultas ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'budgets'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Orçamentos ({budgets.length})
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'financial'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Financeiro ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'opportunities'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Oportunidades CRM ({opportunities.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loadingData ? (
            <div className="text-center py-12 text-slate-400 text-sm">Carregando histórico do paciente...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Prontuário / Observações */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Observações e Anamnese Clínica
                    </h3>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {patient.notes || 'Nenhuma observação cadastrada para este paciente.'}
                    </p>
                  </div>

                  {/* AI Followup Generator Card */}
                  <div className="bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Assistente de Follow-up com IA</h3>
                          <p className="text-xs text-slate-400">
                            Gera uma mensagem personalizada para WhatsApp analisando o histórico do paciente
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleGenerateAiFollowup}
                        disabled={generatingAi}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        {generatingAi ? 'Gerando Mensagem...' : '✨ Gerar Follow-up com IA'}
                      </button>
                    </div>

                    {aiError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{aiError}</span>
                      </div>
                    )}

                    {!isValidPhoneBR(patient.phone) && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Este paciente não possui um telefone cadastrado.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onEdit(patient)}
                          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/40 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar paciente
                        </button>
                      </div>
                    )}

                    {aiMessage && (
                      <div className="space-y-3 pt-2">
                        <label className="block text-xs font-semibold text-teal-300">
                          Prévia da mensagem pronta para envio:
                        </label>
                        <textarea
                          rows={4}
                          value={aiMessage}
                          onChange={(e) => setAiMessage(e.target.value)}
                          className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-teal-400 leading-relaxed"
                        />

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            onClick={handleOpenWhatsApp}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 fill-slate-950" />
                            Enviar pelo WhatsApp
                          </button>

                          <button
                            onClick={handleCopyMessage}
                            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
                          >
                            {copySuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copySuccess ? 'Copiado!' : 'Copiar Mensagem'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Total em Consultas</span>
                      <p className="text-xl font-bold text-white">{appointments.length}</p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Orçamentos Propostos</span>
                      <p className="text-xl font-bold text-emerald-400">
                        R$ {budgets.reduce((acc, b) => acc + b.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Histórico de Receitas</span>
                      <p className="text-xl font-bold text-teal-400">
                        R$ {transactions.filter((t) => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="space-y-3">
                  {appointments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Nenhuma consulta registrada para este paciente.</div>
                  ) : (
                    appointments.map((appt) => (
                      <div key={appt.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-sm">
                        <div className="space-y-1">
                          <p className="font-bold text-white">{appt.procedure}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> {new Date(appt.date).toLocaleDateString('pt-BR')}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> {appt.time}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          appt.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          appt.status === 'confirmado' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          appt.status === 'cancelado' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'budgets' && (
                <div className="space-y-3">
                  {budgets.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Nenhum orçamento encontrado para este paciente.</div>
                  ) : (
                    budgets.map((b) => (
                      <div key={b.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-sm">
                        <div className="space-y-1">
                          <p className="font-bold text-white">{b.description}</p>
                          <p className="text-xs text-slate-400">Emissão: {new Date(b.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400 text-base">R$ {b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <span className="text-xs text-slate-400 capitalize">{b.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'financial' && (
                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Nenhum registro financeiro vinculado.</div>
                  ) : (
                    transactions.map((t) => (
                      <div key={t.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-sm">
                        <div>
                          <p className="font-bold text-white">{t.description}</p>
                          <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <p className={`font-bold ${t.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.type === 'receita' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'opportunities' && (
                <div className="space-y-3">
                  {opportunities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Nenhuma oportunidade registrada no CRM.</div>
                  ) : (
                    opportunities.map((o) => (
                      <div key={o.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-sm">
                        <div>
                          <p className="font-bold text-white">{o.title}</p>
                          <p className="text-xs text-slate-400">Estágio: {o.status.replace('_', ' ')}</p>
                        </div>
                        <p className="font-bold text-emerald-400">R$ {o.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
