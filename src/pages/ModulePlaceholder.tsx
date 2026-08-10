import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onNavigate: (route: string) => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  description,
  icon: Icon,
  onNavigate,
}) => {
  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{title}</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                Clinora Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/dashboard')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          Voltar ao Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4 my-8">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mx-auto flex items-center justify-center">
          <Icon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Módulo {title}</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          Este módulo está totalmente integrado ao layout protegido e à autenticação do Clinora Pro. Na próxima etapa (Etapa 2/3), a tabela do Supabase e o CRUD completo serão conectados diretamente.
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            Ver Dashboard Geral
          </button>
        </div>
      </div>
    </div>
  );
};
