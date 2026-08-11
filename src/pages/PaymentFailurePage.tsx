import React from 'react';
import { XCircle, ArrowRight, RefreshCw, HelpCircle, ShieldAlert } from 'lucide-react';

interface PaymentFailurePageProps {
  onNavigate: (route: string) => void;
}

export const PaymentFailurePage: React.FC<PaymentFailurePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full tracking-wider">
              PAGAMENTO NÃO CONCLUÍDO
            </span>
            <h1 className="text-2xl font-extrabold text-white">Transação Recusada ou Cancelada</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Não conseguimos confirmar a conclusão do seu pagamento no Mercado Pago. Nenhuma cobrança indevida foi realizada.
            </p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2 text-slate-300">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Motivos mais comuns:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Dados do cartão preenchidos incorretamente.</li>
              <li>Limite do cartão insuficiente ou bloqueio preventivo do banco.</li>
              <li>Sessão de pagamento expirada no checkout.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('/checkout')}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-teal-500/25 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              id="failure-retry-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Pagamento Novamente (R$ 149,90)
            </button>

            <button
              onClick={() => onNavigate('/')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer border border-slate-800"
            >
              Voltar para a Página Inicial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
