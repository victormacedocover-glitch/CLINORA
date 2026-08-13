import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const [pats, apps, budgs, txs, tsks] = await Promise.all([
          supabaseServices.getPatients(),
          supabaseServices.getAppointments(),
          supabaseServices.getBudgets(),
          supabaseServices.getTransactions(),
          supabaseServices.getTasks(),
        ]);

        if (isMounted) {
          setPatients(pats);
          setAppointments(apps);
          setBudgets(budgs);
          setTransactions(txs);
          setTasks(tsks);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted && isInitial) {
          setLoading(false);
        }
      }
    };

    loadDashboardData(true);

    const handleDataChanged = () => {
      loadDashboardData(false);
    };

    window.addEventListener('clinora_data_changed', handleDataChanged);
    return () => {
      isMounted = false;
      window.removeEventListener('clinora_data_changed', handleDataChanged);
    };
  }, []);

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
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 bg-slate-950 text-slate-100 w-full pb-12">
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

        {/* Recent Budgets */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              Últimos Orçamentos
            </h3>
            <button
              onClick={() => onNavigate('/orcamentos')}
              className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              Ver todos <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                Carregando orçamentos...
              </div>
            ) : budgets.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Nenhum orçamento emitido ainda.</p>
            ) : (
              budgets.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{b.patientName}</p>
                    <p className="text-slate-400 text-[11px] truncate max-w-[140px]">{b.description}</p>
                    <p className="text-teal-400 font-semibold text-[11px] mt-0.5">
                      R$ {b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold border capitalize ${
                      b.status === 'aprovado'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : b.status === 'rejeitado'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {b.status}
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

