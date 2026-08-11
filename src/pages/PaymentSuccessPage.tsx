import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Building2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface PaymentSuccessPageProps {
  onNavigate: (route: string) => void;
  user?: {
    id?: string;
    email: string;
    fullName?: string;
  } | null;
  onGrantAccess?: () => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  onNavigate,
  user,
  onGrantAccess,
}) => {
  const [checking, setChecking] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const verifyPaymentBackend = async () => {
    setChecking(true);
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('payment_id') || params.get('collection_id');
    if (pId) setPaymentId(pId);

    try {
      const response = await fetch('/.netlify/functions/check-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: pId,
          user_id: user?.id,
          email: user?.email,
        }),
      });

      const data = await response.json();

      if (data.approved || data.accessGranted) {
        setIsApproved(true);
        if (onGrantAccess) onGrantAccess();
      } else {
        setIsApproved(false);
      }
    } catch (err) {
      console.error('Error verifying payment on backend:', err);
      setIsApproved(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    verifyPaymentBackend();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          {checking ? (
            <div className="py-8 space-y-4">
              <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto" />
              <h2 className="text-lg font-bold text-white">
                Verificando confirmação do pagamento...
              </h2>
              <p className="text-xs text-slate-400">
                Aguarde enquanto o servidor valida a aprovação da transação no Mercado Pago.
              </p>
            </div>
          ) : isApproved ? (
            <>
              <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full tracking-wider">
                  ACESSO VITALÍCIO ATIVADO
                </span>
                <h1 className="text-2xl font-extrabold text-white">Pagamento Confirmado!</h1>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seu pagamento foi validado com sucesso pelo backend. Sua licença vitalícia do Clinora está 100% ativa.
                </p>
              </div>

              {paymentId && (
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                  ID do Pagamento: <strong className="text-slate-200">{paymentId}</strong>
                </div>
              )}

              <button
                onClick={() => onNavigate('/dashboard')}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-teal-500/25 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                id="enter-clinora-btn"
              >
                Entrar no Clinora
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full tracking-wider">
                  CONFIRMAÇÃO EM PROCESSAMENTO
                </span>
                <h1 className="text-xl font-bold text-white">Estamos confirmando seu pagamento</h1>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Seu pagamento foi recebido! O Mercado Pago está notificando o backend via Webhook. Assim que a notificação for concluída, seu acesso será liberado.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left text-xs space-y-1 text-slate-400">
                <p className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" /> Regra de Segurança Clinora
                </p>
                <p className="text-[11px]">
                  O acesso é liberado apenas via validação direta do backend do Mercado Pago para sua total segurança.
                </p>
              </div>

              <button
                onClick={verifyPaymentBackend}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                id="recheck-status-btn"
              >
                <RefreshCw className="w-4 h-4" />
                Verificar Status Novamente
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
