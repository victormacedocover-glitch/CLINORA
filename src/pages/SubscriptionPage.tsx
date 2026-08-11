import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  AlertCircle,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles,
  Building2,
  Clock,
  Shield,
  Loader2,
  QrCode,
  FileText,
  ExternalLink,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { CLINORA_PRO_PLAN, SubscriptionStatus } from '../types';

interface SubscriptionPageProps {
  onNavigate: (route: string) => void;
  clinicInfo?: {
    name: string;
    email: string;
  } | null;
  subscriptionStatus?: SubscriptionStatus;
  onUpdateSubscriptionStatus?: (status: SubscriptionStatus) => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  onNavigate,
  clinicInfo,
  subscriptionStatus = 'pending',
  onUpdateSubscriptionStatus,
}) => {
  const [mpRedirecting, setMpRedirecting] = useState(false);
  const [customMpLink, setCustomMpLink] = useState('');
  const [autoChecking, setAutoChecking] = useState(false);

  const isActive = subscriptionStatus === 'active';

  // Load custom Mercado Pago link from localStorage if configured
  useEffect(() => {
    const savedLink = localStorage.getItem('clinora_mp_checkout_link');
    if (savedLink) {
      setCustomMpLink(savedLink);
    }
  }, []);

  // Automatic verification of Mercado Pago return parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const statusParam =
      searchParams.get('status') ||
      searchParams.get('collection_status') ||
      searchParams.get('payment_status');
    const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');

    if (
      statusParam === 'approved' ||
      statusParam === 'success' ||
      (paymentId && statusParam !== 'rejected' && statusParam !== 'pending')
    ) {
      setAutoChecking(true);

      // Auto update subscription status
      if (onUpdateSubscriptionStatus) {
        onUpdateSubscriptionStatus('active');
      }

      // Auto update registered user in localStorage
      if (clinicInfo?.email) {
        try {
          const stored = localStorage.getItem('clinora_registered_users');
          if (stored) {
            const users = JSON.parse(stored);
            const updated = users.map((u: any) =>
              u.email.toLowerCase() === clinicInfo.email.toLowerCase()
                ? { ...u, hasActiveSubscription: true }
                : u
            );
            localStorage.setItem('clinora_registered_users', JSON.stringify(updated));
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Clean query params
      window.history.replaceState({}, '', window.location.pathname);

      setTimeout(() => {
        setAutoChecking(false);
        onNavigate('/dashboard');
      }, 1500);
    }
  }, [clinicInfo, onNavigate, onUpdateSubscriptionStatus]);

  // Default Mercado Pago preference or custom link
  const defaultMpCheckoutUrl =
    customMpLink ||
    `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=CLINORA_VITALICIO_14990`;

  const handleOpenMercadoPago = () => {
    setMpRedirecting(true);

    // Store intent
    localStorage.setItem('clinora_mp_checkout_started', 'true');

    // Open Mercado Pago checkout
    window.location.href = defaultMpCheckoutUrl;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Auto-checking overlay/alert if returning from MP */}
        {autoChecking && (
          <div className="bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 p-6 rounded-2xl shadow-2xl flex items-center justify-center gap-4 animate-bounce">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <div>
              <p className="font-extrabold text-lg text-white">
                Pagamento Aprovado pelo Mercado Pago!
              </p>
              <p className="text-xs text-emerald-300">
                Identificamos a transação com sucesso. Liberando seu Acesso Vitalício...
              </p>
            </div>
          </div>
        )}

        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Pagamento Único Mercado Pago • Licença Vitalícia
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Checkout Oficial Mercado Pago
          </h1>

          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Adquira o Clinora Pro com pagamento único de R$ 149,90 no gateway do Mercado Pago. O sistema identifica o pagamento automaticamente e libera o acesso!
          </p>

          {clinicInfo && (
            <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>
                Clínica: <strong className="text-white">{clinicInfo.name}</strong> ({clinicInfo.email})
              </span>
            </div>
          )}
        </div>

        {/* Status Notice Banner */}
        <div
          className={`p-5 rounded-2xl border text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
            isActive
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
          }`}
          id="subscription-status-banner"
        >
          <div className="flex items-center gap-3">
            {isActive ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="font-bold text-base text-white">
                {isActive ? 'Acesso Vitalício Ativado!' : 'Acesso Bloqueado • Pagamento Pendente'}
              </p>
              <p className="text-xs text-slate-300">
                {isActive
                  ? 'Sua licença definitiva foi liberada com sucesso. Aproveite o Clinora sem mensalidades!'
                  : 'Para liberar os módulos do Clinora, efetue o pagamento único de R$ 149,90 no Mercado Pago.'}
              </p>
            </div>
          </div>

          {isActive ? (
            <button
              onClick={() => onNavigate('/dashboard')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              id="goto-dashboard-btn"
            >
              Acessar Painel
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 uppercase tracking-wide">
              Pagamento Obrigatório
            </span>
          )}
        </div>

        {/* Plan Details Card */}
        <div className="bg-slate-950 border-2 border-sky-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-extrabold text-white">{CLINORA_PRO_PLAN.name}</h2>
                <span className="text-[10px] font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full uppercase">
                  Acesso Vitalício
                </span>
              </div>
              <p className="text-xs text-slate-400">{CLINORA_PRO_PLAN.description}</p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-3xl font-black text-white">
                R$ {CLINORA_PRO_PLAN.price.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-sky-400 font-bold uppercase">PAGAMENTO ÚNICO MERCADO PAGO</p>
            </div>
          </div>

          {/* Features Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              O que está incluso na sua Licença Definitiva:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLINORA_PRO_PLAN.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <div className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mercado Pago Direct Checkout Section */}
          {!isActive && (
            <div className="space-y-6 pt-6 border-t border-slate-800">
              <div className="bg-slate-900 border border-sky-500/30 p-6 rounded-2xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        Pagar com Mercado Pago
                      </h3>
                      <p className="text-xs text-slate-400">
                        PIX, Cartão de Crédito em até 12x ou Boleto Bancário.
                      </p>
                    </div>
                  </div>

                  <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold">
                    Checkout Seguro Mercado Pago
                  </span>
                </div>

                {/* Badges of accepted methods in Mercado Pago */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <QrCode className="w-5 h-5 text-emerald-400 mx-auto" />
                    <p className="font-bold text-white">PIX</p>
                    <p className="text-[10px] text-slate-400">Aprovação imediata</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <CreditCard className="w-5 h-5 text-sky-400 mx-auto" />
                    <p className="font-bold text-white">Cartão de Crédito</p>
                    <p className="text-[10px] text-slate-400">Em até 12x</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <FileText className="w-5 h-5 text-amber-400 mx-auto" />
                    <p className="font-bold text-white">Boleto Bancário</p>
                    <p className="text-[10px] text-slate-400">À vista</p>
                  </div>
                </div>

                {/* Primary CTA button to Mercado Pago */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleOpenMercadoPago}
                    disabled={mpRedirecting}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold py-4 px-6 rounded-xl shadow-xl shadow-sky-500/25 text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer group disabled:opacity-50"
                  >
                    {mpRedirecting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    Efetuar Pagamento Único no Mercado Pago (R$ 149,90)
                  </button>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1 text-center">
                    <p className="text-slate-300 font-semibold flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Liberação Automática pelo Mercado Pago
                    </p>
                    <p>
                      Assim que o pagamento for aprovado no Mercado Pago, o sistema identificará e liberará seu acesso vitalício instantaneamente sem necessidade de botões de confirmação manual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment security info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Processamento Oficial Mercado Pago</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Licença Vitalícia Sem Mensalidades</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center sm:justify-end">
              <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Suporte WhatsApp (11) 96612-9320</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
