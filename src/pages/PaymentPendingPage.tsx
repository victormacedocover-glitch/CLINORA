import React from 'react';
import { Clock, RefreshCw, ArrowRight, Building2, HelpCircle } from 'lucide-react';

interface PaymentPendingPageProps {
  onNavigate: (route: string) => void;
}

export const PaymentPendingPage: React.FC<PaymentPendingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full tracking-wider">
              PAGAMENTO PENDENTE (PIX / BOLETO)
            </span>
            <h1 className="text-2xl font-extrabold text-white">Aguardando Liquidação</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seu pedido de licença vitalícia foi registrado no Mercado Pago. Assim que a compensação bancária ou do Pix for concluída, o Webhook ativará seu acesso automaticamente.
            </p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2 text-slate-300">
            <p className="font-semibold text-white">Tempo estimado de compensação:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li><strong className="text-emerald-400">PIX:</strong> De alguns segundos a poucas horas.</li>
              <li><strong className="text-sky-400">Cartão de Crédito:</strong> Instantâneo após análise antifraude.</li>
              <li><strong className="text-amber-400">Boleto Bancário:</strong> 1 a 2 dias úteis.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('/payment/success')}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
              id="pending-check-status-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Verificar se o Pagamento foi Aprovado
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
