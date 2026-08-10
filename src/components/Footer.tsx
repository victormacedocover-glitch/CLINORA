import React from 'react';
import { Stethoscope, Shield, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">CLINORA</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A gestão da sua clínica, simples e organizada. Solução ideal para clínicas odontológicas, de estética e consultórios.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <Shield className="w-4 h-4" />
              Ambiente Seguro com Criptografia
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Navegação</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Início (Landing Page)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/cadastro')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Criar Conta
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/login')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Acessar Conta
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/assinatura')}
                  className="hover:text-teal-400 transition-colors"
                >
                  Plano Clinora Pro
                </button>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Recursos</h4>
            <ul className="space-y-2 text-xs">
              <li>Gestão de Pacientes</li>
              <li>Agenda Inteligente</li>
              <li>Orçamentos Rápidos</li>
              <li>Controle Financeiro</li>
              <li>Funil de Oportunidades</li>
              <li>Relatórios Descomplicados</li>
            </ul>
          </div>

          {/* Contact / Plan */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Plano & Assinatura</h4>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
              <span className="inline-block px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 font-semibold uppercase text-[10px]">
                Plano Único
              </span>
              <p className="font-bold text-white text-base">Clinora Pro</p>
              <p className="text-slate-300 font-semibold">R$ 149,90 / mês</p>
              <p className="text-[11px] text-slate-400">
                Sem fidelidade, sem taxa de setup. Cancele quando quiser.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Clinora SaaS. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido com <Heart className="w-3.5 h-3.5 text-teal-500 fill-teal-500" /> para profissionais da saúde e estética.
          </p>
        </div>
      </div>
    </footer>
  );
};
