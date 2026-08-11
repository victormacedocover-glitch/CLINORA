import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckSquare,
} from 'lucide-react';
import {
  supabaseServices,
  Patient,
  Appointment,
  Budget,
  Transaction,
  Opportunity,
  Task,
} from '../lib/supabaseServices';

interface DashboardPreviewProps {
  clinicName?: string;
  onNavigate: (route: string) => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  clinicName = 'Sua Clínica',
  onNavigate,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const handleDataChanged = () => {
      loadDashboardData();
    };
    window.addEventListener('clinora_data_changed', handleDataChanged);
    return () => window.removeEventListener('clinora_data_changed', handleDataChanged);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [pats, apps, budgs, txs, opps, tsks] = await Promise.all([
        supabaseServices.getPatients(),
        supabaseServices.getAppointments(),
        supabaseServices.getBudgets(),
        supabaseServices.getTransactions(),
        supabaseServices.getOpportunities(),
        supabaseServices.getTasks(),
      ]);

      setPatients(pats);
      setAppointments(apps);
      setBudgets(budgs);
      setTransactions(txs);
      setOpportunities(opps);
      setTasks(tsks);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApps = appointments.filter((a) => a.date === todayStr || !a.date);
  const confirmedToday = todayApps.filter((a) => a.status === 'confirmado' || a.status === 'concluido').length;
  const pendingToday = todayApps.length - confirmedToday;

  const totalBudgetsValue = budgets.reduce((sum, b) => sum + b.amount, 0);

  const totalReceitas = transactions
    .filter((t) => t.type === 'receita')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = transactions
    .filter((t) => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoFinanceiro = totalReceitas - totalDespesas;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'concluida').length;

  return (
    <div className="p-6 sm:p-8 space-y-8 bg-slate-900 text-slate-100 min-h-screen">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Sparkles className="w-3 h-3" /> Assinatura Ativa
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Painel da Clínica: <span className="text-teal-400">{clinicName}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão geral e rápida dos principais indicadores em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/pacientes')}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Paciente
          </button>
          <button
            onClick={() => onNavigate('/agenda')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-teal-400" />
            Agendar Consulta
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('/pacientes')}
          className="bg-slate-950 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-teal-500/40 transition-colors space-y-3"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Pacientes Cadastrados</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">
              {loading ? '...' : patients.length}
            </p>
            <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Pacientes no sistema
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('/agenda')}
          className="bg-slate-950 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-teal-500/40 transition-colors space-y-3"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Consultas Agendadas</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">
              {loading ? '...' : appointments.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {confirmedToday} confirmadas | {pendingToday} pendentes
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('/orcamentos')}
          className="bg-slate-950 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-teal-500/40 transition-colors space-y-3"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Orçamentos Emitidos</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">
              {loading
                ? '...'
                : `R$ ${totalBudgetsValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}`}
            </p>
            <p className="text-[11px] text-teal-400 mt-1">
              {budgets.length} orçamentos ativos
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('/financeiro')}
          className="bg-slate-950 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-teal-500/40 transition-colors space-y-3"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Saldo Financeiro</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p
              className={`text-3xl font-extrabold ${
                saldoFinanceiro >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {loading
                ? '...'
                : `R$ ${saldoFinanceiro.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}`}
            </p>
            <p className="text-[11px] text-teal-400 mt-1">
              Receitas - Despesas operacionais
            </p>
          </div>
        </div>
      </div>

      {/* Quick Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Preview */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              Próximas Consultas
            </h3>
            <button
              onClick={() => onNavigate('/agenda')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Ver agenda <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                Carregando consultas...
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Nenhuma consulta cadastrada na agenda.</p>
            ) : (
              appointments.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">{app.patientName}</p>
                    <p className="text-slate-400 text-[11px]">{app.procedure}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="font-mono text-teal-400 font-bold block">{app.time}</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium capitalize">
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Opportunities / Leads */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Oportunidades & Leads
            </h3>
            <button
              onClick={() => onNavigate('/oportunidades')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Ver funil <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                Carregando oportunidades...
              </div>
            ) : opportunities.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Nenhuma oportunidade registrada no funil.</p>
            ) : (
              opportunities.slice(0, 4).map((op) => (
                <div
                  key={op.id}
                  className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{op.title}</p>
                    <p className="text-slate-400 text-[11px]">{op.patientName}</p>
                    <p className="text-teal-400 font-semibold text-[11px] mt-0.5">
                      R$ {op.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-300 text-[11px] font-medium border border-teal-500/20 capitalize">
                    {op.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-400" />
              Tarefas ({pendingTasksCount} pendentes)
            </h3>
            <button
              onClick={() => onNavigate('/tarefas')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                Carregando tarefas...
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Nenhuma tarefa pendente.</p>
            ) : (
              tasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{t.title}</p>
                    {t.dueDate && <p className="text-slate-400 text-[11px]">Vencimento: {t.dueDate}</p>}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                      t.status === 'concluida'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

