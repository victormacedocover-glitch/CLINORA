import React from 'react';
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
} from 'lucide-react';

interface DashboardPreviewProps {
  clinicName?: string;
  onNavigate: (route: string) => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  clinicName = 'Sua Clínica',
  onNavigate,
}) => {
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
            Visão geral e rápida dos principais indicadores do seu consultório.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/pacientes')}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            Novo Paciente
          </button>
          <button
            onClick={() => onNavigate('/agenda')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
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
            <p className="text-3xl font-extrabold text-white">248</p>
            <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +14 este mês
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('/agenda')}
          className="bg-slate-950 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-teal-500/40 transition-colors space-y-3"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Consultas de Hoje</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">8</p>
            <p className="text-[11px] text-slate-400 mt-1">6 confirmadas | 2 pendentes</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('/orcamentos')}
          className="bg-slate-950 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-teal-500/40 transition-colors space-y-3"
        >
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Orçamentos Aprovados</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">R$ 18.250</p>
            <p className="text-[11px] text-teal-400 mt-1">75% taxa de aprovação</p>
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
            <p className="text-3xl font-extrabold text-white">R$ 24.180</p>
            <p className="text-[11px] text-teal-400 mt-1">Receitas em dia</p>
          </div>
        </div>
      </div>

      {/* Quick Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Preview */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
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
            {[
              { name: 'Mariana Costa', time: '14:00', procedure: 'Limpeza e Profilaxia', status: 'Confirmada' },
              { name: 'Lucas Gabriel', time: '15:30', procedure: 'Avaliação Estética', status: 'Aguardando' },
              { name: 'Carla Souza', time: '16:45', procedure: 'Aplicação de Toxina', status: 'Confirmada' },
            ].map((app, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-white">{app.name}</p>
                  <p className="text-slate-400 text-[11px]">{app.procedure}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="font-mono text-teal-400 font-bold block">{app.time}</span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities / Pending Tasks */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
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
            {[
              { title: 'Harmonização Facial', value: 'R$ 4.500', stage: 'Orçamento Enviado' },
              { title: 'Tratamento Ortodôntico', value: 'R$ 6.200', stage: 'Negociação' },
              { title: 'Lentes de Contato Dental', value: 'R$ 12.000', stage: 'Novo Lead' },
            ].map((op, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white">{op.title}</p>
                  <p className="text-teal-400 font-semibold text-[11px]">{op.value}</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-teal-500/10 text-teal-300 text-[11px] font-medium border border-teal-500/20">
                  {op.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
